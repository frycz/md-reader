// Reader settings: the shape, persistence, and applying them to the document element.
// Rendering the controls is a separate module (settings-panel.ts), because a host may want
// its own UI or only a subset of the fields.
export const DEFAULT_SETTINGS = {
    theme: "system",
    contentFont: "sans",
    fontSize: 17,
    contentWidth: 75,
    tocDepth: 3,
    pageMarkers: true,
    frontmatterExpanded: false,
};
export const FONT_SIZE_RANGE = { min: 13, max: 26, step: 1 };
export const CONTENT_WIDTH_RANGE = { min: 50, max: 140, step: 5 };
// All localStorage access goes through here, so a reader works when storage is empty,
// full, or blocked outright (private windows, cleared site data).
export function createSettingsStore(opts) {
    const defaults = { ...DEFAULT_SETTINGS, ...opts.defaults };
    const fields = opts.persist ?? Object.keys(defaults);
    const pick = (s) => {
        const out = {};
        for (const f of fields)
            if (s[f] !== undefined)
                out[f] = s[f];
        return out;
    };
    return {
        key: opts.key,
        fields,
        load() {
            try {
                const raw = localStorage.getItem(opts.key);
                if (!raw)
                    return { ...defaults };
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
                    return { ...defaults };
                // Only the stored fields are taken, so an older stored shape cannot bring back a
                // setting the host has since stopped keeping.
                return { ...defaults, ...pick(parsed) };
            }
            catch {
                return { ...defaults };
            }
        },
        save(s) {
            try {
                localStorage.setItem(opts.key, JSON.stringify(pick(s)));
            }
            catch { }
        },
    };
}
export function prefersDark() {
    return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}
// The theme actually in effect, which mermaid and anything else that has to pick real colors needs.
export function resolvedTheme(root = document.documentElement) {
    const explicit = root.dataset.theme;
    if (explicit === "dark" || explicit === "light")
        return explicit;
    return prefersDark() ? "dark" : "light";
}
export function applySettings(s, root = document.documentElement) {
    if (s.theme === "system")
        delete root.dataset.theme;
    else
        root.dataset.theme = s.theme;
    root.dataset.contentFont = s.contentFont;
    root.style.setProperty("--font-size", `${s.fontSize}px`);
    if (s.contentWidth == null)
        root.style.removeProperty("--content-width");
    else
        root.style.setProperty("--content-width", `${s.contentWidth}ch`);
    root.classList.toggle("mdr-no-page-markers", !s.pageMarkers);
}
// Calls back whenever the OS theme flips, but only while the setting is "system".
export function onSystemThemeChange(cb) {
    if (typeof matchMedia !== "function")
        return () => { };
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const handler = () => cb();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
}
// Source for a blocking inline <script> in <head>. Without it a server-rendered page paints
// in the default theme before the app hydrates, which reads as a flash.
export function themeBootstrap(key) {
    return (`(function(){try{var r=document.documentElement,` +
        `s=JSON.parse(localStorage.getItem(${JSON.stringify(key)})||"{}");` +
        `if(s.theme==="dark"||s.theme==="light")r.setAttribute("data-theme",s.theme);` +
        `if(s.contentFont)r.setAttribute("data-content-font",s.contentFont);` +
        `if(typeof s.fontSize==="number")r.style.setProperty("--font-size",s.fontSize+"px");` +
        `if(typeof s.contentWidth==="number")r.style.setProperty("--content-width",s.contentWidth+"ch");` +
        `if(s.pageMarkers===false)r.classList.add("mdr-no-page-markers");` +
        `}catch(e){}})()`);
}
//# sourceMappingURL=settings.js.map