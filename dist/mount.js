// The standard pipeline for a host that has one rendered document on the page and wants the
// whole reading layer in one call. A host with more to coordinate (several documents, live
// reload, its own scroll handling) should call the individual modules instead.
import { bindCodeActions, enhanceCodeBlocks } from "./code.js";
import { bindAnchorLinks, markExternalLinks, wrapTables } from "./content.js";
import { bindLightbox, createLightbox } from "./lightbox.js";
import { renderDiagrams, upgradeMermaidFences } from "./mermaid.js";
import { onSystemThemeChange } from "./settings.js";
import { assignHeadingIds, createToc } from "./toc.js";
export function mountReader(opts) {
    const { content } = opts;
    const cleanups = [];
    // Order matters: mermaid fences must stop looking like code blocks before the code pass runs.
    if (opts.mermaid !== false)
        upgradeMermaidFences(content);
    if (opts.code !== false) {
        enhanceCodeBlocks(content, opts.code ?? { highlight: true });
        cleanups.push(bindCodeActions(content));
    }
    if (opts.tables !== false)
        wrapTables(content);
    if (opts.headingIds !== false)
        assignHeadingIds(content, { prefix: opts.headingPrefix });
    if (opts.externalLinks !== false)
        markExternalLinks(content);
    if (opts.anchorLinks !== false)
        cleanups.push(bindAnchorLinks(content, { onNavigate: opts.onNavigate }));
    let lightbox = null;
    if (opts.lightbox !== false) {
        lightbox = createLightbox();
        cleanups.push(bindLightbox(content, lightbox));
    }
    let toc = null;
    if (opts.tocList) {
        toc = createToc({
            container: content,
            list: opts.tocList,
            depth: opts.tocDepth,
            offset: opts.offset,
            onNavigate: opts.onNavigate,
        });
    }
    const redrawDiagrams = () => (opts.mermaid === false ? Promise.resolve() : renderDiagrams(content));
    void redrawDiagrams();
    // A document following the OS theme has to redraw its diagrams when the OS flips.
    cleanups.push(onSystemThemeChange(() => void redrawDiagrams()));
    return {
        toc,
        lightbox,
        redrawDiagrams,
        destroy() {
            for (const fn of cleanups.splice(0))
                fn();
            toc?.destroy();
            lightbox?.destroy();
        },
    };
}
//# sourceMappingURL=mount.js.map