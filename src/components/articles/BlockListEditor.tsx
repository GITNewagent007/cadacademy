import { useRef, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Upload,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  WrapText,
  Maximize2,
  Square,
} from "lucide-react";
import {
  type Block,
  type BlockType,
  type CalloutVariant,
  BLOCK_TYPE_LABELS,
  newBlock,
} from "@/lib/article-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AutoTextarea } from "./AutoTextarea";
import { InlineToolbar, inlineKeydown } from "./InlineToolbar";
import { Info, AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const CODE_LANGS = ["", "plain", "javascript", "typescript", "tsx", "json", "bash", "sql", "html", "css", "python"];

const calloutVariants: { value: CalloutVariant; label: string; icon: typeof Info; cls: string }[] = [
  { value: "info", label: "Info", icon: Info, cls: "border-blue-500/40 bg-blue-500/5" },
  { value: "tip", label: "Tip", icon: Lightbulb, cls: "border-emerald-500/40 bg-emerald-500/5" },
  { value: "warning", label: "Warning", icon: AlertTriangle, cls: "border-amber-500/40 bg-amber-500/5" },
  { value: "danger", label: "Danger", icon: ShieldAlert, cls: "border-destructive/50 bg-destructive/5" },
];

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
    <div className="space-y-1">
      {blocks.length === 0 && (
        <p className="text-sm text-muted-foreground italic px-2 py-4 text-center">
          No blocks yet — add the first block below.
        </p>
      )}

      <InsertBar onAdd={(t) => add(t, 0)} hint="Insert at top" subtle />

      {blocks.map((block, i) => (
        <div key={block.id}>
          <div className="rounded-md border border-border bg-card">
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
          <InsertBar onAdd={(t) => add(t, i + 1)} subtle />
        </div>
      ))}

      <InsertBar onAdd={(t) => add(t)} hint="Add block" />
    </div>
  );
}

function InsertBar({
  onAdd,
  hint,
  subtle,
}: {
  onAdd: (t: BlockType) => void;
  hint?: string;
  subtle?: boolean;
}) {
  const [open, setOpen] = useState(!subtle);
  const types: BlockType[] = [
    "heading", "paragraph", "list", "image", "video", "table", "callout", "code", "divider",
  ];
  if (subtle && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative w-full h-2 my-0.5 flex items-center justify-center"
        title="Insert block here"
      >
        <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-[10px] text-muted-foreground bg-card border border-dashed border-border rounded px-1.5 py-0.5">
          <Plus className="h-2.5 w-2.5" /> Insert here
        </span>
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-dashed border-border p-2 my-1">
      <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
        <Plus className="h-3 w-3" /> {hint ?? "Insert"}:
      </span>
      {types.map((t) => (
        <button
          key={t}
          onClick={() => {
            onAdd(t);
            if (subtle) setOpen(false);
          }}
          className="rounded border border-border bg-background px-2 py-0.5 text-xs hover:bg-muted"
        >
          {BLOCK_TYPE_LABELS[t]}
        </button>
      ))}
      {subtle && (
        <button
          onClick={() => setOpen(false)}
          className="ml-auto text-[11px] text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      )}
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
            className={cn(
              inputCls,
              block.level === 1 && "text-lg font-semibold",
              block.level === 2 && "text-base font-semibold",
            )}
          />
        </div>
      );
    case "paragraph":
      return <ParagraphEditor block={block} onChange={onChange} />;
    case "list":
      return <ListEditor block={block} onChange={onChange} />;
    case "image":
      return <ImageEditor block={block} onChange={onChange} />;
    case "video":
      return <VideoEditor block={block} onChange={onChange} />;
    case "table":
      return <TableEditor block={block} onChange={onChange} />;
    case "callout":
      return <CalloutEditor block={block} onChange={onChange} />;
    case "code":
      return (
        <div className="space-y-1">
          <select
            value={block.language ?? ""}
            onChange={(e) => onChange({ ...block, language: e.target.value })}
            className="rounded border border-input bg-background px-2 py-1 text-xs"
          >
            {CODE_LANGS.map((l) => (
              <option key={l} value={l}>{l || "(no language)"}</option>
            ))}
          </select>
          <AutoTextarea
            value={block.code}
            onChange={(e) => onChange({ ...block, code: e.target.value })}
            placeholder="Code"
            minRows={4}
            className="font-mono-tech text-xs"
          />
        </div>
      );
    case "divider":
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <hr className="flex-1 border-border" />
          <span>Divider</span>
          <hr className="flex-1 border-border" />
        </div>
      );
  }
}

function ParagraphEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "paragraph" }>;
  onChange: (b: Block) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  return (
    <div className="rounded border border-input bg-background overflow-hidden">
      <InlineToolbar
        fieldRef={ref}
        value={block.text}
        onChange={(text) => onChange({ ...block, text })}
      />
      <AutoTextarea
        ref={ref}
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        onKeyDown={(e) => inlineKeydown(e, block.text, (text) => onChange({ ...block, text }))}
        placeholder="Paragraph text…"
        minRows={3}
        className="border-0 focus:ring-0"
      />
    </div>
  );
}

function ListEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "list" }>;
  onChange: (b: Block) => void;
}) {
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
          <span className="text-xs text-muted-foreground pt-1.5 w-4 text-right">
            {block.ordered ? `${i + 1}.` : "•"}
          </span>
          <input
            value={it}
            onChange={(e) => {
              const items = block.items.slice();
              items[i] = e.target.value;
              onChange({ ...block, items });
            }}
            onKeyDown={(e) => inlineKeydown(e, it, (v) => {
              const items = block.items.slice();
              items[i] = v;
              onChange({ ...block, items });
            })}
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
}

function ImageEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "image" }>;
  onChange: (b: Block) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `articles/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("button-icons")
        .upload(path, file, { upsert: false, cacheControl: "31536000" });
      if (error) throw error;
      const { data } = supabase.storage.from("button-icons").getPublicUrl(path);
      onChange({ ...block, url: data.publicUrl });
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <input
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder="Image URL (https://…)"
          className={inputCls}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 rounded border border-border px-2 text-xs hover:bg-muted disabled:opacity-60"
          title="Upload image"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          Upload
        </button>
      </div>
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
      {block.url && (
        <img
          src={block.url}
          alt={block.alt ?? ""}
          className="mt-1 max-h-40 rounded border border-border"
        />
      )}
    </div>
  );
}

function youtubeEmbed(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function vimeoEmbed(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

function VideoEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "video" }>;
  onChange: (b: Block) => void;
}) {
  const embed = block.url ? (youtubeEmbed(block.url) ?? vimeoEmbed(block.url)) : null;
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
      {embed ? (
        <div className="aspect-video w-full max-w-md overflow-hidden rounded border border-border">
          <iframe src={embed} className="h-full w-full" allowFullScreen />
        </div>
      ) : block.url ? (
        <video src={block.url} controls className="max-h-40 rounded border border-border" />
      ) : null}
    </div>
  );
}

function TableEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "table" }>;
  onChange: (b: Block) => void;
}) {
  function setHeader(ci: number, v: string) {
    const headers = block.headers.slice();
    headers[ci] = v;
    onChange({ ...block, headers });
  }
  function setCell(ri: number, ci: number, v: string) {
    const rows = block.rows.map((r) => r.slice());
    rows[ri][ci] = v;
    onChange({ ...block, rows });
  }
  function addCol(at?: number) {
    const idx = at ?? block.headers.length;
    const headers = block.headers.slice();
    headers.splice(idx, 0, `Column ${headers.length + 1}`);
    const rows = block.rows.map((r) => {
      const nr = r.slice();
      nr.splice(idx, 0, "");
      return nr;
    });
    onChange({ ...block, headers, rows });
  }
  function removeCol(ci: number) {
    if (block.headers.length <= 1) return;
    const headers = block.headers.filter((_, i) => i !== ci);
    const rows = block.rows.map((r) => r.filter((_, i) => i !== ci));
    onChange({ ...block, headers, rows });
  }
  function addRow(at?: number) {
    const idx = at ?? block.rows.length;
    const rows = block.rows.slice();
    rows.splice(idx, 0, block.headers.map(() => ""));
    onChange({ ...block, rows });
  }
  function removeRow(ri: number) {
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== ri) });
  }

  return (
    <div className="space-y-1 overflow-x-auto">
      <table className="text-sm border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-6" />
            {block.headers.map((h, ci) => (
              <th key={ci} className="min-w-[120px]">
                <div className="flex gap-0.5">
                  <input
                    value={h}
                    onChange={(e) => setHeader(ci, e.target.value)}
                    className={inputCls + " font-semibold"}
                    placeholder={`Col ${ci + 1}`}
                  />
                  <button
                    onClick={() => removeCol(ci)}
                    title="Remove column"
                    className="rounded border border-border px-1 text-xs hover:bg-destructive/10 hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              </th>
            ))}
            <th>
              <button
                onClick={() => addCol()}
                className="rounded border border-border px-2 py-1 text-xs hover:bg-muted whitespace-nowrap"
                title="Add column"
              >
                + Col
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri}>
              <td className="text-[10px] text-muted-foreground text-right pr-1 align-middle">{ri + 1}</td>
              {row.map((cell, ci) => (
                <td key={ci}>
                  <input
                    value={cell}
                    onChange={(e) => setCell(ri, ci, e.target.value)}
                    onKeyDown={(e) => inlineKeydown(e, cell, (v) => setCell(ri, ci, v))}
                    className={inputCls}
                  />
                </td>
              ))}
              <td>
                <button
                  onClick={() => removeRow(ri)}
                  title="Remove row"
                  className="rounded border border-border px-1 py-1 text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => addRow()}
        className="text-xs text-blueprint hover:underline"
      >
        + Add row
      </button>
    </div>
  );
}

function CalloutEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "callout" }>;
  onChange: (b: Block) => void;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const variant = calloutVariants.find((v) => v.value === block.variant) ?? calloutVariants[0];
  const Icon = variant.icon;
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {calloutVariants.map((v) => {
          const VIcon = v.icon;
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => onChange({ ...block, variant: v.value })}
              className={cn(
                "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs",
                v.cls,
                block.variant === v.value ? "ring-1 ring-ring" : "opacity-70 hover:opacity-100",
              )}
            >
              <VIcon className="h-3 w-3" /> {v.label}
            </button>
          );
        })}
      </div>
      <div className={cn("flex gap-2 rounded-md border p-2", variant.cls)}>
        <Icon className="h-4 w-4 mt-1 shrink-0" />
        <div className="flex-1 rounded border border-input bg-background overflow-hidden">
          <InlineToolbar
            fieldRef={ref}
            value={block.text}
            onChange={(text) => onChange({ ...block, text })}
          />
          <AutoTextarea
            ref={ref}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            onKeyDown={(e) => inlineKeydown(e, block.text, (text) => onChange({ ...block, text }))}
            placeholder="Callout text"
            minRows={2}
            className="border-0 focus:ring-0"
          />
        </div>
      </div>
    </div>
  );
}
