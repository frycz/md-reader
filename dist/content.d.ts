export declare function wrapTables(container: HTMLElement): void;
export declare function markExternalLinks(container: HTMLElement, opts?: {
    target?: string;
    rel?: string;
}): void;
export declare function bindAnchorLinks(container: HTMLElement, opts?: {
    onNavigate?: (id: string) => void;
    scrollTo?: (el: HTMLElement, id: string) => void;
}): () => void;
//# sourceMappingURL=content.d.ts.map