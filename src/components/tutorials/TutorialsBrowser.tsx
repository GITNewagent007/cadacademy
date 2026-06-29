import { Loader2, GraduationCap, ChevronLeft, Check, Circle, Box, Layers, Clock, FileText } from "lucide-react";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { useTutorials, useTutorialBySlug, type TutorialModule } from "@/hooks/useTutorials";
import { useTutorialProgress, useToggleModuleComplete } from "@/hooks/useTutorialProgress";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeProblems, type PracticeProblem } from "@/hooks/usePracticeProblems";
import { usePracticeProgress } from "@/hooks/usePracticeProgress";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";
import { fireConfetti } from "@/lib/confetti";
import { cn, formatDuration } from "@/lib/utils";

export function TutorialsList() {
  const { data: tutorials, isLoading } = useTutorials("inventor");

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blueprint" /> Tutorials
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Guided lessons divided into modules. Read each module and complete the attached practice problems.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-12 flex items-center justify-center text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading tutorials…
          </div>
        ) : !tutorials || tutorials.length === 0 ? (
          <div className="mt-16 text-center text-slate-500">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No tutorials published yet.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorials.map((t) => (
              <Link
                key={t.id}
                to="/learn/inventor/learn/tutorials/$slug"
                params={{ slug: t.slug }}
                className="group text-left rounded-lg border border-slate-200 bg-white hover:shadow-md hover:border-blueprint/40 transition overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-slate-50 flex items-center justify-center border-b border-slate-100">
                  {t.thumbnailUrl ? (
                    <img src={t.thumbnailUrl} alt={t.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <GraduationCap className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div className="p-3 flex-1">
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-blueprint">{t.title}</div>
                  {t.summary && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.summary}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">
                    {t.moduleCount} module{t.moduleCount === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Tutorial shell: module rail + Outlet for the active module reader. */
export function TutorialShell() {
  const { slug } = useParams({ from: "/learn/inventor/learn/tutorials/$slug" });
  const childParams = useParams({ strict: false }) as { moduleSlug?: string };
  const activeModuleSlug = childParams.moduleSlug;
  const { data: tutorial, isLoading } = useTutorialBySlug(slug);
  const { user } = useAuth();
  const { data: completed } = useTutorialProgress(tutorial?.id);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  if (!tutorial) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500">
        <p>Tutorial not found.</p>
        <Link to="/learn/inventor/learn/tutorials" className="text-blueprint text-sm hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  const modules = tutorial.modules;
  const completedSet = completed ?? new Set<string>();
  const completedCount = modules.filter((m) => completedSet.has(m.id)).length;
  const pct = modules.length === 0 ? 0 : Math.round((completedCount / modules.length) * 100);
  const effectiveModuleSlug = activeModuleSlug ?? modules[0]?.slug;

  return (
    <div className="h-full flex bg-white min-h-0">
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <Link
            to="/learn/inventor/learn/tutorials"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-2"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> All tutorials
          </Link>
          <h2 className="text-sm font-semibold text-slate-900">{tutorial.title}</h2>
          {tutorial.summary && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tutorial.summary}</p>}
          {user && modules.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>{completedCount} / {modules.length} complete</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blueprint transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-auto py-1">
          {modules.length === 0 ? (
            <p className="px-4 py-3 text-xs italic text-slate-400">No modules yet.</p>
          ) : (
            modules.map((m, idx) => {
              const isActive = effectiveModuleSlug === m.slug;
              const done = completedSet.has(m.id);
              return (
                <Link
                  key={m.id}
                  to="/learn/inventor/learn/tutorials/$slug/$moduleSlug"
                  params={{ slug: tutorial.slug, moduleSlug: m.slug }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 flex items-start gap-2.5 border-l-2 hover:bg-slate-50 transition",
                    isActive ? "bg-slate-50 border-l-blueprint" : "border-l-transparent",
                  )}
                >
                  <span className="mt-0.5">
                    {done ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-400 font-mono-tech">Module {idx + 1}</div>
                    <div className={cn("text-sm font-medium truncate", isActive ? "text-blueprint" : "text-slate-700")}>
                      {m.title}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </nav>
      </aside>

      <main data-confetti-root className="flex-1 overflow-auto min-w-0 relative">
        <Outlet />
      </main>
    </div>
  );
}

/** Renders a single module by slug; used by both the $slug index and $slug/$moduleSlug routes. */
export function ModuleReaderBySlug({ tutorialSlug, moduleSlug }: { tutorialSlug: string; moduleSlug?: string }) {
  const { data: tutorial, isLoading } = useTutorialBySlug(tutorialSlug);
  const { user } = useAuth();
  const { data: completed } = useTutorialProgress(tutorial?.id);
  const toggle = useToggleModuleComplete(tutorial?.id);
  const { data: allProblems } = usePracticeProblems("inventor");

  if (isLoading || !tutorial) {
    return null;
  }

  const modules = tutorial.modules;
  if (modules.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Add a module to get started.
      </div>
    );
  }

  const activeModule = (moduleSlug && modules.find((m) => m.slug === moduleSlug)) || modules[0];
  if (!activeModule) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Module not found.
      </div>
    );
  }
  const completedSet = completed ?? new Set<string>();

  return (
    <ModuleReader
      module={activeModule}
      tutorialTitle={tutorial.title}
      completed={completedSet.has(activeModule.id)}
      onToggleComplete={(next) => {
        if (next) fireConfetti();
        toggle.mutate({ moduleId: activeModule.id, completed: next });
      }}
      toggling={toggle.isPending}
      signedIn={!!user}
      allProblems={allProblems ?? []}
    />
  );
}

function ModuleReader({
  module: m,
  tutorialTitle,
  completed,
  onToggleComplete,
  toggling,
  signedIn,
  allProblems,
}: {
  module: TutorialModule;
  tutorialTitle: string;
  completed: boolean;
  onToggleComplete: (next: boolean) => void;
  toggling: boolean;
  signedIn: boolean;
  allProblems: PracticeProblem[];
}) {
  const { data: practiceCompleted } = usePracticeProgress();
  const attached = m.problemIds
    .map((id) => allProblems.find((p) => p.id === id))
    .filter((p): p is PracticeProblem => !!p);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="text-xs text-slate-400 font-mono-tech uppercase">{tutorialTitle}</div>
      <h1 className="text-2xl font-bold text-slate-900 mt-1">{m.title}</h1>

      <article className="mt-6 prose prose-slate max-w-none">
        {m.content.length === 0 ? (
          <p className="text-sm italic text-slate-400">No content yet.</p>
        ) : (
          <ArticleRenderer
            article={{
              id: m.id, slug: m.slug, title: m.title, summary: m.summary,
              content: m.content, sourceKind: "blocks", html: "",
              sourceFilePath: null, sourceFileName: null, sourceUploadedAt: null,
              imageOverrides: {},
            }}
          />
        )}
      </article>

      {attached.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-blueprint" /> Practice problems for this module
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attached.map((p) => {
              const done = practiceCompleted?.has(p.id);
              return (
                <Link
                  key={p.id}
                  to="/learn/inventor/learn/practice/$slug"
                  params={{ slug: p.slug }}
                  className="group text-left rounded-lg border border-slate-200 bg-white hover:shadow-md hover:border-blueprint/40 transition overflow-hidden flex relative"
                >
                  {done && (
                    <span
                      title="Completed"
                      className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-white shadow"
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="w-20 shrink-0 bg-slate-50 flex items-center justify-center border-r border-slate-100">
                    {p.thumbnailUrl ? (
                      <img src={p.thumbnailUrl} alt={p.name} className="w-full h-full object-contain p-2" loading="lazy" />
                    ) : (
                      <Layers className="h-7 w-7 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="text-[11px] text-blueprint font-medium truncate">{p.problemType}</div>
                    <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-blueprint">{p.name}</div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500">{p.level}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" /> {formatDuration(p.durationMinutes)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-10 border-t border-slate-200 pt-6 flex items-center justify-between flex-wrap gap-3">
        {signedIn ? (
          <button
            onClick={() => onToggleComplete(!completed)}
            disabled={toggling}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition",
              completed
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                : "bg-blueprint text-white hover:bg-blueprint/90",
            )}
          >
            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : completed ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            {completed ? "Module complete — undo" : "Mark module complete"}
          </button>
        ) : (
          <p className="text-sm text-slate-500 italic flex items-center gap-2">
            <Box className="h-4 w-4" /> Sign in to track your progress.
          </p>
        )}
      </div>
    </div>
  );
}
