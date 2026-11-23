export type Theme = "system" | "dark" | "light";
export type ContentFont = "sans" | "mono";
export type Settings = {
    theme: Theme;
    contentFont: ContentFont;
    fontSize: number;
    contentWidth: number | null;
    tocDepth: number;
    pageMarkers: boolean;
    frontmatterExpanded: boolean;
};
export type SettingsField = keyof Settings;
export declare const DEFAULT_SETTINGS: Settings;
export declare const FONT_SIZE_RANGE: {
    readonly min: 13;
    readonly max: 26;
    readonly step: 1;
};
export declare const CONTENT_WIDTH_RANGE: {
    readonly min: 50;
    readonly max: 140;
    readonly step: 5;
};
export type SettingsStore = {
    load(): Settings;
    save(s: Settings): void;
    key: string;
    fields: readonly SettingsField[];
};
export declare function createSettingsStore(opts: {
    key: string;
    defaults?: Partial<Settings>;
    persist?: readonly SettingsField[];
}): SettingsStore;
export declare function prefersDark(): boolean;
export declare function resolvedTheme(root?: HTMLElement): "dark" | "light";
export declare function applySettings(s: Settings, root?: HTMLElement): void;
export declare function onSystemThemeChange(cb: () => void): () => void;
export declare function themeBootstrap(key: string): string;
//# sourceMappingURL=settings.d.ts.map