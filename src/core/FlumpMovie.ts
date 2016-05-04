import {AnimationQueue} from "../util/AnimationQueue";
import {IHashMap} from "../interface/IHashMap";
import {FlumpLibrary} from "../FlumpLibrary";
import {QueueItem} from "../util/QueueItem";
import {MovieData} from "../data/MovieData";
import {IPlayable} from "../interface/IPlayable";
import {MovieLayer} from "../core/MovieLayer";
import {LabelData} from "../data/LabelData";

/**
 * @author Mient-jan Stelling
 */
export class FlumpMovie extends PIXI.Container implements IPlayable
{
	private _library:FlumpLibrary;
	private _movieData:MovieData;
	private _movieLayers:Array<MovieLayer>;

	private _labels:IHashMap<LabelData> = {};

	protected _queue:AnimationQueue = null;

	private hasFrameCallbacks:boolean = false;
	private _frameCallback:Array<(delta:number) => any>;

	public paused:boolean = true;

	public name:string;
	//public time:number = 0.0;
	//public duration = 0.0;
	public frame:number = 0;
	public frames:number = 0;
	public speed:number = 1;
	public fps:number = 1;

	// ToDo: add features like playOnce, playTo, goTo, loop, stop, isPlaying, label events, ...

	constructor( library:FlumpLibrary, name:string)
	{
		super();

		this.name = name;
		this._library = library;
		this._movieData = library.getMovieData(name);

		var layers = this._movieData.layerData;
		var length = layers.length;
		var movieLayers = new Array(length);

		for(var i = 0; i < length; i++)
		{
			var layerData = layers[i];
			movieLayers[i] = new MovieLayer(i, this, library, layerData);
		}

		this._movieLayers = movieLayers;
		this.frames = this._movieData.frames;
		this._frameCallback = new Array(this.frames);

		for(var i = 0; i < this.frames; i++)
		{
			this._frameCallback[i] = null;
		}

		this.fps = library.frameRate;
		this.getQueue();
	}

	// public getLibrary():FlumpLibrary
	// {
	// 	return this._library;
	// }

	public setLabel(name:string, data:LabelData):void
	{
		this._labels[name] = data;
	}

	public getQueue():AnimationQueue
	{
		if(!this._queue)
		{
			this._queue = new AnimationQueue(this.fps, 1000);
		}

		return this._queue;
	}

	public play(times:number = 1, label:string|Array<number> = null, complete?:() => any):FlumpMovie
	{
		this.visible = true;

		if(label instanceof Array)
		{
			if(label.length == 1)
			{
				var queue = new QueueItem(null, label[0], this.frames, times, 0);
			} else {
				var queue = new QueueItem(null, label[0], label[1], times, 0);
			}
		} else if( label == null || label == '*')
		{
			var queue = new QueueItem(null, 0, this.frames, times, 0);
		} else {
			var queueLabel = this._labels[<string> label];

			if(!queueLabel)
			{
				throw new Error('unknown label:' + queueLabel + ' | ' + this.name );
			}

			var queue = new QueueItem(queueLabel.label, queueLabel.index, queueLabel.duration, times, 0);
		}

		if(complete)
		{
			queue.then(complete);
		}

		this._queue.add(queue);

		if(complete)
		{
			queue.then(complete);
		}

		this.paused = false;

		return this;
	}


	public resume():FlumpMovie
	{
		this.paused = false;
		return this;
	}

	public pause():FlumpMovie
	{
		this.paused = true;
		return this;
	}

	public end(all:boolean = false):FlumpMovie
	{
		this._queue.end(all);
		return this;
	}

	public stop():FlumpMovie
	{
		this.paused = true;

		this._queue.kill();

		return this;
	}

	public next():QueueItem
	{
		return this._queue.next();
	}

	public kill():FlumpMovie
	{
		this._queue.kill();
		return this;
	}

	public setFrameCallback(frameNumber:number, callback:() => any, triggerOnce:boolean = false):FlumpMovie
	{
		this.hasFrameCallbacks = true;

		if(triggerOnce)
		{
			this._frameCallback[frameNumber] = (delta:number) => {
				callback.call(this, delta);
				this.setFrameCallback(frameNumber, null);
			};
		}
		else
		{
			this._frameCallback[frameNumber] = callback;
		}
		return this;
	}

	public gotoAndStop(frameOrLabel:number|string):FlumpMovie
	{
		var frame:number;
		if (typeof frameOrLabel === 'string')
		{
			frame = this._labels[frameOrLabel].index;
		}
		else
		{
			frame = frameOrLabel;
		}
		var queue = new QueueItem(null, frame, 1, 1, 0);
		this._queue.add(queue);

		return this;
	}

