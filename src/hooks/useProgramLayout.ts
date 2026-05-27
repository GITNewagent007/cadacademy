import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Layout } from "@/lib/layout-types";
import { defaultInventorLayout } from "@/lib/default-inventor-layout";

const INVENTOR_ENV_SLUGS = new Set([
  "inventor",
  "inventor-ipt",
  "inventor-iam",
  "inventor-idw",
  "inventor-ipn",
]);
const SHARED_SLUG = "inventor-shared";

export type ProgramLayoutResult = {
  /** Per-slug program row id (tabs/theme owner). */
  id: string | null;
  /** Shared pool row id (buttons owner). Null for non-inventor programs. */
  sharedId: string | null;
  layout: Layout;
};

export function useProgramLayout(slug: string) {
  return useQuery({
    queryKey: ["program-layout", slug],
    queryFn: async (): Promise<ProgramLayoutResult> => {
      const isInventorEnv = INVENTOR_ENV_SLUGS.has(slug);
      const slugs = isInventorEnv ? [slug, SHARED_SLUG] : [slug];
      const { data, error } = await supabase
        .from("programs")
        .select("id, slug, layout")
        .in("slug", slugs);
      if (error) throw error;

      const per = data?.find((r) => r.slug === slug) ?? null;
      const shared = data?.find((r) => r.slug === SHARED_SLUG) ?? null;
      const perLayout = (per?.layout as unknown as Layout | null) ?? null;
      const sharedLayout = (shared?.layout as unknown as Layout | null) ?? null;

      if (!isInventorEnv) {
        return {
          id: per?.id ?? null,
          sharedId: null,
          layout: perLayout ?? { tabs: [], buttons: {} },
        };
      }

      // Tabs/theme from per-slug row; fall back to default Inventor tabs when empty
      const hasPerTabs = !!perLayout?.tabs?.length;
      const tabs = hasPerTabs ? perLayout!.tabs : defaultInventorLayout.tabs;
      const theme = perLayout?.theme ?? defaultInventorLayout.theme;

      // Buttons from shared pool; if missing, seed with default pool so ids resolve
      const sharedButtons = sharedLayout?.buttons ?? {};
      const hasSharedButtons = Object.keys(sharedButtons).length > 0;
      const buttons = hasSharedButtons
        ? sharedButtons
        : defaultInventorLayout.buttons;

      return {
        id: per?.id ?? null,
        sharedId: shared?.id ?? null,
        layout: { tabs, buttons, theme },
      };
    },
  });
}
