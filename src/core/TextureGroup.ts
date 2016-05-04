import {IHashMap} from "../interface/IHashMap";
import {TextureGroupAtlas} from "./TextureGroupAtlas";
import {IAtlas, ITextureGroup} from "../interface/ILibrary";
import {FlumpLibrary} from "../FlumpLibrary";
import Texture = PIXI.Texture;
import {Promise} from "../util/Promise";

export class TextureGroup
{
	public static load(library:FlumpLibrary, json:ITextureGroup):Promise<TextureGroup>
	{
		var atlases = json.atlases;
		var loaders:Array<Promise<any>> = [];
		
		for(var i = 0; i < atlases.length; i++)
		{
			var atlas:IAtlas = atlases[i];
			loaders.push(TextureGroupAtlas.load(library, atlas));
		}

		return Promise.all(loaders).then((atlases:Array<TextureGroupAtlas>) =>
		{
			var result:Array<PIXI.Sprite> = [];

			for(var i = 0; i < atlases.length; i++)
			{
				var atlas = atlases[i];

				// @todo check on duplicate names
				result = result.concat(atlas.getSprites())
			}

			return new TextureGroup(result);
		}).catch((err) => {
			console.warn('could not load textureGroup', err)
			throw new Error('could not load textureGroup');
		});
	}

	// public textureGroupAtlases:Array<TextureGroupAtlas>;
	// public textures:IHashMap<Texture>;
	public sprites:IHashMap<PIXI.Sprite> = {};

	constructor(sprites:Array<PIXI.Sprite>)
	{
		for(var i = 0; i < sprites.length; i++)
		{
			var sprite = sprites[i];
			this.sprites[sprite.name] = sprite;
		}
	}


}

