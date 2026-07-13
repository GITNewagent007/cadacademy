import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2, Tags, ChevronUp, ChevronDown, Save, Upload, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { usePracticeTaxonomy, filterTaxonomy, type TaxonomyKind, type TaxonomyItem } from "@/hooks/usePracticeTaxonomy";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/practice/taxonomy")({
  head: () => ({ meta: [{ title: "Admin · Practice Taxonomy" }] }),
  component: TaxonomyPage,
});

function TaxonomyPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { data, isLoading } = usePracticeTaxonomy("inventor");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  if (authLoading || roleLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <Link to="/admin/practice" className="text-sm text-blueprint hover:underline">← Back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/practice" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Practice problems
          </Link>
          <h1 className="text-sm font-semibold flex items-center gap-1.5">
            <Tags className="h-4 w-4" /> Practice Taxonomy
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          Manage the standardized lists used by practice problems. Order here is the order shown everywhere (feature checkboxes, filter dropdowns).
        </p>
        <KindSection title="Features" kind="feature" items={filterTaxonomy(data, "feature")} />
        <KindSection title="Levels" kind="level" items={filterTaxonomy(data, "level")} />
        <KindSection title="Problem types" kind="problem_type" items={filterTaxonomy(data, "problem_type")} />
        <KindSection title="Collections" kind="collection" items={filterTaxonomy(data, "collection")} />
        <SponsorsSection items={filterTaxonomy(data, "sponsor")} />
      </div>
    </div>
  );
}

function KindSection({ title, kind, items }: { title: string; kind: TaxonomyKind; items: TaxonomyItem[] }) {
  const qc = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["practice-taxonomy"] });
  };

  const add = useMutation({
    mutationFn: async (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) throw new Error("Enter a label");
      const nextOrder = (items.at(-1)?.sortOrder ?? 0) + 1;
      const { error } = await supabase.from("practice_taxonomy").insert({
        kind,
        program_slug: "inventor",
        label: trimmed,
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNewLabel(""); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async (patch: { id: string; label?: string; sort_order?: number }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("practice_taxonomy").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("practice_taxonomy").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e) => toast.error((e as Error).message),
  });

  function move(idx: number, dir: -1 | 1) {
    const other = items[idx + dir];
    const cur = items[idx];
    if (!other || !cur) return;
    update.mutate({ id: cur.id, sort_order: other.sortOrder });
    update.mutate({ id: other.id, sort_order: cur.sortOrder });
  }

  return (
    <section className="rounded-md border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold">{title} <span className="text-muted-foreground font-normal">({items.length})</span></h2>

      <ul className="divide-y divide-border border border-border rounded">
        {items.length === 0 && (
          <li className="p-3 text-xs text-muted-foreground italic">No entries yet.</li>
        )}
        {items.map((it, idx) => {
          const draft = edits[it.id] ?? it.label;
          const dirty = draft !== it.label;
          return (
            <li key={it.id} className="flex items-center gap-2 p-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <span className="text-[10px] font-mono-tech text-muted-foreground w-6 text-right">{it.sortOrder}</span>
              <input
                value={draft}
                onChange={(e) => setEdits((m) => ({ ...m, [it.id]: e.target.value }))}
                className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm"
              />
              {dirty && (
                <button
                  type="button"
                  onClick={() => {
                    update.mutate({ id: it.id, label: draft.trim() });
                    setEdits((m) => { const c = { ...m }; delete c[it.id]; return c; });
                  }}
                  className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  <Save className="h-3 w-3" /> Save
                </button>
              )}
              <button
                type="button"
                onClick={() => { if (confirm(`Delete "${it.label}"?`)) remove.mutate(it.id); }}
                className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add.mutate(newLabel); }}
          placeholder={`Add ${title.toLowerCase().replace(/s$/, "")}…`}
          className="flex-1 rounded border border-input bg-background px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => add.mutate(newLabel)}
          disabled={add.isPending || !newLabel.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {add.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
      </div>
    </section>
  );
}

function SponsorsSection({ items }: { items: TaxonomyItem[] }) {
  const qc = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ["practice-taxonomy"] });

  const add = useMutation({
    mutationFn: async (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) throw new Error("Enter a sponsor name");
      const nextOrder = (items.at(-1)?.sortOrder ?? 0) + 1;
      const { error } = await supabase.from("practice_taxonomy").insert({
        kind: "sponsor",
        program_slug: "inventor",
        label: trimmed,
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNewLabel(""); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async (patch: { id: string; label?: string; sort_order?: number; logo_url?: string | null }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("practice_taxonomy").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("practice_taxonomy").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e) => toast.error((e as Error).message),
  });

  function move(idx: number, dir: -1 | 1) {
    const other = items[idx + dir];
    const cur = items[idx];
    if (!other || !cur) return;
    update.mutate({ id: cur.id, sort_order: other.sortOrder });
    update.mutate({ id: other.id, sort_order: cur.sortOrder });
  }

  return (
    <section className="rounded-md border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold">Sponsors <span className="text-muted-foreground font-normal">({items.length})</span></h2>
      <p className="text-xs text-muted-foreground">Upload a logo and give the sponsor a display name. Sponsors can then be assigned on individual practice problems.</p>

      <ul className="divide-y divide-border border border-border rounded">
        {items.length === 0 && (
          <li className="p-3 text-xs text-muted-foreground italic">No sponsors yet.</li>
        )}
        {items.map((it, idx) => {
          const draft = edits[it.id] ?? it.label;
          const dirty = draft !== it.label;
          return (
            <li key={it.id} className="flex items-center gap-3 p-2">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <SponsorLogo
                url={it.logoUrl}
                onChange={(url) => update.mutate({ id: it.id, logo_url: url })}
              />
              <input
                value={draft}
                onChange={(e) => setEdits((m) => ({ ...m, [it.id]: e.target.value }))}
                className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm"
              />
              {dirty && (
                <button
                  type="button"
                  onClick={() => {
                    update.mutate({ id: it.id, label: draft.trim() });
                    setEdits((m) => { const c = { ...m }; delete c[it.id]; return c; });
                  }}
                  className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  <Save className="h-3 w-3" /> Save
                </button>
              )}
              <button
                type="button"
                onClick={() => { if (confirm(`Delete sponsor "${it.label}"?`)) remove.mutate(it.id); }}
                className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add.mutate(newLabel); }}
          placeholder="Add sponsor name…"
          className="flex-1 rounded border border-input bg-background px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => add.mutate(newLabel)}
          disabled={add.isPending || !newLabel.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {add.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
      </div>
    </section>
  );
}

function SponsorLogo({ url, onChange }: { url: string | null; onChange: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `sponsors/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("article-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("article-assets").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Logo uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-12 rounded border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {url ? (
          <img src={url} alt="" className="w-full h-full object-contain p-1" />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <label className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] cursor-pointer hover:bg-muted">
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
        {url ? "Replace" : "Upload"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </label>
      {url && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1 rounded text-muted-foreground hover:bg-muted"
          title="Remove logo"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
