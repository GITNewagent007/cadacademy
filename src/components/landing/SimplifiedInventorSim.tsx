import { InventorSimProvider } from "@/components/inventor/store";
import { Ribbon } from "@/components/inventor/Ribbon";
import { FeatureTree } from "@/components/inventor/FeatureTree";
import { Viewport } from "@/components/inventor/Viewport";
import { defaultInventorLayout } from "@/lib/default-inventor-layout";

/**
 * Simplified, embedded version of the Inventor simulator used inside the
 * iPad showcase on the landing page. No top nav bar, no bottom file tabs,
 * no horizontal scrollbar on the ribbon, and fancier button hover effects.
 */
export function SimplifiedInventorSim() {
  return (
    <InventorSimProvider layout={defaultInventorLayout}>
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
