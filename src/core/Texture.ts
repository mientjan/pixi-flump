import {IFlumpMovie} from "./IFlumpMovie";
import {DisplayType} from "../../enum/DisplayType";
import {ITexture} from "./IFlumpLibrary";

export class FlumpTexture implements IFlumpMovie
{
	public type:DisplayType = DisplayType.FLUMPSYMBOL;
	public name:string;
	public time:number = 0.0;
	public renderTexture:HTMLImageElement|HTMLCanvasElement;
	public originX:number;
	public originY:number;
	public x:number;
	public y:number;
	public width:number;
	public height:number;

	constructor(renderTexture:HTMLImageElement|HTMLCanvasElement, json:ITexture)
	{
		this.name = json.symbol;
		this.renderTexture = renderTexture;
		this.originX = json.origin[0];
		this.originY = json.origin[1];
		this.x = json.rect[0];
		this.y = json.rect[1];
		this.width = json.rect[2];
		this.height = json.rect[3];
	}

	public onTick(delta:number):void
	{
	}

	public draw(ctx:CanvasRenderingContext2D):boolean
	{
		ctx.drawImage(<HTMLImageElement> this.renderTexture, this.x, this.y, this.width, this.height, 0, 0, this.width, this.height);
		return true;
	}

	public reset():void
	{
		this.time = 0.0;
	}
}

