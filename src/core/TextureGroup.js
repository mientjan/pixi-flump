"use strict";
var FlumpTextureGroupAtlas_1 = require('./FlumpTextureGroupAtlas');
var Promise_1 = require('../../../core/util/Promise');
var FlumpTextureGroup = (function () {
    function FlumpTextureGroup(flumpTextureGroupAtlases, flumpTextures) {
        this.flumpTextureGroupAtlases = flumpTextureGroupAtlases;
        this.flumpTextures = flumpTextures;
    }
    FlumpTextureGroup.load = function (flumpLibrary, json) {
        var atlases = json.atlases;
        var loaders = [];
        for (var i = 0; i < atlases.length; i++) {
            var atlas = atlases[i];
            loaders.push(FlumpTextureGroupAtlas_1.FlumpTextureGroupAtlas.load(flumpLibrary, atlas));
        }
        return Promise_1.Promise.all(loaders).then(function (atlases) {
            var flumpTextures = {};
            for (var i = 0; i < atlases.length; i++) {
                var atlas = atlases[i];
                for (var name in atlas.flumpTextures) {
                    if (atlas.flumpTextures.hasOwnProperty(name)) {
                        flumpTextures[name] = atlas.flumpTextures[name];
                    }
                }
            }
            return new FlumpTextureGroup(atlases, flumpTextures);
        }).catch(function (err) {
            console.warn('could not load textureGroup', err);
            throw new Error('could not load textureGroup');
        });
    };
    return FlumpTextureGroup;
}());
exports.FlumpTextureGroup = FlumpTextureGroup;
//# sourceMappingURL=TextureGroup.js.map