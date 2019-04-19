//
// Global variables
//
var scene, width, height, cameraOrtho, camera, activeCamera, renderer, orbit, activeIsOrtho;
var mouseIsPressed, mouseX, mouseY, pmouseX, pmouseY, node, mouse, f1, f2;

function init() {
	var container =
		document.getElementById('container');
	// Scene object
	scene = new THREE.Scene();
	// Will use the whole window for the webgl canvas
	width = window.innerWidth;
	height = window.innerHeight;

	// Orthogonal cameraOrtho for 2D drawing
	cameraOrtho = new THREE.OrthographicCamera( 0, width, 0, height, -height, height );
	cameraOrtho.lookAt (new THREE.Vector3 (0,0,0));

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, -1000);
	camera.position.set(window.innerWidth / 2, window.innerHeight / 2, 200)
	//inverted the axis so it matches the ortho camera orientation
	camera.position.z = -1000;
	camera.up.set( 0, -1, 0 ).normalize();
	camera.updateProjectionMatrix();

	//perspective is the active here to setup orbitcontrols correctly
	activeCamera = camera;
	activeIsOrtho = false;


	const light = new THREE.PointLight(0xFFFFFF);
  light.position.x = window.innerWidth / 2;
	light.position.y = window.innerHeight / 2;
	light.position.z = -5000;
	light.intensity = 0.2;

	scene.add(light);

	scene.add(camera);
	scene.add(cameraOrtho);

	// Renderer will use a canvas taking the whole window
	renderer = new THREE.WebGLRenderer( {antialias: true});
	renderer.sortObjects = false;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( width, height );

	// Append cameraOrtho to the page
	container.appendChild(renderer.domElement);

	// Set resize (reshape) callback
	window.addEventListener( 'resize', resize );

	// Set up mouse callbacks.
	// Call mousePressed, mouseDragged and mouseReleased functions if defined.
	// Arrange for global mouse variables to be set before calling user callbacks.
	mouseIsPressed = false;
	mouseX = 0;
	mouseY = 0;
	pmouseX = 0;
	pmouseY = 0;
	var setMouse = function () {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}


	//event to change the size of the node and the camera
	document.addEventListener("keydown", keyDown, false);
	function keyDown(event) {
		var keyCode = event.which;
		if (keyCode == 32) { //space bar
			if (activeCamera === cameraOrtho) {
				activeCamera = camera;
				orbit.enabled = true;
				activeIsOrtho = false;
			}
			else {
				activeCamera = cameraOrtho;
				activeIsOrtho = true;
				orbit.enabled = false;
			}
			node.draw();

		}else if (keyCode == 38){//arrow up
			if(intersects[0]!== undefined){
				node.intersect(intersects[0].object.geometry.uuid, false);

				node.draw();
			}
		}else if (keyCode == 40) {//arrow down
			if (intersects[0] !== undefined) {
				node.intersect(intersects[0].object.geometry.uuid, true);

				node.draw();
			}
		}
	}

	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	renderer.domElement.addEventListener('mousedown', function () {
			setMouse();
			pmouseX = mouseX;
			pmouseY = mouseY;
			mouseIsPressed = true;
			if(activeCamera === cameraOrtho) {
				if (typeof mousePressed !== 'undefined') mousePressed();
			}else node.mouseClick();
		});
	renderer.domElement.addEventListener('mousemove', function (event) {
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		setMouse();
		if (mouseIsPressed) {
			if(activeCamera === cameraOrtho)
			if (typeof mouseDragged !== 'undefined') mouseDragged();
		}
		if (typeof mouseMoved !== 'undefined') mouseMoved();
	});
	renderer.domElement.addEventListener('mouseup', function () {
		mouseIsPressed = false;
		if(activeCamera === cameraOrtho)
		if (typeof mouseReleased !== 'undefined') mouseReleased();
	});

	// If a setup function is defined, call it
	if (typeof setup !== 'undefined') setup();

	//orbit controls setup
	orbit = new THREE.OrbitControls(activeCamera, renderer.domElement);
	orbit.enableZoom = true;
	orbit.enableKeys = false;
	orbit.target.set(width / 2, height / 2, 0);
	orbit.update();
	orbit.enabled = false;


	//now cameraOrtho will work
	activeCamera = cameraOrtho;
	activeIsOrtho = true;
	// First render
	render();

}

//
// Reshape callback
//
function resize() {
	width = window.innerWidth;
	height = window.innerHeight;
	cameraOrtho.right = width;
	cameraOrtho.bottom = height;
	cameraOrtho.updateProjectionMatrix();
	renderer.setSize(width,height);
	render();
}

//
// The render callback
//
function render () {
	raycaster.setFromCamera(mouse, camera);
	intersects = raycaster.intersectObjects(scene.children);

	requestAnimationFrame( render );
	renderer.render( scene, activeCamera);
};

//------------------------------------------------------------
//
// User code from here on
//
//------------------------------------------------------------

var material; // A line material
var selected; // Object that was picked

function setup () {
	material = new THREE.LineBasicMaterial ( {color:0xffffff, depthWrite:false, linewidth : 4 } );

	var color = new THREE.Color( 0xffffff );
	color.setHex( Math.random() * 0xffffff );
	var bottom_left = new THREE.Vector2(0,0);
	var bottom_right = new THREE.Vector2(window.innerWidth,0);
	var upper_left = new THREE.Vector2(0,window.innerHeight);
	var upper_right = new THREE.Vector2(window.innerWidth,window.innerHeight);
	var points = [bottom_left, bottom_right, upper_left, upper_right]

	node = new Node(points, color, null, scene);
	node.root = node;
	node.draw();
	console.log('blah')

	initGui(node);
}

function mousePressed() {
	var point = new THREE.Vector3 (mouseX,mouseY,10);
	var geometry = new THREE.Geometry();
	geometry.vertices.push (point);
	var line = new THREE.Line (geometry, material);
	scene.add (line);
	selected = line;
}

function mouseDragged() {
	var line = selected;
	var point = new THREE.Vector3 (mouseX,mouseY,10);
	var oldgeometry = line.geometry;
	var newgeometry = new THREE.Geometry();
	newgeometry.vertices = [oldgeometry.vertices[0]];

	newgeometry.vertices.push (point);
	line.geometry = newgeometry;

}

function mouseReleased() {
	selected.geometry.dispose();
	selected.geometry = new THREE.Geometry();
	scene.remove(selected);
	if(mouseY !== pmouseY && mouseX !== pmouseX)
		node.mouseRelease();
	else
		node.mouseClick();

}

init();