function updateGUI() {

	node.draw();

}

function initGui(object) {

	gui = new dat.GUI();

	f2 = gui.addFolder('Node Settings');
	f1 = gui.addFolder('Texture Settings');
	f2.add(object, 'amount').name('Height').onChange(updateGUI);
	f1.add( object, 'texture_file',  [ null, 'textures/colors.jpg', "textures/cubes.jpg", "textures/vik.png", "textures/purple.jpg"] ).onChange(function load(){
		object.loadTexture();
		gui.destroy();
		initGui(object);

	});
	if(object.texture != null) {
		f1.add(object.texture_settings, 'offsetX', 0.0, 1.0).name('offset.x').onChange(updateGUI);
		f1.add(object.texture_settings, 'offsetY', 0.0, 1.0).name('offset.y').onChange(updateGUI);
		f1.add(object.texture_settings, 'repeatX').name('repeat.x').onChange(updateGUI);
		f1.add(object.texture_settings, 'repeatY').name('repeat.y').onChange(updateGUI);
		f1.add(object.texture_settings, 'rotation', -2.0, 2.0).name('rotation').onChange(updateGUI);
		f1.add(object.texture_settings, 'centerX', 0.0, 1.0).name('center.x').onChange(updateGUI);
		f1.add(object.texture_settings, 'centerY', 0.0, 1.0).name('center.y').onChange(updateGUI);
	}

}