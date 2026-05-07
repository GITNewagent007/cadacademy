import { useInventorSim } from "./store";
import { ribbonGroups, guidesById, inventorTabs } from "@/data/inventorGuides";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

export function Ribbon() {
  const { open, activeGuideId } = useInventorSim();

  return (
    <div className="border-b border-inventor-ribbon-border bg-inventor-ribbon">
      <div className="flex items-end gap-0 border-b border-inventor-ribbon-border px-2 pt-1 text-xs">
        {inventorTabs.map((t) => {
          const active = t === "3D Model";
          return (
            <div
              key={t}
              className={cn(
                "px-3 py-1.5 cursor-default select-none",
                active
                  ? "bg-inventor-tab-active text-inventor-text border-x border-t border-inventor-ribbon-border rounded-t -mb-px"
                  : "text-inventor-text-muted hover:text-inventor-text",
              )}
            >
              {t}
            </div>
          );
        })}
      </div>

      <div className="flex items-stretch overflow-x-auto px-1 py-1">
        {ribbonGroups.map((group, gi) => (
          <Fragment key={group.name}>
            <div className="flex flex-col">
              <div className="flex items-start gap-0.5 px-2 pt-1 pb-0.5 flex-1">
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
                        "flex flex-col items-center justify-start gap-0.5 rounded px-1.5 py-1 w-[60px] text-[10px] leading-tight text-inventor-text transition-colors",
                        "hover:bg-inventor-button-hover",
                        isActive && "bg-inventor-button-active",
                      )}
                    >
                      <Icon className="h-5 w-5 text-blueprint" strokeWidth={1.75} />
                      <span className="text-center break-words line-clamp-2">{g.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="text-center text-[10px] text-inventor-text-muted border-t border-inventor-ribbon-border/60 py-0.5 px-2 font-mono-tech">
                {group.name}
              </div>
            </div>
            {gi < ribbonGroups.length - 1 && (
              <div className="w-px bg-inventor-ribbon-border my-1" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
