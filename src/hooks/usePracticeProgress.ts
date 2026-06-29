import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function usePracticeProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["practice-progress", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Set<string>> => {
      if (!user) return new Set();
      const { data, error } = await supabase
        .from("practice_problem_progress")
        .select("problem_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.problem_id));
    },
  });
}

export function useTogglePracticeComplete() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ problemId, completed }: { problemId: string; completed: boolean }) => {
      if (!user) throw new Error("Sign in to track progress");
      if (completed) {
        const { error } = await supabase
          .from("practice_problem_progress")
          .upsert(
            { user_id: user.id, problem_id: problemId, completed_at: new Date().toISOString() },
            { onConflict: "user_id,problem_id" },
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("practice_problem_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("problem_id", problemId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice-progress"] });
    },
  });
}
