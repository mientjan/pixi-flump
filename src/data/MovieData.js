"use strict";
var LayerData_1 = require("./LayerData");
var FlumpMovieData = (function () {
    function FlumpMovieData(flumpLibrary, json) {
        this.frames = 0;
        this.library = flumpLibrary;
        this.id = json.id;
        var layers = json.layers;
        this.layerData = new Array(layers.length);
        for (var i = 0; i < layers.length; i++) {
            var layer = new LayerData_1.LayerData(layers[i]);
            this.layerData[i] = layer;
            this.frames = Math.max(this.frames, layer.frames);
        }
    }
    return FlumpMovieData;
}());
exports.FlumpMovieData = FlumpMovieData;
//# sourceMappingURL=MovieData.js.map