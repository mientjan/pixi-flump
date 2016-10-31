import { LayerData } from "./LayerData";
import { FlumpLibrary } from "../FlumpLibrary";
import { IMovie } from "../interface/ILibrary";
export declare class MovieData {
    id: string;
    layerData: Array<LayerData>;
    frames: number;
    constructor(library: FlumpLibrary, json: IMovie);
}
