import FlumpLibrary = require('./FlumpLibrary');

if(!global){
	var global:any = {};
}

if(!global.PIXI){
	global.PIXI = {};
}

global.PIXI.FlumpLibrary = FlumpLibrary;