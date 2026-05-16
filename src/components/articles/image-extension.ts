import { Image } from "@tiptap/extension-image";

export type ImgAlign = "block" | "center" | "wrap-left" | "wrap-right" | "full";
export type ImgSize = "sm" | "md" | "lg" | "full";

const SIZE_MAX_EM: Record<ImgSize, string> = {
  sm: "12em",
  md: "24em",
  lg: "40em",
  full: "100%",
};

/** Tiptap Image extended with Word-style layout attributes (align + size + widthPct).
 * Size is the preferred control (em-based presets, capped); widthPct is kept for
 * backward compatibility with existing documents. Stored as data-* attrs so they
 * roundtrip through HTML and our Block schema (see article-doc.ts). */
export const ImageWithLayout = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "block",
        parseHTML: (el) => el.getAttribute("data-align") || "block",
        renderHTML: (attrs) => ({ "data-align": attrs.align ?? "block" }),
      },
      size: {
        default: null as ImgSize | null,
        parseHTML: (el) => (el.getAttribute("data-size") as ImgSize | null) || null,
        renderHTML: (attrs) => (attrs.size ? { "data-size": attrs.size } : {}),
      },
      widthPct: {
        default: 100,
        parseHTML: (el) => {
          const v = el.getAttribute("data-width-pct");
          return v ? Number(v) : 100;
        },
        renderHTML: (attrs) => {
          const size = (attrs.size as ImgSize | null) ?? null;
          if (size) {
            // Preset wins — style comes from CSS (.prose-doc img[data-size=…]).
            return { "data-width-pct": String(attrs.widthPct ?? 100) };
          }
          const w = Math.max(5, Math.min(100, Number(attrs.widthPct) || 100));
          const align = attrs.align ?? "block";
          const widthStyle = align === "full" ? "100%" : `${w}%`;
          // Cap legacy widthPct so a 100% setting can't blow past 40em.
          return {
            "data-width-pct": String(w),
            style: `width:${widthStyle};max-width:min(${SIZE_MAX_EM.lg},100%);height:auto;`,
          };
        },
      },
    };
  },
});
