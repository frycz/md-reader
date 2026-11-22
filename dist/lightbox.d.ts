export type Lightbox = {
    el: HTMLElement;
    openImage(img: HTMLImageElement): void;
    openSvg(svg: SVGElement): void;
    close(): void;
    destroy(): void;
};
export declare function createLightbox(opts?: {
    parent?: HTMLElement;
}): Lightbox;
export declare function bindLightbox(container: HTMLElement, lb: Lightbox): () => void;
//# sourceMappingURL=lightbox.d.ts.map