import { type Settings } from "./settings.js";
export type SettingsField = keyof Settings;
export declare const ALL_FIELDS: SettingsField[];
export type SettingsPanel = {
    el: HTMLElement;
    sync(s: Settings): void;
};
export declare function createSettingsPanel(opts: {
    settings: Settings;
    fields?: SettingsField[];
    onChange: (patch: Partial<Settings>) => void;
}): SettingsPanel;
export declare function bindPopover(button: HTMLElement, popover: HTMLElement): () => void;
//# sourceMappingURL=settings-panel.d.ts.map