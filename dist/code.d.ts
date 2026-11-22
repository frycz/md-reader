export type CodeOptions = {
    highlight?: boolean;
    showLanguage?: boolean;
    footerMinLines?: number;
    copyLabel?: string;
    regions?: boolean;
};
export declare function foldCodeRegions(container: HTMLElement): void;
export declare function enhanceCodeBlocks(container: HTMLElement, opts?: CodeOptions): void;
export declare function highlightAll(container: HTMLElement): Promise<void>;
export declare function bindCodeActions(container: HTMLElement, opts?: {
    copyLabel?: string;
}): () => void;
//# sourceMappingURL=code.d.ts.map