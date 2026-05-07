import { create } from "zustand";

type SimState = {
  activeGuideId: string | null;
  activeModuleId: string | null;
  open: (guideId: string) => void;
  close: () => void;
  setModule: (moduleId: string) => void;
};

export const useInventorSim = create<SimState>((set) => ({
  activeGuideId: null,
  activeModuleId: null,
  open: (guideId) => set({ activeGuideId: guideId, activeModuleId: "overview" }),
  close: () => set({ activeGuideId: null, activeModuleId: null }),
  setModule: (moduleId) => set({ activeModuleId: moduleId }),
}));
