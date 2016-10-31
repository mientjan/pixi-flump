/// <reference types="pixi.js" />
import { FlumpLibrary } from "../FlumpLibrary";
import { IAtlas } from "../interface/ILibrary";
import { Promise } from "../util/Promise";
import * as PIXI from "pixi.js";
import Texture = PIXI.Texture;
import BaseTexture = PIXI.BaseTexture;
import Point = PIXI.Point;
export declare class TextureGroupAtlas {
    static load(library: FlumpLibrary, json: IAtlas): Promise<TextureGroupAtlas>;
    protected _baseTexture: BaseTexture;
    protected _names: Array<string>;
    protected _textures: Array<Texture>;
    protected _anchors: Array<Point>;
    protected _atlas: IAtlas;
    constructor(renderTexture: HTMLImageElement, json: IAtlas);
    getNames(): Array<string>;
    getTextures(): Array<Texture>;
    getAnchors(): Array<Point>;
    destruct(): void;
}
