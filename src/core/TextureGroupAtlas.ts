
import {Texture} from "./Texture";
import {PixiFlump} from "../PixiFlump";
import {IAtlas} from "../interface/ILibrary";
import {IHashMap} from "../interface/IHashMap";

export class TextureGroupAtlas
{
	public static load(flumpLibrary:PixiFlump, json:IAtlas):Promise<TextureGroupAtlas>
	{
		var file = json.file;
		var url = flumpLibrary.url + '/' + file;

		return new Promise(function(resolve, reject){
			var img = <HTMLImageElement> document.createElement('img');
			img.onload = () => {
				resolve(img);
			};

			img.onerror = () => {
				reject();
			};

			img.src = url;
		}).then((data:HTMLImageElement) => new TextureGroupAtlas(data, json) );
	}

	public renderTexture:HTMLImageElement;
	public flumpTextures:IHashMap<Texture> = {};

	constructor( renderTexture:HTMLImageElement, json:IAtlas)
	{
		this.renderTexture = renderTexture;

		var textures = json.textures;
		for(var i = 0; i < textures.length; i++)
		{
			var texture = textures[i];
			this.flumpTextures[texture.symbol] = new Texture(renderTexture, texture);
		}
	}
}

