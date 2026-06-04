import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ArticleCategory = {
  id: string;
  name: string;
  parent_id: string | null;
  position: number;
};

export type CategoryAssignment = {
  article_id: string;
  category_id: string;
};

export function useArticleCategories() {
  return useQuery({
    queryKey: ["article_categories"],
    queryFn: async (): Promise<ArticleCategory[]> => {
      const { data, error } = await supabase
        .from("article_categories")
        .select("id, name, parent_id, position")
        .order("position", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ArticleCategory[];
    },
  });
}

export function useCategoryAssignments() {
  return useQuery({
    queryKey: ["article_category_assignments"],
    queryFn: async (): Promise<CategoryAssignment[]> => {
      const { data, error } = await supabase
        .from("article_category_assignments")
        .select("article_id, category_id");
      if (error) throw error;
      return (data ?? []) as CategoryAssignment[];
    },
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["article_categories"] });

  const create = useMutation({
    mutationFn: async (input: { name: string; parent_id: string | null }) => {
      const { error } = await supabase
        .from("article_categories")
        .insert({ name: input.name, parent_id: input.parent_id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const rename = useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { error } = await supabase
        .from("article_categories")
        .update({ name: input.name })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const move = useMutation({
    mutationFn: async (input: { id: string; parent_id: string | null }) => {
      const { error } = await supabase
        .from("article_categories")
        .update({ parent_id: input.parent_id })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: async (input: { id: string; position: number }) => {
      const { error } = await supabase
        .from("article_categories")
        .update({ position: input.position })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("article_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, rename, move, reorder, remove };
}

export function useAssignmentMutations() {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["article_category_assignments"] });

  const assign = useMutation({
    mutationFn: async (input: { article_id: string; category_id: string }) => {
      const { error } = await supabase
        .from("article_category_assignments")
        .insert(input);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unassign = useMutation({
    mutationFn: async (input: { article_id: string; category_id: string }) => {
      const { error } = await supabase
        .from("article_category_assignments")
        .delete()
        .eq("article_id", input.article_id)
        .eq("category_id", input.category_id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { assign, unassign };
}

/** Build a tree from a flat list. Roots have parent_id === null. */
export type CategoryNode = ArticleCategory & { children: CategoryNode[] };
export function buildCategoryTree(cats: ArticleCategory[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  cats.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sort = (arr: CategoryNode[]) => {
    arr.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    arr.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}
