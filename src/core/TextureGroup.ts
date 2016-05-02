import {ILoadable} from '../../../core/interface/ILoadable';
import {FlumpLibrary} from '../FlumpLibrary';
import {IHashMap} from '../../../core/interface/IHashMap';
import {FlumpTextureGroupAtlas} from './FlumpTextureGroupAtlas';
import {FlumpTexture} from './FlumpTexture';
import {HttpRequest} from '../../../core/net/HttpRequest';
import {Promise} from '../../../core/util/Promise';
import {ITextureGroup, IAtlas} from "./IFlumpLibrary";

export class FlumpTextureGroup
{
	public static load(flumpLibrary:FlumpLibrary, json:ITextureGroup):Promise<FlumpTextureGroup>
	{
		var atlases = json.atlases;
		var loaders:Array<Promise<any>> = [];
		for(var i = 0; i < atlases.length; i++)
		{
			var atlas:IAtlas = atlases[i];
			loaders.push(FlumpTextureGroupAtlas.load(flumpLibrary, atlas));
		}

		return Promise.all(loaders).then((atlases:Array<FlumpTextureGroupAtlas>) =>
		{
			var flumpTextures:IHashMap<FlumpTexture> = {};

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

			return new FlumpTextureGroup(atlases, flumpTextures);
		}).catch((err) => {
			console.warn('could not load textureGroup', err)
			throw new Error('could not load textureGroup');
		});
	}

	public flumpTextureGroupAtlases:Array<FlumpTextureGroupAtlas>;
	public flumpTextures:IHashMap<FlumpTexture>;

	constructor(flumpTextureGroupAtlases:Array<FlumpTextureGroupAtlas>, flumpTextures:IHashMap<FlumpTexture>)
	{
		this.flumpTextureGroupAtlases = flumpTextureGroupAtlases;
		this.flumpTextures = flumpTextures;
	}


}

