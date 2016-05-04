"use strict";
var Promise_1 = require("../util/Promise");
var HttpRequest = (function () {
    function HttpRequest() {
    }
    HttpRequest.request = function (method, url, args) {
        var promise = new Promise_1.Promise(function (resolve, reject) {
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
                    resolve(this.response || this.responseText);
                }
                else {
                    reject(this.statusText);
                }
            };
            client.onerror = function () {
                reject(this.statusText);
            };
        });
        return promise;
    };
    HttpRequest.getString = function (url, query) {
        if (query === void 0) { query = {}; }
        return HttpRequest.request('GET', url, query);
    };
    HttpRequest.getJSON = function (url, query) {
        if (query === void 0) { query = {}; }
        return HttpRequest.getString(url, query).then(function (response) {
            return JSON.parse(response);
        });
    };
    return HttpRequest;
}());
exports.HttpRequest = HttpRequest;
