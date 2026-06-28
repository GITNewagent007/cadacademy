import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Block, ImageOverrides } from "@/lib/article-types";

export type TutorialSummary = {
  id: string;
  slug: string;
  programSlug: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  sortOrder: number;
  published: boolean;
  moduleCount: number;
};

export type TutorialModule = {
  id: string;
  tutorialId: string;
  slug: string;
  title: string;
  summary: string;
  sourceKind: "blocks" | "docx";
  content: Block[];
  html: string;
  imageOverrides: ImageOverrides;
  sortOrder: number;
  problemIds: string[];
};

export type TutorialFull = TutorialSummary & {
  modules: TutorialModule[];
};

const TUTORIAL_COLS =
  "id, slug, program_slug, title, summary, thumbnail_url, sort_order, published";

export function useTutorials(programSlug = "inventor", opts?: { adminAll?: boolean }) {
  return useQuery({
    queryKey: ["tutorials", programSlug, opts?.adminAll ?? false],
    queryFn: async (): Promise<TutorialSummary[]> => {
      let q = supabase
        .from("tutorials")
        .select(TUTORIAL_COLS + ", tutorial_modules(id)")
        .eq("program_slug", programSlug)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });
      if (!opts?.adminAll) q = q.eq("published", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        slug: r.slug,
        programSlug: r.program_slug,
        title: r.title,
        summary: r.summary ?? "",
        thumbnailUrl: r.thumbnail_url,
        sortOrder: r.sort_order,
        published: r.published,
        moduleCount: Array.isArray(r.tutorial_modules) ? r.tutorial_modules.length : 0,
      }));
    },
  });
}

export function useTutorialBySlug(slug: string | null | undefined) {
  return useQuery({
    queryKey: ["tutorials", "slug", slug],
    enabled: !!slug,
    queryFn: async (): Promise<TutorialFull | null> => {
      if (!slug) return null;
      const { data: t, error } = await supabase
        .from("tutorials")
        .select(TUTORIAL_COLS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!t) return null;

      const { data: mods, error: mErr } = await supabase
        .from("tutorial_modules")
        .select(
          "id, tutorial_id, slug, title, summary, source_kind, content, html, image_overrides, sort_order, tutorial_module_problems(problem_id, sort_order)",
        )
        .eq("tutorial_id", t.id)
        .order("sort_order", { ascending: true });
      if (mErr) throw mErr;

      const modules: TutorialModule[] = (mods ?? []).map((m: any) => ({
        id: m.id,
        tutorialId: m.tutorial_id,
        slug: m.slug,
        title: m.title,
        summary: m.summary ?? "",
        sourceKind: (m.source_kind as "blocks" | "docx") ?? "blocks",
        content: (m.content as Block[]) ?? [],
        html: m.html ?? "",
        imageOverrides: (m.image_overrides as ImageOverrides) ?? {},
        sortOrder: m.sort_order,
        problemIds: (m.tutorial_module_problems ?? [])
          .slice()
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((p: any) => p.problem_id),
      }));

      return {
        id: t.id,
        slug: t.slug,
        programSlug: t.program_slug,
        title: t.title,
        summary: t.summary ?? "",
        thumbnailUrl: t.thumbnail_url,
        sortOrder: t.sort_order,
        published: t.published,
        moduleCount: modules.length,
        modules,
      };
    },
  });
}
