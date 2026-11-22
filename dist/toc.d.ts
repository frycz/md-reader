export declare function assignHeadingIds(container: HTMLElement, opts?: {
    prefix?: string;
    selector?: string;
}): void;
export type TocSection = {
    id: string;
    text: string;
};
export type TocOptions = {
    container: HTMLElement;
    list: HTMLElement;
    depth?: number;
    offset?: () => number;
    sectionSelector?: string;
    sectionInfo?: (el: HTMLElement) => TocSection | null;
    emptyLabel?: string;
    onNavigate?: (id: string) => void;
    scrollTo?: (el: HTMLElement, id: string) => void;
};
export type Toc = {
    rebuild(depth?: number): void;
    update(): void;
    destroy(): void;
};
export declare function createToc(opts: TocOptions): Toc;
//# sourceMappingURL=toc.d.ts.map