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

`content` is the only option a host has to pass. The rest:

`tocList` — where to build the contents. Omit it for a page with no contents rail.

`tocDepth` — the deepest heading level the list reaches, default 3.

`offset` — the distance from the top of the viewport at which a heading counts as current. Defaults to the bar's height plus 24px, read from `--header-h`.

`scrollTo` and `ignore` — forwarded to both the anchor links and the table of contents, so one call decides how the whole document is navigated.

`onNavigate` — called with the id once either kind of link has scrolled, for a host that wants to write history.

`headingPrefix` — a prefix for the heading ids that get assigned, for a page holding more than one document.

`code` — the `enhanceCodeBlocks` options, defaulting to `{ highlight: true }`. `code: false` skips the pass, which also means no copy or fold buttons are bound.

`mermaid`, `lightbox`, `tables`, `externalLinks`, `anchorLinks`, `headingIds` — each one set to `false` skips that pass.

The `Reader` it hands back:

`toc` — the `Toc`, or `null` when no `tocList` was given. `rebuild(depth)` is what a host wiring up a depth setting calls; `count()` is how it decides whether the rail has earned its column.

`lightbox` — the `Lightbox`, or `null` when it was switched off.

`redrawDiagrams()` — re-themes every diagram, and resolves once they are drawn. A document following the OS theme already redraws itself when the OS flips, because `mountReader` subscribes to that; this is the handle for a theme the reader picked.

`destroy()` — unbinds everything, that subscription included.

## Settings

`Settings` is one flat object, and `DEFAULT_SETTINGS` holds what a host gets by saying nothing:

`theme` — `"system"`, `"light"` or `"dark"`. Default `"system"`.

`contentFont` — `"sans"` or `"mono"`, the font the prose is set in. Default `"sans"`.

`fontSize` — the prose size in px, within `FONT_SIZE_RANGE` (13 to 26). Default 17.

`contentWidth` — the text column as a number of `ch`, within `CONTENT_WIDTH_RANGE` (50 to 140), or `null`. Default 75.

`tocDepth` — the deepest heading level the contents list reaches. Default 3.

`pageMarkers` — whether page dividers are shown. Default `true`.

`frontmatterExpanded` — whether a metadata block starts open. Default `false`.

`applySettings(s, root = document.documentElement)` writes most of that onto one element: `data-theme` (removed outright for `"system"`), `data-content-font`, `--font-size`, `--content-width` (removed when `contentWidth` is `null`), and the class `mdr-no-page-markers` when `pageMarkers` is off.
It does nothing with `tocDepth`, which `createToc` reads instead, or with `frontmatterExpanded`, which is markup the host owns.
`themeBootstrap` stamps the same set from storage before the page paints, so a change to one belongs in the other.

`ALL_FIELDS` is every field in panel order, which is also what `createSettingsPanel` renders when a host names no `fields`.

## The pieces

`assignHeadingIds(container, { prefix, ignore, selector })` — slugged ids for headings that have none, which is the normal case for build-time rendered markdown.
A heading that already has an id keeps it, and `selector` narrows which elements are considered at all.

`createSlugger({ prefix })` — the heading-id rule on its own: `slug(text)` for the next id, and
`reserve(id)` for one that came from elsewhere. A renderer that emits its own ids should use this
rather than `slugify` directly, so the collision rule (`install`, then `install-1`) is the one
`assignHeadingIds` would have applied and `#install-1` names the same heading either way.

`createToc({ container, list, depth, offset, ignore, scrollTo, onNavigate, emptyLabel, sectionSelector, sectionInfo })` — builds the list and runs the scroll spy.
`sectionSelector` and `sectionInfo` exist for a document assembled from several files, where file dividers appear in the contents alongside headings.
`ignore` is a selector for the parts of the document that are not prose — view-md passes `details.frontmatter` — whose headings stay out of the list.
A document with nothing to list gets a single `.mdr-toc-empty` element reading `emptyLabel`, which defaults to "No headings".

It returns `rebuild(depth)`, which is what a host wiring up a depth setting calls, `update()` for a host that moved the document under its own scroll handling, `count()` for deciding whether the rail has earned its column, and `destroy()`.

