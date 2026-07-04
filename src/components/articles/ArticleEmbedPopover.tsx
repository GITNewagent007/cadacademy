import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { BookOpen, Trash2 } from "lucide-react";
import { useArticleList } from "@/hooks/useArticles";

type Attrs = { articleSlug: string; defaultOpen: boolean };

const POPOVER_WIDTH = 320;

export function ArticleEmbedPopover({ editor }: { editor: Editor }) {
  const [anchor, setAnchor] = useState<
    | { pos: number; rect: { top: number; left: number } }
    | null
  >(null);
  const [, setTick] = useState(0);

  const { data: articles } = useArticleList();

  useEffect(() => {
    const recomputeAnchor = () => {
      const sel = editor.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "articleEmbed") {
        setAnchor(null);
        return;
      }
      const dom = editor.view.nodeDOM(sel.from) as HTMLElement | null;
      const editorEl = editor.view.dom as HTMLElement;
      if (!dom) {
        setAnchor(null);
        return;
      }
      const editorRect = editorEl.getBoundingClientRect();
      const r = dom.getBoundingClientRect();
      const centerX = r.left - editorRect.left + r.width / 2;
      const minLeft = POPOVER_WIDTH / 2 + 8;
      const maxLeft = editorEl.clientWidth - POPOVER_WIDTH / 2 - 8;
      const clampedLeft = Math.max(minLeft, Math.min(maxLeft, centerX));
      setAnchor({ pos: sel.from, rect: { top: r.top - editorRect.top, left: clampedLeft } });
    };
    const onTransaction = () => setTick((n) => n + 1);
    editor.on("selectionUpdate", recomputeAnchor);
    editor.on("transaction", onTransaction);
    return () => {
      editor.off("selectionUpdate", recomputeAnchor);
      editor.off("transaction", onTransaction);
    };
  }, [editor]);

  if (!anchor) return null;
  const node = editor.state.doc.nodeAt(anchor.pos);
  if (!node || node.type.name !== "articleEmbed") return null;
  const a = node.attrs as Attrs;
  const attrs: Attrs = {
    articleSlug: a.articleSlug ?? "",
    defaultOpen: Boolean(a.defaultOpen),
  };

  const update = (next: Partial<Attrs>) => {
    const { state, view } = editor;
    const fresh = state.doc.nodeAt(anchor.pos);
    if (!fresh) return;
    const tr = state.tr.setNodeMarkup(anchor.pos, undefined, { ...fresh.attrs, ...next });
    view.dispatch(tr);
  };
  const remove = () => editor.chain().focus().deleteSelection().run();

  return (
    <div
      className="absolute z-30 rounded-md border border-border bg-popover shadow-lg p-3 flex flex-col gap-2"
      style={{
        top: anchor.rect.top,
        left: anchor.rect.left,
        width: POPOVER_WIDTH,
        transform: "translate(-50%, calc(-100% - 8px))",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono-tech uppercase text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" /> Embedded article
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={remove}
          title="Delete"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <label className="block">
        <span className="text-[10px] uppercase font-mono-tech text-muted-foreground">Article</span>
        <select
          value={attrs.articleSlug}
          onChange={(e) => update({ articleSlug: e.target.value })}
          className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm"
        >
          <option value="">— select an article —</option>
          {(articles ?? []).map((a) => (
            <option key={a.id} value={a.slug}>
              {a.title} ({a.slug})
            </option>
          ))}
        </select>
      </label>

      <label className="inline-flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={attrs.defaultOpen}
          onChange={(e) => update({ defaultOpen: e.target.checked })}
        />
        <span>Start expanded when the module loads</span>
      </label>
    </div>
  );
}
