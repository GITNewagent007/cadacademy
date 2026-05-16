import { useState } from "react";
import {
  ChevronRight, ChevronDown, Folder, Box, Eye, Compass, PencilRuler, XCircle, ArrowLeft, FileQuestion,
} from "lucide-react";
import { useInventorSim } from "./store";
import { useArticle } from "@/hooks/useArticles";
import { articleHeadings } from "@/lib/article-types";
import { cn } from "@/lib/utils";

/** Strip inline markdown/emoji syntax for plain-text outline display. */
function stripInline(text: string): string {
  return text
    .replace(/\{\{e:([^}|]+)(?:\|([^}]+))?\}\}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

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
  const { activeButtonId, activeHeadingId, setHeading, close, layout } = useInventorSim();
  const btn = activeButtonId ? layout.buttons[activeButtonId] : null;
  const label = btn?.label.replace(/\n/g, " ") ?? "";
  const { data: article } = useArticle(btn?.articleId ?? null);
  const headings = article ? articleHeadings(article.content) : [];

  return (
    <aside className="w-64 shrink-0 border-r border-inventor-tree-border bg-inventor-tree flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-inventor-tree-border text-xs font-mono-tech text-inventor-text-muted">
        <span>{btn ? "Article outline" : "Model"}</span>
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
          <div className="px-2 py-1 text-xs font-mono-tech uppercase text-inventor-text-muted truncate">
            {article?.title ?? label}
          </div>

          {headings.length === 0 ? (
            <div className="px-3 py-3 text-xs text-inventor-text-muted flex items-start gap-2">
              <FileQuestion className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {article
                  ? "Add headings to this article to build a table of contents."
                  : "No article assigned."}
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              {headings.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHeading(h.id)}
                  className={cn(
                    "text-left px-3 py-1.5 text-xs text-inventor-text hover:bg-inventor-button-hover border-l-2 border-transparent truncate",
                    activeHeadingId === h.id && "bg-inventor-button-active border-l-blueprint",
                  )}
                  style={{ paddingLeft: 8 + (h.level - 1) * 10 }}
                  title={h.text}
                >
                  {h.text}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
