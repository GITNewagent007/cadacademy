import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Article, ArticleSummary, Block } from "@/lib/article-types";

function rowToArticle(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: unknown;
  updated_at?: string;
}): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: (row.content as Block[]) ?? [],
    updatedAt: row.updated_at,
  };
}

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
        .select("id, slug, title, summary, content, updated_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToArticle(data) : null;
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
        .select("id, slug, title, summary, content, updated_at")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToArticle(data) : null;
    },
  });
}
