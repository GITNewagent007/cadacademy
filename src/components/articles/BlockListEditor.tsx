import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import {
  type Block,
  type BlockType,
  type CalloutVariant,
  BLOCK_TYPE_LABELS,
  newBlock,
} from "@/lib/article-types";

export function BlockListEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  function update(idx: number, fn: (b: Block) => Block) {
    onChange(blocks.map((b, i) => (i === idx ? fn(b) : b)));
  }
  function remove(idx: number) {
    onChange(blocks.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    const ni = idx + dir;
    if (ni < 0 || ni >= blocks.length) return;
    const next = blocks.slice();
    [next[idx], next[ni]] = [next[ni], next[idx]];
    onChange(next);
  }
  function add(type: BlockType, at?: number) {
    const next = blocks.slice();
    next.splice(at ?? next.length, 0, newBlock(type));
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No blocks yet — add the first block below.
        </p>
      )}
      {blocks.map((block, i) => (
        <div key={block.id} className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-2 py-1">
            <span className="text-[10px] font-mono-tech uppercase text-muted-foreground">
              {BLOCK_TYPE_LABELS[block.type]}
            </span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => move(i, -1)} className="p-1 rounded hover:bg-muted" title="Move up">
                <ChevronUp className="h-3 w-3" />
              </button>
              <button onClick={() => move(i, 1)} className="p-1 rounded hover:bg-muted" title="Move down">
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => remove(i)}
                className="p-1 rounded hover:bg-destructive/10 text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="p-2">
            <BlockEditor block={block} onChange={(nb) => update(i, () => nb)} />
          </div>
        </div>
      ))}
      <AddBlockBar onAdd={(t) => add(t)} />
    </div>
  );
}

function AddBlockBar({ onAdd }: { onAdd: (t: BlockType) => void }) {
  const types: BlockType[] = [
    "heading", "paragraph", "list", "image", "video", "table", "callout", "code", "divider",
  ];
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-dashed border-border p-2">
      <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
        <Plus className="h-3 w-3" /> Add block:
      </span>
      {types.map((t) => (
        <button
          key={t}
          onClick={() => onAdd(t)}
          className="rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
        >
          {BLOCK_TYPE_LABELS[t]}
        </button>
      ))}
    </div>
  );
}

const inputCls =
  "w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

function BlockEditor({ block, onChange }: { block: Block; onChange: (b: Block) => void }) {
  switch (block.type) {
    case "heading":
      return (
        <div className="flex gap-2">
          <select
            value={block.level}
            onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 1 | 2 | 3 })}
            className="rounded border border-input bg-background px-2 py-1 text-sm"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Heading text"
            className={inputCls}
          />
        </div>
      );
    case "paragraph":
      return (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Paragraph text. Inline: **bold** *italic* `code` [link](https://...)"
          rows={3}
          className={inputCls}
        />
      );
    case "list":
      return (
        <div className="space-y-1">
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={block.ordered}
              onChange={(e) => onChange({ ...block, ordered: e.target.checked })}
            />
            Ordered (numbered)
          </label>
          {block.items.map((it, i) => (
            <div key={i} className="flex gap-1">
              <input
                value={it}
                onChange={(e) => {
                  const items = block.items.slice();
                  items[i] = e.target.value;
                  onChange({ ...block, items });
                }}
                className={inputCls}
              />
              <button
                onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                className="rounded border border-border px-2 text-xs hover:bg-muted"
                title="Remove item"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="text-xs text-blueprint hover:underline"
          >
            + Add item
          </button>
        </div>
      );
    case "image":
      return (
        <div className="space-y-1">
          <input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="Image URL (https://…)"
            className={inputCls}
          />
          <input
            value={block.alt ?? ""}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Alt text (for accessibility)"
            className={inputCls}
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputCls}
          />
        </div>
      );
    case "video":
      return (
        <div className="space-y-1">
          <input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="YouTube, Vimeo or .mp4 URL"
            className={inputCls}
          />
          <input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputCls}
          />
        </div>
      );
    case "table":
      return (
        <div className="space-y-1 overflow-x-auto">
          <div className="flex gap-1">
            {block.headers.map((h, ci) => (
              <input
                key={ci}
                value={h}
                onChange={(e) => {
                  const headers = block.headers.slice();
                  headers[ci] = e.target.value;
                  onChange({ ...block, headers });
                }}
                className={inputCls + " font-semibold"}
              />
            ))}
            <button
              onClick={() => {
                const headers = [...block.headers, `Column ${block.headers.length + 1}`];
                const rows = block.rows.map((r) => [...r, ""]);
                onChange({ ...block, headers, rows });
              }}
              className="rounded border border-border px-2 text-xs hover:bg-muted whitespace-nowrap"
            >
              + Col
            </button>
          </div>
          {block.rows.map((row, ri) => (
            <div key={ri} className="flex gap-1">
              {row.map((cell, ci) => (
                <input
                  key={ci}
                  value={cell}
                  onChange={(e) => {
                    const rows = block.rows.map((r) => r.slice());
                    rows[ri][ci] = e.target.value;
                    onChange({ ...block, rows });
                  }}
                  className={inputCls}
                />
              ))}
              <button
                onClick={() => onChange({ ...block, rows: block.rows.filter((_, j) => j !== ri) })}
                className="rounded border border-border px-2 text-xs hover:bg-muted"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onChange({ ...block, rows: [...block.rows, block.headers.map(() => "")] })
            }
            className="text-xs text-blueprint hover:underline"
          >
            + Add row
          </button>
        </div>
      );
    case "callout":
      return (
        <div className="space-y-1">
          <select
            value={block.variant}
            onChange={(e) => onChange({ ...block, variant: e.target.value as CalloutVariant })}
            className="rounded border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="info">Info</option>
            <option value="tip">Tip</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
          </select>
          <textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Callout text"
            rows={2}
            className={inputCls}
          />
        </div>
      );
    case "code":
      return (
        <div className="space-y-1">
          <input
            value={block.language ?? ""}
            onChange={(e) => onChange({ ...block, language: e.target.value })}
            placeholder="Language (optional, e.g. javascript)"
            className={inputCls}
          />
          <textarea
            value={block.code}
            onChange={(e) => onChange({ ...block, code: e.target.value })}
            placeholder="Code"
            rows={4}
            className={inputCls + " font-mono-tech"}
          />
        </div>
      );
    case "divider":
      return <hr className="border-border" />;
  }
}
