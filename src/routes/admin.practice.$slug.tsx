import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Box, Loader2, Save, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { usePracticeProblem, type PracticeProblem } from "@/hooks/usePracticeProblems";
import { DocumentEditor } from "@/components/articles/DocumentEditor";
import type { Block } from "@/lib/article-types";
import { toast } from "sonner";
import { usePracticeTaxonomy, filterTaxonomy } from "@/hooks/usePracticeTaxonomy";

export const Route = createFileRoute("/admin/practice/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Practice · ${params.slug}` }] }),
  component: PracticeEditorPage,
});

function PracticeEditorPage() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { data: problem, isLoading } = usePracticeProblem(slug);

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
  if (!problem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <h1 className="text-xl font-semibold">Practice problem not found</h1>
        <Link to="/admin/practice" className="text-sm text-blueprint hover:underline">← Back to list</Link>
      </div>
    );
  }
  return <Editor key={problem.id} initial={problem} />;
}

function Editor({ initial }: { initial: PracticeProblem }) {
  const qc = useQueryClient();
  const { data: taxonomy } = usePracticeTaxonomy("inventor");
  const levelOptions = filterTaxonomy(taxonomy, "level").map((t) => t.label);
  const typeOptions = filterTaxonomy(taxonomy, "problem_type").map((t) => t.label);
  const featureOptions = filterTaxonomy(taxonomy, "feature").map((t) => t.label);
  const collectionOptions = filterTaxonomy(taxonomy, "collection").map((t) => t.label);
  const sponsorOptions = filterTaxonomy(taxonomy, "sponsor").map((t) => t.label);
  const [name, setName] = useState(initial.name);
  const [summary, setSummary] = useState(initial.summary);
  const [problemType, setProblemType] = useState(initial.problemType);
  const [level, setLevel] = useState(initial.level);
  const [collection, setCollection] = useState(initial.collection ?? "");
  const [sponsor, setSponsor] = useState(initial.sponsor ?? "");
  const [duration, setDuration] = useState(initial.durationMinutes);
  const [features, setFeatures] = useState<string[]>(initial.featuresUsed);
  const [certification, setCertification] = useState(initial.certification ?? "");
  const [sortOrder, setSortOrder] = useState(initial.sortOrder);
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? "");
  const [drawingUrl, setDrawingUrl] = useState(initial.drawingUrl ?? "");
  const [modelUrl, setModelUrl] = useState(initial.modelUrl ?? "");
  const [blocks, setBlocks] = useState<Block[]>(initial.instructions);


  const dirty = useMemo(
    () =>
      name !== initial.name ||
      summary !== initial.summary ||
      problemType !== initial.problemType ||
      level !== initial.level ||
      collection !== (initial.collection ?? "") ||
      sponsor !== (initial.sponsor ?? "") ||
      duration !== initial.durationMinutes ||
      JSON.stringify([...features].sort()) !== JSON.stringify([...initial.featuresUsed].sort()) ||
      certification !== (initial.certification ?? "") ||
      sortOrder !== initial.sortOrder ||
      thumbnailUrl !== (initial.thumbnailUrl ?? "") ||
      drawingUrl !== (initial.drawingUrl ?? "") ||
      modelUrl !== (initial.modelUrl ?? "") ||
      JSON.stringify(blocks) !== JSON.stringify(initial.instructions),
    [name, summary, problemType, level, collection, sponsor, duration, features, certification, sortOrder, thumbnailUrl, drawingUrl, modelUrl, blocks, initial],
  );


  const save = useMutation({
    mutationFn: async () => {
      // Preserve taxonomy order for features
      const orderedFeatures = featureOptions.filter((f) => features.includes(f));
      // Include any custom (non-taxonomy) features at the end so nothing is lost
      const extras = features.filter((f) => !featureOptions.includes(f));
      const { error } = await supabase
        .from("practice_problems")
        .update({
          name,
          summary,
          problem_type: problemType,
          level,
          collection: collection || null,
          duration_minutes: duration,
          features_used: [...orderedFeatures, ...extras],
          certification: certification || null,
          sort_order: sortOrder,
          thumbnail_url: thumbnailUrl || null,
          drawing_url: drawingUrl || null,
          model_url: modelUrl || null,
          instructions: blocks as never,
        })
        .eq("id", initial.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Practice problem saved");
      qc.invalidateQueries({ queryKey: ["practice-problems"] });
      qc.invalidateQueries({ queryKey: ["admin-practice-problems"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const doSave = useCallback(() => {
    if (!dirty || save.isPending) return;
    save.mutate();
  }, [dirty, save]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        doSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSave]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin/practice" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Practice problems
          </Link>
          <span className="text-sm font-semibold flex items-center gap-1.5 truncate">
            <Box className="h-4 w-4" /> <span className="truncate">{name || "(untitled)"}</span>
          </span>
          {dirty && (
            <span className="text-[10px] uppercase font-mono-tech rounded bg-amber-500/15 text-amber-600 px-1.5 py-0.5">
              Unsaved
            </span>
          )}
        </div>
        <button
          onClick={doSave}
          disabled={save.isPending || !dirty}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Metadata */}
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Details</h2>
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-base font-semibold"
            />
          </Field>
          <Field label="Summary">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Problem type">
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              >
                <option value="">— Select —</option>
                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                {problemType && !typeOptions.includes(problemType) && (
                  <option value={problemType}>{problemType} (custom)</option>
                )}
              </select>
            </Field>
            <Field label="Level">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              >
                <option value="">— Select —</option>
                {levelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                {level && !levelOptions.includes(level) && (
                  <option value={level}>{level} (custom)</option>
                )}
              </select>
            </Field>
            <Field label="Collection">
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              >
                <option value="">— None —</option>
                {collectionOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                {collection && !collectionOptions.includes(collection) && (
                  <option value={collection}>{collection} (custom)</option>
                )}
              </select>
            </Field>
            <Field label="Duration">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={Math.floor(duration / 60)}
                  onChange={(e) => {
                    const h = parseInt(e.target.value) || 0;
                    setDuration(h * 60 + (duration % 60));
                  }}
                  className="w-20 rounded border border-input bg-background px-2 py-1 text-sm"
                />
                <span className="text-xs text-muted-foreground">h</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={duration % 60}
                  onChange={(e) => {
                    let m = parseInt(e.target.value) || 0;
                    if (m > 59) m = 59;
                    setDuration(Math.floor(duration / 60) * 60 + m);
                  }}
                  className="w-20 rounded border border-input bg-background px-2 py-1 text-sm"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              />
            </Field>
          </div>
          <Field label="Features used">
            <FeatureCheckboxes
              options={featureOptions}
              selected={features}
              onToggle={(f) =>
                setFeatures((cur) =>
                  cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f],
                )
              }
              extras={features.filter((f) => !featureOptions.includes(f))}
              onRemoveExtra={(f) => setFeatures((cur) => cur.filter((x) => x !== f))}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Manage the master list at{" "}
              <Link to="/admin/practice/taxonomy" className="text-blueprint hover:underline">
                Practice Taxonomy
              </Link>
              .
            </p>
          </Field>
          <Field label="Certification (optional)">
            <input
              value={certification}
              onChange={(e) => setCertification(e.target.value)}
              placeholder="CSWA"
              className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
            />
          </Field>
        </div>

        {/* Assets */}
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Assets</h2>
          <AssetField label="Thumbnail image" value={thumbnailUrl} onChange={setThumbnailUrl} accept="image/*" preview />
          <AssetField label="Drawing (PDF, shown inline above instructions)" value={drawingUrl} onChange={setDrawingUrl} accept=".pdf,image/*" />
          <AssetField label="Reference model (IPT/STEP/etc.)" value={modelUrl} onChange={setModelUrl} accept="*" />
        </div>

        {/* Instructions */}
        <div className="rounded-md border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-semibold">Instructions</h2>
          <DocumentEditor blocks={blocks} onChange={setBlocks} />
        </div>
      </div>
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
  label,
  value,
  onChange,
  accept,
  preview,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accept?: string;
  preview?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `practice/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("article-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
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
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://… or upload below"
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm font-mono-tech"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-1.5 rounded border border-border text-muted-foreground hover:bg-muted"
                title="Clear"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <label className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs cursor-pointer hover:bg-muted">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Upload file
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
    </Field>
  );
}

function FeatureCheckboxes({
  options,
  selected,
  onToggle,
  extras,
  onRemoveExtra,
}: {
  options: string[];
  selected: string[];
  onToggle: (f: string) => void;
  extras: string[];
  onRemoveExtra: (f: string) => void;
}) {
  if (options.length === 0 && extras.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No features in the catalog yet. Add some in Practice Taxonomy.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-1.5 rounded border border-border bg-background p-2.5">
        {options.map((f) => {
          const checked = selected.includes(f);
          return (
            <label key={f} className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(f)}
                className="h-3.5 w-3.5 rounded border-input"
              />
              <span className={checked ? "text-foreground" : "text-muted-foreground"}>{f}</span>
            </label>
          );
        })}
      </div>
      {extras.length > 0 && (
        <div className="text-[11px] text-muted-foreground">
          Legacy / off-catalog tags on this problem:
          <div className="mt-1 flex flex-wrap gap-1">
            {extras.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700">
                {f}
                <button
                  type="button"
                  onClick={() => onRemoveExtra(f)}
                  className="hover:text-destructive"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
