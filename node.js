class Node {

	constructor(vertex , color, parent = null, scene, amount = -10){
		//variables for drawing the tree
		this.vertex = vertex.slice();
		this.color = color;
		this.parent = parent;
		this.children = [];
		this.origin_line = [];
		this.root = [];
		this.amount = amount;
		this.scene = scene;
		this.texture_file = null;
		this.texture_settings = {
			offsetX: 0,
			offsetY: 0,
			repeatX: 0.0005,
			repeatY: 0.0005,
			rotation: Math.PI,
			centerX: 0.5,
			centerY: 0.5
		};
	}

	loadTexture(){
		if(this.texture_file != null) {
			this.texture = new THREE.TextureLoader().load(this.texture_file);
			this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;
			this.root.draw();
			render();
		}
	}
	//draws the node
	draw(){
		arrange(this.vertex);
		if(this.children.length == 0){
			let poly = new THREE.Shape();
			poly.moveTo(this.vertex[0].x, this.vertex[0].y)
			for(var i = 1; i < this.vertex.length; i++){
				poly.lineTo(this.vertex[i].x, this.vertex[i].y)
			}

			if(this.texture_file == null) {
				var material =
					new THREE.MeshPhongMaterial({
						color: this.color,
						emissive: this.color,
						side: THREE.DoubleSide,
						flatShading: true
					});
			}else {
				this.texture.offset.set(this.texture_settings.offsetX, this.texture_settings.offsetY);
				this.texture.repeat.set(this.texture_settings.repeatX, this.texture_settings.repeatY);
				this.texture.center.set(this.texture_settings.centerX, this.texture_settings.centerY);
				this.texture.rotation = this.texture_settings.rotation;
				var material = new THREE.MeshBasicMaterial({map: this.texture, side: THREE.DoubleSide});

			}

			var extrudeSettings = {
				steps: 2,
				amount: this.amount,
				bevelEnabled: false,
			};

			//if the amount is not zero the mouse line wont appear
			if(activeIsOrtho)
				extrudeSettings.amount = 0;
			// else extrudeSettings.amount = this.amount;

			//need to remove the mesh from the scene before adding it to improve rendering
			var index = this.scene.children.indexOf(this.mesh);
			if (index > -1)
				this.scene.children.splice(index, 1);

			let geo = new THREE.ExtrudeGeometry( poly, extrudeSettings );
			this.mesh = new THREE.Mesh(geo, material);

			this.scene.add(this.mesh);

			return;
		}else {
			//improves rendering
			var index = this.scene.children.indexOf(this.mesh);
			if (index > -1) {
				this.scene.children.splice(index, 1);
			}
			this.children[0].draw();
			this.children[1].draw();
		}
	}

	//creates a child based on line created by the mouse
	createChildren(){
		var left = []; 
		var right = [];
		var intersection_points = [];
		var color = [];
		var origin = [];

			
			arrange(this.vertex);
			//gets points where polygon line intersects with mouse line
			for(var i = 0; i < this.vertex.length ; i ++){
				if(i == this.vertex.length - 1)
					var point = getIntersection(this.vertex[i], this.vertex[0]);				
				else
					var point = getIntersection(this.vertex[i], this.vertex[i+1]);
				if(point != null){
					intersection_points.push(point);	
				}
			}

			left = intersection_points.slice();
			right = intersection_points.slice();
			origin = intersection_points.slice();
			//separates in two nodes
			for(var i = 0; i < this.vertex.length; i ++){
				if(position(this.mouse_press, this.mouse_drag, this.vertex[i]) < 0)
					left.push(this.vertex[i]);

				else if(position(this.mouse_press, this.mouse_drag, this.vertex[i]) > 0)
					right.push(this.vertex[i]);

			}

			//sets child variables

		color = this.color;
			this.children.push(new Node(left, color, this, this.scene, this.amount));
			color = new THREE.Color(0xffffff);
			color.setHex(Math.random() * 0xffffff)
			this.children.push(new Node(right, color, this, this.scene));
			this.children[0].texture_file = this.texture_file;
			this.children[0].origin_line = origin.slice();
			this.children[1].origin_line = origin.slice();
			this.children[0].root = this.root;
			this.children[1].root = this.root;

			this.children[0].loadTexture();
			gui.destroy();
			initGui(this.children[0])

	}


	//checks if it intersects with ray
	intersect(uuid,plus){
		if(this.mesh.geometry.uuid === uuid) {
			if(plus)this.amount+=10;
			else this.amount-=10;
		}
		else if(this.children.length !== 0){
			this.children[0].intersect(uuid, plus);
			this.children[1].intersect(uuid, plus);
		}else return null;

	}

	mouseRelease(){
		//creates a child and updates tree
		this.mouse_press = new THREE.Vector2(pmouseX, pmouseY)
		this.mouse_drag = new THREE.Vector2(mouseX, mouseY)
		if(isInside(this.mouse_press, this.vertex) && this.children.length == 0 && isInside(this.mouse_drag, this.vertex)){
			this.createChildren();
			this.root.draw();

		}else if(isInside(this.mouse_press, this.vertex) && this.children.length == 0 && !isInside(this.mouse_drag, this.vertex)){
			//kills child and updates tree
			this.killChild();
			this.root.draw();

		}else if(isInside(this.mouse_press, this.vertex) && this.children.lenght != 0){
			this.children[0].mouseRelease();
			if(this.children.length)
				this.children[1].mouseRelease();
		
		}else return;	
	}

	mouseClick(){
		this.mouse_press = new THREE.Vector2(pmouseX, pmouseY)
		if(isInside(this.mouse_press, this.vertex) && this.children.length == 0){
			console.log(this.amount);

			gui.destroy();
			initGui(this);
		}else if(isInside(this.mouse_press, this.vertex) && this.children.length != 0){
			this.children[0].mouseClick();
			this.children[1].mouseClick();

		}else return;

	}

	getBrother(){
		if(this.parent != null){
			if(this.parent.children[0] == this)
				return this.parent.children[1];
			else return this.parent.children[0];	
		
		} else return null;

	}
//deletes a node in the tree
	killChild(){
		var brother = this.getBrother();
		//delete brothers tree's meshes, helps rendering
		if(brother.children.length !== 0)
			brother.eraseTree();

		if(this.parent != null){
			this.parent.color = [];
			this.parent.color = brother.color;
			this.parent.amount = brother.amount;

			//remove children from scene to optimize rendering
			var index = this.scene.children.indexOf(this.mesh);
			if (index > -1)
				this.scene.children.splice(index, 1);

			index = this.scene.children.indexOf(brother.mesh);
			if (index > -1)
				this.scene.children.splice(index, 1);

			this.parent.children = [];
			return;
		}else return null;
	}


	eraseTree(){
		var index = this.scene.children.indexOf(this.children[0].mesh);
		if (index > -1)
			this.scene.children.splice(index, 1);

		index = this.scene.children.indexOf(this.children[1].mesh);
		if (index > -1)
			this.scene.children.splice(index, 1);

		if(this.children[0].children.length !== 0)
			this.children[0].eraseTree();
		if(this.children[1].children.length !== 0)
			this.children[1].eraseTree();

	}
}

