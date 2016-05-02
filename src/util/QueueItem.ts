export class QueueItem
{

	public label:string;
	public from:number;
	public to:number;
	public duration:number;

	public times:number;
	public delay:number;
	private _complete:Function = null;

	constructor(label:string, from:number, to:number, times:number = 1, delay:number = 0)
	{
		if(from > to)
		{
			throw new Error('argument "from" cannot be bigger than argument "to"');
		}

		this.label = label;
		this.from = from;
		this.to = to;
		this.duration = to - from;
		this.times = times;
		this.delay = delay;
	}

	public then(complete:() => any):QueueItem
	{
		this._complete = complete;
		return this;
	}

	public finish():QueueItem
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
