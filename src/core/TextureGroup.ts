import {IHashMap} from "../interface/IHashMap";
import {TextureGroupAtlas} from "./TextureGroupAtlas";
import {IAtlas, ITextureGroup} from "../interface/ILibrary";
import {Texture} from "./Texture";
import {PixiFlump} from "../PixiFlump";
export class TextureGroup
{
	public static load(flumpLibrary:PixiFlump, json:ITextureGroup):Promise<TextureGroup>
	{
		var atlases = json.atlases;
		var loaders:Array<Promise<any>> = [];
		for(var i = 0; i < atlases.length; i++)
		{
			var atlas:IAtlas = atlases[i];
			loaders.push(TextureGroupAtlas.load(flumpLibrary, atlas));
		}

		return Promise.all(loaders).then((atlases:Array<TextureGroupAtlas>) =>
		{
			var flumpTextures:IHashMap<Texture> = {};

			for(var i = 0; i < atlases.length; i++)
			{
				var atlas = atlases[i];

				for(var name in atlas.flumpTextures)
				{
					if( atlas.flumpTextures.hasOwnProperty(name)){
						flumpTextures[name] = atlas.flumpTextures[name];
					}
				}
			}

			return new TextureGroup(atlases, flumpTextures);
		}).catch((err) => {
			console.warn('could not load textureGroup', err)
			throw new Error('could not load textureGroup');
		});
	}

	public textureGroupAtlases:Array<TextureGroupAtlas>;
	public textures:IHashMap<Texture>;

	constructor(flumpTextureGroupAtlases:Array<TextureGroupAtlas>, flumpTextures:IHashMap<Texture>)
	{
		this.textureGroupAtlases = flumpTextureGroupAtlases;
		this.textures = flumpTextures;
	}


}

