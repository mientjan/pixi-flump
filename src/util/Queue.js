"use strict";
var Queue = (function () {
    function Queue() {
        this._list = [];
        this._listLength = 0;
        this.current = null;
    }
    Queue.prototype.add = function (item) {
        this._list.push(item);
        this._listLength++;
        return this;
    };
    Queue.prototype.next = function () {
        this.kill();
        if (this._listLength > 0) {
            this.current = this._list.shift();
            this._listLength--;
        }
        else {
            this.current = null;
        }
        return this.current;
    };
    Queue.prototype.hasNext = function () {
        return this._listLength > 0;
    };
    Queue.prototype.end = function (all) {
        if (all === void 0) { all = false; }
        if (all) {
            this._list.length = 0;
            this._listLength = 0;
        }
        if (this.current) {
            this.current.times = 1;
        }
        return this;
    };
    Queue.prototype.kill = function (all) {
        if (all === void 0) { all = false; }
        if (all) {
            this._list.length = 0;
            this._listLength = 0;
        }
        if (this.current) {
            var current = this.current;
            this.current = null;
            current.finish();
            current.destruct();
        }
        return this;
    };
    return Queue;
}());
exports.Queue = Queue;
