export interface ITexture {
    origin: number[];
    rect: number[];
    symbol: string;
}
export interface IAtlas {
    textures: ITexture[];
    file: string;
}
export interface ITextureGroup {
    scaleFactor: number;
    atlases: IAtlas[];
}
export interface IKeyframe {
    symbolName: string;
    ease: number;
    pivot: number[];
    loc: number[];
    duration: number;
    index: number;
    ref: string;
    skew: number[];
    alpha?: number;
    visible?: boolean;
    scale: number[];
    tweened?: boolean;
    label: string;
}
export interface ILayer {
    flipbook?: boolean;
    keyframes: IKeyframe[];
    name: string;
}
export interface IMovie {
    id: string;
    layers: ILayer[];
}
export interface ILibrary {
    frameRate: number;
    isNamespaced: boolean;
    textureGroups: ITextureGroup[];
    movies: IMovie[];
    md5: string;
    optimised?: boolean;
    referenceList?: Array<string>;
}
