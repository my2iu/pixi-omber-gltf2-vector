

export class Gltf 
{
    constructor(json, glbBuffer) 
    {
        this.json = json;
        this.glbBuffer = glbBuffer;
        // Calculate the min and max values of positions
        this.min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
        this.max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
        this.walkScenePrimitives((primitive) => {
            if (!('POSITION' in primitive.attributes)) return;
            const positionAccessor = this.json.accessors[primitive.attributes.POSITION];
            for (let n = 0; n < 3; n++)
        	{
                this.min[n] = Math.min(this.min[n], positionAccessor.min[n]);
                this.max[n] = Math.max(this.max[n], positionAccessor.max[n]);
        	}
        });
        // Try to find z-separation values so that we can easily order shapes
        let zSeparation = 0.0;
        if ('asset' in this.json && 'extras' in this.json.asset && typeof(this.json.asset.extras) == 'object')
    	{
        	if ('OMBER_zSeparation' in this.json.asset.extras)
        		this.zSeparation = this.json.asset.extras.OMBER_zSeparation; 
    	}
    }
    
    static loadGlb(resource) 
    {
		resource.omberMesh = true;
		let dataView = new DataView(resource.data);
		let magic = dataView.getUint32(0, true);
		if (magic != 0x46546C67) return;  // 'glTF'
		let version = dataView.getUint32(4, true);
		if (version != 2) return;
		let fileLength = dataView.getUint32(8, true);
		let json = null;
		let binBuffer = null;
		for (let offset = 12; offset < fileLength;) 
        {
			let chunkLength = dataView.getUint32(offset, true);
			let chunkType = dataView.getUint32(offset + 4, true);
			if (chunkType == 0x4E4F534A)   // 'JSON'
            {
                json = JSON.parse(new TextDecoder().decode(new Uint8Array(resource.data, offset + 8,  chunkLength)));
			} else if (chunkType == 0x004E4942)   // 'BIN'
            {
				binBuffer = new DataView(resource.data, offset + 8,  chunkLength);
			}
			offset = offset + 8 + chunkLength;
		}
        resource.gltf = this.parseGltf(json, binBuffer);
    }
    
    static parseGltf(json, buffer) 
    {
        let gltf = new Gltf(json, buffer);
        return gltf;
    }
    
    walkScenePrimitives(primitiveHandler) 
    {
    	let gltfJson = this.json;
        let sceneNum = 0;
        if ('scene' in gltfJson) sceneNum = gltfJson.scene;
        const scene = gltfJson.scenes[sceneNum];
        scene.nodes.forEach( node => Gltf.walkNodesPrimitives(gltfJson, gltfJson.nodes[node], primitiveHandler));
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


export function omberGlbLoad(resource, next) 
{
    if (resource.data && resource.extension == 'glb')
    {
        Gltf.loadGlb(resource);
    }
    next();
}



PIXI.loaders.Resource.setExtensionXhrType('glb', PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType('glb', PIXI.loaders.Resource.LOAD_TYPE.XHR);