	public onTick(delta:number, accumulated:number):void
	{
		var movieLayers = this._movieLayers;
		delta *= this.speed;

		if(this.paused == false)
		{
			this._queue.onTick(delta);
			var frame = this.frame;
			var newFrame = this._queue.getFrame();

			for(var i = 0; i < movieLayers.length; i++)
			{
				var layer = movieLayers[i];
				layer.onTick(delta, accumulated);
				layer.setFrame(newFrame);
			}


			this.frame = newFrame;
		}
	}

	/**
	 *
	 * @param name
	 * @returns {any}
	 */
	public getSymbol(name:string):FlumpMovie
	{
		var layers = this._movieLayers;
		for(var i = 0; i < layers.length; i++)
		{
			var layer = layers[i];
			var symbol:FlumpMovie = layer.getSymbol(name);

			if(symbol != null)
			{
				return symbol;
			}
		}

		return null;
	}

	public replaceSymbol(name:string, symbol:FlumpMovie|PIXI.Sprite ):boolean
	{
		var layers = this._movieLayers;
		for(var i = 0; i < layers.length; i++)
		{
			var layer = layers[i];
			if( layer.replaceSymbol(name, symbol) )
			{
				return true;
			}
		}

		return false;
	}

	public handleFrameCallback(fromFrame:number, toFrame:number, delta:number):FlumpMovie
	{
		if( toFrame > fromFrame )
		{
			for(var index = fromFrame; index < toFrame; index++)
			{
				if(this._frameCallback[index])
				{
					this._frameCallback[index].call(this, delta)
				}
			}
		}
		else if( toFrame < fromFrame)
		{
			for(var index = fromFrame; index < this.frames; index++)
			{
				if(this._frameCallback[index])
				{
					this._frameCallback[index].call(this, delta)
				}
			}

			for(var index = 0; index < toFrame; index++)
			{
				if(this._frameCallback[index])
				{
					this._frameCallback[index].call(this, delta)
				}
			}
		}

		return this;
	}
	/*
	 public setFrame(value:number):FlumpMovie
	 {
	 //console.log('setFrame', value, this.name);

	 var layers = this._movieLayers;
	 var length = layers.length;

	 //( this.frames / library.frameRate ) * 1000;

	 for(var i = 0; i < length; i++)
	 {
	 var layer = layers[i];
	 if (layer.enabled)
	 {
	 layer.reset();
	 layer.onTick( (value / this.frames) * this.duration );
	 layer.setFrame(value);
	 }
	 }

	 return this;
	 }*/

	/*public draw(ctx:CanvasRenderingContext2D, ignoreCache?:boolean):boolean
	{

		var layers = this._movieLayers;
		var length = layers.length;
		var ga = ctx.globalAlpha;

		for(var i = 0; i < length; i++)
		{
			var layer:FlumpMovieLayer = layers[i];

			if(layer.visible && layer.enabled)
			{
				ctx.save();
				//layer.updateContext(ctx)
				ctx.globalAlpha = ga * layer.alpha;

				ctx.transform(
					layer._storedMtx.a,
					layer._storedMtx.b,
					layer._storedMtx.c,
					layer._storedMtx.d,
					layer._storedMtx.tx,// + (this.x),
					layer._storedMtx.ty// + (this.y)
				);

				layer.draw(ctx);
				ctx.restore();
			}
		}

		return true;
	}*/



	// public draw(ctx:CanvasRenderingContext2D, ignoreCache?:boolean):boolean
	// {
	//
	// 	var layers = this._movieLayers;
	// 	var length = layers.length;
	// 	var ga = ctx.globalAlpha;
	//
	// 	for(var i = 0; i < length; i++)
	// 	{
	// 		var layer:FlumpMovieLayer = layers[i];
	//
	// 		if(layer.visible && layer.enabled)
	// 		{
	// 			ctx.save();
	// 			//layer.updateContext(ctx)
	// 			ctx.globalAlpha = ga * layer.alpha;
	//
	// 			ctx.transform(
	// 				layer._storedMtx.a,
	// 				layer._storedMtx.b,
	// 				layer._storedMtx.c,
	// 				layer._storedMtx.d,
	// 				layer._storedMtx.tx,// + (this.x),
	// 				layer._storedMtx.ty// + (this.y)
	// 			);
	//
	// 			layer.draw(ctx);
	// 			ctx.restore();
	// 		}
	// 	}
	//
	// 	return true;
	// }

	// public renderWebGL(renderer: PIXI.WebGLRenderer): void
	// {
	//
	// }
	//
	// public renderCanvas(renderer: PIXI.CanvasRenderer): void
	// {
	//
	// }

	public reset():void
	{
		var layers = this._movieLayers;
		for(var i = 0; i < layers.length; i++)
		{
			var layer = layers[i];
			layer.reset();
		}
	}
}