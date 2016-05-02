"use strict";
var Promise_1 = require("./util/Promise");
var HttpRequest_1 = require("./util/HttpRequest");
var MovieData_1 = require("./core/MovieData");
var TextureGroup_1 = require("./core/TextureGroup");
var FlumpMovie_1 = require("./core/FlumpMovie");
var PixiFlump = (function () {
    function PixiFlump(basePath) {
        this.movieData = [];
        this.textureGroups = [];
        this.fps = 0;
        this.isOptimised = false;
        this._hasLoaded = false;
        this._isLoading = false;
        if (basePath) {
            this.url = basePath;
        }
    }
    PixiFlump.load = function (url, flumpLibrary, onProcess) {
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
        if (flumpLibrary == void 0) {
            flumpLibrary = new PixiFlump(baseDir);
        }
        else {
            flumpLibrary.url = baseDir;
        }
        return HttpRequest_1.HttpRequest.getJSON(url).then(function (json) {
            return flumpLibrary.processData(json, onProcess);
        });
    };
    PixiFlump.prototype.hasLoaded = function () {
        return this._hasLoaded;
    };
    PixiFlump.prototype.isLoading = function () {
        return this._isLoading;
    };
    PixiFlump.prototype.load = function (onProgress) {
        var _this = this;
        if (this.hasLoaded()) {
            onProgress(1);
            return new Promise_1.Promise(function (resolve, reject) {
                resolve(_this);
            });
        }
        if (!this.url) {
            throw new Error('url is not set and there for can not be loaded');
        }
        return PixiFlump.load(this.url, this, onProgress).catch(function () {
            throw new Error('could not load library');
        });
    };
    PixiFlump.prototype.processData = function (json, onProcess) {
        var _this = this;
        this.md5 = json.md5;
        this.frameRate = json.frameRate;
        this.referenceList = json.referenceList || null;
        this.isOptimised = json.optimised || false;
        var textureGroupLoaders = [];
        for (var i = 0; i < json.movies.length; i++) {
            var flumpMovieData = new MovieData_1.FlumpMovieData(this, json.movies[i]);
            this.movieData.push(flumpMovieData);
        }
        var textureGroups = json.textureGroups;
        for (var i = 0; i < textureGroups.length; i++) {
            var textureGroup = textureGroups[i];
            var promise = TextureGroup_1.FlumpTextureGroup.load(this, textureGroup);
            textureGroupLoaders.push(promise);
        }
        return HttpRequest_1.HttpRequest.wait(textureGroupLoaders, onProcess)
            .then(function (textureGroups) {
            for (var i = 0; i < textureGroups.length; i++) {
                var textureGroup = textureGroups[i];
                _this.textureGroups.push(textureGroup);
            }
            _this._hasLoaded = true;
            return _this;
        });
    };
    PixiFlump.prototype.getFlumpMovieData = function (name) {
        for (var i = 0; i < this.movieData.length; i++) {
            var movieData = this.movieData[i];
            if (movieData.id == name) {
                return movieData;
            }
        }
        throw new Error('movie not found');
    };
    PixiFlump.prototype.createSymbol = function (name, paused) {
        if (paused === void 0) { paused = false; }
        for (var i = 0; i < this.textureGroups.length; i++) {
            var flumpTextures = this.textureGroups[i].flumpTextures;
            if (name in flumpTextures) {
                return flumpTextures[name];
            }
        }
        for (var i = 0; i < this.movieData.length; i++) {
            var movieData = this.movieData[i];
            if (movieData.id == name) {
                var movie = new FlumpMovie_1.FlumpMovie(this, name);
                movie.getQueue().add(new QueueItem(null, 0, movie.frames, -1, 0));
                movie.paused = paused;
                return movie;
            }
        }
        console.warn('no _symbol found: (' + name + ')');
        throw new Error("no _symbol found");
    };
    PixiFlump.prototype.createMovie = function (id) {
        if (this.referenceList) {
            var name = this.referenceList.indexOf(id);
        }
        else {
            var name = id;
        }
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
    PixiFlump.prototype.getNameFromReferenceList = function (value) {
        if (this.referenceList && typeof value == 'number') {
            return this.referenceList[value];
        }
        return value;
    };
    PixiFlump.EVENT_LOAD = 'load';
    return PixiFlump;
}());
exports.PixiFlump = PixiFlump;
//# sourceMappingURL=PixiFlump.js.map