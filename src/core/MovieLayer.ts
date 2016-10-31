
import {IHashMap} from "../interface/IHashMap";
import {FlumpMtx} from "./FlumpMtx";
import {FlumpMovie} from "./FlumpMovie";
import {FlumpLibrary} from "../FlumpLibrary";
import {LayerData} from "../data/LayerData";
import {LabelData} from "../data/LabelData";
import {KeyframeData} from "../data/KeyframeData";
import * as PIXI from "pixi.js";

export class MovieLayer extends PIXI.Container
{
	public name:string = '';

	private _frame:number = 0;

	protected _index:number;
	protected _movie:FlumpMovie;
	protected _layerData:LayerData;
	protected _symbol:FlumpMovie|PIXI.Sprite;
	protected _symbols:IHashMap<FlumpMovie|PIXI.Sprite> = {};

	// disable layer from code
	public enabled:boolean = true;

	// public _storedMtx = new FlumpMtx(1, 0, 0, 1, 0, 0);

	constructor(index:number, movie:FlumpMovie, library:FlumpLibrary, layerData:LayerData)
	{
		super();

		var keyframeData = layerData.keyframeData;

		this._index = index;
		this._movie = movie;
		this._layerData = layerData;
		this.name = layerData.name;

		for(var i = 0; i < keyframeData.length; i++)
		{
			var keyframe = keyframeData[i];

			if(keyframe.label)
			{
				movie.setLabel(keyframe.label, new LabelData(keyframe.label, keyframe.index, keyframe.duration));
			}

			if(( ( <any> keyframe.ref) != -1 && ( <any> keyframe.ref) != null) && ( keyframe.ref in this._symbols ) == false)
			{
				this._symbols[keyframe.ref] = library.createSymbol(keyframe.ref, false);

			}
		}

		this.setFrame(0);
	}

	public getSymbol(name:string):FlumpMovie
	{
		var symbols = this._symbols;
		for(var val in symbols)
		{
			var symbol = symbols[val];

			if(symbol instanceof FlumpMovie)
			{
				if(symbol.name == name)
				{
					return symbol;
				}
				else
				{
					var data = symbol.getSymbol(name);

					if(data != null)
					{
						return data;
					}
				}
			}
		}

		return null;
	}

	public replaceSymbol(name:string, item:FlumpMovie|PIXI.Sprite):boolean
	{
		var symbols = this._symbols;
		for(var val in symbols)
		{
			var symbol = symbols[val];

			if(symbol.name == name)
			{
				this._symbols[val] = <FlumpMovie|PIXI.Sprite> item;
				return true;
			}
			else if(symbol instanceof FlumpMovie && symbol.replaceSymbol(name, item))
			{
				return true
			}
		}

		return false;
	}


	public onTick(delta:number, accumulated:number):void
	{
		if(this._symbol != null && (this._symbol instanceof FlumpMovie))
		{
			( <FlumpMovie> this._symbol ).onTick(delta, accumulated);
		}
	}

	public setFrame(frame:number):boolean
	{
		var keyframe:KeyframeData = this._layerData.getKeyframeForFrame(Math.floor(frame));

		if(( <any> keyframe.ref ) != -1 && ( <any> keyframe.ref ) != null)
		{
			if(this._symbol != this._symbols[keyframe.ref])
			{
				this.removeChildren();

				this._symbol = this._symbols[keyframe.ref];

				if(this._symbol instanceof FlumpMovie)
				{
					( <FlumpMovie> this._symbol).reset();
				}
				
				this.addChild(this._symbol);
			}

			this.setKeyframeData(this._symbol, keyframe, frame);
		}
		else
		{
			this.removeChildren();
			this._symbol = null;
		}

		return true;
	}

