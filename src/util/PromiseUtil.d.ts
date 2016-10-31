import { Promise } from "./Promise";
import { ILoadable } from "../interface/ILoadable";
export declare class PromiseUtil {
    /**
     * @static
     * @method wait
     * @param {Array<Promise<any>>} list
     * @param {(progress:number) => any} onProgress
     * @returns {Promise}
     */
    static wait<T>(list: Array<Promise<T>>, onProgress?: (progress: number) => any): Promise<Array<T>>;
    /**
     * @method waitForLoadable
     * @param {Array<ILoadable<any>>} list
     * @param {(progress:number) => any} onProgress
     * @returns {Promise}
     */
    static waitForLoadable<T>(list: Array<ILoadable<T>>, onProgress?: (progress: number) => any): Promise<Array<T>>;
}
