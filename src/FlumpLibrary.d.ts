/// <reference types="pixi.js" />
import { Promise } from "./util/Promise";
import { ILoadable } from "./interface/ILoadable";
import { TextureGroup } from "./core/TextureGroup";
import { FlumpMovie } from "./core/FlumpMovie";
import { ILibrary } from "./interface/ILibrary";
import { MovieData } from "./data/MovieData";
import * as PIXI from "pixi.js";
/**
 * Structure:
 * FlumpLibrary
 *  - FlumpMovie
 */
export declare class FlumpLibrary implements ILoadable<FlumpLibrary> {
    static EVENT_LOAD: string;
    static load(url: string, library: FlumpLibrary, onProcess?: (process: number) => any): Promise<FlumpLibrary>;
    movieData: Array<MovieData>;
    textureGroups: Array<TextureGroup>;
    url: string;
    md5: string;
    frameRate: number;
    referenceList: Array<string>;
    fps: number;
    isOptimised: boolean;
    protected _hasLoaded: boolean;
    protected _isLoading: boolean;
    constructor(basePath?: string);
    hasLoaded(): boolean;
    isLoading(): boolean;
    load(onProgress?: (progress: number) => any): Promise<FlumpLibrary>;
    processData(json: ILibrary, onProcess?: (process: number) => any): Promise<FlumpLibrary>;
    getMovieData(name: string): MovieData;
    createSymbol(name: string, paused?: boolean): FlumpMovie | PIXI.Sprite;
    createMovie(id: string): FlumpMovie;
    getNameFromReferenceList(value: string | number): string;
}
