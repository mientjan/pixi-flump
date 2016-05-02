import {ILayer} from "../interface/ILibrary";
import {KeyframeData} from "./KeyframeData";

export class LayerData
{

	public name:string;
	public flipbook:boolean;
	public keyframeData:Array<KeyframeData> = [];

	public frames:number;

	constructor(json:ILayer)
	{
		this.name = json.name;
		this.flipbook = 'flipbook' in json ? !!json.flipbook : false;

		var keyframes = json.keyframes;
		var keyFrameData:KeyframeData = null;

		for(var i = 0; i < keyframes.length; i++)
		{
			var keyframe = keyframes[i];
			keyFrameData = new KeyframeData(keyframe);
			this.keyframeData.push(keyFrameData);
		}

		this.frames = keyFrameData.index + keyFrameData.duration;
	}

	public getKeyframeForFrame(frame:number):KeyframeData
	{
		var datas = this.keyframeData;
		for(var i = 1; i < datas.length; i++)
		{
			if(datas[i].index > frame)
			{
				return datas[i - 1];
			}
		}

		return datas[datas.length - 1];
	}

	public getKeyframeAfter(flumpKeyframeData:KeyframeData):KeyframeData
	{
		for(var i = 0; i < this.keyframeData.length - 1; i++)
		{
			if(this.keyframeData[i] === flumpKeyframeData)
			{
				return this.keyframeData[i + 1];
			}
		}
		return null;
	}
}

