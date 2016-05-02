
import {Texture} from "./Texture";
import {PixiFlump} from "../PixiFlump";
import {IAtlas} from "../interface/ILibrary";
import {IHashMap} from "../interface/IHashMap";
import Texture = PIXI.Texture;
import BaseTexture = PIXI.BaseTexture;
import Rectangle = PIXI.Rectangle;

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

	public renderTexture:BaseTexture;
	public textures:IHashMap<Texture> = {};

	constructor( renderTexture:HTMLImageElement, json:IAtlas)
	{
		var baseTexture = this.renderTexture = new BaseTexture(renderTexture);

		var textures = json.textures;
		for(var i = 0; i < textures.length; i++)
		{
			var texture = textures[i];
			this.textures[texture.symbol] = new Texture(baseTexture, new Rectangle(texture.rect[0], texture.rect[1], texture.rect[2], texture.rect[3]));
		}
	}
}

