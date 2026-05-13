import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, type CSSProperties } from "react";
import type { Layout, ThemeOverrides } from "@/lib/layout-types";
import type { Guide } from "@/hooks/useProgramGuides";

type SimState = {
  layout: Layout;
  activeTabId: string | null;
  setActiveTab: (id: string) => void;
  activeGuideId: string | null;
  activeModuleId: string | null;
  open: (buttonId: string) => void;
  close: () => void;
  setModule: (moduleId: string) => void;
  guides: Record<string, Guide>;
};

const Ctx = createContext<SimState | null>(null);

function themeToStyle(theme?: ThemeOverrides): CSSProperties {
  if (!theme) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(theme)) {
    if (v) out[`--${k}`] = v;
  }
  return out as CSSProperties;
}

export function InventorSimProvider({
  layout,
  guides = {},
  children,
}: {
  layout: Layout;
  guides?: Record<string, Guide>;
  children: ReactNode;
}) {
  const firstEnabled = useMemo(
    () => layout.tabs.find((t) => t.enabled)?.id ?? layout.tabs[0]?.id ?? null,
    [layout],
  );
  const [activeTabId, setActiveTabId] = useState<string | null>(firstEnabled);
  const [activeGuideId, setGuideId] = useState<string | null>(null);
  const [activeModuleId, setModuleId] = useState<string | null>(null);

  // If layout's tabs change and current active tab is gone or disabled, reset.
  useEffect(() => {
    if (!activeTabId || !layout.tabs.find((t) => t.id === activeTabId)) {
      setActiveTabId(firstEnabled);
    }
  }, [layout, activeTabId, firstEnabled]);

  const value: SimState = {
    layout,
    guides,
    activeTabId,
    setActiveTab: (id) => {
      setActiveTabId(id);
      setGuideId(null);
      setModuleId(null);
    },
    activeGuideId,
    activeModuleId,
    open: (buttonId) => {
      const btn = layout.buttons[buttonId];
      if (btn?.linkToTabId) {
        setActiveTabId(btn.linkToTabId);
        setGuideId(null);
        setModuleId(null);
        return;
      }
      setGuideId(buttonId);
      const g = guides[buttonId];
      setModuleId(g?.modules[0]?.id ?? "overview");
    },
    close: () => {
      setGuideId(null);
      setModuleId(null);
    },
    setModule: (moduleId) => setModuleId(moduleId),
  };

  return (
    <Ctx.Provider value={value}>
      <div style={themeToStyle(layout.theme)} className="contents">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useInventorSim() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInventorSim must be used within InventorSimProvider");
  return v;
}
