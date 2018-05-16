/**
 * Class for holding a Gltf model
 */

export class GltfModel
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
    
    static parseGltf(json, buffer) 
    {
        let gltf = new GltfModel(json, buffer);
        return gltf;
    }
    
    walkScenePrimitives(primitiveHandler) 
    {
    	let gltfJson = this.json;
        let sceneNum = 0;
        if ('scene' in gltfJson) sceneNum = gltfJson.scene;
        const scene = gltfJson.scenes[sceneNum];
        scene.nodes.forEach( node => GltfModel.walkNodesPrimitives(gltfJson, gltfJson.nodes[node], primitiveHandler));
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
