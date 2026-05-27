import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Layout } from "@/lib/layout-types";
import { defaultInventorLayout } from "@/lib/default-inventor-layout";

const FALLBACKS: Record<string, Layout> = {
  inventor: defaultInventorLayout,
  "inventor-ipt": defaultInventorLayout,
  "inventor-iam": defaultInventorLayout,
  "inventor-idw": defaultInventorLayout,
  "inventor-ipn": defaultInventorLayout,
};

/** Slug that owns the shared Inventor button pool (definitions only). */
export const SHARED_INVENTOR_BUTTONS_SLUG = "inventor";

function isInventorSlug(slug: string) {
  return slug === "inventor" || slug.startsWith("inventor-");
}

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
      const base = isEmpty ? structuredClone(fallback) : stored;

      // For any Inventor doctype, button definitions live in the shared
      // `inventor` program row. Merge that pool over local buttons so edits
      // propagate across Part / Assembly / Drawing / Presentation / Legacy.
      if (isInventorSlug(slug) && slug !== SHARED_INVENTOR_BUTTONS_SLUG) {
        const { data: shared } = await supabase
          .from("programs")
          .select("layout")
          .eq("slug", SHARED_INVENTOR_BUTTONS_SLUG)
          .maybeSingle();
        const sharedButtons =
          ((shared?.layout as unknown as Layout | null)?.buttons) ?? {};
        base.buttons = { ...(base.buttons ?? {}), ...sharedButtons };
      }

      return { id: data?.id ?? null, layout: base };
    },
  });
}
