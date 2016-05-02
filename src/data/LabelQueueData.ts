import {FlumpLabelData} from './FlumpLabelData';

export class FlumpLabelQueueData extends FlumpLabelData
{
	public times:number;
	public delay:number;
	private _complete:Function;

	constructor(label:string, index:number, duration:number, times:number = 1, delay:number = 0)
	{
		super(label, index, duration);

		this.times = times;
		this.delay = delay;
	}

	public then(complete:() => any):FlumpLabelQueueData
	{
		this._complete = complete;
		return this;
	}

	public finish():FlumpLabelQueueData
	{
		if(this._complete)
		{
			this._complete.call(this);
		}

		return this;
	}

	public destruct():void
	{
		this.label = null;
		this._complete = null;
	}
}

