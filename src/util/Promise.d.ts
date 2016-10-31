export declare class Promise<T> {
    static all(promiseList: Array<Promise<any>>): Promise<any>;
    static resolve(value: any): Promise<any>;
    static reject(value: any): Promise<any>;
    static race(values: any): Promise<any>;
    /**
     * Set the immediate function to execute callbacks
     * @param fn {function} Function to execute
     * @private
     */
    static _setImmediateFn(fn: any): void;
    private _state;
    private _value;
    private _deferreds;
    constructor(init: (resolve: (value?: T | Promise<T>) => void, reject: (reason?: any) => void) => void);
    catch(onRejected: (value: any) => any): Promise<T>;
    then(onFulfilled: any, onRejected?: any): Promise<T>;
}
