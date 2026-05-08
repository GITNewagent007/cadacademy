import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, Box, Eye, Compass, PencilRuler, XCircle, ArrowLeft } from "lucide-react";
import { useInventorSim } from "./store";
import { placeholderModules } from "@/hooks/useProgramGuides";
import { cn } from "@/lib/utils";

type TreeNode = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: TreeNode[];
};

const defaultTree: TreeNode = {
  label: "Part1",
  icon: Box,
  children: [
    { label: "Model States: [Primary]", icon: Folder },
    { label: "View: [Primary]", icon: Eye },
    { label: "Origin", icon: Compass, children: [
      { label: "YZ Plane" }, { label: "XZ Plane" }, { label: "XY Plane" },
      { label: "X Axis" }, { label: "Y Axis" }, { label: "Z Axis" },
      { label: "Center Point" },
    ] },
    { label: "Sketch1", icon: PencilRuler },
    { label: "End of Part", icon: XCircle },
  ],
};

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = !!node.children?.length;
  const Icon = node.icon;
  return (
    <div>
      <div
        className="flex items-center gap-1 px-1 py-0.5 hover:bg-inventor-button-hover cursor-default select-none text-xs text-inventor-text"
        style={{ paddingLeft: depth * 12 + 4 }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
        ) : (
          <span className="w-3" />
        )}
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-blueprint" />}
        <span className="truncate">{node.label}</span>
      </div>
      {hasChildren && open && (
        <div>
          {node.children!.map((c, i) => (
            <TreeItem key={i} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeatureTree() {
  const { activeGuideId, activeModuleId, setModule, close, layout } = useInventorSim();
  const btn = activeGuideId ? layout.buttons[activeGuideId] : null;
  const label = btn?.label.replace(/\n/g, " ") ?? "";
  const modules = btn ? placeholderModules(label) : [];

  return (
    <aside className="w-64 shrink-0 border-r border-inventor-tree-border bg-inventor-tree flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-inventor-tree-border text-xs font-mono-tech text-inventor-text-muted">
        <span>Model</span>
        <span className="text-inventor-text-muted">×</span>
      </div>

      {!btn ? (
        <div className="flex-1 overflow-auto py-1">
          <TreeItem node={defaultTree} />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <button
            onClick={close}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-blueprint hover:underline w-full"
          >
            <ArrowLeft className="h-3 w-3" /> Back to part tree
          </button>
          <div className="px-2 py-1 text-xs font-mono-tech uppercase text-inventor-text-muted">
            {label}
          </div>
          <div className="flex flex-col">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => setModule(m.id)}
                className={cn(
                  "text-left px-3 py-1.5 text-xs text-inventor-text hover:bg-inventor-button-hover border-l-2 border-transparent",
                  activeModuleId === m.id && "bg-inventor-button-active border-l-blueprint",
                )}
              >
                {m.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
