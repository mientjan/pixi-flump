

import {QueueItem} from "./QueueItem";

export class Queue
{
	private _list:Array<QueueItem> = [];
	private _listLength:number = 0;
	public current:QueueItem = null;

	public add(item:QueueItem):Queue
	{
		this._list.push(item);
		this._listLength++;
		
		return this;
	}

	public next():QueueItem
	{
		this.kill();

		if(this._listLength > 0)
		{
			this.current = this._list.shift();
			this._listLength--;
		} else {
			this.current = null;
		}

		return this.current;
	}

	public hasNext():boolean
	{
		return this._listLength > 0;
	}

	public end(all:boolean = false):Queue
	{
		if(all)
		{
			this._list.length = 0;
			this._listLength = 0;
		}

		if(this.current){
			this.current.times = 1;
		}

		return this;
	}

	public kill(all:boolean = false):Queue
	{
		if(all)
		{
			this._list.length = 0;
			this._listLength = 0;
		}

		if(this.current)
		{
			let current = this.current;
			this.current = null;
			current.finish();
			current.destruct();
		}

		return this;
	}
}
