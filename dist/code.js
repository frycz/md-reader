// Code blocks: the surrounding bar with a copy button, fold-all for blocks that have regions,
// and optional syntax highlighting for markdown that was rendered without it.
const COPY_LABEL = "Copy all";
// Code blocks longer than this get their buttons again below the code.
const FOOTER_MIN_LINES = 12;
function languageOf(code) {
    if (!code)
        return "";
    for (const cls of code.classList) {
        if (cls.startsWith("language-"))
            return cls.slice("language-".length);
        if (cls.startsWith("lang-"))
            return cls.slice("lang-".length);
    }
    return "";
}
function actionBar(opts) {
    const bar = document.createElement("div");
    bar.className = `code-actions code-${opts.position}`;
    if (opts.showLanguage && opts.lang && opts.position === "header") {
        const tag = document.createElement("span");
        tag.className = "code-lang";
        tag.textContent = opts.lang;
        bar.append(tag);
    }
    if (opts.fold) {
        const fold = document.createElement("button");
        fold.type = "button";
        fold.className = "fold-btn";
        fold.textContent = "Expand all";
        bar.append(fold);
    }
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "copy-btn";
    copy.title = "Copy to clipboard";
    copy.textContent = opts.copyLabel;
    bar.append(copy);
    return bar;
}
// Wraps every bare <pre> in the container. Blocks that already carry the markup (because the
// markdown renderer produced it) are left alone, so this is safe to run on either kind of input.
export function enhanceCodeBlocks(container, opts = {}) {
    const copyLabel = opts.copyLabel ?? COPY_LABEL;
    const footerMin = opts.footerMinLines ?? FOOTER_MIN_LINES;
    const showLanguage = opts.showLanguage ?? true;
    for (const pre of [...container.querySelectorAll("pre")]) {
        if (pre.closest(".code-block") || pre.classList.contains("mermaid-src") || pre.closest(".mermaid-block"))
            continue;
        const code = pre.querySelector("code");
        const lang = languageOf(code);
        const fold = !!pre.querySelector("details.code-region");
        const lines = (code?.textContent ?? "").replace(/\n$/, "").split("\n").length;
        const block = document.createElement("div");
        block.className = "code-block";
        pre.replaceWith(block);
        block.append(actionBar({ lang, fold, position: "header", copyLabel, showLanguage }));
        block.append(pre);
        if (lines > footerMin)
            block.append(actionBar({ lang, fold, position: "footer", copyLabel, showLanguage }));
    }
    if (opts.highlight)
        void highlightAll(container);
}
let hljsLib = null;
export async function highlightAll(container) {
    const blocks = [...container.querySelectorAll("pre code")].filter((c) => !c.classList.contains("hljs") && languageOf(c));
    if (!blocks.length)
        return;
    let hljs;
    try {
        hljsLib ??= import("highlight.js/lib/common").then((m) => m.default);
        hljs = await hljsLib;
    }
    catch {
        return; // highlighting is cosmetic: plain code is a fine outcome
    }
    for (const code of blocks) {
        const lang = languageOf(code);
        if (!hljs.getLanguage(lang))
            continue;
        try {
            code.innerHTML = hljs.highlight(code.textContent ?? "", { language: lang, ignoreIllegals: true }).value;
            code.classList.add("hljs");
        }
        catch { }
    }
}
function copyCode(btn, copyLabel) {
    // A block with regions keeps its source in data-code, because its text also holds the region names.
    const block = btn.closest(".code-block");
    const code = block?.dataset.code ?? block?.querySelector("pre code")?.textContent ?? "";
    navigator.clipboard.writeText(code).then(() => (btn.textContent = "Copied"), () => (btn.textContent = "Failed"));
    setTimeout(() => (btn.textContent = copyLabel), 1500);
}
function regionsOf(block) {
    return [...block.querySelectorAll("details.code-region")];
}
// Runs on every region toggle, so the labels also follow regions opened one by one.
function updateFoldButton(block) {
    const label = regionsOf(block).every((d) => d.open) ? "Collapse all" : "Expand all";
    for (const btn of block.querySelectorAll(".fold-btn"))
        btn.textContent = label;
}
// Delegated, so it survives the container being re-rendered.
export function bindCodeActions(container, opts = {}) {
    const copyLabel = opts.copyLabel ?? COPY_LABEL;
    const onClick = (e) => {
        const t = e.target;
        const copy = t.closest(".copy-btn");
        if (copy && container.contains(copy)) {
            copyCode(copy, copyLabel);
            return;
        }
        const fold = t.closest(".fold-btn");
        if (fold && container.contains(fold)) {
            const regions = regionsOf(fold.closest(".code-block"));
            const open = regions.some((d) => !d.open);
            for (const d of regions)
                d.open = open;
        }
    };
    const onToggle = (e) => {
        const d = e.target;
        if (d.classList.contains("code-region"))
            updateFoldButton(d.closest(".code-block"));
    };
    container.addEventListener("click", onClick);
    // Capture: the toggle event does not bubble.
    container.addEventListener("toggle", onToggle, true);
    return () => {
        container.removeEventListener("click", onClick);
        container.removeEventListener("toggle", onToggle, true);
    };
}
//# sourceMappingURL=code.js.map