// The standard pipeline for a host that has one rendered document on the page and wants the
// whole reading layer in one call. A host with more to coordinate (several documents, live
// reload, its own scroll handling) should call the individual modules instead.

import { bindCodeActions, enhanceCodeBlocks, type CodeOptions } from "./code.js";
import { bindAnchorLinks, markExternalLinks, wrapTables } from "./content.js";
import { bindLightbox, createLightbox, type Lightbox } from "./lightbox.js";
import { renderDiagrams, upgradeMermaidFences } from "./mermaid.js";
import { onSystemThemeChange } from "./settings.js";
import { assignHeadingIds, createToc, type Toc } from "./toc.js";

export type MountOptions = {
  // The element holding the rendered markdown.
  content: HTMLElement;
  // Where to build the table of contents. Omit for no table of contents.
  tocList?: HTMLElement | null;
  tocDepth?: number;
  // Distance from the top of the viewport at which a heading counts as current.
  offset?: () => number;
  code?: CodeOptions | false;
  mermaid?: boolean;
  lightbox?: boolean;
  tables?: boolean;
  externalLinks?: boolean;
  anchorLinks?: boolean;
  headingIds?: boolean;
  headingPrefix?: string;
  onNavigate?: (id: string) => void;
};

export type Reader = {
  toc: Toc | null;
  lightbox: Lightbox | null;
  // Re-themes diagrams. Call it after the theme setting changes.
  redrawDiagrams(): Promise<void>;
  destroy(): void;
};

export function mountReader(opts: MountOptions): Reader {
  const { content } = opts;
  const cleanups: Array<() => void> = [];

  // Order matters: mermaid fences must stop looking like code blocks before the code pass runs.
  if (opts.mermaid !== false) upgradeMermaidFences(content);
  if (opts.code !== false) {
    enhanceCodeBlocks(content, opts.code ?? { highlight: true });
    cleanups.push(bindCodeActions(content));
  }
  if (opts.tables !== false) wrapTables(content);
  if (opts.headingIds !== false) assignHeadingIds(content, { prefix: opts.headingPrefix });
  if (opts.externalLinks !== false) markExternalLinks(content);
  if (opts.anchorLinks !== false) cleanups.push(bindAnchorLinks(content, { onNavigate: opts.onNavigate }));

  let lightbox: Lightbox | null = null;
  if (opts.lightbox !== false) {
    lightbox = createLightbox();
    cleanups.push(bindLightbox(content, lightbox));
  }

  let toc: Toc | null = null;
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
      for (const fn of cleanups.splice(0)) fn();
      toc?.destroy();
      lightbox?.destroy();
    },
  };
}
