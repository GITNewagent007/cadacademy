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
} from "lucide-react";
import * as Lucide from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useProgramLayout } from "@/hooks/useProgramLayout";
import { defaultInventorLayout } from "@/lib/default-inventor-layout";
import type {
  ButtonVariant,
  Layout,
  RibbonButton,
  RibbonGroup,
} from "@/lib/layout-types";
import { InventorSimProvider } from "@/components/inventor/store";
import { Ribbon } from "@/components/inventor/Ribbon";
import { IconRender } from "@/components/inventor/IconRender";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inventor")({
  head: () => ({
    meta: [{ title: "Admin · Inventor layout" }],
  }),
  component: AdminInventor,
});

function AdminInventor() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { data, isLoading } = useProgramLayout("inventor");

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
          Ask the project owner to grant access in the backend.
        </p>
        <code className="text-xs bg-muted rounded px-2 py-1 break-all">
          INSERT INTO public.user_roles (user_id, role) VALUES ('{user.id}', 'admin');
        </code>
        <Link to="/learn/inventor" className="text-sm text-blueprint hover:underline">
          ← Back to simulator
        </Link>
      </div>
    );
  }

  return <Editor initialLayout={data!.layout} programId={data!.id} />;
}

// All Lucide icon names (for picker)
const LUCIDE_NAMES = Object.keys(Lucide).filter(
  (k) => /^[A-Z]/.test(k) && typeof (Lucide as any)[k] === "object",
);

