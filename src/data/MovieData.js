"use strict";
var LayerData_1 = require("./LayerData");
var MovieData = (function () {
    function MovieData(flumpLibrary, json) {
        this.frames = 0;
        var layers = json.layers;
        this.library = flumpLibrary;
        this.id = json.id;
        this.layerData = new Array(layers.length);
        for (var i = 0; i < layers.length; i++) {
            var layer = new LayerData_1.LayerData(layers[i]);
            this.layerData[i] = layer;
            this.frames = Math.max(this.frames, layer.frames);
        }
    }
    return MovieData;
}());
exports.MovieData = MovieData;
//# sourceMappingURL=MovieData.js.map