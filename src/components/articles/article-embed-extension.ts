import { Node, mergeAttributes } from "@tiptap/core";

/** Block-level atom: an inline embed of another article. Readers see a
 *  collapsed card with the article's title + summary and can expand it in
 *  place. Stored as <div data-article-embed="true"> in HTML so it roundtrips
 *  and serialized to our Block schema via article-doc.ts. */
export const ArticleEmbed = Node.create({
  name: "articleEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      articleSlug: { default: "" },
      defaultOpen: { default: false },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-article-embed]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const slug = (HTMLAttributes.articleSlug as string) || "";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-article-embed": "true",
        class: "tiptap-article-embed",
      }),
      ["span", { class: "tiptap-article-embed-label" }, "📖 Embedded article"],
      ["span", { class: "tiptap-article-embed-hint" }, slug ? `article: ${slug}` : "(no article selected)"],
    ];
  },
});
