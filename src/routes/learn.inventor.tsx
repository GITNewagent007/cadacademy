import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, Settings, BookOpen } from "lucide-react";
import { FileTabs } from "@/components/inventor/FileTabs";
import { useIsAdmin } from "@/hooks/useAuth";

type LearnSearch = { tab?: string; article?: string };

export const Route = createFileRoute("/learn/inventor")({
  head: () => ({
    meta: [
      { title: "Inventor simulator — interactive Model tab guide" },
      {
        name: "description",
        content:
          "Click any tool in our Autodesk Inventor simulator to open a rich article explaining what it does.",
      },
      { property: "og:title", content: "Inventor simulator — interactive guide" },
      {
        property: "og:description",
        content: "Learn Autodesk Inventor by clicking the actual UI.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): LearnSearch => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
    article: typeof s.article === "string" ? s.article : undefined,
  }),
  component: LearnInventorLayout,
});

function LearnInventorLayout() {
  const { data: isAdmin } = useIsAdmin();

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-inventor-ribbon-border bg-inventor-ribbon px-3 py-1 text-xs shrink-0">
        <Link
          to="/"
          className="flex items-center gap-1 text-inventor-text-muted hover:text-inventor-text"
        >
          <ArrowLeft className="h-3 w-3" /> Back to home
        </Link>
        <div className="font-mono-tech text-inventor-text-muted">
          Autodesk Inventor — Learning Mode · Part1
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <Link
                to="/admin/articles"
                className="flex items-center gap-1 text-blueprint hover:underline"
              >
                <BookOpen className="h-3 w-3" /> Articles
              </Link>
              <Link
                to="/admin/practice"
                className="flex items-center gap-1 text-blueprint hover:underline"
              >
                <BookOpen className="h-3 w-3" /> Practice
              </Link>
              <Link
                to="/admin/inventor"
                className="flex items-center gap-1 text-blueprint hover:underline"
              >
                <Settings className="h-3 w-3" /> Edit layout
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
      <FileTabs />
    </div>
  );
}
