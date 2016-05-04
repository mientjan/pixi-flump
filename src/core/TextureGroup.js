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
