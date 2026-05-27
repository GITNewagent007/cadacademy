import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Settings, Loader2, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { InventorSimProvider, useInventorSim } from "@/components/inventor/store";
import { Ribbon } from "@/components/inventor/Ribbon";
import { FeatureTree } from "@/components/inventor/FeatureTree";
import { Viewport } from "@/components/inventor/Viewport";
import { DocTabs, DEFAULT_DOC_TABS, type DocTabId } from "@/components/inventor/DocTabs";
import { HomeView } from "@/components/inventor/HomeView";
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

const DOC_SLUGS: Record<DocTabId, string | null> = {
  home: null,
  part: "inventor-ipt",
  assembly: "inventor-iam",
  drawing: "inventor-idw",
  presentation: "inventor-ipn",
};

const SLUG_TO_DOC: Record<string, DocTabId> = {
  "inventor-ipt": "part",
  "inventor-iam": "assembly",
  "inventor-idw": "drawing",
  "inventor-ipn": "presentation",
  inventor: "part",
};

function LearnInventor() {
  const [activeDoc, setActiveDoc] = useState<DocTabId>("part");
  const [pendingTabId, setPendingTabId] = useState<string | null>(null);
  const slug = DOC_SLUGS[activeDoc] ?? "inventor-ipt";
  const { data, isLoading } = useProgramLayout(slug);
  const { data: isAdmin } = useIsAdmin();

  if (isLoading || !data) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading layout…
      </div>
    );
  }

  const isHome = activeDoc === "home";
  const docLabel = isHome
    ? "Home"
    : activeDoc === "part"
      ? "Part1"
      : activeDoc === "assembly"
        ? "Assembly1"
        : activeDoc === "drawing"
          ? "Drawing1"
          : "Presentation1";

  const handleSwitchDoc = (targetSlug: string, tabId?: string) => {
    const docId = SLUG_TO_DOC[targetSlug];
    if (!docId) return;
    setPendingTabId(tabId ?? null);
    setActiveDoc(docId);
  };

  return (
    <InventorSimProvider
      key={slug}
      layout={data.layout}
      onSwitchDoc={handleSwitchDoc}
    >
      <ApplyPendingTab pendingTabId={pendingTabId} onApplied={() => setPendingTabId(null)} />
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
            Autodesk Inventor — Learning Mode · {docLabel}
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
                  to="/admin/inventor"
                  className="flex items-center gap-1 text-blueprint hover:underline"
                >
                  <Settings className="h-3 w-3" /> Edit layout
                </Link>
              </>
            )}
          </div>
        </div>
        {!isHome && <Ribbon />}
        <div className="flex flex-1 min-h-0">
          {isHome ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <HomeView />
              <DocTabs tabs={DEFAULT_DOC_TABS} activeId={activeDoc} onSelect={setActiveDoc} />
            </div>
          ) : (
            <>
              <FeatureTree />
              <div className="flex-1 min-h-0 flex flex-col">
                <Viewport />
                <DocTabs tabs={DEFAULT_DOC_TABS} activeId={activeDoc} onSelect={setActiveDoc} />
              </div>
            </>
          )}
        </div>
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

/** When a cross-doc link sets a pending tab id, apply it after the new
 *  layout mounts (the provider is keyed by slug, so this runs fresh). */
function ApplyPendingTab({
  pendingTabId,
  onApplied,
}: {
  pendingTabId: string | null;
  onApplied: () => void;
}) {
  const { setActiveTab, layout } = useInventorSim();
  useEffect(() => {
    if (pendingTabId && layout.tabs.find((t) => t.id === pendingTabId)) {
      setActiveTab(pendingTabId);
      onApplied();
    } else if (pendingTabId) {
      // Tab not found in target layout — just clear.
      onApplied();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
