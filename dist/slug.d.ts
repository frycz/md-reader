export declare function slugify(text: string): string;
export type Slugger = {
    slug(text: string): string;
    reserve(id: string): void;
};
export declare function createSlugger(opts?: {
    prefix?: string;
}): Slugger;
export declare function escapeHtml(s: string): string;
//# sourceMappingURL=slug.d.ts.map