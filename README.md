# md-reader

The reading layer shared by [view-md](https://github.com/frycz/view-md) and
[frycz.github.io](https://github.com/frycz/frycz.github.io): theme tokens, a stylesheet for
rendered markdown, and DOM post-processors for a table of contents, code blocks, mermaid
diagrams and a lightbox.

It takes **already rendered** markdown. It does not care who rendered it, so the same code
works on a client-side `markdown-it` document and on HTML produced at build time by
`gatsby-transformer-remark`. There is no markdown parser here, no React, and nothing that
assumes a server.

## Install

```sh
npm install github:frycz/md-reader
```

`dist/` is committed, so an install never needs a build step. Run `npm run build` before
committing a change to `src/`.

## Styles

```js
import "md-reader/styles/tokens.css";   // custom properties, three theme states
import "md-reader/styles/markdown.css"; // everything inside .markdown-body
import "md-reader/styles/reader.css";   // table of contents, popovers, buttons, lightbox
import "md-reader/styles/layout.css";   // the header bar, the column grid, the rails
import "md-reader/styles/base.css";     // optional page reset, skip it if the host has its own
```

or `md-reader/styles/all.css` for the first four.

Put the rendered markdown in an element with `class="markdown-body"`.

### Theme

Tokens cover three states:

no `data-theme` on `:root` follows the OS

`data-theme="light"` is always light

`data-theme="dark"` is always dark

### Layout

`layout.css` is the grid both hosts read in. The rail is a grid column, not something floated
into the margin, so the text column shrinks to make room instead of the rail overlapping the
prose or having to disappear on a narrower window.

```html
<header class="mdr-header">…</header>
<div class="mdr-layout" data-sidebar="on">
  <aside class="mdr-sidebar">…</aside>
  <main class="mdr-main">
    <article class="markdown-body">…</article>
  </main>
  <aside class="mdr-toc">
    <div class="mdr-toc-head">Contents</div>
    <nav class="mdr-toc-list"></nav>
  </aside>
</div>
```

Drop the `.mdr-sidebar` element and the `data-sidebar` attribute for a host that has one
document and nothing to list. `data-toc="off"` collapses the rail, which is how a host wires
up a toggle button. The rail goes away on its own below 1100px and the sidebar below 760px.

Widths come from `--content-width`, `--sidebar-w` and `--toc-w`. Every direct child of
`.mdr-main` is capped at `--content-width` and centred, so an article, a pager and a footer
all line up on the same edges.

### What the host still owns

The contents of the header bar, and `--header-h`. A host using `.mdr-header` must set
`--header-h` to the bar's height: the rails are positioned from that token, and so is the
scroll margin that keeps an anchored heading from landing underneath the bar.

A host that fixes its text width in its own stylesheet rather than letting the reader set it
should store `contentWidth: null`, so `applySettings` leaves `--content-width` alone instead
of stamping a `ch` value over it, and should leave `contentWidth` out of the settings panel's
fields.

## One-call setup

```js
import { mountReader } from "md-reader";

const reader = mountReader({
  content: document.querySelector(".markdown-body"),
  tocList: document.querySelector(".mdr-toc-list"),
  offset: () => 80,
});
// later
reader.destroy();
```

That runs, in order: mermaid fences out of code blocks, code block chrome and highlighting,
table wrapping, heading ids, external link targets, in-page anchor scrolling, the lightbox,
the table of contents, and the first diagram draw.

## The pieces

`assignHeadingIds(container, { prefix })` — slugged ids for headings that have none, which is
the normal case for build-time rendered markdown.

`createToc({ container, list, depth, offset, sectionSelector, sectionInfo })` — builds the
list and runs the scroll spy. `sectionSelector` and `sectionInfo` exist for a document
assembled from several files, where file dividers appear in the contents alongside headings.

`enhanceCodeBlocks(container, { highlight, regions })` — wraps bare `<pre>` in `.code-block`
with a copy button, a language tag, and a fold-all button for blocks that contain
`details.code-region`. With `highlight: true`, `highlight.js` is imported only if the page
actually has a `language-*` block. Blocks that already carry the markup are left alone, so it
is safe to run on output from a renderer that produced it.

`foldCodeRegions(container)` — folds the regions of code that arrived as plain text, for a
renderer that does not know the markers: code between a `# region <name>` line and a
`# endregion` line (also `// region`, `#region`) becomes a `details.code-region` under its
name, and the code as it was written is kept on the block's `data-code` for the copy button,
because the rendered text now also holds the summary labels. A block with no complete region
is left alone, and so is one that already has the markup. `enhanceCodeBlocks` runs it first
unless `regions: false`, which is what makes the fold-all button appear; highlighting then
colors each part on its own rather than replacing the block and flattening the folds.

`upgradeMermaidFences(container)` then `renderDiagrams(container)` — mermaid is imported only
when a diagram exists, is themed from the CSS custom properties, and is redrawn on a theme
change. Call `renderDiagrams` again after the theme changes.

`createLightbox()` and `bindLightbox(container, lb)` — full-screen images and diagrams.
Anything inside a link keeps its link behavior.

`createSettingsStore({ key })`, `applySettings(s)`, `resolvedTheme()`, `themeBootstrap(key)` —
settings persistence and application. `themeBootstrap` returns the source for a blocking
inline `<script>`; a server-rendered page needs it or it paints in the default theme before
hydrating.

`createSettingsPanel({ settings, fields, onChange })` and `bindPopover(button, el)` — the
settings popover, with the field list up to the host. It reports patches and writes neither to
storage nor to the document.

`wrapTables`, `markExternalLinks`, `bindAnchorLinks`, `slugify`, `throttle`, `scrollParent`,
`revealInPanel` — the small shared pieces.

## Not here

Markdown rendering, file listings, search, and annotations. The first stays with each host's
pipeline; the rest belong to view-md, which has a server behind it.
