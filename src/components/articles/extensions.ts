import { Node, mergeAttributes } from "@tiptap/core";

/** Block-level callout: a wrapper that contains a paragraph and carries a variant. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph",
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-variant") || "info",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "true",
        class: "tiptap-callout",
      }),
      0,
    ];
  },
});

/** Atom video block: stores a URL + optional caption, rendered as a placeholder
 * card inside the editor. The published renderer resolves the embed. */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      url: { default: "" },
      caption: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-video]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-video": "true", class: "tiptap-video" }),
      ["span", {}, `▶ Video — ${HTMLAttributes.url || "(no URL)"}`],
    ];
  },
});
