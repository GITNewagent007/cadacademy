import { useMemo, useState } from "react";
import { Search, Loader2, Clock, Layers, ChevronLeft, Download, FileText, BookOpen, Check, Circle } from "lucide-react";
import { usePracticeProblems, usePracticeProblem, type PracticeProblem } from "@/hooks/usePracticeProblems";
import { usePracticeTaxonomy, filterTaxonomy } from "@/hooks/usePracticeTaxonomy";
import { usePracticeProgress, useTogglePracticeComplete } from "@/hooks/usePracticeProgress";
import { fireConfetti } from "@/lib/confetti";
import { useAuth } from "@/hooks/useAuth";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";
import { cn, formatDuration } from "@/lib/utils";
import { PdfViewer } from "./PdfViewer";

function levelColor(level: string) {
  const l = level.toLowerCase();
  if (l === "beginner" || l === "easy") return "bg-blue-100 text-blue-700";
  if (l === "intermediate" || l === "medium") return "bg-yellow-100 text-yellow-700";
  if (l === "hard") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

export function PracticeBrowser() {
  const { data: list, isLoading } = usePracticeProblems("inventor");
  const { data: completed } = usePracticeProgress();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [collectionFilter, setCollectionFilter] = useState<string>("All");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const items = list ?? [];
  const completedSet = completed ?? new Set<string>();

  const { data: taxonomy } = usePracticeTaxonomy("inventor");
  const sponsorMap = useMemo(() => {
    const m = new Map<string, { label: string; logoUrl: string | null }>();
    (taxonomy ?? []).filter((t) => t.kind === "sponsor").forEach((t) => m.set(t.label, { label: t.label, logoUrl: t.logoUrl }));
    return m;
  }, [taxonomy]);

  const taxLevels = filterTaxonomy(taxonomy, "level").map((t) => t.label);
  const taxTypes = filterTaxonomy(taxonomy, "problem_type").map((t) => t.label);
  const taxCollections = filterTaxonomy(taxonomy, "collection").map((t) => t.label);
  const usedLevels = Array.from(new Set(items.map((i) => i.level)));
  const usedTypes = Array.from(new Set(items.map((i) => i.problemType)));
  const usedCollections = Array.from(new Set(items.map((i) => i.collection).filter((c): c is string => !!c)));
  const levels = useMemo(
    () => [...taxLevels.filter((l) => usedLevels.includes(l)), ...usedLevels.filter((l) => !taxLevels.includes(l))],
    [taxLevels, usedLevels],
  );
  const types = useMemo(
    () => [...taxTypes.filter((t) => usedTypes.includes(t)), ...usedTypes.filter((t) => !taxTypes.includes(t))],
    [taxTypes, usedTypes],
  );
  const collections = useMemo(
    () => [...taxCollections.filter((c) => usedCollections.includes(c)), ...usedCollections.filter((c) => !taxCollections.includes(c))],
    [taxCollections, usedCollections],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (levelFilter !== "All" && p.level !== levelFilter) return false;
      if (typeFilter !== "All" && p.problemType !== typeFilter) return false;
      if (collectionFilter !== "All" && p.collection !== collectionFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.summary.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, levelFilter, typeFilter, collectionFilter]);

  // Group by problem type sections, ordered by taxonomy order
  const grouped = useMemo(() => {
    const typeOrder = new Map(taxTypes.map((t, i) => [t, i]));
    const levelOrder = new Map(taxLevels.map((l, i) => [l, i]));
    const collectionOrder = new Map(taxCollections.map((c, i) => [c, i]));
    const rank = (map: Map<string, number>, key: string | null | undefined) =>
      key && map.has(key) ? map.get(key)! : Number.MAX_SAFE_INTEGER;

    const map = new Map<string, PracticeProblem[]>();
    for (const p of filtered) {
      if (!map.has(p.problemType)) map.set(p.problemType, []);
      map.get(p.problemType)!.push(p);
    }
    for (const probs of map.values()) {
      probs.sort((a, b) => {
        const l = rank(levelOrder, a.level) - rank(levelOrder, b.level);
        if (l !== 0) return l;
        const c = rank(collectionOrder, a.collection) - rank(collectionOrder, b.collection);
        if (c !== 0) return c;
        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
      });
    }
    return Array.from(map.entries()).sort(
      ([a], [b]) => rank(typeOrder, a) - rank(typeOrder, b),
    );
  }, [filtered, taxTypes, taxLevels, taxCollections]);

  if (selectedSlug) {
    return <PracticeDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} />;
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Practice Problems{" "}
              <span className="text-slate-400 font-normal">({items.length} items)</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse a library of Inventor practice models. Pick one to view instructions, drawing, and reference model.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search practice problems…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blueprint focus:border-blueprint"
            />
          </div>
          <FilterSelect label="Level" value={levelFilter} onChange={setLevelFilter} options={["All", ...levels]} />
          <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={["All", ...types]} />
          <FilterSelect label="Collection" value={collectionFilter} onChange={setCollectionFilter} options={["All", ...collections]} />
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="mt-12 flex items-center justify-center text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading practice problems…
          </div>
        ) : items.length === 0 ? (
          <div className="mt-16 text-center text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No practice problems yet.</p>
            <p className="text-xs text-slate-400 mt-1">Admins can add them in the Practice admin.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center text-slate-500 text-sm">No matches for your filters.</div>
        ) : (
          <div className="mt-6 space-y-8">
            {grouped.map(([section, probs]) => (
              <section key={section}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-2 py-0.5 bg-slate-100 rounded">
                    {section}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {probs.length} problem{probs.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {probs.map((p) => (
                    <ProblemCard key={p.id} problem={p} sponsor={p.sponsor ? sponsorMap.get(p.sponsor) ?? { label: p.sponsor, logoUrl: null } : null} completed={completedSet.has(p.id)} onClick={() => setSelectedSlug(p.slug)} />
                  ))}

                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-600">
      <span className="text-slate-500">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blueprint"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProblemCard({ problem, onClick, completed, sponsor }: { problem: PracticeProblem; onClick: () => void; completed?: boolean; sponsor?: { label: string; logoUrl: string | null } | null }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left rounded-lg border transition overflow-hidden flex relative",
        completed
          ? "bg-emerald-50 border-emerald-200 hover:shadow-md hover:bg-emerald-100"
          : "border-slate-200 bg-white hover:shadow-md hover:border-blueprint/40"
      )}
    >
      <div className="w-24 shrink-0 bg-slate-50 flex items-center justify-center border-r border-slate-100">
        {problem.thumbnailUrl ? (
          <img
            src={problem.thumbnailUrl}
            alt={problem.name}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <Layers className="h-8 w-8 text-slate-300" />
        )}
      </div>
      <div className="flex-1 p-3 min-w-0">
        <div className="text-[11px] text-blueprint font-medium truncate">{problem.problemType}</div>
        <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-blueprint">
          {problem.name}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", levelColor(problem.level))}>
            {problem.level}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" /> {formatDuration(problem.durationMinutes)}
          </span>
          {problem.collection && (
            <span className="text-[10px] text-slate-500 uppercase whitespace-nowrap truncate">{problem.collection}</span>
          )}
        </div>
        {sponsor && (
          <div className="mt-2 flex items-center gap-1.5">
            {sponsor.logoUrl ? (
              <img src={sponsor.logoUrl} alt={sponsor.label} className="h-4 max-w-[60px] object-contain" />
            ) : null}
            <span className="text-[11px] text-slate-600 truncate">{sponsor.label}</span>
          </div>
        )}
      </div>
    </button>
  );
}


export function PracticeDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { data: problem, isLoading } = usePracticeProblem(slug);
  const { data: taxonomy } = usePracticeTaxonomy("inventor");
  const { user } = useAuth();
  const { data: completed } = usePracticeProgress();
  const toggle = useTogglePracticeComplete();
  const isComplete = !!(problem && completed?.has(problem.id));
  const sponsor = problem?.sponsor
    ? (taxonomy ?? []).find((t) => t.kind === "sponsor" && t.label === problem.sponsor) ?? null
    : null;


  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  if (!problem) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500">
        <p>Practice problem not found.</p>
        <button onClick={onBack} className="text-blueprint text-sm hover:underline">
          ← Back to list
        </button>
      </div>
    );
  }

  return (
    <div data-confetti-root className="h-full overflow-auto bg-white relative">

      <div className="max-w-5xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to practice problems
        </button>

        <div className="grid md:grid-cols-[280px_1fr] gap-6 items-start">
          <div className="rounded-lg border border-slate-200 bg-slate-50 aspect-square flex items-center justify-center overflow-hidden">
            {problem.thumbnailUrl ? (
              <img src={problem.thumbnailUrl} alt={problem.name} className="w-full h-full object-contain p-4" />
            ) : (
              <Layers className="h-16 w-16 text-slate-300" />
            )}
          </div>

          <div>
            <div className="text-xs text-blueprint font-medium">{problem.problemType}</div>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">{problem.name}</h1>
            {problem.summary && <p className="mt-2 text-slate-600">{problem.summary}</p>}

            {sponsor && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Sponsored by</span>
                {sponsor.logoUrl && (
                  <img src={sponsor.logoUrl} alt={sponsor.label} className="h-5 max-w-[90px] object-contain" />
                )}
                <span className="text-sm font-medium text-slate-800">{sponsor.label}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              <span className={cn("text-xs font-medium px-2 py-1 rounded-full", levelColor(problem.level))}>
                {problem.level}
              </span>

              <span className="flex items-center gap-1 text-xs text-slate-600 px-2 py-1 rounded-full bg-slate-100">
                <Clock className="h-3 w-3" /> {formatDuration(problem.durationMinutes)}
              </span>
              {problem.certification && (
                <span className="text-xs text-slate-600 px-2 py-1 rounded-full bg-slate-100">
                  {problem.certification}
                </span>
              )}
              {problem.featuresUsed.map((f) => (
                <span key={f} className="text-xs text-slate-600 px-2 py-1 rounded-full bg-slate-100">
                  {f}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 items-center">
              {problem.modelUrl && (
                <a
                  href={problem.modelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Reference model
                </a>
              )}
              {user ? (
                <button
                  onClick={() => {
                    const next = !isComplete;
                    if (next) fireConfetti();
                    toggle.mutate({ problemId: problem.id, completed: next });
                  }}
                  disabled={toggle.isPending}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition",
                    isComplete
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-blueprint text-white hover:bg-blueprint/90",
                  )}
                >
                  {toggle.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  {isComplete ? "Completed — undo" : "Mark as complete"}
                </button>
              ) : (
                <span className="text-xs text-slate-500 italic">Sign in to track completion.</span>
              )}
            </div>
          </div>
        </div>

        {problem.drawingUrl && <DrawingViewer url={problem.drawingUrl} />}


        <div className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-blueprint" /> Instructions
          </h2>
          {problem.instructions.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No instructions yet.</p>
          ) : (
            <ArticleRenderer
              article={{
                id: problem.id,
                slug: problem.slug,
                title: problem.name,
                summary: problem.summary,
                content: problem.instructions,
                sourceKind: "blocks",
                html: "",
                sourceFilePath: null,
                sourceFileName: null,
                sourceUploadedAt: null,
                imageOverrides: {},
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DrawingViewer({ url }: { url: string }) {
  const lower = url.split("?")[0].toLowerCase();
  const isPdf = lower.endsWith(".pdf");
  const isImage = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(lower);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blueprint" /> Drawing
        </h2>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blueprint hover:underline"
        >
          Open in new tab for more fidelity ↗
        </a>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
        {isPdf ? (
          <PdfViewer url={url} />
        ) : isImage ? (
          <img src={url} alt="Drawing" className="w-full h-auto" />
        ) : (
          <iframe
            src={url}
            title="Drawing"
            className="w-full"
            style={{ height: "min(80vh, 900px)" }}
          />
        )}
      </div>
    </section>
  );
}

