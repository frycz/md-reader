// Reader settings: the shape, persistence, and applying them to the document element.
// Rendering the controls is a separate module (settings-panel.ts), because a host may want
// its own UI or only a subset of the fields.

export type Theme = "system" | "dark" | "light";
export type ContentFont = "sans" | "mono";

export type Settings = {
  theme: Theme;
  contentFont: ContentFont;
  fontSize: number;
  contentWidth: number;
  tocDepth: number;
  pageMarkers: boolean;
  frontmatterExpanded: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  contentFont: "sans",
  fontSize: 17,
  contentWidth: 75,
  tocDepth: 3,
  pageMarkers: true,
  frontmatterExpanded: false,
};

export const FONT_SIZE_RANGE = { min: 13, max: 26, step: 1 } as const;
export const CONTENT_WIDTH_RANGE = { min: 50, max: 140, step: 5 } as const;

export type SettingsStore = {
  load(): Settings;
  save(s: Settings): void;
  key: string;
};

// All localStorage access goes through here, so a reader works when storage is empty,
// full, or blocked outright (private windows, cleared site data).
export function createSettingsStore(opts: { key: string; defaults?: Partial<Settings> }): SettingsStore {
  const defaults: Settings = { ...DEFAULT_SETTINGS, ...opts.defaults };
  return {
    key: opts.key,
    load() {
      try {
        const raw = localStorage.getItem(opts.key);
        if (!raw) return { ...defaults };
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ...defaults };
        return { ...defaults, ...(parsed as Partial<Settings>) };
      } catch {
        return { ...defaults };
      }
    },
    save(s: Settings) {
      try {
        localStorage.setItem(opts.key, JSON.stringify(s));
      } catch {}
    },
  };
}

export function prefersDark(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

// The theme actually in effect, which mermaid and anything else that has to pick real colors needs.
export function resolvedTheme(root: HTMLElement = document.documentElement): "dark" | "light" {
  const explicit = root.dataset.theme;
  if (explicit === "dark" || explicit === "light") return explicit;
  return prefersDark() ? "dark" : "light";
}

export function applySettings(s: Settings, root: HTMLElement = document.documentElement): void {
  if (s.theme === "system") delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  root.dataset.contentFont = s.contentFont;
  root.style.setProperty("--font-size", `${s.fontSize}px`);
  root.style.setProperty("--content-width", `${s.contentWidth}ch`);
  root.classList.toggle("mdr-no-page-markers", !s.pageMarkers);
}

// Calls back whenever the OS theme flips, but only while the setting is "system".
export function onSystemThemeChange(cb: () => void): () => void {
  if (typeof matchMedia !== "function") return () => {};
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const handler = () => cb();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

// Source for a blocking inline <script> in <head>. Without it a server-rendered page paints
// in the default theme before the app hydrates, which reads as a flash.
export function themeBootstrap(key: string): string {
  return (
    `(function(){try{var r=document.documentElement,` +
    `s=JSON.parse(localStorage.getItem(${JSON.stringify(key)})||"{}");` +
    `if(s.theme==="dark"||s.theme==="light")r.setAttribute("data-theme",s.theme);` +
    `if(s.contentFont)r.setAttribute("data-content-font",s.contentFont);` +
    `if(typeof s.fontSize==="number")r.style.setProperty("--font-size",s.fontSize+"px");` +
    `if(typeof s.contentWidth==="number")r.style.setProperty("--content-width",s.contentWidth+"ch");` +
    `if(s.pageMarkers===false)r.classList.add("mdr-no-page-markers");` +
    `}catch(e){}})()`
  );
}
