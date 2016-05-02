"use strict";
var Texture = (function () {
    function Texture(renderTexture, json) {
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
    Texture.prototype.onTick = function (delta) {
    };
    Texture.prototype.draw = function (ctx) {
        ctx.drawImage(this.renderTexture, this.x, this.y, this.width, this.height, 0, 0, this.width, this.height);
        return true;
    };
    Texture.prototype.reset = function () {
        this.time = 0.0;
    };
    return Texture;
}());
exports.Texture = Texture;
//# sourceMappingURL=Texture.js.map