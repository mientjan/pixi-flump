"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Queue_1 = require("./Queue");
var AnimationQueue = (function (_super) {
    __extends(AnimationQueue, _super);
    function AnimationQueue(fps, unit) {
        if (unit === void 0) { unit = 1000; }
        _super.call(this);
        this.frame = 0;
        /**
         * Will stop
         * @property _freeze
         * @type {boolean}
         */
        this._freeze = false;
        this._hasStopped = false;
        this._time = 0;
        this._fpms = 0;
        this._fpms = unit / fps;
    }
    AnimationQueue.prototype.onTick = function (delta) {
        var time = this._time += delta;
        if ((this.current != null || this.next() != null)) {
            var current = this.current;
            var from = current.from;
            var duration = current.duration;
            var times = current.times;
            var frame = (duration * time / (duration * this._fpms));
            if (times > -1 && times - (frame / duration) < 0) {
                this.next();
            }
            else {
                this.frame = from + (frame % duration);
            }
        }
    };
    AnimationQueue.prototype.hasStopped = function () {
        return !this.current && !this.hasNext();
    };
    AnimationQueue.prototype.next = function () {
        var next = _super.prototype.next.call(this);
        if (next) {
            this.reset();
        }
        return next;
    };
    AnimationQueue.prototype.getFrame = function () {
        return this.frame;
    };
    AnimationQueue.prototype.reset = function () {
        this._freeze = false;
        this._time = this._time % this._fpms;
    };
    return AnimationQueue;
}(Queue_1.Queue));
exports.AnimationQueue = AnimationQueue;
