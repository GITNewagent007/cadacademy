import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Box, Loader2, Plus, Trash2, Search, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/practice/")({
  head: () => ({ meta: [{ title: "Admin · Practice Problems" }] }),
  component: AdminPractice,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function AdminPractice() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [creatingName, setCreatingName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const { data: list, isLoading } = useQuery({
    queryKey: ["admin-practice-problems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practice_problems")
        .select("id, slug, name, summary, problem_type, level, duration_minutes, thumbnail_url, updated_at")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const slug = slugify(name);
      if (!slug) throw new Error("Name must contain at least one letter or number");
      const { data, error } = await supabase
        .from("practice_problems")
        .insert({ slug, name, summary: "", instructions: [] })
        .select("slug")
        .single();
      if (error) throw error;
      return data.slug;
    },
    onSuccess: (slug) => {
      qc.invalidateQueries({ queryKey: ["admin-practice-problems"] });
      qc.invalidateQueries({ queryKey: ["practice-problems"] });
      setCreatingName("");
      navigate({ to: "/admin/practice/$slug", params: { slug } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("practice_problems").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-practice-problems"] });
      qc.invalidateQueries({ queryKey: ["practice-problems"] });
      toast.success("Practice problem deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return list ?? [];
    return (list ?? []).filter(
      (a) => a.name.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q),
    );
  }, [list, query]);

  if (authLoading || roleLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <Link to="/learn/inventor" className="text-sm text-blueprint hover:underline">
          ← Back to simulator
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/learn/inventor" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Simulator
          </Link>
          <h1 className="text-sm font-semibold flex items-center gap-1.5">
            <Box className="h-4 w-4" /> Practice Problems
          </h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link to="/admin/practice/taxonomy" className="text-muted-foreground hover:text-foreground">
            Taxonomy →
          </Link>
          <Link to="/admin/articles" className="text-muted-foreground hover:text-foreground">
            Articles →
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="rounded-md border border-border bg-card p-4 space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Create new practice problem
          </h2>
          <div className="flex gap-2">
            <input
              value={creatingName}
              onChange={(e) => setCreatingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && creatingName.trim()) create.mutate(creatingName.trim());
              }}
              placeholder="Problem name (e.g. Practice Problem 1.1)"
              className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm"
            />
            <button
              onClick={() => {
                const t = creatingName.trim();
                if (!t) { toast.error("Enter a name first"); return; }
                create.mutate(t);
              }}
              disabled={create.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {create.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Create
            </button>
          </div>
          {creatingName && (
            <p className="text-[11px] text-muted-foreground">
              Slug: <code className="font-mono-tech">{slugify(creatingName) || "—"}</code>
            </p>
          )}
        </div>

        <div className="rounded-md border border-border bg-card">
          <div className="border-b border-border p-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${list?.length ?? 0} problem${list?.length === 1 ? "" : "s"}…`}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center italic">
              {list?.length === 0 ? "No practice problems yet — create your first above." : "No matches."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((a) => (
                <li key={a.id} className="p-3 flex items-center gap-3 hover:bg-muted/30">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {a.thumbnail_url ? (
                      <img src={a.thumbnail_url} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Box className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <Link
                    to="/admin/practice/$slug"
                    params={{ slug: a.slug }}
                    className="flex-1 min-w-0"
                  >
                    <div className="font-medium text-sm truncate">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono-tech truncate">
                      {a.slug} · {a.problem_type} · {a.level} · {a.duration_minutes} min
                    </div>
                    {a.summary && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{a.summary}</div>
                    )}
                  </Link>
                  <Link
                    to="/admin/practice/$slug"
                    params={{ slug: a.slug }}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${a.name}"?`)) remove.mutate(a.id);
                    }}
                    className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
