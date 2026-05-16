import { Node, mergeAttributes } from "@tiptap/core";

/** Block-level atom: a clickable "go to article / tab" button inside an article.
 *  Stored as a <div data-link-button="true"> in HTML so it roundtrips, and
 *  serialized to our Block schema via article-doc.ts. */
export const LinkButton = Node.create({
  name: "linkButton",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      label: { default: "Open" },
      target: { default: "article" }, // "article" | "tab"
      articleSlug: { default: "" },
      tabId: { default: "" },
      variant: { default: "primary" }, // "primary" | "secondary"
    };
  },
  parseHTML() {
    return [{ tag: "div[data-link-button]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const label = (HTMLAttributes.label as string) || "Open";
    const target = HTMLAttributes.target as string;
    const slug = HTMLAttributes.articleSlug as string;
    const tabId = HTMLAttributes.tabId as string;
    const dest = target === "tab" ? (tabId ? `tab: ${tabId}` : "(no tab)") : slug ? `article: ${slug}` : "(no article)";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-link-button": "true",
        class: "tiptap-link-button",
      }),
      ["span", { class: "tiptap-link-button-label" }, `→ ${label}`],
      ["span", { class: "tiptap-link-button-hint" }, dest],
    ];
  },
});
