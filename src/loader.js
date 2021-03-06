import {GltfModel} from './gltf_model.js';


function loadGlb(resource) 
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
    resource.gltf = GltfModel.parseGltf(json, binBuffer);
}

export function omberGlbLoad(resource, next) 
{
    if (resource.data && resource.extension == 'glb')
    {
        loadGlb(resource);
    }
    next();
}


// New loaders will be configured to support loading .glb files.
PIXI.loaders.Resource.setExtensionXhrType('glb', PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER);
PIXI.loaders.Resource.setExtensionLoadType('glb', PIXI.loaders.Resource.LOAD_TYPE.XHR);
PIXI.loaders.Loader.addPixiMiddleware(() => omberGlbLoad);

// The premade shared PIXI loader has already been created though (only new loaders 
// will have .glb support added to it automatically), so .glb support needs to be 
// added to the shared PIXI loader separately.
PIXI.loader.use(omberGlbLoad);