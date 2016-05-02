"use strict";
var Texture_1 = require("./Texture");
var TextureGroupAtlas = (function () {
    function TextureGroupAtlas(renderTexture, json) {
        this.flumpTextures = {};
        this.renderTexture = renderTexture;
        var textures = json.textures;
        for (var i = 0; i < textures.length; i++) {
            var texture = textures[i];
            this.flumpTextures[texture.symbol] = new Texture_1.Texture(renderTexture, texture);
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