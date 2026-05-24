import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { Link2, MousePointerClick, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useArticleList } from "@/hooks/useArticles";
import { useProgramLayout } from "@/hooks/useProgramLayout";

type Attrs = {
  label: string;
  target: "article" | "tab";
  articleSlug: string;
  tabId: string;
  variant: "primary" | "secondary";
};

const POPOVER_WIDTH = 320;

/** Floating popover that appears over the selected link-button node inside the
 *  Tiptap editor. Lets the admin pick label, destination article / tab, and
 *  visual variant. */
export function LinkButtonPopover({ editor }: { editor: Editor }) {
  // Anchor (pos + rect) is computed only when the selection changes — NOT on
  // every transaction. Otherwise editing the label triggers transactions that
  // re-measure the node and the popover jitters / steals focus.
  const [anchor, setAnchor] = useState<
    | { pos: number; rect: { top: number; left: number } }
    | null
  >(null);
  // Attrs are read live from the editor on each render via a tick counter
  // bumped on every transaction.
  const [, setTick] = useState(0);

  const { data: articles } = useArticleList();
  const { data: program } = useProgramLayout("inventor");
  const tabs = program?.layout.tabs ?? [];

  useEffect(() => {
    const recomputeAnchor = () => {
      const sel = editor.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "linkButton") {
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

      // Clamp horizontally so the popover stays inside the editor.
      const centerX = r.left - editorRect.left + r.width / 2;
      const minLeft = POPOVER_WIDTH / 2 + 8;
      const maxLeft = editorEl.clientWidth - POPOVER_WIDTH / 2 - 8;
      const clampedLeft = Math.max(minLeft, Math.min(maxLeft, centerX));

      setAnchor({
        pos: sel.from,
        rect: { top: r.top - editorRect.top, left: clampedLeft },
      });
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
  if (!node || node.type.name !== "linkButton") return null;
  const a = node.attrs as Attrs;
  const attrs: Attrs = {
    label: a.label ?? "Open",
    target: (a.target as "article" | "tab") ?? "article",
    articleSlug: a.articleSlug ?? "",
    tabId: a.tabId ?? "",
    variant: (a.variant as "primary" | "secondary") ?? "primary",
  };

  /** Update node attributes WITHOUT calling `.focus()` on the editor — that
   *  would steal focus back from any input being typed into. */
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
          <MousePointerClick className="h-3.5 w-3.5" /> Link button
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
        <span className="text-[10px] uppercase font-mono-tech text-muted-foreground">Label</span>
        <input
          type="text"
          value={attrs.label}
          onChange={(e) => update({ label: e.target.value })}
          className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm"
          placeholder="Open the sketch tab"
        />
      </label>

      <div className="flex items-center gap-1">
        {(["article", "tab"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => update({ target: t })}
            className={cn(
              "flex-1 rounded border px-2 py-1 text-xs",
              attrs.target === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-foreground hover:bg-muted",
            )}
          >
            {t === "article" ? "Another article" : "Simulator tab"}
          </button>
        ))}
      </div>

      {attrs.target === "article" ? (
        <label className="block">
          <span className="text-[10px] uppercase font-mono-tech text-muted-foreground">Destination article</span>
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
      ) : (
        <label className="block">
          <span className="text-[10px] uppercase font-mono-tech text-muted-foreground">Destination tab</span>
          <select
            value={attrs.tabId}
            onChange={(e) => update({ tabId: e.target.value })}
            className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="">— select a tab —</option>
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex items-center gap-1">
        <span className="text-[10px] uppercase font-mono-tech text-muted-foreground w-12">Style</span>
        {(["primary", "secondary"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => update({ variant: v })}
            className={cn(
              "flex-1 rounded border px-2 py-1 text-xs capitalize",
              attrs.variant === v
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-foreground hover:bg-muted",
            )}
          >
            <Link2 className="inline h-3 w-3 mr-1" />
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
