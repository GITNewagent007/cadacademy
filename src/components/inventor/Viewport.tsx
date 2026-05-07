import { X, ImageIcon, Video, CheckCircle2 } from "lucide-react";
import { useInventorSim } from "./store";
import { guidesById } from "@/data/inventorGuides";

function AxisTriad() {
  return (
    <svg viewBox="0 0 60 60" className="absolute bottom-3 left-3 h-12 w-12">
      <line x1="30" y1="30" x2="50" y2="22" stroke="#ef4444" strokeWidth="2" />
      <text x="52" y="22" fill="#ef4444" fontSize="8" fontFamily="monospace">x</text>
      <line x1="30" y1="30" x2="42" y2="48" stroke="#22c55e" strokeWidth="2" />
      <text x="42" y="56" fill="#22c55e" fontSize="8" fontFamily="monospace">y</text>
      <line x1="30" y1="30" x2="22" y2="10" stroke="#3b82f6" strokeWidth="2" />
      <text x="14" y="10" fill="#3b82f6" fontSize="8" fontFamily="monospace">z</text>
    </svg>
  );
}

export function Viewport() {
  const { activeGuideId, activeModuleId, close } = useInventorSim();
  const guide = activeGuideId ? guidesById[activeGuideId] : null;
  const mod = guide?.modules.find((m) => m.id === activeModuleId) ?? guide?.modules[0];

  return (
    <div className="relative flex-1 bg-inventor-viewport overflow-hidden">
      <AxisTriad />

      {guide && mod && (
        <div className="absolute inset-6 md:inset-12 bg-background/97 rounded-lg shadow-2xl border border-border overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <div className="text-xs font-mono-tech uppercase text-muted-foreground">
                {guide.group}
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {guide.label}
              </h2>
            </div>
            <button
              onClick={close}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close guide"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-auto p-5 md:p-8">
            <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>
            <h3 className="text-base font-semibold text-foreground mb-2">{mod.title}</h3>
            <p className="text-sm text-foreground leading-relaxed mb-6">{mod.body}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="aspect-video rounded border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center text-muted-foreground gap-1">
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Image placeholder</span>
              </div>
              <div className="aspect-video rounded border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center text-muted-foreground gap-1">
                <Video className="h-6 w-6" />
                <span className="text-xs">Video placeholder</span>
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark as complete
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
