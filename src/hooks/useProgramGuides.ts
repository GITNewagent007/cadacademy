import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GuideModule = { id: string; title: string; body: string };
export type Guide = {
  buttonId: string;
  label: string;
  description: string;
  modules: GuideModule[];
};

export function placeholderModules(label: string): GuideModule[] {
  return [
    { id: "overview", title: "1. Overview", body: `What is ${label} and when do you use it? — placeholder.` },
    { id: "inputs", title: "2. Inputs & options", body: `Walk through the dialog options for ${label}. — placeholder.` },
    { id: "practice", title: "3. Practice", body: `A short hands-on exercise for ${label}. — placeholder.` },
    { id: "pitfalls", title: "4. Common pitfalls", body: `Mistakes beginners make with ${label}. — placeholder.` },
  ];
}

export function useProgramGuides(programId: string | null) {
  return useQuery({
    queryKey: ["program-guides", programId],
    enabled: !!programId,
    queryFn: async (): Promise<Record<string, Guide>> => {
      if (!programId) return {};
      const { data, error } = await supabase
        .from("guides")
        .select("button_id, label, description, modules")
        .eq("program_id", programId);
      if (error) throw error;
      const out: Record<string, Guide> = {};
      for (const row of data ?? []) {
        out[row.button_id] = {
          buttonId: row.button_id,
          label: row.label,
          description: row.description,
          modules: (row.modules as unknown as GuideModule[]) ?? [],
        };
      }
      return out;
    },
  });
}
