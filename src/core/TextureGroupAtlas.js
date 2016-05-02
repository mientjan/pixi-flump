"use strict";
var Texture_1 = require("./Texture");
var BaseTexture = PIXI.BaseTexture;
var Rectangle = PIXI.Rectangle;
var TextureGroupAtlas = (function () {
    function TextureGroupAtlas(renderTexture, json) {
        this.textures = {};
        var baseTexture = this.renderTexture = new BaseTexture(renderTexture);
        var textures = json.textures;
        for (var i = 0; i < textures.length; i++) {
            var texture = textures[i];
            this.textures[texture.symbol] = new Texture_1.Texture(baseTexture, new Rectangle(texture.rect[0], texture.rect[1], texture.rect[2], texture.rect[3]));
        }
    }
    TextureGroupAtlas.load = function (flumpLibrary, json) {
        var file = json.file;
        var url = flumpLibrary.url + '/' + file;
        return new Promise(function (resolve, reject) {
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
    return TextureGroupAtlas;
}());
exports.TextureGroupAtlas = TextureGroupAtlas;
//# sourceMappingURL=TextureGroupAtlas.js.map