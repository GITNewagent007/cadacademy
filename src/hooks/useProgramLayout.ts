import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Layout } from "@/lib/layout-types";
import { defaultInventorLayout } from "@/lib/default-inventor-layout";

const FALLBACKS: Record<string, Layout> = {
  inventor: defaultInventorLayout,
};

export function useProgramLayout(slug: string) {
  return useQuery({
    queryKey: ["program-layout", slug],
    queryFn: async (): Promise<{ id: string | null; layout: Layout }> => {
      const { data, error } = await supabase
        .from("programs")
        .select("id, layout")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      const fallback = FALLBACKS[slug] ?? { tabs: [], buttons: {} };
      const stored = (data?.layout as unknown as Layout | null) ?? null;
      // Treat empty stored layout as "use default"
      const isEmpty = !stored || !stored.tabs?.length;
      return { id: data?.id ?? null, layout: isEmpty ? fallback : stored };
    },
  });
}
