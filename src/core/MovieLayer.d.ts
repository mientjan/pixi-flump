/// <reference types="pixi.js" />
import { IHashMap } from "../interface/IHashMap";
import { FlumpMovie } from "./FlumpMovie";
import { FlumpLibrary } from "../FlumpLibrary";
import { LayerData } from "../data/LayerData";
import { KeyframeData } from "../data/KeyframeData";
import * as PIXI from "pixi.js";
export declare class MovieLayer extends PIXI.Container {
    name: string;
    private _frame;
    protected _index: number;
    protected _movie: FlumpMovie;
    protected _layerData: LayerData;
    protected _symbol: FlumpMovie | PIXI.Sprite;
    protected _symbols: IHashMap<FlumpMovie | PIXI.Sprite>;
    enabled: boolean;
    constructor(index: number, movie: FlumpMovie, library: FlumpLibrary, layerData: LayerData);
    getSymbol(name: string): FlumpMovie;
    replaceSymbol(name: string, item: FlumpMovie | PIXI.Sprite): boolean;
    onTick(delta: number, accumulated: number): void;
    setFrame(frame: number): boolean;
    setKeyframeData(symbol: PIXI.DisplayObject, keyframe: KeyframeData, frame: number): void;
    reset(): void;
}
