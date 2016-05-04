"use strict";
var FlumpLibrary = require('./FlumpLibrary');
if (!global) {
    var global = {};
}
if (!global.PIXI) {
    global.PIXI = {};
}
global.PIXI.FlumpLibrary = FlumpLibrary;
