# Tokens

Everything md-reader draws is colored and sized from the custom properties in `styles/tokens.css`. The swatches on this page are painted with the tokens themselves, so they show whichever theme is in effect right now. Switch the theme with ⚙ in the bar to compare.

## Theme states

The tokens cover three states, and the host only ever writes one attribute:

- **No `data-theme` on `:root`** follows the OS through `prefers-color-scheme`. This is `theme: "system"`, the default.
- **`data-theme="light"`** is always light.
- **`data-theme="dark"`** is always dark.

`applySettings` writes the attribute, `themeBootstrap` writes it before the first paint, and `resolvedTheme()` tells you which of the two palettes is actually showing.

## Surfaces and text

- <span class="swatch" style="--c: var(--bg)"></span>`--bg` is the page background. Light `#fbfbf9`, dark `#16181d`.
- <span class="swatch" style="--c: var(--bg-elev)"></span>`--bg-elev` is for raised surfaces: the popover, table headers, buttons on hover. Light `#f2f2ef`, dark `#1d2027`.
- <span class="swatch" style="--c: var(--bg-code)"></span>`--bg-code` is behind code blocks, inline code and drawn diagrams. Light `#f0f0ec`, dark `#20242c`.
- <span class="swatch" style="--c: var(--border)"></span>`--border` is for rules, table cells and the edges of the rails. Light `#e1e1dc`, dark `#2c313b`.
- <span class="swatch" style="--c: var(--fg)"></span>`--fg` is body text. Light `#2b2d31`, dark `#d8dbe2`.
- <span class="swatch" style="--c: var(--fg-strong)"></span>`--fg-strong` is for headings and bold text. Light `#111214`, dark `#f1f3f7`.
- <span class="swatch" style="--c: var(--fg-muted)"></span>`--fg-muted` is for blockquotes, captions, the contents rail and labels. Light `#6b6f78`, dark `#8b919e`.

## Accent and highlights

- <span class="swatch" style="--c: var(--accent)"></span>`--accent` is for links, the current contents entry and active buttons. Light `#2557c7`, dark `#7aa7ff`.
- <span class="swatch" style="--c: var(--accent-bg)"></span>`--accent-bg` is the accent as a fill, behind active buttons and the current page in the sidebar.
- <span class="swatch" style="--c: var(--mark-bg)"></span>`--mark-bg` is behind `<mark>`: <mark>like this</mark>.
- <span class="swatch" style="--c: var(--hit-bg)"></span>`--hit-bg` is behind a search hit: <mark class="search-hit">like this</mark>, and the <mark class="search-hit current">current one</mark>.
- <span class="swatch" style="--c: var(--selection-bg)"></span>`--selection-bg` and `--selection-fg` are for selected text. Select a few words to see them.
- <span class="swatch" style="--c: var(--danger)"></span>`--danger` is for errors, such as a diagram that failed to draw. Light `#b91c1c`, dark `#f87171`.

## Syntax colors

highlight.js classes map onto seven `--hl-*` tokens. Mermaid also uses them as its categorical palette, and borrows `--hl-pink`, the one color that is the same in both themes, once the other six run out.

- <span class="swatch" style="--c: var(--hl-keyword)"></span>`--hl-keyword` is for keywords and literals.
- <span class="swatch" style="--c: var(--hl-string)"></span>`--hl-string` is for strings and regular expressions.
- <span class="swatch" style="--c: var(--hl-number)"></span>`--hl-number` is for numbers and symbols.
- <span class="swatch" style="--c: var(--hl-comment)"></span>`--hl-comment` is for comments, which are also set in italics.
- <span class="swatch" style="--c: var(--hl-title)"></span>`--hl-title` is for function and section names.
- <span class="swatch" style="--c: var(--hl-attr)"></span>`--hl-attr` is for attributes, variables, parameters and properties.
- <span class="swatch" style="--c: var(--hl-built)"></span>`--hl-built` is for built-ins, types, class names and tags.
- <span class="swatch" style="--c: var(--hl-pink)"></span>`--hl-pink` is only used in diagrams.

```ts
// Every color in this block is one of the tokens above.
export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  fontSize: 17,
  contentWidth: 75,
};
```

## Fonts

- **`--font-ui`** is for the bar, the rails, buttons and labels.
  <span class="type-sample" style="font-family: var(--font-ui)">The quick brown fox jumps over the lazy dog</span>
- **`--font-mono`** is for code.
  <span class="type-sample" style="font-family: var(--font-mono)">The quick brown fox jumps over the lazy dog</span>
- **`--font-body`** is the prose. It is `--font-ui` by default and `--font-mono` when `data-content-font="mono"` is set on `:root`, which is the content font setting.

## Metrics

- **`--font-size`** is the prose size. The default is `17px`, and the settings allow 13 to 26.
- **`--content-width`** is the cap on the text column. The default is `75ch`, and the settings allow 50 to 140 in steps of 5. A host that fixes its width in CSS stores `contentWidth: null`, and the reader leaves this alone.
- **`--header-h`** is the height of `.mdr-header`. The host sets it, and the rails, the scroll margin on headings and `headerOffset()` all measure from it. This site sets `52px`.
- **`--sidebar-w`** is the sidebar's column in `grid.css`. The default is `280px`.
- **`--toc-w`** is the contents rail's column in `grid.css`. The default is `260px`.

## Layout

![How the layout classes and tokens fit together](site/layout.svg)

- **`.mdr-header`** is the sticky bar. Its contents are the host's.
- **`.mdr-layout`** is the grid below it. `data-sidebar="on"` gives the sidebar a column, and `data-toc="off"` collapses the rail.
- **`.mdr-sidebar`** is the optional navigation column. It is hidden below 760px.
- **`.mdr-main`** is the text column. Every direct child is capped at `--content-width` and centred.
- **`.mdr-toc`** is the contents rail, with `.mdr-toc-head` and `.mdr-toc-list` inside. It is hidden below 1100px, or when it is `hidden` because there is nothing to list.

`layout.css` gives these their boxes and makes the rails sticky. `grid.css` places them in columns, and is the one file a host is expected to replace rather than override.
