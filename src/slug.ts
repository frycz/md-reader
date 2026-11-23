export function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

export type Slugger = {
  // The id for a heading's text, unique among the ids this slugger has handed out.
  slug(text: string): string;
  // Claims an id that came from somewhere else, so a later slug() will not collide with it.
  reserve(id: string): void;
};

// A heading id can be assigned in either of two places: by a markdown renderer that emits ids,
// or by assignHeadingIds() for markup that arrived without them. Both go through this, so the
// collision rule is written down once and "#install-1" means the same heading either way.
export function createSlugger(opts: { prefix?: string } = {}): Slugger {
  const prefix = opts.prefix ?? "";
  const seen = new Map<string, number>();
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

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
