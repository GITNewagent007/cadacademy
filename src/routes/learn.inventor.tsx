import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Settings, Loader2, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { InventorSimProvider, useInventorSim } from "@/components/inventor/store";
import { Ribbon } from "@/components/inventor/Ribbon";
import { FeatureTree } from "@/components/inventor/FeatureTree";
import { Viewport } from "@/components/inventor/Viewport";
import { FileTabs, type FileTabId } from "@/components/inventor/FileTabs";
import { TutorialsView } from "@/components/inventor/TutorialsView";
import { ArticlesBrowser } from "@/components/inventor/ArticlesBrowser";
import { useProgramLayout } from "@/hooks/useProgramLayout";
import { useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  component: LearnInventor,
});

function LearnInventor() {
  const { data, isLoading } = useProgramLayout("inventor");
  const { data: isAdmin } = useIsAdmin();
  const [activeFile, setActiveFile] = useState<FileTabId>("part");

  if (isLoading || !data) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading layout…
      </div>
    );
  }

  return (
    <InventorSimProvider layout={data.layout}>
      <ApplySearchParams />
      <div className="h-screen flex flex-col bg-background">
        <div className="flex items-center justify-between border-b border-inventor-ribbon-border bg-inventor-ribbon px-3 py-1 text-xs">
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
        {activeFile === "part" && <Ribbon />}
        {activeFile === "part" ? (
          <div className="flex flex-1 min-h-0">
            <FeatureTree />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex-1 min-h-0 flex">
                <Viewport />
              </div>
              <FileTabs active={activeFile} onChange={setActiveFile} />
            </div>
          </div>
        ) : activeFile === "articles" ? (
          <div className="flex flex-1 min-h-0">
            <ArticlesBrowser rightFooter={<FileTabs active={activeFile} onChange={setActiveFile} />} />
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            <TutorialsView rightFooter={<FileTabs active={activeFile} onChange={setActiveFile} />} />
          </div>
        )}
      </div>
    </InventorSimProvider>
  );
}

/** Reads ?tab= / ?article= once on mount and applies them to the sim. */
function ApplySearchParams() {
  const search = Route.useSearch();
  const { setActiveTab, openArticle, layout } = useInventorSim();

  useEffect(() => {
    if (search.tab && layout.tabs.find((t) => t.id === search.tab)) {
      setActiveTab(search.tab);
    }
    if (search.article) {
      supabase
        .from("articles")
        .select("id")
        .eq("slug", search.article)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.id) openArticle(data.id);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
