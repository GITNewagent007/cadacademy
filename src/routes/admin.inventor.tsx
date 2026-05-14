import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Settings,
  Upload,
  RotateCcw,
  Palette,
  Link2,
  BookOpen,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import * as Lucide from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useProgramLayout } from "@/hooks/useProgramLayout";
import { useArticleList } from "@/hooks/useArticles";
import { defaultInventorLayout } from "@/lib/default-inventor-layout";
import {
  THEME_KEYS,
  type ButtonVariant,
  type Layout,
  type RibbonButton,
  type RibbonGroup,
  type ThemeOverrides,
} from "@/lib/layout-types";
import type { ArticleSummary } from "@/lib/article-types";
import { InventorSimProvider } from "@/components/inventor/store";
import { Ribbon } from "@/components/inventor/Ribbon";
import { IconRender } from "@/components/inventor/IconRender";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inventor")({
  head: () => ({ meta: [{ title: "Admin · Inventor layout" }] }),
  component: AdminInventor,
});

function AdminInventor() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { data, isLoading } = useProgramLayout("inventor");
  const { data: articles } = useArticleList();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

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
        <p className="text-sm text-muted-foreground max-w-md">
          Your account ({user.email}) is signed in but does not have the admin role yet.
        </p>
        <Link to="/learn/inventor" className="text-sm text-blueprint hover:underline">
          ← Back to simulator
        </Link>
      </div>
    );
  }

  return <Editor initialLayout={data!.layout} programId={data!.id} articles={articles ?? []} />;
}

const LUCIDE_NAMES = Object.keys(Lucide).filter(
  (k) => /^[A-Z]/.test(k) && typeof (Lucide as never)[k as never] === "object",
);

type RightPanel =
  | { kind: "none" }
  | { kind: "button"; id: string }
  | { kind: "theme" };

