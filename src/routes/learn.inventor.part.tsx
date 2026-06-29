import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { InventorSimProvider, useInventorSim } from "@/components/inventor/store";
import { Ribbon } from "@/components/inventor/Ribbon";
import { FeatureTree } from "@/components/inventor/FeatureTree";
import { Viewport } from "@/components/inventor/Viewport";
import { useProgramLayout } from "@/hooks/useProgramLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/learn/inventor/part")({
  component: PartView,
});

const parentApi = getRouteApi("/learn/inventor");

function PartView() {
  const { data, isLoading } = useProgramLayout("inventor");

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading layout…
      </div>
    );
  }

  return (
    <InventorSimProvider layout={data.layout}>
      <ApplySearchParams />
      <Ribbon />
      <div className="flex flex-1 min-h-0">
        <FeatureTree />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 min-h-0 flex">
            <Viewport />
          </div>
        </div>
      </div>
    </InventorSimProvider>
  );
}

/** Reads ?tab= / ?article= once on mount and applies them to the sim. */
function ApplySearchParams() {
  const search = parentApi.useSearch();
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
