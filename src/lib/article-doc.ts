// Convert between our Block[] storage model and a ProseMirror/TipTap JSON document.
// The editor presents a continuous Word-like document while the database keeps
// the existing block schema. Inline formatting is roundtripped through the
// minimal markdown convention used by `renderInline` (**bold**, *italic*,
// `code`, [text](url)).

import type { Block, CalloutVariant, ListNode } from "./article-types";

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

/** Parse our minimal markdown to an array of PM text/inline nodes with marks.
 * Custom emojis use the sentinel `{{e:URL}}` (optionally `{{e:URL|name}}`). */
export function inlineToPM(text: string): PMNode[] {
  if (!text) return [];
  const out: PMNode[] = [];
  const regex = /\{\{e:([^}|]+)(?:\|([^}]+))?\}\}|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1]) {
      out.push({ type: "emoji", attrs: { src: m[1], name: m[2] ?? "" } });
    } else if (m[3] && m[4]) {
      out.push({
        type: "text",
        text: m[3],
        marks: [{ type: "link", attrs: { href: m[4], target: "_blank" } }],
      });
    } else if (m[5]) {
      out.push({ type: "text", text: m[5], marks: [{ type: "bold" }] });
    } else if (m[6]) {
      out.push({ type: "text", text: m[6], marks: [{ type: "italic" }] });
    } else if (m[7]) {
      out.push({ type: "text", text: m[7], marks: [{ type: "code" }] });
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
      if (n.type === "emoji") {
        const src = (n.attrs?.src as string) ?? "";
        const name = (n.attrs?.name as string) ?? "";
        if (!src) return "";
        return name ? `{{e:${src}|${name}}}` : `{{e:${src}}}`;
      }
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

function nodesToListPM(ordered: boolean, items: ListNode[]): PMNode {
  return {
    type: ordered ? "orderedList" : "bulletList",
    content: items.map((node) => {
      const c: PMNode[] = [
        { type: "paragraph", content: inlineToPM(node.text) },
      ];
      if (node.children && node.children.items.length) {
        c.push(nodesToListPM(node.children.ordered, node.children.items));
      }
      return { type: "listItem", content: c };
    }),
  };
}

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
        if (b.nodes && b.nodes.length) {
          content.push(nodesToListPM(b.ordered, b.nodes));
        } else {
          content.push({
            type: b.ordered ? "orderedList" : "bulletList",
            content: b.items.map((it) => ({
              type: "listItem",
              content: [{ type: "paragraph", content: inlineToPM(it) }],
            })),
          });
        }
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
      case "linkButton":
        content.push({
          type: "linkButton",
          attrs: {
            label: b.label ?? "Open",
            target: b.target ?? "article",
            articleSlug: b.articleSlug ?? "",
            tabId: b.tabId ?? "",
            variant: b.variant ?? "primary",
          },
        });
        break;
      case "articleEmbed":
        content.push({
          type: "articleEmbed",
          attrs: {
            articleSlug: b.articleSlug ?? "",
            defaultOpen: b.defaultOpen ?? false,
          },
        });
        break;
    }
  }
  if (content.length === 0) content.push({ type: "paragraph" });
  return { type: "doc", content };
}

// ---------- PM doc -> Block[] ----------

function parseListItem(li: PMNode): ListNode {
  let text = "";
  let textSet = false;
  let children: ListNode["children"] | undefined;
  for (const c of li.content ?? []) {
    if (c.type === "paragraph" && !textSet) {
      text = pmToInline(c.content);
      textSet = true;
    } else if (c.type === "bulletList" || c.type === "orderedList") {
      children = {
        ordered: c.type === "orderedList",
        items: (c.content ?? []).map(parseListItem),
      };
    }
  }
  const node: ListNode = { text };
  if (children) node.children = children;
  return node;
}



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
        const nodes = (n.content ?? []).map(parseListItem);
        const flatItems = nodes.map((nd) => nd.text);
        out.push({
          id: newId(),
          type: "list",
          ordered: n.type === "orderedList",
          items: flatItems.length ? flatItems : [""],
          nodes: nodes.length ? nodes : [{ text: "" }],
        });
        break;
      }
      case "image": {
        const align = (n.attrs?.align as Block extends { type: "image"; align?: infer A } ? A : never) ?? "block";
        const widthPct = Number(n.attrs?.widthPct ?? 100);
        out.push({
          id: newId(),
          type: "image",
          url: (n.attrs?.src as string) ?? "",
          alt: (n.attrs?.alt as string) ?? "",
          caption: (n.attrs?.title as string) ?? "",
          align: align as "block" | "center" | "wrap-left" | "wrap-right" | "full",
          widthPct,
        });
        break;
      }
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
      case "linkButton": {
        const target = ((n.attrs?.target as string) === "tab" ? "tab" : "article") as "article" | "tab";
        const variant = ((n.attrs?.variant as string) === "secondary" ? "secondary" : "primary") as "primary" | "secondary";
        out.push({
          id: newId(),
          type: "linkButton",
          label: (n.attrs?.label as string) ?? "Open",
          target,
          articleSlug: (n.attrs?.articleSlug as string) ?? "",
          tabId: (n.attrs?.tabId as string) ?? "",
          variant,
        });
        break;
      }
      case "articleEmbed": {
        out.push({
          id: newId(),
          type: "articleEmbed",
          articleSlug: (n.attrs?.articleSlug as string) ?? "",
          defaultOpen: Boolean(n.attrs?.defaultOpen),
        });
        break;
      }
    }
  }
  return out;
}
