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

const POPOVER_WIDTH = 280;

/** Floating popover that appears over the selected image inside the Tiptap
 * editor. Lets the admin pick alignment / width without leaving the document. */
export function ImagePopover({ editor }: { editor: Editor }) {
  // Anchor is recomputed only on selectionUpdate. If we recomputed on every
  // transaction, dragging the size slider would re-measure the (now resized)
  // image and the popover would skitter away from the slider thumb.
  const [anchor, setAnchor] = useState<
    | { pos: number; rect: { top: number; left: number } }
    | null
  >(null);
  const [, setTick] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    const recomputeAnchor = () => {
      const sel = editor.state.selection;
      if (!(sel instanceof NodeSelection) || sel.node.type.name !== "image") {
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
  if (!node || node.type.name !== "image") return null;

  const align = (node.attrs.align as Align) ?? "block";
  const size = (node.attrs.size as Size | null) ?? null;
  const widthPct = Number(node.attrs.widthPct ?? 100);

  /** Dispatch attr updates WITHOUT calling `.focus()` — focusing the editor
   *  blurs the slider/number input mid-drag, killing the interaction. */
  const update = (attrs: Partial<{ align: Align; size: Size | null; widthPct: number }>) => {
    const { state, view } = editor;
    const fresh = state.doc.nodeAt(anchor.pos);
    if (!fresh) return;
    const tr = state.tr.setNodeMarkup(anchor.pos, undefined, { ...fresh.attrs, ...attrs });
    view.dispatch(tr);
  };

  const remove = () => {
    editor.chain().focus().deleteSelection().run();
  };

  const disabledWidth = align === "full";

  return (
    <div
      className="absolute z-30 rounded-md border border-border bg-popover shadow-lg p-2 flex flex-col gap-2"
      style={{
        top: anchor.rect.top,
        left: anchor.rect.left,
        width: POPOVER_WIDTH,
        transform: "translate(-50%, calc(-100% - 8px))",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5">
        {ALIGNS.map((a) => {
          const Icon = a.icon;
          const active = align === a.value;
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
          const active = size === s.value;
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
            value={widthPct}
            disabled={disabledWidth}
            onChange={(e) => update({ size: null, widthPct: Number(e.target.value) })}
            className="flex-1 disabled:opacity-40"
          />
          <input
            type="number"
            min={10}
            max={100}
            value={widthPct}
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
