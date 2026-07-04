import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, GraduationCap, Loader2, Save, Plus, Trash2, ChevronUp, ChevronDown,
  Pencil, X, Upload, Box, Check, Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useTutorialBySlug, type TutorialModule, type TutorialFull } from "@/hooks/useTutorials";
import { DocumentEditor } from "@/components/articles/DocumentEditor";
import type { Block } from "@/lib/article-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/tutorials/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Tutorial · ${params.slug}` }] }),
  component: TutorialEditorPage,
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

function TutorialEditorPage() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { data: tutorial, isLoading } = useTutorialBySlug(slug);

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
        <Link to="/learn/inventor" className="text-sm text-blueprint hover:underline">← Back to simulator</Link>
      </div>
    );
  }
  if (!tutorial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <h1 className="text-xl font-semibold">Tutorial not found</h1>
        <Link to="/admin/tutorials" className="text-sm text-blueprint hover:underline">← Back to tutorials</Link>
      </div>
    );
  }

  return <Editor key={tutorial.id} tutorial={tutorial} />;
}

function Editor({ tutorial }: { tutorial: TutorialFull }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(tutorial.title);
  const [summary, setSummary] = useState(tutorial.summary);
  const [thumbnailUrl, setThumbnailUrl] = useState(tutorial.thumbnailUrl ?? "");
  const [published, setPublished] = useState(tutorial.published);
  const [openModuleId, setOpenModuleId] = useState<string | null>(tutorial.modules[0]?.id ?? null);

  const dirty =
    title !== tutorial.title ||
    summary !== tutorial.summary ||
    (thumbnailUrl || null) !== (tutorial.thumbnailUrl ?? null) ||
    published !== tutorial.published;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["tutorials"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tutorials")
        .update({
          title,
          summary,
          thumbnail_url: thumbnailUrl || null,
          published,
        })
        .eq("id", tutorial.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tutorial saved"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const addModule = useMutation({
    mutationFn: async (modTitle: string) => {
      const baseSlug = slugify(modTitle) || `module-${tutorial.modules.length + 1}`;
      const taken = new Set(tutorial.modules.map((m) => m.slug));
      let s = baseSlug;
      let i = 2;
      while (taken.has(s)) { s = `${baseSlug}-${i++}`; }
      const sort = (tutorial.modules.at(-1)?.sortOrder ?? 0) + 10;
      const { data, error } = await supabase
        .from("tutorial_modules")
        .insert({
          tutorial_id: tutorial.id,
          slug: s,
          title: modTitle,
          sort_order: sort,
          content: [],
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => { setOpenModuleId(id); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tutorial_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast.success("Module deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const reorderModule = useMutation({
    mutationFn: async ({ id, dir }: { id: string; dir: -1 | 1 }) => {
      const list = [...tutorial.modules].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = list.findIndex((m) => m.id === id);
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= list.length) return;
      const a = list[idx], b = list[swap];
      const { error: e1 } = await supabase.from("tutorial_modules").update({ sort_order: b.sortOrder }).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("tutorial_modules").update({ sort_order: a.sortOrder }).eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: () => refresh(),
    onError: (e) => toast.error((e as Error).message),
  });

  const [newModuleTitle, setNewModuleTitle] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin/tutorials" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="h-3 w-3" /> Tutorials
          </Link>
          <span className="text-sm font-semibold flex items-center gap-1.5 truncate">
            <GraduationCap className="h-4 w-4" /> <span className="truncate">{title || "(untitled)"}</span>
          </span>
          <code className="text-[11px] font-mono-tech text-muted-foreground hidden sm:inline truncate">/{tutorial.slug}</code>
          {dirty && (
            <span className="text-[10px] uppercase font-mono-tech rounded bg-amber-500/15 text-amber-600 px-1.5 py-0.5">Unsaved</span>
          )}
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !dirty}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Tutorial meta */}
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-base font-semibold" />
          </Field>
          <Field label="Summary">
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2}
              placeholder="One-sentence description shown on the tutorials grid."
              className="w-full rounded border border-input bg-background px-2 py-1 text-sm" />
          </Field>
          <AssetField label="Thumbnail" value={thumbnailUrl} onChange={setThumbnailUrl} accept="image/*" preview />
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            <span>Published <span className="text-xs text-muted-foreground">(visible to learners)</span></span>
          </label>
        </div>

        {/* Modules */}
        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border p-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Modules ({tutorial.modules.length})</h2>
          </div>
          <div className="p-3 flex gap-2 border-b border-border">
            <input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newModuleTitle.trim()) {
                  addModule.mutate(newModuleTitle.trim());
                  setNewModuleTitle("");
                }
              }}
              placeholder="New module title…"
              className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm"
            />
            <button
              onClick={() => {
                const t = newModuleTitle.trim();
                if (!t) return;
                addModule.mutate(t);
                setNewModuleTitle("");
              }}
              disabled={addModule.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Plus className="h-3 w-3" /> Add module
            </button>
          </div>
          {tutorial.modules.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center italic">No modules yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tutorial.modules.map((m, idx) => (
                <li key={m.id}>
                  <div className="p-3 flex items-center gap-2 hover:bg-muted/30">
                    <span className="text-xs font-mono-tech text-muted-foreground w-6 text-right">{idx + 1}.</span>
                    <button onClick={() => setOpenModuleId(openModuleId === m.id ? null : m.id)} className="flex-1 min-w-0 text-left">
                      <div className="font-medium text-sm truncate">{m.title}</div>
                      <div className="text-[11px] text-muted-foreground font-mono-tech truncate">
                        {m.slug} · {m.problemIds.length} problem{m.problemIds.length === 1 ? "" : "s"}
                      </div>
                    </button>
                    <button onClick={() => reorderModule.mutate({ id: m.id, dir: -1 })} disabled={idx === 0}
                      className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => reorderModule.mutate({ id: m.id, dir: 1 })} disabled={idx === tutorial.modules.length - 1}
                      className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setOpenModuleId(openModuleId === m.id ? null : m.id)}
                      className="p-1.5 rounded text-muted-foreground hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete module "${m.title}"?`)) deleteModule.mutate(m.id); }}
                      className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {openModuleId === m.id && <ModuleEditor module={m} onSaved={refresh} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleEditor({ module: m, onSaved }: { module: TutorialModule; onSaved: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(m.title);
  const [blocks, setBlocks] = useState<Block[]>(m.content);
  const [problemIds, setProblemIds] = useState<string[]>(m.problemIds);

  const dirty = useMemo(
    () =>
      title !== m.title ||
      JSON.stringify(blocks) !== JSON.stringify(m.content) ||
      JSON.stringify(problemIds) !== JSON.stringify(m.problemIds),
    [title, blocks, problemIds, m],
  );

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tutorial_modules")
        .update({ title, content: blocks as never })
        .eq("id", m.id);
      if (error) throw error;
      // Sync attached problems
      const { error: delErr } = await supabase
        .from("tutorial_module_problems").delete().eq("module_id", m.id);
      if (delErr) throw delErr;
      if (problemIds.length > 0) {
        const rows = problemIds.map((pid, i) => ({ module_id: m.id, problem_id: pid, sort_order: i * 10 }));
        const { error: insErr } = await supabase.from("tutorial_module_problems").insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      toast.success("Module saved");
      qc.invalidateQueries({ queryKey: ["tutorials"] });
      onSaved();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const doSave = useCallback(() => { if (dirty && !save.isPending) save.mutate(); }, [dirty, save]);

  return (
    <div className="bg-muted/20 border-t border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono-tech uppercase text-muted-foreground">Module editor</h3>
        <button
          onClick={doSave} disabled={!dirty || save.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save module
        </button>
      </div>
      <Field label="Module title">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm font-semibold" />
      </Field>
      <Field label="Content">
        <DocumentEditor blocks={blocks} onChange={setBlocks} />
      </Field>
      <Field label="Attached practice problems">
        <ProblemPicker selected={problemIds} onChange={setProblemIds} />
      </Field>
    </div>
  );
}

function ProblemPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: problems } = useQuery({
    queryKey: ["admin-practice-problems-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practice_problems")
        .select("id, slug, name, problem_type, level, thumbnail_url")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const byId = useMemo(() => new Map((problems ?? []).map((p) => [p.id, p])), [problems]);

  const move = (idx: number, dir: -1 | 1) => {
    const swap = idx + dir;
    if (swap < 0 || swap >= selected.length) return;
    const next = [...selected];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (problems ?? []).filter((p) => {
      if (selected.includes(p.id)) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [problems, search, selected]);

  return (
    <div className="space-y-2">
      {selected.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No problems attached.</p>
      ) : (
        <ul className="space-y-1.5">
          {selected.map((id, idx) => {
            const p = byId.get(id);
            return (
              <li key={id} className="flex items-center gap-2 rounded border border-border bg-background p-2">
                <span className="text-xs font-mono-tech text-muted-foreground w-5 text-right">{idx + 1}.</span>
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {p?.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="w-full h-full object-contain" /> : <Box className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{p?.name ?? "(deleted)"}</div>
                  <div className="text-[10px] text-muted-foreground font-mono-tech truncate">{p?.problem_type} · {p?.level}</div>
                </div>
                <button onClick={() => move(idx, -1)} disabled={idx === 0}
                  className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => move(idx, 1)} disabled={idx === selected.length - 1}
                  className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button onClick={() => onChange(selected.filter((x) => x !== id))}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
              </li>
            );
          })}
        </ul>
      )}
      <div>
        <button onClick={() => setPickerOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs hover:bg-muted">
          <Plus className="h-3 w-3" /> {pickerOpen ? "Close picker" : "Attach problem"}
        </button>
      </div>
      {pickerOpen && (
        <div className="rounded border border-border bg-background">
          <div className="p-2 border-b border-border flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          </div>
          <ul className="max-h-64 overflow-auto divide-y divide-border">
            {filtered.length === 0 ? (
              <li className="p-3 text-xs text-muted-foreground italic text-center">No matches.</li>
            ) : filtered.map((p) => (
              <li key={p.id}>
                <button onClick={() => onChange([...selected, p.id])}
                  className="w-full text-left p-2 flex items-center gap-2 hover:bg-muted/30">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="w-full h-full object-contain" /> : <Box className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono-tech truncate">{p.problem_type} · {p.level}</div>
                  </div>
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function AssetField({
  label, value, onChange, accept, preview,
}: { label: string; value: string; onChange: (v: string) => void; accept?: string; preview?: boolean }) {
  const [uploading, setUploading] = useState(false);
  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `tutorials/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("article-assets").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("article-assets").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <Field label={label}>
      <div className="flex items-start gap-3">
        {preview && value && (
          <img src={value} alt="" className="w-16 h-16 object-contain rounded border border-border bg-muted" />
        )}
        <div className="flex-1 space-y-1">
          <div className="flex gap-2">
            <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload below"
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm font-mono-tech" />
            {value && (
              <button type="button" onClick={() => onChange("")}
                className="p-1.5 rounded border border-border text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
          <label className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs cursor-pointer hover:bg-muted">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Upload file
            <input type="file" accept={accept} className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = "";
            }} />
          </label>
        </div>
      </div>
    </Field>
  );
}
