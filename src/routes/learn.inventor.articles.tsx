import { useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { Search, BookOpen, Loader2 } from "lucide-react";
import { useArticleList } from "@/hooks/useArticles";
import { FileTabs } from "@/components/inventor/FileTabs";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/learn/inventor/articles")({
  component: ArticlesLayout,
});

function ArticlesLayout() {
  const { data: list, isLoading } = useArticleList();
  const [query, setQuery] = useState("");
  const params = useParams({ strict: false }) as { slug?: string };
  const selectedSlug = params.slug ?? null;

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
    <div className="flex-1 bg-background overflow-hidden flex min-h-0">
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
                  <Link
                    to="/learn/inventor/articles/$slug"
                    params={{ slug: a.slug }}
                    className={cn(
                      "block w-full text-left px-3 py-2 hover:bg-muted/60 border-l-2 border-transparent",
                      selectedSlug === a.slug && "bg-muted border-l-blueprint",
                    )}
                  >
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    {a.summary && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.summary}</div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0 flex flex-col">
          <Outlet />
        </div>
        <FileTabs />
      </div>
    </div>

  );
}
