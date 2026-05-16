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
type Size = "sm" | "md" | "lg" | "full";

const ALIGNS: { value: Align; label: string; icon: typeof AlignLeft }[] = [
  { value: "wrap-left", label: "Wrap left", icon: AlignLeft },
  { value: "center", label: "Center", icon: AlignCenter },
  { value: "wrap-right", label: "Wrap right", icon: AlignRight },
  { value: "block", label: "Inline (no wrap)", icon: AlignJustify },
  { value: "full", label: "Full width", icon: Maximize2 },
];

const SIZES: { value: Size; label: string }[] = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "full", label: "Full" },
];

/** Floating popover that appears over the selected image inside the Tiptap
 * editor. Lets the admin pick alignment / width without leaving the document. */
export function ImagePopover({ editor }: { editor: Editor }) {
  const [state, setState] = useState<{
    pos: number;
    align: Align;
    size: Size | null;
    widthPct: number;
    rect: { top: number; left: number; width: number };
  } | null>(null);
  const [showCustom, setShowCustom] = useState(false);

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
        size: (sel.node.attrs.size as Size | null) ?? null,
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

  const update = (attrs: Partial<{ align: Align; size: Size | null; widthPct: number }>) => {
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
              onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={remove}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] uppercase font-mono-tech text-muted-foreground w-10">
          Size
        </span>
        {SIZES.map((s) => {
          const active = state.size === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => update({ size: s.value, widthPct: 100 })}
              className={cn(
                "inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded border px-2 text-[11px] hover:bg-muted",
                active
                  ? "border-primary bg-muted text-primary"
                  : "border-border text-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowCustom((v) => !v)}
          className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline"
        >
          {showCustom ? "Hide %" : "Custom %"}
        </button>
      </div>
      {showCustom && (
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
            onChange={(e) => update({ size: null, widthPct: Number(e.target.value) })}
            className="flex-1 disabled:opacity-40"
          />
          <input
            type="number"
            min={10}
            max={100}
            value={state.widthPct}
            disabled={disabledWidth}
            onChange={(e) => update({ size: null, widthPct: Number(e.target.value) })}
            className="w-14 rounded border border-input bg-background px-1.5 py-0.5 text-xs disabled:opacity-40"
          />
          <span className="text-[10px] text-muted-foreground">%</span>
        </div>
      )}
    </div>
  );
}
