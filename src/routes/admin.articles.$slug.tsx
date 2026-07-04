import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2, Save, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useArticleBySlug } from "@/hooks/useArticles";
import { DocumentEditor } from "@/components/articles/DocumentEditor";
import { ArticleRenderer } from "@/components/articles/ArticleRenderer";
import { DocxUploader } from "@/components/articles/DocxUploader";
import { DocxImageEditor } from "@/components/articles/DocxImageEditor";
import type { Article, Block, ImageOverrides } from "@/lib/article-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/articles/$slug")({
  head: ({ params }) => ({ meta: [{ title: `Article · ${params.slug}` }] }),
  component: ArticleEditorPage,
});

function ArticleEditorPage() {
  const { slug } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { data: article, isLoading } = useArticleBySlug(slug);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  if (authLoading || roleLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <Link to="/learn/inventor" className="text-sm text-blueprint hover:underline">
          ← Back to simulator
        </Link>
      </div>
    );
  }
  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <h1 className="text-xl font-semibold">Article not found</h1>
        <p className="text-sm text-muted-foreground">No article exists with slug <code className="font-mono-tech">{slug}</code>.</p>
        <Link to="/admin/articles" className="text-sm text-blueprint hover:underline">← Back to articles</Link>
      </div>
    );
  }

  return <Editor key={article.id} initial={article} />;
}

function Editor({ initial }: { initial: Article }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(initial.title);
  const [summary, setSummary] = useState(initial.summary);
  const [blocks, setBlocks] = useState<Block[]>(initial.content);
  const [imageOverrides, setImageOverrides] = useState<ImageOverrides>(initial.imageOverrides ?? {});
  const [previewing, setPreviewing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(
    initial.updatedAt ? new Date(initial.updatedAt).getTime() : null,
  );

  const isDocx = initial.sourceKind === "docx";

  const dirty = useMemo(
    () =>
      title !== initial.title ||
      summary !== initial.summary ||
      (!isDocx && JSON.stringify(blocks) !== JSON.stringify(initial.content)) ||
      (isDocx && JSON.stringify(imageOverrides) !== JSON.stringify(initial.imageOverrides ?? {})),
    [title, summary, blocks, imageOverrides, initial, isDocx],
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { title, summary };
      // Only send blocks when in block mode (avoid clobbering for docx articles).
      if (!isDocx) payload.content = blocks;
      if (isDocx) payload.image_overrides = imageOverrides;
      const { error } = await supabase
        .from("articles")
        .update(payload as never)
        .eq("id", initial.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article saved");
      setLastSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (e) => {
      const msg = (e as Error).message;
      toast.error(
        /row-level security|permission/i.test(msg)
          ? "Save blocked — you need admin access."
          : msg,
      );
    },
  });

  const doSave = useCallback(() => {
    if (!dirty || save.isPending) return;
    save.mutate();
  }, [dirty, save]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        doSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSave]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const savedLabel = useSavedLabel(lastSavedAt);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/admin/articles" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="h-3 w-3" /> Articles
          </Link>
          <span className="text-sm font-semibold flex items-center gap-1.5 truncate">
            <BookOpen className="h-4 w-4" /> <span className="truncate">{title || "(untitled)"}</span>
          </span>
          <code className="text-[11px] font-mono-tech text-muted-foreground hidden sm:inline truncate">/{initial.slug}</code>
          {isDocx && (
            <span className="text-[10px] uppercase font-mono-tech rounded bg-blueprint/15 text-blueprint px-1.5 py-0.5">
              Word
            </span>
          )}
          {dirty && (
            <span className="text-[10px] uppercase font-mono-tech rounded bg-amber-500/15 text-amber-600 px-1.5 py-0.5">
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">{savedLabel}</span>
          <button
            onClick={() => setPreviewing((p) => !p)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted",
              previewing && "bg-muted",
            )}
          >
            <Eye className="h-3 w-3" /> {previewing ? "Editing" : "Preview"}
          </button>
          <button
            onClick={doSave}
            disabled={save.isPending || !dirty}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            title="Save (Ctrl/Cmd+S)"
          >
            {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-4">
        {previewing ? (
          <article className="rounded-md border border-border bg-card p-6">
            <h1 className="text-2xl font-semibold mb-1">{title}</h1>
            {summary && <p className="text-sm text-muted-foreground mb-4">{summary}</p>}
            <ArticleRenderer
              article={{ ...initial, title, summary, content: blocks, imageOverrides }}
            />
          </article>
        ) : (
          <>
            <div className="rounded-md border border-border bg-card p-3 space-y-2">
              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-input bg-background px-2 py-1.5 text-base font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-1">Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  placeholder="One-sentence description shown in lists and the article header."
                  className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Slug <code className="font-mono-tech">{initial.slug}</code> — referenced by buttons via this article's id.
              </p>
            </div>

            {isDocx && initial.html && (
              <div className="rounded-md border border-border bg-card p-6">
                <p className="text-[11px] text-muted-foreground mb-3">
                  Click any image to change how text wraps around it. Don't forget to save.
                </p>
                <DocxImageEditor
                  html={initial.html}
                  overrides={imageOverrides}
                  onChange={setImageOverrides}
                />
              </div>
            )}

            {!isDocx && <DocumentEditor blocks={blocks} onChange={setBlocks} />}

            <div className="pt-6 border-t border-border">
              <p className="text-[11px] font-mono-tech uppercase text-muted-foreground mb-2">
                Import from Word
              </p>
              <DocxUploader
                articleId={initial.id}
                fileName={initial.sourceFileName}
                uploadedAt={initial.sourceUploadedAt}
                filePath={initial.sourceFilePath}
                hasContent={initial.content.length > 0}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function useSavedLabel(ts: number | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!ts) return "";
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 5_000) return "Saved just now";
  if (diff < 60_000) return `Saved ${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `Saved ${Math.floor(diff / 60_000)}m ago`;
  return `Saved ${new Date(ts).toLocaleTimeString()}`;
}
