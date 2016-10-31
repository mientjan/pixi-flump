import { QueueItem } from "./QueueItem";
import { Queue } from "./Queue";
export declare class AnimationQueue extends Queue {
    protected frame: number;
    /**
     * Will stop
     * @property _freeze
     * @type {boolean}
     */
    private _freeze;
    private _hasStopped;
    protected _time: number;
    protected _fpms: number;
    constructor(fps: number, unit?: number);
    onTick(delta: number): void;
    hasStopped(): boolean;
    next(): QueueItem;
    getFrame(): number;
    protected reset(): void;
}
