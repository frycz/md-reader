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
import "md-reader/styles/base.css";     // optional page reset, skip it if the host has its own
```

or `md-reader/styles/all.css` for the first three.

Put the rendered markdown in an element with `class="markdown-body"`.

### Theme

Tokens cover three states:

no `data-theme` on `:root` follows the OS

`data-theme="light"` is always light

`data-theme="dark"` is always dark

### What the host still owns

Width and placement. `markdown.css` deliberately sets no width, and `reader.css` styles the
contents list without positioning the rail, because that is exactly where two hosts differ.
Set `--content-width` and position `.mdr-toc` in the host's own stylesheet.

A host with a sticky header should set `--header-h` to its height so anchored headings do not
land underneath it.

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

`enhanceCodeBlocks(container, { highlight })` — wraps bare `<pre>` in `.code-block` with a
copy button, a language tag, and a fold-all button for blocks that contain
`details.code-region`. With `highlight: true`, `highlight.js` is imported only if the page
actually has a `language-*` block. Blocks that already carry the markup are left alone, so it
is safe to run on output from a renderer that produced it.

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
