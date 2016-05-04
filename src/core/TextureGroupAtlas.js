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
