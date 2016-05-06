/**
 * @license
 * pixi-flump.js - v1.0.0
 * Compiled 2016-05-06T13:24:38.373Z
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
            if (this.textureGroups[i].hasSprite(name)) {
                return this.textureGroups[i].createSprite(name);
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

},{"./core/FlumpMovie":2,"./core/TextureGroup":4,"./data/MovieData":9,"./util/HttpRequest":12,"./util/Promise":13,"./util/PromiseUtil":14,"./util/QueueItem":16}],2:[function(require,module,exports){
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

},{"../core/MovieLayer":3,"../util/AnimationQueue":11,"../util/QueueItem":16}],3:[function(require,module,exports){
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
    function MovieLayer(index, movie, library, layerData) {
        _super.call(this);
        this.name = '';
        this._frame = 0;
        this._symbols = {};
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
        if (skewX != 0) {
            sinX = Math.sin(skewX);
            cosX = Math.cos(skewX);
        }
        if (skewY != 0) {
            sinY = Math.sin(skewY);
            cosY = Math.cos(skewY);
        }
        this._symbol.position.set(x, y);
        this._symbol.scale.set(scaleX, scaleY);
        if (!(this._symbol instanceof PIXI.Sprite)) {
            this._symbol['pivot'].x = pivotX;
            this._symbol['pivot'].y = pivotY;
        }
        this._symbol['skew'].set(skewX, skewY);
        this.alpha = alpha;
        this.visible = keyframe.visible;
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

},{"../data/KeyframeData":6,"../data/LabelData":7,"./FlumpMovie":2}],4:[function(require,module,exports){
"use strict";
var TextureGroupAtlas_1 = require("./TextureGroupAtlas");
var Promise_1 = require("../util/Promise");
var TextureGroup = (function () {
    function TextureGroup(names, textures, ancors) {
        this._names = [];
        this._textures = [];
        this._ancors = [];
        this._names = names;
        this._textures = textures;
        this._ancors = ancors;
    }
    TextureGroup.load = function (library, json) {
        var atlases = json.atlases;
        var loaders = [];
        for (var i = 0; i < atlases.length; i++) {
            var atlas = atlases[i];
            loaders.push(TextureGroupAtlas_1.TextureGroupAtlas.load(library, atlas));
        }
        return Promise_1.Promise.all(loaders).then(function (atlases) {
            var names = [];
            var textures = [];
            var ancors = [];
            for (var i = 0; i < atlases.length; i++) {
                var atlas = atlases[i];
                names = names.concat(atlas.getNames());
                textures = textures.concat(atlas.getTextures());
                ancors = ancors.concat(atlas.getAnchors());
                atlas.destruct();
            }
            return new TextureGroup(names, textures, ancors);
        }).catch(function (err) {
            console.warn('could not load textureGroup', err);
            throw new Error('could not load textureGroup');
        });
    };
    TextureGroup.prototype.hasSprite = function (name) {
        return this._names.indexOf(name) > -1;
    };
    TextureGroup.prototype.createSprite = function (name) {
        var index = this._names.indexOf(name);
        var sprite = new PIXI.Sprite(this._textures[index]);
        sprite.anchor.set(this._ancors[index].x, this._ancors[index].y);
        sprite.name = name;
        return sprite;
    };
    return TextureGroup;
}());
exports.TextureGroup = TextureGroup;

},{"../util/Promise":13,"./TextureGroupAtlas":5}],5:[function(require,module,exports){
"use strict";
var Promise_1 = require("../util/Promise");
var Texture = PIXI.Texture;
var BaseTexture = PIXI.BaseTexture;
var Rectangle = PIXI.Rectangle;
var Point = PIXI.Point;
var TextureGroupAtlas = (function () {
    function TextureGroupAtlas(renderTexture, json) {
        this._names = [];
        this._textures = [];
        this._anchors = [];
        this._baseTexture = new BaseTexture(renderTexture);
        this._atlas = json;
        var atlasTextures = this._atlas.textures;
        var baseTexture = this._baseTexture;
        for (var i = 0; i < atlasTextures.length; i++) {
            var atlasTexture = atlasTextures[i];
            this._names.push(atlasTexture.symbol);
            this._textures.push(new Texture(baseTexture, new Rectangle(atlasTexture.rect[0], atlasTexture.rect[1], atlasTexture.rect[2], atlasTexture.rect[3])));
            this._anchors.push(new Point(atlasTexture.origin[0] / atlasTexture.rect[2], atlasTexture.origin[1] / atlasTexture.rect[3]));
        }
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
    TextureGroupAtlas.prototype.getNames = function () {
        return this._names;
    };
    TextureGroupAtlas.prototype.getTextures = function () {
        return this._textures;
    };
    TextureGroupAtlas.prototype.getAnchors = function () {
        return this._anchors;
    };
    TextureGroupAtlas.prototype.destruct = function () {
        this._names = null;
        this._textures = null;
        this._anchors = null;
    };
    return TextureGroupAtlas;
}());
exports.TextureGroupAtlas = TextureGroupAtlas;

},{"../util/Promise":13}],6:[function(require,module,exports){
"use strict";
var KeyframeData = (function () {
    function KeyframeData(json) {
        if (json instanceof Array) {
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
    KeyframeData.prototype.copyNotDefined = function (keyframe) {
        var order = this.getValueOrder();
        var data = keyframe.toArray();
        for (var i = 0; i < data.length; i++) {
            var name = order[i];
            var value = data[i];
            if (this[name] == void 0 && value != void 0) {
                this[name] = value;
            }
        }
    };
    return KeyframeData;
}());
exports.KeyframeData = KeyframeData;

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"./KeyframeData":6}],9:[function(require,module,exports){
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

},{"./LayerData":8}],10:[function(require,module,exports){
"use strict";
var FlumpLibrary_1 = require("./FlumpLibrary");
module.exports = FlumpLibrary_1.FlumpLibrary;

},{"./FlumpLibrary":1}],11:[function(require,module,exports){
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

},{"./Queue":15}],12:[function(require,module,exports){
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

},{"../util/Promise":13}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./Promise":13}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}]},{},[10])(10)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvRmx1bXBMaWJyYXJ5LmpzIiwic3JjL2NvcmUvRmx1bXBNb3ZpZS5qcyIsInNyYy9jb3JlL01vdmllTGF5ZXIuanMiLCJzcmMvY29yZS9UZXh0dXJlR3JvdXAuanMiLCJzcmMvY29yZS9UZXh0dXJlR3JvdXBBdGxhcy5qcyIsInNyYy9kYXRhL0tleWZyYW1lRGF0YS5qcyIsInNyYy9kYXRhL0xhYmVsRGF0YS5qcyIsInNyYy9kYXRhL0xheWVyRGF0YS5qcyIsInNyYy9kYXRhL01vdmllRGF0YS5qcyIsInNyYy9pbmRleCIsInNyYy91dGlsL0FuaW1hdGlvblF1ZXVlLmpzIiwic3JjL3V0aWwvSHR0cFJlcXVlc3QuanMiLCJzcmMvdXRpbC9Qcm9taXNlLmpzIiwic3JjL3V0aWwvUHJvbWlzZVV0aWwuanMiLCJzcmMvdXRpbC9RdWV1ZS5qcyIsInNyYy91dGlsL1F1ZXVlSXRlbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4vdXRpbC9Qcm9taXNlXCIpO1xyXG52YXIgSHR0cFJlcXVlc3RfMSA9IHJlcXVpcmUoXCIuL3V0aWwvSHR0cFJlcXVlc3RcIik7XHJcbnZhciBQcm9taXNlVXRpbF8xID0gcmVxdWlyZShcIi4vdXRpbC9Qcm9taXNlVXRpbFwiKTtcclxudmFyIFRleHR1cmVHcm91cF8xID0gcmVxdWlyZShcIi4vY29yZS9UZXh0dXJlR3JvdXBcIik7XHJcbnZhciBGbHVtcE1vdmllXzEgPSByZXF1aXJlKFwiLi9jb3JlL0ZsdW1wTW92aWVcIik7XHJcbnZhciBNb3ZpZURhdGFfMSA9IHJlcXVpcmUoXCIuL2RhdGEvTW92aWVEYXRhXCIpO1xyXG52YXIgUXVldWVJdGVtXzEgPSByZXF1aXJlKFwiLi91dGlsL1F1ZXVlSXRlbVwiKTtcclxudmFyIEZsdW1wTGlicmFyeSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBGbHVtcExpYnJhcnkoYmFzZVBhdGgpIHtcclxuICAgICAgICB0aGlzLm1vdmllRGF0YSA9IFtdO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZUdyb3VwcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZnBzID0gMDtcclxuICAgICAgICB0aGlzLmlzT3B0aW1pc2VkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5faGFzTG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5faXNMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGEgPSAwO1xyXG4gICAgICAgIGlmIChiYXNlUGF0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnVybCA9IGJhc2VQYXRoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIEZsdW1wTGlicmFyeS5sb2FkID0gZnVuY3Rpb24gKHVybCwgbGlicmFyeSwgb25Qcm9jZXNzKSB7XHJcbiAgICAgICAgdmFyIGJhc2VEaXIgPSB1cmw7XHJcbiAgICAgICAgaWYgKHVybC5pbmRleE9mKCcuanNvbicpID4gLTEpIHtcclxuICAgICAgICAgICAgYmFzZURpciA9IHVybC5zdWJzdHIoMCwgdXJsLmxhc3RJbmRleE9mKCcvJykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGJhc2VEaXIuc3Vic3RyKC0xKSA9PSAnLycpIHtcclxuICAgICAgICAgICAgICAgIGJhc2VEaXIgPSBiYXNlRGlyLnN1YnN0cigwLCBiYXNlRGlyLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHVybCArPSAodXJsLnN1YnN0cih1cmwubGVuZ3RoIC0gMSkgIT0gJy8nID8gJy8nIDogJycpICsgJ2xpYnJhcnkuanNvbic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsaWJyYXJ5ID09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICBsaWJyYXJ5ID0gbmV3IEZsdW1wTGlicmFyeShiYXNlRGlyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxpYnJhcnkudXJsID0gYmFzZURpcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEh0dHBSZXF1ZXN0XzEuSHR0cFJlcXVlc3QuZ2V0SlNPTih1cmwpLnRoZW4oZnVuY3Rpb24gKGpzb24pIHsgcmV0dXJuIGxpYnJhcnkucHJvY2Vzc0RhdGEoanNvbiwgb25Qcm9jZXNzKTsgfSk7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBMaWJyYXJ5LnByb3RvdHlwZS5oYXNMb2FkZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhc0xvYWRlZDtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLmlzTG9hZGluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNMb2FkaW5nO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChvblByb2dyZXNzKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzTG9hZGVkKCkpIHtcclxuICAgICAgICAgICAgb25Qcm9ncmVzcygxKTtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2VfMS5Qcm9taXNlLnJlc29sdmUodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy51cmwpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1cmwgaXMgbm90IHNldCBhbmQgdGhlcmUgZm9yIGNhbiBub3QgYmUgbG9hZGVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBGbHVtcExpYnJhcnkubG9hZCh0aGlzLnVybCwgdGhpcywgb25Qcm9ncmVzcykuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBsb2FkIGxpYnJhcnknKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLnByb2Nlc3NEYXRhID0gZnVuY3Rpb24gKGpzb24sIG9uUHJvY2Vzcykge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5tZDUgPSBqc29uLm1kNTtcclxuICAgICAgICB0aGlzLmZyYW1lUmF0ZSA9IGpzb24uZnJhbWVSYXRlO1xyXG4gICAgICAgIHRoaXMucmVmZXJlbmNlTGlzdCA9IGpzb24ucmVmZXJlbmNlTGlzdCB8fCBudWxsO1xyXG4gICAgICAgIHRoaXMuaXNPcHRpbWlzZWQgPSBqc29uLm9wdGltaXNlZCB8fCBmYWxzZTtcclxuICAgICAgICB2YXIgdGV4dHVyZUdyb3VwTG9hZGVycyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvbi5tb3ZpZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG1vdmllRGF0YSA9IG5ldyBNb3ZpZURhdGFfMS5Nb3ZpZURhdGEodGhpcywganNvbi5tb3ZpZXNbaV0pO1xyXG4gICAgICAgICAgICB0aGlzLm1vdmllRGF0YS5wdXNoKG1vdmllRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0ZXh0dXJlR3JvdXBzID0ganNvbi50ZXh0dXJlR3JvdXBzO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dHVyZUdyb3Vwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgdGV4dHVyZUdyb3VwID0gdGV4dHVyZUdyb3Vwc1tpXTtcclxuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBUZXh0dXJlR3JvdXBfMS5UZXh0dXJlR3JvdXAubG9hZCh0aGlzLCB0ZXh0dXJlR3JvdXApO1xyXG4gICAgICAgICAgICB0ZXh0dXJlR3JvdXBMb2FkZXJzLnB1c2gocHJvbWlzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlVXRpbF8xLlByb21pc2VVdGlsLndhaXQodGV4dHVyZUdyb3VwTG9hZGVycywgb25Qcm9jZXNzKVxyXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAodGV4dHVyZUdyb3Vwcykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRleHR1cmVHcm91cHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0dXJlR3JvdXAgPSB0ZXh0dXJlR3JvdXBzW2ldO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMudGV4dHVyZUdyb3Vwcy5wdXNoKHRleHR1cmVHcm91cCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgX3RoaXMuX2hhc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiBfdGhpcztcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLmdldE1vdmllRGF0YSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1vdmllRGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbW92aWVEYXRhID0gdGhpcy5tb3ZpZURhdGFbaV07XHJcbiAgICAgICAgICAgIGlmIChtb3ZpZURhdGEuaWQgPT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vdmllRGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21vdmllIG5vdCBmb3VuZCcpO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUuY3JlYXRlU3ltYm9sID0gZnVuY3Rpb24gKG5hbWUsIHBhdXNlZCkge1xyXG4gICAgICAgIGlmIChwYXVzZWQgPT09IHZvaWQgMCkgeyBwYXVzZWQgPSBmYWxzZTsgfVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50ZXh0dXJlR3JvdXBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRleHR1cmVHcm91cHNbaV0uaGFzU3ByaXRlKG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0dXJlR3JvdXBzW2ldLmNyZWF0ZVNwcml0ZShuYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubW92aWVEYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBtb3ZpZURhdGEgPSB0aGlzLm1vdmllRGF0YVtpXTtcclxuICAgICAgICAgICAgaWYgKG1vdmllRGF0YS5pZCA9PSBuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbW92aWUgPSBuZXcgRmx1bXBNb3ZpZV8xLkZsdW1wTW92aWUodGhpcywgbmFtZSk7XHJcbiAgICAgICAgICAgICAgICBtb3ZpZS5nZXRRdWV1ZSgpLmFkZChuZXcgUXVldWVJdGVtXzEuUXVldWVJdGVtKG51bGwsIDAsIG1vdmllLmZyYW1lcywgLTEsIDApKTtcclxuICAgICAgICAgICAgICAgIG1vdmllLnBhdXNlZCA9IHBhdXNlZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtb3ZpZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLndhcm4oJ25vIF9zeW1ib2wgZm91bmQ6ICgnICsgbmFtZSArICcpJyk7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm8gX3N5bWJvbCBmb3VuZFwiKTtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkucHJvdG90eXBlLmNyZWF0ZU1vdmllID0gZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgICAgdmFyIG5hbWU7XHJcbiAgICAgICAgbmFtZSA9IGlkO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tb3ZpZURhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG1vdmllRGF0YSA9IHRoaXMubW92aWVEYXRhW2ldO1xyXG4gICAgICAgICAgICBpZiAobW92aWVEYXRhLmlkID09IG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtb3ZpZSA9IG5ldyBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSh0aGlzLCBuYW1lKTtcclxuICAgICAgICAgICAgICAgIG1vdmllLnBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbW92aWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdubyBfc3ltYm9sIGZvdW5kOiAoJyArIG5hbWUgKyAnKSAnLCB0aGlzKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJubyBfc3ltYm9sIGZvdW5kOiBcIiArIHRoaXMpO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTGlicmFyeS5wcm90b3R5cGUuZ2V0TmFtZUZyb21SZWZlcmVuY2VMaXN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucmVmZXJlbmNlTGlzdCAmJiB0eXBlb2YgdmFsdWUgPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmZXJlbmNlTGlzdFt2YWx1ZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH07XHJcbiAgICBGbHVtcExpYnJhcnkuRVZFTlRfTE9BRCA9ICdsb2FkJztcclxuICAgIHJldHVybiBGbHVtcExpYnJhcnk7XHJcbn0oKSk7XHJcbmV4cG9ydHMuRmx1bXBMaWJyYXJ5ID0gRmx1bXBMaWJyYXJ5O1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xyXG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufTtcclxudmFyIEFuaW1hdGlvblF1ZXVlXzEgPSByZXF1aXJlKFwiLi4vdXRpbC9BbmltYXRpb25RdWV1ZVwiKTtcclxudmFyIFF1ZXVlSXRlbV8xID0gcmVxdWlyZShcIi4uL3V0aWwvUXVldWVJdGVtXCIpO1xyXG52YXIgTW92aWVMYXllcl8xID0gcmVxdWlyZShcIi4uL2NvcmUvTW92aWVMYXllclwiKTtcclxudmFyIEZsdW1wTW92aWUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKEZsdW1wTW92aWUsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBGbHVtcE1vdmllKGxpYnJhcnksIG5hbWUpIHtcclxuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcclxuICAgICAgICB0aGlzLl9sYWJlbHMgPSB7fTtcclxuICAgICAgICB0aGlzLl9xdWV1ZSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5oYXNGcmFtZUNhbGxiYWNrcyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmZyYW1lID0gMDtcclxuICAgICAgICB0aGlzLmZyYW1lcyA9IDA7XHJcbiAgICAgICAgdGhpcy5zcGVlZCA9IDE7XHJcbiAgICAgICAgdGhpcy5mcHMgPSAxO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5fbGlicmFyeSA9IGxpYnJhcnk7XHJcbiAgICAgICAgdGhpcy5fbW92aWVEYXRhID0gbGlicmFyeS5nZXRNb3ZpZURhdGEobmFtZSk7XHJcbiAgICAgICAgdmFyIGxheWVycyA9IHRoaXMuX21vdmllRGF0YS5sYXllckRhdGE7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IGxheWVycy5sZW5ndGg7XHJcbiAgICAgICAgdmFyIG1vdmllTGF5ZXJzID0gbmV3IEFycmF5KGxlbmd0aCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbGF5ZXJEYXRhID0gbGF5ZXJzW2ldO1xyXG4gICAgICAgICAgICBtb3ZpZUxheWVyc1tpXSA9IG5ldyBNb3ZpZUxheWVyXzEuTW92aWVMYXllcihpLCB0aGlzLCBsaWJyYXJ5LCBsYXllckRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKG1vdmllTGF5ZXJzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fbW92aWVMYXllcnMgPSBtb3ZpZUxheWVycztcclxuICAgICAgICB0aGlzLmZyYW1lcyA9IHRoaXMuX21vdmllRGF0YS5mcmFtZXM7XHJcbiAgICAgICAgdGhpcy5fZnJhbWVDYWxsYmFjayA9IG5ldyBBcnJheSh0aGlzLmZyYW1lcyk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYW1lczsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lQ2FsbGJhY2tbaV0gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmZwcyA9IGxpYnJhcnkuZnJhbWVSYXRlO1xyXG4gICAgICAgIHRoaXMuZ2V0UXVldWUoKTtcclxuICAgIH1cclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLnNldExhYmVsID0gZnVuY3Rpb24gKG5hbWUsIGRhdGEpIHtcclxuICAgICAgICB0aGlzLl9sYWJlbHNbbmFtZV0gPSBkYXRhO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLmdldFF1ZXVlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fcXVldWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fcXVldWUgPSBuZXcgQW5pbWF0aW9uUXVldWVfMS5BbmltYXRpb25RdWV1ZSh0aGlzLmZwcywgMTAwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9xdWV1ZTtcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5wbGF5ID0gZnVuY3Rpb24gKHRpbWVzLCBsYWJlbCwgY29tcGxldGUpIHtcclxuICAgICAgICBpZiAodGltZXMgPT09IHZvaWQgMCkgeyB0aW1lcyA9IDE7IH1cclxuICAgICAgICBpZiAobGFiZWwgPT09IHZvaWQgMCkgeyBsYWJlbCA9IG51bGw7IH1cclxuICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgIGlmIChsYWJlbCBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGlmIChsYWJlbC5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHF1ZXVlID0gbmV3IFF1ZXVlSXRlbV8xLlF1ZXVlSXRlbShudWxsLCBsYWJlbFswXSwgdGhpcy5mcmFtZXMsIHRpbWVzLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBxdWV1ZSA9IG5ldyBRdWV1ZUl0ZW1fMS5RdWV1ZUl0ZW0obnVsbCwgbGFiZWxbMF0sIGxhYmVsWzFdLCB0aW1lcywgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobGFiZWwgPT0gbnVsbCB8fCBsYWJlbCA9PSAnKicpIHtcclxuICAgICAgICAgICAgdmFyIHF1ZXVlID0gbmV3IFF1ZXVlSXRlbV8xLlF1ZXVlSXRlbShudWxsLCAwLCB0aGlzLmZyYW1lcywgdGltZXMsIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHF1ZXVlTGFiZWwgPSB0aGlzLl9sYWJlbHNbbGFiZWxdO1xyXG4gICAgICAgICAgICBpZiAoIXF1ZXVlTGFiZWwpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBsYWJlbDonICsgcXVldWVMYWJlbCArICcgfCAnICsgdGhpcy5uYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcXVldWUgPSBuZXcgUXVldWVJdGVtXzEuUXVldWVJdGVtKHF1ZXVlTGFiZWwubGFiZWwsIHF1ZXVlTGFiZWwuaW5kZXgsIHF1ZXVlTGFiZWwuZHVyYXRpb24sIHRpbWVzLCAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgIHF1ZXVlLnRoZW4oY29tcGxldGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9xdWV1ZS5hZGQocXVldWUpO1xyXG4gICAgICAgIGlmIChjb21wbGV0ZSkge1xyXG4gICAgICAgICAgICBxdWV1ZS50aGVuKGNvbXBsZXRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKGFsbCkge1xyXG4gICAgICAgIGlmIChhbGwgPT09IHZvaWQgMCkgeyBhbGwgPSBmYWxzZTsgfVxyXG4gICAgICAgIHRoaXMuX3F1ZXVlLmVuZChhbGwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX3F1ZXVlLmtpbGwoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBGbHVtcE1vdmllLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9xdWV1ZS5uZXh0KCk7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUua2lsbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9xdWV1ZS5raWxsKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUuc2V0RnJhbWVDYWxsYmFjayA9IGZ1bmN0aW9uIChmcmFtZU51bWJlciwgY2FsbGJhY2ssIHRyaWdnZXJPbmNlKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICBpZiAodHJpZ2dlck9uY2UgPT09IHZvaWQgMCkgeyB0cmlnZ2VyT25jZSA9IGZhbHNlOyB9XHJcbiAgICAgICAgdGhpcy5oYXNGcmFtZUNhbGxiYWNrcyA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRyaWdnZXJPbmNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lQ2FsbGJhY2tbZnJhbWVOdW1iZXJdID0gZnVuY3Rpb24gKGRlbHRhKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKF90aGlzLCBkZWx0YSk7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXRGcmFtZUNhbGxiYWNrKGZyYW1lTnVtYmVyLCBudWxsKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lQ2FsbGJhY2tbZnJhbWVOdW1iZXJdID0gY2FsbGJhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLmdvdG9BbmRTdG9wID0gZnVuY3Rpb24gKGZyYW1lT3JMYWJlbCkge1xyXG4gICAgICAgIHZhciBmcmFtZTtcclxuICAgICAgICBpZiAodHlwZW9mIGZyYW1lT3JMYWJlbCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgZnJhbWUgPSB0aGlzLl9sYWJlbHNbZnJhbWVPckxhYmVsXS5pbmRleDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGZyYW1lID0gZnJhbWVPckxhYmVsO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcXVldWUgPSBuZXcgUXVldWVJdGVtXzEuUXVldWVJdGVtKG51bGwsIGZyYW1lLCAxLCAxLCAwKTtcclxuICAgICAgICB0aGlzLl9xdWV1ZS5hZGQocXVldWUpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLm9uVGljayA9IGZ1bmN0aW9uIChkZWx0YSwgYWNjdW11bGF0ZWQpIHtcclxuICAgICAgICB2YXIgbW92aWVMYXllcnMgPSB0aGlzLl9tb3ZpZUxheWVycztcclxuICAgICAgICBkZWx0YSAqPSB0aGlzLnNwZWVkO1xyXG4gICAgICAgIGlmICh0aGlzLnBhdXNlZCA9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9xdWV1ZS5vblRpY2soZGVsdGEpO1xyXG4gICAgICAgICAgICB2YXIgZnJhbWUgPSB0aGlzLmZyYW1lO1xyXG4gICAgICAgICAgICB2YXIgbmV3RnJhbWUgPSB0aGlzLl9xdWV1ZS5nZXRGcmFtZSgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1vdmllTGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGF5ZXIgPSBtb3ZpZUxheWVyc1tpXTtcclxuICAgICAgICAgICAgICAgIGxheWVyLm9uVGljayhkZWx0YSwgYWNjdW11bGF0ZWQpO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2V0RnJhbWUobmV3RnJhbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZnJhbWUgPSBuZXdGcmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUuZ2V0U3ltYm9sID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICB2YXIgbGF5ZXJzID0gdGhpcy5fbW92aWVMYXllcnM7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGxheWVyID0gbGF5ZXJzW2ldO1xyXG4gICAgICAgICAgICB2YXIgc3ltYm9sID0gbGF5ZXIuZ2V0U3ltYm9sKG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoc3ltYm9sICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzeW1ib2w7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUucmVwbGFjZVN5bWJvbCA9IGZ1bmN0aW9uIChuYW1lLCBzeW1ib2wpIHtcclxuICAgICAgICB2YXIgbGF5ZXJzID0gdGhpcy5fbW92aWVMYXllcnM7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGxheWVyID0gbGF5ZXJzW2ldO1xyXG4gICAgICAgICAgICBpZiAobGF5ZXIucmVwbGFjZVN5bWJvbChuYW1lLCBzeW1ib2wpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG4gICAgRmx1bXBNb3ZpZS5wcm90b3R5cGUuaGFuZGxlRnJhbWVDYWxsYmFjayA9IGZ1bmN0aW9uIChmcm9tRnJhbWUsIHRvRnJhbWUsIGRlbHRhKSB7XHJcbiAgICAgICAgaWYgKHRvRnJhbWUgPiBmcm9tRnJhbWUpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSBmcm9tRnJhbWU7IGluZGV4IDwgdG9GcmFtZTsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZyYW1lQ2FsbGJhY2tbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZnJhbWVDYWxsYmFja1tpbmRleF0uY2FsbCh0aGlzLCBkZWx0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodG9GcmFtZSA8IGZyb21GcmFtZSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IGZyb21GcmFtZTsgaW5kZXggPCB0aGlzLmZyYW1lczsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2ZyYW1lQ2FsbGJhY2tbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZnJhbWVDYWxsYmFja1tpbmRleF0uY2FsbCh0aGlzLCBkZWx0YSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRvRnJhbWU7IGluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9mcmFtZUNhbGxiYWNrW2luZGV4XSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZyYW1lQ2FsbGJhY2tbaW5kZXhdLmNhbGwodGhpcywgZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIEZsdW1wTW92aWUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBsYXllcnMgPSB0aGlzLl9tb3ZpZUxheWVycztcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSBsYXllcnNbaV07XHJcbiAgICAgICAgICAgIGxheWVyLnJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBGbHVtcE1vdmllO1xyXG59KFBJWEkuQ29udGFpbmVyKSk7XHJcbmV4cG9ydHMuRmx1bXBNb3ZpZSA9IEZsdW1wTW92aWU7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59O1xyXG52YXIgRmx1bXBNb3ZpZV8xID0gcmVxdWlyZShcIi4vRmx1bXBNb3ZpZVwiKTtcclxudmFyIExhYmVsRGF0YV8xID0gcmVxdWlyZShcIi4uL2RhdGEvTGFiZWxEYXRhXCIpO1xyXG52YXIgS2V5ZnJhbWVEYXRhXzEgPSByZXF1aXJlKFwiLi4vZGF0YS9LZXlmcmFtZURhdGFcIik7XHJcbnZhciBNb3ZpZUxheWVyID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhNb3ZpZUxheWVyLCBfc3VwZXIpO1xyXG4gICAgZnVuY3Rpb24gTW92aWVMYXllcihpbmRleCwgbW92aWUsIGxpYnJhcnksIGxheWVyRGF0YSkge1xyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMubmFtZSA9ICcnO1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lID0gMDtcclxuICAgICAgICB0aGlzLl9zeW1ib2xzID0ge307XHJcbiAgICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcclxuICAgICAgICB2YXIga2V5ZnJhbWVEYXRhID0gbGF5ZXJEYXRhLmtleWZyYW1lRGF0YTtcclxuICAgICAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xyXG4gICAgICAgIHRoaXMuX21vdmllID0gbW92aWU7XHJcbiAgICAgICAgdGhpcy5fbGF5ZXJEYXRhID0gbGF5ZXJEYXRhO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IGxheWVyRGF0YS5uYW1lO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5ZnJhbWVEYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXlmcmFtZSA9IGtleWZyYW1lRGF0YVtpXTtcclxuICAgICAgICAgICAgaWYgKGtleWZyYW1lLmxhYmVsKSB7XHJcbiAgICAgICAgICAgICAgICBtb3ZpZS5zZXRMYWJlbChrZXlmcmFtZS5sYWJlbCwgbmV3IExhYmVsRGF0YV8xLkxhYmVsRGF0YShrZXlmcmFtZS5sYWJlbCwga2V5ZnJhbWUuaW5kZXgsIGtleWZyYW1lLmR1cmF0aW9uKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKChrZXlmcmFtZS5yZWYgIT0gLTEgJiYga2V5ZnJhbWUucmVmICE9IG51bGwpICYmIChrZXlmcmFtZS5yZWYgaW4gdGhpcy5fc3ltYm9scykgPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N5bWJvbHNba2V5ZnJhbWUucmVmXSA9IGxpYnJhcnkuY3JlYXRlU3ltYm9sKGtleWZyYW1lLnJlZiwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2V0RnJhbWUoMCk7XHJcbiAgICB9XHJcbiAgICBNb3ZpZUxheWVyLnByb3RvdHlwZS5nZXRTeW1ib2wgPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gICAgICAgIHZhciBzeW1ib2xzID0gdGhpcy5fc3ltYm9scztcclxuICAgICAgICBmb3IgKHZhciB2YWwgaW4gc3ltYm9scykge1xyXG4gICAgICAgICAgICB2YXIgc3ltYm9sID0gc3ltYm9sc1t2YWxdO1xyXG4gICAgICAgICAgICBpZiAoc3ltYm9sIGluc3RhbmNlb2YgRmx1bXBNb3ZpZV8xLkZsdW1wTW92aWUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzeW1ib2wubmFtZSA9PSBuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN5bWJvbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gc3ltYm9sLmdldFN5bWJvbChuYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH07XHJcbiAgICBNb3ZpZUxheWVyLnByb3RvdHlwZS5yZXBsYWNlU3ltYm9sID0gZnVuY3Rpb24gKG5hbWUsIGl0ZW0pIHtcclxuICAgICAgICB2YXIgc3ltYm9scyA9IHRoaXMuX3N5bWJvbHM7XHJcbiAgICAgICAgZm9yICh2YXIgdmFsIGluIHN5bWJvbHMpIHtcclxuICAgICAgICAgICAgdmFyIHN5bWJvbCA9IHN5bWJvbHNbdmFsXTtcclxuICAgICAgICAgICAgaWYgKHN5bWJvbC5uYW1lID09IG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N5bWJvbHNbdmFsXSA9IGl0ZW07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChzeW1ib2wgaW5zdGFuY2VvZiBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSAmJiBzeW1ib2wucmVwbGFjZVN5bWJvbChuYW1lLCBpdGVtKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLm9uVGljayA9IGZ1bmN0aW9uIChkZWx0YSwgYWNjdW11bGF0ZWQpIHtcclxuICAgICAgICBpZiAodGhpcy5fc3ltYm9sICE9IG51bGwgJiYgKHRoaXMuX3N5bWJvbCBpbnN0YW5jZW9mIEZsdW1wTW92aWVfMS5GbHVtcE1vdmllKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zeW1ib2wub25UaWNrKGRlbHRhLCBhY2N1bXVsYXRlZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLnNldEZyYW1lID0gZnVuY3Rpb24gKGZyYW1lKSB7XHJcbiAgICAgICAgdmFyIGtleWZyYW1lID0gdGhpcy5fbGF5ZXJEYXRhLmdldEtleWZyYW1lRm9yRnJhbWUoTWF0aC5mbG9vcihmcmFtZSkpO1xyXG4gICAgICAgIGlmIChrZXlmcmFtZS5yZWYgIT0gLTEgJiYga2V5ZnJhbWUucmVmICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3N5bWJvbCAhPSB0aGlzLl9zeW1ib2xzW2tleWZyYW1lLnJlZl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2hpbGRyZW4oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3N5bWJvbCA9IHRoaXMuX3N5bWJvbHNba2V5ZnJhbWUucmVmXTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zeW1ib2wgaW5zdGFuY2VvZiBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N5bWJvbC5yZXNldCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRDaGlsZCh0aGlzLl9zeW1ib2wpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc2V0S2V5ZnJhbWVEYXRhKHRoaXMuX3N5bWJvbCwga2V5ZnJhbWUsIGZyYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2hpbGRyZW4oKTtcclxuICAgICAgICAgICAgdGhpcy5fc3ltYm9sID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG4gICAgTW92aWVMYXllci5wcm90b3R5cGUuc2V0S2V5ZnJhbWVEYXRhID0gZnVuY3Rpb24gKHN5bWJvbCwga2V5ZnJhbWUsIGZyYW1lKSB7XHJcbiAgICAgICAgdmFyIHNpblggPSAwLjA7XHJcbiAgICAgICAgdmFyIGNvc1ggPSAxLjA7XHJcbiAgICAgICAgdmFyIHNpblkgPSAwLjA7XHJcbiAgICAgICAgdmFyIGNvc1kgPSAxLjA7XHJcbiAgICAgICAgdmFyIHggPSBrZXlmcmFtZS54O1xyXG4gICAgICAgIHZhciB5ID0ga2V5ZnJhbWUueTtcclxuICAgICAgICB2YXIgc2NhbGVYID0ga2V5ZnJhbWUuc2NhbGVYO1xyXG4gICAgICAgIHZhciBzY2FsZVkgPSBrZXlmcmFtZS5zY2FsZVk7XHJcbiAgICAgICAgdmFyIHNrZXdYID0ga2V5ZnJhbWUuc2tld1g7XHJcbiAgICAgICAgdmFyIHNrZXdZID0ga2V5ZnJhbWUuc2tld1k7XHJcbiAgICAgICAgdmFyIHBpdm90WCA9IGtleWZyYW1lLnBpdm90WDtcclxuICAgICAgICB2YXIgcGl2b3RZID0ga2V5ZnJhbWUucGl2b3RZO1xyXG4gICAgICAgIHZhciBhbHBoYSA9IGtleWZyYW1lLmFscGhhO1xyXG4gICAgICAgIHZhciBlYXNlO1xyXG4gICAgICAgIHZhciBpbnRlcnBlZDtcclxuICAgICAgICB2YXIgbmV4dEtleWZyYW1lO1xyXG4gICAgICAgIGlmIChrZXlmcmFtZS5pbmRleCA8IGZyYW1lICYmIGtleWZyYW1lLnR3ZWVuZWQpIHtcclxuICAgICAgICAgICAgbmV4dEtleWZyYW1lID0gdGhpcy5fbGF5ZXJEYXRhLmdldEtleWZyYW1lQWZ0ZXIoa2V5ZnJhbWUpO1xyXG4gICAgICAgICAgICBpZiAobmV4dEtleWZyYW1lIGluc3RhbmNlb2YgS2V5ZnJhbWVEYXRhXzEuS2V5ZnJhbWVEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnBlZCA9IChmcmFtZSAtIGtleWZyYW1lLmluZGV4KSAvIGtleWZyYW1lLmR1cmF0aW9uO1xyXG4gICAgICAgICAgICAgICAgZWFzZSA9IGtleWZyYW1lLmVhc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWFzZSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSAwLjA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVhc2UgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnYgPSAxIC0gaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHQgPSAxIC0gaW52ICogaW52O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlYXNlID0gMCAtIGVhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ID0gaW50ZXJwZWQgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJwZWQgPSBlYXNlICogdCArICgxIC0gZWFzZSkgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHggPSB4ICsgKG5leHRLZXlmcmFtZS54IC0geCkgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgIHkgPSB5ICsgKG5leHRLZXlmcmFtZS55IC0geSkgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgIHNjYWxlWCA9IHNjYWxlWCArIChuZXh0S2V5ZnJhbWUuc2NhbGVYIC0gc2NhbGVYKSAqIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgc2NhbGVZID0gc2NhbGVZICsgKG5leHRLZXlmcmFtZS5zY2FsZVkgLSBzY2FsZVkpICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgICAgICBza2V3WCA9IHNrZXdYICsgKG5leHRLZXlmcmFtZS5za2V3WCAtIHNrZXdYKSAqIGludGVycGVkO1xyXG4gICAgICAgICAgICAgICAgc2tld1kgPSBza2V3WSArIChuZXh0S2V5ZnJhbWUuc2tld1kgLSBza2V3WSkgKiBpbnRlcnBlZDtcclxuICAgICAgICAgICAgICAgIGFscGhhID0gYWxwaGEgKyAobmV4dEtleWZyYW1lLmFscGhhIC0gYWxwaGEpICogaW50ZXJwZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNrZXdYICE9IDApIHtcclxuICAgICAgICAgICAgc2luWCA9IE1hdGguc2luKHNrZXdYKTtcclxuICAgICAgICAgICAgY29zWCA9IE1hdGguY29zKHNrZXdYKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNrZXdZICE9IDApIHtcclxuICAgICAgICAgICAgc2luWSA9IE1hdGguc2luKHNrZXdZKTtcclxuICAgICAgICAgICAgY29zWSA9IE1hdGguY29zKHNrZXdZKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fc3ltYm9sLnBvc2l0aW9uLnNldCh4LCB5KTtcclxuICAgICAgICB0aGlzLl9zeW1ib2wuc2NhbGUuc2V0KHNjYWxlWCwgc2NhbGVZKTtcclxuICAgICAgICBpZiAoISh0aGlzLl9zeW1ib2wgaW5zdGFuY2VvZiBQSVhJLlNwcml0ZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3ltYm9sWydwaXZvdCddLnggPSBwaXZvdFg7XHJcbiAgICAgICAgICAgIHRoaXMuX3N5bWJvbFsncGl2b3QnXS55ID0gcGl2b3RZO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9zeW1ib2xbJ3NrZXcnXS5zZXQoc2tld1gsIHNrZXdZKTtcclxuICAgICAgICB0aGlzLmFscGhhID0gYWxwaGE7XHJcbiAgICAgICAgdGhpcy52aXNpYmxlID0ga2V5ZnJhbWUudmlzaWJsZTtcclxuICAgICAgICB0aGlzLl9mcmFtZSA9IGZyYW1lO1xyXG4gICAgfTtcclxuICAgIE1vdmllTGF5ZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9zeW1ib2wgaW5zdGFuY2VvZiBGbHVtcE1vdmllXzEuRmx1bXBNb3ZpZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zeW1ib2wucmVzZXQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLl9zeW1ib2xzKSB7XHJcbiAgICAgICAgICAgIHZhciBzeW1ib2wgPSB0aGlzLl9zeW1ib2xzW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAoc3ltYm9sIGluc3RhbmNlb2YgRmx1bXBNb3ZpZV8xLkZsdW1wTW92aWUpIHtcclxuICAgICAgICAgICAgICAgIHN5bWJvbC5yZXNldCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBNb3ZpZUxheWVyO1xyXG59KFBJWEkuQ29udGFpbmVyKSk7XHJcbmV4cG9ydHMuTW92aWVMYXllciA9IE1vdmllTGF5ZXI7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgVGV4dHVyZUdyb3VwQXRsYXNfMSA9IHJlcXVpcmUoXCIuL1RleHR1cmVHcm91cEF0bGFzXCIpO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4uL3V0aWwvUHJvbWlzZVwiKTtcclxudmFyIFRleHR1cmVHcm91cCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBUZXh0dXJlR3JvdXAobmFtZXMsIHRleHR1cmVzLCBhbmNvcnMpIHtcclxuICAgICAgICB0aGlzLl9uYW1lcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3RleHR1cmVzID0gW107XHJcbiAgICAgICAgdGhpcy5fYW5jb3JzID0gW107XHJcbiAgICAgICAgdGhpcy5fbmFtZXMgPSBuYW1lcztcclxuICAgICAgICB0aGlzLl90ZXh0dXJlcyA9IHRleHR1cmVzO1xyXG4gICAgICAgIHRoaXMuX2FuY29ycyA9IGFuY29ycztcclxuICAgIH1cclxuICAgIFRleHR1cmVHcm91cC5sb2FkID0gZnVuY3Rpb24gKGxpYnJhcnksIGpzb24pIHtcclxuICAgICAgICB2YXIgYXRsYXNlcyA9IGpzb24uYXRsYXNlcztcclxuICAgICAgICB2YXIgbG9hZGVycyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXRsYXNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgYXRsYXMgPSBhdGxhc2VzW2ldO1xyXG4gICAgICAgICAgICBsb2FkZXJzLnB1c2goVGV4dHVyZUdyb3VwQXRsYXNfMS5UZXh0dXJlR3JvdXBBdGxhcy5sb2FkKGxpYnJhcnksIGF0bGFzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlXzEuUHJvbWlzZS5hbGwobG9hZGVycykudGhlbihmdW5jdGlvbiAoYXRsYXNlcykge1xyXG4gICAgICAgICAgICB2YXIgbmFtZXMgPSBbXTtcclxuICAgICAgICAgICAgdmFyIHRleHR1cmVzID0gW107XHJcbiAgICAgICAgICAgIHZhciBhbmNvcnMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdGxhc2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXRsYXMgPSBhdGxhc2VzW2ldO1xyXG4gICAgICAgICAgICAgICAgbmFtZXMgPSBuYW1lcy5jb25jYXQoYXRsYXMuZ2V0TmFtZXMoKSk7XHJcbiAgICAgICAgICAgICAgICB0ZXh0dXJlcyA9IHRleHR1cmVzLmNvbmNhdChhdGxhcy5nZXRUZXh0dXJlcygpKTtcclxuICAgICAgICAgICAgICAgIGFuY29ycyA9IGFuY29ycy5jb25jYXQoYXRsYXMuZ2V0QW5jaG9ycygpKTtcclxuICAgICAgICAgICAgICAgIGF0bGFzLmRlc3RydWN0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBUZXh0dXJlR3JvdXAobmFtZXMsIHRleHR1cmVzLCBhbmNvcnMpO1xyXG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdjb3VsZCBub3QgbG9hZCB0ZXh0dXJlR3JvdXAnLCBlcnIpO1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCBsb2FkIHRleHR1cmVHcm91cCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFRleHR1cmVHcm91cC5wcm90b3R5cGUuaGFzU3ByaXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXMuaW5kZXhPZihuYW1lKSA+IC0xO1xyXG4gICAgfTtcclxuICAgIFRleHR1cmVHcm91cC5wcm90b3R5cGUuY3JlYXRlU3ByaXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9uYW1lcy5pbmRleE9mKG5hbWUpO1xyXG4gICAgICAgIHZhciBzcHJpdGUgPSBuZXcgUElYSS5TcHJpdGUodGhpcy5fdGV4dHVyZXNbaW5kZXhdKTtcclxuICAgICAgICBzcHJpdGUuYW5jaG9yLnNldCh0aGlzLl9hbmNvcnNbaW5kZXhdLngsIHRoaXMuX2FuY29yc1tpbmRleF0ueSk7XHJcbiAgICAgICAgc3ByaXRlLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHJldHVybiBzcHJpdGU7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFRleHR1cmVHcm91cDtcclxufSgpKTtcclxuZXhwb3J0cy5UZXh0dXJlR3JvdXAgPSBUZXh0dXJlR3JvdXA7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUHJvbWlzZV8xID0gcmVxdWlyZShcIi4uL3V0aWwvUHJvbWlzZVwiKTtcclxudmFyIFRleHR1cmUgPSBQSVhJLlRleHR1cmU7XHJcbnZhciBCYXNlVGV4dHVyZSA9IFBJWEkuQmFzZVRleHR1cmU7XHJcbnZhciBSZWN0YW5nbGUgPSBQSVhJLlJlY3RhbmdsZTtcclxudmFyIFBvaW50ID0gUElYSS5Qb2ludDtcclxudmFyIFRleHR1cmVHcm91cEF0bGFzID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFRleHR1cmVHcm91cEF0bGFzKHJlbmRlclRleHR1cmUsIGpzb24pIHtcclxuICAgICAgICB0aGlzLl9uYW1lcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX3RleHR1cmVzID0gW107XHJcbiAgICAgICAgdGhpcy5fYW5jaG9ycyA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2Jhc2VUZXh0dXJlID0gbmV3IEJhc2VUZXh0dXJlKHJlbmRlclRleHR1cmUpO1xyXG4gICAgICAgIHRoaXMuX2F0bGFzID0ganNvbjtcclxuICAgICAgICB2YXIgYXRsYXNUZXh0dXJlcyA9IHRoaXMuX2F0bGFzLnRleHR1cmVzO1xyXG4gICAgICAgIHZhciBiYXNlVGV4dHVyZSA9IHRoaXMuX2Jhc2VUZXh0dXJlO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXRsYXNUZXh0dXJlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgYXRsYXNUZXh0dXJlID0gYXRsYXNUZXh0dXJlc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5fbmFtZXMucHVzaChhdGxhc1RleHR1cmUuc3ltYm9sKTtcclxuICAgICAgICAgICAgdGhpcy5fdGV4dHVyZXMucHVzaChuZXcgVGV4dHVyZShiYXNlVGV4dHVyZSwgbmV3IFJlY3RhbmdsZShhdGxhc1RleHR1cmUucmVjdFswXSwgYXRsYXNUZXh0dXJlLnJlY3RbMV0sIGF0bGFzVGV4dHVyZS5yZWN0WzJdLCBhdGxhc1RleHR1cmUucmVjdFszXSkpKTtcclxuICAgICAgICAgICAgdGhpcy5fYW5jaG9ycy5wdXNoKG5ldyBQb2ludChhdGxhc1RleHR1cmUub3JpZ2luWzBdIC8gYXRsYXNUZXh0dXJlLnJlY3RbMl0sIGF0bGFzVGV4dHVyZS5vcmlnaW5bMV0gLyBhdGxhc1RleHR1cmUucmVjdFszXSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFRleHR1cmVHcm91cEF0bGFzLmxvYWQgPSBmdW5jdGlvbiAobGlicmFyeSwganNvbikge1xyXG4gICAgICAgIHZhciBmaWxlID0ganNvbi5maWxlO1xyXG4gICAgICAgIHZhciB1cmwgPSBsaWJyYXJ5LnVybCArICcvJyArIGZpbGU7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlXzEuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgICAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoaW1nKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1nLnNyYyA9IHVybDtcclxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7IHJldHVybiBuZXcgVGV4dHVyZUdyb3VwQXRsYXMoZGF0YSwganNvbik7IH0pO1xyXG4gICAgfTtcclxuICAgIFRleHR1cmVHcm91cEF0bGFzLnByb3RvdHlwZS5nZXROYW1lcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXM7XHJcbiAgICB9O1xyXG4gICAgVGV4dHVyZUdyb3VwQXRsYXMucHJvdG90eXBlLmdldFRleHR1cmVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl90ZXh0dXJlcztcclxuICAgIH07XHJcbiAgICBUZXh0dXJlR3JvdXBBdGxhcy5wcm90b3R5cGUuZ2V0QW5jaG9ycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYW5jaG9ycztcclxuICAgIH07XHJcbiAgICBUZXh0dXJlR3JvdXBBdGxhcy5wcm90b3R5cGUuZGVzdHJ1Y3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fbmFtZXMgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX3RleHR1cmVzID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9hbmNob3JzID0gbnVsbDtcclxuICAgIH07XHJcbiAgICByZXR1cm4gVGV4dHVyZUdyb3VwQXRsYXM7XHJcbn0oKSk7XHJcbmV4cG9ydHMuVGV4dHVyZUdyb3VwQXRsYXMgPSBUZXh0dXJlR3JvdXBBdGxhcztcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBLZXlmcmFtZURhdGEgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gS2V5ZnJhbWVEYXRhKGpzb24pIHtcclxuICAgICAgICBpZiAoanNvbiBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbUFycmF5KGpzb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGpzb25PYmplY3QgPSBqc29uO1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4ID0ganNvbk9iamVjdC5pbmRleDtcclxuICAgICAgICAgICAgdGhpcy5kdXJhdGlvbiA9IGpzb25PYmplY3QuZHVyYXRpb247XHJcbiAgICAgICAgICAgIHRoaXMucmVmID0gJ3JlZicgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QucmVmIDogbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5sYWJlbCA9ICdsYWJlbCcgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QubGFiZWwgOiBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLnggPSAnbG9jJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC5sb2NbMF0gOiAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMueSA9ICdsb2MnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LmxvY1sxXSA6IDAuMDtcclxuICAgICAgICAgICAgdGhpcy5zY2FsZVggPSAnc2NhbGUnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnNjYWxlWzBdIDogMS4wO1xyXG4gICAgICAgICAgICB0aGlzLnNjYWxlWSA9ICdzY2FsZScgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3Quc2NhbGVbMV0gOiAxLjA7XHJcbiAgICAgICAgICAgIHRoaXMuc2tld1ggPSAnc2tldycgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3Quc2tld1swXSA6IDAuMDtcclxuICAgICAgICAgICAgdGhpcy5za2V3WSA9ICdza2V3JyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC5za2V3WzFdIDogMC4wO1xyXG4gICAgICAgICAgICB0aGlzLnBpdm90WCA9ICdwaXZvdCcgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QucGl2b3RbMF0gOiAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMucGl2b3RZID0gJ3Bpdm90JyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC5waXZvdFsxXSA6IDAuMDtcclxuICAgICAgICAgICAgdGhpcy52aXNpYmxlID0gJ3Zpc2libGUnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnZpc2libGUgOiB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmFscGhhID0gJ2FscGhhJyBpbiBqc29uT2JqZWN0ID8ganNvbk9iamVjdC5hbHBoYSA6IDEuMDtcclxuICAgICAgICAgICAgdGhpcy50d2VlbmVkID0gJ3R3ZWVuZWQnIGluIGpzb25PYmplY3QgPyBqc29uT2JqZWN0LnR3ZWVuZWQgOiB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmVhc2UgPSAnZWFzZScgaW4ganNvbk9iamVjdCA/IGpzb25PYmplY3QuZWFzZSA6IDAuMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBLZXlmcmFtZURhdGEucHJvdG90eXBlLmdldFZhbHVlT3JkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgJ2luZGV4JyxcclxuICAgICAgICAgICAgJ2R1cmF0aW9uJyxcclxuICAgICAgICAgICAgJ3JlZicsXHJcbiAgICAgICAgICAgICdsYWJlbCcsXHJcbiAgICAgICAgICAgICd4JywgJ3knLFxyXG4gICAgICAgICAgICAnc2NhbGVYJywgJ3NjYWxlWScsXHJcbiAgICAgICAgICAgICdza2V3WCcsICdza2V3WScsXHJcbiAgICAgICAgICAgICdwaXZvdFgnLCAncGl2b3RZJyxcclxuICAgICAgICAgICAgJ3Zpc2libGUnLFxyXG4gICAgICAgICAgICAnYWxwaGEnLFxyXG4gICAgICAgICAgICAndHdlZW5lZCcsXHJcbiAgICAgICAgICAgICdlYXNlJ1xyXG4gICAgICAgIF07XHJcbiAgICB9O1xyXG4gICAgS2V5ZnJhbWVEYXRhLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBvcmRlciA9IHRoaXMuZ2V0VmFsdWVPcmRlcigpO1xyXG4gICAgICAgIHZhciBkYXRhID0gbmV3IEFycmF5KG9yZGVyLmxlbmd0aCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcmRlci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IG9yZGVyW2ldO1xyXG4gICAgICAgICAgICBkYXRhW2ldID0gdGhpc1tuYW1lXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9O1xyXG4gICAgS2V5ZnJhbWVEYXRhLnByb3RvdHlwZS5mcm9tQXJyYXkgPSBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIHZhciBvcmRlciA9IHRoaXMuZ2V0VmFsdWVPcmRlcigpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IG9yZGVyW2ldO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2ldO1xyXG4gICAgICAgICAgICB0aGlzW25hbWVdID0gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIEtleWZyYW1lRGF0YS5wcm90b3R5cGUuY29weU5vdERlZmluZWQgPSBmdW5jdGlvbiAoa2V5ZnJhbWUpIHtcclxuICAgICAgICB2YXIgb3JkZXIgPSB0aGlzLmdldFZhbHVlT3JkZXIoKTtcclxuICAgICAgICB2YXIgZGF0YSA9IGtleWZyYW1lLnRvQXJyYXkoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBvcmRlcltpXTtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtpXTtcclxuICAgICAgICAgICAgaWYgKHRoaXNbbmFtZV0gPT0gdm9pZCAwICYmIHZhbHVlICE9IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpc1tuYW1lXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBLZXlmcmFtZURhdGE7XHJcbn0oKSk7XHJcbmV4cG9ydHMuS2V5ZnJhbWVEYXRhID0gS2V5ZnJhbWVEYXRhO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIExhYmVsRGF0YSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBMYWJlbERhdGEobGFiZWwsIGluZGV4LCBkdXJhdGlvbikge1xyXG4gICAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcclxuICAgICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIExhYmVsRGF0YTtcclxufSgpKTtcclxuZXhwb3J0cy5MYWJlbERhdGEgPSBMYWJlbERhdGE7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgS2V5ZnJhbWVEYXRhXzEgPSByZXF1aXJlKFwiLi9LZXlmcmFtZURhdGFcIik7XHJcbnZhciBMYXllckRhdGEgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gTGF5ZXJEYXRhKGpzb24pIHtcclxuICAgICAgICB0aGlzLmtleWZyYW1lRGF0YSA9IFtdO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IGpzb24ubmFtZTtcclxuICAgICAgICB0aGlzLmZsaXBib29rID0gJ2ZsaXBib29rJyBpbiBqc29uID8gISFqc29uLmZsaXBib29rIDogZmFsc2U7XHJcbiAgICAgICAgdmFyIGtleWZyYW1lcyA9IGpzb24ua2V5ZnJhbWVzO1xyXG4gICAgICAgIHZhciBrZXlGcmFtZURhdGEgPSBudWxsO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5ZnJhbWVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXlmcmFtZSA9IGtleWZyYW1lc1tpXTtcclxuICAgICAgICAgICAga2V5RnJhbWVEYXRhID0gbmV3IEtleWZyYW1lRGF0YV8xLktleWZyYW1lRGF0YShrZXlmcmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMua2V5ZnJhbWVEYXRhLnB1c2goa2V5RnJhbWVEYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5mcmFtZXMgPSBrZXlGcmFtZURhdGEuaW5kZXggKyBrZXlGcmFtZURhdGEuZHVyYXRpb247XHJcbiAgICB9XHJcbiAgICBMYXllckRhdGEucHJvdG90eXBlLmdldEtleWZyYW1lRm9yRnJhbWUgPSBmdW5jdGlvbiAoZnJhbWUpIHtcclxuICAgICAgICB2YXIgZGF0YXMgPSB0aGlzLmtleWZyYW1lRGF0YTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGRhdGFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhc1tpXS5pbmRleCA+IGZyYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YXNbaSAtIDFdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhc1tkYXRhcy5sZW5ndGggLSAxXTtcclxuICAgIH07XHJcbiAgICBMYXllckRhdGEucHJvdG90eXBlLmdldEtleWZyYW1lQWZ0ZXIgPSBmdW5jdGlvbiAoZmx1bXBLZXlmcmFtZURhdGEpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMua2V5ZnJhbWVEYXRhLmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5rZXlmcmFtZURhdGFbaV0gPT09IGZsdW1wS2V5ZnJhbWVEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5rZXlmcmFtZURhdGFbaSArIDFdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBMYXllckRhdGE7XHJcbn0oKSk7XHJcbmV4cG9ydHMuTGF5ZXJEYXRhID0gTGF5ZXJEYXRhO1xyXG4iLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIExheWVyRGF0YV8xID0gcmVxdWlyZShcIi4vTGF5ZXJEYXRhXCIpO1xyXG52YXIgTW92aWVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIE1vdmllRGF0YShsaWJyYXJ5LCBqc29uKSB7XHJcbiAgICAgICAgdGhpcy5mcmFtZXMgPSAwO1xyXG4gICAgICAgIHZhciBsYXllcnMgPSBqc29uLmxheWVycztcclxuICAgICAgICB0aGlzLmlkID0ganNvbi5pZDtcclxuICAgICAgICB0aGlzLmxheWVyRGF0YSA9IG5ldyBBcnJheShsYXllcnMubGVuZ3RoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLmxheWVyRGF0YVtpXSA9IG5ldyBMYXllckRhdGFfMS5MYXllckRhdGEobGF5ZXJzW2ldKTtcclxuICAgICAgICAgICAgdGhpcy5mcmFtZXMgPSBNYXRoLm1heCh0aGlzLmZyYW1lcywgbGF5ZXIuZnJhbWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTW92aWVEYXRhO1xyXG59KCkpO1xyXG5leHBvcnRzLk1vdmllRGF0YSA9IE1vdmllRGF0YTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBGbHVtcExpYnJhcnlfMSA9IHJlcXVpcmUoXCIuL0ZsdW1wTGlicmFyeVwiKTtcclxubW9kdWxlLmV4cG9ydHMgPSBGbHVtcExpYnJhcnlfMS5GbHVtcExpYnJhcnk7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59O1xyXG52YXIgUXVldWVfMSA9IHJlcXVpcmUoXCIuL1F1ZXVlXCIpO1xyXG52YXIgQW5pbWF0aW9uUXVldWUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKEFuaW1hdGlvblF1ZXVlLCBfc3VwZXIpO1xyXG4gICAgZnVuY3Rpb24gQW5pbWF0aW9uUXVldWUoZnBzLCB1bml0KSB7XHJcbiAgICAgICAgaWYgKHVuaXQgPT09IHZvaWQgMCkgeyB1bml0ID0gMTAwMDsgfVxyXG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuZnJhbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuX2ZyZWV6ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuX2hhc1N0b3BwZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLl90aW1lID0gMDtcclxuICAgICAgICB0aGlzLl9mcG1zID0gMDtcclxuICAgICAgICB0aGlzLl9mcG1zID0gdW5pdCAvIGZwcztcclxuICAgIH1cclxuICAgIEFuaW1hdGlvblF1ZXVlLnByb3RvdHlwZS5vblRpY2sgPSBmdW5jdGlvbiAoZGVsdGEpIHtcclxuICAgICAgICB2YXIgdGltZSA9IHRoaXMuX3RpbWUgKz0gZGVsdGE7XHJcbiAgICAgICAgaWYgKCh0aGlzLmN1cnJlbnQgIT0gbnVsbCB8fCB0aGlzLm5leHQoKSAhPSBudWxsKSkge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IHRoaXMuY3VycmVudDtcclxuICAgICAgICAgICAgdmFyIGZyb20gPSBjdXJyZW50LmZyb207XHJcbiAgICAgICAgICAgIHZhciBkdXJhdGlvbiA9IGN1cnJlbnQuZHVyYXRpb247XHJcbiAgICAgICAgICAgIHZhciB0aW1lcyA9IGN1cnJlbnQudGltZXM7XHJcbiAgICAgICAgICAgIHZhciBmcmFtZSA9IChkdXJhdGlvbiAqIHRpbWUgLyAoZHVyYXRpb24gKiB0aGlzLl9mcG1zKSk7XHJcbiAgICAgICAgICAgIGlmICh0aW1lcyA+IC0xICYmIHRpbWVzIC0gKGZyYW1lIC8gZHVyYXRpb24pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyYW1lID0gZnJvbSArIChmcmFtZSAlIGR1cmF0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBBbmltYXRpb25RdWV1ZS5wcm90b3R5cGUuaGFzU3RvcHBlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gIXRoaXMuY3VycmVudCAmJiAhdGhpcy5oYXNOZXh0KCk7XHJcbiAgICB9O1xyXG4gICAgQW5pbWF0aW9uUXVldWUucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIG5leHQgPSBfc3VwZXIucHJvdG90eXBlLm5leHQuY2FsbCh0aGlzKTtcclxuICAgICAgICBpZiAobmV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXh0O1xyXG4gICAgfTtcclxuICAgIEFuaW1hdGlvblF1ZXVlLnByb3RvdHlwZS5nZXRGcmFtZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5mcmFtZTtcclxuICAgIH07XHJcbiAgICBBbmltYXRpb25RdWV1ZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fZnJlZXplID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fdGltZSA9IHRoaXMuX3RpbWUgJSB0aGlzLl9mcG1zO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBBbmltYXRpb25RdWV1ZTtcclxufShRdWV1ZV8xLlF1ZXVlKSk7XHJcbmV4cG9ydHMuQW5pbWF0aW9uUXVldWUgPSBBbmltYXRpb25RdWV1ZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBQcm9taXNlXzEgPSByZXF1aXJlKFwiLi4vdXRpbC9Qcm9taXNlXCIpO1xyXG52YXIgSHR0cFJlcXVlc3QgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gSHR0cFJlcXVlc3QoKSB7XHJcbiAgICB9XHJcbiAgICBIdHRwUmVxdWVzdC5yZXF1ZXN0ID0gZnVuY3Rpb24gKG1ldGhvZCwgdXJsLCBhcmdzKSB7XHJcbiAgICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZV8xLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgY2xpZW50ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgICAgIHZhciB1cmkgPSB1cmw7XHJcbiAgICAgICAgICAgIGlmIChhcmdzICYmIChtZXRob2QgPT09ICdQT1NUJyB8fCBtZXRob2QgPT09ICdQVVQnKSkge1xyXG4gICAgICAgICAgICAgICAgdXJpICs9ICc/JztcclxuICAgICAgICAgICAgICAgIHZhciBhcmdjb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXJncykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ2NvdW50KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVyaSArPSAnJic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJpICs9IGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGFyZ3Nba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNsaWVudC5vcGVuKG1ldGhvZCwgdXJpKTtcclxuICAgICAgICAgICAgY2xpZW50LnNlbmQoKTtcclxuICAgICAgICAgICAgY2xpZW50Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwIHx8IHRoaXMuc3RhdHVzID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3BvbnNlIHx8IHRoaXMucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdCh0aGlzLnN0YXR1c1RleHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjbGllbnQub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdCh0aGlzLnN0YXR1c1RleHQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xyXG4gICAgfTtcclxuICAgIEh0dHBSZXF1ZXN0LmdldFN0cmluZyA9IGZ1bmN0aW9uICh1cmwsIHF1ZXJ5KSB7XHJcbiAgICAgICAgaWYgKHF1ZXJ5ID09PSB2b2lkIDApIHsgcXVlcnkgPSB7fTsgfVxyXG4gICAgICAgIHJldHVybiBIdHRwUmVxdWVzdC5yZXF1ZXN0KCdHRVQnLCB1cmwsIHF1ZXJ5KTtcclxuICAgIH07XHJcbiAgICBIdHRwUmVxdWVzdC5nZXRKU09OID0gZnVuY3Rpb24gKHVybCwgcXVlcnkpIHtcclxuICAgICAgICBpZiAocXVlcnkgPT09IHZvaWQgMCkgeyBxdWVyeSA9IHt9OyB9XHJcbiAgICAgICAgcmV0dXJuIEh0dHBSZXF1ZXN0LmdldFN0cmluZyh1cmwsIHF1ZXJ5KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXNwb25zZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEh0dHBSZXF1ZXN0O1xyXG59KCkpO1xyXG5leHBvcnRzLkh0dHBSZXF1ZXN0ID0gSHR0cFJlcXVlc3Q7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgYXNhcCA9ICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nICYmIHNldEltbWVkaWF0ZSkgfHxcclxuICAgIGZ1bmN0aW9uIChmbikge1xyXG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDEpO1xyXG4gICAgfTtcclxuaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xyXG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAob1RoaXMpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGFBcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZlRvQmluZCA9IHRoaXMsIGZOT1AgPSBmdW5jdGlvbiAoKSB7IH0sIGZCb3VuZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcclxuICAgICAgICAgICAgICAgID8gdGhpc1xyXG4gICAgICAgICAgICAgICAgOiBvVGhpcywgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmICh0aGlzLnByb3RvdHlwZSkge1xyXG4gICAgICAgICAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcclxuICAgICAgICByZXR1cm4gZkJvdW5kO1xyXG4gICAgfTtcclxufVxyXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBcIltvYmplY3QgQXJyYXldXCI7IH07XHJcbmZ1bmN0aW9uIGhhbmRsZShkZWZlcnJlZCkge1xyXG4gICAgdmFyIG1lID0gdGhpcztcclxuICAgIGlmICh0aGlzLl9zdGF0ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgIHRoaXMuX2RlZmVycmVkcy5wdXNoKGRlZmVycmVkKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBhc2FwKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY2IgPSBtZVsnX3N0YXRlJ10gPyBkZWZlcnJlZC5vbkZ1bGZpbGxlZCA6IGRlZmVycmVkLm9uUmVqZWN0ZWQ7XHJcbiAgICAgICAgaWYgKGNiID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIChtZVsnX3N0YXRlJ10gPyBkZWZlcnJlZC5yZXNvbHZlIDogZGVmZXJyZWQucmVqZWN0KShtZS5fdmFsdWUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciByZXQ7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0ID0gY2IobWUuX3ZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUocmV0KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHJlc29sdmUobmV3VmFsdWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB0aGlzKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLicpO1xyXG4gICAgICAgIGlmIChuZXdWYWx1ZSAmJiAodHlwZW9mIG5ld1ZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbmV3VmFsdWUgPT09ICdmdW5jdGlvbicpKSB7XHJcbiAgICAgICAgICAgIHZhciB0aGVuID0gbmV3VmFsdWUudGhlbjtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICBkb1Jlc29sdmUodGhlbi5iaW5kKG5ld1ZhbHVlKSwgcmVzb2x2ZS5iaW5kKHRoaXMpLCByZWplY3QuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpc1snX3N0YXRlJ10gPSB0cnVlO1xyXG4gICAgICAgIHRoaXNbJ192YWx1ZSddID0gbmV3VmFsdWU7XHJcbiAgICAgICAgZmluYWxlLmNhbGwodGhpcyk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIHJlamVjdC5jYWxsKHRoaXMsIGUpO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHJlamVjdChuZXdWYWx1ZSkge1xyXG4gICAgdGhpcy5fc3RhdGUgPSBmYWxzZTtcclxuICAgIHRoaXMuX3ZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICBmaW5hbGUuY2FsbCh0aGlzKTtcclxufVxyXG5mdW5jdGlvbiBmaW5hbGUoKSB7XHJcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5fZGVmZXJyZWRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgaGFuZGxlLmNhbGwodGhpcywgdGhpcy5fZGVmZXJyZWRzW2ldKTtcclxuICAgIH1cclxuICAgIHRoaXMuX2RlZmVycmVkcyA9IG51bGw7XHJcbn1cclxuZnVuY3Rpb24gSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICB0aGlzLm9uRnVsZmlsbGVkID0gdHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nID8gb25GdWxmaWxsZWQgOiBudWxsO1xyXG4gICAgdGhpcy5vblJlamVjdGVkID0gdHlwZW9mIG9uUmVqZWN0ZWQgPT09ICdmdW5jdGlvbicgPyBvblJlamVjdGVkIDogbnVsbDtcclxuICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XHJcbiAgICB0aGlzLnJlamVjdCA9IHJlamVjdDtcclxufVxyXG5mdW5jdGlvbiBkb1Jlc29sdmUoZm4sIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XHJcbiAgICB2YXIgZG9uZSA9IGZhbHNlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBmbihmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGRvbmUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICBvbkZ1bGZpbGxlZCh2YWx1ZSk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xyXG4gICAgICAgICAgICBpZiAoZG9uZSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XHJcbiAgICAgICAgICAgIG9uUmVqZWN0ZWQocmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGNhdGNoIChleCkge1xyXG4gICAgICAgIGlmIChkb25lKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgZG9uZSA9IHRydWU7XHJcbiAgICAgICAgb25SZWplY3RlZChleCk7XHJcbiAgICB9XHJcbn1cclxudmFyIFByb21pc2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gUHJvbWlzZShpbml0KSB7XHJcbiAgICAgICAgdGhpcy5fc3RhdGUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gbnVsbDtcclxuICAgICAgICB0aGlzLl9kZWZlcnJlZHMgPSBbXTtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdvYmplY3QnKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdQcm9taXNlcyBtdXN0IGJlIGNvbnN0cnVjdGVkIHZpYSBuZXcnKTtcclxuICAgICAgICBpZiAodHlwZW9mIGluaXQgIT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ25vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgZG9SZXNvbHZlKGluaXQsIHJlc29sdmUuYmluZCh0aGlzKSwgcmVqZWN0LmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG4gICAgUHJvbWlzZS5hbGwgPSBmdW5jdGlvbiAocHJvbWlzZUxpc3QpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICBpZiAocHJvbWlzZUxpc3QubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoW10pO1xyXG4gICAgICAgICAgICB2YXIgcmVtYWluaW5nID0gcHJvbWlzZUxpc3QubGVuZ3RoO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiByZXMoaSwgdmFsKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwgJiYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGVuID0gdmFsLnRoZW47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbi5jYWxsKHZhbCwgZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyhpLCB2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlTGlzdFtpXSA9IHZhbDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShwcm9taXNlTGlzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb21pc2VMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICByZXMoaSwgcHJvbWlzZUxpc3RbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgUHJvbWlzZS5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgUHJvbWlzZS5yZWplY3QgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICByZWplY3QodmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFByb21pc2UucmFjZSA9IGZ1bmN0aW9uICh2YWx1ZXMpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmFsdWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZXNbaV0udGhlbihyZXNvbHZlLCByZWplY3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgUHJvbWlzZS5fc2V0SW1tZWRpYXRlRm4gPSBmdW5jdGlvbiAoZm4pIHtcclxuICAgICAgICBhc2FwID0gZm47XHJcbiAgICB9O1xyXG4gICAgUHJvbWlzZS5wcm90b3R5cGUuY2F0Y2ggPSBmdW5jdGlvbiAob25SZWplY3RlZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XHJcbiAgICB9O1xyXG4gICAgUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xyXG4gICAgICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgaGFuZGxlLmNhbGwobWUsIG5ldyBIYW5kbGVyKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCByZXNvbHZlLCByZWplY3QpKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gUHJvbWlzZTtcclxufSgpKTtcclxuZXhwb3J0cy5Qcm9taXNlID0gUHJvbWlzZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBQcm9taXNlXzEgPSByZXF1aXJlKFwiLi9Qcm9taXNlXCIpO1xyXG52YXIgUHJvbWlzZVV0aWwgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gUHJvbWlzZVV0aWwoKSB7XHJcbiAgICB9XHJcbiAgICBQcm9taXNlVXRpbC53YWl0ID0gZnVuY3Rpb24gKGxpc3QsIG9uUHJvZ3Jlc3MpIHtcclxuICAgICAgICBpZiAob25Qcm9ncmVzcyA9PT0gdm9pZCAwKSB7IG9uUHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHsgfTsgfVxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZV8xLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcclxuICAgICAgICAgICAgdmFyIG5ld0xpc3QgPSBbXTtcclxuICAgICAgICAgICAgdmFyIHRoZW4gPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIG5ld0xpc3QucHVzaChyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICBvblByb2dyZXNzKG5ld0xpc3QubGVuZ3RoIC8gbGlzdC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5ld0xpc3QubGVuZ3RoID09IGxpc3QubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShuZXdMaXN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsaXN0W2ldLnRoZW4odGhlbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBQcm9taXNlVXRpbC53YWl0Rm9yTG9hZGFibGUgPSBmdW5jdGlvbiAobGlzdCwgb25Qcm9ncmVzcykge1xyXG4gICAgICAgIGlmIChvblByb2dyZXNzID09PSB2b2lkIDApIHsgb25Qcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzcykgeyB9OyB9XHJcbiAgICAgICAgdmFyIGNvdW50ID0gbGlzdC5sZW5ndGg7XHJcbiAgICAgICAgdmFyIHByb2dyZXNzTGlzdCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBwcm9ncmVzc0xpc3QucHVzaCgwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHBydlByb2dyZXNzID0gZnVuY3Rpb24gKGluZGV4LCBwcm9ncmVzcykge1xyXG4gICAgICAgICAgICBwcm9ncmVzc0xpc3RbaW5kZXhdID0gcHJvZ3Jlc3M7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDA7XHJcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBwcm9ncmVzc0xpc3QubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSBwcm9ncmVzc0xpc3RbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb25Qcm9ncmVzcyh0b3RhbCAvIGNvdW50KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBwcm9taXNlTGlzdCA9IG5ldyBBcnJheShjb3VudCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHByb21pc2VMaXN0W2ldID0gbGlzdFtpXS5sb2FkKHBydlByb2dyZXNzLmJpbmQodGhpcywgaSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZVV0aWwud2FpdChwcm9taXNlTGlzdCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFByb21pc2VVdGlsO1xyXG59KCkpO1xyXG5leHBvcnRzLlByb21pc2VVdGlsID0gUHJvbWlzZVV0aWw7XHJcbiIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUXVldWUgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gUXVldWUoKSB7XHJcbiAgICAgICAgdGhpcy5fbGlzdCA9IFtdO1xyXG4gICAgICAgIHRoaXMuX2xpc3RMZW5ndGggPSAwO1xyXG4gICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBRdWV1ZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICB0aGlzLl9saXN0LnB1c2goaXRlbSk7XHJcbiAgICAgICAgdGhpcy5fbGlzdExlbmd0aCsrO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIFF1ZXVlLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMua2lsbCgpO1xyXG4gICAgICAgIGlmICh0aGlzLl9saXN0TGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSB0aGlzLl9saXN0LnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3RMZW5ndGgtLTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XHJcbiAgICB9O1xyXG4gICAgUXVldWUucHJvdG90eXBlLmhhc05leHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xpc3RMZW5ndGggPiAwO1xyXG4gICAgfTtcclxuICAgIFF1ZXVlLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAoYWxsKSB7XHJcbiAgICAgICAgaWYgKGFsbCA9PT0gdm9pZCAwKSB7IGFsbCA9IGZhbHNlOyB9XHJcbiAgICAgICAgaWYgKGFsbCkge1xyXG4gICAgICAgICAgICB0aGlzLl9saXN0Lmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3RMZW5ndGggPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudC50aW1lcyA9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIFF1ZXVlLnByb3RvdHlwZS5raWxsID0gZnVuY3Rpb24gKGFsbCkge1xyXG4gICAgICAgIGlmIChhbGwgPT09IHZvaWQgMCkgeyBhbGwgPSBmYWxzZTsgfVxyXG4gICAgICAgIGlmIChhbGwpIHtcclxuICAgICAgICAgICAgdGhpcy5fbGlzdC5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgICB0aGlzLl9saXN0TGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudCkge1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IHRoaXMuY3VycmVudDtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbnVsbDtcclxuICAgICAgICAgICAgY3VycmVudC5maW5pc2goKTtcclxuICAgICAgICAgICAgY3VycmVudC5kZXN0cnVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICByZXR1cm4gUXVldWU7XHJcbn0oKSk7XHJcbmV4cG9ydHMuUXVldWUgPSBRdWV1ZTtcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBRdWV1ZUl0ZW0gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gUXVldWVJdGVtKGxhYmVsLCBmcm9tLCB0bywgdGltZXMsIGRlbGF5KSB7XHJcbiAgICAgICAgaWYgKHRpbWVzID09PSB2b2lkIDApIHsgdGltZXMgPSAxOyB9XHJcbiAgICAgICAgaWYgKGRlbGF5ID09PSB2b2lkIDApIHsgZGVsYXkgPSAwOyB9XHJcbiAgICAgICAgdGhpcy5fY29tcGxldGUgPSBudWxsO1xyXG4gICAgICAgIGlmIChmcm9tID4gdG8pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhcmd1bWVudCBcImZyb21cIiBjYW5ub3QgYmUgYmlnZ2VyIHRoYW4gYXJndW1lbnQgXCJ0b1wiJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcclxuICAgICAgICB0aGlzLmZyb20gPSBmcm9tO1xyXG4gICAgICAgIHRoaXMudG8gPSB0bztcclxuICAgICAgICB0aGlzLmR1cmF0aW9uID0gdG8gLSBmcm9tO1xyXG4gICAgICAgIHRoaXMudGltZXMgPSB0aW1lcztcclxuICAgICAgICB0aGlzLmRlbGF5ID0gZGVsYXk7XHJcbiAgICB9XHJcbiAgICBRdWV1ZUl0ZW0ucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAoY29tcGxldGUpIHtcclxuICAgICAgICB0aGlzLl9jb21wbGV0ZSA9IGNvbXBsZXRlO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuICAgIFF1ZXVlSXRlbS5wcm90b3R5cGUuZmluaXNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9jb21wbGV0ZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9jb21wbGV0ZS5jYWxsKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBRdWV1ZUl0ZW0ucHJvdG90eXBlLmRlc3RydWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMubGFiZWwgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuX2NvbXBsZXRlID0gbnVsbDtcclxuICAgIH07XHJcbiAgICByZXR1cm4gUXVldWVJdGVtO1xyXG59KCkpO1xyXG5leHBvcnRzLlF1ZXVlSXRlbSA9IFF1ZXVlSXRlbTtcclxuIl19

//# sourceMappingURL=pixi-flump.js.map
