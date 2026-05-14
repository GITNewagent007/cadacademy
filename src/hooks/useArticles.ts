import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Article, ArticleSourceKind, ArticleSummary, Block } from "@/lib/article-types";

type Row = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: unknown;
  updated_at?: string;
  source_kind?: string | null;
  html?: string | null;
  source_file_path?: string | null;
  source_file_name?: string | null;
  source_uploaded_at?: string | null;
};

function rowToArticle(row: Row): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: (row.content as Block[]) ?? [],
    updatedAt: row.updated_at,
    sourceKind: ((row.source_kind as ArticleSourceKind) ?? "blocks"),
    html: row.html ?? "",
    sourceFilePath: row.source_file_path ?? null,
    sourceFileName: row.source_file_name ?? null,
    sourceUploadedAt: row.source_uploaded_at ?? null,
  };
}

const SELECT_COLS =
  "id, slug, title, summary, content, updated_at, source_kind, html, source_file_path, source_file_name, source_uploaded_at";

/** Lightweight list — used by article picker and the article admin index. */
export function useArticleList() {
  return useQuery({
    queryKey: ["articles", "list"],
    queryFn: async (): Promise<ArticleSummary[]> => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, summary, updated_at")
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        summary: r.summary,
        updatedAt: r.updated_at,
      }));
    },
  });
}

export function useArticle(id: string | null | undefined) {
  return useQuery({
    queryKey: ["articles", "id", id],
    enabled: !!id,
    queryFn: async (): Promise<Article | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("articles")
        .select(SELECT_COLS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToArticle(data as Row) : null;
    },
  });
}

export function useArticleBySlug(slug: string | null | undefined) {
  return useQuery({
    queryKey: ["articles", "slug", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Article | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("articles")
        .select(SELECT_COLS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToArticle(data as Row) : null;
    },
  });
}
