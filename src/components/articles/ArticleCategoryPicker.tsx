import { useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag } from "lucide-react";
import {
  useArticleCategories,
  useCategoryAssignments,
  useAssignmentMutations,
  buildCategoryTree,
  type CategoryNode,
} from "@/hooks/useArticleCategories";
import { cn } from "@/lib/utils";

export function ArticleCategoryPicker({ articleId }: { articleId: string }) {
  const { data: cats } = useArticleCategories();
  const { data: assignments } = useCategoryAssignments();
  const { assign, unassign } = useAssignmentMutations();

  const assignedIds = useMemo(
    () =>
      new Set(
        (assignments ?? [])
          .filter((a) => a.article_id === articleId)
          .map((a) => a.category_id),
      ),
    [assignments, articleId],
  );

  const tree = buildCategoryTree(cats ?? []);

  const toggle = (categoryId: string) => {
    if (assignedIds.has(categoryId)) {
      unassign.mutate({ article_id: articleId, category_id: categoryId });
    } else {
      assign.mutate({ article_id: articleId, category_id: categoryId });
    }
  };

  const count = assignedIds.size;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted",
            count > 0 && "border-blueprint/40 text-blueprint",
          )}
          title="Manage categories"
        >
          <Tag className="h-3 w-3" />
          {count > 0 ? `${count}` : "Categorize"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2 max-h-80 overflow-auto">
        {tree.length === 0 ? (
          <p className="text-xs italic text-muted-foreground p-2">
            No categories yet. Create some above.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {tree.map((n) => (
              <PickerRow
                key={n.id}
                node={n}
                depth={0}
                assignedIds={assignedIds}
                onToggle={toggle}
              />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PickerRow({
  node,
  depth,
  assignedIds,
  onToggle,
}: {
  node: CategoryNode;
  depth: number;
  assignedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const checked = assignedIds.has(node.id);
  return (
    <li>
      <label
        className="flex items-center gap-2 px-1 py-1 text-sm rounded hover:bg-muted/60 cursor-pointer"
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(node.id)}
        />
        <span className="truncate">{node.name}</span>
      </label>
      {node.children.length > 0 && (
        <ul className="space-y-0.5">
          {node.children.map((c) => (
            <PickerRow
              key={c.id}
              node={c}
              depth={depth + 1}
              assignedIds={assignedIds}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
