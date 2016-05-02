/*
 * HttpRequest
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Mient-jan Stelling
 * Copyright (c) 2015 MediaMonks B.V
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above * copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";
var Promise_1 = require("../util/Promise");
/**
 * @class HttpRequest
 */
var HttpRequest = (function () {
    function HttpRequest() {
    }
    /**
     * @static
     * @method request
     * @param {string} method
     * @param {string} url
     * @param {Array<string>} args
     * @returns {Promise}
     */
    HttpRequest.request = function (method, url, args) {
        // Creating a promise
        var promise = new Promise_1.Promise(function (resolve, reject) {
            // Instantiates the XMLHttpRequest
            var client = new XMLHttpRequest();
            var uri = url;
            if (args && (method === 'POST' || method === 'PUT')) {
                uri += '?';
                var argcount = 0;
                for (var key in args) {
                    if (args.hasOwnProperty(key)) {
                        if (argcount++) {
                            uri += '&';
                        }
                        uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
                    }
                }
            }
            client.open(method, uri);
            client.send();
            client.onload = function () {
                if (this.status === 200 || this.status === 0) {
                    // Performs the function "resolve" when this.status is equal to 200
                    resolve(this.response || this.responseText);
                }
                else {
                    // Performs the function "reject" when this.status is different than 200
                    reject(this.statusText);
                }
            };
            client.onerror = function () {
                reject(this.statusText);
            };
        });
        // Return the promise
        return promise;
    };
    /**
     *
     * @param {string} url
     * @param {IHashMap<any>} query
     * @returns {Promise<string>}
     */
    HttpRequest.getString = function (url, query) {
        if (query === void 0) { query = {}; }
        return HttpRequest.request('GET', url, query);
    };
    /**
     *
     * @param {string} url
     * @param {IHashMap<any>} query
     * @returns {Promise}
     */
    HttpRequest.getJSON = function (url, query) {
        if (query === void 0) { query = {}; }
        return HttpRequest.getString(url, query).then(function (response) {
            return JSON.parse(response);
        });
    };
    /**
     * @static
     * @method wait
     * @param {Array<Promise<any>>} list
     * @param {(progress:number) => any} onProgress
     * @returns {Promise}
     */
    HttpRequest.wait = function (list, onProgress) {
        if (onProgress === void 0) { onProgress = function (progress) { }; }
        return new Promise_1.Promise(function (resolve) {
            var newList = [];
            var then = function (response) {
                newList.push(response);
                onProgress(newList.length / list.length);
                if (newList.length == list.length) {
                    resolve(newList);
                }
            };
            for (var i = 0; i < list.length; i++) {
                list[i].then(then);
            }
        });
    };
    /**
     * @method waitForLoadable
     * @param {Array<ILoadable<any>>} list
     * @param {(progress:number) => any} onProgress
     * @returns {Promise}
     */
    HttpRequest.waitForLoadable = function (list, onProgress) {
        if (onProgress === void 0) { onProgress = function (progress) { }; }
        var count = list.length;
        var progressList = [];
        for (var i = 0; i < count; i++) {
            progressList.push(0);
        }
        var prvProgress = function (index, progress) {
            progressList[index] = progress;
            var total = 0;
            var length = progressList.length;
            for (var i = 0; i < length; i++) {
                total += progressList[i];
            }
            onProgress(total / count);
        };
        var promiseList = new Array(count);
        for (var i = 0; i < count; i++) {
            promiseList[i] = list[i].load(prvProgress.bind(this, i));
        }
        return HttpRequest.wait(promiseList);
    };
    return HttpRequest;
}());
exports.HttpRequest = HttpRequest;
//# sourceMappingURL=HttpRequest.js.map