import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X, Loader2, FileQuestion, Pencil } from "lucide-react";
import { useInventorSim } from "./store";
import { useArticle } from "@/hooks/useArticles";
import { useIsAdmin } from "@/hooks/useAuth";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";

function AxisTriad() {
  return (
    <svg viewBox="0 0 60 60" className="absolute bottom-3 left-3 h-12 w-12">
      <line x1="30" y1="30" x2="50" y2="22" stroke="#ef4444" strokeWidth="2" />
      <text x="52" y="22" fill="#ef4444" fontSize="8" fontFamily="monospace">x</text>
      <line x1="30" y1="30" x2="42" y2="48" stroke="#22c55e" strokeWidth="2" />
      <text x="42" y="56" fill="#22c55e" fontSize="8" fontFamily="monospace">y</text>
      <line x1="30" y1="30" x2="22" y2="10" stroke="#3b82f6" strokeWidth="2" />
      <text x="14" y="10" fill="#3b82f6" fontSize="8" fontFamily="monospace">z</text>
    </svg>
  );
}

export function Viewport() {
  const { activeButtonId, activeHeadingId, close, layout } = useInventorSim();
  const btn = activeButtonId ? layout.buttons[activeButtonId] : null;
  const articleId = btn?.articleId ?? null;
  const { data: article, isLoading } = useArticle(articleId);
  const { data: isAdmin } = useIsAdmin();
  const label = btn?.label.replace(/\n/g, " ") ?? "";

  // Scroll the selected heading from the part-tree TOC into view.
  useEffect(() => {
    if (!activeHeadingId) return;
    const el = document.getElementById(activeHeadingId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeHeadingId, article?.id]);

  return (
    <div className="relative flex-1 bg-inventor-viewport overflow-hidden">
      <AxisTriad />

      {btn && (
        <div className="absolute inset-6 md:inset-12 bg-background/97 rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <div className="text-xs font-mono-tech uppercase text-muted-foreground">Tool</div>
              <h2 className="text-lg font-semibold text-foreground">
                {article?.title || label}
              </h2>
              {article?.summary && (
                <p className="text-xs text-muted-foreground mt-0.5">{article.summary}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isAdmin && article && (
                <Link
                  to="/admin/articles/$slug"
                  params={{ slug: article.slug }}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Edit article"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
              )}
              <button
                onClick={close}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-5 md:p-8">
            {!articleId ? (
              <NoArticleState label={label} buttonId={btn.id} isAdmin={!!isAdmin} />
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading article…
              </div>
            ) : !article ? (
              <MissingArticleState isAdmin={!!isAdmin} />
            ) : (
              <ArticleRenderer blocks={article.content} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NoArticleState({ label, buttonId, isAdmin }: { label: string; buttonId: string; isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-start gap-3 max-w-md">
      <FileQuestion className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-base font-semibold">No article assigned to “{label}”</h3>
      <p className="text-sm text-muted-foreground">
        This button doesn’t reference an article yet. {isAdmin ? "Open the layout editor and assign one — or create a new article first." : "Check back later."}
      </p>
      {isAdmin && (
        <div className="flex gap-2">
          <Link to="/admin/inventor" className="text-xs text-blueprint hover:underline">
            Layout editor →
          </Link>
          <Link to="/admin/articles" className="text-xs text-blueprint hover:underline">
            Articles →
          </Link>
          <span className="text-xs text-muted-foreground">(button id: {buttonId})</span>
        </div>
      )}
    </div>
  );
}

function MissingArticleState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <FileQuestion className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-base font-semibold">Article not found</h3>
      <p className="text-sm text-muted-foreground">
        The article this button references has been deleted.
        {isAdmin && " Reassign the button in the layout editor."}
      </p>
    </div>
  );
}
