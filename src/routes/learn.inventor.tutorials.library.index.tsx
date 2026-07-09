import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { useTutorials } from "@/hooks/useTutorials";

export const Route = createFileRoute("/learn/inventor/tutorials/library/")({
  component: TutorialsListPage,
});

function TutorialsListPage() {
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
                to="/learn/inventor/tutorials/library/$tutorialSlug"
                params={{ tutorialSlug: t.slug }}
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
