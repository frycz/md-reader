// Mermaid diagrams. The library is large, so it is loaded only when a document contains a diagram.
// Diagrams are themed from the reader's CSS custom properties and redrawn when the theme changes.
import { resolvedTheme } from "./settings.js";
let lib = null;
// Rendering is serialized: mermaid's config is global, so two passes with different themes must not interleave.
let queue = Promise.resolve();
let seq = 0;
// Theme key + source -> SVG, so live reloads and view switches redraw without flicker.
const cache = new Map();
// The key each block was last drawn with, to skip blocks that are already up to date.
const drawnWith = new WeakMap();
function load() {
    return (lib ??= import("mermaid").then((m) => m.default));
}
// Markdown rendered by a generic pipeline leaves a mermaid fence as `<pre><code class="language-mermaid">`.
// Turn those into the placeholder renderDiagrams() draws into.
export function upgradeMermaidFences(container) {
    for (const code of [...container.querySelectorAll("code.language-mermaid, code.lang-mermaid")]) {
        const pre = code.parentElement;
        if (!pre || pre.tagName !== "PRE" || pre.closest(".mermaid-block"))
            continue;
        const block = document.createElement("div");
        block.className = "mermaid-block";
        const src = document.createElement("pre");
        src.className = "mermaid-src";
        const inner = document.createElement("code");
        inner.textContent = code.textContent ?? "";
        src.append(inner);
        block.append(src);
        pre.replaceWith(block);
    }
}
// Mixes two #rrggbb colors, t of b into a. Mermaid derives colors from its theme variables, so they must be plain colors.
function mix(a, b, t) {
    const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b))
        return a;
    const [x, y] = [rgb(a), rgb(b)];
    return ("#" +
        x
            .map((c, i) => Math.round(c + (y[i] - c) * t)
            .toString(16)
            .padStart(2, "0"))
            .join(""));
}
function themeVariables() {
    const css = getComputedStyle(document.documentElement);
    const v = (name) => css.getPropertyValue(name).trim();
    const dark = resolvedTheme() === "dark";
    // Categorical colors for pie slices and scale-based diagrams (journey, timeline, mindmap), taken from
    // the syntax highlighting palette so they are tuned per theme. Labels on them use the opposite tone.
    const palette = ["--hl-title", "--hl-string", "--hl-attr", "--hl-keyword", "--hl-number", "--hl-built", "--ann-dot-pink", "--fg-muted"].map(v);
    const onPalette = dark ? v("--bg") : "#ffffff";
    const scale = {};
    palette.forEach((c, i) => {
        scale[`pie${i + 1}`] = c;
        scale[`cScale${i}`] = c;
        scale[`cScaleLabel${i}`] = onPalette;
    });
    return {
        ...scale,
        pieStrokeColor: v("--bg"),
        pieOuterStrokeColor: v("--border"),
        pieSectionTextColor: onPalette,
        pieTitleTextColor: v("--fg"),
        pieLegendTextColor: v("--fg"),
        darkMode: dark,
        fontFamily: v("--font-ui"),
        fontSize: "14px",
        background: v("--bg"),
        mainBkg: v("--bg-elev"),
        primaryColor: v("--bg-elev"),
        primaryTextColor: v("--fg"),
        primaryBorderColor: v("--accent"),
        secondaryColor: v("--bg-code"),
        tertiaryColor: v("--bg-code"),
        clusterBkg: mix(v("--bg-code"), v("--fg"), 0.08), // diagrams sit on --bg-code, so subgraphs stand out from it
        clusterBorder: v("--border"),
        lineColor: v("--fg-muted"),
        textColor: v("--fg"),
        edgeLabelBackground: v("--bg"),
        noteBkgColor: v("--bg-code"),
        noteTextColor: v("--fg"),
        noteBorderColor: v("--border"),
    };
}
function show(block, svg, key) {
    block.querySelector(".mermaid-svg")?.remove();
    block.querySelector(".mermaid-error")?.remove();
    const out = document.createElement("div");
    out.className = "mermaid-svg";
    out.innerHTML = svg;
    block.appendChild(out);
    drawnWith.set(block, key);
    block.dataset.state = "done";
}
function showError(block, err, key) {
    block.querySelector(".mermaid-svg")?.remove();
    block.querySelector(".mermaid-error")?.remove();
    const msg = document.createElement("div");
    msg.className = "mermaid-error";
    // Parse errors span several lines: where it failed, a caret line, then what was expected.
    const lines = String(err?.message ?? err)
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    msg.textContent = `Mermaid: ${lines.length > 1 ? `${lines[0]} ${lines.at(-1)}` : (lines[0] ?? "render failed")}`;
    block.prepend(msg);
    drawnWith.set(block, key);
    block.dataset.state = "error";
}
// Draws every diagram in the container that is not yet drawn for the current theme.
// Resolves when all of them are drawn (or failed), so callers can re-apply a scroll position.
export function renderDiagrams(container) {
    const blocks = [...container.querySelectorAll(".mermaid-block")];
    if (!blocks.length)
        return Promise.resolve();
    const vars = themeVariables();
    const theme = JSON.stringify(vars);
    const todo = [];
    for (const b of blocks) {
        const src = b.querySelector(".mermaid-src")?.textContent ?? "";
        const key = `${theme}\n${src}`;
        if (drawnWith.get(b) === key)
            continue;
        const svg = cache.get(key);
        if (svg)
            show(b, svg, key);
        else
            todo.push(b);
    }
    if (!todo.length)
        return Promise.resolve();
    const run = async () => {
        let mermaid;
        try {
            mermaid = await load();
        }
        catch (err) {
            for (const b of todo)
                showError(b, err, "");
            return;
        }
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "base", themeVariables: vars, fontFamily: vars.fontFamily });
        for (const b of todo) {
            // A newer render replaced this document, or a theme change already redrew it.
            if (!b.isConnected)
                continue;
            const src = b.querySelector(".mermaid-src")?.textContent ?? "";
            const key = `${theme}\n${src}`;
            if (drawnWith.get(b) === key)
                continue;
            const id = `mdr-mermaid-${++seq}`;
            try {
                const { svg } = await mermaid.render(id, src);
                cache.set(key, svg);
                show(b, svg, key);
            }
            catch (err) {
                showError(b, err, key);
            }
            finally {
                // On a parse error mermaid can leave its temporary container in the body.
                document.getElementById(`d${id}`)?.remove();
            }
        }
    };
    queue = queue.then(run, run);
    return queue;
}
//# sourceMappingURL=mermaid.js.map