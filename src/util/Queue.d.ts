import { QueueItem } from "./QueueItem";
export declare class Queue {
    private _list;
    private _listLength;
    current: QueueItem;
    add(item: QueueItem): Queue;
    next(): QueueItem;
    hasNext(): boolean;
    end(all?: boolean): Queue;
    kill(all?: boolean): Queue;
}
