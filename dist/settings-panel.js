// The settings popover. Hosts pick which fields they expose; the panel reports patches and
// never writes to storage or to the document itself.
import { CONTENT_WIDTH_RANGE, DEFAULT_SETTINGS, FONT_SIZE_RANGE } from "./settings.js";
export const ALL_FIELDS = [
    "theme",
    "contentFont",
    "fontSize",
    "contentWidth",
    "tocDepth",
    "pageMarkers",
    "frontmatterExpanded",
];
function select(options) {
    const el = document.createElement("select");
    for (const [value, label] of options) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        el.append(opt);
    }
    return el;
}
function labelled(text, control, valueEl) {
    const label = document.createElement("label");
    label.append(document.createTextNode(text + " "));
    if (valueEl)
        label.append(valueEl);
    label.append(control);
    return label;
}
function check(text, input) {
    const label = document.createElement("label");
    label.className = "mdr-check";
    input.type = "checkbox";
    label.append(input, document.createTextNode(" " + text));
    return label;
}
export function createSettingsPanel(opts) {
    const fields = opts.fields ?? ALL_FIELDS;
    const el = document.createElement("div");
    el.className = "mdr-popover";
    el.hidden = true;
    const syncs = [];
    const emit = opts.onChange;
    for (const field of fields) {
        switch (field) {
            case "theme": {
                const control = select([
                    ["system", "Match system"],
                    ["light", "Light"],
                    ["dark", "Dark"],
                ]);
                control.onchange = () => emit({ theme: control.value });
                el.append(labelled("Theme", control));
                syncs.push((s) => (control.value = s.theme));
                break;
            }
            case "contentFont": {
                const control = select([
                    ["sans", "Sans-serif"],
                    ["mono", "Monospace"],
                ]);
                control.onchange = () => emit({ contentFont: control.value });
                el.append(labelled("Content font", control));
                syncs.push((s) => (control.value = s.contentFont));
                break;
            }
            case "fontSize": {
                const control = document.createElement("input");
                control.type = "range";
                control.min = String(FONT_SIZE_RANGE.min);
                control.max = String(FONT_SIZE_RANGE.max);
                control.step = String(FONT_SIZE_RANGE.step);
                const value = document.createElement("span");
                control.oninput = () => emit({ fontSize: Number(control.value) });
                el.append(labelled("Font size", control, value));
                syncs.push((s) => {
                    control.value = String(s.fontSize);
                    value.textContent = `${s.fontSize}px`;
                });
                break;
            }
            case "contentWidth": {
                const control = document.createElement("input");
                control.type = "range";
                control.min = String(CONTENT_WIDTH_RANGE.min);
                control.max = String(CONTENT_WIDTH_RANGE.max);
                control.step = String(CONTENT_WIDTH_RANGE.step);
                const value = document.createElement("span");
                control.oninput = () => emit({ contentWidth: Number(control.value) });
                el.append(labelled("Content width", control, value));
                // A host that fixes its width in CSS stores null; it should not also list the field,
                // but fall back to the default rather than putting "null" in the slider if it does.
                syncs.push((s) => {
                    const width = s.contentWidth ?? DEFAULT_SETTINGS.contentWidth ?? CONTENT_WIDTH_RANGE.min;
                    control.value = String(width);
                    value.textContent = `${width}ch`;
                });
                break;
            }
            case "tocDepth": {
                const control = select([
                    ["1", "h1"],
                    ["2", "h1–h2"],
                    ["3", "h1–h3"],
                    ["4", "h1–h4"],
                    ["5", "h1–h5"],
                    ["6", "h1–h6"],
                ]);
                control.onchange = () => emit({ tocDepth: Number(control.value) });
                el.append(labelled("Contents depth", control));
                syncs.push((s) => (control.value = String(s.tocDepth)));
                break;
            }
            case "pageMarkers": {
                const control = document.createElement("input");
                control.onchange = () => emit({ pageMarkers: control.checked });
                el.append(check("Show page markers", control));
                syncs.push((s) => (control.checked = s.pageMarkers));
                break;
            }
            case "frontmatterExpanded": {
                const control = document.createElement("input");
                control.onchange = () => emit({ frontmatterExpanded: control.checked });
                el.append(check("Frontmatter expanded by default", control));
                syncs.push((s) => (control.checked = s.frontmatterExpanded));
                break;
            }
        }
    }
    const panel = {
        el,
        sync(s) {
            for (const fn of syncs)
                fn(s);
        },
    };
    panel.sync(opts.settings);
    return panel;
}
// Opens and closes a popover: toggled by `button`, closed by an outside click or Escape.
export function bindPopover(button, popover) {
    const onButton = (e) => {
        e.stopPropagation();
        popover.hidden = !popover.hidden;
    };
    const onDocClick = (e) => {
        const t = e.target;
        if (!popover.hidden && !popover.contains(t) && !button.contains(t))
            popover.hidden = true;
    };
    const onKey = (e) => {
        if (e.key === "Escape")
            popover.hidden = true;
    };
    button.addEventListener("click", onButton);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
        button.removeEventListener("click", onButton);
        document.removeEventListener("click", onDocClick);
        document.removeEventListener("keydown", onKey);
    };
}
//# sourceMappingURL=settings-panel.js.map