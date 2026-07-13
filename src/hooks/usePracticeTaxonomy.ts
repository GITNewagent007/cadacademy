import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TaxonomyKind = "feature" | "level" | "problem_type" | "collection" | "sponsor";

export type TaxonomyItem = {
  id: string;
  kind: TaxonomyKind;
  programSlug: string;
  label: string;
  sortOrder: number;
  logoUrl: string | null;
  relationship: "sponsored" | "supported";
};

type Row = {
  id: string;
  kind: string;
  program_slug: string;
  label: string;
  sort_order: number;
  logo_url: string | null;
  relationship: string | null;
};

function rowTo(r: Row): TaxonomyItem {
  return {
    id: r.id,
    kind: r.kind as TaxonomyKind,
    programSlug: r.program_slug,
    label: r.label,
    sortOrder: r.sort_order,
    logoUrl: r.logo_url,
    relationship: r.relationship === "supported" ? "supported" : "sponsored",
  };
}

export function usePracticeTaxonomy(programSlug = "inventor") {
  return useQuery({
    queryKey: ["practice-taxonomy", programSlug],
    queryFn: async (): Promise<TaxonomyItem[]> => {
      const { data, error } = await supabase
        .from("practice_taxonomy")
        .select("id, kind, program_slug, label, sort_order, logo_url, relationship")
        .eq("program_slug", programSlug)
        .order("kind", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => rowTo(r as Row));
    },
  });
}


export function filterTaxonomy(items: TaxonomyItem[] | undefined, kind: TaxonomyKind) {
  return (items ?? []).filter((i) => i.kind === kind);
}
