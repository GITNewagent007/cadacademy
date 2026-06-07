import { InventorSimProvider } from "@/components/inventor/store";
import { Ribbon } from "@/components/inventor/Ribbon";
import { FeatureTree } from "@/components/inventor/FeatureTree";
import { Viewport } from "@/components/inventor/Viewport";
import { useProgramLayout } from "@/hooks/useProgramLayout";
import { defaultInventorLayout } from "@/lib/default-inventor-layout";

/**
 * Simplified, embedded version of the Inventor simulator used inside the
 * iPad showcase on the landing page. Pulls the same layout (and uploaded
 * icons) from the backend as the real simulator so the icons match.
 */
export function SimplifiedInventorSim() {
  const { data } = useProgramLayout("inventor");
  const layout = data?.layout ?? defaultInventorLayout;

  return (
    <InventorSimProvider layout={layout}>
      <div
        className="fancy-sim h-full w-full flex flex-col bg-background"
        style={{
          transform: "scale(0.7)",
          transformOrigin: "top left",
          width: "calc(100% / 0.7)",
          height: "calc(100% / 0.7)",
        }}
      >
        <Ribbon />
        <div className="flex flex-1 min-h-0">
          <FeatureTree />
          <Viewport />
        </div>
      </div>
    </InventorSimProvider>
  );
}
