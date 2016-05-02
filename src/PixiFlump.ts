

import {Promise} from "./util/Promise";
import {ILoadable} from "./interface/ILoadable";
import {HttpRequest} from "./util/HttpRequest";
import {ILibrary} from "./core/ILibrary";
import {FlumpMovieData} from "./core/MovieData";
import {FlumpTextureGroup} from "./core/TextureGroup";
import {IFlumpMovie} from "./core/IFlumpMovie";
import {FlumpMovie} from "./core/FlumpMovie";


export class PixiFlump implements ILoadable<PixiFlump>
{
	public static EVENT_LOAD = 'load';

	public static load(url:string, flumpLibrary?:PixiFlump, onProcess?:(process:number) => any ):Promise<PixiFlump>
	{
		var baseDir = url;

		if(url.indexOf('.json') > -1)
		{
			baseDir = url.substr(0, url.lastIndexOf('/'));
		} else {

			if(baseDir.substr(-1) == '/')
			{
				baseDir = baseDir.substr(0, baseDir.length - 1);
			}

			url += ( url.substr(url.length-1) != '/' ? '/' : '' ) +  'library.json';
		}

		if(flumpLibrary == void 0)
		{
			flumpLibrary = new PixiFlump(baseDir);
		} else {
			flumpLibrary.url = baseDir;
		}
		
		return HttpRequest.getJSON(url).then((json:ILibrary) =>
		{
			return flumpLibrary.processData(json, onProcess);
		});
	}

	public movieData:Array<FlumpMovieData> = [];
	public textureGroups:Array<FlumpTextureGroup> = [];

	public url:string;
	public md5:string;
	public frameRate:number;
	public referenceList:Array<string>;

	public fps:number = 0;
	public isOptimised:boolean = false;

	protected _hasLoaded:boolean = false;
	protected _isLoading:boolean = false;

	constructor(basePath?:string)
	{
		if(basePath)
		{
			this.url = basePath;
		}
	}

	public hasLoaded():boolean
	{
		return this._hasLoaded;
	}

	public isLoading():boolean
	{
		return this._isLoading;
	}

	public load( onProgress?:(progress:number) => any):Promise<PixiFlump>
	{
		if( this.hasLoaded() )
		{
			onProgress(1);

			return new Promise<PixiFlump>((resolve:Function, reject:Function) => {
				resolve(this);
			});
		}

		if(!this.url)
		{
			throw new Error('url is not set and there for can not be loaded');
		}

		return PixiFlump.load(this.url, this, onProgress ).catch(() => {
			throw new Error('could not load library');
		});
	}

	public processData(json:ILibrary, onProcess?:(process:number) => any):Promise<PixiFlump>
	{

		this.md5 = json.md5;
		this.frameRate = json.frameRate;
		this.referenceList = json.referenceList || null;
		this.isOptimised = json.optimised || false;

		var textureGroupLoaders:Array<Promise<FlumpTextureGroup>> = [];
		for(var i = 0; i < json.movies.length; i++)
		{
			var flumpMovieData = new FlumpMovieData(this, json.movies[i]);
			this.movieData.push(flumpMovieData);
		}

		var textureGroups = json.textureGroups;
		for(var i = 0; i < textureGroups.length; i++)
		{
			var textureGroup = textureGroups[i];
			var promise = FlumpTextureGroup.load(this, textureGroup);
			textureGroupLoaders.push(promise);
		}

		return HttpRequest.wait(textureGroupLoaders, onProcess)
			.then((textureGroups:Array<FlumpTextureGroup>) => {

				for(var i = 0; i < textureGroups.length; i++)
				{
					var textureGroup = textureGroups[i];
					this.textureGroups.push(textureGroup);
				}


				this._hasLoaded = true;
				return this;
			});
	}

	public getFlumpMovieData(name:string):FlumpMovieData
	{
		for(var i = 0; i < this.movieData.length; i++)
		{
			var movieData = this.movieData[i];
			if(movieData.id == name)
			{
				return movieData;
			}
		}

		throw new Error('movie not found');
	}

	public createSymbol(name:string, paused:boolean = false):IFlumpMovie
	{
		for(var i = 0; i < this.textureGroups.length; i++)
		{
			var flumpTextures = this.textureGroups[i].flumpTextures;

			if(name in flumpTextures)
			{
				return flumpTextures[name];
			}
		}

		for(var i = 0; i < this.movieData.length; i++)
		{
			var movieData = this.movieData[i];
			
			if(movieData.id == name)
			{
				var movie = new FlumpMovie(this, name);
				movie.getQueue().add(new QueueItem(null, 0, movie.frames, -1, 0))
				movie.paused = paused;
				return movie;
			}

		}

		console.warn('no _symbol found: (' + name + ')');

		throw new Error("no _symbol found");
	}

	public createMovie(id:any):FlumpMovie
	{
		if(this.referenceList)
		{
			var name:any = this.referenceList.indexOf(id);
		}
		else
		{
			var name:any = id;
		}

		for(var i = 0; i < this.movieData.length; i++)
		{
			var movieData = this.movieData[i];
			if(movieData.id == <any> name)
			{
				var movie = new FlumpMovie(this, <any> name);
				movie.paused = true;
				return movie;
			}
		}

		console.warn('no _symbol found: (' + name + ') ', this);

		throw new Error("no _symbol found: " + this);
	}

	public getNameFromReferenceList(value:string|number):string
	{
		if(this.referenceList && typeof value == 'number')
		{
			return this.referenceList[<number> value];
		}

		return <string> value;
	}
}

