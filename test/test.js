let PIXI = require('pixi.js');
PIXI.omber = require('../build/pixi-omber-gltf2-vector.js').PIXI.omber;
const assert = require('assert');

describe('pixi-omber-gltf2-vector', function() {
	it('init', function() {
		assert(PIXI.omber.VectorMesh);
	});
});