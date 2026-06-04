import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Loader2,
  FileText,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useArticleList, useArticle } from "@/hooks/useArticles";
import {
  useArticleCategories,
  useCategoryAssignments,
  buildCategoryTree,
  type CategoryNode,
} from "@/hooks/useArticleCategories";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";
import type { ArticleSummary } from "@/lib/article-types";
import { cn } from "@/lib/utils";

export function ArticlesBrowser({
  rightFooter,
}: { rightFooter?: React.ReactNode } = {}) {
  const { data: list, isLoading } = useArticleList();
  const { data: cats } = useArticleCategories();
  const { data: assignments } = useCategoryAssignments();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: article, isLoading: loadingArticle } = useArticle(selectedId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = list ?? [];
    if (!q) return items;
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q),
    );
  }, [list, query]);

  // Group articles by category id.
  const byCategory = useMemo(() => {
    const map = new Map<string, ArticleSummary[]>();
    const articleById = new Map(filtered.map((a) => [a.id, a]));
    (assignments ?? []).forEach((a) => {
      const art = articleById.get(a.article_id);
      if (!art) return;
      const arr = map.get(a.category_id) ?? [];
      arr.push(art);
      map.set(a.category_id, arr);
    });
    map.forEach((arr) =>
      arr.sort((x, y) => x.title.localeCompare(y.title)),
    );
    return map;
  }, [assignments, filtered]);

  const uncategorized = useMemo(() => {
    const assigned = new Set(
      (assignments ?? []).map((a) => a.article_id),
    );
    return filtered.filter((a) => !assigned.has(a.id));
  }, [assignments, filtered]);

  const tree = useMemo(() => buildCategoryTree(cats ?? []), [cats]);

  return (
    <div className="flex-1 bg-background overflow-hidden flex">
      {/* Left: list */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4" /> Article library
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">
            {isLoading
              ? "Loading…"
              : `${filtered.length} article${filtered.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <div className="flex-1 overflow-auto py-1">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No matching articles.
            </div>
          ) : tree.length === 0 && uncategorized.length === filtered.length ? (
            // No categories defined — flat list.
            <ul>
              {filtered.map((a) => (
                <ArticleItem
                  key={a.id}
                  article={a}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  depth={0}
                />
              ))}
            </ul>
          ) : (
            <ul>
              {tree.map((n) => (
                <CategoryBranch
                  key={n.id}
                  node={n}
                  depth={0}
                  byCategory={byCategory}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  forceOpen={!!query}
                />
              ))}
              {uncategorized.length > 0 && (
                <UncategorizedBranch
                  articles={uncategorized}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  forceOpen={!!query}
                />
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto">
          {!selectedId ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-10 w-10" />
                <p className="text-sm">Select an article to read.</p>
              </div>
            </div>
          ) : loadingArticle ? (
            <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading article…
            </div>
          ) : !article ? (
            <div className="p-6 text-sm text-muted-foreground">
              Article not found.
            </div>
          ) : (
            <div className="p-6 md:p-8 max-w-4xl">
              <h1 className="text-2xl font-semibold mb-2">{article.title}</h1>
              {article.summary && (
                <p className="text-sm text-muted-foreground mb-6">
                  {article.summary}
                </p>
              )}
              <ArticleRenderer article={article} />
            </div>
          )}
        </div>
        {rightFooter}
      </div>
    </div>
  );
}

function ArticleItem({
  article,
  selectedId,
  onSelect,
  depth,
}: {
  article: ArticleSummary;
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth: number;
}) {
  return (
    <li>
      <button
        onClick={() => onSelect(article.id)}
        className={cn(
          "w-full text-left py-1.5 pr-3 hover:bg-muted/60 border-l-2 border-transparent flex items-center gap-2 text-sm",
          selectedId === article.id && "bg-muted border-l-blueprint",
        )}
        style={{ paddingLeft: depth * 14 + 24 }}
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{article.title}</span>
      </button>
    </li>
  );
}

function CategoryBranch({
  node,
  depth,
  byCategory,
  selectedId,
  onSelect,
  forceOpen,
}: {
  node: CategoryNode;
  depth: number;
  byCategory: Map<string, ArticleSummary[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  forceOpen: boolean;
}) {
  const [openState, setOpen] = useState(false);
  const open = forceOpen || openState;
  const articles = byCategory.get(node.id) ?? [];
  const hasContent = articles.length > 0 || node.children.length > 0;

  // Hide empty branches when searching.
  if (forceOpen && !hasContentRecursive(node, byCategory)) return null;

  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1 py-1 pr-2 text-sm hover:bg-muted/40 font-medium"
        style={{ paddingLeft: depth * 14 + 4 }}
      >
        {hasContent ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )
        ) : (
          <span className="inline-block w-3.5" />
        )}
        {open ? (
          <FolderOpen className="h-3.5 w-3.5 text-blueprint" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
        {articles.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {articles.length}
          </span>
        )}
      </button>
      {open && (
        <ul>
          {node.children.map((c) => (
            <CategoryBranch
              key={c.id}
              node={c}
              depth={depth + 1}
              byCategory={byCategory}
              selectedId={selectedId}
              onSelect={onSelect}
              forceOpen={forceOpen}
            />
          ))}
          {articles.map((a) => (
            <ArticleItem
              key={`${node.id}-${a.id}`}
              article={a}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function hasContentRecursive(
  node: CategoryNode,
  byCategory: Map<string, ArticleSummary[]>,
): boolean {
  if ((byCategory.get(node.id) ?? []).length > 0) return true;
  return node.children.some((c) => hasContentRecursive(c, byCategory));
}

function UncategorizedBranch({
  articles,
  selectedId,
  onSelect,
  forceOpen,
}: {
  articles: ArticleSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  forceOpen: boolean;
}) {
  const [openState, setOpen] = useState(true);
  const open = forceOpen || openState;
  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1 py-1 pr-2 text-sm hover:bg-muted/40 font-medium"
        style={{ paddingLeft: 4 }}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <Folder className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate italic">Uncategorized</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {articles.length}
        </span>
      </button>
      {open && (
        <ul>
          {articles.map((a) => (
            <ArticleItem
              key={a.id}
              article={a}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