function Editor({
  initialLayout,
  programId,
  articles,
}: {
  initialLayout: Layout;
  programId: string | null;
  articles: ArticleSummary[];
}) {
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [right, setRight] = useState<RightPanel>({ kind: "none" });
  const [activeTabId, setActiveTabId] = useState<string>(
    layout.tabs.find((t) => t.enabled)?.id ?? layout.tabs[0]?.id ?? "model",
  );
  const qc = useQueryClient();
  const tabIdx = layout.tabs.findIndex((t) => t.id === activeTabId);
  const tab = layout.tabs[tabIdx];

  const save = useMutation({
    mutationFn: async () => {
      if (!programId) throw new Error("No program id");
      const { error: lErr } = await supabase
        .from("programs")
        .update({ layout: layout as unknown as never })
        .eq("id", programId);
      if (lErr) throw lErr;
    },
    onSuccess: () => {
      toast.success("Layout saved");
      qc.invalidateQueries({ queryKey: ["program-layout", "inventor"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function patch(fn: (l: Layout) => Layout) {
    setLayout((l) => fn(structuredClone(l)));
  }

  function updateGroup(groupIdx: number, fn: (g: RibbonGroup) => void) {
    patch((l) => { fn(l.tabs[tabIdx].groups[groupIdx]); return l; });
  }
  function addGroup() {
    const id = `group-${Date.now()}`;
    patch((l) => { l.tabs[tabIdx].groups.push({ id, name: "New Group", columns: [[]] }); return l; });
  }
  function deleteGroup(gi: number) {
    if (!confirm("Delete this entire group?")) return;
    patch((l) => { l.tabs[tabIdx].groups.splice(gi, 1); return l; });
  }
  function moveGroup(gi: number, dir: -1 | 1) {
    patch((l) => {
      const arr = l.tabs[tabIdx].groups;
      const ni = gi + dir;
      if (ni < 0 || ni >= arr.length) return l;
      [arr[gi], arr[ni]] = [arr[ni], arr[gi]];
      return l;
    });
  }
  function addButton(gi: number, ci: number, variant: ButtonVariant) {
    const id = `btn-${Date.now()}`;
    patch((l) => {
      l.buttons[id] = { id, label: "New Button", icon: { type: "lucide", name: "Square" }, variant };
      l.tabs[tabIdx].groups[gi].columns[ci].push(id);
      return l;
    });
    setRight({ kind: "button", id });
  }
  function deleteButton(gi: number, ci: number, bi: number, btnId: string) {
    patch((l) => {
      l.tabs[tabIdx].groups[gi].columns[ci].splice(bi, 1);
      const stillUsed = l.tabs.some((t) => t.groups.some((g) => g.columns.some((c) => c.includes(btnId))));
      if (!stillUsed) delete l.buttons[btnId];
      return l;
    });
  }
  function moveButton(gi: number, ci: number, bi: number, dir: -1 | 1) {
    patch((l) => {
      const col = l.tabs[tabIdx].groups[gi].columns[ci];
      const ni = bi + dir;
      if (ni < 0 || ni >= col.length) return l;
      [col[bi], col[ni]] = [col[ni], col[bi]];
      return l;
    });
  }
  function moveButtonToCol(gi: number, ci: number, bi: number, targetCi: number) {
    patch((l) => {
      const cols = l.tabs[tabIdx].groups[gi].columns;
      const [id] = cols[ci].splice(bi, 1);
      cols[targetCi].push(id);
      return l;
    });
  }
  function addColumn(gi: number) {
    patch((l) => { l.tabs[tabIdx].groups[gi].columns.push([]); return l; });
  }
  function deleteColumn(gi: number, ci: number) {
    patch((l) => {
      const g = l.tabs[tabIdx].groups[gi];
      const col = g.columns[ci];
      if (g.columns.length === 1) g.columns[0] = [];
      else {
        if (col.length) g.columns[0].push(...col);
        g.columns.splice(ci, 1);
      }
      return l;
    });
  }
  function updateButton(id: string, fn: (b: RibbonButton) => void) {
    patch((l) => { fn(l.buttons[id]); return l; });
  }
  function toggleTabEnabled(tid: string) {
    patch((l) => { const t = l.tabs.find((t) => t.id === tid); if (t) t.enabled = !t.enabled; return l; });
  }
  function renameTab(tid: string, name: string) {
    patch((l) => { const t = l.tabs.find((t) => t.id === tid); if (t) t.name = name; return l; });
  }
  function addTab() {
    const id = `tab-${Date.now()}`;
    patch((l) => { l.tabs.push({ id, name: "New Tab", enabled: true, groups: [] }); return l; });
    setActiveTabId(id);
  }
  function deleteTab(tid: string) {
    if (!confirm("Delete this tab and all its groups?")) return;
    patch((l) => { l.tabs = l.tabs.filter((t) => t.id !== tid); return l; });
    if (activeTabId === tid) {
      setActiveTabId(layout.tabs.find((t) => t.id !== tid)?.id ?? "model");
    }
  }
  function setTheme(updater: (t: ThemeOverrides) => ThemeOverrides) {
    patch((l) => { l.theme = updater(l.theme ?? {}); return l; });
  }
  function resetToDefault() {
    if (!confirm("Discard your current layout and load the default Inventor preset?")) return;
    setLayout(structuredClone(defaultInventorLayout));
    toast.message("Default loaded — click Save to persist.");
  }

  const editingBtn = right.kind === "button" ? layout.buttons[right.id] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Link to="/learn/inventor" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Simulator
          </Link>
          <span className="text-sm font-semibold flex items-center gap-1.5">
            <Settings className="h-4 w-4" /> Inventor — Layout editor
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/articles"
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            <BookOpen className="h-3 w-3" /> Articles
          </Link>
          <button
            onClick={() => setRight({ kind: "theme" })}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted",
              right.kind === "theme" && "bg-muted",
            )}
          >
            <Palette className="h-3 w-3" /> Theme
          </button>
          <button onClick={resetToDefault} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
        </div>
      </header>

      {/* Live preview */}
      <div className="border-b border-border">
        <div className="px-4 py-1 text-[10px] font-mono-tech uppercase text-muted-foreground bg-muted/40">Live preview (all tabs)</div>
        <InventorSimProvider layout={layout}>
          <Ribbon showAllTabs />
        </InventorSimProvider>
      </div>

      {/* Tab management bar */}
      <div className="flex items-center gap-1 border-b border-border bg-card px-3 py-1.5 overflow-x-auto">
        <span className="text-[10px] font-mono-tech uppercase text-muted-foreground mr-2">Editing tab:</span>
        {layout.tabs.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs",
              activeTabId === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted",
            )}
          >
            <button onClick={() => setActiveTabId(t.id)} className="font-medium">
              {t.name}
            </button>
            <button
              onClick={() => toggleTabEnabled(t.id)}
              title={t.enabled ? "Hide from viewer" : "Show in viewer"}
              className="opacity-70 hover:opacity-100"
            >
              {t.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </button>
            <button onClick={() => deleteTab(t.id)} className="opacity-70 hover:opacity-100 hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button onClick={addTab} className="ml-2 text-xs text-blueprint hover:underline">
          + Add tab
        </button>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {tab && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
              <span className="text-[10px] font-mono-tech uppercase text-muted-foreground">Tab name</span>
              <input
                value={tab.name}
                onChange={(e) => renameTab(tab.id, e.target.value)}
                className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm font-medium"
              />
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={tab.enabled} onChange={() => toggleTabEnabled(tab.id)} />
                Visible in viewer
              </label>
            </div>
          )}
          {tab?.groups.map((g, gi) => (
            <GroupCard
              key={g.id}
              group={g}
              buttons={layout.buttons}
              articles={articles}
              onRename={(name) => updateGroup(gi, (gg) => { gg.name = name; })}
              onDelete={() => deleteGroup(gi)}
              onMove={(d) => moveGroup(gi, d)}
              onAddCol={() => addColumn(gi)}
              onDeleteCol={(ci) => deleteColumn(gi, ci)}
              onAddButton={(ci, v) => addButton(gi, ci, v)}
              onEditButton={(id) => setRight({ kind: "button", id })}
              onDeleteButton={(ci, bi, id) => deleteButton(gi, ci, bi, id)}
              onMoveButton={(ci, bi, d) => moveButton(gi, ci, bi, d)}
              onMoveButtonToCol={(ci, bi, tCi) => moveButtonToCol(gi, ci, bi, tCi)}
            />
          ))}
          {tab && (
            <button
              onClick={addGroup}
              className="w-full rounded-md border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="inline h-4 w-4 mr-1" /> Add group
            </button>
          )}
        </div>

        <aside className="w-96 shrink-0 border-l border-border bg-card overflow-auto">
          {right.kind === "theme" && (
            <ThemeEditor
              theme={layout.theme ?? {}}
              onChange={setTheme}
              onClose={() => setRight({ kind: "none" })}
            />
          )}
          {right.kind === "button" && editingBtn && (
            <ButtonEditor
              key={editingBtn.id}
              btn={editingBtn}
              tabs={layout.tabs}
              articles={articles}
              onChange={(fn) => updateButton(editingBtn.id, fn)}
              onClose={() => setRight({ kind: "none" })}
            />
          )}
          {right.kind === "none" && (
            <div className="p-6 text-sm text-muted-foreground">
              Select a button to edit its name, icon, link target, and assign an article. Or click <span className="font-medium text-foreground">Theme</span> in the toolbar to recolor everything.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function GroupCard({
  group, buttons, articles, onRename, onDelete, onMove, onAddCol, onDeleteCol,
  onAddButton, onEditButton, onDeleteButton, onMoveButton, onMoveButtonToCol,
}: {
  group: RibbonGroup;
  buttons: Record<string, RibbonButton>;
  articles: ArticleSummary[];
  onRename: (name: string) => void;
  onDelete: () => void;
  onMove: (d: -1 | 1) => void;
  onAddCol: () => void;
  onDeleteCol: (ci: number) => void;
  onAddButton: (ci: number, v: ButtonVariant) => void;
  onEditButton: (id: string) => void;
  onDeleteButton: (ci: number, bi: number, id: string) => void;
  onMoveButton: (ci: number, bi: number, d: -1 | 1) => void;
  onMoveButtonToCol: (ci: number, bi: number, tCi: number) => void;
}) {
  const articleTitle = (id?: string | null) => articles.find((a) => a.id === id)?.title;
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <input
          value={group.name}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm font-medium"
        />
        <button onClick={() => onMove(-1)} className="p-1 rounded hover:bg-muted"><ChevronUp className="h-3.5 w-3.5 -rotate-90" /></button>
        <button onClick={() => onMove(1)} className="p-1 rounded hover:bg-muted"><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="p-3 flex gap-3 overflow-x-auto">
        {group.columns.map((col, ci) => (
          <div key={ci} className="min-w-[200px] flex-1 rounded border border-border bg-muted/30 p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono-tech uppercase text-muted-foreground">Col {ci + 1}</span>
              <button onClick={() => onDeleteCol(ci)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
            <div className="space-y-1">
              {col.map((id, bi) => {
                const b = buttons[id];
                if (!b) return null;
                const at = articleTitle(b.articleId);
                return (
                  <div key={`${id}-${bi}`} className="rounded bg-card border border-border px-2 py-1">
                    <div className="flex items-center gap-1">
                      <IconRender icon={b.icon} size={14} />
                      <button onClick={() => onEditButton(id)} className="flex-1 text-left text-xs truncate hover:text-blueprint">
                        {b.label.replace(/\n/g, " ")}
                      </button>
                      {b.linkToTabId && <Link2 className="h-3 w-3 text-blueprint" />}
                      <span className="text-[9px] font-mono-tech text-muted-foreground">{b.variant}</span>
                      <button onClick={() => onMoveButton(ci, bi, -1)} className="p-0.5 hover:bg-muted rounded"><ChevronUp className="h-3 w-3" /></button>
                      <button onClick={() => onMoveButton(ci, bi, 1)} className="p-0.5 hover:bg-muted rounded"><ChevronDown className="h-3 w-3" /></button>
                      <select
                        value={ci}
                        onChange={(e) => onMoveButtonToCol(ci, bi, Number(e.target.value))}
                        className="text-[10px] bg-transparent border border-border rounded"
                      >
                        {group.columns.map((_, i) => <option key={i} value={i}>→{i + 1}</option>)}
                      </select>
                      <button onClick={() => onDeleteButton(ci, bi, id)} className="text-muted-foreground hover:text-destructive p-0.5"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 pl-5">
                      {b.linkToTabId ? (
                        <span className="italic">→ link to tab</span>
                      ) : at ? (
                        <span className="flex items-center gap-1"><BookOpen className="h-2.5 w-2.5" /> {at}</span>
                      ) : (
                        <span className="italic text-amber-600 dark:text-amber-400">no article assigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <button onClick={() => onAddButton(ci, "large")} className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-muted">+ Large</button>
              <button onClick={() => onAddButton(ci, "small")} className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-muted">+ Small</button>
              <button onClick={() => onAddButton(ci, "split-large")} className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-muted">+ Split L</button>
              <button onClick={() => onAddButton(ci, "split-small")} className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-muted">+ Split S</button>
            </div>
          </div>
        ))}
        <button onClick={onAddCol} className="min-w-[80px] rounded border border-dashed border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          <Plus className="inline h-3 w-3" /> Col
        </button>
      </div>
    </div>
  );
}

const DEFAULT_THEME_VALUES: Record<string, string> = {
  "inventor-viewport": "#3b78c8",
  "inventor-ribbon": "#f8f8fa",
  "inventor-ribbon-border": "#cfd2d7",
  "inventor-tab-active": "#eef0f3",
  "inventor-button-hover": "#dce6f3",
  "inventor-button-active": "#b9cce6",
  "inventor-tree": "#f8f8fa",
  "inventor-tree-border": "#cfd2d7",
  "inventor-text": "#222633",
  "inventor-text-muted": "#65697a",
  "blueprint": "#2563eb",
};

function ThemeEditor({
  theme,
  onChange,
  onClose,
}: {
  theme: ThemeOverrides;
  onChange: (fn: (t: ThemeOverrides) => ThemeOverrides) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Palette className="h-4 w-4" /> Theme colors
        </h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Override any color from the simulator. Empty = built-in default. Accepts hex, rgb, oklch, etc.
      </p>
      <div className="space-y-2">
        {THEME_KEYS.map(({ key, label }) => {
          const value = theme[key] ?? "";
          const colorVal = value || DEFAULT_THEME_VALUES[key] || "#888888";
          return (
            <div key={key} className="flex items-center gap-2">
              <input
                type="color"
                value={isHex(colorVal) ? colorVal : "#888888"}
                onChange={(e) => onChange((t) => ({ ...t, [key]: e.target.value }))}
                className="h-7 w-10 rounded border border-border cursor-pointer"
              />
              <div className="flex-1">
                <label className="block text-[10px] font-mono-tech uppercase text-muted-foreground">{label}</label>
                <input
                  type="text"
                  value={value}
                  placeholder={DEFAULT_THEME_VALUES[key]}
                  onChange={(e) => onChange((t) => ({ ...t, [key]: e.target.value }))}
                  className="w-full rounded border border-input bg-background px-2 py-0.5 text-xs"
                />
              </div>
              {value && (
                <button
                  onClick={() => onChange((t) => { const n = { ...t }; delete n[key]; return n; })}
                  className="text-muted-foreground hover:text-destructive p-1"
                  title="Reset to default"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isHex(s: string) {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

function ButtonEditor({
  btn, tabs, articles, onChange, onClose,
}: {
  btn: RibbonButton;
  tabs: { id: string; name: string }[];
  articles: ArticleSummary[];
  onChange: (fn: (b: RibbonButton) => void) => void;
  onClose: () => void;
}) {
  const [iconQuery, setIconQuery] = useState("");
  const [articleQuery, setArticleQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const filteredIcons = useMemo(() => {
    const q = iconQuery.toLowerCase();
    if (!q) return LUCIDE_NAMES.slice(0, 60);
    return LUCIDE_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 60);
  }, [iconQuery]);
  const filteredArticles = useMemo(() => {
    const q = articleQuery.toLowerCase();
    if (!q) return articles.slice(0, 30);
    return articles
      .filter((a) => a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q))
      .slice(0, 30);
  }, [articleQuery, articles]);
  const assigned = articles.find((a) => a.id === btn.articleId);

  async function uploadIcon(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${btn.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("button-icons").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("button-icons").getPublicUrl(path);
      onChange((b) => { b.icon = { type: "image", url: data.publicUrl }; });
      toast.success("Icon uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const isLink = !!btn.linkToTabId;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Edit button</h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
      </div>

      <div>
        <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-1">Label (use ↵ for line break)</label>
        <textarea
          value={btn.label}
          onChange={(e) => onChange((b) => { b.label = e.target.value; })}
          rows={2}
          className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
        />
      </div>

      <div>
        <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-1">Variant</label>
        <select
          value={btn.variant}
          onChange={(e) => onChange((b) => { b.variant = e.target.value as ButtonVariant; })}
          className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
        >
          <option value="large">Large (icon top, 2-line label)</option>
          <option value="small">Small (icon left, label right)</option>
          <option value="split-large">Split-large (large + dropdown)</option>
          <option value="split-small">Split-small (small + dropdown)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-1">Width (px)</label>
          <input
            type="number" placeholder="auto"
            value={btn.customWidth ?? ""}
            onChange={(e) => onChange((b) => {
              const v = e.target.value ? Number(e.target.value) : undefined;
              if (v) b.customWidth = v; else delete b.customWidth;
            })}
            className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-1">Height (px)</label>
          <input
            type="number" placeholder="auto"
            value={btn.customHeight ?? ""}
            onChange={(e) => onChange((b) => {
              const v = e.target.value ? Number(e.target.value) : undefined;
              if (v) b.customHeight = v; else delete b.customHeight;
            })}
            className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Click action: link OR open article */}
      <div className="rounded-md border border-border p-3 space-y-2">
        <div className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center gap-1">
          <Link2 className="h-3 w-3" /> Click action
        </div>
        <select
          value={btn.linkToTabId ?? ""}
          onChange={(e) => onChange((b) => {
            const v = e.target.value;
            if (v) b.linkToTabId = v;
            else delete b.linkToTabId;
          })}
          className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
        >
          <option value="">Open assigned article (default)</option>
          {tabs.map((t) => (
            <option key={t.id} value={t.id}>Switch to tab → {t.name}</option>
          ))}
        </select>
        {isLink && (
          <p className="text-[10px] text-muted-foreground">
            This button acts as a link. Article assignment below is ignored.
          </p>
        )}
      </div>

      {/* Article assignment */}
      {!isLink && (
        <div className="rounded-md border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-tech uppercase text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Assigned article
            </span>
            <Link to="/admin/articles" className="text-[11px] text-blueprint hover:underline flex items-center gap-1">
              Manage <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>
          {assigned ? (
            <div className="rounded border border-border bg-muted/30 p-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blueprint shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{assigned.title}</div>
                <div className="text-[10px] text-muted-foreground font-mono-tech truncate">{assigned.slug}</div>
              </div>
              <Link
                to="/admin/articles/$slug"
                params={{ slug: assigned.slug }}
                className="text-[11px] text-blueprint hover:underline"
              >
                Edit →
              </Link>
              <button
                onClick={() => onChange((b) => { b.articleId = null; })}
                className="text-muted-foreground hover:text-destructive"
                title="Unassign"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">No article assigned. Pick one below.</p>
          )}
          <input
            placeholder="Search articles by title or slug…"
            value={articleQuery}
            onChange={(e) => setArticleQuery(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
          />
          <div className="max-h-40 overflow-auto rounded border border-border divide-y divide-border">
            {filteredArticles.length === 0 && (
              <div className="p-2 text-[11px] text-muted-foreground italic">
                No matching articles. <Link to="/admin/articles" className="text-blueprint hover:underline">Create one →</Link>
              </div>
            )}
            {filteredArticles.map((a) => {
              const active = a.id === btn.articleId;
              return (
                <button
                  key={a.id}
                  onClick={() => onChange((b) => { b.articleId = a.id; })}
                  className={cn(
                    "w-full text-left px-2 py-1 text-xs hover:bg-muted",
                    active && "bg-blueprint/10 text-blueprint",
                  )}
                >
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-[10px] text-muted-foreground font-mono-tech truncate">{a.slug}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Icon */}
      <div>
        <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-2">Icon</label>
        <div className="flex items-center gap-2 mb-2 p-2 rounded border border-border bg-muted/30">
          <IconRender icon={btn.icon} size={28} />
          <div className="text-xs">
            <div className="font-medium">{btn.icon.type === "lucide" ? btn.icon.name : "Custom image"}</div>
            <div className="text-muted-foreground text-[10px] truncate max-w-[180px]">
              {btn.icon.type === "image" ? btn.icon.url : "lucide-react"}
            </div>
          </div>
        </div>
        <label className="inline-flex items-center gap-1 cursor-pointer text-xs rounded border border-border px-2 py-1 hover:bg-muted">
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          Upload image
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadIcon(f); }} />
        </label>
        <div className="mt-3">
          <input
            placeholder="Search Lucide icons…"
            value={iconQuery}
            onChange={(e) => setIconQuery(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
          />
          <div className="mt-2 grid grid-cols-6 gap-1 max-h-48 overflow-auto p-1 border border-border rounded">
            {filteredIcons.map((name) => {
              const Lc = (Lucide as never as Record<string, React.ComponentType<{ className?: string }>>)[name];
              const active = btn.icon.type === "lucide" && btn.icon.name === name;
              return (
                <button
                  key={name}
                  onClick={() => onChange((b) => { b.icon = { type: "lucide", name }; })}
                  title={name}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded hover:bg-muted",
                    active && "bg-blueprint/20 ring-1 ring-blueprint",
                  )}
                >
                  <Lc className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
