// Convert between our Block[] storage model and a ProseMirror/TipTap JSON document.
// The editor presents a continuous Word-like document while the database keeps
// the existing block schema. Inline formatting is roundtripped through the
// minimal markdown convention used by `renderInline` (**bold**, *italic*,
// `code`, [text](url)).

import type { Block, CalloutVariant } from "./article-types";

type PMMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "code" }
  | { type: "link"; attrs: { href: string; target?: string | null } };

type PMNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMNode[];
  text?: string;
  marks?: PMMark[];
};

const newId = () => `b-${(crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8)}`;

// ---------- markdown <-> PM inline ----------

/** Parse our minimal markdown to an array of PM text nodes with marks. */
export function inlineToPM(text: string): PMNode[] {
  if (!text) return [];
  const out: PMNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1] && m[2]) {
      out.push({
        type: "text",
        text: m[1],
        marks: [{ type: "link", attrs: { href: m[2], target: "_blank" } }],
      });
    } else if (m[3]) {
      out.push({ type: "text", text: m[3], marks: [{ type: "bold" }] });
    } else if (m[4]) {
      out.push({ type: "text", text: m[4], marks: [{ type: "italic" }] });
    } else if (m[5]) {
      out.push({ type: "text", text: m[5], marks: [{ type: "code" }] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

/** Serialize PM inline content back to our markdown convention. */
export function pmToInline(content: PMNode[] | undefined): string {
  if (!content) return "";
  return content
    .map((n) => {
      if (n.type !== "text" || !n.text) return "";
      let t = n.text;
      const marks = n.marks ?? [];
      const has = (k: string) => marks.some((m) => m.type === k);
      if (has("code")) t = "`" + t + "`";
      if (has("bold")) t = "**" + t + "**";
      if (has("italic")) t = "*" + t + "*";
      const link = marks.find((m) => m.type === "link") as
        | { type: "link"; attrs: { href: string } }
        | undefined;
      if (link) t = `[${t}](${link.attrs.href})`;
      return t;
    })
    .join("");
}

// ---------- Block[] -> PM doc ----------

export function blocksToDoc(blocks: Block[]): PMNode {
  const content: PMNode[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
        content.push({
          type: "heading",
          attrs: { level: b.level + 1 }, // store level 1..3 -> H2..H4
          content: b.text ? [{ type: "text", text: b.text }] : undefined,
        });
        break;
      case "paragraph": {
        const inline = inlineToPM(b.text);
        content.push({ type: "paragraph", content: inline.length ? inline : undefined });
        break;
      }
      case "list":
        content.push({
          type: b.ordered ? "orderedList" : "bulletList",
          content: b.items.map((it) => ({
            type: "listItem",
            content: [{ type: "paragraph", content: inlineToPM(it) }],
          })),
        });
        break;
      case "image":
        content.push({
          type: "image",
          attrs: {
            src: b.url,
            alt: b.alt ?? "",
            title: b.caption ?? null,
            align: b.align ?? "block",
            widthPct: b.widthPct ?? 100,
          },
        });
        break;
      case "video":
        content.push({
          type: "video",
          attrs: { url: b.url, caption: b.caption ?? "" },
        });
        break;
      case "table":
        content.push({
          type: "table",
          content: [
            {
              type: "tableRow",
              content: b.headers.map((h) => ({
                type: "tableHeader",
                content: [{ type: "paragraph", content: inlineToPM(h) }],
              })),
            },
            ...b.rows.map((row) => ({
              type: "tableRow",
              content: row.map((c) => ({
                type: "tableCell",
                content: [{ type: "paragraph", content: inlineToPM(c) }],
              })),
            })),
          ],
        });
        break;
      case "callout":
        content.push({
          type: "callout",
          attrs: { variant: b.variant },
          content: [{ type: "paragraph", content: inlineToPM(b.text) }],
        });
        break;
      case "code":
        content.push({
          type: "codeBlock",
          attrs: { language: b.language ?? null },
          content: b.code ? [{ type: "text", text: b.code }] : undefined,
        });
        break;
      case "divider":
        content.push({ type: "horizontalRule" });
        break;
    }
  }
  if (content.length === 0) content.push({ type: "paragraph" });
  return { type: "doc", content };
}

// ---------- PM doc -> Block[] ----------

export function docToBlocks(doc: PMNode): Block[] {
  const out: Block[] = [];
  const top = doc.content ?? [];
  for (const n of top) {
    switch (n.type) {
      case "heading": {
        const lvl = Math.min(3, Math.max(1, ((n.attrs?.level as number) ?? 2) - 1)) as 1 | 2 | 3;
        out.push({ id: newId(), type: "heading", level: lvl, text: pmToInline(n.content) });
        break;
      }
      case "paragraph": {
        const text = pmToInline(n.content);
        out.push({ id: newId(), type: "paragraph", text });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = (n.content ?? []).map((li) => {
          const para = (li.content ?? []).find((c) => c.type === "paragraph");
          return pmToInline(para?.content);
        });
        out.push({
          id: newId(),
          type: "list",
          ordered: n.type === "orderedList",
          items: items.length ? items : [""],
        });
        break;
      }
      case "image":
        out.push({
          id: newId(),
          type: "image",
          url: (n.attrs?.src as string) ?? "",
          alt: (n.attrs?.alt as string) ?? "",
          caption: (n.attrs?.title as string) ?? "",
        });
        break;
      case "video":
        out.push({
          id: newId(),
          type: "video",
          url: (n.attrs?.url as string) ?? "",
          caption: (n.attrs?.caption as string) ?? "",
        });
        break;
      case "table": {
        const rows = (n.content ?? []).map((row) =>
          (row.content ?? []).map((cell) => {
            const para = (cell.content ?? []).find((c) => c.type === "paragraph");
            return pmToInline(para?.content);
          }),
        );
        if (rows.length === 0) break;
        const [headers, ...rest] = rows;
        out.push({ id: newId(), type: "table", headers, rows: rest });
        break;
      }
      case "callout": {
        const para = (n.content ?? []).find((c) => c.type === "paragraph");
        const variant = ((n.attrs?.variant as CalloutVariant) ?? "info") as CalloutVariant;
        out.push({ id: newId(), type: "callout", variant, text: pmToInline(para?.content) });
        break;
      }
      case "codeBlock":
        out.push({
          id: newId(),
          type: "code",
          language: (n.attrs?.language as string) ?? "",
          code: (n.content ?? []).map((c) => c.text ?? "").join(""),
        });
        break;
      case "horizontalRule":
        out.push({ id: newId(), type: "divider" });
        break;
    }
  }
  return out;
}
