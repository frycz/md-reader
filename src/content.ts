// Fix-ups applied to a rendered markdown document.

import { isExternalHref } from "./dom.js";

// A table that overflows gets its own horizontal scroll, so the page body never scrolls sideways.
export function wrapTables(container: HTMLElement): void {
  for (const table of container.querySelectorAll("table")) {
    if (table.parentElement?.classList.contains("table-wrap")) continue;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.replaceWith(wrap);
    wrap.appendChild(table);
  }
}

export function markExternalLinks(container: HTMLElement, opts: { target?: string; rel?: string } = {}): void {
  for (const a of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = a.getAttribute("href")!;
    if (a.closest(".katex")) continue;
    if (!isExternalHref(href) || !/^https?:/i.test(href)) continue;
    a.target = opts.target ?? "_blank";
    a.rel = opts.rel ?? "noopener";
  }
}

// In-page "#id" links scroll smoothly instead of jumping, and report the id so the host can
// decide what to do with history.
export function bindAnchorLinks(
  container: HTMLElement,
  opts: { onNavigate?: (id: string) => void; scrollTo?: (el: HTMLElement, id: string) => void } = {},
): () => void {
  const onClick = (e: Event) => {
    const mouse = e as MouseEvent;
    // A modified click is the reader asking for a new tab or window: leave it to the browser.
    if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey || mouse.button !== 0) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
    if (!a || !container.contains(a)) return;
    const href = a.getAttribute("href") ?? "";
    if (href.length < 2) return;
    const id = decodeURIComponent(href.slice(1));
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (opts.scrollTo) opts.scrollTo(el, id);
    else el.scrollIntoView({ behavior: "smooth" });
    opts.onNavigate?.(id);
  };
  container.addEventListener("click", onClick);
  return () => container.removeEventListener("click", onClick);
}
