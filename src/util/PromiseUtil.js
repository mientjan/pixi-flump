"use strict";
var Promise_1 = require("./Promise");
var PromiseUtil = (function () {
    function PromiseUtil() {
    }
    /**
     * @static
     * @method wait
     * @param {Array<Promise<any>>} list
     * @param {(progress:number) => any} onProgress
     * @returns {Promise}
     */
    PromiseUtil.wait = function (list, onProgress) {
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
    PromiseUtil.waitForLoadable = function (list, onProgress) {
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
        return PromiseUtil.wait(promiseList);
    };
    return PromiseUtil;
}());
exports.PromiseUtil = PromiseUtil;
