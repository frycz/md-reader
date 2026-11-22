// Table of contents built from the headings of an already rendered document, plus the
// scroll spy that keeps the current one marked.

import { revealInPanel, throttle } from "./dom.js";
import { slugify } from "./slug.js";

const HEADINGS = "h1, h2, h3, h4, h5, h6";

// Markdown rendered at build time often has no heading ids (gatsby-transformer-remark emits
// none), so the reader assigns them with the same slug rule the renderer would have used.
// Headings that already have an id keep it.
export function assignHeadingIds(container: HTMLElement, opts: { prefix?: string; selector?: string } = {}): void {
  const prefix = opts.prefix ?? "";
  const seen = new Map<string, number>();
  for (const h of container.querySelectorAll<HTMLElement>(opts.selector ?? HEADINGS)) {
    if (h.closest("details.frontmatter")) continue;
    if (h.id) {
      seen.set(h.id, (seen.get(h.id) ?? 0) + 1);
      continue;
    }
    let slug = slugify(h.textContent ?? "");
    const n = seen.get(slug) ?? 0;
    seen.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n}`;
    h.id = prefix + slug;
  }
}

export type TocSection = { id: string; text: string };

export type TocOptions = {
  container: HTMLElement;
  list: HTMLElement;
  depth?: number;
  // Distance from the top of the viewport at which a heading counts as current. A host with a
  // sticky header passes its height plus some breathing room.
  offset?: () => number;
  // An extra kind of entry rendered inline with the headings, for a document assembled from
  // several files. `sectionInfo` turns such an element into a label and a target id.
  sectionSelector?: string;
  sectionInfo?: (el: HTMLElement) => TocSection | null;
  emptyLabel?: string;
  // Called after a TOC link scrolls to its target, so the host can update history.
  onNavigate?: (id: string) => void;
  // Lets a host apply its own scroll behavior (viewmd re-applies the position while images
  // and diagrams are still settling).
  scrollTo?: (el: HTMLElement, id: string) => void;
};

export type Toc = {
  rebuild(depth?: number): void;
  update(): void;
  destroy(): void;
};

export function createToc(opts: TocOptions): Toc {
  const { container, list } = opts;
  const offset = opts.offset ?? (() => 24);
  let depth = opts.depth ?? 3;
  let entries: HTMLElement[] = [];
  let frame = 0;

  const targetOf = (el: HTMLElement): string | null => {
    if (opts.sectionSelector && el.matches(opts.sectionSelector)) return opts.sectionInfo?.(el)?.id ?? null;
    return el.id || null;
  };

  // A section marker's position is the top of the block it introduces, not of the marker itself.
  const boxOf = (el: HTMLElement): HTMLElement =>
    opts.sectionSelector && el.matches(opts.sectionSelector) ? (el.parentElement ?? el) : el;

  function rebuild(next?: number) {
    if (next !== undefined) depth = next;
    const levels = Array.from({ length: Math.max(1, Math.min(6, depth)) }, (_, i) => `h${i + 1}[id]`).join(",");
    const selector = opts.sectionSelector ? `${levels}, ${opts.sectionSelector}` : levels;
    entries = [...container.querySelectorAll<HTMLElement>(selector)].filter((h) => !h.closest("details.frontmatter"));

    list.replaceChildren();
    for (const el of entries) {
      const id = targetOf(el);
      if (!id) continue;
      const a = document.createElement("a");
      a.href = `#${encodeURIComponent(id)}`;
      a.dataset.target = id;
      if (opts.sectionSelector && el.matches(opts.sectionSelector)) {
        a.className = "toc-section";
        a.textContent = opts.sectionInfo?.(el)?.text ?? id;
      } else {
        a.className = `toc-lvl-${el.tagName[1]}`;
        a.textContent = el.textContent ?? "";
      }
      list.append(a);
    }
    if (!list.childElementCount) {
      const empty = document.createElement("div");
      empty.className = "mdr-toc-empty";
      empty.textContent = opts.emptyLabel ?? "No headings";
      list.append(empty);
    }
    update();
  }

  function update() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const limit = offset();
      let active: HTMLElement | null = null;
      for (const el of entries) {
        if (boxOf(el).getBoundingClientRect().top <= limit) active = el;
        else break;
      }
      const id = active ? targetOf(active) : null;
      for (const a of list.querySelectorAll<HTMLElement>("a[data-target]")) {
        const on = a.dataset.target === id;
        if (on === a.classList.contains("active")) continue;
        a.classList.toggle("active", on);
        if (on) revealInPanel(a);
      }
    });
  }

  const onScroll = () => update();
  const onResize = throttle(update, 150);

  const onClick = (e: Event) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>("a[data-target]");
    if (!a || !list.contains(a)) return;
    const mouse = e as MouseEvent;
    if (mouse.metaKey || mouse.ctrlKey || mouse.button !== 0) return;
    e.preventDefault();
    const id = a.dataset.target!;
    const el = document.getElementById(id);
    if (!el) return;
    if (opts.scrollTo) opts.scrollTo(el, id);
    else el.scrollIntoView({ behavior: "smooth" });
    opts.onNavigate?.(id);
  };

  list.addEventListener("click", onClick);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  rebuild();

  return {
    rebuild,
    update,
    destroy() {
      cancelAnimationFrame(frame);
      list.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    },
  };
}
