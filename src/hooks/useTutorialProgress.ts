import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useTutorialProgress(tutorialId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tutorial-progress", tutorialId, user?.id],
    enabled: !!tutorialId && !!user,
    queryFn: async (): Promise<Set<string>> => {
      if (!user || !tutorialId) return new Set();
      // Fetch module ids belonging to the tutorial, then filter progress by them.
      const { data: mods, error: mErr } = await supabase
        .from("tutorial_modules")
        .select("id")
        .eq("tutorial_id", tutorialId);
      if (mErr) throw mErr;
      const ids = (mods ?? []).map((m) => m.id);
      if (ids.length === 0) return new Set();
      const { data, error } = await supabase
        .from("tutorial_module_progress")
        .select("module_id")
        .eq("user_id", user.id)
        .in("module_id", ids);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.module_id));
    },
  });
}

export function useToggleModuleComplete(tutorialId: string | null | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ moduleId, completed }: { moduleId: string; completed: boolean }) => {
      if (!user) throw new Error("Sign in to track progress");
      if (completed) {
        const { error } = await supabase
          .from("tutorial_module_progress")
          .upsert(
            { user_id: user.id, module_id: moduleId, completed_at: new Date().toISOString() },
            { onConflict: "user_id,module_id" },
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tutorial_module_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("module_id", moduleId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutorial-progress", tutorialId] });
    },
  });
}
