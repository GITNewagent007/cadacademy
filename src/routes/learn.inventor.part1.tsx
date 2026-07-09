import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { InventorSimProvider, useInventorSim } from "@/components/inventor/store";
import { Ribbon } from "@/components/inventor/Ribbon";
import { FeatureTree } from "@/components/inventor/FeatureTree";
import { Viewport } from "@/components/inventor/Viewport";
import { useProgramLayout } from "@/hooks/useProgramLayout";

export const Route = createFileRoute("/learn/inventor/part1")({
  component: Part1Layout,
});

function Part1Layout() {
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
      <Part1Shell />
    </InventorSimProvider>
  );
}

function Part1Shell() {
  const params = useParams({ strict: false }) as { tabId?: string; buttonId?: string };
  const navigate = useNavigate();
  const sim = useInventorSim();
  const { layout } = sim;

  // URL → sim
  useEffect(() => {
    if (params.tabId && layout.tabs.some((t) => t.id === params.tabId) && sim.activeTabId !== params.tabId) {
      sim.setActiveTab(params.tabId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tabId]);

  useEffect(() => {
    if (params.buttonId && layout.buttons[params.buttonId]) {
      const btn = layout.buttons[params.buttonId];
      // linkToTabId buttons should have redirected already; guard anyway.
      if (!btn.linkToTabId) sim.open(params.buttonId);
    } else if (!params.buttonId && sim.activeButtonId) {
      sim.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.buttonId, params.tabId]);

  const handleTabClick = (tabId: string) => {
    navigate({ to: "/learn/inventor/part1/$tabId", params: { tabId } });
  };
  const handleButtonClick = (buttonId: string) => {
    const btn = layout.buttons[buttonId];
    if (btn?.linkToTabId) {
      navigate({ to: "/learn/inventor/part1/$tabId", params: { tabId: btn.linkToTabId } });
      return;
    }
    const tabId = params.tabId ?? sim.activeTabId ?? layout.tabs[0]?.id;
    if (!tabId) return;
    navigate({
      to: "/learn/inventor/part1/$tabId/$buttonId",
      params: { tabId, buttonId },
    });
  };
  const handleClose = () => {
    const tabId = params.tabId ?? sim.activeTabId;
    if (tabId) navigate({ to: "/learn/inventor/part1/$tabId", params: { tabId } });
  };

  return (
    <>
      <Ribbon onButtonClick={handleButtonClick} onTabClick={handleTabClick} />
      <div className="flex flex-1 min-h-0">
        <FeatureTree />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 min-h-0 flex">
            <Viewport onClose={handleClose} />
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}
