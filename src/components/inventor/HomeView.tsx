import { BookOpen, GraduationCap, Compass, Sparkles } from "lucide-react";

/**
 * Blank Inventor-styled "Home" view. Will later host the learning suite
 * (tutorials, guides, learning opportunities). Intentionally minimal for now.
 */
export function HomeView() {
  return (
    <div className="flex-1 min-h-0 flex bg-inventor-viewport text-inventor-text overflow-hidden">
      {/* Left rail — mirrors Inventor's home sidebar */}
      <aside className="w-64 border-r border-inventor-ribbon-border bg-inventor-ribbon/40 flex flex-col">
        <div className="px-5 pt-6 pb-4">
          <div className="text-xl font-light tracking-tight">Learning Suite</div>
          <div className="text-[11px] text-inventor-text-muted mt-0.5">
            Coming soon
          </div>
        </div>
        <nav className="px-3 py-2 flex-1 text-[12px] text-inventor-text-muted">
          <SideItem icon={<GraduationCap className="h-3.5 w-3.5" />} label="Tutorials" />
          <SideItem icon={<BookOpen className="h-3.5 w-3.5" />} label="Guides" />
          <SideItem icon={<Compass className="h-3.5 w-3.5" />} label="Learning paths" />
          <SideItem icon={<Sparkles className="h-3.5 w-3.5" />} label="What's new" />
        </nav>
        <div className="px-5 py-4 text-[10px] text-inventor-text-muted/70 border-t border-inventor-ribbon-border">
          Liam's Inventor learning suite
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <div className="px-10 pt-10">
          <h1 className="text-2xl font-light text-inventor-text">Home</h1>
          <p className="mt-2 text-sm text-inventor-text-muted max-w-xl">
            This is the home page for the learning suite. Tutorials, guides and
            other learning opportunities will live here. For now it's
            intentionally blank — content coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}

function SideItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-inventor-button-hover/60 cursor-default">
      {icon}
      <span>{label}</span>
    </div>
  );
}
