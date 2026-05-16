// Centralized article content model. Buttons reference an article by id;
// articles live independently and can be reused across many buttons.

export type CalloutVariant = "info" | "tip" | "warning" | "danger";

export type ImageSize = "sm" | "md" | "lg" | "full";

/** Map a legacy widthPct (10–100) to the closest preset. */
export function widthPctToSize(pct: number | undefined): ImageSize {
  const p = pct ?? 100;
  if (p <= 30) return "sm";
  if (p <= 55) return "md";
  if (p <= 85) return "lg";
  return "full";
}

export type Block =
  | { id: string; type: "heading"; level: 1 | 2 | 3; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | {
      id: string;
      type: "image";
      url: string;
      alt?: string;
      caption?: string;
      /** Word-style layout: block (no wrap), center, wrap-left, wrap-right, full (edge-to-edge). */
      align?: "block" | "center" | "wrap-left" | "wrap-right" | "full";
      /** Typography-relative preset. Preferred over widthPct. */
      size?: ImageSize;
      /** Legacy: width as a percentage of the article column. Still honored, but capped. */
      widthPct?: number;
    }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "table"; headers: string[]; rows: string[][] }
  | { id: string; type: "callout"; variant: CalloutVariant; text: string }
  | { id: string; type: "code"; language?: string; code: string }
  | { id: string; type: "divider" }
  | {
      id: string;
      type: "linkButton";
      label: string;
      /** Where the button takes the reader. */
      target: "article" | "tab";
      /** When target=article, the slug of the destination article. */
      articleSlug?: string;
      /** When target=tab, the id of the simulator tab to switch to. */
      tabId?: string;
      /** Visual variant. */
      variant?: "primary" | "secondary";
    };

export type BlockType = Block["type"];

export type ArticleSourceKind = "blocks" | "docx";

export type ImageAlign = "left" | "right" | "center" | "inline" | "none";
export type ImageOverrides = Record<string, ImageAlign>;

export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: Block[];
  updatedAt?: string;
  sourceKind: ArticleSourceKind;
  html: string;
  sourceFilePath: string | null;
  sourceFileName: string | null;
  sourceUploadedAt: string | null;
  imageOverrides: ImageOverrides;
};

/** Extracts the content-hash that we use as the override key from a docx
 * image src like `…/articles/<id>/images/<hash>.<ext>`. */
export function imageHashFromSrc(src: string): string | null {
  const m = src.match(/\/images\/([a-f0-9]+)\.[a-z0-9]+(?:\?|$)/i);
  return m ? m[1] : null;
}

/** Rewrites docx-img class on every <img> in the html according to overrides. */
export function applyImageOverrides(html: string, overrides: ImageOverrides): string {
  if (!html) return html;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc="([^"]+)"/i);
    if (!srcMatch) return tag;
    const hash = imageHashFromSrc(srcMatch[1]);
    if (!hash) return tag;
    const override = overrides[hash];
    if (!override) return tag;
    const newClass = `docx-img docx-align-${override}`;
    if (/\bclass="[^"]*"/i.test(tag)) {
      return tag.replace(/\bclass="[^"]*"/i, `class="${newClass}"`);
    }
    return tag.replace(/<img\b/i, `<img class="${newClass}"`);
  });
}

export type ArticleSummary = Pick<Article, "id" | "slug" | "title" | "summary" | "updatedAt">;

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  list: "List",
  image: "Image",
  video: "Video",
  table: "Table",
  callout: "Callout",
  code: "Code",
  divider: "Divider",
  linkButton: "Link button",
};

export function newBlock(type: BlockType): Block {
  const id = `b-${crypto.randomUUID().slice(0, 8)}`;
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: "Heading" };
    case "paragraph":
      return { id, type, text: "" };
    case "list":
      return { id, type, ordered: false, items: ["Item 1"] };
    case "image":
      return { id, type, url: "", alt: "", align: "block", widthPct: 100 };
    case "video":
      return { id, type, url: "" };
    case "table":
      return { id, type, headers: ["Column 1", "Column 2"], rows: [["", ""]] };
    case "callout":
      return { id, type, variant: "info", text: "" };
    case "code":
      return { id, type, language: "", code: "" };
    case "divider":
      return { id, type };
    case "linkButton":
      return { id, type, label: "Open", target: "article", variant: "primary" };
  }
}

/** Produce a TOC entry per heading block. Used by the part-tree to render
 * a clickable in-article outline (replaces the old per-button modules list). */
export function articleHeadings(content: Block[]): { id: string; text: string; level: 1 | 2 | 3 }[] {
  return content
    .filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading")
    .map((b) => ({ id: b.id, text: b.text || "(untitled)", level: b.level }));
}
