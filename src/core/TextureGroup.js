"use strict";
var TextureGroupAtlas_1 = require("./TextureGroupAtlas");
var TextureGroup = (function () {
    function TextureGroup(flumpTextureGroupAtlases, flumpTextures) {
        this.textureGroupAtlases = flumpTextureGroupAtlases;
        this.textures = flumpTextures;
    }
    TextureGroup.load = function (flumpLibrary, json) {
        var atlases = json.atlases;
        var loaders = [];
        for (var i = 0; i < atlases.length; i++) {
            var atlas = atlases[i];
            loaders.push(TextureGroupAtlas_1.TextureGroupAtlas.load(flumpLibrary, atlas));
        }
        return Promise.all(loaders).then(function (atlases) {
            var flumpTextures = {};
            for (var i = 0; i < atlases.length; i++) {
                var atlas = atlases[i];
                for (var name in atlas.flumpTextures) {
                    if (atlas.flumpTextures.hasOwnProperty(name)) {
                        flumpTextures[name] = atlas.flumpTextures[name];
                    }
                }
            }
            return new TextureGroup(atlases, flumpTextures);
        }).catch(function (err) {
            console.warn('could not load textureGroup', err);
            throw new Error('could not load textureGroup');
        });
    };
    return TextureGroup;
}());
exports.TextureGroup = TextureGroup;
//# sourceMappingURL=TextureGroup.js.map