import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, type CSSProperties } from "react";
import type { Layout, ThemeOverrides } from "@/lib/layout-types";

type SimState = {
  layout: Layout;
  activeTabId: string | null;
  setActiveTab: (id: string) => void;
  /** The button currently opened in the article overlay. */
  activeButtonId: string | null;
  /** When set, the overlay shows this article directly (regardless of buttons). */
  activeArticleId: string | null;
  /** Heading id within the active article that should be scrolled into view. */
  activeHeadingId: string | null;
  open: (buttonId: string) => void;
  openArticle: (articleId: string) => void;
  close: () => void;
  setHeading: (headingId: string | null) => void;
};

export const InventorSimCtx = createContext<SimState | null>(null);

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
  onSwitchDoc,
  children,
}: {
  layout: Layout;
  /** Called when a button has `linkToDocSlug` set — host page handles
   *  swapping the active program/doc (and optionally activating a ribbon tab). */
  onSwitchDoc?: (slug: string, tabId?: string) => void;
  children: ReactNode;
}) {
  const firstEnabled = useMemo(
    () =>
      layout.tabs.find((t) => t.id === "model" && t.enabled)?.id ??
      layout.tabs.find((t) => t.enabled)?.id ??
      layout.tabs[0]?.id ??
      null,
    [layout],
  );
  const [activeTabId, setActiveTabId] = useState<string | null>(firstEnabled);
  const [activeButtonId, setButtonId] = useState<string | null>(null);
  const [activeArticleId, setArticleId] = useState<string | null>(null);
  const [activeHeadingId, setHeadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTabId || !layout.tabs.find((t) => t.id === activeTabId)) {
      setActiveTabId(firstEnabled);
    }
  }, [layout, activeTabId, firstEnabled]);

  const value: SimState = {
    layout,
    activeTabId,
    setActiveTab: (id) => {
      setActiveTabId(id);
      setButtonId(null);
      setArticleId(null);
      setHeadingId(null);
    },
    activeButtonId,
    activeArticleId,
    activeHeadingId,
    open: (buttonId) => {
      const btn = layout.buttons[buttonId];
      if (btn?.linkToTabId) {
        setActiveTabId(btn.linkToTabId);
        setButtonId(null);
        setArticleId(null);
        setHeadingId(null);
        return;
      }
      setButtonId(buttonId);
      setArticleId(null);
      setHeadingId(null);
    },
    openArticle: (id) => {
      setArticleId(id);
      setButtonId(null);
      setHeadingId(null);
    },
    close: () => {
      setButtonId(null);
      setArticleId(null);
      setHeadingId(null);
    },
    setHeading: (h) => setHeadingId(h),
  };

  return (
    <InventorSimCtx.Provider value={value}>
      <div style={themeToStyle(layout.theme)} className="contents">
        {children}
      </div>
    </InventorSimCtx.Provider>
  );
}

export function useInventorSim() {
  const v = useContext(InventorSimCtx);
  if (!v) throw new Error("useInventorSim must be used within InventorSimProvider");
  return v;
}

/** Returns sim state if available, otherwise null. Use from components that may
 *  be rendered both inside the simulator (e.g. article overlay) and outside
 *  (e.g. admin preview). */
export function useOptionalInventorSim() {
  return useContext(InventorSimCtx);
}
