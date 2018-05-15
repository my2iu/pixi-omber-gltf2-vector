let PIXI = require('pixi.js');
PIXI.omber = require('../build/pixi-omber-gltf2-vector.js').PIXI.omber;
const assert = require('assert');

describe('pixi-omber-gltf2-vector', function() {
	it('basic rendering', function(done) {
		// Check if plugin loaded
		assert(PIXI.omber.VectorMesh);
		PIXI.utils.skipHello();
		let app = new PIXI.Application({width: 640, height: 480, antialias: false, autoStart: false});
		document.body.appendChild(app.view);
		
        // Start loading things
        PIXI.loader
            .add('../../../example/refresh.glb')
            .load(function(loader, resources) {
            	// Check if file loaded
            	assert(resources['../../../example/refresh.glb']);
            	
            	// Display a button
            	let button = new PIXI.omber.VectorMesh(resources['../../../example/refresh.glb'].gltf);
                button.x = 600;
                button.y = 40;
                button.scale.set(0.2, 0.2);
                app.stage.addChild(button);
            	
                // Render out the stage and make sure the button is in the right spot
                app.render();
                let pixels = app.renderer.plugins.extract.pixels();
                
                // Check the middle of the button at (600, 40)
                assert(Math.abs(pixels[(640*440 + 600) * 4] - 216) < 3);
                assert(Math.abs(pixels[(640*440 + 600) * 4 + 1] - 16) < 3);
                assert(Math.abs(pixels[(640*440 + 600) * 4 + 2] - 16) < 3);
                assert(Math.abs(pixels[(640*440 + 600) * 4 + 3] - 255) < 3);

                // Check the side of the button at (635, 40)
                assert.strictEqual(pixels[(640*440 + 635) * 4], 0);
                assert.strictEqual(pixels[(640*440 + 635) * 4 + 1], 0);
                assert.strictEqual(pixels[(640*440 + 635) * 4 + 2], 0);
                assert.strictEqual(pixels[(640*440 + 635) * 4 + 3], 255);

        		app.view.parentNode.removeChild(app.view);

            	done();
            });
	});
	
	it('new loaders can open gltf', function(done) {
		// Creates a new loader and checks if it can open a .glb file
		PIXI.utils.skipHello();
		let loader = new PIXI.loaders.Loader();
        loader
            .add('../../../example/refresh.glb')
            .load(function(loader, resources) {
            	assert(resources['../../../example/refresh.glb'].gltf);
            	done();
            });		
	});
	
	it('height and width', function(done) {
		// Load up some vector art and check its initial size
		PIXI.utils.skipHello();
		let loader = new PIXI.loaders.Loader();
        loader
            .add('../../../example/girl.glb')
            .load(function(loader, resources) {
            	let mesh = new PIXI.omber.VectorMesh(resources['../../../example/girl.glb'].gltf);
            	
            	assert(Math.abs(mesh.width - 765.7) < 0.1);
            	assert(Math.abs(mesh.height - 1742.6) < 0.1);
            	assert(Math.abs(mesh.scale.x - 1) < 0.01);
            	assert(Math.abs(mesh.scale.y - 1) < 0.01);

            	// Resize things by changing the width and height
            	mesh.width = 1000;
            	mesh.height = 100;
            	
            	assert(Math.abs(mesh.width - 1000) < 0.1);
            	assert(Math.abs(mesh.height - 100) < 0.1);
            	assert(Math.abs(mesh.scale.x - 1.306) < 0.01);
            	assert(Math.abs(mesh.scale.y - 0.057) < 0.01);
            	
            	done();
            });
	});
	
	it('containsPoint', function(done) {
		// Load up some vector art
		PIXI.utils.skipHello();
		let app = new PIXI.Application({width: 640, height: 480, antialias: false, autoStart: false});
		let loader = new PIXI.loaders.Loader();
        loader
            .add('../../../example/girl.glb')
            .load(function(loader, resources) {
            	// Scale it and place it somewhere
            	let mesh = new PIXI.omber.VectorMesh(resources['../../../example/girl.glb'].gltf);
            	mesh.x = 100;
            	mesh.y = 100;
            	mesh.interactive = true;
            	mesh.scale.set(0.1, 0.1);
            	app.stage.addChild(mesh);
            	app.render();
            	
            	// Mesh is in the range (-21, -60) to (55, 114) but placed at (100, 100)
            	assert(app.renderer.plugins.interaction.hitTest(new PIXI.Point(100, 100)));
            	assert(!app.renderer.plugins.interaction.hitTest(new PIXI.Point(70, 100)));
            	assert(!app.renderer.plugins.interaction.hitTest(new PIXI.Point(160, 100)));
            	assert(!app.renderer.plugins.interaction.hitTest(new PIXI.Point(100, 30)));
            	assert(!app.renderer.plugins.interaction.hitTest(new PIXI.Point(100, 250)));
            	assert(app.renderer.plugins.interaction.hitTest(new PIXI.Point(80, 50)));
            	
            	done();
            });
	});
	
});