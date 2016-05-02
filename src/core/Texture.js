/// <reference path="../../typings/tsd.d.ts" />
"use strict";
var PIXI = require("pixi.js");
var BaseTexture = PIXI.BaseTexture;
var Textureasd = (function () {
    function Textureasd(renderTexture, json) {
        this.time = 0.0;
        this.name = json.symbol;
        this.renderTexture = new BaseTexture(renderTexture);
        this.originX = json.origin[0];
        this.originY = json.origin[1];
        this.x = json.rect[0];
        this.y = json.rect[1];
        this.width = json.rect[2];
        this.height = json.rect[3];
    }
    Textureasd.prototype.onTick = function (delta) {
    };
    Textureasd.prototype.draw = function (ctx) {
        ctx.drawImage(this.renderTexture, this.x, this.y, this.width, this.height, 0, 0, this.width, this.height);
        return true;
    };
    Textureasd.prototype.reset = function () {
        this.time = 0.0;
    };
    return Textureasd;
}());
exports.Textureasd = Textureasd;
//# sourceMappingURL=Texture.js.map