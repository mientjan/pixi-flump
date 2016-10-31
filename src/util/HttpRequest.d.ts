import { IHashMap } from "../interface/IHashMap";
import { Promise } from "../util/Promise";
/**
 * @class HttpRequest
 */
export declare class HttpRequest {
    /**
     * @static
     * @method request
     * @param {string} method
     * @param {string} url
     * @param {Array<string>} args
     * @returns {Promise}
     */
    private static request(method, url, args);
    /**
     *
     * @param {string} url
     * @param {IHashMap<any>} query
     * @returns {Promise<string>}
     */
    static getString<T>(url: string, query?: IHashMap<any>): Promise<T>;
    /**
     *
     * @param {string} url
     * @param {IHashMap<any>} query
     * @returns {Promise}
     */
    static getJSON(url: string, query?: IHashMap<any>): Promise<any>;
}
