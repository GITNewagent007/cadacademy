import { Node, mergeAttributes } from "@tiptap/core";

/** Inline atom node for a custom emoji — renders as a small inline <img>
 * sized to the surrounding line. Roundtrips through our markdown
 * convention as `{{e:URL}}` (see article-doc.ts and inline.tsx). */
export const Emoji = Node.create({
  name: "emoji",
  inline: true,
  group: "inline",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      src: { default: "" },
      name: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "img[data-emoji]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-emoji": "true",
        class: "custom-emoji",
        alt: HTMLAttributes.name || "emoji",
        style:
          "display:inline-block;height:1.25em;width:auto;vertical-align:-0.25em;margin:0 0.05em;",
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    emoji: {
      insertEmoji: (attrs: { src: string; name?: string }) => ReturnType;
    };
  }
}
