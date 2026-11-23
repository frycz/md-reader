// Small DOM helpers shared by the reader modules.
export function throttle(fn, ms) {
    let last = 0;
    let t;
    return () => {
        const wait = last + ms - Date.now();
        clearTimeout(t);
        if (wait <= 0) {
            last = Date.now();
            fn();
        }
        else {
            t = setTimeout(() => {
                last = Date.now();
                fn();
            }, wait);
        }
    };
}
// The nearest ancestor that actually scrolls, so a panel can be revealed without
// touching the window scroll position (which scrollIntoView would).
export function scrollParent(el) {
    let node = el.parentElement;
    while (node) {
        const style = getComputedStyle(node);
        if (/(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight)
            return node;
        node = node.parentElement;
    }
    return null;
}
export function revealInPanel(el) {
    const panel = scrollParent(el);
    if (!panel)
        return;
    const p = panel.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.top < p.top)
        panel.scrollTop -= p.top - r.top + 8;
    else if (r.bottom > p.bottom)
        panel.scrollTop += r.bottom - p.bottom + 8;
}
// The distance from the top of the viewport at which a heading counts as current: the height of
// the host's sticky bar, plus some breathing room. --header-h is the one place that height is
// written down — layout.css positions the rails from it and markdown.css keeps an anchored
// heading out from under it — so it is read here rather than measured or repeated.
export function headerOffset(extra = 24, root = document.documentElement) {
    const h = parseFloat(getComputedStyle(root).getPropertyValue("--header-h"));
    return (Number.isFinite(h) ? h : 0) + extra;
}
export function isExternalHref(href) {
    return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
}
//# sourceMappingURL=dom.js.map