//gets the average of given points
function centroid(points){
	var center = new THREE.Vector2();
	for(var i = 0; i < points.length; i++){
		center.x += points[i].x;
		center.y += points[i].y;
	}
	center.x /= points.length;
	center.y /= points.length;
	return center;
}

//sorts given points in clockwise order
function arrange(points){
	var center = new THREE.Vector2();
	var dx, dy, alpha;
	var angles = []; 
	var list = [];

	center = centroid(points);
	//stores the angles between the center and the point
	for(var i = 0; i < points.length; i++){
		dx = points[i].x - center.x;
		dy = points[i].y - center.y;
		alpha = Math.atan2(dy, dx);
		alpha *= 180/Math.PI;
		angles[i] = alpha;	
	}

	// joins the two arrays
	for(j = 0; j < points.length; j++)
		list.push({'angle': angles[j], 'point': points[j]});	

	//sorts them in function of the angle
	list.sort(function(a, b) {
    	return (a.angle - b.angle);
	}); 

	//separates them
	for (var k = 0; k < list.length; k++) {
    	angles[k] = list[k].angle;
    	points[k] = list[k].point;
	}

}

function getIntersection( line_r, line_s){
	var onLine2;
    den = ((line_s.y - line_r.y) * (mouseX - pmouseX)) - ((line_s.x - line_r.x) * (mouseY - pmouseY));
    //parallel lines
    if (den == 0) {
        return null;
    }
    dy = pmouseY - line_r.y;
    dx = pmouseX - line_r.x;
    num1 = ((line_s.x - line_r.x) * dy) - ((line_s.y - line_r.y) * dx);
    num2 = ((mouseX - pmouseX) * dy) - ((mouseY - pmouseY) * dx);
    a = num1 / den;
    b = num2 / den;

    //intersection points
    x = pmouseX + (a * (mouseX - pmouseX));
    y = pmouseY + (a * (mouseY - pmouseY));
    
    //mouse line is a segment and polygon line is infinite
    if (a > 0 && a < 1) {
        onLine1 = true;
    }
    //polygon line is a segment and mouse line is infinite
    if (b > 0 && b < 1) {
        onLine2 = true;
    }
    //wanted case where intersection is on the polygon segment
    if(onLine2){
    	result = new THREE.Vector2( x, y);

			return result;
    }
}

//checks if point is inside all the polygon borders
// returns boolean
function isInside(point, polygon){
	var x = point.x, y = point.y;
	var inside = false;

	for(var i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
		var xi  = polygon[i].x, yi = polygon[i].y;
		var xj = polygon[j].x, yj = polygon[j].y;

		var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
	}

	return inside;
}

//returs -1, 0 or 1 depending of where the point is relative to the line
function position(line_r, line_s, point){
	return Math.sign((line_s.x - line_r.x)*(point.y - line_r.y) - (line_s.y - line_r.y)*(point.x - line_r.x));	
}


