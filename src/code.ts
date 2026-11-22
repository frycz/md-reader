// Code blocks: the surrounding bar with a copy button, fold-all for blocks that have regions,
// and optional syntax highlighting for markdown that was rendered without it.

const COPY_LABEL = "Copy all";
// Code blocks longer than this get their buttons again below the code.
const FOOTER_MIN_LINES = 12;

export type CodeOptions = {
  // Highlight `pre > code.language-*` that is not highlighted yet. highlight.js is imported
  // only when such a block exists, so a page without code pays nothing.
  highlight?: boolean;
  // Show the language next to the buttons.
  showLanguage?: boolean;
  footerMinLines?: number;
  copyLabel?: string;
  // Fold the region markers a renderer left in the code. A block without markers is untouched.
  regions?: boolean;
};

// Code between "# region <name>" and "# endregion" lines (also "// region", "#region") is folded
// under its name. The markers are a convention of the source rather than of markdown, so a
// renderer that does not know them leaves them in the code for this pass to find.
const REGION_START = /^\s*(?:#|\/\/)\s*#?region\b(.*)$/;
const REGION_END = /^\s*(?:#|\/\/)\s*#?endregion\b/;

type CodePart = { region?: string; text: string };

// Plain parts and regions in order, or null when the code has no complete region. Regions do not nest.
function splitRegions(code: string): CodePart[] | null {
  const parts: CodePart[] = [];
  let lines: string[] = [];
  let region: string | undefined;
  for (const line of code.replace(/\n$/, "").split("\n")) {
    const start = region === undefined ? REGION_START.exec(line) : null;
    if (start) {
      parts.push({ text: lines.join("\n") });
      region = start[1]!.trim() || "Folded code";
      lines = [];
    } else if (region !== undefined && REGION_END.test(line)) {
      parts.push({ region, text: lines.join("\n") });
      region = undefined;
      lines = [];
    } else lines.push(line);
  }
  // An unclosed region is a half-written marker, not a fold: leave the block as the renderer left it.
  if (region !== undefined || !parts.some((p) => p.region !== undefined)) return null;
  parts.push({ text: lines.join("\n") });
  return parts.filter((p) => p.region !== undefined || p.text !== "");
}

// Every part is a span, region or not, so that highlighting has one kind of target to replace.
function partNode(part: CodePart): Element {
  const span = document.createElement("span");
  span.className = "code-part";
  span.textContent = part.text;
  if (part.region === undefined) return span;

  const details = document.createElement("details");
  details.className = "code-region";
  const summary = document.createElement("summary");
  const n = part.text.split("\n").length;
  summary.textContent = `${part.region} · ${n} ${n === 1 ? "line" : "lines"}`;
  details.append(summary, span);
  return details;
}

// Rebuilds `pre > code` as a sequence of parts, with the regions folded away. The code as it was
// written goes on the <pre> for the copy button, because the rendered text now also holds the
// summary labels; enhanceCodeBlocks moves it to the block it builds around the <pre>.
export function foldCodeRegions(container: HTMLElement): void {
  for (const code of [...container.querySelectorAll<HTMLElement>("pre > code")]) {
    // A renderer that produced the markup itself has nothing left to do here.
    if (code.querySelector("details.code-region")) continue;
    const source = code.textContent ?? "";
    const parts = splitRegions(source);
    if (!parts) continue;

    code.textContent = "";
    for (const part of parts) code.append(partNode(part));
    (code.parentElement as HTMLElement).dataset.code = source;
  }
}

function languageOf(code: Element | null): string {
  if (!code) return "";
  for (const cls of code.classList) {
    if (cls.startsWith("language-")) return cls.slice("language-".length);
    if (cls.startsWith("lang-")) return cls.slice("lang-".length);
  }
  return "";
}

function actionBar(opts: { lang: string; fold: boolean; position: "header" | "footer"; copyLabel: string; showLanguage: boolean }) {
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
export function enhanceCodeBlocks(container: HTMLElement, opts: CodeOptions = {}): void {
  const copyLabel = opts.copyLabel ?? COPY_LABEL;
  const footerMin = opts.footerMinLines ?? FOOTER_MIN_LINES;
  const showLanguage = opts.showLanguage ?? true;

  // Before the wrapping, so that a block whose regions are folded here is seen to have them.
  if (opts.regions !== false) foldCodeRegions(container);

  for (const pre of [...container.querySelectorAll<HTMLElement>("pre")]) {
    if (pre.closest(".code-block") || pre.classList.contains("mermaid-src") || pre.closest(".mermaid-block")) continue;
    const code = pre.querySelector("code");
    const lang = languageOf(code);
    const fold = !!pre.querySelector("details.code-region");
    // The folded source is the length the reader is deciding about, labels and all.
    const source = pre.dataset.code ?? code?.textContent ?? "";
    const lines = source.replace(/\n$/, "").split("\n").length;

    const block = document.createElement("div");
    block.className = "code-block";
    pre.replaceWith(block);
    if (pre.dataset.code !== undefined) {
      block.dataset.code = pre.dataset.code;
      delete pre.dataset.code;
    }
    block.append(actionBar({ lang, fold, position: "header", copyLabel, showLanguage }));
    block.append(pre);
    if (lines > footerMin) block.append(actionBar({ lang, fold, position: "footer", copyLabel, showLanguage }));
  }

  if (opts.highlight) void highlightAll(container);
}

let hljsLib: Promise<typeof import("highlight.js/lib/common").default> | null = null;

export async function highlightAll(container: HTMLElement): Promise<void> {
  const blocks = [...container.querySelectorAll<HTMLElement>("pre code")].filter((c) => !c.classList.contains("hljs") && languageOf(c));
  if (!blocks.length) return;
  let hljs: typeof import("highlight.js/lib/common").default;
  try {
    hljsLib ??= import("highlight.js/lib/common").then((m) => m.default);
    hljs = await hljsLib;
  } catch {
    return; // highlighting is cosmetic: plain code is a fine outcome
  }
  for (const code of blocks) {
    const lang = languageOf(code);
    if (!hljs.getLanguage(lang)) continue;
    try {
      // Replacing the whole block would flatten its folds, so a block with regions is highlighted
      // part by part. Each part is a run of whole lines, and keeps the colors of the code around it.
      const parts = [...code.querySelectorAll<HTMLElement>(".code-part")];
      const targets = parts.length ? parts : [code];
      for (const target of targets) {
        target.innerHTML = hljs.highlight(target.textContent ?? "", { language: lang, ignoreIllegals: true }).value;
      }
      code.classList.add("hljs");
    } catch {}
  }
}

function copyCode(btn: HTMLButtonElement, copyLabel: string) {
  // A block with regions keeps its source in data-code, because its text also holds the region names.
  const block = btn.closest<HTMLElement>(".code-block");
  const code = block?.dataset.code ?? block?.querySelector("pre code")?.textContent ?? "";
  navigator.clipboard.writeText(code).then(
    () => (btn.textContent = "Copied"),
    () => (btn.textContent = "Failed"),
  );
  setTimeout(() => (btn.textContent = copyLabel), 1500);
}

function regionsOf(block: Element) {
  return [...block.querySelectorAll<HTMLDetailsElement>("details.code-region")];
}

// Runs on every region toggle, so the labels also follow regions opened one by one.
function updateFoldButton(block: Element) {
  const label = regionsOf(block).every((d) => d.open) ? "Collapse all" : "Expand all";
  for (const btn of block.querySelectorAll(".fold-btn")) btn.textContent = label;
}

// Delegated, so it survives the container being re-rendered.
export function bindCodeActions(container: HTMLElement, opts: { copyLabel?: string } = {}): () => void {
  const copyLabel = opts.copyLabel ?? COPY_LABEL;

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement;
    const copy = t.closest<HTMLButtonElement>(".copy-btn");
    if (copy && container.contains(copy)) {
      copyCode(copy, copyLabel);
      return;
    }
    const fold = t.closest<HTMLButtonElement>(".fold-btn");
    if (fold && container.contains(fold)) {
      const regions = regionsOf(fold.closest(".code-block")!);
      const open = regions.some((d) => !d.open);
      for (const d of regions) d.open = open;
    }
  };

  const onToggle = (e: Event) => {
    const d = e.target as HTMLElement;
    if (d.classList.contains("code-region")) updateFoldButton(d.closest(".code-block")!);
  };

  container.addEventListener("click", onClick);
  // Capture: the toggle event does not bubble.
  container.addEventListener("toggle", onToggle, true);
  return () => {
    container.removeEventListener("click", onClick);
    container.removeEventListener("toggle", onToggle, true);
  };
}
