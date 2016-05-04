/**
 * @license
 * pixi-flump.js - v1.0.0
 * Compiled 2016-05-04T19:08:57.000Z
 *
 * pixi-flump.js is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * The MIT License *  * Copyright (c) 2016 Mient-jan Stelling *  * Permission is hereby granted, free of charge, to any person obtaining a copy * of this software and associated documentation files (the "Software"), to deal * in the Software without restriction, including without limitation the rights * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell * copies of the Software, and to permit persons to whom the Software is * furnished to do so, subject to the following conditions: *  * The above copyright notice and this permission notice shall be included in * all copies or substantial portions of the Software. *  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN * THE SOFTWARE.
 */(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.PIXI || (g.PIXI = {})).FlumpLibrary = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var Promise_1 = require("./util/Promise");
var HttpRequest_1 = require("./util/HttpRequest");
var PromiseUtil_1 = require("./util/PromiseUtil");
var TextureGroup_1 = require("./core/TextureGroup");
var FlumpMovie_1 = require("./core/FlumpMovie");
var MovieData_1 = require("./data/MovieData");
var QueueItem_1 = require("./util/QueueItem");
var FlumpLibrary = (function () {
    function FlumpLibrary(basePath) {
        this.movieData = [];
        this.textureGroups = [];
        this.fps = 0;
        this.isOptimised = false;
        this._hasLoaded = false;
        this._isLoading = false;
        var a = 0;
        if (basePath) {
            this.url = basePath;
        }
    }
    FlumpLibrary.load = function (url, library, onProcess) {
        var baseDir = url;
        if (url.indexOf('.json') > -1) {
            baseDir = url.substr(0, url.lastIndexOf('/'));
        }
        else {
            if (baseDir.substr(-1) == '/') {
                baseDir = baseDir.substr(0, baseDir.length - 1);
            }
            url += (url.substr(url.length - 1) != '/' ? '/' : '') + 'library.json';
        }
        if (library == void 0) {
            library = new FlumpLibrary(baseDir);
        }
        else {
            library.url = baseDir;
        }
        return HttpRequest_1.HttpRequest.getJSON(url).then(function (json) { return library.processData(json, onProcess); });
    };
    FlumpLibrary.prototype.hasLoaded = function () {
        return this._hasLoaded;
    };
    FlumpLibrary.prototype.isLoading = function () {
        return this._isLoading;
    };
    FlumpLibrary.prototype.load = function (onProgress) {
        if (this.hasLoaded()) {
            onProgress(1);
            return Promise_1.Promise.resolve(this);
        }
        if (!this.url) {
            throw new Error('url is not set and there for can not be loaded');
        }
        return FlumpLibrary.load(this.url, this, onProgress).catch(function () {
            throw new Error('could not load library');
        });
    };
    FlumpLibrary.prototype.processData = function (json, onProcess) {
        var _this = this;
        this.md5 = json.md5;
        this.frameRate = json.frameRate;
        this.referenceList = json.referenceList || null;
        this.isOptimised = json.optimised || false;
        var textureGroupLoaders = [];
        for (var i = 0; i < json.movies.length; i++) {
            var movieData = new MovieData_1.MovieData(this, json.movies[i]);
            this.movieData.push(movieData);
        }
        var textureGroups = json.textureGroups;
        for (var i = 0; i < textureGroups.length; i++) {
            var textureGroup = textureGroups[i];
            var promise = TextureGroup_1.TextureGroup.load(this, textureGroup);
            textureGroupLoaders.push(promise);
        }
        return PromiseUtil_1.PromiseUtil.wait(textureGroupLoaders, onProcess)
            .then(function (textureGroups) {
            for (var i = 0; i < textureGroups.length; i++) {
                var textureGroup = textureGroups[i];
                _this.textureGroups.push(textureGroup);
            }
            _this._hasLoaded = true;
            return _this;
        });
    };
    FlumpLibrary.prototype.getMovieData = function (name) {
        for (var i = 0; i < this.movieData.length; i++) {
            var movieData = this.movieData[i];
            if (movieData.id == name) {
                return movieData;
            }
        }
        throw new Error('movie not found');
    };
    FlumpLibrary.prototype.createSymbol = function (name, paused) {
        if (paused === void 0) { paused = false; }
        for (var i = 0; i < this.textureGroups.length; i++) {
            var textures = this.textureGroups[i].sprites;
            if (name in textures) {
                return textures[name];
            }
        }
        for (var i = 0; i < this.movieData.length; i++) {
            var movieData = this.movieData[i];
            if (movieData.id == name) {
                var movie = new FlumpMovie_1.FlumpMovie(this, name);
                movie.getQueue().add(new QueueItem_1.QueueItem(null, 0, movie.frames, -1, 0));
                movie.paused = paused;
                return movie;
            }
        }
        console.warn('no _symbol found: (' + name + ')');
        throw new Error("no _symbol found");
    };
    FlumpLibrary.prototype.createMovie = function (id) {
        var name;
        name = id;
        for (var i = 0; i < this.movieData.length; i++) {
            var movieData = this.movieData[i];
            if (movieData.id == name) {
                var movie = new FlumpMovie_1.FlumpMovie(this, name);
                movie.paused = true;
                return movie;
            }
        }
        console.warn('no _symbol found: (' + name + ') ', this);
        throw new Error("no _symbol found: " + this);
    };
    FlumpLibrary.prototype.getNameFromReferenceList = function (value) {
        if (this.referenceList && typeof value == 'number') {
            return this.referenceList[value];
        }
        return value;
    };
    FlumpLibrary.EVENT_LOAD = 'load';
    return FlumpLibrary;
}());
exports.FlumpLibrary = FlumpLibrary;

},{"./core/FlumpMovie":2,"./core/TextureGroup":5,"./data/MovieData":10,"./util/HttpRequest":13,"./util/Promise":14,"./util/PromiseUtil":15,"./util/QueueItem":17}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AnimationQueue_1 = require("../util/AnimationQueue");
var QueueItem_1 = require("../util/QueueItem");
var MovieLayer_1 = require("../core/MovieLayer");
var FlumpMovie = (function (_super) {
    __extends(FlumpMovie, _super);
    function FlumpMovie(library, name) {
        _super.call(this);
        this._labels = {};
        this._queue = null;
        this.hasFrameCallbacks = false;
        this.paused = true;
        this.frame = 0;
        this.frames = 0;
        this.speed = 1;
        this.fps = 1;
        this.name = name;
        this._library = library;
        this._movieData = library.getMovieData(name);
        var layers = this._movieData.layerData;
        var length = layers.length;
        var movieLayers = new Array(length);
        for (var i = 0; i < length; i++) {
            var layerData = layers[i];
            movieLayers[i] = new MovieLayer_1.MovieLayer(i, this, library, layerData);
        }
        this._movieLayers = movieLayers;
        this.frames = this._movieData.frames;
        this._frameCallback = new Array(this.frames);
        for (var i = 0; i < this.frames; i++) {
            this._frameCallback[i] = null;
        }
        this.fps = library.frameRate;
        this.getQueue();
    }
    FlumpMovie.prototype.setLabel = function (name, data) {
        this._labels[name] = data;
    };
    FlumpMovie.prototype.getQueue = function () {
        if (!this._queue) {
            this._queue = new AnimationQueue_1.AnimationQueue(this.fps, 1000);
        }
        return this._queue;
    };
    FlumpMovie.prototype.play = function (times, label, complete) {
        if (times === void 0) { times = 1; }
        if (label === void 0) { label = null; }
        this.visible = true;
        if (label instanceof Array) {
            if (label.length == 1) {
                var queue = new QueueItem_1.QueueItem(null, label[0], this.frames, times, 0);
            }
            else {
                var queue = new QueueItem_1.QueueItem(null, label[0], label[1], times, 0);
            }
        }
        else if (label == null || label == '*') {
            var queue = new QueueItem_1.QueueItem(null, 0, this.frames, times, 0);
        }
        else {
            var queueLabel = this._labels[label];
            if (!queueLabel) {
                throw new Error('unknown label:' + queueLabel + ' | ' + this.name);
            }
            var queue = new QueueItem_1.QueueItem(queueLabel.label, queueLabel.index, queueLabel.duration, times, 0);
        }
        if (complete) {
            queue.then(complete);
        }
        this._queue.add(queue);
        if (complete) {
            queue.then(complete);
        }
        this.paused = false;
        return this;
    };
    FlumpMovie.prototype.resume = function () {
        this.paused = false;
        return this;
    };
    FlumpMovie.prototype.pause = function () {
        this.paused = true;
        return this;
    };
    FlumpMovie.prototype.end = function (all) {
        if (all === void 0) { all = false; }
        this._queue.end(all);
        return this;
    };
    FlumpMovie.prototype.stop = function () {
        this.paused = true;
        this._queue.kill();
        return this;
    };
    FlumpMovie.prototype.next = function () {
        return this._queue.next();
    };
    FlumpMovie.prototype.kill = function () {
        this._queue.kill();
        return this;
    };
    FlumpMovie.prototype.setFrameCallback = function (frameNumber, callback, triggerOnce) {
        var _this = this;
        if (triggerOnce === void 0) { triggerOnce = false; }
        this.hasFrameCallbacks = true;
        if (triggerOnce) {
            this._frameCallback[frameNumber] = function (delta) {
                callback.call(_this, delta);
                _this.setFrameCallback(frameNumber, null);
            };
        }
        else {
            this._frameCallback[frameNumber] = callback;
        }
        return this;
    };
    FlumpMovie.prototype.gotoAndStop = function (frameOrLabel) {
        var frame;
        if (typeof frameOrLabel === 'string') {
            frame = this._labels[frameOrLabel].index;
        }
        else {
            frame = frameOrLabel;
        }
        var queue = new QueueItem_1.QueueItem(null, frame, 1, 1, 0);
        this._queue.add(queue);
        return this;
    };
    FlumpMovie.prototype.onTick = function (delta, accumulated) {
        var movieLayers = this._movieLayers;
        delta *= this.speed;
        if (this.paused == false) {
            this._queue.onTick(delta);
            var frame = this.frame;
            var newFrame = this._queue.getFrame();
            for (var i = 0; i < movieLayers.length; i++) {
                var layer = movieLayers[i];
                layer.onTick(delta, accumulated);
                layer.setFrame(newFrame);
            }
            this.frame = newFrame;
        }
    };
    FlumpMovie.prototype.getSymbol = function (name) {
        var layers = this._movieLayers;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var symbol = layer.getSymbol(name);
            if (symbol != null) {
                return symbol;
            }
        }
        return null;
    };
    FlumpMovie.prototype.replaceSymbol = function (name, symbol) {
        var layers = this._movieLayers;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (layer.replaceSymbol(name, symbol)) {
                return true;
            }
        }
        return false;
    };
    FlumpMovie.prototype.handleFrameCallback = function (fromFrame, toFrame, delta) {
        if (toFrame > fromFrame) {
            for (var index = fromFrame; index < toFrame; index++) {
                if (this._frameCallback[index]) {
                    this._frameCallback[index].call(this, delta);
                }
            }
        }
        else if (toFrame < fromFrame) {
            for (var index = fromFrame; index < this.frames; index++) {
                if (this._frameCallback[index]) {
                    this._frameCallback[index].call(this, delta);
                }
            }
            for (var index = 0; index < toFrame; index++) {
                if (this._frameCallback[index]) {
                    this._frameCallback[index].call(this, delta);
                }
            }
        }
        return this;
    };
    FlumpMovie.prototype.reset = function () {
        var layers = this._movieLayers;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            layer.reset();
        }
    };
    return FlumpMovie;
}(PIXI.Container));
exports.FlumpMovie = FlumpMovie;

},{"../core/MovieLayer":4,"../util/AnimationQueue":12,"../util/QueueItem":17}],3:[function(require,module,exports){
"use strict";
var FlumpMtx = (function () {
    function FlumpMtx(a, b, c, d, tx, ty) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.tx = tx;
        this.ty = ty;
    }
    return FlumpMtx;
}());
exports.FlumpMtx = FlumpMtx;

},{}],4:[function(require,module,exports){
"use strict";
var FlumpMtx_1 = require("./FlumpMtx");
var FlumpMovie_1 = require("./FlumpMovie");
var LabelData_1 = require("../data/LabelData");
var KeyframeData_1 = require("../data/KeyframeData");
var MovieLayer = (function () {
    function MovieLayer(index, movie, library, layerData) {
        this.name = '';
        this._frame = 0;
        this._symbols = {};
        this.enabled = true;
        this._storedMtx = new FlumpMtx_1.FlumpMtx(1, 0, 0, 1, 0, 0);
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
                this._symbol = this._symbols[keyframe.ref];
                if (this._symbol instanceof FlumpMovie_1.FlumpMovie) {
                    this._symbol.reset();
                }
                this._movie.addChildAt(this._symbol, this._index);
            }
            this.setKeyframeData(this._symbol, keyframe, frame);
        }
        else {
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
        symbol.setTransform(x, y, scaleX, scaleY, 0, skewX, skewY, pivotX, pivotY);
        symbol.visible = keyframe.visible;
        symbol.alpha = alpha;
        this._frame = frame;
    };
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
}());
exports.MovieLayer = MovieLayer;

},{"../data/KeyframeData":7,"../data/LabelData":8,"./FlumpMovie":2,"./FlumpMtx":3}],5:[function(require,module,exports){
"use strict";
var TextureGroupAtlas_1 = require("./TextureGroupAtlas");
var Promise_1 = require("../util/Promise");
var TextureGroup = (function () {
    function TextureGroup(sprites) {
        this.sprites = {};
        for (var i = 0; i < sprites.length; i++) {
            var sprite = sprites[i];
            this.sprites[sprite.name] = sprite;
        }
    }
    TextureGroup.load = function (library, json) {
        var atlases = json.atlases;
        var loaders = [];
        for (var i = 0; i < atlases.length; i++) {
            var atlas = atlases[i];
            loaders.push(TextureGroupAtlas_1.TextureGroupAtlas.load(library, atlas));
        }
        return Promise_1.Promise.all(loaders).then(function (atlases) {
            var result = [];
            for (var i = 0; i < atlases.length; i++) {
                var atlas = atlases[i];
                result = result.concat(atlas.getSprites());
            }
            return new TextureGroup(result);
        }).catch(function (err) {
            console.warn('could not load textureGroup', err);
            throw new Error('could not load textureGroup');
        });
    };
    return TextureGroup;
}());
exports.TextureGroup = TextureGroup;

},{"../util/Promise":14,"./TextureGroupAtlas":6}],6:[function(require,module,exports){
"use strict";
var Promise_1 = require("../util/Promise");
var Texture = PIXI.Texture;
var BaseTexture = PIXI.BaseTexture;
var Rectangle = PIXI.Rectangle;
var TextureGroupAtlas = (function () {
    function TextureGroupAtlas(renderTexture, json) {
        this._renderTexture = new BaseTexture(renderTexture);
        this._atlas = json;
    }
    TextureGroupAtlas.load = function (library, json) {
        var file = json.file;
        var url = library.url + '/' + file;
        return new Promise_1.Promise(function (resolve, reject) {
            var img = document.createElement('img');
            img.onload = function () {
                resolve(img);
            };
            img.onerror = function () {
                reject();
            };
            img.src = url;
        }).then(function (data) { return new TextureGroupAtlas(data, json); });
    };
    TextureGroupAtlas.prototype.getSprites = function () {
        var result = [];
        var textures = this._atlas.textures;
        var baseTexture = this._renderTexture;
        for (var i = 0; i < textures.length; i++) {
            var texture = textures[i];
            var sprite = new PIXI.Sprite(new Texture(baseTexture, new Rectangle(texture.rect[0], texture.rect[1], texture.rect[2], texture.rect[3])));
            sprite.name = texture.symbol;
            result.push(sprite);
        }
        return result;
    };
    return TextureGroupAtlas;
}());
exports.TextureGroupAtlas = TextureGroupAtlas;

},{"../util/Promise":14}],7:[function(require,module,exports){
"use strict";
var KeyframeData = (function () {
    function KeyframeData(json) {
        if (json.length != void 0) {
            this.fromArray(json);
        }
        else {
            var jsonObject = json;
            this.index = jsonObject.index;
            this.duration = jsonObject.duration;
            this.ref = 'ref' in jsonObject ? jsonObject.ref : null;
            this.label = 'label' in jsonObject ? jsonObject.label : null;
            this.x = 'loc' in jsonObject ? jsonObject.loc[0] : 0.0;
            this.y = 'loc' in jsonObject ? jsonObject.loc[1] : 0.0;
            this.scaleX = 'scale' in jsonObject ? jsonObject.scale[0] : 1.0;
            this.scaleY = 'scale' in jsonObject ? jsonObject.scale[1] : 1.0;
            this.skewX = 'skew' in jsonObject ? jsonObject.skew[0] : 0.0;
            this.skewY = 'skew' in jsonObject ? jsonObject.skew[1] : 0.0;
            this.pivotX = 'pivot' in jsonObject ? jsonObject.pivot[0] : 0.0;
            this.pivotY = 'pivot' in jsonObject ? jsonObject.pivot[1] : 0.0;
            this.visible = 'visible' in jsonObject ? jsonObject.visible : true;
            this.alpha = 'alpha' in jsonObject ? jsonObject.alpha : 1.0;
            this.tweened = 'tweened' in jsonObject ? jsonObject.tweened : true;
            this.ease = 'ease' in jsonObject ? jsonObject.ease : 0.0;
        }
    }
    KeyframeData.prototype.getValueOrder = function () {
        return [
            'index',
            'duration',
            'ref',
            'label',
            'x', 'y',
            'scaleX', 'scaleY',
            'skewX', 'skewY',
            'pivotX', 'pivotY',
            'visible',
            'alpha',
            'tweened',
            'ease'
        ];
    };
    KeyframeData.prototype.toArray = function () {
        var order = this.getValueOrder();
        var data = new Array(order.length);
        for (var i = 0; i < order.length; i++) {
            var name = order[i];
            data[i] = this[name];
        }
        return data;
    };
    KeyframeData.prototype.fromArray = function (data) {
        var order = this.getValueOrder();
        for (var i = 0; i < data.length; i++) {
            var name = order[i];
            var value = data[i];
            this[name] = value;
        }
    };
    return KeyframeData;
}());
exports.KeyframeData = KeyframeData;

},{}],8:[function(require,module,exports){
"use strict";
var LabelData = (function () {
    function LabelData(label, index, duration) {
        this.label = label;
        this.index = index;
        this.duration = duration;
    }
    return LabelData;
}());
exports.LabelData = LabelData;

},{}],9:[function(require,module,exports){
"use strict";
var KeyframeData_1 = require("./KeyframeData");
var LayerData = (function () {
    function LayerData(json) {
        this.keyframeData = [];
        this.name = json.name;
        this.flipbook = 'flipbook' in json ? !!json.flipbook : false;
        var keyframes = json.keyframes;
        var keyFrameData = null;
        for (var i = 0; i < keyframes.length; i++) {
            var keyframe = keyframes[i];
            keyFrameData = new KeyframeData_1.KeyframeData(keyframe);
            this.keyframeData.push(keyFrameData);
        }
        this.frames = keyFrameData.index + keyFrameData.duration;
    }
    LayerData.prototype.getKeyframeForFrame = function (frame) {
        var datas = this.keyframeData;
        for (var i = 1; i < datas.length; i++) {
            if (datas[i].index > frame) {
                return datas[i - 1];
            }
        }
        return datas[datas.length - 1];
    };
    LayerData.prototype.getKeyframeAfter = function (flumpKeyframeData) {
        for (var i = 0; i < this.keyframeData.length - 1; i++) {
            if (this.keyframeData[i] === flumpKeyframeData) {
                return this.keyframeData[i + 1];
            }
        }
        return null;
    };
    return LayerData;
}());
exports.LayerData = LayerData;

},{"./KeyframeData":7}],10:[function(require,module,exports){
"use strict";
var LayerData_1 = require("./LayerData");
var MovieData = (function () {
    function MovieData(library, json) {
        this.frames = 0;
        var layers = json.layers;
        this.id = json.id;
        this.layerData = new Array(layers.length);
        for (var i = 0; i < layers.length; i++) {
            var layer = this.layerData[i] = new LayerData_1.LayerData(layers[i]);
            this.frames = Math.max(this.frames, layer.frames);
        }
    }
    return MovieData;
}());
exports.MovieData = MovieData;

},{"./LayerData":9}],11:[function(require,module,exports){
"use strict";
var FlumpLibrary = require('./FlumpLibrary');
if (!global) {
    var global = {};
}
if (!global.PIXI) {
    global.PIXI = {};
}
global.PIXI.FlumpLibrary = FlumpLibrary;

},{"./FlumpLibrary":1}],12:[function(require,module,exports){
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

},{"./Queue":16}],13:[function(require,module,exports){
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

},{"../util/Promise":14}],14:[function(require,module,exports){
"use strict";
var asap = (typeof setImmediate === 'function' && setImmediate) ||
    function (fn) {
        setTimeout(fn, 1);
    };
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== 'function') {
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
        var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () { }, fBound = function () {
            return fToBind.apply(this instanceof fNOP
                ? this
                : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };
        if (this.prototype) {
            fNOP.prototype = this.prototype;
        }
        fBound.prototype = new fNOP();
        return fBound;
    };
}
var isArray = Array.isArray || function (value) { return Object.prototype.toString.call(value) === "[object Array]"; };
function handle(deferred) {
    var me = this;
    if (this._state === null) {
        this._deferreds.push(deferred);
        return;
    }
    asap(function () {
        var cb = me['_state'] ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
            (me['_state'] ? deferred.resolve : deferred.reject)(me._value);
            return;
        }
        var ret;
        try {
            ret = cb(me._value);
        }
        catch (e) {
            deferred.reject(e);
            return;
        }
        deferred.resolve(ret);
    });
}
function resolve(newValue) {
    try {
        if (newValue === this)
            throw new TypeError('A promise cannot be resolved with itself.');
        if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
            var then = newValue.then;
            if (typeof then === 'function') {
                doResolve(then.bind(newValue), resolve.bind(this), reject.bind(this));
                return;
            }
        }
        this['_state'] = true;
        this['_value'] = newValue;
        finale.call(this);
    }
    catch (e) {
        reject.call(this, e);
    }
}
function reject(newValue) {
    this._state = false;
    this._value = newValue;
    finale.call(this);
}
function finale() {
    for (var i = 0, len = this._deferreds.length; i < len; i++) {
        handle.call(this, this._deferreds[i]);
    }
    this._deferreds = null;
}
function Handler(onFulfilled, onRejected, resolve, reject) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.resolve = resolve;
    this.reject = reject;
}
function doResolve(fn, onFulfilled, onRejected) {
    var done = false;
    try {
        fn(function (value) {
            if (done)
                return;
            done = true;
            onFulfilled(value);
        }, function (reason) {
            if (done)
                return;
            done = true;
            onRejected(reason);
        });
    }
    catch (ex) {
        if (done)
            return;
        done = true;
        onRejected(ex);
    }
}
var Promise = (function () {
    function Promise(init) {
        this._state = null;
        this._value = null;
        this._deferreds = [];
        if (typeof this !== 'object')
            throw new TypeError('Promises must be constructed via new');
        if (typeof init !== 'function')
            throw new TypeError('not a function');
        doResolve(init, resolve.bind(this), reject.bind(this));
    }
    Promise.all = function (promiseList) {
        return new Promise(function (resolve, reject) {
            if (promiseList.length === 0)
                return resolve([]);
            var remaining = promiseList.length;
            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        var then = val.then;
                        if (typeof then === 'function') {
                            then.call(val, function (val) {
                                res(i, val);
                            }, reject);
                            return;
                        }
                    }
                    promiseList[i] = val;
                    if (--remaining === 0) {
                        resolve(promiseList);
                    }
                }
                catch (ex) {
                    reject(ex);
                }
            }
            for (var i = 0; i < promiseList.length; i++) {
                res(i, promiseList[i]);
            }
        });
    };
    Promise.resolve = function (value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
            return value;
        }
        return new Promise(function (resolve) {
            resolve(value);
        });
    };
    Promise.reject = function (value) {
        return new Promise(function (resolve, reject) {
            reject(value);
        });
    };
    Promise.race = function (values) {
        return new Promise(function (resolve, reject) {
            for (var i = 0, len = values.length; i < len; i++) {
                values[i].then(resolve, reject);
            }
        });
    };
    Promise._setImmediateFn = function (fn) {
        asap = fn;
    };
    Promise.prototype.catch = function (onRejected) {
        return this.then(null, onRejected);
    };
    Promise.prototype.then = function (onFulfilled, onRejected) {
        var me = this;
        return new Promise(function (resolve, reject) {
            handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
        });
    };
    return Promise;
}());
exports.Promise = Promise;

},{}],15:[function(require,module,exports){
"use strict";
var Promise_1 = require("./Promise");
var PromiseUtil = (function () {
    function PromiseUtil() {
    }
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

},{"./Promise":14}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{}]},{},[11])(11)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvRmx1bXBMaWJyYXJ5LmpzIiwic3JjL2NvcmUvRmx1bXBNb3ZpZS5qcyIsInNyYy9jb3JlL0ZsdW1wTXR4LmpzIiwic3JjL2NvcmUvTW92aWVMYXllci5qcyIsInNyYy9jb3JlL1RleHR1cmVHcm91cC5qcyIsInNyYy9jb3JlL1RleHR1cmVHcm91cEF0bGFzLmpzIiwic3JjL2RhdGEvS2V5ZnJhbWVEYXRhLmpzIiwic3JjL2RhdGEvTGFiZWxEYXRhLmpzIiwic3JjL2RhdGEvTGF5ZXJEYXRhLmpzIiwic3JjL2RhdGEvTW92aWVEYXRhLmpzIiwic3JjL2luZGV4Iiwic3JjL3V0aWwvQW5pbWF0aW9uUXVldWUuanMiLCJzcmMvdXRpbC9IdHRwUmVxdWVzdC5qcyIsInNyYy91dGlsL1Byb21pc2UuanMiLCJzcmMvdXRpbC9Qcm9taXNlVXRpbC5qcyIsInNyYy91dGlsL1F1ZXVlLmpzIiwic3JjL3V0aWwvUXVldWVJdGVtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4vdXRpbC9Qcm9taXNlXCIpO1xyXG52YXIgSHR0cFJlcXVlc3RfMSA9IHJlcXVpcmUoXCIuL3V0aWwvSHR0cFJlcXVlc3RcIik7XHJcbnZhciBQcm9taXNlVXRpbF8xID0gcmVxdWlyZShcIi4vdXRpbC9Qcm9taXNlVXRpbFwiKTtcclxudmFyIFRleHR1cmVHcm91cF8xID0gcmVxdWlyZShcIi4vY29yZS9UZXh0dXJlR3JvdXBcIik7XHJcbnZhciBGbHVtcE1vdmllXzEgPSByZXF1aXJlKFwiLi9jb3JlL0ZsdW1wTW92aWVcIik7XHJcbnZhciBNb3ZpZURhdGFfMSA9IHJlcXVpcmUoXCIuL2RhdGEvTW92aWVEYXRhXCIpO1xyXG52YXIgUXVldWVJdGVtXzEgPSByZXF1aXJlKFwiLi91dGlsL1F1ZXVlSXRlbVwiKTtcclxudmFyIEZsdW1wTGlicmFyeSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBGbHVtcExpYnJhcnkoYmFzZVBhdGgpIHtcclxuICAgICAgICB0aGlzLm1vdmllRGF0YSA9IFtdO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZUdyb3VwcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZnBzID0gMDtcclxuICAgICAgICB0aGlzLmlzT3B0aW1pc2VkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5faGFzTG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5faXNMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGEgPSAwO1xyXG4gICAgICAgIGlmIChiYXNlUGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnVybCA9IGJhc2VQYXRoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIEZsdW1wTGlicmFyeS5sb2FkID0gZnVuY3Rpb24gKHVybCwgbGlicmFyeSwgb25Qcm9jZXNzKSB7XHJcbiAgICAgICAgdmFyIGJhc2VEaXIgPSB1cmw7XHJcbiAgICAgICAgaWYgKHVybC5pbmRleE9mKCcuanNvbicpID4gLTEpIHtcclxuICAgICAgICAgICAgYmFzZURpciA9IHVybC5zdWJzdHIoMCwgdXJsLmxhc3RJbmRleE9mKCcvJykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGJhc2VEaXIuc3Vic3RyKC0xKSA9PSAnLycpIHtcclxuICAgICAgICAgICAgICAgIGJhc2VEaXIgPSBiYXNlRGlyLnN1YnN0cigwLCBiYXNlRGlyLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHVybCArPSAodXJsLnN1YnN0cih1cmwubGVuZ3RoIC0gMSkgIT0gJy8nID8gJy8nIDogJycpICsgJ2xpYnJhcnkuanNvbic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsaWJyYXJ5ID09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICBsaWJyYXJ5ID0gbmV3IEZsdW1wTGlicmFyeShiYXNlRGlyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxpYnJhcnkudXJsID0gYmFzZURpcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEh0dHBSZXF1ZXN0XzEuSHR0cFJlcXVlc3QuZ2V0SlNPTih1cmwpLnRoZW4oZnVuY3Rpb24gKGpzb24pIHsgcmV0dXJuIGxpYnJhcnkucHJvY2Vzc0RhdGEoanNvbiwgb25Qcm9jZXNzKTsgfSk7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBMaWJyYXJ5LnByb3RvdHlwZS5oYXNMb2FkZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhc0xvYWRlZDtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLmlzTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNMb2FkaW5nO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChvblByb2dyZXNzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzTG9hZGVkKCkpIHtcclxuICAgICAgICAgICAgb25Qcm9ncmVzcygxKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2VfMS5Qcm9taXNlLnJlc29sdmUodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy51cmwpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1cmwgaXMgbm90IHNldCBhbmQgdGhlcmUgZm9yIGNhbiBub3QgYmUgbG9hZGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBGbHVtcExpYnJhcnkubG9hZCh0aGlzLnVybCwgdGhpcywgb25Qcm9ncmVzcykuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBsb2FkIGxpYnJhcnknKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLnByb2Nlc3NEYXRhID0gZnVuY3Rpb24gKGpzb24sIG9uUHJvY2Vzcykge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5tZDUgPSBqc29uLm1kNTtcclxuICAgICAgICB0aGlzLmZyYW1lUmF0ZSA9IGpzb24uZnJhbWVSYXRlO1xyXG4gICAgICAgIHRoaXMucmVmZXJlbmNlTGlzdCA9IGpzb24ucmVmZXJlbmNlTGlzdCB8fCBudWxsO1xyXG4gICAgICAgIHRoaXMuaXNPcHRpbWlzZWQgPSBqc29uLm9wdGltaXNlZCB8fCBmYWxzZTtcclxuICAgICAgICB2YXIgdGV4dHVyZUdyb3VwTG9hZGVycyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvbi5tb3ZpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG1vdmllRGF0YSA9IG5ldyBNb3ZpZURhdGFfMS5Nb3ZpZURhdGEodGhpcywganNvbi5tb3ZpZXNbaV0pO1xyXG4gICAgICAgICAgICB0aGlzLm1vdmllRGF0YS5wdXNoKG1vdmllRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0ZXh0dXJlR3JvdXBzID0ganNvbi50ZXh0dXJlR3JvdXBzO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dHVyZUdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgdGV4dHVyZUdyb3VwID0gdGV4dHVyZUdyb3Vwc1tpXTtcclxuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBUZXh0dXJlR3JvdXBfMS5UZXh0dXJlR3JvdXAubG9hZCh0aGlzLCB0ZXh0dXJlR3JvdXApO1xyXG4gICAgICAgICAgICB0ZXh0dXJlR3JvdXBMb2FkZXJzLnB1c2gocHJvbWlzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlVXRpbF8xLlByb21pc2VVdGlsLndhaXQodGV4dHVyZUdyb3VwTG9hZGVycywgb25Qcm9jZXNzKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAodGV4dHVyZUdyb3Vwcykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHR1cmVHcm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0dXJlR3JvdXAgPSB0ZXh0dXJlR3JvdXBzW2ldO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMudGV4dHVyZUdyb3Vwcy5wdXNoKHRleHR1cmVHcm91cCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3RoaXMuX2hhc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiBfdGhpcztcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLmdldE1vdmllRGF0YSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1vdmllRGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbW92aWVEYXRhID0gdGhpcy5tb3ZpZURhdGFbaV07XHJcbiAgICAgICAgICAgIGlmIChtb3ZpZURhdGEuaWQgPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vdmllRGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vdmllIG5vdCBmb3VuZCcpO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUuY3JlYXRlU3ltYm9sID0gZnVuY3Rpb24gKG5hbWUsIHBhdXNlZCkge1xyXG4gICAgICAgIGlmIChwYXVzZWQgPT09IHZvaWQgMCkgeyBwYXVzZWQgPSBmYWxzZTsgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50ZXh0dXJlR3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0dXJlcyA9IHRoaXMudGV4dHVyZUdyb3Vwc1tpXS5zcHJpdGVzO1xyXG4gICAgICAgICAgICBpZiAobmFtZSBpbiB0ZXh0dXJlcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRleHR1cmVzW25hbWVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tb3ZpZURhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG1vdmllRGF0YSA9IHRoaXMubW92aWVEYXRhW2ldO1xyXG4gICAgICAgICAgICBpZiAobW92aWVEYXRhLmlkID09IG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtb3ZpZSA9IG5ldyBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSh0aGlzLCBuYW1lKTtcclxuICAgICAgICAgICAgICAgIG1vdmllLmdldFF1ZXVlKCkuYWRkKG5ldyBRdWV1ZUl0ZW1fMS5RdWV1ZUl0ZW0obnVsbCwgMCwgbW92aWUuZnJhbWVzLCAtMSwgMCkpO1xyXG4gICAgICAgICAgICAgICAgbW92aWUucGF1c2VkID0gcGF1c2VkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vdmllO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUud2Fybignbm8gX3N5bWJvbCBmb3VuZDogKCcgKyBuYW1lICsgJyknKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBfc3ltYm9sIGZvdW5kXCIpO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUuY3JlYXRlTW92aWUgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBuYW1lID0gaWQ7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1vdmllRGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbW92aWVEYXRhID0gdGhpcy5tb3ZpZURhdGFbaV07XHJcbiAgICAgICAgICAgIGlmIChtb3ZpZURhdGEuaWQgPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vdmllID0gbmV3IEZsdW1wTW92aWVfMS5GbHVtcE1vdmllKHRoaXMsIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgbW92aWUucGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtb3ZpZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oJ25vIF9zeW1ib2wgZm91bmQ6ICgnICsgbmFtZSArICcpICcsIHRoaXMpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vIF9zeW1ib2wgZm91bmQ6IFwiICsgdGhpcyk7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBMaWJyYXJ5LnByb3RvdHlwZS5nZXROYW1lRnJvbVJlZmVyZW5jZUxpc3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICBpZiAodGhpcy5yZWZlcmVuY2VMaXN0ICYmIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZlcmVuY2VMaXN0W3ZhbHVlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5FVkVOVF9MT0FEID0gJ2xvYWQnO1xyXG4gICAgcmV0dXJuIEZsdW1wTGlicmFyeTtcclxufSgpKTtcclxuZXhwb3J0cy5GbHVtcExpYnJhcnkgPSBGbHVtcExpYnJhcnk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59O1xyXG52YXIgQW5pbWF0aW9uUXVldWVfMSA9IHJlcXVpcmUoXCIuLi91dGlsL0FuaW1hdGlvblF1ZXVlXCIpO1xyXG52YXIgUXVldWVJdGVtXzEgPSByZXF1aXJlKFwiLi4vdXRpbC9RdWV1ZUl0ZW1cIik7XHJcbnZhciBNb3ZpZUxheWVyXzEgPSByZXF1aXJlKFwiLi4vY29yZS9Nb3ZpZUxheWVyXCIpO1xyXG52YXIgRmx1bXBNb3ZpZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoRmx1bXBNb3ZpZSwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIEZsdW1wTW92aWUobGlicmFyeSwgbmFtZSkge1xyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX2xhYmVscyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gbnVsbDtcclxuICAgICAgICB0aGlzLmhhc0ZyYW1lQ2FsbGJhY2tzID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZnJhbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuZnJhbWVzID0gMDtcclxuICAgICAgICB0aGlzLnNwZWVkID0gMTtcclxuICAgICAgICB0aGlzLmZwcyA9IDE7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLl9saWJyYXJ5ID0gbGlicmFyeTtcclxuICAgICAgICB0aGlzLl9tb3ZpZURhdGEgPSBsaWJyYXJ5LmdldE1vdmllRGF0YShuYW1lKTtcclxuICAgICAgICB2YXIgbGF5ZXJzID0gdGhpcy5fbW92aWVEYXRhLmxheWVyRGF0YTtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gbGF5ZXJzLmxlbmd0aDtcclxuICAgICAgICB2YXIgbW92aWVMYXllcnMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXllckRhdGEgPSBsYXllcnNbaV07XHJcbiAgICAgICAgICAgIG1vdmllTGF5ZXJzW2ldID0gbmV3IE1vdmllTGF5ZXJfMS5Nb3ZpZUxheWVyKGksIHRoaXMsIGxpYnJhcnksIGxheWVyRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX21vdmllTGF5ZXJzID0gbW92aWVMYXllcnM7XHJcbiAgICAgICAgdGhpcy5mcmFtZXMgPSB0aGlzLl9tb3ZpZURhdGEuZnJhbWVzO1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lQ2FsbGJhY2sgPSBuZXcgQXJyYXkodGhpcy5mcmFtZXMpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFtZXM7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLl9mcmFtZUNhbGxiYWNrW2ldID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5mcHMgPSBsaWJyYXJ5LmZyYW1lUmF0ZTtcclxuICAgICAgICB0aGlzLmdldFF1ZXVlKCk7XHJcbiAgICB9XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5zZXRMYWJlbCA9IGZ1bmN0aW9uIChuYW1lLCBkYXRhKSB7XHJcbiAgICAgICAgdGhpcy5fbGFiZWxzW25hbWVdID0gZGF0YTtcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5nZXRRdWV1ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuX3F1ZXVlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlID0gbmV3IEFuaW1hdGlvblF1ZXVlXzEuQW5pbWF0aW9uUXVldWUodGhpcy5mcHMsIDEwMDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5fcXVldWU7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uICh0aW1lcywgbGFiZWwsIGNvbXBsZXRlKSB7XHJcbiAgICAgICAgaWYgKHRpbWVzID09PSB2b2lkIDApIHsgdGltZXMgPSAxOyB9XHJcbiAgICAgICAgaWYgKGxhYmVsID09PSB2b2lkIDApIHsgbGFiZWwgPSBudWxsOyB9XHJcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICBpZiAobGFiZWwgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICBpZiAobGFiZWwubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBxdWV1ZSA9IG5ldyBRdWV1ZUl0ZW1fMS5RdWV1ZUl0ZW0obnVsbCwgbGFiZWxbMF0sIHRoaXMuZnJhbWVzLCB0aW1lcywgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcXVldWUgPSBuZXcgUXVldWVJdGVtXzEuUXVldWVJdGVtKG51bGwsIGxhYmVsWzBdLCBsYWJlbFsxXSwgdGltZXMsIDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGxhYmVsID09IG51bGwgfHwgbGFiZWwgPT0gJyonKSB7XHJcbiAgICAgICAgICAgIHZhciBxdWV1ZSA9IG5ldyBRdWV1ZUl0ZW1fMS5RdWV1ZUl0ZW0obnVsbCwgMCwgdGhpcy5mcmFtZXMsIHRpbWVzLCAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBxdWV1ZUxhYmVsID0gdGhpcy5fbGFiZWxzW2xhYmVsXTtcclxuICAgICAgICAgICAgaWYgKCFxdWV1ZUxhYmVsKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gbGFiZWw6JyArIHF1ZXVlTGFiZWwgKyAnIHwgJyArIHRoaXMubmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHF1ZXVlID0gbmV3IFF1ZXVlSXRlbV8xLlF1ZXVlSXRlbShxdWV1ZUxhYmVsLmxhYmVsLCBxdWV1ZUxhYmVsLmluZGV4LCBxdWV1ZUxhYmVsLmR1cmF0aW9uLCB0aW1lcywgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjb21wbGV0ZSkge1xyXG4gICAgICAgICAgICBxdWV1ZS50aGVuKGNvbXBsZXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcXVldWUuYWRkKHF1ZXVlKTtcclxuICAgICAgICBpZiAoY29tcGxldGUpIHtcclxuICAgICAgICAgICAgcXVldWUudGhlbihjb21wbGV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucGF1c2VkID0gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uIChhbGwpIHtcclxuICAgICAgICBpZiAoYWxsID09PSB2b2lkIDApIHsgYWxsID0gZmFsc2U7IH1cclxuICAgICAgICB0aGlzLl9xdWV1ZS5lbmQoYWxsKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl9xdWV1ZS5raWxsKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcXVldWUubmV4dCgpO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLmtpbGwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fcXVldWUua2lsbCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLnNldEZyYW1lQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZnJhbWVOdW1iZXIsIGNhbGxiYWNrLCB0cmlnZ2VyT25jZSkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgaWYgKHRyaWdnZXJPbmNlID09PSB2b2lkIDApIHsgdHJpZ2dlck9uY2UgPSBmYWxzZTsgfVxyXG4gICAgICAgIHRoaXMuaGFzRnJhbWVDYWxsYmFja3MgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0cmlnZ2VyT25jZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9mcmFtZUNhbGxiYWNrW2ZyYW1lTnVtYmVyXSA9IGZ1bmN0aW9uIChkZWx0YSkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChfdGhpcywgZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuc2V0RnJhbWVDYWxsYmFjayhmcmFtZU51bWJlciwgbnVsbCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9mcmFtZUNhbGxiYWNrW2ZyYW1lTnVtYmVyXSA9IGNhbGxiYWNrO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5nb3RvQW5kU3RvcCA9IGZ1bmN0aW9uIChmcmFtZU9yTGFiZWwpIHtcclxuICAgICAgICB2YXIgZnJhbWU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmcmFtZU9yTGFiZWwgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGZyYW1lID0gdGhpcy5fbGFiZWxzW2ZyYW1lT3JMYWJlbF0uaW5kZXg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBmcmFtZSA9IGZyYW1lT3JMYWJlbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHF1ZXVlID0gbmV3IFF1ZXVlSXRlbV8xLlF1ZXVlSXRlbShudWxsLCBmcmFtZSwgMSwgMSwgMCk7XHJcbiAgICAgICAgdGhpcy5fcXVldWUuYWRkKHF1ZXVlKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5vblRpY2sgPSBmdW5jdGlvbiAoZGVsdGEsIGFjY3VtdWxhdGVkKSB7XHJcbiAgICAgICAgdmFyIG1vdmllTGF5ZXJzID0gdGhpcy5fbW92aWVMYXllcnM7XHJcbiAgICAgICAgZGVsdGEgKj0gdGhpcy5zcGVlZDtcclxuICAgICAgICBpZiAodGhpcy5wYXVzZWQgPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5fcXVldWUub25UaWNrKGRlbHRhKTtcclxuICAgICAgICAgICAgdmFyIGZyYW1lID0gdGhpcy5mcmFtZTtcclxuICAgICAgICAgICAgdmFyIG5ld0ZyYW1lID0gdGhpcy5fcXVldWUuZ2V0RnJhbWUoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb3ZpZUxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxheWVyID0gbW92aWVMYXllcnNbaV07XHJcbiAgICAgICAgICAgICAgICBsYXllci5vblRpY2soZGVsdGEsIGFjY3VtdWxhdGVkKTtcclxuICAgICAgICAgICAgICAgIGxheWVyLnNldEZyYW1lKG5ld0ZyYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmZyYW1lID0gbmV3RnJhbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLmdldFN5bWJvbCA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgdmFyIGxheWVycyA9IHRoaXMuX21vdmllTGF5ZXJzO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXllciA9IGxheWVyc1tpXTtcclxuICAgICAgICAgICAgdmFyIHN5bWJvbCA9IGxheWVyLmdldFN5bWJvbChuYW1lKTtcclxuICAgICAgICAgICAgaWYgKHN5bWJvbCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLnJlcGxhY2VTeW1ib2wgPSBmdW5jdGlvbiAobmFtZSwgc3ltYm9sKSB7XHJcbiAgICAgICAgdmFyIGxheWVycyA9IHRoaXMuX21vdmllTGF5ZXJzO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXllciA9IGxheWVyc1tpXTtcclxuICAgICAgICAgICAgaWYgKGxheWVyLnJlcGxhY2VTeW1ib2wobmFtZSwgc3ltYm9sKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLmhhbmRsZUZyYW1lQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZnJvbUZyYW1lLCB0b0ZyYW1lLCBkZWx0YSkge1xyXG4gICAgICAgIGlmICh0b0ZyYW1lID4gZnJvbUZyYW1lKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gZnJvbUZyYW1lOyBpbmRleCA8IHRvRnJhbWU7IGluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9mcmFtZUNhbGxiYWNrW2luZGV4XSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZyYW1lQ2FsbGJhY2tbaW5kZXhdLmNhbGwodGhpcywgZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRvRnJhbWUgPCBmcm9tRnJhbWUpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSBmcm9tRnJhbWU7IGluZGV4IDwgdGhpcy5mcmFtZXM7IGluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9mcmFtZUNhbGxiYWNrW2luZGV4XSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZyYW1lQ2FsbGJhY2tbaW5kZXhdLmNhbGwodGhpcywgZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0b0ZyYW1lOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZnJhbWVDYWxsYmFja1tpbmRleF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9mcmFtZUNhbGxiYWNrW2luZGV4XS5jYWxsKHRoaXMsIGRlbHRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbGF5ZXJzID0gdGhpcy5fbW92aWVMYXllcnM7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGxheWVyID0gbGF5ZXJzW2ldO1xyXG4gICAgICAgICAgICBsYXllci5yZXNldCgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gRmx1bXBNb3ZpZTtcclxufShQSVhJLkNvbnRhaW5lcikpO1xyXG5leHBvcnRzLkZsdW1wTW92aWUgPSBGbHVtcE1vdmllO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEZsdW1wTXR4ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEZsdW1wTXR4KGEsIGIsIGMsIGQsIHR4LCB0eSkge1xyXG4gICAgICAgIHRoaXMuYSA9IGE7XHJcbiAgICAgICAgdGhpcy5iID0gYjtcclxuICAgICAgICB0aGlzLmMgPSBjO1xyXG4gICAgICAgIHRoaXMuZCA9IGQ7XHJcbiAgICAgICAgdGhpcy50eCA9IHR4O1xyXG4gICAgICAgIHRoaXMudHkgPSB0eTtcclxuICAgIH1cclxuICAgIHJldHVybiBGbHVtcE10eDtcclxufSgpKTtcclxuZXhwb3J0cy5GbHVtcE10eCA9IEZsdW1wTXR4O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEZsdW1wTXR4XzEgPSByZXF1aXJlKFwiLi9GbHVtcE10eFwiKTtcclxudmFyIEZsdW1wTW92aWVfMSA9IHJlcXVpcmUoXCIuL0ZsdW1wTW92aWVcIik7XHJcbnZhciBMYWJlbERhdGFfMSA9IHJlcXVpcmUoXCIuLi9kYXRhL0xhYmVsRGF0YVwiKTtcclxudmFyIEtleWZyYW1lRGF0YV8xID0gcmVxdWlyZShcIi4uL2RhdGEvS2V5ZnJhbWVEYXRhXCIpO1xyXG52YXIgTW92aWVMYXllciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBNb3ZpZUxheWVyKGluZGV4LCBtb3ZpZSwgbGlicmFyeSwgbGF5ZXJEYXRhKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gJyc7XHJcbiAgICAgICAgdGhpcy5fZnJhbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuX3N5bWJvbHMgPSB7fTtcclxuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX3N0b3JlZE10eCA9IG5ldyBGbHVtcE10eF8xLkZsdW1wTXR4KDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgIHZhciBrZXlmcmFtZURhdGEgPSBsYXllckRhdGEua2V5ZnJhbWVEYXRhO1xyXG4gICAgICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgdGhpcy5fbW92aWUgPSBtb3ZpZTtcclxuICAgICAgICB0aGlzLl9sYXllckRhdGEgPSBsYXllckRhdGE7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbGF5ZXJEYXRhLm5hbWU7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlmcmFtZURhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGtleWZyYW1lID0ga2V5ZnJhbWVEYXRhW2ldO1xyXG4gICAgICAgICAgICBpZiAoa2V5ZnJhbWUubGFiZWwpIHtcclxuICAgICAgICAgICAgICAgIG1vdmllLnNldExhYmVsKGtleWZyYW1lLmxhYmVsLCBuZXcgTGFiZWxEYXRhXzEuTGFiZWxEYXRhKGtleWZyYW1lLmxhYmVsLCBrZXlmcmFtZS5pbmRleCwga2V5ZnJhbWUuZHVyYXRpb24pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoKGtleWZyYW1lLnJlZiAhPSAtMSAmJiBrZXlmcmFtZS5yZWYgIT0gbnVsbCkgJiYgKGtleWZyYW1lLnJlZiBpbiB0aGlzLl9zeW1ib2xzKSA9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3ltYm9sc1trZXlmcmFtZS5yZWZdID0gbGlicmFyeS5jcmVhdGVTeW1ib2woa2V5ZnJhbWUucmVmLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRGcmFtZSgwKTtcclxuICAgIH1cclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLmdldFN5bWJvbCA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgdmFyIHN5bWJvbHMgPSB0aGlzLl9zeW1ib2xzO1xyXG4gICAgICAgIGZvciAodmFyIHZhbCBpbiBzeW1ib2xzKSB7XHJcbiAgICAgICAgICAgIHZhciBzeW1ib2wgPSBzeW1ib2xzW3ZhbF07XHJcbiAgICAgICAgICAgIGlmIChzeW1ib2wgaW5zdGFuY2VvZiBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN5bWJvbC5uYW1lID09IG5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBzeW1ib2wuZ2V0U3ltYm9sKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLnJlcGxhY2VTeW1ib2wgPSBmdW5jdGlvbiAobmFtZSwgaXRlbSkge1xyXG4gICAgICAgIHZhciBzeW1ib2xzID0gdGhpcy5fc3ltYm9scztcclxuICAgICAgICBmb3IgKHZhciB2YWwgaW4gc3ltYm9scykge1xyXG4gICAgICAgICAgICB2YXIgc3ltYm9sID0gc3ltYm9sc1t2YWxdO1xyXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm5hbWUgPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3ltYm9sc1t2YWxdID0gaXRlbTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHN5bWJvbCBpbnN0YW5jZW9mIEZsdW1wTW92aWVfMS5GbHVtcE1vdmllICYmIHN5bWJvbC5yZXBsYWNlU3ltYm9sKG5hbWUsIGl0ZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG4gICAgTW92aWVMYXllci5wcm90b3R5cGUub25UaWNrID0gZnVuY3Rpb24gKGRlbHRhLCBhY2N1bXVsYXRlZCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9zeW1ib2wgIT0gbnVsbCAmJiAodGhpcy5fc3ltYm9sIGluc3RhbmNlb2YgRmx1bXBNb3ZpZV8xLkZsdW1wTW92aWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N5bWJvbC5vblRpY2soZGVsdGEsIGFjY3VtdWxhdGVkKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgTW92aWVMYXllci5wcm90b3R5cGUuc2V0RnJhbWUgPSBmdW5jdGlvbiAoZnJhbWUpIHtcclxuICAgICAgICB2YXIga2V5ZnJhbWUgPSB0aGlzLl9sYXllckRhdGEuZ2V0S2V5ZnJhbWVGb3JGcmFtZShNYXRoLmZsb29yKGZyYW1lKSk7XHJcbiAgICAgICAgaWYgKGtleWZyYW1lLnJlZiAhPSAtMSAmJiBrZXlmcmFtZS5yZWYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc3ltYm9sICE9IHRoaXMuX3N5bWJvbHNba2V5ZnJhbWUucmVmXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3ltYm9sID0gdGhpcy5fc3ltYm9sc1trZXlmcmFtZS5yZWZdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N5bWJvbCBpbnN0YW5jZW9mIEZsdW1wTW92aWVfMS5GbHVtcE1vdmllKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3ltYm9sLnJlc2V0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3ZpZS5hZGRDaGlsZEF0KHRoaXMuX3N5bWJvbCwgdGhpcy5faW5kZXgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVEYXRhKHRoaXMuX3N5bWJvbCwga2V5ZnJhbWUsIGZyYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N5bWJvbCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLnNldEtleWZyYW1lRGF0YSA9IGZ1bmN0aW9uIChzeW1ib2wsIGtleWZyYW1lLCBmcmFtZSkge1xyXG4gICAgICAgIHZhciBzaW5YID0gMC4wO1xyXG4gICAgICAgIHZhciBjb3NYID0gMS4wO1xyXG4gICAgICAgIHZhciBzaW5ZID0gMC4wO1xyXG4gICAgICAgIHZhciBjb3NZID0gMS4wO1xyXG4gICAgICAgIHZhciB4ID0ga2V5ZnJhbWUueDtcclxuICAgICAgICB2YXIgeSA9IGtleWZyYW1lLnk7XHJcbiAgICAgICAgdmFyIHNjYWxlWCA9IGtleWZyYW1lLnNjYWxlWDtcclxuICAgICAgICB2YXIgc2NhbGVZID0ga2V5ZnJhbWUuc2NhbGVZO1xyXG4gICAgICAgIHZhciBza2V3WCA9IGtleWZyYW1lLnNrZXdYO1xyXG4gICAgICAgIHZhciBza2V3WSA9IGtleWZyYW1lLnNrZXdZO1xyXG4gICAgICAgIHZhciBwaXZvdFggPSBrZXlmcmFtZS5waXZvdFg7XHJcbiAgICAgICAgdmFyIHBpdm90WSA9IGtleWZyYW1lLnBpdm90WTtcclxuICAgICAgICB2YXIgYWxwaGEgPSBrZXlmcmFtZS5hbHBoYTtcclxuICAgICAgICB2YXIgZWFzZTtcclxuICAgICAgICB2YXIgaW50ZXJwZWQ7XHJcbiAgICAgICAgdmFyIG5leHRLZXlmcmFtZTtcclxuICAgICAgICBpZiAoa2V5ZnJhbWUuaW5kZXggPCBmcmFtZSAmJiBrZXlmcmFtZS50d2VlbmVkKSB7XHJcbiAgICAgICAgICAgIG5leHRLZXlmcmFtZSA9IHRoaXMuX2xheWVyRGF0YS5nZXRLZXlmcmFtZUFmdGVyKGtleWZyYW1lKTtcclxuICAgICAgICAgICAgaWYgKG5leHRLZXlmcmFtZSBpbnN0YW5jZW9mIEtleWZyYW1lRGF0YV8xLktleWZyYW1lRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaW50ZXJwZWQgPSAoZnJhbWUgLSBrZXlmcmFtZS5pbmRleCkgLyBrZXlmcmFtZS5kdXJhdGlvbjtcclxuICAgICAgICAgICAgICAgIGVhc2UgPSBrZXlmcmFtZS5lYXNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVhc2UgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gMC4wO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlYXNlIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW52ID0gMSAtIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gMSAtIGludiAqIGludjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWFzZSA9IDAgLSBlYXNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IGludGVycGVkICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGludGVycGVkID0gZWFzZSAqIHQgKyAoMSAtIGVhc2UpICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB4ID0geCArIChuZXh0S2V5ZnJhbWUueCAtIHgpICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICB5ID0geSArIChuZXh0S2V5ZnJhbWUueSAtIHkpICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICBzY2FsZVggPSBzY2FsZVggKyAobmV4dEtleWZyYW1lLnNjYWxlWCAtIHNjYWxlWCkgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgIHNjYWxlWSA9IHNjYWxlWSArIChuZXh0S2V5ZnJhbWUuc2NhbGVZIC0gc2NhbGVZKSAqIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgc2tld1ggPSBza2V3WCArIChuZXh0S2V5ZnJhbWUuc2tld1ggLSBza2V3WCkgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgIHNrZXdZID0gc2tld1kgKyAobmV4dEtleWZyYW1lLnNrZXdZIC0gc2tld1kpICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICBhbHBoYSA9IGFscGhhICsgKG5leHRLZXlmcmFtZS5hbHBoYSAtIGFscGhhKSAqIGludGVycGVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN5bWJvbC5zZXRUcmFuc2Zvcm0oeCwgeSwgc2NhbGVYLCBzY2FsZVksIDAsIHNrZXdYLCBza2V3WSwgcGl2b3RYLCBwaXZvdFkpO1xyXG4gICAgICAgIHN5bWJvbC52aXNpYmxlID0ga2V5ZnJhbWUudmlzaWJsZTtcclxuICAgICAgICBzeW1ib2wuYWxwaGEgPSBhbHBoYTtcclxuICAgICAgICB0aGlzLl9mcmFtZSA9IGZyYW1lO1xyXG4gICAgfTtcclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9zeW1ib2wgaW5zdGFuY2VvZiBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zeW1ib2wucmVzZXQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLl9zeW1ib2xzKSB7XHJcbiAgICAgICAgICAgIHZhciBzeW1ib2wgPSB0aGlzLl9zeW1ib2xzW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAoc3ltYm9sIGluc3RhbmNlb2YgRmx1bXBNb3ZpZV8xLkZsdW1wTW92aWUpIHtcclxuICAgICAgICAgICAgICAgIHN5bWJvbC5yZXNldCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBNb3ZpZUxheWVyO1xyXG59KCkpO1xyXG5leHBvcnRzLk1vdmllTGF5ZXIgPSBNb3ZpZUxheWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFRleHR1cmVHcm91cEF0bGFzXzEgPSByZXF1aXJlKFwiLi9UZXh0dXJlR3JvdXBBdGxhc1wiKTtcclxudmFyIFByb21pc2VfMSA9IHJlcXVpcmUoXCIuLi91dGlsL1Byb21pc2VcIik7XHJcbnZhciBUZXh0dXJlR3JvdXAgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gVGV4dHVyZUdyb3VwKHNwcml0ZXMpIHtcclxuICAgICAgICB0aGlzLnNwcml0ZXMgPSB7fTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwcml0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IHNwcml0ZXNbaV07XHJcbiAgICAgICAgICAgIHRoaXMuc3ByaXRlc1tzcHJpdGUubmFtZV0gPSBzcHJpdGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgVGV4dHVyZUdyb3VwLmxvYWQgPSBmdW5jdGlvbiAobGlicmFyeSwganNvbikge1xyXG4gICAgICAgIHZhciBhdGxhc2VzID0ganNvbi5hdGxhc2VzO1xyXG4gICAgICAgIHZhciBsb2FkZXJzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdGxhc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBhdGxhcyA9IGF0bGFzZXNbaV07XHJcbiAgICAgICAgICAgIGxvYWRlcnMucHVzaChUZXh0dXJlR3JvdXBBdGxhc18xLlRleHR1cmVHcm91cEF0bGFzLmxvYWQobGlicmFyeSwgYXRsYXMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2VfMS5Qcm9taXNlLmFsbChsb2FkZXJzKS50aGVuKGZ1bmN0aW9uIChhdGxhc2VzKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdGxhc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXRsYXMgPSBhdGxhc2VzW2ldO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChhdGxhcy5nZXRTcHJpdGVzKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGV4dHVyZUdyb3VwKHJlc3VsdCk7XHJcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ2NvdWxkIG5vdCBsb2FkIHRleHR1cmVHcm91cCcsIGVycik7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IGxvYWQgdGV4dHVyZUdyb3VwJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFRleHR1cmVHcm91cDtcclxufSgpKTtcclxuZXhwb3J0cy5UZXh0dXJlR3JvdXAgPSBUZXh0dXJlR3JvdXA7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4uL3V0aWwvUHJvbWlzZVwiKTtcclxudmFyIFRleHR1cmUgPSBQSVhJLlRleHR1cmU7XHJcbnZhciBCYXNlVGV4dHVyZSA9IFBJWEkuQmFzZVRleHR1cmU7XHJcbnZhciBSZWN0YW5nbGUgPSBQSVhJLlJlY3RhbmdsZTtcclxudmFyIFRleHR1cmVHcm91cEF0bGFzID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFRleHR1cmVHcm91cEF0bGFzKHJlbmRlclRleHR1cmUsIGpzb24pIHtcclxuICAgICAgICB0aGlzLl9yZW5kZXJUZXh0dXJlID0gbmV3IEJhc2VUZXh0dXJlKHJlbmRlclRleHR1cmUpO1xyXG4gICAgICAgIHRoaXMuX2F0bGFzID0ganNvbjtcclxuICAgIH1cclxuICAgIFRleHR1cmVHcm91cEF0bGFzLmxvYWQgPSBmdW5jdGlvbiAobGlicmFyeSwganNvbikge1xyXG4gICAgICAgIHZhciBmaWxlID0ganNvbi5maWxlO1xyXG4gICAgICAgIHZhciB1cmwgPSBsaWJyYXJ5LnVybCArICcvJyArIGZpbGU7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlXzEuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgICAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoaW1nKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLnNyYyA9IHVybDtcclxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7IHJldHVybiBuZXcgVGV4dHVyZUdyb3VwQXRsYXMoZGF0YSwganNvbik7IH0pO1xyXG4gICAgfTtcclxuICAgIFRleHR1cmVHcm91cEF0bGFzLnByb3RvdHlwZS5nZXRTcHJpdGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICB2YXIgdGV4dHVyZXMgPSB0aGlzLl9hdGxhcy50ZXh0dXJlcztcclxuICAgICAgICB2YXIgYmFzZVRleHR1cmUgPSB0aGlzLl9yZW5kZXJUZXh0dXJlO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dHVyZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlc1tpXTtcclxuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IG5ldyBQSVhJLlNwcml0ZShuZXcgVGV4dHVyZShiYXNlVGV4dHVyZSwgbmV3IFJlY3RhbmdsZSh0ZXh0dXJlLnJlY3RbMF0sIHRleHR1cmUucmVjdFsxXSwgdGV4dHVyZS5yZWN0WzJdLCB0ZXh0dXJlLnJlY3RbM10pKSk7XHJcbiAgICAgICAgICAgIHNwcml0ZS5uYW1lID0gdGV4dHVyZS5zeW1ib2w7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNwcml0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFRleHR1cmVHcm91cEF0bGFzO1xyXG59KCkpO1xyXG5leHBvcnRzLlRleHR1cmVHcm91cEF0bGFzID0gVGV4dHVyZUdyb3VwQXRsYXM7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgS2V5ZnJhbWVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEtleWZyYW1lRGF0YShqc29uKSB7XHJcbiAgICAgICAgaWYgKGpzb24ubGVuZ3RoICE9IHZvaWQgMCkge1xyXG4gICAgICAgICAgICB0aGlzLmZyb21BcnJheShqc29uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBqc29uT2JqZWN0ID0ganNvbjtcclxuICAgICAgICAgICAgdGhpcy5pbmRleCA9IGpzb25PYmplY3QuaW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMuZHVyYXRpb24gPSBqc29uT2JqZWN0LmR1cmF0aW9uO1xyXG4gICAgICAgICAgICB0aGlzLnJlZiA9ICdyZWYnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnJlZiA6IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMubGFiZWwgPSAnbGFiZWwnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LmxhYmVsIDogbnVsbDtcclxuICAgICAgICAgICAgdGhpcy54ID0gJ2xvYycgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QubG9jWzBdIDogMC4wO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAnbG9jJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC5sb2NbMV0gOiAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMuc2NhbGVYID0gJ3NjYWxlJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC5zY2FsZVswXSA6IDEuMDtcclxuICAgICAgICAgICAgdGhpcy5zY2FsZVkgPSAnc2NhbGUnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnNjYWxlWzFdIDogMS4wO1xyXG4gICAgICAgICAgICB0aGlzLnNrZXdYID0gJ3NrZXcnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnNrZXdbMF0gOiAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMuc2tld1kgPSAnc2tldycgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3Quc2tld1sxXSA6IDAuMDtcclxuICAgICAgICAgICAgdGhpcy5waXZvdFggPSAncGl2b3QnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnBpdm90WzBdIDogMC4wO1xyXG4gICAgICAgICAgICB0aGlzLnBpdm90WSA9ICdwaXZvdCcgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QucGl2b3RbMV0gOiAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMudmlzaWJsZSA9ICd2aXNpYmxlJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC52aXNpYmxlIDogdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5hbHBoYSA9ICdhbHBoYScgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QuYWxwaGEgOiAxLjA7XHJcbiAgICAgICAgICAgIHRoaXMudHdlZW5lZCA9ICd0d2VlbmVkJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC50d2VlbmVkIDogdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5lYXNlID0gJ2Vhc2UnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LmVhc2UgOiAwLjA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgS2V5ZnJhbWVEYXRhLnByb3RvdHlwZS5nZXRWYWx1ZU9yZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICdpbmRleCcsXHJcbiAgICAgICAgICAgICdkdXJhdGlvbicsXHJcbiAgICAgICAgICAgICdyZWYnLFxyXG4gICAgICAgICAgICAnbGFiZWwnLFxyXG4gICAgICAgICAgICAneCcsICd5JyxcclxuICAgICAgICAgICAgJ3NjYWxlWCcsICdzY2FsZVknLFxyXG4gICAgICAgICAgICAnc2tld1gnLCAnc2tld1knLFxyXG4gICAgICAgICAgICAncGl2b3RYJywgJ3Bpdm90WScsXHJcbiAgICAgICAgICAgICd2aXNpYmxlJyxcclxuICAgICAgICAgICAgJ2FscGhhJyxcclxuICAgICAgICAgICAgJ3R3ZWVuZWQnLFxyXG4gICAgICAgICAgICAnZWFzZSdcclxuICAgICAgICBdO1xyXG4gICAgfTtcclxuICAgIEtleWZyYW1lRGF0YS5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgb3JkZXIgPSB0aGlzLmdldFZhbHVlT3JkZXIoKTtcclxuICAgICAgICB2YXIgZGF0YSA9IG5ldyBBcnJheShvcmRlci5sZW5ndGgpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JkZXIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBvcmRlcltpXTtcclxuICAgICAgICAgICAgZGF0YVtpXSA9IHRoaXNbbmFtZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfTtcclxuICAgIEtleWZyYW1lRGF0YS5wcm90b3R5cGUuZnJvbUFycmF5ID0gZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICB2YXIgb3JkZXIgPSB0aGlzLmdldFZhbHVlT3JkZXIoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBvcmRlcltpXTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtpXTtcclxuICAgICAgICAgICAgdGhpc1tuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gS2V5ZnJhbWVEYXRhO1xyXG59KCkpO1xyXG5leHBvcnRzLktleWZyYW1lRGF0YSA9IEtleWZyYW1lRGF0YTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBMYWJlbERhdGEgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gTGFiZWxEYXRhKGxhYmVsLCBpbmRleCwgZHVyYXRpb24pIHtcclxuICAgICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XHJcbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xyXG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICAgIH1cclxuICAgIHJldHVybiBMYWJlbERhdGE7XHJcbn0oKSk7XHJcbmV4cG9ydHMuTGFiZWxEYXRhID0gTGFiZWxEYXRhO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEtleWZyYW1lRGF0YV8xID0gcmVxdWlyZShcIi4vS2V5ZnJhbWVEYXRhXCIpO1xyXG52YXIgTGF5ZXJEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIExheWVyRGF0YShqc29uKSB7XHJcbiAgICAgICAgdGhpcy5rZXlmcmFtZURhdGEgPSBbXTtcclxuICAgICAgICB0aGlzLm5hbWUgPSBqc29uLm5hbWU7XHJcbiAgICAgICAgdGhpcy5mbGlwYm9vayA9ICdmbGlwYm9vaycgaW4ganNvbiA/ICEhanNvbi5mbGlwYm9vayA6IGZhbHNlO1xyXG4gICAgICAgIHZhciBrZXlmcmFtZXMgPSBqc29uLmtleWZyYW1lcztcclxuICAgICAgICB2YXIga2V5RnJhbWVEYXRhID0gbnVsbDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleWZyYW1lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIga2V5ZnJhbWUgPSBrZXlmcmFtZXNbaV07XHJcbiAgICAgICAgICAgIGtleUZyYW1lRGF0YSA9IG5ldyBLZXlmcmFtZURhdGFfMS5LZXlmcmFtZURhdGEoa2V5ZnJhbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmtleWZyYW1lRGF0YS5wdXNoKGtleUZyYW1lRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZnJhbWVzID0ga2V5RnJhbWVEYXRhLmluZGV4ICsga2V5RnJhbWVEYXRhLmR1cmF0aW9uO1xyXG4gICAgfVxyXG4gICAgTGF5ZXJEYXRhLnByb3RvdHlwZS5nZXRLZXlmcmFtZUZvckZyYW1lID0gZnVuY3Rpb24gKGZyYW1lKSB7XHJcbiAgICAgICAgdmFyIGRhdGFzID0gdGhpcy5rZXlmcmFtZURhdGE7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBkYXRhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZGF0YXNbaV0uaW5kZXggPiBmcmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFzW2kgLSAxXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YXNbZGF0YXMubGVuZ3RoIC0gMV07XHJcbiAgICB9O1xyXG4gICAgTGF5ZXJEYXRhLnByb3RvdHlwZS5nZXRLZXlmcmFtZUFmdGVyID0gZnVuY3Rpb24gKGZsdW1wS2V5ZnJhbWVEYXRhKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmtleWZyYW1lRGF0YS5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMua2V5ZnJhbWVEYXRhW2ldID09PSBmbHVtcEtleWZyYW1lRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMua2V5ZnJhbWVEYXRhW2kgKyAxXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH07XHJcbiAgICByZXR1cm4gTGF5ZXJEYXRhO1xyXG59KCkpO1xyXG5leHBvcnRzLkxheWVyRGF0YSA9IExheWVyRGF0YTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBMYXllckRhdGFfMSA9IHJlcXVpcmUoXCIuL0xheWVyRGF0YVwiKTtcclxudmFyIE1vdmllRGF0YSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBNb3ZpZURhdGEobGlicmFyeSwganNvbikge1xyXG4gICAgICAgIHRoaXMuZnJhbWVzID0gMDtcclxuICAgICAgICB2YXIgbGF5ZXJzID0ganNvbi5sYXllcnM7XHJcbiAgICAgICAgdGhpcy5pZCA9IGpzb24uaWQ7XHJcbiAgICAgICAgdGhpcy5sYXllckRhdGEgPSBuZXcgQXJyYXkobGF5ZXJzLmxlbmd0aCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGxheWVyID0gdGhpcy5sYXllckRhdGFbaV0gPSBuZXcgTGF5ZXJEYXRhXzEuTGF5ZXJEYXRhKGxheWVyc1tpXSk7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhbWVzID0gTWF0aC5tYXgodGhpcy5mcmFtZXMsIGxheWVyLmZyYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIE1vdmllRGF0YTtcclxufSgpKTtcclxuZXhwb3J0cy5Nb3ZpZURhdGEgPSBNb3ZpZURhdGE7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgRmx1bXBMaWJyYXJ5ID0gcmVxdWlyZSgnLi9GbHVtcExpYnJhcnknKTtcclxuaWYgKCFnbG9iYWwpIHtcclxuICAgIHZhciBnbG9iYWwgPSB7fTtcclxufVxyXG5pZiAoIWdsb2JhbC5QSVhJKSB7XHJcbiAgICBnbG9iYWwuUElYSSA9IHt9O1xyXG59XHJcbmdsb2JhbC5QSVhJLkZsdW1wTGlicmFyeSA9IEZsdW1wTGlicmFyeTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn07XHJcbnZhciBRdWV1ZV8xID0gcmVxdWlyZShcIi4vUXVldWVcIik7XHJcbnZhciBBbmltYXRpb25RdWV1ZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoQW5pbWF0aW9uUXVldWUsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBBbmltYXRpb25RdWV1ZShmcHMsIHVuaXQpIHtcclxuICAgICAgICBpZiAodW5pdCA9PT0gdm9pZCAwKSB7IHVuaXQgPSAxMDAwOyB9XHJcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XHJcbiAgICAgICAgdGhpcy5mcmFtZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fZnJlZXplID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5faGFzU3RvcHBlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3RpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuX2ZwbXMgPSAwO1xyXG4gICAgICAgIHRoaXMuX2ZwbXMgPSB1bml0IC8gZnBzO1xyXG4gICAgfVxyXG4gICAgQW5pbWF0aW9uUXVldWUucHJvdG90eXBlLm9uVGljayA9IGZ1bmN0aW9uIChkZWx0YSkge1xyXG4gICAgICAgIHZhciB0aW1lID0gdGhpcy5fdGltZSArPSBkZWx0YTtcclxuICAgICAgICBpZiAoKHRoaXMuY3VycmVudCAhPSBudWxsIHx8IHRoaXMubmV4dCgpICE9IG51bGwpKSB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5jdXJyZW50O1xyXG4gICAgICAgICAgICB2YXIgZnJvbSA9IGN1cnJlbnQuZnJvbTtcclxuICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gY3VycmVudC5kdXJhdGlvbjtcclxuICAgICAgICAgICAgdmFyIHRpbWVzID0gY3VycmVudC50aW1lcztcclxuICAgICAgICAgICAgdmFyIGZyYW1lID0gKGR1cmF0aW9uICogdGltZSAvIChkdXJhdGlvbiAqIHRoaXMuX2ZwbXMpKTtcclxuICAgICAgICAgICAgaWYgKHRpbWVzID4gLTEgJiYgdGltZXMgLSAoZnJhbWUgLyBkdXJhdGlvbikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJhbWUgPSBmcm9tICsgKGZyYW1lICUgZHVyYXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIEFuaW1hdGlvblF1ZXVlLnByb3RvdHlwZS5oYXNTdG9wcGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAhdGhpcy5jdXJyZW50ICYmICF0aGlzLmhhc05leHQoKTtcclxuICAgIH07XHJcbiAgICBBbmltYXRpb25RdWV1ZS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbmV4dCA9IF9zdXBlci5wcm90b3R5cGUubmV4dC5jYWxsKHRoaXMpO1xyXG4gICAgICAgIGlmIChuZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5leHQ7XHJcbiAgICB9O1xyXG4gICAgQW5pbWF0aW9uUXVldWUucHJvdG90eXBlLmdldEZyYW1lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZyYW1lO1xyXG4gICAgfTtcclxuICAgIEFuaW1hdGlvblF1ZXVlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9mcmVlemUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl90aW1lID0gdGhpcy5fdGltZSAlIHRoaXMuX2ZwbXM7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEFuaW1hdGlvblF1ZXVlO1xyXG59KFF1ZXVlXzEuUXVldWUpKTtcclxuZXhwb3J0cy5BbmltYXRpb25RdWV1ZSA9IEFuaW1hdGlvblF1ZXVlO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFByb21pc2VfMSA9IHJlcXVpcmUoXCIuLi91dGlsL1Byb21pc2VcIik7XHJcbnZhciBIdHRwUmVxdWVzdCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBIdHRwUmVxdWVzdCgpIHtcclxuICAgIH1cclxuICAgIEh0dHBSZXF1ZXN0LnJlcXVlc3QgPSBmdW5jdGlvbiAobWV0aG9kLCB1cmwsIGFyZ3MpIHtcclxuICAgICAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlXzEuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBjbGllbnQgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgdmFyIHVyaSA9IHVybDtcclxuICAgICAgICAgICAgaWYgKGFyZ3MgJiYgKG1ldGhvZCA9PT0gJ1BPU1QnIHx8IG1ldGhvZCA9PT0gJ1BVVCcpKSB7XHJcbiAgICAgICAgICAgICAgICB1cmkgKz0gJz8nO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZ2NvdW50ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBhcmdzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJnY291bnQrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJpICs9ICcmJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmkgKz0gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoYXJnc1trZXldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2xpZW50Lm9wZW4obWV0aG9kLCB1cmkpO1xyXG4gICAgICAgICAgICBjbGllbnQuc2VuZCgpO1xyXG4gICAgICAgICAgICBjbGllbnQub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdHVzID09PSAyMDAgfHwgdGhpcy5zdGF0dXMgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucmVzcG9uc2UgfHwgdGhpcy5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHRoaXMuc3RhdHVzVGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGNsaWVudC5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHRoaXMuc3RhdHVzVGV4dCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XHJcbiAgICB9O1xyXG4gICAgSHR0cFJlcXVlc3QuZ2V0U3RyaW5nID0gZnVuY3Rpb24gKHVybCwgcXVlcnkpIHtcclxuICAgICAgICBpZiAocXVlcnkgPT09IHZvaWQgMCkgeyBxdWVyeSA9IHt9OyB9XHJcbiAgICAgICAgcmV0dXJuIEh0dHBSZXF1ZXN0LnJlcXVlc3QoJ0dFVCcsIHVybCwgcXVlcnkpO1xyXG4gICAgfTtcclxuICAgIEh0dHBSZXF1ZXN0LmdldEpTT04gPSBmdW5jdGlvbiAodXJsLCBxdWVyeSkge1xyXG4gICAgICAgIGlmIChxdWVyeSA9PT0gdm9pZCAwKSB7IHF1ZXJ5ID0ge307IH1cclxuICAgICAgICByZXR1cm4gSHR0cFJlcXVlc3QuZ2V0U3RyaW5nKHVybCwgcXVlcnkpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gSHR0cFJlcXVlc3Q7XHJcbn0oKSk7XHJcbmV4cG9ydHMuSHR0cFJlcXVlc3QgPSBIdHRwUmVxdWVzdDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBhc2FwID0gKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09ICdmdW5jdGlvbicgJiYgc2V0SW1tZWRpYXRlKSB8fFxyXG4gICAgZnVuY3Rpb24gKGZuKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChmbiwgMSk7XHJcbiAgICB9O1xyXG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XHJcbiAgICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmVG9CaW5kID0gdGhpcywgZk5PUCA9IGZ1bmN0aW9uICgpIHsgfSwgZkJvdW5kID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUFxyXG4gICAgICAgICAgICAgICAgPyB0aGlzXHJcbiAgICAgICAgICAgICAgICA6IG9UaGlzLCBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XHJcbiAgICAgICAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xyXG4gICAgICAgIHJldHVybiBmQm91bmQ7XHJcbiAgICB9O1xyXG59XHJcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBBcnJheV1cIjsgfTtcclxuZnVuY3Rpb24gaGFuZGxlKGRlZmVycmVkKSB7XHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgaWYgKHRoaXMuX3N0YXRlID09PSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5fZGVmZXJyZWRzLnB1c2goZGVmZXJyZWQpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGFzYXAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjYiA9IG1lWydfc3RhdGUnXSA/IGRlZmVycmVkLm9uRnVsZmlsbGVkIDogZGVmZXJyZWQub25SZWplY3RlZDtcclxuICAgICAgICBpZiAoY2IgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgKG1lWydfc3RhdGUnXSA/IGRlZmVycmVkLnJlc29sdmUgOiBkZWZlcnJlZC5yZWplY3QpKG1lLl92YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJldDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXQgPSBjYihtZS5fdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXQpO1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gcmVzb2x2ZShuZXdWYWx1ZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBpZiAobmV3VmFsdWUgPT09IHRoaXMpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0EgcHJvbWlzZSBjYW5ub3QgYmUgcmVzb2x2ZWQgd2l0aCBpdHNlbGYuJyk7XHJcbiAgICAgICAgaWYgKG5ld1ZhbHVlICYmICh0eXBlb2YgbmV3VmFsdWUgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ2Z1bmN0aW9uJykpIHtcclxuICAgICAgICAgICAgdmFyIHRoZW4gPSBuZXdWYWx1ZS50aGVuO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIGRvUmVzb2x2ZSh0aGVuLmJpbmQobmV3VmFsdWUpLCByZXNvbHZlLmJpbmQodGhpcyksIHJlamVjdC5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzWydfc3RhdGUnXSA9IHRydWU7XHJcbiAgICAgICAgdGhpc1snX3ZhbHVlJ10gPSBuZXdWYWx1ZTtcclxuICAgICAgICBmaW5hbGUuY2FsbCh0aGlzKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgcmVqZWN0LmNhbGwodGhpcywgZSk7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gcmVqZWN0KG5ld1ZhbHVlKSB7XHJcbiAgICB0aGlzLl9zdGF0ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5fdmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgIGZpbmFsZS5jYWxsKHRoaXMpO1xyXG59XHJcbmZ1bmN0aW9uIGZpbmFsZSgpIHtcclxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLl9kZWZlcnJlZHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICBoYW5kbGUuY2FsbCh0aGlzLCB0aGlzLl9kZWZlcnJlZHNbaV0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fZGVmZXJyZWRzID0gbnVsbDtcclxufVxyXG5mdW5jdGlvbiBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3QpIHtcclxuICAgIHRoaXMub25GdWxmaWxsZWQgPSB0eXBlb2Ygb25GdWxmaWxsZWQgPT09ICdmdW5jdGlvbicgPyBvbkZ1bGZpbGxlZCA6IG51bGw7XHJcbiAgICB0aGlzLm9uUmVqZWN0ZWQgPSB0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uUmVqZWN0ZWQgOiBudWxsO1xyXG4gICAgdGhpcy5yZXNvbHZlID0gcmVzb2x2ZTtcclxuICAgIHRoaXMucmVqZWN0ID0gcmVqZWN0O1xyXG59XHJcbmZ1bmN0aW9uIGRvUmVzb2x2ZShmbiwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcclxuICAgIHZhciBkb25lID0gZmFsc2U7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGZuKGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoZG9uZSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XHJcbiAgICAgICAgICAgIG9uRnVsZmlsbGVkKHZhbHVlKTtcclxuICAgICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XHJcbiAgICAgICAgICAgIGlmIChkb25lKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcclxuICAgICAgICAgICAgb25SZWplY3RlZChyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgaWYgKGRvbmUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBkb25lID0gdHJ1ZTtcclxuICAgICAgICBvblJlamVjdGVkKGV4KTtcclxuICAgIH1cclxufVxyXG52YXIgUHJvbWlzZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBQcm9taXNlKGluaXQpIHtcclxuICAgICAgICB0aGlzLl9zdGF0ZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2RlZmVycmVkcyA9IFtdO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ29iamVjdCcpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Byb21pc2VzIG11c3QgYmUgY29uc3RydWN0ZWQgdmlhIG5ldycpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgaW5pdCAhPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICBkb1Jlc29sdmUoaW5pdCwgcmVzb2x2ZS5iaW5kKHRoaXMpLCByZWplY3QuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICBQcm9taXNlLmFsbCA9IGZ1bmN0aW9uIChwcm9taXNlTGlzdCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9taXNlTGlzdC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShbXSk7XHJcbiAgICAgICAgICAgIHZhciByZW1haW5pbmcgPSBwcm9taXNlTGlzdC5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlcyhpLCB2YWwpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAmJiAodHlwZW9mIHZhbCA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoZW4gPSB2YWwudGhlbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuLmNhbGwodmFsLCBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzKGksIHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2VMaXN0W2ldID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgtLXJlbWFpbmluZyA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHByb21pc2VMaXN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvbWlzZUxpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHJlcyhpLCBwcm9taXNlTGlzdFtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBQcm9taXNlLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xyXG4gICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBQcm9taXNlLnJlamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHJlamVjdCh2YWx1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgUHJvbWlzZS5yYWNlID0gZnVuY3Rpb24gKHZhbHVlcykge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB2YWx1ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlc1tpXS50aGVuKHJlc29sdmUsIHJlamVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBQcm9taXNlLl9zZXRJbW1lZGlhdGVGbiA9IGZ1bmN0aW9uIChmbikge1xyXG4gICAgICAgIGFzYXAgPSBmbjtcclxuICAgIH07XHJcbiAgICBQcm9taXNlLnByb3RvdHlwZS5jYXRjaCA9IGZ1bmN0aW9uIChvblJlamVjdGVkKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbihudWxsLCBvblJlamVjdGVkKTtcclxuICAgIH07XHJcbiAgICBQcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XHJcbiAgICAgICAgdmFyIG1lID0gdGhpcztcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICBoYW5kbGUuY2FsbChtZSwgbmV3IEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlO1xyXG59KCkpO1xyXG5leHBvcnRzLlByb21pc2UgPSBQcm9taXNlO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFByb21pc2VfMSA9IHJlcXVpcmUoXCIuL1Byb21pc2VcIik7XHJcbnZhciBQcm9taXNlVXRpbCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBQcm9taXNlVXRpbCgpIHtcclxuICAgIH1cclxuICAgIFByb21pc2VVdGlsLndhaXQgPSBmdW5jdGlvbiAobGlzdCwgb25Qcm9ncmVzcykge1xyXG4gICAgICAgIGlmIChvblByb2dyZXNzID09PSB2b2lkIDApIHsgb25Qcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzcykgeyB9OyB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlXzEuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xyXG4gICAgICAgICAgICB2YXIgbmV3TGlzdCA9IFtdO1xyXG4gICAgICAgICAgICB2YXIgdGhlbiA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgbmV3TGlzdC5wdXNoKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIG9uUHJvZ3Jlc3MobmV3TGlzdC5sZW5ndGggLyBsaXN0Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV3TGlzdC5sZW5ndGggPT0gbGlzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG5ld0xpc3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxpc3RbaV0udGhlbih0aGVuKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFByb21pc2VVdGlsLndhaXRGb3JMb2FkYWJsZSA9IGZ1bmN0aW9uIChsaXN0LCBvblByb2dyZXNzKSB7XHJcbiAgICAgICAgaWYgKG9uUHJvZ3Jlc3MgPT09IHZvaWQgMCkgeyBvblByb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzKSB7IH07IH1cclxuICAgICAgICB2YXIgY291bnQgPSBsaXN0Lmxlbmd0aDtcclxuICAgICAgICB2YXIgcHJvZ3Jlc3NMaXN0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHByb2dyZXNzTGlzdC5wdXNoKDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcHJ2UHJvZ3Jlc3MgPSBmdW5jdGlvbiAoaW5kZXgsIHByb2dyZXNzKSB7XHJcbiAgICAgICAgICAgIHByb2dyZXNzTGlzdFtpbmRleF0gPSBwcm9ncmVzcztcclxuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHByb2dyZXNzTGlzdC5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IHByb2dyZXNzTGlzdFtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvblByb2dyZXNzKHRvdGFsIC8gY291bnQpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHByb21pc2VMaXN0ID0gbmV3IEFycmF5KGNvdW50KTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgcHJvbWlzZUxpc3RbaV0gPSBsaXN0W2ldLmxvYWQocHJ2UHJvZ3Jlc3MuYmluZCh0aGlzLCBpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlVXRpbC53YWl0KHByb21pc2VMaXN0KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gUHJvbWlzZVV0aWw7XHJcbn0oKSk7XHJcbmV4cG9ydHMuUHJvbWlzZVV0aWwgPSBQcm9taXNlVXRpbDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBRdWV1ZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBRdWV1ZSgpIHtcclxuICAgICAgICB0aGlzLl9saXN0ID0gW107XHJcbiAgICAgICAgdGhpcy5fbGlzdExlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gbnVsbDtcclxuICAgIH1cclxuICAgIFF1ZXVlLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAoaXRlbSkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QucHVzaChpdGVtKTtcclxuICAgICAgICB0aGlzLl9saXN0TGVuZ3RoKys7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgUXVldWUucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5raWxsKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuX2xpc3RMZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2xpc3Quc2hpZnQoKTtcclxuICAgICAgICAgICAgdGhpcy5fbGlzdExlbmd0aC0tO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuICAgIH07XHJcbiAgICBRdWV1ZS5wcm90b3R5cGUuaGFzTmV4dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbGlzdExlbmd0aCA+IDA7XHJcbiAgICB9O1xyXG4gICAgUXVldWUucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uIChhbGwpIHtcclxuICAgICAgICBpZiAoYWxsID09PSB2b2lkIDApIHsgYWxsID0gZmFsc2U7IH1cclxuICAgICAgICBpZiAoYWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3QubGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgdGhpcy5fbGlzdExlbmd0aCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50LnRpbWVzID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgUXVldWUucHJvdG90eXBlLmtpbGwgPSBmdW5jdGlvbiAoYWxsKSB7XHJcbiAgICAgICAgaWYgKGFsbCA9PT0gdm9pZCAwKSB7IGFsbCA9IGZhbHNlOyB9XHJcbiAgICAgICAgaWYgKGFsbCkge1xyXG4gICAgICAgICAgICB0aGlzLl9saXN0Lmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3RMZW5ndGggPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50KSB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5jdXJyZW50O1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBudWxsO1xyXG4gICAgICAgICAgICBjdXJyZW50LmZpbmlzaCgpO1xyXG4gICAgICAgICAgICBjdXJyZW50LmRlc3RydWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBRdWV1ZTtcclxufSgpKTtcclxuZXhwb3J0cy5RdWV1ZSA9IFF1ZXVlO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFF1ZXVlSXRlbSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBRdWV1ZUl0ZW0obGFiZWwsIGZyb20sIHRvLCB0aW1lcywgZGVsYXkpIHtcclxuICAgICAgICBpZiAodGltZXMgPT09IHZvaWQgMCkgeyB0aW1lcyA9IDE7IH1cclxuICAgICAgICBpZiAoZGVsYXkgPT09IHZvaWQgMCkgeyBkZWxheSA9IDA7IH1cclxuICAgICAgICB0aGlzLl9jb21wbGV0ZSA9IG51bGw7XHJcbiAgICAgICAgaWYgKGZyb20gPiB0bykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FyZ3VtZW50IFwiZnJvbVwiIGNhbm5vdCBiZSBiaWdnZXIgdGhhbiBhcmd1bWVudCBcInRvXCInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xyXG4gICAgICAgIHRoaXMuZnJvbSA9IGZyb207XHJcbiAgICAgICAgdGhpcy50byA9IHRvO1xyXG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSB0byAtIGZyb207XHJcbiAgICAgICAgdGhpcy50aW1lcyA9IHRpbWVzO1xyXG4gICAgICAgIHRoaXMuZGVsYXkgPSBkZWxheTtcclxuICAgIH1cclxuICAgIFF1ZXVlSXRlbS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChjb21wbGV0ZSkge1xyXG4gICAgICAgIHRoaXMuX2NvbXBsZXRlID0gY29tcGxldGU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgUXVldWVJdGVtLnByb3RvdHlwZS5maW5pc2ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2NvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbXBsZXRlLmNhbGwodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIFF1ZXVlSXRlbS5wcm90b3R5cGUuZGVzdHJ1Y3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5sYWJlbCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fY29tcGxldGUgPSBudWxsO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBRdWV1ZUl0ZW07XHJcbn0oKSk7XHJcbmV4cG9ydHMuUXVldWVJdGVtID0gUXVldWVJdGVtO1xyXG4iXX0=

//# sourceMappingURL=pixi-flump.js.map
