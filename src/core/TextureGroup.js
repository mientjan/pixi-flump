"use strict";
var TextureGroupAtlas_1 = require("./TextureGroupAtlas");
var Promise_1 = require("../util/Promise");
var PIXI = require("pixi.js");
var TextureGroup = (function () {
    function TextureGroup(names, textures, ancors) {
        // public textureGroupAtlases:Array<TextureGroupAtlas>;
        // public textures:IHashMap<Texture>;
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
                // @todo check on duplicate names
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
