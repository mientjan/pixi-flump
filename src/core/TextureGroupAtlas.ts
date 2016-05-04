import {FlumpLibrary} from "../FlumpLibrary";
import {IAtlas} from "../interface/ILibrary";
import {IHashMap} from "../interface/IHashMap";
import {Promise} from "../util/Promise";

import Texture = PIXI.Texture;
import BaseTexture = PIXI.BaseTexture;
import Rectangle = PIXI.Rectangle;
import Sprite = PIXI.Sprite;

export class TextureGroupAtlas
{
	public static load(library:FlumpLibrary, json:IAtlas):Promise<TextureGroupAtlas>
	{
		var file = json.file;
		var url = library.url + '/' + file;

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

	protected _renderTexture:BaseTexture;
	protected _atlas:IAtlas;

	constructor( renderTexture:HTMLImageElement, json:IAtlas)
	{
		this._renderTexture = new BaseTexture(renderTexture);
		this._atlas = json;
	}

	public getSprites():Array<PIXI.Sprite>
	{
		var result:Array<PIXI.Sprite> = [];
		var textures = this._atlas.textures;
		var baseTexture = this._renderTexture;

		for(var i = 0; i < textures.length; i++)
		{
			var texture = textures[i];
			var sprite = new PIXI.Sprite(new Texture(baseTexture, new Rectangle(texture.rect[0], texture.rect[1], texture.rect[2], texture.rect[3])));
			sprite.name = texture.symbol;
			result.push(sprite);
		}

		return result;
	}
}

