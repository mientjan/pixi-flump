"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var FlumpMovie_1 = require("./FlumpMovie");
var LabelData_1 = require("../data/LabelData");
var KeyframeData_1 = require("../data/KeyframeData");
var MovieLayer = (function (_super) {
    __extends(MovieLayer, _super);
    // public _storedMtx = new FlumpMtx(1, 0, 0, 1, 0, 0);
    function MovieLayer(index, movie, library, layerData) {
        _super.call(this);
        this.name = '';
        this._frame = 0;
        this._symbols = {};
        // disable layer from code
        this.enabled = true;
        var keyframeData = layerData.keyframeData;
        this._index = index;
        this._movie = movie;
        this._layerData = layerData;
        this.name = layerData.name;
        for (var i = 0; i < keyframeData.length; i++) {
            var keyframe = keyframeData[i];
            if (keyframe.label) {
                movie.setLabel(keyframe.label, new LabelData_1.LabelData(keyframe.label, keyframe.index, keyframe.duration));
            }
            if ((keyframe.ref != -1 && keyframe.ref != null) && (keyframe.ref in this._symbols) == false) {
                this._symbols[keyframe.ref] = library.createSymbol(keyframe.ref, false);
            }
        }
        this.setFrame(0);
    }
    MovieLayer.prototype.getSymbol = function (name) {
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
    MovieLayer.prototype.replaceSymbol = function (name, item) {
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
    MovieLayer.prototype.onTick = function (delta, accumulated) {
        if (this._symbol != null && (this._symbol instanceof FlumpMovie_1.FlumpMovie)) {
            this._symbol.onTick(delta, accumulated);
        }
    };
    MovieLayer.prototype.setFrame = function (frame) {
        var keyframe = this._layerData.getKeyframeForFrame(Math.floor(frame));
        if (keyframe.ref != -1 && keyframe.ref != null) {
            if (this._symbol != this._symbols[keyframe.ref]) {
                this.removeChildren();
                this._symbol = this._symbols[keyframe.ref];
                if (this._symbol instanceof FlumpMovie_1.FlumpMovie) {
                    this._symbol.reset();
                }
                this.addChild(this._symbol);
            }
            this.setKeyframeData(this._symbol, keyframe, frame);
        }
        else {
            this.removeChildren();
            this._symbol = null;
        }
        return true;
    };
    MovieLayer.prototype.setKeyframeData = function (symbol, keyframe, frame) {
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
            nextKeyframe = this._layerData.getKeyframeAfter(keyframe);
            if (nextKeyframe instanceof KeyframeData_1.KeyframeData) {
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
        //this.setTransform(x, y, scaleX, scaleY, 0, skewX, skewY, pivotX, pivotY)
        if (skewX != 0) {
            sinX = Math.sin(skewX);
            cosX = Math.cos(skewX);
        }
        if (skewY != 0) {
            sinY = Math.sin(skewY);
            cosY = Math.cos(skewY);
        }
        //
        // symbol.localTransform
        //
        // this.worldTransform.a = scaleX * cosY;
        // this.worldTransform.b = scaleX * sinY;
        // this.worldTransform.c = -scaleY * sinX;
        // this.worldTransform.d = scaleY * cosX;
        //
        // this.worldTransform.tx = x - (pivotX * this.worldTransform.a + pivotY * this.worldTransform.c);
        // this.worldTransform.ty = y - (pivotX * this.worldTransform.b + pivotY * this.worldTransform.d);
        this._symbol.position.set(x, y);
        this._symbol.scale.set(scaleX, scaleY);
        if (!(this._symbol instanceof PIXI.Sprite)) {
            this._symbol['pivot'].x = pivotX;
            this._symbol['pivot'].y = pivotY;
        }
        this._symbol['skew'].set(skewX, skewY);
        // console.log(pivotX, pivotY);
        // console.log(this.worldTransform);
        //
        // this.setTransform(this._storedMtx.tx, this._storedMtx.ty, this._storedMtx.a, this._storedMtx.d, 0, this._storedMtx.b, this._storedMtx.c, 0, 0)
        // this.worldTransform.set( this._storedMtx.a, this._storedMtx, this._storedMtx, this._storedMtx.tx, this._storedMtx.ty);
        // this.setTransform(x, y, scaleX, scaleY, 0, skewX, skewY, 0, 0);
        // this.visible = keyframe.visible;
        // this.alpha = alpha;
        this.alpha = alpha;
        this.visible = keyframe.visible;
        this._frame = frame;
    };
    // updateTransform():void
    // {
    // 	// super.updateTransform();
    // }
    MovieLayer.prototype.reset = function () {
        if (this._symbol instanceof FlumpMovie_1.FlumpMovie) {
            this._symbol.reset();
        }
        for (var name in this._symbols) {
            var symbol = this._symbols[name];
            if (symbol instanceof FlumpMovie_1.FlumpMovie) {
                symbol.reset();
            }
        }
    };
    return MovieLayer;
}(PIXI.Container));
exports.MovieLayer = MovieLayer;
