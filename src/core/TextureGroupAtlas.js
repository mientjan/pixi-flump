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
