import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { ChevronLeft, Check, Circle, Loader2 } from "lucide-react";
import { useTutorialBySlug } from "@/hooks/useTutorials";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/inventor/tutorials/library/$tutorialSlug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.tutorialSlug.replace(/-/g, " ")} — Tutorial` },
      { property: "og:url", content: `https://cadacademy.app/learn/inventor/tutorials/library/${params.tutorialSlug}` },
    ],
    links: [
      { rel: "canonical", href: `https://cadacademy.app/learn/inventor/tutorials/library/${params.tutorialSlug}` },
    ],
  }),
  component: TutorialLayout,
});

function TutorialLayout() {
  const { tutorialSlug } = Route.useParams();
  const inner = useParams({ strict: false }) as { moduleSlug?: string };
  const activeModuleSlug = inner.moduleSlug ?? null;
  const { data: tutorial, isLoading } = useTutorialBySlug(tutorialSlug);
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
        <Link to="/learn/inventor/tutorials/library" className="text-blueprint text-sm hover:underline">
          ← Back
        </Link>
      </div>
    );
  }

  const modules = tutorial.modules;
  const completedSet = completed ?? new Set<string>();
  const completedCount = modules.filter((m) => completedSet.has(m.id)).length;
  const pct = modules.length === 0 ? 0 : Math.round((completedCount / modules.length) * 100);

  return (
    <div className="h-full flex bg-white min-h-0">
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <Link
            to="/learn/inventor/tutorials/library"
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
              const isActive = activeModuleSlug === m.slug;
              const done = completedSet.has(m.id);
              return (
                <Link
                  key={m.id}
                  to="/learn/inventor/tutorials/library/$tutorialSlug/$moduleSlug"
                  params={{ tutorialSlug, moduleSlug: m.slug }}
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