	public setKeyframeData(symbol:PIXI.DisplayObject, keyframe:KeyframeData, frame:number)
	{

		var sinX = 0.0;
		var cosX = 1.0;
		var sinY = 0.0;
		var cosY = 1.0;
		var x = keyframe.x;
		var y = keyframe.y;
		var scaleX = keyframe.scaleX;
		var scaleY = keyframe.scaleY;
		var skewX = keyframe.skewX;
		var skewY = keyframe.skewY;
		var pivotX = keyframe.pivotX;
		var pivotY = keyframe.pivotY;
		var alpha = keyframe.alpha;
		var ease:number;
		var interped:number;
		var nextKeyframe;

		if(keyframe.index < frame && keyframe.tweened)
		{
			nextKeyframe = this._layerData.getKeyframeAfter(keyframe);

			if(nextKeyframe instanceof KeyframeData)
			{
				interped = (frame - keyframe.index) / keyframe.duration;
				ease = keyframe.ease;

				if(ease != 0)
				{
					var t = 0.0;
					if(ease < 0)
					{
						var inv = 1 - interped;
						t = 1 - inv * inv;
						ease = 0 - ease;
					}
					else
					{
						t = interped * interped;
					}
					interped = ease * t + (1 - ease) * interped;
				}

				x = x + (nextKeyframe.x - x) * interped;
				y = y + (nextKeyframe.y - y) * interped;
				scaleX = scaleX + (nextKeyframe.scaleX - scaleX) * interped;
				scaleY = scaleY + (nextKeyframe.scaleY - scaleY) * interped;
				skewX = skewX + (nextKeyframe.skewX - skewX) * interped;
				skewY = skewY + (nextKeyframe.skewY - skewY) * interped;
				alpha = alpha + (nextKeyframe.alpha - alpha) * interped;
			}
		}

		//this.setTransform(x, y, scaleX, scaleY, 0, skewX, skewY, pivotX, pivotY)


		if(skewX != 0)
		{
			sinX = Math.sin(skewX);
			cosX = Math.cos(skewX);
		}

		if(skewY != 0)
		{
			sinY = Math.sin(skewY);
			cosY = Math.cos(skewY);
		}
		//
		// symbol.localTransform
		//
		// this.worldTransform.a = scaleX * cosY;
		// this.worldTransform.b = scaleX * sinY;
		// this.worldTransform.c = -scaleY * sinX;
		// this.worldTransform.d = scaleY * cosX;
		//
		// this.worldTransform.tx = x - (pivotX * this.worldTransform.a + pivotY * this.worldTransform.c);
		// this.worldTransform.ty = y - (pivotX * this.worldTransform.b + pivotY * this.worldTransform.d);

		this._symbol.position.set(x, y);
		this._symbol.scale.set(scaleX, scaleY);
		if(!(this._symbol instanceof PIXI.Sprite))
		{
			this._symbol['pivot'].x = pivotX;
			this._symbol['pivot'].y = pivotY;
		}
		this._symbol['skew'].set(skewX, skewY);

		// console.log(pivotX, pivotY);
		
		// console.log(this.worldTransform);

		//
		// this.setTransform(this._storedMtx.tx, this._storedMtx.ty, this._storedMtx.a, this._storedMtx.d, 0, this._storedMtx.b, this._storedMtx.c, 0, 0)
		// this.worldTransform.set( this._storedMtx.a, this._storedMtx, this._storedMtx, this._storedMtx.tx, this._storedMtx.ty);
		// this.setTransform(x, y, scaleX, scaleY, 0, skewX, skewY, 0, 0);
		// this.visible = keyframe.visible;
		// this.alpha = alpha;

		this.alpha = alpha;
		this.visible = keyframe.visible;

		this._frame = frame;
	}

	// updateTransform():void
	// {
	// 	// super.updateTransform();
	// }

	public reset():void
	{
		if(this._symbol instanceof FlumpMovie)
		{
			( <FlumpMovie> this._symbol).reset();
		}

		for(var name in this._symbols)
		{
			var symbol = <FlumpMovie> this._symbols[name];
			if(symbol instanceof FlumpMovie)
			{
				symbol.reset();
			}
		}
	}

	// public draw(ctx:CanvasRenderingContext2D, ignoreCache?:boolean):boolean
	// {
	// 	if(this._symbol != null && this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0)
	// 	{
	// 		this._symbol.draw(ctx);
	// 	}
	// 	return true;
	// }
}

