// Centralized article content model. Buttons reference an article by id;
// articles live independently and can be reused across many buttons.

export type CalloutVariant = "info" | "tip" | "warning" | "danger";

export type Block =
  | { id: string; type: "heading"; level: 1 | 2 | 3; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "image"; url: string; alt?: string; caption?: string }
  | { id: string; type: "video"; url: string; caption?: string }
  | { id: string; type: "table"; headers: string[]; rows: string[][] }
  | { id: string; type: "callout"; variant: CalloutVariant; text: string }
  | { id: string; type: "code"; language?: string; code: string }
  | { id: string; type: "divider" };

export type BlockType = Block["type"];

export type ArticleSourceKind = "blocks" | "docx";

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
};

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
      return { id, type, url: "", alt: "" };
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
  }
}

/** Produce a TOC entry per heading block. Used by the part-tree to render
 * a clickable in-article outline (replaces the old per-button modules list). */
export function articleHeadings(content: Block[]): { id: string; text: string; level: 1 | 2 | 3 }[] {
  return content
    .filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading")
    .map((b) => ({ id: b.id, text: b.text || "(untitled)", level: b.level }));
}
