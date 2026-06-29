import { useState } from "react";
import { GraduationCap, PlayCircle, Box, Video, Sparkles, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { PracticeBrowser } from "./PracticeBrowser";
import { TutorialsBrowser } from "@/components/tutorials/TutorialsBrowser";

type PathId = "practice" | "tutorials" | "videos" | "first-part";

type LearningPath = {
  id: PathId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
};

const PATHS: LearningPath[] = [
  {
    id: "practice",
    title: "Practice Problems",
    description: "A growing library of CAD practice models with drawings, instructions, and reference parts.",
    icon: Box,
    available: true,
  },
  {
    id: "tutorials",
    title: "Tutorials",
    description: "Guided multi-module lessons that mix reading material with practice problems.",
    icon: BookOpen,
    available: true,
  },
  {
    id: "videos",
    title: "Video Tutorials",
    description: "Watch focused, step-by-step video walkthroughs of every Inventor feature.",
    icon: Video,
    available: false,
  },
  {
    id: "first-part",
    title: "First Part Course",
    description: "A guided beginner course that takes you from a blank sketch to your first finished part.",
    icon: Sparkles,
    available: false,
  },
];

export function TutorialsView({ rightFooter }: { rightFooter?: React.ReactNode } = {}) {
  const [activeId, setActiveId] = useState<PathId>("practice");
  const active = PATHS.find((p) => p.id === activeId)!;

  return (
    <div className="flex-1 bg-white text-slate-900 flex min-h-0">
      {/* Sidebar — learning paths */}
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blueprint" />
            Learning Paths
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Pick how you want to learn.</p>
        </div>

        <nav className="flex-1 overflow-auto py-2">
          {PATHS.map((p) => {
            const Icon = p.icon;
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                onClick={() => p.available && setActiveId(p.id)}
                disabled={!p.available}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 border-l-2 transition",
                  isActive
                    ? "bg-slate-50 border-l-blueprint text-slate-900"
                    : "border-l-transparent text-slate-700",
                  !p.available && "opacity-50 cursor-not-allowed hover:bg-transparent",
                )}
              >
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
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0">
          {active.id === "practice" ? (
            <PracticeBrowser />
          ) : active.id === "tutorials" ? (
            <TutorialsBrowser />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 text-slate-500">
              <PlayCircle className="h-14 w-14 text-slate-300 mb-3" />
              <h2 className="text-lg font-semibold text-slate-700">{active.title}</h2>
              <p className="text-sm mt-1 max-w-md">{active.description}</p>
              <p className="text-xs mt-3 text-slate-400">Coming soon.</p>
            </div>
          )}
        </div>
        {rightFooter}
      </div>
    </div>
  );
}
