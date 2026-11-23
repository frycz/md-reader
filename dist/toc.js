// Table of contents built from the headings of an already rendered document, plus the
// scroll spy that keeps the current one marked.
import { headerOffset, revealInPanel, throttle } from "./dom.js";
import { createSlugger } from "./slug.js";
const HEADINGS = "h1, h2, h3, h4, h5, h6";
// Markdown rendered at build time often has no heading ids (gatsby-transformer-remark emits
// none), so the reader assigns them with the same slug rule the renderer would have used.
// Headings that already have an id keep it.
export function assignHeadingIds(container, 
// `ignore` is a selector for the parts of the document the host does not count as prose — a
// collapsed metadata block, say. A heading inside one gets no id, and the same option on
// createToc keeps it out of the contents list.
opts = {}) {
    const slugger = createSlugger({ prefix: opts.prefix });
    for (const h of container.querySelectorAll(opts.selector ?? HEADINGS)) {
        if (opts.ignore && h.closest(opts.ignore))
            continue;
        if (h.id)
            slugger.reserve(h.id);
        else
            h.id = slugger.slug(h.textContent ?? "");
    }
}
export function createToc(opts) {
    const { container, list } = opts;
    const offset = opts.offset ?? (() => headerOffset());
    let depth = opts.depth ?? 3;
    let entries = [];
    let frame = 0;
    const targetOf = (el) => {
        if (opts.sectionSelector && el.matches(opts.sectionSelector))
            return opts.sectionInfo?.(el)?.id ?? null;
        return el.id || null;
    };
    // A section marker's position is the top of the block it introduces, not of the marker itself.
    const boxOf = (el) => opts.sectionSelector && el.matches(opts.sectionSelector) ? (el.parentElement ?? el) : el;
    function rebuild(next) {
        if (next !== undefined)
            depth = next;
        const levels = Array.from({ length: Math.max(1, Math.min(6, depth)) }, (_, i) => `h${i + 1}[id]`).join(",");
        const selector = opts.sectionSelector ? `${levels}, ${opts.sectionSelector}` : levels;
        entries = [...container.querySelectorAll(selector)].filter((h) => !opts.ignore || !h.closest(opts.ignore));
        list.replaceChildren();
        for (const el of entries) {
            const id = targetOf(el);
            if (!id)
                continue;
            const a = document.createElement("a");
            a.href = `#${encodeURIComponent(id)}`;
            a.dataset.target = id;
            if (opts.sectionSelector && el.matches(opts.sectionSelector)) {
                a.className = "toc-section";
                a.textContent = opts.sectionInfo?.(el)?.text ?? id;
            }
            else {
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
            let active = null;
            for (const el of entries) {
                if (boxOf(el).getBoundingClientRect().top <= limit)
                    active = el;
                else
                    break;
            }
            const id = active ? targetOf(active) : null;
            for (const a of list.querySelectorAll("a[data-target]")) {
                const on = a.dataset.target === id;
                if (on === a.classList.contains("active"))
                    continue;
                a.classList.toggle("active", on);
                if (on)
                    revealInPanel(a);
            }
        });
    }
    const onScroll = () => update();
    const onResize = throttle(update, 150);
    const onClick = (e) => {
        const a = e.target.closest("a[data-target]");
        if (!a || !list.contains(a))
            return;
        const mouse = e;
        // A modified click is the reader asking for a new tab or window, which is the browser's to
        // handle: the link carries a real href for exactly that.
        if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey || mouse.button !== 0)
            return;
        e.preventDefault();
        const id = a.dataset.target;
        const el = document.getElementById(id);
        if (!el)
            return;
        if (opts.scrollTo)
            opts.scrollTo(el, id);
        else
            el.scrollIntoView({ behavior: "smooth" });
        opts.onNavigate?.(id);
    };
    list.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    rebuild();
    return {
        rebuild,
        update,
        count: () => list.querySelectorAll("a[data-target]").length,
        destroy() {
            cancelAnimationFrame(frame);
            list.removeEventListener("click", onClick);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
        },
    };
}
//# sourceMappingURL=toc.js.map