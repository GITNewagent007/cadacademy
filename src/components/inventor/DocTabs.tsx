import { Home, Puzzle, FileText, Presentation } from "lucide-react";
import { cn } from "@/lib/utils";

export type DocTabId = "home" | "part" | "assembly" | "drawing" | "presentation";

export type DocTab = {
  id: DocTabId;
  label: string;
  kind: "home" | "ipt" | "iam" | "idw" | "ipn";
};

export const DEFAULT_DOC_TABS: DocTab[] = [
  { id: "home", label: "Home", kind: "home" },
  { id: "part", label: "Part1.ipt", kind: "ipt" },
  { id: "assembly", label: "Assembly1.iam", kind: "iam" },
  { id: "drawing", label: "Drawing1.idw", kind: "idw" },
  { id: "presentation", label: "Presentation1.ipn", kind: "ipn" },
];

export function DocTabs({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: DocTab[];
  activeId: DocTabId;
  onSelect: (id: DocTabId) => void;
}) {
  return (
    <div className="flex items-end h-7 border-t border-inventor-ribbon-border bg-inventor-ribbon px-2 text-[11px] select-none">
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cn(
              "flex items-center gap-1 px-3 h-6 border-l border-r border-t border-inventor-ribbon-border rounded-t-sm -mb-px",
              active
                ? "bg-inventor-viewport text-blueprint border-b-0"
                : "bg-inventor-ribbon text-inventor-text-muted hover:text-inventor-text",
            )}
          >
            {t.kind === "home" && <Home className="h-3 w-3" />}
            {t.kind === "iam" && <Puzzle className="h-3 w-3" />}
            {t.kind === "idw" && <FileText className="h-3 w-3" />}
            {t.kind === "ipn" && <Presentation className="h-3 w-3" />}
            <span className={active && t.kind !== "home" ? "underline underline-offset-2" : ""}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
