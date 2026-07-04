import { useMemo, useState } from "react";
import { Search, BookOpen, Loader2, FileText } from "lucide-react";
import { useArticleList } from "@/hooks/useArticles";
import { useArticle } from "@/hooks/useArticles";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";
import { cn } from "@/lib/utils";

export function ArticlesBrowser({ rightFooter }: { rightFooter?: React.ReactNode } = {}) {
  const { data: list, isLoading } = useArticleList();
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
            {isLoading ? "Loading…" : `${filtered.length} article${filtered.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No matching articles.</div>
          ) : (
            <ul className="py-1">
              {filtered.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-muted/60 border-l-2 border-transparent",
                      selectedId === a.id && "bg-muted border-l-blueprint",
                    )}
                  >
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    {a.summary && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.summary}</div>
                    )}
                  </button>
                </li>
              ))}
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
            <div className="p-6 text-sm text-muted-foreground">Article not found.</div>
          ) : (
            <div className="p-6 md:p-8 max-w-4xl mx-auto">
              <h1 className="text-2xl font-semibold mb-2">{article.title}</h1>
              {article.summary && (
                <p className="text-sm text-muted-foreground mb-6">{article.summary}</p>
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
