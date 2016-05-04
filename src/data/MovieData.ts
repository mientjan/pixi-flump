import {LayerData} from "./LayerData";
import {FlumpLibrary} from "../FlumpLibrary";
import {IMovie} from "../interface/ILibrary";

export class MovieData
{

	public id:string;
	public layerData:Array<LayerData>;
	public frames:number = 0;

	constructor(library:FlumpLibrary, json:IMovie) 
	{
		var layers = json.layers;

		this.id = json.id;
		this.layerData = new Array(layers.length);

		for(var i = 0; i < layers.length; i++)
		{
			var layer = this.layerData[i] = new LayerData(layers[i]);
			this.frames = Math.max(this.frames, layer.frames)
		}
	}
}

