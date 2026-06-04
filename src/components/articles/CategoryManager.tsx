import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  FolderTree,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  useArticleCategories,
  useCategoryMutations,
  buildCategoryTree,
  type CategoryNode,
} from "@/hooks/useArticleCategories";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CategoryManager() {
  const { data: cats, isLoading } = useArticleCategories();
  const { create } = useCategoryMutations();
  const [newRootName, setNewRootName] = useState("");
  const tree = buildCategoryTree(cats ?? []);

  const handleAddRoot = () => {
    const name = newRootName.trim();
    if (!name) return toast.error("Enter a category name");
    create.mutate(
      { name, parent_id: null },
      { onSuccess: () => setNewRootName("") },
    );
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="border-b border-border p-3 flex items-center gap-2">
        <FolderTree className="h-4 w-4" />
        <h2 className="text-sm font-semibold flex-1">Article categories</h2>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={newRootName}
            onChange={(e) => setNewRootName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRoot()}
            placeholder="New top-level category…"
            className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm"
          />
          <button
            onClick={handleAddRoot}
            disabled={create.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {create.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Add
          </button>
        </div>

        {isLoading ? (
          <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading…
          </div>
        ) : tree.length === 0 ? (
          <p className="text-xs italic text-muted-foreground py-2">
            No categories yet. Add one above, then nest more inside it.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {tree.map((node) => (
              <CategoryRow key={node.id} node={node} depth={0} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CategoryRow({ node, depth }: { node: CategoryNode; depth: number }) {
  const { rename, remove, create } = useCategoryMutations();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(node.name);
  const [adding, setAdding] = useState(false);
  const [childName, setChildName] = useState("");

  const handleAddChild = () => {
    const name = childName.trim();
    if (!name) return;
    create.mutate(
      { name, parent_id: node.id },
      {
        onSuccess: () => {
          setChildName("");
          setAdding(false);
          setExpanded(true);
        },
      },
    );
  };

  const handleRename = () => {
    const name = draftName.trim();
    if (!name) return;
    rename.mutate({ id: node.id, name }, { onSuccess: () => setEditing(false) });
  };

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded px-1 py-1 hover:bg-muted/50",
        )}
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-0.5 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {node.children.length > 0 ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="inline-block w-3.5" />
          )}
        </button>

        {editing ? (
          <>
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setEditing(false);
                  setDraftName(node.name);
                }
              }}
              className="flex-1 rounded border border-input bg-background px-2 py-0.5 text-sm"
            />
            <button
              onClick={handleRename}
              className="p-1 text-muted-foreground hover:text-foreground"
              title="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setDraftName(node.name);
              }}
              className="p-1 text-muted-foreground hover:text-foreground"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm truncate">{node.name}</span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
              <button
                onClick={() => setAdding((v) => !v)}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Add subcategory"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Rename"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Delete "${node.name}"? Any subcategories and assignments will be removed.`,
                    )
                  )
                    remove.mutate(node.id);
                }}
                className="p-1 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {adding && (
        <div
          className="flex gap-1 my-1"
          style={{ paddingLeft: (depth + 1) * 16 + 8 }}
        >
          <input
            autoFocus
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddChild();
              if (e.key === "Escape") {
                setAdding(false);
                setChildName("");
              }
            }}
            placeholder="Subcategory name…"
            className="flex-1 rounded border border-input bg-background px-2 py-0.5 text-xs"
          />
          <button
            onClick={handleAddChild}
            className="px-2 rounded bg-primary text-primary-foreground text-xs"
          >
            Add
          </button>
        </div>
      )}

      {expanded && node.children.length > 0 && (
        <ul className="space-y-0.5">
          {node.children.map((c) => (
            <CategoryRow key={c.id} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
