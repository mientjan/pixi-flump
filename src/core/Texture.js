"use strict";
var DisplayType_1 = require("../../enum/DisplayType");
var FlumpTexture = (function () {
    function FlumpTexture(renderTexture, json) {
        this.type = DisplayType_1.DisplayType.FLUMPSYMBOL;
        this.time = 0.0;
        this.name = json.symbol;
        this.renderTexture = renderTexture;
        this.originX = json.origin[0];
        this.originY = json.origin[1];
        this.x = json.rect[0];
        this.y = json.rect[1];
        this.width = json.rect[2];
        this.height = json.rect[3];
    }
    FlumpTexture.prototype.onTick = function (delta) {
    };
    FlumpTexture.prototype.draw = function (ctx) {
        ctx.drawImage(this.renderTexture, this.x, this.y, this.width, this.height, 0, 0, this.width, this.height);
        return true;
    };
    FlumpTexture.prototype.reset = function () {
        this.time = 0.0;
    };
    return FlumpTexture;
}());
exports.FlumpTexture = FlumpTexture;
//# sourceMappingURL=FlumpTexture.js.map