function Editor({ initialLayout, programId }: { initialLayout: Layout; programId: string | null }) {
  const [layout, setLayout] = useState<Layout>(initialLayout);
  const [editingId, setEditingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const tabIdx = layout.tabs.findIndex((t) => t.enabled);
  const tab = layout.tabs[tabIdx];

  const save = useMutation({
    mutationFn: async () => {
      if (!programId) throw new Error("No program id");
      const { error } = await supabase
        .from("programs")
        .update({ layout: layout as unknown as never })
        .eq("id", programId);
      if (error) throw error;
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
    patch((l) => {
      fn(l.tabs[tabIdx].groups[groupIdx]);
      return l;
    });
  }

  function addGroup() {
    const id = `group-${Date.now()}`;
    patch((l) => {
      l.tabs[tabIdx].groups.push({ id, name: "New Group", columns: [[]] });
      return l;
    });
  }

  function deleteGroup(gi: number) {
    if (!confirm("Delete this entire group?")) return;
    patch((l) => {
      l.tabs[tabIdx].groups.splice(gi, 1);
      return l;
    });
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
      l.buttons[id] = {
        id,
        label: "New Button",
        icon: { type: "lucide", name: "Square" },
        variant,
      };
      l.tabs[tabIdx].groups[gi].columns[ci].push(id);
      return l;
    });
    setEditingId(id);
  }

  function deleteButton(gi: number, ci: number, bi: number, btnId: string) {
    patch((l) => {
      l.tabs[tabIdx].groups[gi].columns[ci].splice(bi, 1);
      // Don't delete from buttons map — could be reused. Cleanup happens manually.
      // But if not used anywhere, remove:
      const stillUsed = l.tabs.some((t) =>
        t.groups.some((g) => g.columns.some((c) => c.includes(btnId))),
      );
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
    patch((l) => {
      l.tabs[tabIdx].groups[gi].columns.push([]);
      return l;
    });
  }

  function deleteColumn(gi: number, ci: number) {
    patch((l) => {
      const g = l.tabs[tabIdx].groups[gi];
      // move buttons back to first column or remove if empty
      const col = g.columns[ci];
      if (g.columns.length === 1) {
        g.columns[0] = [];
      } else {
        if (col.length) g.columns[0].push(...col);
        g.columns.splice(ci, 1);
      }
      return l;
    });
  }

  function updateButton(id: string, fn: (b: RibbonButton) => void) {
    patch((l) => {
      fn(l.buttons[id]);
      return l;
    });
  }

  function resetToDefault() {
    if (!confirm("Discard your current layout and load the default Inventor preset?")) return;
    setLayout(structuredClone(defaultInventorLayout));
    toast.message("Default loaded — click Save to persist.");
  }

  const editingBtn = editingId ? layout.buttons[editingId] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Topbar */}
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
          <button
            onClick={resetToDefault}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            <RotateCcw className="h-3 w-3" /> Reset to default
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save layout
          </button>
        </div>
      </header>

      {/* Live preview */}
      <div className="border-b border-border">
        <div className="px-4 py-1 text-[10px] font-mono-tech uppercase text-muted-foreground bg-muted/40">
          Live preview
        </div>
        <InventorSimProvider layout={layout}>
          <Ribbon />
        </InventorSimProvider>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {tab?.groups.map((g, gi) => (
            <GroupCard
              key={g.id}
              group={g}
              buttons={layout.buttons}
              onRename={(name) => updateGroup(gi, (gg) => { gg.name = name; })}
              onDelete={() => deleteGroup(gi)}
              onMove={(d) => moveGroup(gi, d)}
              onAddCol={() => addColumn(gi)}
              onDeleteCol={(ci) => deleteColumn(gi, ci)}
              onAddButton={(ci, v) => addButton(gi, ci, v)}
              onEditButton={(id) => setEditingId(id)}
              onDeleteButton={(ci, bi, id) => deleteButton(gi, ci, bi, id)}
              onMoveButton={(ci, bi, d) => moveButton(gi, ci, bi, d)}
              onMoveButtonToCol={(ci, bi, tCi) => moveButtonToCol(gi, ci, bi, tCi)}
            />
          ))}
          <button
            onClick={addGroup}
            className="w-full rounded-md border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Plus className="inline h-4 w-4 mr-1" /> Add group
          </button>
        </div>

        {/* Right panel: edit selected button */}
        <aside className="w-80 shrink-0 border-l border-border bg-card overflow-auto">
          {editingBtn ? (
            <ButtonEditor
              key={editingBtn.id}
              btn={editingBtn}
              onChange={(fn) => updateButton(editingBtn.id, fn)}
              onClose={() => setEditingId(null)}
            />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              Select a button to edit its name, icon, variant and size.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  buttons,
  onRename,
  onDelete,
  onMove,
  onAddCol,
  onDeleteCol,
  onAddButton,
  onEditButton,
  onDeleteButton,
  onMoveButton,
  onMoveButtonToCol,
}: {
  group: RibbonGroup;
  buttons: Record<string, RibbonButton>;
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
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <input
          value={group.name}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm font-medium"
        />
        <button onClick={() => onMove(-1)} className="p-1 rounded hover:bg-muted" title="Move group left"><ChevronUp className="h-3.5 w-3.5 -rotate-90" /></button>
        <button onClick={() => onMove(1)} className="p-1 rounded hover:bg-muted" title="Move group right"><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="p-3 flex gap-3 overflow-x-auto">
        {group.columns.map((col, ci) => (
          <div key={ci} className="min-w-[180px] flex-1 rounded border border-border bg-muted/30 p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono-tech uppercase text-muted-foreground">Col {ci + 1}</span>
              <button onClick={() => onDeleteCol(ci)} className="text-muted-foreground hover:text-destructive" title="Delete column">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1">
              {col.map((id, bi) => {
                const b = buttons[id];
                if (!b) return null;
                return (
                  <div key={`${id}-${bi}`} className="flex items-center gap-1 rounded bg-card border border-border px-2 py-1">
                    <IconRender icon={b.icon} size={14} />
                    <button onClick={() => onEditButton(id)} className="flex-1 text-left text-xs truncate hover:text-blueprint">
                      {b.label.replace(/\n/g, " ")}
                    </button>
                    <span className="text-[9px] font-mono-tech text-muted-foreground">{b.variant}</span>
                    <button onClick={() => onMoveButton(ci, bi, -1)} className="p-0.5 hover:bg-muted rounded"><ChevronUp className="h-3 w-3" /></button>
                    <button onClick={() => onMoveButton(ci, bi, 1)} className="p-0.5 hover:bg-muted rounded"><ChevronDown className="h-3 w-3" /></button>
                    <select
                      value={ci}
                      onChange={(e) => onMoveButtonToCol(ci, bi, Number(e.target.value))}
                      className="text-[10px] bg-transparent border border-border rounded"
                      title="Move to column"
                    >
                      {group.columns.map((_, i) => <option key={i} value={i}>→{i + 1}</option>)}
                    </select>
                    <button onClick={() => onDeleteButton(ci, bi, id)} className="text-muted-foreground hover:text-destructive p-0.5">
                      <Trash2 className="h-3 w-3" />
                    </button>
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
        <button
          onClick={onAddCol}
          className="min-w-[80px] rounded border border-dashed border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="inline h-3 w-3" /> Col
        </button>
      </div>
    </div>
  );
}

function ButtonEditor({
  btn,
  onChange,
  onClose,
}: {
  btn: RibbonButton;
  onChange: (fn: (b: RibbonButton) => void) => void;
  onClose: () => void;
}) {
  const [iconQuery, setIconQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const filteredIcons = useMemo(() => {
    const q = iconQuery.toLowerCase();
    if (!q) return LUCIDE_NAMES.slice(0, 60);
    return LUCIDE_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 60);
  }, [iconQuery]);

  async function uploadIcon(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${btn.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("button-icons").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
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
            type="number"
            placeholder="auto"
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
            type="number"
            placeholder="auto"
            value={btn.customHeight ?? ""}
            onChange={(e) => onChange((b) => {
              const v = e.target.value ? Number(e.target.value) : undefined;
              if (v) b.customHeight = v; else delete b.customHeight;
            })}
            className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono-tech uppercase text-muted-foreground mb-2">Icon</label>
        <div className="flex items-center gap-2 mb-2 p-2 rounded border border-border bg-muted/30">
          <IconRender icon={btn.icon} size={28} />
          <div className="text-xs">
            <div className="font-medium">
              {btn.icon.type === "lucide" ? btn.icon.name : "Custom image"}
            </div>
            <div className="text-muted-foreground text-[10px] truncate max-w-[180px]">
              {btn.icon.type === "image" ? btn.icon.url : "lucide-react"}
            </div>
          </div>
        </div>

        <label className="inline-flex items-center gap-1 cursor-pointer text-xs rounded border border-border px-2 py-1 hover:bg-muted">
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          Upload image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadIcon(f);
            }}
          />
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
              const Lc = (Lucide as any)[name];
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
