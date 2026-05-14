import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Maximize2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Align = "block" | "center" | "wrap-left" | "wrap-right" | "full";

const ALIGNS: { value: Align; label: string; icon: typeof AlignLeft }[] = [
  { value: "wrap-left", label: "Wrap left", icon: AlignLeft },
  { value: "center", label: "Center", icon: AlignCenter },
  { value: "wrap-right", label: "Wrap right", icon: AlignRight },
  { value: "block", label: "Inline (no wrap)", icon: AlignJustify },
  { value: "full", label: "Full width", icon: Maximize2 },
];

/** Floating popover that appears over the selected image inside the Tiptap
 * editor. Lets the admin pick alignment / width without leaving the document. */
export function ImagePopover({ editor }: { editor: Editor }) {
  const [state, setState] = useState<{
    pos: number;
    align: Align;
    widthPct: number;
    rect: { top: number; left: number; width: number };
  } | null>(null);

  useEffect(() => {
    const update = () => {
      const sel = editor.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "image") {
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
      setState({
        pos: sel.from,
        align: (sel.node.attrs.align as Align) ?? "block",
        widthPct: Number(sel.node.attrs.widthPct ?? 100),
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

  const update = (attrs: Partial<{ align: Align; widthPct: number }>) => {
    editor.chain().focus().updateAttributes("image", attrs).run();
  };

  const remove = () => {
    editor.chain().focus().deleteSelection().run();
  };

  const disabledWidth = state.align === "full";

  return (
    <div
      className="absolute z-30 -translate-y-full -mt-2 rounded-md border border-border bg-popover shadow-lg p-2 flex flex-col gap-2 min-w-[260px]"
      style={{
        top: state.rect.top,
        left: state.rect.left + state.rect.width / 2,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="flex items-center gap-0.5">
        {ALIGNS.map((a) => {
          const Icon = a.icon;
          const active = state.align === a.value;
          return (
            <button
              key={a.value}
              type="button"
              title={a.label}
              onClick={() => update({ align: a.value })}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded text-foreground hover:bg-muted",
                active && "bg-muted text-primary",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          title="Delete image"
          onClick={remove}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-mono-tech text-muted-foreground w-10">
          Width
        </span>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={state.widthPct}
          disabled={disabledWidth}
          onChange={(e) => update({ widthPct: Number(e.target.value) })}
          className="flex-1 disabled:opacity-40"
        />
        <input
          type="number"
          min={10}
          max={100}
          value={state.widthPct}
          disabled={disabledWidth}
          onChange={(e) => update({ widthPct: Number(e.target.value) })}
          className="w-14 rounded border border-input bg-background px-1.5 py-0.5 text-xs disabled:opacity-40"
        />
        <span className="text-[10px] text-muted-foreground">%</span>
      </div>
    </div>
  );
}
