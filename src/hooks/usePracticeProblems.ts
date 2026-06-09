import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Block } from "@/lib/article-types";

export type PracticeLevel = "Easy" | "Medium" | "Hard";

export type PracticeProblem = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  programSlug: string;
  problemType: string;
  level: PracticeLevel | string;
  durationMinutes: number;
  featuresUsed: string[];
  certification: string | null;
  thumbnailUrl: string | null;
  drawingUrl: string | null;
  modelUrl: string | null;
  instructions: Block[];
  sortOrder: number;
  updatedAt?: string;
};

type Row = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  program_slug: string;
  problem_type: string;
  level: string;
  duration_minutes: number;
  features_used: string[] | null;
  certification: string | null;
  thumbnail_url: string | null;
  drawing_url: string | null;
  model_url: string | null;
  instructions: unknown;
  sort_order: number;
  updated_at?: string;
};

function rowTo(r: Row): PracticeProblem {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    summary: r.summary ?? "",
    programSlug: r.program_slug,
    problemType: r.problem_type,
    level: r.level,
    durationMinutes: r.duration_minutes,
    featuresUsed: r.features_used ?? [],
    certification: r.certification,
    thumbnailUrl: r.thumbnail_url,
    drawingUrl: r.drawing_url,
    modelUrl: r.model_url,
    instructions: (r.instructions as Block[]) ?? [],
    sortOrder: r.sort_order,
    updatedAt: r.updated_at,
  };
}

const COLS =
  "id, slug, name, summary, program_slug, problem_type, level, duration_minutes, features_used, certification, thumbnail_url, drawing_url, model_url, instructions, sort_order, updated_at";

export function usePracticeProblems(programSlug = "inventor") {
  return useQuery({
    queryKey: ["practice-problems", programSlug],
    queryFn: async (): Promise<PracticeProblem[]> => {
      const { data, error } = await supabase
        .from("practice_problems")
        .select(COLS)
        .eq("program_slug", programSlug)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => rowTo(r as Row));
    },
  });
}

export function usePracticeProblem(slug: string | null | undefined) {
  return useQuery({
    queryKey: ["practice-problems", "slug", slug],
    enabled: !!slug,
    queryFn: async (): Promise<PracticeProblem | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("practice_problems")
        .select(COLS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? rowTo(data as Row) : null;
    },
  });
}
