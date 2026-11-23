export function slugify(text) {
    return (text
        .trim()
        .toLowerCase()
        .replace(/<[^>]*>/g, "")
        .replace(/[^\p{L}\p{N}\s_-]/gu, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "section");
}
// A heading id can be assigned in either of two places: by a markdown renderer that emits ids,
// or by assignHeadingIds() for markup that arrived without them. Both go through this, so the
// collision rule is written down once and "#install-1" means the same heading either way.
export function createSlugger(opts = {}) {
    const prefix = opts.prefix ?? "";
    const seen = new Map();
    return {
        slug(text) {
            const base = slugify(text);
            const n = seen.get(base) ?? 0;
            seen.set(base, n + 1);
            return prefix + (n > 0 ? `${base}-${n}` : base);
        },
        reserve(id) {
            seen.set(id, (seen.get(id) ?? 0) + 1);
        },
    };
}
export function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
//# sourceMappingURL=slug.js.map