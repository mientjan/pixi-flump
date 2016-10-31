/// <reference types="pixi.js" />
import { ITextureGroup } from "../interface/ILibrary";
import { FlumpLibrary } from "../FlumpLibrary";
import { Promise } from "../util/Promise";
import * as PIXI from "pixi.js";
import Point = PIXI.Point;
export declare class TextureGroup {
    static load(library: FlumpLibrary, json: ITextureGroup): Promise<TextureGroup>;
    protected _names: Array<string>;
    protected _textures: Array<PIXI.Texture>;
    protected _ancors: Array<Point>;
    constructor(names: Array<string>, textures: Array<PIXI.Texture>, ancors: Array<Point>);
    hasSprite(name: string): boolean;
    createSprite(name: string): PIXI.Sprite;
}
