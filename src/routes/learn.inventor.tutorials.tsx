import { useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { GraduationCap, ChevronRight, ChevronLeft, Box, BookOpen, Video, Sparkles } from "lucide-react";
import { FileTabs } from "@/components/inventor/FileTabs";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/learn/inventor/tutorials")({
  component: TutorialsLayout,
});

type PathItem = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  matchPrefix?: string;
  available: boolean;
};

const PATHS: PathItem[] = [
  {
    title: "Practice Problems",
    description: "A growing library of CAD practice models with drawings, instructions, and reference parts.",
    icon: Box,
    to: "/learn/inventor/tutorials/practice-problems",
    matchPrefix: "/learn/inventor/tutorials/practice-problems",
    available: true,
  },
  {
    title: "Tutorials",
    description: "Guided multi-module lessons that mix reading material with practice problems.",
    icon: BookOpen,
    to: "/learn/inventor/tutorials/library",
    matchPrefix: "/learn/inventor/tutorials/library",
    available: true,
  },
  {
    title: "Video Tutorials",
    description: "Watch focused, step-by-step video walkthroughs of every Inventor feature.",
    icon: Video,
    available: false,
  },
  {
    title: "First Part Course",
    description: "A guided beginner course that takes you from a blank sketch to your first finished part.",
    icon: Sparkles,
    available: false,
  },
];

function TutorialsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex-1 bg-white text-slate-900 flex min-h-0">
      <aside
        className={cn(
          "shrink-0 border-r border-slate-200 bg-white flex flex-col transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden",
        )}
      >
        <div className="px-4 py-3 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blueprint" />
              Learning Paths
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Pick how you want to learn.</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-auto py-2">
          {PATHS.map((p) => {
            const Icon = p.icon;
            const isActive = !!(p.matchPrefix && (pathname === p.matchPrefix || pathname.startsWith(p.matchPrefix + "/")));
            const cls = cn(
              "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 border-l-2 transition",
              isActive ? "bg-slate-50 border-l-blueprint text-slate-900" : "border-l-transparent text-slate-700",
              !p.available && "opacity-50 cursor-not-allowed hover:bg-transparent",
            );
            const inner = (
              <>
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", isActive ? "text-blueprint" : "text-slate-400")} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {p.title}
                    {!p.available && (
                      <span className="text-[9px] uppercase tracking-wider bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                        Soon
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{p.description}</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 mt-1 text-slate-300 shrink-0" />
              </>
            );
            if (!p.available || !p.to) {
              return (
                <div key={p.title} className={cls}>
                  {inner}
                </div>
              );
            }
            return (
              <Link key={p.title} to={p.to} className={cls}>
                {inner}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-2 top-2 z-10 p-1.5 rounded-md border border-slate-200 bg-white shadow-sm hover:bg-slate-50 text-slate-500 transition"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
        <FileTabs />
      </div>

    </div>
  );
}
