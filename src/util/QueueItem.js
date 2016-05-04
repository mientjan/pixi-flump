"use strict";
var QueueItem = (function () {
    function QueueItem(label, from, to, times, delay) {
        if (times === void 0) { times = 1; }
        if (delay === void 0) { delay = 0; }
        this._complete = null;
        if (from > to) {
            throw new Error('argument "from" cannot be bigger than argument "to"');
        }
        this.label = label;
        this.from = from;
        this.to = to;
        this.duration = to - from;
        this.times = times;
        this.delay = delay;
    }
    QueueItem.prototype.then = function (complete) {
        this._complete = complete;
        return this;
    };
    QueueItem.prototype.finish = function () {
        if (this._complete) {
            this._complete.call(this);
        }
        return this;
    };
    QueueItem.prototype.destruct = function () {
        this.label = null;
        this._complete = null;
    };
    return QueueItem;
}());
exports.QueueItem = QueueItem;
