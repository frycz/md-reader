import { type CodeOptions } from "./code.js";
import { type Lightbox } from "./lightbox.js";
import { type Toc } from "./toc.js";
export type MountOptions = {
    content: HTMLElement;
    tocList?: HTMLElement | null;
    tocDepth?: number;
    offset?: () => number;
    code?: CodeOptions | false;
    mermaid?: boolean;
    lightbox?: boolean;
    tables?: boolean;
    externalLinks?: boolean;
    anchorLinks?: boolean;
    headingIds?: boolean;
    headingPrefix?: string;
    onNavigate?: (id: string) => void;
};
export type Reader = {
    toc: Toc | null;
    lightbox: Lightbox | null;
    redrawDiagrams(): Promise<void>;
    destroy(): void;
};
export declare function mountReader(opts: MountOptions): Reader;
//# sourceMappingURL=mount.d.ts.map