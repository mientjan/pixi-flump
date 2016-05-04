"use strict";
var KeyframeData_1 = require("./KeyframeData");
var LayerData = (function () {
    function LayerData(json) {
        this.keyframeData = [];
        this.name = json.name;
        this.flipbook = 'flipbook' in json ? !!json.flipbook : false;
        var keyframes = json.keyframes;
        var keyFrameData = null;
        for (var i = 0; i < keyframes.length; i++) {
            var keyframe = keyframes[i];
            keyFrameData = new KeyframeData_1.KeyframeData(keyframe);
            this.keyframeData.push(keyFrameData);
        }
        this.frames = keyFrameData.index + keyFrameData.duration;
    }
    LayerData.prototype.getKeyframeForFrame = function (frame) {
        var datas = this.keyframeData;
        for (var i = 1; i < datas.length; i++) {
            if (datas[i].index > frame) {
                return datas[i - 1];
            }
        }
        return datas[datas.length - 1];
    };
    LayerData.prototype.getKeyframeAfter = function (flumpKeyframeData) {
        for (var i = 0; i < this.keyframeData.length - 1; i++) {
            if (this.keyframeData[i] === flumpKeyframeData) {
                return this.keyframeData[i + 1];
            }
        }
        return null;
    };
    return LayerData;
}());
exports.LayerData = LayerData;
