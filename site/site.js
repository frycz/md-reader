// The showcase host: picks a page from ?p=, renders its markdown with markdown-it, and hands the
// result to md-reader. Everything md-reader does not do (fetching, rendering, the header's
// buttons, page navigation) is here, which is also roughly what any host owes.

import markdownit from "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm";
import footnote from "https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/+esm";
import taskLists from "https://cdn.jsdelivr.net/npm/markdown-it-task-lists@2.1.1/+esm";
import { applySettings, bindPopover, createSettingsPanel, createSettingsStore, mountReader } from "../dist/index.js";

const PAGES = [
  { id: "showcase", title: "Showcase", src: "site/showcase.md", blurb: "Every element the stylesheet and the post-processors handle" },
  { id: "host", title: "App glue", src: "site/host.md", blurb: "What this site adds around md-reader" },
  { id: "tokens", title: "Tokens", src: "site/tokens.md", blurb: "Colors, fonts and metrics, live in the current theme" },
  { id: "api", title: "API", src: "README.md", blurb: "The README, read in the reader" },
];

// pageMarkers and frontmatterExpanded describe markup this site never produces, so they stay out.
const FIELDS = ["theme", "contentFont", "fontSize", "contentWidth", "tocDepth"];

const params = new URLSearchParams(location.search);
const page = PAGES.find((p) => p.id === params.get("p")) ?? PAGES[0];

const content = document.getElementById("doc");
const layout = document.querySelector(".mdr-layout");
const tocRail = document.querySelector(".mdr-toc");
const tocBtn = document.getElementById("toc-btn");

// ---------- navigation ----------

const href = (p) => (p === PAGES[0] ? "./" : `./?p=${p.id}`);

function navLink(p, withBlurb) {
  const a = document.createElement("a");
  a.href = href(p);
  if (p === page) a.setAttribute("aria-current", "page");
  const title = document.createElement("span");
  title.textContent = p.title;
  a.append(title);
  if (withBlurb) {
    const blurb = document.createElement("small");
    blurb.textContent = p.blurb;
    a.append(blurb);
  }
  return a;
}

document.querySelector(".site-nav").append(...PAGES.map((p) => navLink(p, true)));
document.querySelector(".site-pages").append(...PAGES.map((p) => navLink(p, false)));
document.getElementById("page-title").textContent = page.title;
document.title = `${page.title} · md-reader`;

// ---------- settings ----------

let reader = null;
const store = createSettingsStore({ key: "md-reader-showcase", persist: FIELDS });
let settings = store.load();
applySettings(settings);

const panel = createSettingsPanel({
  settings,
  fields: FIELDS,
  onChange(patch) {
    const prev = settings;
    settings = { ...settings, ...patch };
    applySettings(settings);
    store.save(settings);
    panel.sync(settings);
    if (settings.theme !== prev.theme) void reader?.redrawDiagrams();
    if (settings.tocDepth !== prev.tocDepth) reader?.toc?.rebuild(settings.tocDepth);
  },
});
const settingsBtn = document.getElementById("settings-btn");
settingsBtn.parentElement.append(panel.el);
bindPopover(settingsBtn, panel.el);

tocBtn.addEventListener("click", () => {
  const off = layout.dataset.toc !== "off";
  if (off) layout.dataset.toc = "off";
  else delete layout.dataset.toc;
  tocBtn.classList.toggle("active", !off);
});

// ---------- the document ----------

const md = markdownit({ html: true, linkify: true, typographer: true }).use(footnote).use(taskLists);

try {
  const res = await fetch(page.src);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  content.innerHTML = md.render(await res.text());
} catch (err) {
  content.innerHTML = `<h1>Could not load ${page.src}</h1><p></p>`;
  content.querySelector("p").textContent = String(err);
}

reader = mountReader({
  content,
  tocList: document.querySelector(".mdr-toc-list"),
  tocDepth: settings.tocDepth,
  onNavigate: (id) => history.replaceState(null, "", `#${id}`),
});

// A page with nothing to list gives its rail's column back to the text.
const hasToc = (reader.toc?.count() ?? 0) > 0;
tocRail.hidden = !hasToc;
tocBtn.hidden = !hasToc;

// The browser looked for the anchor before the document existed.
if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
