/// <reference types="pixi.js" />
import { AnimationQueue } from "../util/AnimationQueue";
import { FlumpLibrary } from "../FlumpLibrary";
import { QueueItem } from "../util/QueueItem";
import { IPlayable } from "../interface/IPlayable";
import { LabelData } from "../data/LabelData";
import * as PIXI from "pixi.js";
/**
 * @author Mient-jan Stelling
 */
export declare class FlumpMovie extends PIXI.Container implements IPlayable {
    private _library;
    private _movieData;
    private _movieLayers;
    private _labels;
    protected _queue: AnimationQueue;
    private hasFrameCallbacks;
    private _frameCallback;
    paused: boolean;
    name: string;
    frame: number;
    frames: number;
    speed: number;
    fps: number;
    constructor(library: FlumpLibrary, name: string);
    setLabel(name: string, data: LabelData): void;
    getQueue(): AnimationQueue;
    play(times?: number, label?: string | Array<number>, complete?: () => any): FlumpMovie;
    resume(): FlumpMovie;
    pause(): FlumpMovie;
    end(all?: boolean): FlumpMovie;
    stop(): FlumpMovie;
    next(): QueueItem;
    kill(): FlumpMovie;
    setFrameCallback(frameNumber: number, callback: () => any, triggerOnce?: boolean): FlumpMovie;
    gotoAndStop(frameOrLabel: number | string): FlumpMovie;
    onTick(delta: number, accumulated: number): void;
    /**
     *
     * @param name
     * @returns {any}
     */
    getSymbol(name: string): FlumpMovie;
    replaceSymbol(name: string, symbol: FlumpMovie | PIXI.Sprite): boolean;
    handleFrameCallback(fromFrame: number, toFrame: number, delta: number): FlumpMovie;
    reset(): void;
}
