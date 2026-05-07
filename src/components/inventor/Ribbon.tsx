import { useInventorSim } from "./store";
import { ribbonGroups, guidesById, inventorTabs } from "@/data/inventorGuides";
import { cn } from "@/lib/utils";

export function Ribbon() {
  const { open, activeGuideId } = useInventorSim();

  return (
    <div className="border-b border-inventor-ribbon-border bg-inventor-ribbon">
      {/* Tabs */}
      <div className="flex items-end gap-0 border-b border-inventor-ribbon-border px-2 pt-1 text-xs">
        {inventorTabs.map((t) => {
          const active = t === "3D Model";
          return (
            <div
              key={t}
              className={cn(
                "px-3 py-1.5 cursor-default select-none",
                active
                  ? "bg-inventor-tab-active text-inventor-text border-x border-t border-inventor-ribbon-border rounded-t"
                  : "text-inventor-text-muted hover:text-inventor-text",
              )}
            >
              {t}
            </div>
          );
        })}
      </div>

      {/* Groups */}
      <div className="flex items-stretch overflow-x-auto px-1 py-1">
        {ribbonGroups.map((group, gi) => (
          <div key={group.name} className="flex flex-col">
            <div className="flex items-start gap-0.5 px-2 pt-1 pb-0.5 min-h-[72px]">
              {group.guideIds.map((id) => {
                const g = guidesById[id];
                const Icon = g.icon;
                const isActive = activeGuideId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => open(id)}
                    title={g.label}
                    className={cn(
                      "flex flex-col items-center justify-start gap-0.5 rounded px-1.5 py-1 min-w-[52px] max-w-[64px] text-[10px] leading-tight text-inventor-text transition-colors",
                      "hover:bg-inventor-button-hover",
                      isActive && "bg-inventor-button-active",
                    )}
                  >
                    <Icon className="h-5 w-5 text-blueprint" strokeWidth={1.75} />
                    <span className="text-center break-words">{g.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-center text-[10px] text-inventor-text-muted border-t border-inventor-ribbon-border/60 py-0.5 px-2 font-mono-tech">
              {group.name}
            </div>
            {gi < ribbonGroups.length - 1 && (
              <div className="absolute" />
            )}
          </div>
        )).flatMap((node, i, arr) =>
          i < arr.length - 1
            ? [node, <div key={`sep-${i}`} className="w-px bg-inventor-ribbon-border my-1" />]
            : [node],
        )}
      </div>
    </div>
  );
}
