import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Check, Circle, Box, Layers, Clock, FileText } from "lucide-react";
import { useTutorialBySlug, type TutorialModule } from "@/hooks/useTutorials";
import { useTutorialProgress, useToggleModuleComplete } from "@/hooks/useTutorialProgress";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeProblems, type PracticeProblem } from "@/hooks/usePracticeProblems";
import { usePracticeProgress } from "@/hooks/usePracticeProgress";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";
import { fireConfetti } from "@/lib/confetti";
import { cn, formatDuration } from "@/lib/utils";

export const Route = createFileRoute("/learn/inventor/tutorials/library/$tutorialSlug/$moduleSlug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.moduleSlug.replace(/-/g, " ")} — Tutorial module` },
      {
        property: "og:url",
        content: `https://cadacademy.app/learn/inventor/tutorials/library/${params.tutorialSlug}/${params.moduleSlug}`,
      },
    ],
    links: [
      {
        rel: "canonical",
        href: `https://cadacademy.app/learn/inventor/tutorials/library/${params.tutorialSlug}/${params.moduleSlug}`,
      },
    ],
  }),
  component: ModulePage,
});

function ModulePage() {
  const { tutorialSlug, moduleSlug } = Route.useParams();
  const { data: tutorial, isLoading } = useTutorialBySlug(tutorialSlug);
  const { user } = useAuth();
  const { data: completed } = useTutorialProgress(tutorial?.id);
  const toggle = useToggleModuleComplete(tutorial?.id);
  const { data: allProblems } = usePracticeProblems("inventor");
  const navigate = useNavigate();

  if (isLoading || !tutorial) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  const m = tutorial.modules.find((x) => x.slug === moduleSlug);
  if (!m) {
    return <div className="p-6 text-sm text-slate-500">Module not found.</div>;
  }
  const completedSet = completed ?? new Set<string>();
  const isDone = completedSet.has(m.id);

  return (
    <ModuleReader
      module={m}
      tutorialTitle={tutorial.title}
      completed={isDone}
      onToggleComplete={(next) => {
        if (next) fireConfetti();
        toggle.mutate({ moduleId: m.id, completed: next });
      }}
      toggling={toggle.isPending}
      signedIn={!!user}
      allProblems={allProblems ?? []}
      onOpenProblem={(slug) =>
        navigate({ to: "/learn/inventor/tutorials/practice-problems/$slug", params: { slug } })
      }
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
  onOpenProblem,
}: {
  module: TutorialModule;
  tutorialTitle: string;
  completed: boolean;
  onToggleComplete: (next: boolean) => void;
  toggling: boolean;
  signedIn: boolean;
  allProblems: PracticeProblem[];
  onOpenProblem: (slug: string) => void;
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
              id: m.id,
              slug: m.slug,
              title: m.title,
              summary: m.summary,
              content: m.content,
              sourceKind: "blocks",
              html: "",
              sourceFilePath: null,
              sourceFileName: null,
              sourceUploadedAt: null,
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
                <button
                  key={p.id}
                  onClick={() => onOpenProblem(p.slug)}
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
                </button>
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
