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

/** Floating popover that appears over the selected link-button node inside the
 *  Tiptap editor. Lets the admin pick label, destination article / tab, and
 *  visual variant. */
export function LinkButtonPopover({ editor }: { editor: Editor }) {
  const [state, setState] = useState<
    | (Attrs & { pos: number; rect: { top: number; left: number; width: number } })
    | null
  >(null);

  const { data: articles } = useArticleList();
  const { data: program } = useProgramLayout("inventor");
  const tabs = program?.layout.tabs ?? [];

  useEffect(() => {
    const update = () => {
      const sel = editor.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "linkButton") {
        setState(null);
        return;
      }
      const dom = editor.view.nodeDOM(sel.from) as HTMLElement | null;
      const editorRect = editor.view.dom.getBoundingClientRect();
      if (!dom) {
        setState(null);
        return;
      }
      const r = dom.getBoundingClientRect();
      const a = sel.node.attrs as Attrs;
      setState({
        pos: sel.from,
        label: a.label ?? "Open",
        target: (a.target as "article" | "tab") ?? "article",
        articleSlug: a.articleSlug ?? "",
        tabId: a.tabId ?? "",
        variant: (a.variant as "primary" | "secondary") ?? "primary",
        rect: {
          top: r.top - editorRect.top,
          left: r.left - editorRect.left,
          width: r.width,
        },
      });
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!state) return null;

  const update = (attrs: Partial<Attrs>) => {
    editor.chain().focus().updateAttributes("linkButton", attrs).run();
  };
  const remove = () => editor.chain().focus().deleteSelection().run();

  return (
    <div
      className="absolute z-30 rounded-md border border-border bg-popover shadow-lg p-3 flex flex-col gap-2 min-w-[320px]"
      style={{
        top: state.rect.top,
        left: state.rect.left + state.rect.width / 2,
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
          value={state.label}
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
              state.target === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-foreground hover:bg-muted",
            )}
          >
            {t === "article" ? "Another article" : "Simulator tab"}
          </button>
        ))}
      </div>

      {state.target === "article" ? (
        <label className="block">
          <span className="text-[10px] uppercase font-mono-tech text-muted-foreground">Destination article</span>
          <select
            value={state.articleSlug}
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
            value={state.tabId}
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
              state.variant === v
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
