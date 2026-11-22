// Full-screen view for images and mermaid diagrams.
export function createLightbox(opts = {}) {
    const el = document.createElement("div");
    el.className = "mdr-lightbox";
    el.hidden = true;
    const img = document.createElement("img");
    img.alt = "";
    const svgBox = document.createElement("div");
    svgBox.className = "mdr-lb-svg";
    el.append(img, svgBox);
    (opts.parent ?? document.body).append(el);
    const close = () => {
        el.hidden = true;
        img.removeAttribute("src");
        svgBox.replaceChildren();
    };
    const onClick = () => close();
    const onKey = (e) => {
        if (e.key === "Escape" && !el.hidden)
            close();
    };
    el.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return {
        el,
        openImage(source) {
            svgBox.replaceChildren();
            img.src = source.currentSrc || source.src;
            img.alt = source.alt;
            el.dataset.kind = "img";
            el.hidden = false;
        },
        openSvg(svg) {
            img.removeAttribute("src");
            svgBox.replaceChildren(svg.cloneNode(true));
            el.dataset.kind = "svg";
            el.hidden = false;
        },
        close,
        destroy() {
            el.removeEventListener("click", onClick);
            document.removeEventListener("keydown", onKey);
            el.remove();
        },
    };
}
// Images and diagrams inside a link keep their link behavior.
export function bindLightbox(container, lb) {
    for (const img of container.querySelectorAll("img")) {
        if (!img.closest("a"))
            img.classList.add("mdr-zoomable");
    }
    const onClick = (e) => {
        const t = e.target;
        if (t.closest("a"))
            return;
        const img = t.closest("img");
        if (img) {
            lb.openImage(img);
            return;
        }
        const svg = t.closest(".mermaid-svg")?.querySelector("svg");
        if (svg)
            lb.openSvg(svg);
    };
    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
}
//# sourceMappingURL=lightbox.js.map