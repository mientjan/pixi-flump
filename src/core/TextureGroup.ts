import {IHashMap} from "../interface/IHashMap";
import {TextureGroupAtlas} from "./TextureGroupAtlas";
import {IAtlas, ITextureGroup} from "../interface/ILibrary";
import {FlumpLibrary} from "../FlumpLibrary";
import {Promise} from "../util/Promise";

import * as PIXI from "pixi.js";
import Texture = PIXI.Texture;
import Point = PIXI.Point;

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
			var names:Array<string> = [];
			var textures:Array<PIXI.Texture> = [];
			var ancors:Array<PIXI.Point> = [];

			for(var i = 0; i < atlases.length; i++)
			{
				var atlas = atlases[i];

				// @todo check on duplicate names
				names = names.concat(atlas.getNames())
				textures = textures.concat(atlas.getTextures())
				ancors = ancors.concat(atlas.getAnchors())

				atlas.destruct();
			}

			return new TextureGroup(names, textures, ancors);
		}).catch((err) => {
			console.warn('could not load textureGroup', err)
			throw new Error('could not load textureGroup');
		});
	}

	// public textureGroupAtlases:Array<TextureGroupAtlas>;
	// public textures:IHashMap<Texture>;
	protected _names:Array<string> = [];
	protected _textures:Array<PIXI.Texture> = [];
	protected _ancors:Array<Point> = [];

	constructor(names:Array<string>, textures:Array<PIXI.Texture>, ancors:Array<Point>)
	{
		this._names = names;
		this._textures = textures;
		this._ancors = ancors;
	}

	public hasSprite(name:string):boolean
	{
		return this._names.indexOf(name) > -1;
	}

	public createSprite(name:string):PIXI.Sprite
	{
		var index = this._names.indexOf(name);

		var sprite = new PIXI.Sprite(this._textures[index]);
		sprite.anchor.set(this._ancors[index].x, this._ancors[index].y);
		sprite.name = name;

		return sprite;
	}
}

