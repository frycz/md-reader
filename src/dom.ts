// Small DOM helpers shared by the reader modules.

export function throttle(fn: () => void, ms: number): () => void {
  let last = 0;
  let t: ReturnType<typeof setTimeout> | undefined;
  return () => {
    const wait = last + ms - Date.now();
    clearTimeout(t);
    if (wait <= 0) {
      last = Date.now();
      fn();
    } else {
      t = setTimeout(() => {
        last = Date.now();
        fn();
      }, wait);
    }
  };
}

// The nearest ancestor that actually scrolls, so a panel can be revealed without
// touching the window scroll position (which scrollIntoView would).
export function scrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

export function revealInPanel(el: HTMLElement): void {
  const panel = scrollParent(el);
  if (!panel) return;
  const p = panel.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.top < p.top) panel.scrollTop -= p.top - r.top + 8;
  else if (r.bottom > p.bottom) panel.scrollTop += r.bottom - p.bottom + 8;
}

export function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
}
