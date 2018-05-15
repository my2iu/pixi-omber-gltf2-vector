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
                
            	done();
            });
	});
});