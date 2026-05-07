import { createContext, useContext, useState, type ReactNode } from "react";

type SimState = {
  activeGuideId: string | null;
  activeModuleId: string | null;
  open: (guideId: string) => void;
  close: () => void;
  setModule: (moduleId: string) => void;
};

const Ctx = createContext<SimState | null>(null);

export function InventorSimProvider({ children }: { children: ReactNode }) {
  const [activeGuideId, setGuideId] = useState<string | null>(null);
  const [activeModuleId, setModuleId] = useState<string | null>(null);

  const value: SimState = {
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
