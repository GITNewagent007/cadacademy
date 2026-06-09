import { useState } from "react";
import { GraduationCap, PlayCircle, CheckCircle2, Clock, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Tutorial = {
  id: string;
  title: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  completed?: boolean;
  description: string;
};

const TUTORIALS: { section: string; items: Tutorial[] }[] = [
  {
    section: "Getting Started",
    items: [
      { id: "ui-tour", title: "Inventor UI Tour", duration: "5 min", level: "Beginner", completed: true, description: "Get familiar with the ribbon, browser, and viewport." },
      { id: "first-sketch", title: "Your First Sketch", duration: "8 min", level: "Beginner", completed: true, description: "Draw lines, circles, and add dimensions." },
      { id: "first-part", title: "Your First Part", duration: "12 min", level: "Beginner", description: "Extrude a sketch into a 3D solid." },
    ],
  },
  {
    section: "Part Modeling",
    items: [
      { id: "extrude-revolve", title: "Extrude & Revolve", duration: "10 min", level: "Beginner", description: "Master the two most common features." },
      { id: "fillet-chamfer", title: "Fillets & Chamfers", duration: "7 min", level: "Intermediate", description: "Add edges that look manufactured." },
      { id: "shell-rib", title: "Shells & Ribs", duration: "9 min", level: "Intermediate", description: "Hollow parts and add structural reinforcement." },
    ],
  },
  {
    section: "Practice Tasks",
    items: [
      { id: "bracket", title: "Model a Bracket", duration: "15 min", level: "Intermediate", description: "Real-world part with holes and fillets." },
      { id: "housing", title: "Enclosure Housing", duration: "25 min", level: "Advanced", description: "Multi-feature part with shells and patterns." },
    ],
  },
];

export function TutorialsView() {
  const [activeId, setActiveId] = useState<string>("first-part");
  const [query, setQuery] = useState("");

  const active = TUTORIALS.flatMap((s) => s.items).find((t) => t.id === activeId);

  const filtered = TUTORIALS.map((s) => ({
    ...s,
    items: s.items.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="flex-1 bg-white text-slate-900 flex min-h-0">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blueprint" />
            Tutorials &amp; Practice
          </h2>
          <div className="mt-2 relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blueprint focus:border-blueprint"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-auto py-2">
          {filtered.map((section) => (
            <div key={section.section} className="mb-3">
              <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.section}
              </div>
              <ul>
                {section.items.map((t) => {
                  const isActive = t.id === activeId;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => setActiveId(t.id)}
                        className={cn(
                          "w-full text-left px-4 py-2 flex items-start gap-2 text-xs hover:bg-slate-50 border-l-2",
                          isActive
                            ? "bg-slate-50 border-l-blueprint text-slate-900"
                            : "border-l-transparent text-slate-700",
                        )}
                      >
                        {t.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                        ) : (
                          <PlayCircle className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{t.title}</div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <Clock className="h-3 w-3" /> {t.duration}
                            <span>·</span>
                            <span>{t.level}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-slate-300 shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto bg-white">
        {active ? (
          <div className="max-w-3xl mx-auto px-8 py-10">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <span className="px-2 py-0.5 rounded-full bg-slate-100">{active.level}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {active.duration}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{active.title}</h1>
            <p className="mt-3 text-slate-600">{active.description}</p>

            <div className="mt-6 flex gap-2">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blueprint text-white text-sm font-medium hover:opacity-90 transition">
                <PlayCircle className="h-4 w-4" /> Start tutorial
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition">
                Mark as complete
              </button>
            </div>

            <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center text-slate-400">
              <PlayCircle className="h-16 w-16" />
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">What you'll learn</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> Navigate the Inventor interface with confidence.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> Apply the right feature for the right job.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> Build parts that match real manufacturing intent.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            Select a tutorial to begin.
          </div>
        )}
      </div>
    </div>
  );
}
