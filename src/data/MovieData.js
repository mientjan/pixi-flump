"use strict";
var LayerData_1 = require("./LayerData");
var MovieData = (function () {
    function MovieData(library, json) {
        this.frames = 0;
        var layers = json.layers;
        this.id = json.id;
        this.layerData = new Array(layers.length);
        for (var i = 0; i < layers.length; i++) {
            var layer = this.layerData[i] = new LayerData_1.LayerData(layers[i]);
            this.frames = Math.max(this.frames, layer.frames);
        }
    }
    return MovieData;
}());
exports.MovieData = MovieData;
