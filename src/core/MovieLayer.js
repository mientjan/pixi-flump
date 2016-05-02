"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var DisplayObject_1 = require('../../display/DisplayObject');
var FlumpKeyframeData_1 = require('./FlumpKeyframeData');
var FlumpTexture_1 = require('./FlumpTexture');
var FlumpMovie_1 = require('./FlumpMovie');
var FlumpMtx_1 = require('./FlumpMtx');
var FlumpLabelData_1 = require('./FlumpLabelData');
var DisplayType_1 = require("../../enum/DisplayType");
var FlumpMovieLayer = (function (_super) {
    __extends(FlumpMovieLayer, _super);
    function FlumpMovieLayer(flumpMove, flumpLayerData) {
        _super.call(this);
        this.name = '';
        this._frame = 0;
        this._symbols = {};
        this._symbolName = null;
        // disable layer from code
        this.enabled = true;
        this._storedMtx = new FlumpMtx_1.FlumpMtx(1, 0, 0, 1, 0, 0);
        this.flumpLayerData = flumpLayerData;
        this.name = flumpLayerData.name;
        var flumpLibrary = flumpMove.flumpLibrary;
        for (var i = 0; i < flumpLayerData.flumpKeyframeDatas.length; i++) {
            var keyframe = flumpLayerData.flumpKeyframeDatas[i];
            if (keyframe.label) {
                flumpMove['_labels'][keyframe.label] = new FlumpLabelData_1.FlumpLabelData(keyframe.label, keyframe.index, keyframe.duration);
            }
            if ((keyframe.ref != -1 && keyframe.ref != null) && (keyframe.ref in this._symbols) == false) {
                this._symbols[keyframe.ref] = flumpMove.flumpLibrary.createSymbol(keyframe.ref, false);
            }
        }
        this.setFrame(0);
    }
    FlumpMovieLayer.prototype.getSymbol = function (name) {
        var symbols = this._symbols;
        for (var val in symbols) {
            var symbol = symbols[val];
            if (symbol instanceof FlumpMovie_1.FlumpMovie) {
                if (symbol.name == name) {
                    return symbol;
                }
                else {
                    var data = symbol.getSymbol(name);
                    if (data != null) {
                        return data;
                    }
                }
            }
        }
        return null;
    };
    FlumpMovieLayer.prototype.replaceSymbol = function (name, item) {
        var symbols = this._symbols;
        for (var val in symbols) {
            var symbol = symbols[val];
            if (symbol.name == name) {
                this._symbols[val] = item;
                return true;
            }
            else if (symbol instanceof FlumpMovie_1.FlumpMovie && symbol.replaceSymbol(name, item)) {
                return true;
            }
        }
        return false;
    };
    FlumpMovieLayer.prototype.onTick = function (delta, accumulated) {
        if (this._symbol != null && !(this._symbol instanceof FlumpTexture_1.FlumpTexture)) {
            this._symbol.onTick(delta, accumulated);
        }
    };
    FlumpMovieLayer.prototype.setFrame = function (frame) {
        var keyframe = this.flumpLayerData.getKeyframeForFrame(Math.floor(frame));
        if (keyframe.ref != -1 && keyframe.ref != null) {
            if (this._symbol != this._symbols[keyframe.ref]) {
                this._symbol = this._symbols[keyframe.ref];
                if (this._symbol.type == DisplayType_1.DisplayType.FLUMPSYMBOL) {
                    this._symbol.reset();
                }
            }
            this.setKeyframeData(keyframe, frame);
        }
        else {
            this._symbol = null;
        }
        return true;
    };
    FlumpMovieLayer.prototype.setKeyframeData = function (keyframe, frame) {
        var sinX = 0.0;
        var cosX = 1.0;
        var sinY = 0.0;
        var cosY = 1.0;
        var x = keyframe.x;
        var y = keyframe.y;
        var scaleX = keyframe.scaleX;
        var scaleY = keyframe.scaleY;
        var skewX = keyframe.skewX;
        var skewY = keyframe.skewY;
        var pivotX = keyframe.pivotX;
        var pivotY = keyframe.pivotY;
        var alpha = keyframe.alpha;
        var ease;
        var interped;
        var nextKeyframe;
        if (keyframe.index < frame && keyframe.tweened) {
            nextKeyframe = this.flumpLayerData.getKeyframeAfter(keyframe);
            if (nextKeyframe instanceof FlumpKeyframeData_1.FlumpKeyframeData) {
                interped = (frame - keyframe.index) / keyframe.duration;
                ease = keyframe.ease;
                if (ease != 0) {
                    var t = 0.0;
                    if (ease < 0) {
                        var inv = 1 - interped;
                        t = 1 - inv * inv;
                        ease = 0 - ease;
                    }
                    else {
                        t = interped * interped;
                    }
                    interped = ease * t + (1 - ease) * interped;
                }
                x = x + (nextKeyframe.x - x) * interped;
                y = y + (nextKeyframe.y - y) * interped;
                scaleX = scaleX + (nextKeyframe.scaleX - scaleX) * interped;
                scaleY = scaleY + (nextKeyframe.scaleY - scaleY) * interped;
                skewX = skewX + (nextKeyframe.skewX - skewX) * interped;
                skewY = skewY + (nextKeyframe.skewY - skewY) * interped;
                alpha = alpha + (nextKeyframe.alpha - alpha) * interped;
            }
        }
        if (skewX != 0) {
            sinX = Math.sin(skewX);
            cosX = Math.cos(skewX);
        }
        if (skewY != 0) {
            sinY = Math.sin(skewY);
            cosY = Math.cos(skewY);
        }
        this._storedMtx.a = scaleX * cosY;
        this._storedMtx.b = scaleX * sinY;
        this._storedMtx.c = -scaleY * sinX;
        this._storedMtx.d = scaleY * cosX;
        this._storedMtx.tx = x - (pivotX * this._storedMtx.a + pivotY * this._storedMtx.c);
        this._storedMtx.ty = y - (pivotX * this._storedMtx.b + pivotY * this._storedMtx.d);
        this.alpha = alpha;
        this.visible = keyframe.visible;
        this._frame = frame;
    };
    FlumpMovieLayer.prototype.reset = function () {
        if (this._symbol) {
            this._symbol.reset();
        }
        for (var symbol in this._symbols) {
            this._symbols[symbol].reset();
        }
    };
    FlumpMovieLayer.prototype.draw = function (ctx, ignoreCache) {
        if (this._symbol != null && this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0) {
            this._symbol.draw(ctx);
        }
        return true;
    };
    return FlumpMovieLayer;
}(DisplayObject_1.DisplayObject));
exports.FlumpMovieLayer = FlumpMovieLayer;
//# sourceMappingURL=FlumpMovieLayer.js.map