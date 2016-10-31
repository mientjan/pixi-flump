export declare class QueueItem {
    label: string;
    from: number;
    to: number;
    duration: number;
    times: number;
    delay: number;
    private _complete;
    constructor(label: string, from: number, to: number, times?: number, delay?: number);
    then(complete: () => any): QueueItem;
    finish(): QueueItem;
    destruct(): void;
}
