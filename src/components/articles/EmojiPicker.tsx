import { useEffect, useRef, useState } from "react";
import { Loader2, Smile, Trash2, Upload } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Emoji = { id: string; name: string; url: string };

export function EmojiPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_emojis")
      .select("id,name,url")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setEmojis((data ?? []) as Emoji[]);
    setLoading(false);
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  function insert(e: Emoji) {
    editor
      .chain()
      .focus()
      .insertContent({ type: "emoji", attrs: { src: e.url, name: e.name } })
      .run();
    setOpen(false);
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const baseName = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 32) || "emoji";
      const ext = file.name.split(".").pop() || "png";
      const path = `emojis/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("article-assets")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("article-assets").getPublicUrl(path);
      // Ensure unique name
      let name = baseName;
      let i = 2;
      while (emojis.some((e) => e.name === name)) name = `${baseName}-${i++}`;
      const { error: insErr } = await supabase
        .from("custom_emojis")
        .insert({ name, url: pub.publicUrl });
      if (insErr) throw insErr;
      toast.success(`Emoji :${name}: added`);
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(e: Emoji) {
    if (!window.confirm(`Delete emoji :${e.name}:?`)) return;
    const { error } = await supabase.from("custom_emojis").delete().eq("id", e.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmojis((prev) => prev.filter((x) => x.id !== e.id));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          title="Insert custom emoji"
          className={cn(
            "inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs text-foreground hover:bg-muted",
          )}
        >
          <Smile className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Custom emojis</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Upload
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : emojis.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No emojis yet. Upload one to get started.
          </p>
        ) : (
          <div className="grid grid-cols-6 gap-1 max-h-56 overflow-y-auto">
            {emojis.map((e) => (
              <div key={e.id} className="group relative">
                <button
                  type="button"
                  onClick={() => insert(e)}
                  title={`:${e.name}:`}
                  className="flex h-10 w-full items-center justify-center rounded hover:bg-muted"
                >
                  <img src={e.url} alt={e.name} className="h-6 w-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(e)}
                  title="Delete emoji"
                  className="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (f) upload(f);
            ev.target.value = "";
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
