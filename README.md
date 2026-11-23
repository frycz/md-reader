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
import "md-reader/styles/layout.css";   // the header bar, the text column, the sticky rails
import "md-reader/styles/grid.css";     // the default column grid — optional, see below
import "md-reader/styles/base.css";     // optional page reset, skip it if the host has its own
```

or `md-reader/styles/all.css` for the first five.

Put the rendered markdown in an element with `class="markdown-body"`.

### Theme

Tokens cover three states:

no `data-theme` on `:root` follows the OS

`data-theme="light"` is always light

`data-theme="dark"` is always dark

### Layout

The markup both hosts read in:

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

`layout.css` is the part of that both hosts use unchanged: the bar's box, the text column's
padding, the width every direct child of `.mdr-main` is capped at, and the two rails as sticky,
independently scrolling panels. It never says which grid track anything goes in.

`grid.css` is the default template that places them. The rail is a real grid column, not
something floated into the margin, so the text column shrinks to make room instead of the rail
overlapping the prose. Drop the `.mdr-sidebar` element and the `data-sidebar` attribute for a
host that has one document and nothing to list. `data-toc="off"` collapses the rail, which is how
a host wires up a toggle button. The rail goes away on its own below 1100px and the sidebar below
760px.

Widths come from `--content-width`, `--sidebar-w` and `--toc-w`.

**`grid.css` is the one file a host is expected to replace rather than override.** A host that
wants a different shape — text and rail centred together as one block, or a rail that fades
closed instead of snapping — skips the import and writes its own template against `.mdr-layout`.
Everything else stays shared. What such a host owes: a `grid-column` for `.mdr-main`, `.mdr-toc`
and any `.mdr-sidebar`, and some way for the rail's track to reach zero when there is nothing to
list. frycz.github.io does exactly this; view-md uses `grid.css` as it comes.

### What the host still owns

The contents of the header bar, and `--header-h`. A host using `.mdr-header` must set
`--header-h` to the bar's height: the rails are positioned from that token, the scroll margin
that keeps an anchored heading from landing underneath the bar is measured from it, and
`headerOffset()` reads it to decide when a heading counts as current.

A host that fixes its text width in its own stylesheet rather than letting the reader set it
should store `contentWidth: null`, so `applySettings` leaves `--content-width` alone instead
of stamping a `ch` value over it, and should leave `contentWidth` out of the settings panel's
fields.

`Settings` has two fields that describe markup only some hosts produce: `pageMarkers` and
`frontmatterExpanded`. `applySettings` puts the first on the document as the class
`mdr-no-page-markers`, for the host's own stylesheet to honour, and does nothing with the second.
A host without that markup leaves both out of its panel and never looks at them.

## One-call setup

```js
import { mountReader } from "md-reader";

const reader = mountReader({
  content: document.querySelector(".markdown-body"),
  tocList: document.querySelector(".mdr-toc-list"),
  // Instant instead of animated; omit for the default smooth scroll.
  scrollTo: (el) => el.scrollIntoView(),
});
// later
reader.destroy();
```

That runs, in order: mermaid fences out of code blocks, code block chrome and highlighting,
table wrapping, heading ids, external link targets, in-page anchor scrolling, the lightbox,
the table of contents, and the first diagram draw.

`offset` defaults to the bar's height plus 24px, read from `--header-h`. `scrollTo` and `ignore`
are forwarded to both the anchor links and the table of contents, so one call decides how the
whole document is navigated.

## The pieces

`assignHeadingIds(container, { prefix, ignore })` — slugged ids for headings that have none,
which is the normal case for build-time rendered markdown.

`createSlugger({ prefix })` — the heading-id rule on its own: `slug(text)` for the next id, and
`reserve(id)` for one that came from elsewhere. A renderer that emits its own ids should use this
rather than `slugify` directly, so the collision rule (`install`, then `install-1`) is the one
`assignHeadingIds` would have applied and `#install-1` names the same heading either way.

`createToc({ container, list, depth, offset, ignore, scrollTo, sectionSelector, sectionInfo })` —
builds the list and runs the scroll spy. `count()` says how many entries it built, for a host
deciding whether the rail has earned its column. `sectionSelector` and `sectionInfo` exist for a
document assembled from several files, where file dividers appear in the contents alongside
headings. `ignore` is a selector for the parts of the document that are not prose — view-md
passes `details.frontmatter` — whose headings stay out of the list.

`enhanceCodeBlocks(container, { highlight, regions })` — wraps bare `<pre>` in `.code-block`
with a copy button, a language tag, and a fold-all button for blocks that contain
`details.code-region`. With `highlight: true`, `highlight.js` is imported only if the page
actually has a `language-*` block. Blocks that already carry the markup are left alone, so it
is safe to run on output from a renderer that produced it.

**A markdown renderer should emit a plain `<pre><code class="language-x">` fence and let this
build the chrome,** rather than producing `.code-block` markup itself. The class names, the
`data-code` attribute the copy button reads and the region markup are one contract, with one
implementation, and both hosts go through it.

`foldCodeRegions(container)` — folds the regions of code that arrived as plain text: code
between a `# region <name>` line and a `# endregion` line (also `// region`, `#region`) becomes
a `details.code-region` under its name, and the code as it was written is kept on the block's
`data-code` for the copy button, because the rendered text now also holds the summary labels. A
block with no complete region is left alone, and so is one that already has the markup.
`enhanceCodeBlocks` runs it first unless `regions: false`, which is what makes the fold-all
button appear; highlighting then colors each part on its own rather than replacing the block and
flattening the folds.

`upgradeMermaidFences(container)` then `renderDiagrams(container)` — mermaid is imported only
when a diagram exists, is themed from the CSS custom properties, and is redrawn on a theme
change. Call `renderDiagrams` again after the theme changes. As with code blocks, a renderer
should leave a mermaid fence as `<pre><code class="language-mermaid">` and let
`upgradeMermaidFences` build the placeholder.

`createLightbox()` and `bindLightbox(container, lb)` — full-screen images and diagrams.
Anything inside a link keeps its link behavior.

`createSettingsStore({ key, defaults, persist })`, `applySettings(s)`, `resolvedTheme()`,
`themeBootstrap(key)` — settings persistence and application. `persist` names the fields that
are written, and the only ones read back: a host whose reader exposes one setting should name
just that one, so a returning visitor is not stranded on whatever the defaults were the day they
last read something. `themeBootstrap` returns the source for a blocking inline `<script>`; a
server-rendered page needs it or it paints in the default theme before hydrating, and a host
without a renderer can serve it from a route rather than copying it into its HTML.

`createSettingsPanel({ settings, fields, onChange })` and `bindPopover(button, el)` — the
settings popover, with the field list up to the host. It reports patches and writes neither to
storage nor to the document.

`headerOffset(extra)` — the bar's height from `--header-h` plus some breathing room, which is
what the scroll spy measures against, and the default `offset` for `mountReader` and
`createToc`.

`wrapTables`, `markExternalLinks`, `bindAnchorLinks`, `slugify`, `throttle`, `scrollParent`,
`revealInPanel` — the small shared pieces.

## Not here

Markdown rendering, file listings, search, and annotations. The first stays with each host's
pipeline; the rest belong to view-md, which has a server behind it. Annotation colors, and the
styling of frontmatter and page-divider markup, live there too, since view-md is the only thing
that produces them.
