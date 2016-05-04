/**
 * @license
 * pixi-flump.js - v1.0.0
 * Compiled 2016-05-04T20:28:21.196Z
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
            this.addChild(movieLayers[i]);
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
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var FlumpMtx_1 = require("./FlumpMtx");
var FlumpMovie_1 = require("./FlumpMovie");
var LabelData_1 = require("../data/LabelData");
var KeyframeData_1 = require("../data/KeyframeData");
var MovieLayer = (function (_super) {
    __extends(MovieLayer, _super);
    function MovieLayer(index, movie, library, layerData) {
        _super.call(this);
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
                this._movie.removeChild(this._symbol);
                this._symbol = this._symbols[keyframe.ref];
                if (this._symbol instanceof FlumpMovie_1.FlumpMovie) {
                    this._symbol.reset();
                }
                this._movie.addChild(this._symbol);
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
}(PIXI.Container));
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
var FlumpLibrary_1 = require("./FlumpLibrary");
module.exports = FlumpLibrary_1.FlumpLibrary;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvRmx1bXBMaWJyYXJ5LmpzIiwic3JjL2NvcmUvRmx1bXBNb3ZpZS5qcyIsInNyYy9jb3JlL0ZsdW1wTXR4LmpzIiwic3JjL2NvcmUvTW92aWVMYXllci5qcyIsInNyYy9jb3JlL1RleHR1cmVHcm91cC5qcyIsInNyYy9jb3JlL1RleHR1cmVHcm91cEF0bGFzLmpzIiwic3JjL2RhdGEvS2V5ZnJhbWVEYXRhLmpzIiwic3JjL2RhdGEvTGFiZWxEYXRhLmpzIiwic3JjL2RhdGEvTGF5ZXJEYXRhLmpzIiwic3JjL2RhdGEvTW92aWVEYXRhLmpzIiwic3JjL2luZGV4Iiwic3JjL3V0aWwvQW5pbWF0aW9uUXVldWUuanMiLCJzcmMvdXRpbC9IdHRwUmVxdWVzdC5qcyIsInNyYy91dGlsL1Byb21pc2UuanMiLCJzcmMvdXRpbC9Qcm9taXNlVXRpbC5qcyIsInNyYy91dGlsL1F1ZXVlLmpzIiwic3JjL3V0aWwvUXVldWVJdGVtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4vdXRpbC9Qcm9taXNlXCIpO1xyXG52YXIgSHR0cFJlcXVlc3RfMSA9IHJlcXVpcmUoXCIuL3V0aWwvSHR0cFJlcXVlc3RcIik7XHJcbnZhciBQcm9taXNlVXRpbF8xID0gcmVxdWlyZShcIi4vdXRpbC9Qcm9taXNlVXRpbFwiKTtcclxudmFyIFRleHR1cmVHcm91cF8xID0gcmVxdWlyZShcIi4vY29yZS9UZXh0dXJlR3JvdXBcIik7XHJcbnZhciBGbHVtcE1vdmllXzEgPSByZXF1aXJlKFwiLi9jb3JlL0ZsdW1wTW92aWVcIik7XHJcbnZhciBNb3ZpZURhdGFfMSA9IHJlcXVpcmUoXCIuL2RhdGEvTW92aWVEYXRhXCIpO1xyXG52YXIgUXVldWVJdGVtXzEgPSByZXF1aXJlKFwiLi91dGlsL1F1ZXVlSXRlbVwiKTtcclxudmFyIEZsdW1wTGlicmFyeSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBGbHVtcExpYnJhcnkoYmFzZVBhdGgpIHtcclxuICAgICAgICB0aGlzLm1vdmllRGF0YSA9IFtdO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZUdyb3VwcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZnBzID0gMDtcclxuICAgICAgICB0aGlzLmlzT3B0aW1pc2VkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5faGFzTG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5faXNMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGEgPSAwO1xyXG4gICAgICAgIGlmIChiYXNlUGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnVybCA9IGJhc2VQYXRoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIEZsdW1wTGlicmFyeS5sb2FkID0gZnVuY3Rpb24gKHVybCwgbGlicmFyeSwgb25Qcm9jZXNzKSB7XHJcbiAgICAgICAgdmFyIGJhc2VEaXIgPSB1cmw7XHJcbiAgICAgICAgaWYgKHVybC5pbmRleE9mKCcuanNvbicpID4gLTEpIHtcclxuICAgICAgICAgICAgYmFzZURpciA9IHVybC5zdWJzdHIoMCwgdXJsLmxhc3RJbmRleE9mKCcvJykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGJhc2VEaXIuc3Vic3RyKC0xKSA9PSAnLycpIHtcclxuICAgICAgICAgICAgICAgIGJhc2VEaXIgPSBiYXNlRGlyLnN1YnN0cigwLCBiYXNlRGlyLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHVybCArPSAodXJsLnN1YnN0cih1cmwubGVuZ3RoIC0gMSkgIT0gJy8nID8gJy8nIDogJycpICsgJ2xpYnJhcnkuanNvbic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsaWJyYXJ5ID09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICBsaWJyYXJ5ID0gbmV3IEZsdW1wTGlicmFyeShiYXNlRGlyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxpYnJhcnkudXJsID0gYmFzZURpcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEh0dHBSZXF1ZXN0XzEuSHR0cFJlcXVlc3QuZ2V0SlNPTih1cmwpLnRoZW4oZnVuY3Rpb24gKGpzb24pIHsgcmV0dXJuIGxpYnJhcnkucHJvY2Vzc0RhdGEoanNvbiwgb25Qcm9jZXNzKTsgfSk7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBMaWJyYXJ5LnByb3RvdHlwZS5oYXNMb2FkZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhc0xvYWRlZDtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLmlzTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNMb2FkaW5nO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChvblByb2dyZXNzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzTG9hZGVkKCkpIHtcclxuICAgICAgICAgICAgb25Qcm9ncmVzcygxKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2VfMS5Qcm9taXNlLnJlc29sdmUodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy51cmwpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1cmwgaXMgbm90IHNldCBhbmQgdGhlcmUgZm9yIGNhbiBub3QgYmUgbG9hZGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBGbHVtcExpYnJhcnkubG9hZCh0aGlzLnVybCwgdGhpcywgb25Qcm9ncmVzcykuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBsb2FkIGxpYnJhcnknKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLnByb2Nlc3NEYXRhID0gZnVuY3Rpb24gKGpzb24sIG9uUHJvY2Vzcykge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5tZDUgPSBqc29uLm1kNTtcclxuICAgICAgICB0aGlzLmZyYW1lUmF0ZSA9IGpzb24uZnJhbWVSYXRlO1xyXG4gICAgICAgIHRoaXMucmVmZXJlbmNlTGlzdCA9IGpzb24ucmVmZXJlbmNlTGlzdCB8fCBudWxsO1xyXG4gICAgICAgIHRoaXMuaXNPcHRpbWlzZWQgPSBqc29uLm9wdGltaXNlZCB8fCBmYWxzZTtcclxuICAgICAgICB2YXIgdGV4dHVyZUdyb3VwTG9hZGVycyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvbi5tb3ZpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG1vdmllRGF0YSA9IG5ldyBNb3ZpZURhdGFfMS5Nb3ZpZURhdGEodGhpcywganNvbi5tb3ZpZXNbaV0pO1xyXG4gICAgICAgICAgICB0aGlzLm1vdmllRGF0YS5wdXNoKG1vdmllRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0ZXh0dXJlR3JvdXBzID0ganNvbi50ZXh0dXJlR3JvdXBzO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dHVyZUdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgdGV4dHVyZUdyb3VwID0gdGV4dHVyZUdyb3Vwc1tpXTtcclxuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBUZXh0dXJlR3JvdXBfMS5UZXh0dXJlR3JvdXAubG9hZCh0aGlzLCB0ZXh0dXJlR3JvdXApO1xyXG4gICAgICAgICAgICB0ZXh0dXJlR3JvdXBMb2FkZXJzLnB1c2gocHJvbWlzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlVXRpbF8xLlByb21pc2VVdGlsLndhaXQodGV4dHVyZUdyb3VwTG9hZGVycywgb25Qcm9jZXNzKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAodGV4dHVyZUdyb3Vwcykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHR1cmVHcm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0dXJlR3JvdXAgPSB0ZXh0dXJlR3JvdXBzW2ldO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMudGV4dHVyZUdyb3Vwcy5wdXNoKHRleHR1cmVHcm91cCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3RoaXMuX2hhc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiBfdGhpcztcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLmdldE1vdmllRGF0YSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1vdmllRGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbW92aWVEYXRhID0gdGhpcy5tb3ZpZURhdGFbaV07XHJcbiAgICAgICAgICAgIGlmIChtb3ZpZURhdGEuaWQgPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vdmllRGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vdmllIG5vdCBmb3VuZCcpO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUuY3JlYXRlU3ltYm9sID0gZnVuY3Rpb24gKG5hbWUsIHBhdXNlZCkge1xyXG4gICAgICAgIGlmIChwYXVzZWQgPT09IHZvaWQgMCkgeyBwYXVzZWQgPSBmYWxzZTsgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50ZXh0dXJlR3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0dXJlcyA9IHRoaXMudGV4dHVyZUdyb3Vwc1tpXS5zcHJpdGVzO1xyXG4gICAgICAgICAgICBpZiAobmFtZSBpbiB0ZXh0dXJlcykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRleHR1cmVzW25hbWVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tb3ZpZURhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG1vdmllRGF0YSA9IHRoaXMubW92aWVEYXRhW2ldO1xyXG4gICAgICAgICAgICBpZiAobW92aWVEYXRhLmlkID09IG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtb3ZpZSA9IG5ldyBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSh0aGlzLCBuYW1lKTtcclxuICAgICAgICAgICAgICAgIG1vdmllLmdldFF1ZXVlKCkuYWRkKG5ldyBRdWV1ZUl0ZW1fMS5RdWV1ZUl0ZW0obnVsbCwgMCwgbW92aWUuZnJhbWVzLCAtMSwgMCkpO1xyXG4gICAgICAgICAgICAgICAgbW92aWUucGF1c2VkID0gcGF1c2VkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vdmllO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUud2Fybignbm8gX3N5bWJvbCBmb3VuZDogKCcgKyBuYW1lICsgJyknKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBfc3ltYm9sIGZvdW5kXCIpO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUuY3JlYXRlTW92aWUgPSBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgICB2YXIgbmFtZTtcclxuICAgICAgICBuYW1lID0gaWQ7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1vdmllRGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbW92aWVEYXRhID0gdGhpcy5tb3ZpZURhdGFbaV07XHJcbiAgICAgICAgICAgIGlmIChtb3ZpZURhdGEuaWQgPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vdmllID0gbmV3IEZsdW1wTW92aWVfMS5GbHVtcE1vdmllKHRoaXMsIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgbW92aWUucGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtb3ZpZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oJ25vIF9zeW1ib2wgZm91bmQ6ICgnICsgbmFtZSArICcpICcsIHRoaXMpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vIF9zeW1ib2wgZm91bmQ6IFwiICsgdGhpcyk7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBMaWJyYXJ5LnByb3RvdHlwZS5nZXROYW1lRnJvbVJlZmVyZW5jZUxpc3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICBpZiAodGhpcy5yZWZlcmVuY2VMaXN0ICYmIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZlcmVuY2VMaXN0W3ZhbHVlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5FVkVOVF9MT0FEID0gJ2xvYWQnO1xyXG4gICAgcmV0dXJuIEZsdW1wTGlicmFyeTtcclxufSgpKTtcclxuZXhwb3J0cy5GbHVtcExpYnJhcnkgPSBGbHVtcExpYnJhcnk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59O1xyXG52YXIgQW5pbWF0aW9uUXVldWVfMSA9IHJlcXVpcmUoXCIuLi91dGlsL0FuaW1hdGlvblF1ZXVlXCIpO1xyXG52YXIgUXVldWVJdGVtXzEgPSByZXF1aXJlKFwiLi4vdXRpbC9RdWV1ZUl0ZW1cIik7XHJcbnZhciBNb3ZpZUxheWVyXzEgPSByZXF1aXJlKFwiLi4vY29yZS9Nb3ZpZUxheWVyXCIpO1xyXG52YXIgRmx1bXBNb3ZpZSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoRmx1bXBNb3ZpZSwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIEZsdW1wTW92aWUobGlicmFyeSwgbmFtZSkge1xyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX2xhYmVscyA9IHt9O1xyXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gbnVsbDtcclxuICAgICAgICB0aGlzLmhhc0ZyYW1lQ2FsbGJhY2tzID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZnJhbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuZnJhbWVzID0gMDtcclxuICAgICAgICB0aGlzLnNwZWVkID0gMTtcclxuICAgICAgICB0aGlzLmZwcyA9IDE7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLl9saWJyYXJ5ID0gbGlicmFyeTtcclxuICAgICAgICB0aGlzLl9tb3ZpZURhdGEgPSBsaWJyYXJ5LmdldE1vdmllRGF0YShuYW1lKTtcclxuICAgICAgICB2YXIgbGF5ZXJzID0gdGhpcy5fbW92aWVEYXRhLmxheWVyRGF0YTtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gbGF5ZXJzLmxlbmd0aDtcclxuICAgICAgICB2YXIgbW92aWVMYXllcnMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXllckRhdGEgPSBsYXllcnNbaV07XHJcbiAgICAgICAgICAgIG1vdmllTGF5ZXJzW2ldID0gbmV3IE1vdmllTGF5ZXJfMS5Nb3ZpZUxheWVyKGksIHRoaXMsIGxpYnJhcnksIGxheWVyRGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQobW92aWVMYXllcnNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9tb3ZpZUxheWVycyA9IG1vdmllTGF5ZXJzO1xyXG4gICAgICAgIHRoaXMuZnJhbWVzID0gdGhpcy5fbW92aWVEYXRhLmZyYW1lcztcclxuICAgICAgICB0aGlzLl9mcmFtZUNhbGxiYWNrID0gbmV3IEFycmF5KHRoaXMuZnJhbWVzKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnJhbWVzOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWVDYWxsYmFja1tpXSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZnBzID0gbGlicmFyeS5mcmFtZVJhdGU7XHJcbiAgICAgICAgdGhpcy5nZXRRdWV1ZSgpO1xyXG4gICAgfVxyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUuc2V0TGFiZWwgPSBmdW5jdGlvbiAobmFtZSwgZGF0YSkge1xyXG4gICAgICAgIHRoaXMuX2xhYmVsc1tuYW1lXSA9IGRhdGE7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUuZ2V0UXVldWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9xdWV1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZSA9IG5ldyBBbmltYXRpb25RdWV1ZV8xLkFuaW1hdGlvblF1ZXVlKHRoaXMuZnBzLCAxMDAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXVlO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbiAodGltZXMsIGxhYmVsLCBjb21wbGV0ZSkge1xyXG4gICAgICAgIGlmICh0aW1lcyA9PT0gdm9pZCAwKSB7IHRpbWVzID0gMTsgfVxyXG4gICAgICAgIGlmIChsYWJlbCA9PT0gdm9pZCAwKSB7IGxhYmVsID0gbnVsbDsgfVxyXG4gICAgICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XHJcbiAgICAgICAgaWYgKGxhYmVsIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgaWYgKGxhYmVsLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcXVldWUgPSBuZXcgUXVldWVJdGVtXzEuUXVldWVJdGVtKG51bGwsIGxhYmVsWzBdLCB0aGlzLmZyYW1lcywgdGltZXMsIDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHF1ZXVlID0gbmV3IFF1ZXVlSXRlbV8xLlF1ZXVlSXRlbShudWxsLCBsYWJlbFswXSwgbGFiZWxbMV0sIHRpbWVzLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChsYWJlbCA9PSBudWxsIHx8IGxhYmVsID09ICcqJykge1xyXG4gICAgICAgICAgICB2YXIgcXVldWUgPSBuZXcgUXVldWVJdGVtXzEuUXVldWVJdGVtKG51bGwsIDAsIHRoaXMuZnJhbWVzLCB0aW1lcywgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgcXVldWVMYWJlbCA9IHRoaXMuX2xhYmVsc1tsYWJlbF07XHJcbiAgICAgICAgICAgIGlmICghcXVldWVMYWJlbCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGxhYmVsOicgKyBxdWV1ZUxhYmVsICsgJyB8ICcgKyB0aGlzLm5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBxdWV1ZSA9IG5ldyBRdWV1ZUl0ZW1fMS5RdWV1ZUl0ZW0ocXVldWVMYWJlbC5sYWJlbCwgcXVldWVMYWJlbC5pbmRleCwgcXVldWVMYWJlbC5kdXJhdGlvbiwgdGltZXMsIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29tcGxldGUpIHtcclxuICAgICAgICAgICAgcXVldWUudGhlbihjb21wbGV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3F1ZXVlLmFkZChxdWV1ZSk7XHJcbiAgICAgICAgaWYgKGNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgIHF1ZXVlLnRoZW4oY29tcGxldGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAoYWxsKSB7XHJcbiAgICAgICAgaWYgKGFsbCA9PT0gdm9pZCAwKSB7IGFsbCA9IGZhbHNlOyB9XHJcbiAgICAgICAgdGhpcy5fcXVldWUuZW5kKGFsbCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fcXVldWUua2lsbCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3F1ZXVlLm5leHQoKTtcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5raWxsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX3F1ZXVlLmtpbGwoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5zZXRGcmFtZUNhbGxiYWNrID0gZnVuY3Rpb24gKGZyYW1lTnVtYmVyLCBjYWxsYmFjaywgdHJpZ2dlck9uY2UpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIGlmICh0cmlnZ2VyT25jZSA9PT0gdm9pZCAwKSB7IHRyaWdnZXJPbmNlID0gZmFsc2U7IH1cclxuICAgICAgICB0aGlzLmhhc0ZyYW1lQ2FsbGJhY2tzID0gdHJ1ZTtcclxuICAgICAgICBpZiAodHJpZ2dlck9uY2UpIHtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWVDYWxsYmFja1tmcmFtZU51bWJlcl0gPSBmdW5jdGlvbiAoZGVsdGEpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoX3RoaXMsIGRlbHRhKTtcclxuICAgICAgICAgICAgICAgIF90aGlzLnNldEZyYW1lQ2FsbGJhY2soZnJhbWVOdW1iZXIsIG51bGwpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWVDYWxsYmFja1tmcmFtZU51bWJlcl0gPSBjYWxsYmFjaztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUuZ290b0FuZFN0b3AgPSBmdW5jdGlvbiAoZnJhbWVPckxhYmVsKSB7XHJcbiAgICAgICAgdmFyIGZyYW1lO1xyXG4gICAgICAgIGlmICh0eXBlb2YgZnJhbWVPckxhYmVsID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBmcmFtZSA9IHRoaXMuX2xhYmVsc1tmcmFtZU9yTGFiZWxdLmluZGV4O1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZnJhbWUgPSBmcmFtZU9yTGFiZWw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBxdWV1ZSA9IG5ldyBRdWV1ZUl0ZW1fMS5RdWV1ZUl0ZW0obnVsbCwgZnJhbWUsIDEsIDEsIDApO1xyXG4gICAgICAgIHRoaXMuX3F1ZXVlLmFkZChxdWV1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUub25UaWNrID0gZnVuY3Rpb24gKGRlbHRhLCBhY2N1bXVsYXRlZCkge1xyXG4gICAgICAgIHZhciBtb3ZpZUxheWVycyA9IHRoaXMuX21vdmllTGF5ZXJzO1xyXG4gICAgICAgIGRlbHRhICo9IHRoaXMuc3BlZWQ7XHJcbiAgICAgICAgaWYgKHRoaXMucGF1c2VkID09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlLm9uVGljayhkZWx0YSk7XHJcbiAgICAgICAgICAgIHZhciBmcmFtZSA9IHRoaXMuZnJhbWU7XHJcbiAgICAgICAgICAgIHZhciBuZXdGcmFtZSA9IHRoaXMuX3F1ZXVlLmdldEZyYW1lKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW92aWVMYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBsYXllciA9IG1vdmllTGF5ZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIub25UaWNrKGRlbHRhLCBhY2N1bXVsYXRlZCk7XHJcbiAgICAgICAgICAgICAgICBsYXllci5zZXRGcmFtZShuZXdGcmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5mcmFtZSA9IG5ld0ZyYW1lO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5nZXRTeW1ib2wgPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgIHZhciBsYXllcnMgPSB0aGlzLl9tb3ZpZUxheWVycztcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNbaV07XHJcbiAgICAgICAgICAgIHZhciBzeW1ib2wgPSBsYXllci5nZXRTeW1ib2wobmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChzeW1ib2wgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN5bWJvbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5yZXBsYWNlU3ltYm9sID0gZnVuY3Rpb24gKG5hbWUsIHN5bWJvbCkge1xyXG4gICAgICAgIHZhciBsYXllcnMgPSB0aGlzLl9tb3ZpZUxheWVycztcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNbaV07XHJcbiAgICAgICAgICAgIGlmIChsYXllci5yZXBsYWNlU3ltYm9sKG5hbWUsIHN5bWJvbCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5oYW5kbGVGcmFtZUNhbGxiYWNrID0gZnVuY3Rpb24gKGZyb21GcmFtZSwgdG9GcmFtZSwgZGVsdGEpIHtcclxuICAgICAgICBpZiAodG9GcmFtZSA+IGZyb21GcmFtZSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IGZyb21GcmFtZTsgaW5kZXggPCB0b0ZyYW1lOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZnJhbWVDYWxsYmFja1tpbmRleF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9mcmFtZUNhbGxiYWNrW2luZGV4XS5jYWxsKHRoaXMsIGRlbHRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0b0ZyYW1lIDwgZnJvbUZyYW1lKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gZnJvbUZyYW1lOyBpbmRleCA8IHRoaXMuZnJhbWVzOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZnJhbWVDYWxsYmFja1tpbmRleF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9mcmFtZUNhbGxiYWNrW2luZGV4XS5jYWxsKHRoaXMsIGRlbHRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdG9GcmFtZTsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZyYW1lQ2FsbGJhY2tbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZnJhbWVDYWxsYmFja1tpbmRleF0uY2FsbCh0aGlzLCBkZWx0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGxheWVycyA9IHRoaXMuX21vdmllTGF5ZXJzO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXllciA9IGxheWVyc1tpXTtcclxuICAgICAgICAgICAgbGF5ZXIucmVzZXQoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEZsdW1wTW92aWU7XHJcbn0oUElYSS5Db250YWluZXIpKTtcclxuZXhwb3J0cy5GbHVtcE1vdmllID0gRmx1bXBNb3ZpZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBGbHVtcE10eCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBGbHVtcE10eChhLCBiLCBjLCBkLCB0eCwgdHkpIHtcclxuICAgICAgICB0aGlzLmEgPSBhO1xyXG4gICAgICAgIHRoaXMuYiA9IGI7XHJcbiAgICAgICAgdGhpcy5jID0gYztcclxuICAgICAgICB0aGlzLmQgPSBkO1xyXG4gICAgICAgIHRoaXMudHggPSB0eDtcclxuICAgICAgICB0aGlzLnR5ID0gdHk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gRmx1bXBNdHg7XHJcbn0oKSk7XHJcbmV4cG9ydHMuRmx1bXBNdHggPSBGbHVtcE10eDtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn07XHJcbnZhciBGbHVtcE10eF8xID0gcmVxdWlyZShcIi4vRmx1bXBNdHhcIik7XHJcbnZhciBGbHVtcE1vdmllXzEgPSByZXF1aXJlKFwiLi9GbHVtcE1vdmllXCIpO1xyXG52YXIgTGFiZWxEYXRhXzEgPSByZXF1aXJlKFwiLi4vZGF0YS9MYWJlbERhdGFcIik7XHJcbnZhciBLZXlmcmFtZURhdGFfMSA9IHJlcXVpcmUoXCIuLi9kYXRhL0tleWZyYW1lRGF0YVwiKTtcclxudmFyIE1vdmllTGF5ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKE1vdmllTGF5ZXIsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBNb3ZpZUxheWVyKGluZGV4LCBtb3ZpZSwgbGlicmFyeSwgbGF5ZXJEYXRhKSB7XHJcbiAgICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gJyc7XHJcbiAgICAgICAgdGhpcy5fZnJhbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuX3N5bWJvbHMgPSB7fTtcclxuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX3N0b3JlZE10eCA9IG5ldyBGbHVtcE10eF8xLkZsdW1wTXR4KDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gICAgICAgIHZhciBrZXlmcmFtZURhdGEgPSBsYXllckRhdGEua2V5ZnJhbWVEYXRhO1xyXG4gICAgICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgdGhpcy5fbW92aWUgPSBtb3ZpZTtcclxuICAgICAgICB0aGlzLl9sYXllckRhdGEgPSBsYXllckRhdGE7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbGF5ZXJEYXRhLm5hbWU7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlmcmFtZURhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGtleWZyYW1lID0ga2V5ZnJhbWVEYXRhW2ldO1xyXG4gICAgICAgICAgICBpZiAoa2V5ZnJhbWUubGFiZWwpIHtcclxuICAgICAgICAgICAgICAgIG1vdmllLnNldExhYmVsKGtleWZyYW1lLmxhYmVsLCBuZXcgTGFiZWxEYXRhXzEuTGFiZWxEYXRhKGtleWZyYW1lLmxhYmVsLCBrZXlmcmFtZS5pbmRleCwga2V5ZnJhbWUuZHVyYXRpb24pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoKGtleWZyYW1lLnJlZiAhPSAtMSAmJiBrZXlmcmFtZS5yZWYgIT0gbnVsbCkgJiYgKGtleWZyYW1lLnJlZiBpbiB0aGlzLl9zeW1ib2xzKSA9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3ltYm9sc1trZXlmcmFtZS5yZWZdID0gbGlicmFyeS5jcmVhdGVTeW1ib2woa2V5ZnJhbWUucmVmLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRGcmFtZSgwKTtcclxuICAgIH1cclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLmdldFN5bWJvbCA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgdmFyIHN5bWJvbHMgPSB0aGlzLl9zeW1ib2xzO1xyXG4gICAgICAgIGZvciAodmFyIHZhbCBpbiBzeW1ib2xzKSB7XHJcbiAgICAgICAgICAgIHZhciBzeW1ib2wgPSBzeW1ib2xzW3ZhbF07XHJcbiAgICAgICAgICAgIGlmIChzeW1ib2wgaW5zdGFuY2VvZiBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHN5bWJvbC5uYW1lID09IG5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBzeW1ib2wuZ2V0U3ltYm9sKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLnJlcGxhY2VTeW1ib2wgPSBmdW5jdGlvbiAobmFtZSwgaXRlbSkge1xyXG4gICAgICAgIHZhciBzeW1ib2xzID0gdGhpcy5fc3ltYm9scztcclxuICAgICAgICBmb3IgKHZhciB2YWwgaW4gc3ltYm9scykge1xyXG4gICAgICAgICAgICB2YXIgc3ltYm9sID0gc3ltYm9sc1t2YWxdO1xyXG4gICAgICAgICAgICBpZiAoc3ltYm9sLm5hbWUgPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fc3ltYm9sc1t2YWxdID0gaXRlbTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHN5bWJvbCBpbnN0YW5jZW9mIEZsdW1wTW92aWVfMS5GbHVtcE1vdmllICYmIHN5bWJvbC5yZXBsYWNlU3ltYm9sKG5hbWUsIGl0ZW0pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG4gICAgTW92aWVMYXllci5wcm90b3R5cGUub25UaWNrID0gZnVuY3Rpb24gKGRlbHRhLCBhY2N1bXVsYXRlZCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9zeW1ib2wgIT0gbnVsbCAmJiAodGhpcy5fc3ltYm9sIGluc3RhbmNlb2YgRmx1bXBNb3ZpZV8xLkZsdW1wTW92aWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N5bWJvbC5vblRpY2soZGVsdGEsIGFjY3VtdWxhdGVkKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgTW92aWVMYXllci5wcm90b3R5cGUuc2V0RnJhbWUgPSBmdW5jdGlvbiAoZnJhbWUpIHtcclxuICAgICAgICB2YXIga2V5ZnJhbWUgPSB0aGlzLl9sYXllckRhdGEuZ2V0S2V5ZnJhbWVGb3JGcmFtZShNYXRoLmZsb29yKGZyYW1lKSk7XHJcbiAgICAgICAgaWYgKGtleWZyYW1lLnJlZiAhPSAtMSAmJiBrZXlmcmFtZS5yZWYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fc3ltYm9sICE9IHRoaXMuX3N5bWJvbHNba2V5ZnJhbWUucmVmXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aWUucmVtb3ZlQ2hpbGQodGhpcy5fc3ltYm9sKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N5bWJvbCA9IHRoaXMuX3N5bWJvbHNba2V5ZnJhbWUucmVmXTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zeW1ib2wgaW5zdGFuY2VvZiBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N5bWJvbC5yZXNldCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aWUuYWRkQ2hpbGQodGhpcy5fc3ltYm9sKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNldEtleWZyYW1lRGF0YSh0aGlzLl9zeW1ib2wsIGtleWZyYW1lLCBmcmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9zeW1ib2wgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBNb3ZpZUxheWVyLnByb3RvdHlwZS5zZXRLZXlmcmFtZURhdGEgPSBmdW5jdGlvbiAoc3ltYm9sLCBrZXlmcmFtZSwgZnJhbWUpIHtcclxuICAgICAgICB2YXIgc2luWCA9IDAuMDtcclxuICAgICAgICB2YXIgY29zWCA9IDEuMDtcclxuICAgICAgICB2YXIgc2luWSA9IDAuMDtcclxuICAgICAgICB2YXIgY29zWSA9IDEuMDtcclxuICAgICAgICB2YXIgeCA9IGtleWZyYW1lLng7XHJcbiAgICAgICAgdmFyIHkgPSBrZXlmcmFtZS55O1xyXG4gICAgICAgIHZhciBzY2FsZVggPSBrZXlmcmFtZS5zY2FsZVg7XHJcbiAgICAgICAgdmFyIHNjYWxlWSA9IGtleWZyYW1lLnNjYWxlWTtcclxuICAgICAgICB2YXIgc2tld1ggPSBrZXlmcmFtZS5za2V3WDtcclxuICAgICAgICB2YXIgc2tld1kgPSBrZXlmcmFtZS5za2V3WTtcclxuICAgICAgICB2YXIgcGl2b3RYID0ga2V5ZnJhbWUucGl2b3RYO1xyXG4gICAgICAgIHZhciBwaXZvdFkgPSBrZXlmcmFtZS5waXZvdFk7XHJcbiAgICAgICAgdmFyIGFscGhhID0ga2V5ZnJhbWUuYWxwaGE7XHJcbiAgICAgICAgdmFyIGVhc2U7XHJcbiAgICAgICAgdmFyIGludGVycGVkO1xyXG4gICAgICAgIHZhciBuZXh0S2V5ZnJhbWU7XHJcbiAgICAgICAgaWYgKGtleWZyYW1lLmluZGV4IDwgZnJhbWUgJiYga2V5ZnJhbWUudHdlZW5lZCkge1xyXG4gICAgICAgICAgICBuZXh0S2V5ZnJhbWUgPSB0aGlzLl9sYXllckRhdGEuZ2V0S2V5ZnJhbWVBZnRlcihrZXlmcmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChuZXh0S2V5ZnJhbWUgaW5zdGFuY2VvZiBLZXlmcmFtZURhdGFfMS5LZXlmcmFtZURhdGEpIHtcclxuICAgICAgICAgICAgICAgIGludGVycGVkID0gKGZyYW1lIC0ga2V5ZnJhbWUuaW5kZXgpIC8ga2V5ZnJhbWUuZHVyYXRpb247XHJcbiAgICAgICAgICAgICAgICBlYXNlID0ga2V5ZnJhbWUuZWFzZTtcclxuICAgICAgICAgICAgICAgIGlmIChlYXNlICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdCA9IDAuMDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZWFzZSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGludiA9IDEgLSBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IDEgLSBpbnYgKiBpbnY7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVhc2UgPSAwIC0gZWFzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSBpbnRlcnBlZCAqIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpbnRlcnBlZCA9IGVhc2UgKiB0ICsgKDEgLSBlYXNlKSAqIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgeCA9IHggKyAobmV4dEtleWZyYW1lLnggLSB4KSAqIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgeSA9IHkgKyAobmV4dEtleWZyYW1lLnkgLSB5KSAqIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgc2NhbGVYID0gc2NhbGVYICsgKG5leHRLZXlmcmFtZS5zY2FsZVggLSBzY2FsZVgpICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICBzY2FsZVkgPSBzY2FsZVkgKyAobmV4dEtleWZyYW1lLnNjYWxlWSAtIHNjYWxlWSkgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgIHNrZXdYID0gc2tld1ggKyAobmV4dEtleWZyYW1lLnNrZXdYIC0gc2tld1gpICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICBza2V3WSA9IHNrZXdZICsgKG5leHRLZXlmcmFtZS5za2V3WSAtIHNrZXdZKSAqIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgYWxwaGEgPSBhbHBoYSArIChuZXh0S2V5ZnJhbWUuYWxwaGEgLSBhbHBoYSkgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBzeW1ib2wuc2V0VHJhbnNmb3JtKHgsIHksIHNjYWxlWCwgc2NhbGVZLCAwLCBza2V3WCwgc2tld1ksIHBpdm90WCwgcGl2b3RZKTtcclxuICAgICAgICBzeW1ib2wudmlzaWJsZSA9IGtleWZyYW1lLnZpc2libGU7XHJcbiAgICAgICAgc3ltYm9sLmFscGhhID0gYWxwaGE7XHJcbiAgICAgICAgdGhpcy5fZnJhbWUgPSBmcmFtZTtcclxuICAgIH07XHJcbiAgICBNb3ZpZUxheWVyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5fc3ltYm9sIGluc3RhbmNlb2YgRmx1bXBNb3ZpZV8xLkZsdW1wTW92aWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3ltYm9sLnJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5fc3ltYm9scykge1xyXG4gICAgICAgICAgICB2YXIgc3ltYm9sID0gdGhpcy5fc3ltYm9sc1tuYW1lXTtcclxuICAgICAgICAgICAgaWYgKHN5bWJvbCBpbnN0YW5jZW9mIEZsdW1wTW92aWVfMS5GbHVtcE1vdmllKSB7XHJcbiAgICAgICAgICAgICAgICBzeW1ib2wucmVzZXQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gTW92aWVMYXllcjtcclxufShQSVhJLkNvbnRhaW5lcikpO1xyXG5leHBvcnRzLk1vdmllTGF5ZXIgPSBNb3ZpZUxheWVyO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFRleHR1cmVHcm91cEF0bGFzXzEgPSByZXF1aXJlKFwiLi9UZXh0dXJlR3JvdXBBdGxhc1wiKTtcclxudmFyIFByb21pc2VfMSA9IHJlcXVpcmUoXCIuLi91dGlsL1Byb21pc2VcIik7XHJcbnZhciBUZXh0dXJlR3JvdXAgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gVGV4dHVyZUdyb3VwKHNwcml0ZXMpIHtcclxuICAgICAgICB0aGlzLnNwcml0ZXMgPSB7fTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwcml0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IHNwcml0ZXNbaV07XHJcbiAgICAgICAgICAgIHRoaXMuc3ByaXRlc1tzcHJpdGUubmFtZV0gPSBzcHJpdGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgVGV4dHVyZUdyb3VwLmxvYWQgPSBmdW5jdGlvbiAobGlicmFyeSwganNvbikge1xyXG4gICAgICAgIHZhciBhdGxhc2VzID0ganNvbi5hdGxhc2VzO1xyXG4gICAgICAgIHZhciBsb2FkZXJzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdGxhc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBhdGxhcyA9IGF0bGFzZXNbaV07XHJcbiAgICAgICAgICAgIGxvYWRlcnMucHVzaChUZXh0dXJlR3JvdXBBdGxhc18xLlRleHR1cmVHcm91cEF0bGFzLmxvYWQobGlicmFyeSwgYXRsYXMpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2VfMS5Qcm9taXNlLmFsbChsb2FkZXJzKS50aGVuKGZ1bmN0aW9uIChhdGxhc2VzKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdGxhc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXRsYXMgPSBhdGxhc2VzW2ldO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChhdGxhcy5nZXRTcHJpdGVzKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGV4dHVyZUdyb3VwKHJlc3VsdCk7XHJcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ2NvdWxkIG5vdCBsb2FkIHRleHR1cmVHcm91cCcsIGVycik7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IGxvYWQgdGV4dHVyZUdyb3VwJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFRleHR1cmVHcm91cDtcclxufSgpKTtcclxuZXhwb3J0cy5UZXh0dXJlR3JvdXAgPSBUZXh0dXJlR3JvdXA7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4uL3V0aWwvUHJvbWlzZVwiKTtcclxudmFyIFRleHR1cmUgPSBQSVhJLlRleHR1cmU7XHJcbnZhciBCYXNlVGV4dHVyZSA9IFBJWEkuQmFzZVRleHR1cmU7XHJcbnZhciBSZWN0YW5nbGUgPSBQSVhJLlJlY3RhbmdsZTtcclxudmFyIFRleHR1cmVHcm91cEF0bGFzID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFRleHR1cmVHcm91cEF0bGFzKHJlbmRlclRleHR1cmUsIGpzb24pIHtcclxuICAgICAgICB0aGlzLl9yZW5kZXJUZXh0dXJlID0gbmV3IEJhc2VUZXh0dXJlKHJlbmRlclRleHR1cmUpO1xyXG4gICAgICAgIHRoaXMuX2F0bGFzID0ganNvbjtcclxuICAgIH1cclxuICAgIFRleHR1cmVHcm91cEF0bGFzLmxvYWQgPSBmdW5jdGlvbiAobGlicmFyeSwganNvbikge1xyXG4gICAgICAgIHZhciBmaWxlID0ganNvbi5maWxlO1xyXG4gICAgICAgIHZhciB1cmwgPSBsaWJyYXJ5LnVybCArICcvJyArIGZpbGU7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlXzEuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgICAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoaW1nKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLnNyYyA9IHVybDtcclxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7IHJldHVybiBuZXcgVGV4dHVyZUdyb3VwQXRsYXMoZGF0YSwganNvbik7IH0pO1xyXG4gICAgfTtcclxuICAgIFRleHR1cmVHcm91cEF0bGFzLnByb3RvdHlwZS5nZXRTcHJpdGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICB2YXIgdGV4dHVyZXMgPSB0aGlzLl9hdGxhcy50ZXh0dXJlcztcclxuICAgICAgICB2YXIgYmFzZVRleHR1cmUgPSB0aGlzLl9yZW5kZXJUZXh0dXJlO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dHVyZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHRleHR1cmUgPSB0ZXh0dXJlc1tpXTtcclxuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IG5ldyBQSVhJLlNwcml0ZShuZXcgVGV4dHVyZShiYXNlVGV4dHVyZSwgbmV3IFJlY3RhbmdsZSh0ZXh0dXJlLnJlY3RbMF0sIHRleHR1cmUucmVjdFsxXSwgdGV4dHVyZS5yZWN0WzJdLCB0ZXh0dXJlLnJlY3RbM10pKSk7XHJcbiAgICAgICAgICAgIHNwcml0ZS5uYW1lID0gdGV4dHVyZS5zeW1ib2w7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHNwcml0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFRleHR1cmVHcm91cEF0bGFzO1xyXG59KCkpO1xyXG5leHBvcnRzLlRleHR1cmVHcm91cEF0bGFzID0gVGV4dHVyZUdyb3VwQXRsYXM7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgS2V5ZnJhbWVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEtleWZyYW1lRGF0YShqc29uKSB7XHJcbiAgICAgICAgaWYgKGpzb24ubGVuZ3RoICE9IHZvaWQgMCkge1xyXG4gICAgICAgICAgICB0aGlzLmZyb21BcnJheShqc29uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBqc29uT2JqZWN0ID0ganNvbjtcclxuICAgICAgICAgICAgdGhpcy5pbmRleCA9IGpzb25PYmplY3QuaW5kZXg7XHJcbiAgICAgICAgICAgIHRoaXMuZHVyYXRpb24gPSBqc29uT2JqZWN0LmR1cmF0aW9uO1xyXG4gICAgICAgICAgICB0aGlzLnJlZiA9ICdyZWYnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnJlZiA6IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMubGFiZWwgPSAnbGFiZWwnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LmxhYmVsIDogbnVsbDtcclxuICAgICAgICAgICAgdGhpcy54ID0gJ2xvYycgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QubG9jWzBdIDogMC4wO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAnbG9jJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC5sb2NbMV0gOiAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMuc2NhbGVYID0gJ3NjYWxlJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC5zY2FsZVswXSA6IDEuMDtcclxuICAgICAgICAgICAgdGhpcy5zY2FsZVkgPSAnc2NhbGUnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnNjYWxlWzFdIDogMS4wO1xyXG4gICAgICAgICAgICB0aGlzLnNrZXdYID0gJ3NrZXcnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnNrZXdbMF0gOiAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMuc2tld1kgPSAnc2tldycgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3Quc2tld1sxXSA6IDAuMDtcclxuICAgICAgICAgICAgdGhpcy5waXZvdFggPSAncGl2b3QnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnBpdm90WzBdIDogMC4wO1xyXG4gICAgICAgICAgICB0aGlzLnBpdm90WSA9ICdwaXZvdCcgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QucGl2b3RbMV0gOiAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMudmlzaWJsZSA9ICd2aXNpYmxlJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC52aXNpYmxlIDogdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5hbHBoYSA9ICdhbHBoYScgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QuYWxwaGEgOiAxLjA7XHJcbiAgICAgICAgICAgIHRoaXMudHdlZW5lZCA9ICd0d2VlbmVkJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC50d2VlbmVkIDogdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5lYXNlID0gJ2Vhc2UnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LmVhc2UgOiAwLjA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgS2V5ZnJhbWVEYXRhLnByb3RvdHlwZS5nZXRWYWx1ZU9yZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICdpbmRleCcsXHJcbiAgICAgICAgICAgICdkdXJhdGlvbicsXHJcbiAgICAgICAgICAgICdyZWYnLFxyXG4gICAgICAgICAgICAnbGFiZWwnLFxyXG4gICAgICAgICAgICAneCcsICd5JyxcclxuICAgICAgICAgICAgJ3NjYWxlWCcsICdzY2FsZVknLFxyXG4gICAgICAgICAgICAnc2tld1gnLCAnc2tld1knLFxyXG4gICAgICAgICAgICAncGl2b3RYJywgJ3Bpdm90WScsXHJcbiAgICAgICAgICAgICd2aXNpYmxlJyxcclxuICAgICAgICAgICAgJ2FscGhhJyxcclxuICAgICAgICAgICAgJ3R3ZWVuZWQnLFxyXG4gICAgICAgICAgICAnZWFzZSdcclxuICAgICAgICBdO1xyXG4gICAgfTtcclxuICAgIEtleWZyYW1lRGF0YS5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgb3JkZXIgPSB0aGlzLmdldFZhbHVlT3JkZXIoKTtcclxuICAgICAgICB2YXIgZGF0YSA9IG5ldyBBcnJheShvcmRlci5sZW5ndGgpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JkZXIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBvcmRlcltpXTtcclxuICAgICAgICAgICAgZGF0YVtpXSA9IHRoaXNbbmFtZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfTtcclxuICAgIEtleWZyYW1lRGF0YS5wcm90b3R5cGUuZnJvbUFycmF5ID0gZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICB2YXIgb3JkZXIgPSB0aGlzLmdldFZhbHVlT3JkZXIoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBvcmRlcltpXTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtpXTtcclxuICAgICAgICAgICAgdGhpc1tuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gS2V5ZnJhbWVEYXRhO1xyXG59KCkpO1xyXG5leHBvcnRzLktleWZyYW1lRGF0YSA9IEtleWZyYW1lRGF0YTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBMYWJlbERhdGEgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gTGFiZWxEYXRhKGxhYmVsLCBpbmRleCwgZHVyYXRpb24pIHtcclxuICAgICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XHJcbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xyXG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICAgIH1cclxuICAgIHJldHVybiBMYWJlbERhdGE7XHJcbn0oKSk7XHJcbmV4cG9ydHMuTGFiZWxEYXRhID0gTGFiZWxEYXRhO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEtleWZyYW1lRGF0YV8xID0gcmVxdWlyZShcIi4vS2V5ZnJhbWVEYXRhXCIpO1xyXG52YXIgTGF5ZXJEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIExheWVyRGF0YShqc29uKSB7XHJcbiAgICAgICAgdGhpcy5rZXlmcmFtZURhdGEgPSBbXTtcclxuICAgICAgICB0aGlzLm5hbWUgPSBqc29uLm5hbWU7XHJcbiAgICAgICAgdGhpcy5mbGlwYm9vayA9ICdmbGlwYm9vaycgaW4ganNvbiA/ICEhanNvbi5mbGlwYm9vayA6IGZhbHNlO1xyXG4gICAgICAgIHZhciBrZXlmcmFtZXMgPSBqc29uLmtleWZyYW1lcztcclxuICAgICAgICB2YXIga2V5RnJhbWVEYXRhID0gbnVsbDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleWZyYW1lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIga2V5ZnJhbWUgPSBrZXlmcmFtZXNbaV07XHJcbiAgICAgICAgICAgIGtleUZyYW1lRGF0YSA9IG5ldyBLZXlmcmFtZURhdGFfMS5LZXlmcmFtZURhdGEoa2V5ZnJhbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmtleWZyYW1lRGF0YS5wdXNoKGtleUZyYW1lRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZnJhbWVzID0ga2V5RnJhbWVEYXRhLmluZGV4ICsga2V5RnJhbWVEYXRhLmR1cmF0aW9uO1xyXG4gICAgfVxyXG4gICAgTGF5ZXJEYXRhLnByb3RvdHlwZS5nZXRLZXlmcmFtZUZvckZyYW1lID0gZnVuY3Rpb24gKGZyYW1lKSB7XHJcbiAgICAgICAgdmFyIGRhdGFzID0gdGhpcy5rZXlmcmFtZURhdGE7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBkYXRhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZGF0YXNbaV0uaW5kZXggPiBmcmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFzW2kgLSAxXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YXNbZGF0YXMubGVuZ3RoIC0gMV07XHJcbiAgICB9O1xyXG4gICAgTGF5ZXJEYXRhLnByb3RvdHlwZS5nZXRLZXlmcmFtZUFmdGVyID0gZnVuY3Rpb24gKGZsdW1wS2V5ZnJhbWVEYXRhKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmtleWZyYW1lRGF0YS5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMua2V5ZnJhbWVEYXRhW2ldID09PSBmbHVtcEtleWZyYW1lRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMua2V5ZnJhbWVEYXRhW2kgKyAxXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH07XHJcbiAgICByZXR1cm4gTGF5ZXJEYXRhO1xyXG59KCkpO1xyXG5leHBvcnRzLkxheWVyRGF0YSA9IExheWVyRGF0YTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBMYXllckRhdGFfMSA9IHJlcXVpcmUoXCIuL0xheWVyRGF0YVwiKTtcclxudmFyIE1vdmllRGF0YSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBNb3ZpZURhdGEobGlicmFyeSwganNvbikge1xyXG4gICAgICAgIHRoaXMuZnJhbWVzID0gMDtcclxuICAgICAgICB2YXIgbGF5ZXJzID0ganNvbi5sYXllcnM7XHJcbiAgICAgICAgdGhpcy5pZCA9IGpzb24uaWQ7XHJcbiAgICAgICAgdGhpcy5sYXllckRhdGEgPSBuZXcgQXJyYXkobGF5ZXJzLmxlbmd0aCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGxheWVyID0gdGhpcy5sYXllckRhdGFbaV0gPSBuZXcgTGF5ZXJEYXRhXzEuTGF5ZXJEYXRhKGxheWVyc1tpXSk7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhbWVzID0gTWF0aC5tYXgodGhpcy5mcmFtZXMsIGxheWVyLmZyYW1lcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIE1vdmllRGF0YTtcclxufSgpKTtcclxuZXhwb3J0cy5Nb3ZpZURhdGEgPSBNb3ZpZURhdGE7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgRmx1bXBMaWJyYXJ5XzEgPSByZXF1aXJlKFwiLi9GbHVtcExpYnJhcnlcIik7XHJcbm1vZHVsZS5leHBvcnRzID0gRmx1bXBMaWJyYXJ5XzEuRmx1bXBMaWJyYXJ5O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xyXG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufTtcclxudmFyIFF1ZXVlXzEgPSByZXF1aXJlKFwiLi9RdWV1ZVwiKTtcclxudmFyIEFuaW1hdGlvblF1ZXVlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhBbmltYXRpb25RdWV1ZSwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIEFuaW1hdGlvblF1ZXVlKGZwcywgdW5pdCkge1xyXG4gICAgICAgIGlmICh1bml0ID09PSB2b2lkIDApIHsgdW5pdCA9IDEwMDA7IH1cclxuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcclxuICAgICAgICB0aGlzLmZyYW1lID0gMDtcclxuICAgICAgICB0aGlzLl9mcmVlemUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl9oYXNTdG9wcGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fdGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fZnBtcyA9IDA7XHJcbiAgICAgICAgdGhpcy5fZnBtcyA9IHVuaXQgLyBmcHM7XHJcbiAgICB9XHJcbiAgICBBbmltYXRpb25RdWV1ZS5wcm90b3R5cGUub25UaWNrID0gZnVuY3Rpb24gKGRlbHRhKSB7XHJcbiAgICAgICAgdmFyIHRpbWUgPSB0aGlzLl90aW1lICs9IGRlbHRhO1xyXG4gICAgICAgIGlmICgodGhpcy5jdXJyZW50ICE9IG51bGwgfHwgdGhpcy5uZXh0KCkgIT0gbnVsbCkpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLmN1cnJlbnQ7XHJcbiAgICAgICAgICAgIHZhciBmcm9tID0gY3VycmVudC5mcm9tO1xyXG4gICAgICAgICAgICB2YXIgZHVyYXRpb24gPSBjdXJyZW50LmR1cmF0aW9uO1xyXG4gICAgICAgICAgICB2YXIgdGltZXMgPSBjdXJyZW50LnRpbWVzO1xyXG4gICAgICAgICAgICB2YXIgZnJhbWUgPSAoZHVyYXRpb24gKiB0aW1lIC8gKGR1cmF0aW9uICogdGhpcy5fZnBtcykpO1xyXG4gICAgICAgICAgICBpZiAodGltZXMgPiAtMSAmJiB0aW1lcyAtIChmcmFtZSAvIGR1cmF0aW9uKSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFtZSA9IGZyb20gKyAoZnJhbWUgJSBkdXJhdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgQW5pbWF0aW9uUXVldWUucHJvdG90eXBlLmhhc1N0b3BwZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICF0aGlzLmN1cnJlbnQgJiYgIXRoaXMuaGFzTmV4dCgpO1xyXG4gICAgfTtcclxuICAgIEFuaW1hdGlvblF1ZXVlLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBuZXh0ID0gX3N1cGVyLnByb3RvdHlwZS5uZXh0LmNhbGwodGhpcyk7XHJcbiAgICAgICAgaWYgKG5leHQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV4dDtcclxuICAgIH07XHJcbiAgICBBbmltYXRpb25RdWV1ZS5wcm90b3R5cGUuZ2V0RnJhbWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZnJhbWU7XHJcbiAgICB9O1xyXG4gICAgQW5pbWF0aW9uUXVldWUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX2ZyZWV6ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX3RpbWUgPSB0aGlzLl90aW1lICUgdGhpcy5fZnBtcztcclxuICAgIH07XHJcbiAgICByZXR1cm4gQW5pbWF0aW9uUXVldWU7XHJcbn0oUXVldWVfMS5RdWV1ZSkpO1xyXG5leHBvcnRzLkFuaW1hdGlvblF1ZXVlID0gQW5pbWF0aW9uUXVldWU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4uL3V0aWwvUHJvbWlzZVwiKTtcclxudmFyIEh0dHBSZXF1ZXN0ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEh0dHBSZXF1ZXN0KCkge1xyXG4gICAgfVxyXG4gICAgSHR0cFJlcXVlc3QucmVxdWVzdCA9IGZ1bmN0aW9uIChtZXRob2QsIHVybCwgYXJncykge1xyXG4gICAgICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2VfMS5Qcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGNsaWVudCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgICAgICB2YXIgdXJpID0gdXJsO1xyXG4gICAgICAgICAgICBpZiAoYXJncyAmJiAobWV0aG9kID09PSAnUE9TVCcgfHwgbWV0aG9kID09PSAnUFVUJykpIHtcclxuICAgICAgICAgICAgICAgIHVyaSArPSAnPyc7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJnY291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGFyZ3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJncy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmdjb3VudCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmkgKz0gJyYnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVyaSArPSBlbmNvZGVVUklDb21wb25lbnQoa2V5KSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChhcmdzW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjbGllbnQub3BlbihtZXRob2QsIHVyaSk7XHJcbiAgICAgICAgICAgIGNsaWVudC5zZW5kKCk7XHJcbiAgICAgICAgICAgIGNsaWVudC5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCB8fCB0aGlzLnN0YXR1cyA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNwb25zZSB8fCB0aGlzLnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QodGhpcy5zdGF0dXNUZXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY2xpZW50Lm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QodGhpcy5zdGF0dXNUZXh0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcclxuICAgIH07XHJcbiAgICBIdHRwUmVxdWVzdC5nZXRTdHJpbmcgPSBmdW5jdGlvbiAodXJsLCBxdWVyeSkge1xyXG4gICAgICAgIGlmIChxdWVyeSA9PT0gdm9pZCAwKSB7IHF1ZXJ5ID0ge307IH1cclxuICAgICAgICByZXR1cm4gSHR0cFJlcXVlc3QucmVxdWVzdCgnR0VUJywgdXJsLCBxdWVyeSk7XHJcbiAgICB9O1xyXG4gICAgSHR0cFJlcXVlc3QuZ2V0SlNPTiA9IGZ1bmN0aW9uICh1cmwsIHF1ZXJ5KSB7XHJcbiAgICAgICAgaWYgKHF1ZXJ5ID09PSB2b2lkIDApIHsgcXVlcnkgPSB7fTsgfVxyXG4gICAgICAgIHJldHVybiBIdHRwUmVxdWVzdC5nZXRTdHJpbmcodXJsLCBxdWVyeSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzcG9uc2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBIdHRwUmVxdWVzdDtcclxufSgpKTtcclxuZXhwb3J0cy5IdHRwUmVxdWVzdCA9IEh0dHBSZXF1ZXN0O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIGFzYXAgPSAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJyAmJiBzZXRJbW1lZGlhdGUpIHx8XHJcbiAgICBmdW5jdGlvbiAoZm4pIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGZuLCAxKTtcclxuICAgIH07XHJcbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcclxuICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKG9UaGlzKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhQXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZUb0JpbmQgPSB0aGlzLCBmTk9QID0gZnVuY3Rpb24gKCkgeyB9LCBmQm91bmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXHJcbiAgICAgICAgICAgICAgICA/IHRoaXNcclxuICAgICAgICAgICAgICAgIDogb1RoaXMsIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcclxuICAgICAgICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XHJcbiAgICAgICAgcmV0dXJuIGZCb3VuZDtcclxuICAgIH07XHJcbn1cclxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiOyB9O1xyXG5mdW5jdGlvbiBoYW5kbGUoZGVmZXJyZWQpIHtcclxuICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICBpZiAodGhpcy5fc3RhdGUgPT09IG51bGwpIHtcclxuICAgICAgICB0aGlzLl9kZWZlcnJlZHMucHVzaChkZWZlcnJlZCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgYXNhcChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNiID0gbWVbJ19zdGF0ZSddID8gZGVmZXJyZWQub25GdWxmaWxsZWQgOiBkZWZlcnJlZC5vblJlamVjdGVkO1xyXG4gICAgICAgIGlmIChjYiA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAobWVbJ19zdGF0ZSddID8gZGVmZXJyZWQucmVzb2x2ZSA6IGRlZmVycmVkLnJlamVjdCkobWUuX3ZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcmV0O1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldCA9IGNiKG1lLl92YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJldCk7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiByZXNvbHZlKG5ld1ZhbHVlKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdGhpcylcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQSBwcm9taXNlIGNhbm5vdCBiZSByZXNvbHZlZCB3aXRoIGl0c2VsZi4nKTtcclxuICAgICAgICBpZiAobmV3VmFsdWUgJiYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIG5ld1ZhbHVlID09PSAnZnVuY3Rpb24nKSkge1xyXG4gICAgICAgICAgICB2YXIgdGhlbiA9IG5ld1ZhbHVlLnRoZW47XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgZG9SZXNvbHZlKHRoZW4uYmluZChuZXdWYWx1ZSksIHJlc29sdmUuYmluZCh0aGlzKSwgcmVqZWN0LmJpbmQodGhpcykpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXNbJ19zdGF0ZSddID0gdHJ1ZTtcclxuICAgICAgICB0aGlzWydfdmFsdWUnXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIGZpbmFsZS5jYWxsKHRoaXMpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICByZWplY3QuY2FsbCh0aGlzLCBlKTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiByZWplY3QobmV3VmFsdWUpIHtcclxuICAgIHRoaXMuX3N0YXRlID0gZmFsc2U7XHJcbiAgICB0aGlzLl92YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgZmluYWxlLmNhbGwodGhpcyk7XHJcbn1cclxuZnVuY3Rpb24gZmluYWxlKCkge1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX2RlZmVycmVkcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgIGhhbmRsZS5jYWxsKHRoaXMsIHRoaXMuX2RlZmVycmVkc1tpXSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9kZWZlcnJlZHMgPSBudWxsO1xyXG59XHJcbmZ1bmN0aW9uIEhhbmRsZXIob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgdGhpcy5vbkZ1bGZpbGxlZCA9IHR5cGVvZiBvbkZ1bGZpbGxlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uRnVsZmlsbGVkIDogbnVsbDtcclxuICAgIHRoaXMub25SZWplY3RlZCA9IHR5cGVvZiBvblJlamVjdGVkID09PSAnZnVuY3Rpb24nID8gb25SZWplY3RlZCA6IG51bGw7XHJcbiAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xyXG4gICAgdGhpcy5yZWplY3QgPSByZWplY3Q7XHJcbn1cclxuZnVuY3Rpb24gZG9SZXNvbHZlKGZuLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xyXG4gICAgdmFyIGRvbmUgPSBmYWxzZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgZm4oZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmIChkb25lKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcclxuICAgICAgICAgICAgb25GdWxmaWxsZWQodmFsdWUpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcclxuICAgICAgICAgICAgaWYgKGRvbmUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICBvblJlamVjdGVkKHJlYXNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXgpIHtcclxuICAgICAgICBpZiAoZG9uZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGRvbmUgPSB0cnVlO1xyXG4gICAgICAgIG9uUmVqZWN0ZWQoZXgpO1xyXG4gICAgfVxyXG59XHJcbnZhciBQcm9taXNlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFByb21pc2UoaW5pdCkge1xyXG4gICAgICAgIHRoaXMuX3N0YXRlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5fZGVmZXJyZWRzID0gW107XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzICE9PSAnb2JqZWN0JylcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUHJvbWlzZXMgbXVzdCBiZSBjb25zdHJ1Y3RlZCB2aWEgbmV3Jyk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0ICE9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIGRvUmVzb2x2ZShpbml0LCByZXNvbHZlLmJpbmQodGhpcyksIHJlamVjdC5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuICAgIFByb21pc2UuYWxsID0gZnVuY3Rpb24gKHByb21pc2VMaXN0KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgaWYgKHByb21pc2VMaXN0Lmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKFtdKTtcclxuICAgICAgICAgICAgdmFyIHJlbWFpbmluZyA9IHByb21pc2VMaXN0Lmxlbmd0aDtcclxuICAgICAgICAgICAgZnVuY3Rpb24gcmVzKGksIHZhbCkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsICYmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhlbiA9IHZhbC50aGVuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4uY2FsbCh2YWwsIGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMoaSwgdmFsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZUxpc3RbaV0gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKC0tcmVtYWluaW5nID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocHJvbWlzZUxpc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9taXNlTGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcmVzKGksIHByb21pc2VMaXN0W2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFByb21pc2UucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFByb21pc2UucmVqZWN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgcmVqZWN0KHZhbHVlKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBQcm9taXNlLnJhY2UgPSBmdW5jdGlvbiAodmFsdWVzKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHZhbHVlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFsdWVzW2ldLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFByb21pc2UuX3NldEltbWVkaWF0ZUZuID0gZnVuY3Rpb24gKGZuKSB7XHJcbiAgICAgICAgYXNhcCA9IGZuO1xyXG4gICAgfTtcclxuICAgIFByb21pc2UucHJvdG90eXBlLmNhdGNoID0gZnVuY3Rpb24gKG9uUmVqZWN0ZWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0ZWQpO1xyXG4gICAgfTtcclxuICAgIFByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcclxuICAgICAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIGhhbmRsZS5jYWxsKG1lLCBuZXcgSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFByb21pc2U7XHJcbn0oKSk7XHJcbmV4cG9ydHMuUHJvbWlzZSA9IFByb21pc2U7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4vUHJvbWlzZVwiKTtcclxudmFyIFByb21pc2VVdGlsID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFByb21pc2VVdGlsKCkge1xyXG4gICAgfVxyXG4gICAgUHJvbWlzZVV0aWwud2FpdCA9IGZ1bmN0aW9uIChsaXN0LCBvblByb2dyZXNzKSB7XHJcbiAgICAgICAgaWYgKG9uUHJvZ3Jlc3MgPT09IHZvaWQgMCkgeyBvblByb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzKSB7IH07IH1cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2VfMS5Qcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdMaXN0ID0gW107XHJcbiAgICAgICAgICAgIHZhciB0aGVuID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdMaXN0LnB1c2gocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgb25Qcm9ncmVzcyhuZXdMaXN0Lmxlbmd0aCAvIGxpc3QubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGlmIChuZXdMaXN0Lmxlbmd0aCA9PSBsaXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUobmV3TGlzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbGlzdFtpXS50aGVuKHRoZW4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgUHJvbWlzZVV0aWwud2FpdEZvckxvYWRhYmxlID0gZnVuY3Rpb24gKGxpc3QsIG9uUHJvZ3Jlc3MpIHtcclxuICAgICAgICBpZiAob25Qcm9ncmVzcyA9PT0gdm9pZCAwKSB7IG9uUHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHsgfTsgfVxyXG4gICAgICAgIHZhciBjb3VudCA9IGxpc3QubGVuZ3RoO1xyXG4gICAgICAgIHZhciBwcm9ncmVzc0xpc3QgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0LnB1c2goMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBwcnZQcm9ncmVzcyA9IGZ1bmN0aW9uIChpbmRleCwgcHJvZ3Jlc3MpIHtcclxuICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0W2luZGV4XSA9IHByb2dyZXNzO1xyXG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xyXG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gcHJvZ3Jlc3NMaXN0Lmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdG90YWwgKz0gcHJvZ3Jlc3NMaXN0W2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3ModG90YWwgLyBjb3VudCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgcHJvbWlzZUxpc3QgPSBuZXcgQXJyYXkoY291bnQpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBwcm9taXNlTGlzdFtpXSA9IGxpc3RbaV0ubG9hZChwcnZQcm9ncmVzcy5iaW5kKHRoaXMsIGkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2VVdGlsLndhaXQocHJvbWlzZUxpc3QpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBQcm9taXNlVXRpbDtcclxufSgpKTtcclxuZXhwb3J0cy5Qcm9taXNlVXRpbCA9IFByb21pc2VVdGlsO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFF1ZXVlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFF1ZXVlKCkge1xyXG4gICAgICAgIHRoaXMuX2xpc3QgPSBbXTtcclxuICAgICAgICB0aGlzLl9saXN0TGVuZ3RoID0gMDtcclxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgUXVldWUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdC5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIHRoaXMuX2xpc3RMZW5ndGgrKztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBRdWV1ZS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmtpbGwoKTtcclxuICAgICAgICBpZiAodGhpcy5fbGlzdExlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gdGhpcy5fbGlzdC5zaGlmdCgpO1xyXG4gICAgICAgICAgICB0aGlzLl9saXN0TGVuZ3RoLS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgfTtcclxuICAgIFF1ZXVlLnByb3RvdHlwZS5oYXNOZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9saXN0TGVuZ3RoID4gMDtcclxuICAgIH07XHJcbiAgICBRdWV1ZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKGFsbCkge1xyXG4gICAgICAgIGlmIChhbGwgPT09IHZvaWQgMCkgeyBhbGwgPSBmYWxzZTsgfVxyXG4gICAgICAgIGlmIChhbGwpIHtcclxuICAgICAgICAgICAgdGhpcy5fbGlzdC5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgICB0aGlzLl9saXN0TGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQudGltZXMgPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBRdWV1ZS5wcm90b3R5cGUua2lsbCA9IGZ1bmN0aW9uIChhbGwpIHtcclxuICAgICAgICBpZiAoYWxsID09PSB2b2lkIDApIHsgYWxsID0gZmFsc2U7IH1cclxuICAgICAgICBpZiAoYWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3QubGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgdGhpcy5fbGlzdExlbmd0aCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnQpIHtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLmN1cnJlbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XHJcbiAgICAgICAgICAgIGN1cnJlbnQuZmluaXNoKCk7XHJcbiAgICAgICAgICAgIGN1cnJlbnQuZGVzdHJ1Y3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFF1ZXVlO1xyXG59KCkpO1xyXG5leHBvcnRzLlF1ZXVlID0gUXVldWU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUXVldWVJdGVtID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFF1ZXVlSXRlbShsYWJlbCwgZnJvbSwgdG8sIHRpbWVzLCBkZWxheSkge1xyXG4gICAgICAgIGlmICh0aW1lcyA9PT0gdm9pZCAwKSB7IHRpbWVzID0gMTsgfVxyXG4gICAgICAgIGlmIChkZWxheSA9PT0gdm9pZCAwKSB7IGRlbGF5ID0gMDsgfVxyXG4gICAgICAgIHRoaXMuX2NvbXBsZXRlID0gbnVsbDtcclxuICAgICAgICBpZiAoZnJvbSA+IHRvKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignYXJndW1lbnQgXCJmcm9tXCIgY2Fubm90IGJlIGJpZ2dlciB0aGFuIGFyZ3VtZW50IFwidG9cIicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XHJcbiAgICAgICAgdGhpcy5mcm9tID0gZnJvbTtcclxuICAgICAgICB0aGlzLnRvID0gdG87XHJcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IHRvIC0gZnJvbTtcclxuICAgICAgICB0aGlzLnRpbWVzID0gdGltZXM7XHJcbiAgICAgICAgdGhpcy5kZWxheSA9IGRlbGF5O1xyXG4gICAgfVxyXG4gICAgUXVldWVJdGVtLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKGNvbXBsZXRlKSB7XHJcbiAgICAgICAgdGhpcy5fY29tcGxldGUgPSBjb21wbGV0ZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBRdWV1ZUl0ZW0ucHJvdG90eXBlLmZpbmlzaCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAodGhpcy5fY29tcGxldGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fY29tcGxldGUuY2FsbCh0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgUXVldWVJdGVtLnByb3RvdHlwZS5kZXN0cnVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmxhYmVsID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9jb21wbGV0ZSA9IG51bGw7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFF1ZXVlSXRlbTtcclxufSgpKTtcclxuZXhwb3J0cy5RdWV1ZUl0ZW0gPSBRdWV1ZUl0ZW07XHJcbiJdfQ==

//# sourceMappingURL=pixi-flump.js.map
