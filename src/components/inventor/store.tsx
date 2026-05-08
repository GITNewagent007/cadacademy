import { createContext, useContext, useState, type ReactNode } from "react";
import type { Layout } from "@/lib/layout-types";

type SimState = {
  layout: Layout;
  activeGuideId: string | null;
  activeModuleId: string | null;
  open: (guideId: string) => void;
  close: () => void;
  setModule: (moduleId: string) => void;
};

const Ctx = createContext<SimState | null>(null);

export function InventorSimProvider({
  layout,
  children,
}: {
  layout: Layout;
  children: ReactNode;
}) {
  const [activeGuideId, setGuideId] = useState<string | null>(null);
  const [activeModuleId, setModuleId] = useState<string | null>(null);

  const value: SimState = {
    layout,
    activeGuideId,
    activeModuleId,
    open: (guideId) => {
      setGuideId(guideId);
      setModuleId("overview");
    },
    close: () => {
      setGuideId(null);
      setModuleId(null);
    },
    setModule: (moduleId) => setModuleId(moduleId),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventorSim() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInventorSim must be used within InventorSimProvider");
  return v;
}