`enhanceCodeBlocks(container, { highlight, regions, showLanguage, footerMinLines, copyLabel })` — wraps bare `<pre>` in `.code-block` with a copy button, a language tag, and a fold-all button for blocks that contain `details.code-region`.
With `highlight: true`, `highlight.js` is imported only if the page actually has a `language-*` block.
A block longer than `footerMinLines` (12) gets its buttons a second time below the code.
Blocks that already carry the markup are left alone, so it is safe to run on output from a renderer that produced it.

`bindCodeActions(container, { copyLabel })` — makes those buttons do something, and returns its own teardown.
**`enhanceCodeBlocks` only builds the markup: the copy and fold-all buttons are inert until this is bound.**
It is delegated from the container rather than bound per button, so it survives the content being re-rendered, and `mountReader` calls it for you.

`highlightAll(container)` — the highlighting pass on its own, for markup that arrived with the chrome already on it.
It imports `highlight.js` only when the page has a block to color, leaves blocks that are already `.hljs` alone, and colors a block with folded regions part by part so that highlighting does not flatten the folds.

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
change. Call `renderDiagrams` again after the theme changes, which is what `mountReader` exposes
as `redrawDiagrams`. As with code blocks, a renderer should leave a mermaid fence as
`<pre><code class="language-mermaid">` and let `upgradeMermaidFences` build the placeholder.

`createLightbox({ parent })` and `bindLightbox(container, lb)` — full-screen images and diagrams.
Anything inside a link keeps its link behavior.
`bindLightbox` calls `markZoomable(container)` to put the zoom cursor on the images that will actually open, so a host that replaced its content calls that again for the images that replaced the old ones.

`createSettingsStore({ key, defaults, persist })`, `applySettings(s, root)`, `resolvedTheme(root)`,
`themeBootstrap(key)` — settings persistence and application. `persist` names the fields that
are written, and the only ones read back: a host whose reader exposes one setting should name
just that one, so a returning visitor is not stranded on whatever the defaults were the day they
last read something. `themeBootstrap` returns the source for a blocking inline `<script>`; a
server-rendered page needs it or it paints in the default theme before hydrating, and a host
without a renderer can serve it from a route rather than copying it into its HTML.

`onSystemThemeChange(cb)` and `prefersDark()` — the OS theme, for a host whose own chrome has to follow it.
`onSystemThemeChange` returns its teardown, and fires whatever the `theme` setting is, so a host that only cares while the setting is `"system"` checks that in the callback.
`resolvedTheme()` is the one to ask for the theme actually in effect, which is what anything picking real colors needs.

`createSettingsPanel({ settings, fields, onChange })` and `bindPopover(button, el)` — the
settings popover, with the field list up to the host. It reports patches and writes neither to
storage nor to the document.
The panel is `{ el, sync(s) }`: the host appends `el` wherever it wants it, and calls `sync` after it has applied a patch, so controls the patch moved stay in step.
`bindPopover` toggles `el.hidden` from the button, and closes on an outside click or Escape.

`headerOffset(extra, root)` — the bar's height from `--header-h` plus some breathing room, which
is what the scroll spy measures against, and the default `offset` for `mountReader` and
`createToc`.

`wrapTables`, `markExternalLinks(container, { target, rel })`, `bindAnchorLinks(container, { onNavigate, scrollTo })`, `slugify`, `escapeHtml`, `isExternalHref`, `throttle`, `scrollParent`, `revealInPanel` — the small shared pieces.
`escapeHtml` is here rather than in each host because a renderer emitting its own heading anchors needs it next to `createSlugger`.

## Not here

Markdown rendering, file listings, search, and annotations. The first stays with each host's
pipeline; the rest belong to view-md, which has a server behind it. Annotation colors, and the
styling of frontmatter and page-divider markup, live there too, since view-md is the only thing
that produces them.

One exception, for the same reason `applySettings` sets `mdr-no-page-markers` for a class only one host styles: searching is view-md's, but the color of a hit is here.
`markdown.css` paints `mark.search-hit` and `mark.search-hit.current`, from the `--hit-bg` token in `tokens.css`, so a hit is tuned per theme alongside everything else rather than being the one highlight that is not.
