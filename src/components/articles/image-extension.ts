import { Image } from "@tiptap/extension-image";

export type ImgAlign = "block" | "center" | "wrap-left" | "wrap-right" | "full";

/** Tiptap Image extended with Word-style layout attributes (align + widthPct).
 * Stored as data-align / data-width-pct on the <img> tag so they roundtrip
 * through HTML and our Block schema (see article-doc.ts). */
export const ImageWithLayout = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "block",
        parseHTML: (el) => el.getAttribute("data-align") || "block",
        renderHTML: (attrs) => ({ "data-align": attrs.align ?? "block" }),
      },
      widthPct: {
        default: 100,
        parseHTML: (el) => {
          const v = el.getAttribute("data-width-pct");
          return v ? Number(v) : 100;
        },
        renderHTML: (attrs) => {
          const w = Math.max(5, Math.min(100, Number(attrs.widthPct) || 100));
          const align = attrs.align ?? "block";
          const widthStyle = align === "full" ? "100%" : `${w}%`;
          return {
            "data-width-pct": String(w),
            style: `width:${widthStyle};max-width:100%;height:auto;`,
          };
        },
      },
    };
  },
});
