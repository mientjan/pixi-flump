import { ILayer } from "../interface/ILibrary";
import { KeyframeData } from "./KeyframeData";
export declare class LayerData {
    name: string;
    flipbook: boolean;
    keyframeData: Array<KeyframeData>;
    frames: number;
    constructor(json: ILayer);
    getKeyframeForFrame(frame: number): KeyframeData;
    getKeyframeAfter(flumpKeyframeData: KeyframeData): KeyframeData;
}
