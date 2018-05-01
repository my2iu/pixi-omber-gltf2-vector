import {Gltf} from './loader.js';

const VertexProgram = 
`attribute vec3 aVertexPosition;
attribute vec4 aColor;
varying lowp vec4 vColor;
uniform mat4 transformMatrix;
void main(void) {
    gl_Position = transformMatrix * vec4(aVertexPosition, 1.0);
    vColor = aColor;
}`;

const FragmentProgram = 
`varying lowp vec4 vColor;
void main(void) {
	gl_FragColor  = vColor;
}`;

class VectorMeshShader extends PIXI.Shader
{
	constructor(gl) 
    {
		super(gl, VertexProgram, FragmentProgram);
        this.transformMatrix = new PIXI.Matrix();
		this.transformMatrix4x4 = new Float32Array(16);
	}
}

class VectorMeshRenderer extends PIXI.ObjectRenderer
{
	constructor(renderer) 
    {
		super(renderer);
	}
	onContextChange() 
    {
		let gl = this.renderer.gl;
		this.shader = new VectorMeshShader(gl);
	}
	start()
	{
		super.start();
		this.renderer.state.push();
		this.renderer.state.setDepthTest(true);
        // Turn on blending with back-to-front rendering and without pre-multiplied alpha
        this.renderer.state.setBlend(true);
        this.renderer.state.setBlendMode(PIXI.BLEND_MODES.NORMAL_NPM);
	}
	stop()
	{
		super.stop();
		this.renderer.state.pop();
	}
	render(sprite) 
    {
		const gl = this.renderer.gl;
        const gltf = sprite.gltf;
        this.setupVaos(gl, gltf);
		this.renderer.bindShader(this.shader);
        this.renderVaos(gl, sprite, gltf);
	}
    setupVaos(gl, gltf) 
    {
        if (gltf.vaosSetup) return;
        const renderer = this.renderer;
        
        VectorMeshRenderer.walkScenePrimitives(gltf.json, (primitive) => {
            // Omber GLTF data uses vertex colors (with alpha) and positions
            // and triangle mode
            if (!('COLOR_0' in primitive.attributes)) return;
            if (!('POSITION' in primitive.attributes)) return;
            if (('mode' in primitive) && primitive.mode !== 4) return;
            const colorAccessor = gltf.json.accessors[primitive.attributes.COLOR_0];
            const positionAccessor = gltf.json.accessors[primitive.attributes.POSITION];
            if (colorAccessor.type != 'VEC4') return;
            if (colorAccessor.bufferView !== positionAccessor.bufferView) return;
            if (colorAccessor.count !== positionAccessor.count) return;
            if (positionAccessor.componentType !== 5126) return;
            if (colorAccessor.componentType !== 5126 && colorAccessor.componentType !== 5121) return;
            let indexAccessor = null;
            if ('indices' in primitive)
            {
                indexAccessor = gltf.json.accessors[primitive.indices];
                if (indexAccessor.componentType !== 5123) return;
            }
            
            // Set up array buffers
            const bufferView = gltf.json.bufferViews[colorAccessor.bufferView];
            let buffer = gltf.glbBuffer.buffer;
            // Only do glb right now
            if ('uri' in gltf.json.buffers[bufferView.buffer]) return;
            const arraybuffer = buffer.slice(gltf.glbBuffer.byteOffset + bufferView.byteOffset, gltf.glbBuffer.byteOffset + bufferView.byteOffset + bufferView.byteLength);
            const vertexBuffer = PIXI.glCore.GLBuffer.createVertexBuffer(gl, null, gl.STATIC_DRAW);
            vertexBuffer.upload(arraybuffer, 0, false);
            
            // Set up VAO
            const vao = renderer.createVao();
            vao.addAttribute(vertexBuffer, this.shader.attributes.aVertexPosition, gl.FLOAT, !!positionAccessor.normalized, bufferView.byteStride, positionAccessor.byteOffset);
            if (colorAccessor.componentType === 5126) 
            {
                vao.addAttribute(vertexBuffer, this.shader.attributes.aColor, gl.FLOAT, !!colorAccessor.normalized, bufferView.byteStride, colorAccessor.byteOffset);
            }
            else if (colorAccessor.componentType === 5121) 
            {
                vao.addAttribute(vertexBuffer, this.shader.attributes.aColor, gl.UNSIGNED_BYTE, !!colorAccessor.normalized, bufferView.byteStride, colorAccessor.byteOffset);
            }
            if (indexAccessor != null)
            {
                // TODO: unwind properly if error
                const idxBufferView = gltf.json.bufferViews[indexAccessor.bufferView];
                let buffer = gltf.glbBuffer.buffer;
                // Only do glb right now
                if ('uri' in gltf.json.buffers[idxBufferView.buffer]) return;
                const idxArrayBuffer = buffer.slice(gltf.glbBuffer.byteOffset + idxBufferView.byteOffset, gltf.glbBuffer.byteOffset + idxBufferView.byteOffset + idxBufferView.byteLength);
                const indicesBuffer = PIXI.glCore.GLBuffer.createIndexBuffer(gl, idxArrayBuffer, gl.STATIC_DRAW);
                vao.addIndex(indicesBuffer);
            }
            
            // Save the VAO
            primitive.vao = vao;
            if (indexAccessor != null)
                primitive.vaoCount = indexAccessor.count;
            else
                primitive.vaoCount = colorAccessor.count;
        });
        gltf.vaosSetup = true;
    }
    renderVaos(gl, sprite, gltf) 
    {
        VectorMeshRenderer.walkScenePrimitives(gltf.json, (primitive) => {
            if (!primitive.vao) return;
            // Multiply the MVP matrix in advance instead of in shader
            this.renderer._activeRenderTarget.projectionMatrix.copy(this.shader.transformMatrix).append(sprite.worldTransform);
			let matrix = this.shader.transformMatrix4x4;
			matrix[0] = this.shader.transformMatrix.a;
			matrix[1] = this.shader.transformMatrix.b;
			matrix[2] = 0;
			matrix[3] = 0;
			matrix[4] = this.shader.transformMatrix.c;
			matrix[5] = this.shader.transformMatrix.d;
			matrix[6] = 0;
			matrix[7] = 0;
			matrix[8] = 0;
			matrix[9] = 0;
			matrix[10] = -1;
			matrix[11] = 0;
			matrix[12] = this.shader.transformMatrix.tx;
			matrix[13] = this.shader.transformMatrix.ty;
			matrix[14] = 0;
			matrix[15] = 1;
            this.shader.uniforms.transformMatrix = matrix;
            this.renderer.bindVao(primitive.vao);
            primitive.vao.draw(this.renderer.gl.TRIANGLES, primitive.vaoCount, 0);
            
        });
    }
    
    
    static walkScenePrimitives(gltfJson, primitiveHandler) 
    {
        let sceneNum = 0;
        if ('scene' in gltfJson) sceneNum = gltfJson.scene;
        const scene = gltfJson.scenes[sceneNum];
        scene.nodes.forEach( node => this.walkNodesPrimitives(gltfJson, gltfJson.nodes[node], primitiveHandler));
    }
    static walkNodesPrimitives(gltfJson, node, primitiveHandler) 
    {
        if ('children' in node) 
        {
            node.children.forEach( node => this.walkNodesPrimitives(gltfJson, gltfJson.nodes[node], primitiveHandler));
        }
        // TODO: Handle transformation matrices
        if ('mesh' in node) 
        {
            this.walkMeshPrimitives(gltfJson.meshes[node.mesh], primitiveHandler);
        }
    }
    static walkMeshPrimitives(mesh, primitiveHandler) 
    {
        if ('primitives' in mesh) 
        {
            mesh.primitives.forEach( primitive => primitiveHandler(primitive) );
        }
    }

}
VectorMeshRenderer.prototype.shader = null;


export class VectorMesh extends PIXI.Sprite 
{
	constructor(gltf) 
    {
		super(null);
        if (!(gltf instanceof Gltf)) throw 'Expecting GLTF data loaded from Omber GLTF loader';
        this.gltf = gltf;
		this.pluginName = 'omber';
	}
}


// WebGL only
PIXI.WebGLRenderer.registerPlugin('omber', VectorMeshRenderer);

