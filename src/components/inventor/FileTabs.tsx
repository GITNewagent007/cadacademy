import { Home, Box, GraduationCap, BookOpen } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type FileTabId = "part" | "tutorials" | "articles";

const TABS: {
  id: FileTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  matchPrefix: string;
}[] = [
  { id: "part", label: "Part1", icon: Box, to: "/learn/inventor/part1", matchPrefix: "/learn/inventor/part1" },
  { id: "tutorials", label: "Tutorials", icon: GraduationCap, to: "/learn/inventor/tutorials", matchPrefix: "/learn/inventor/tutorials" },
  { id: "articles", label: "Articles", icon: BookOpen, to: "/learn/inventor/articles", matchPrefix: "/learn/inventor/articles" },
];

export function FileTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex items-end h-7 bg-inventor-ribbon border-t border-inventor-ribbon-border pl-2 select-none shrink-0">
      <Link to="/" className="flex items-center gap-1 h-6 px-2 text-xs text-inventor-text-muted hover:text-inventor-text" title="Home">
        <Home className="h-3 w-3" />
        <span>Home</span>
      </Link>
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = pathname === t.matchPrefix || pathname.startsWith(t.matchPrefix + "/");
        return (
          <Link
            key={t.id}
            to={t.to}
            className={cn(
              "flex items-center gap-1.5 h-6 px-2.5 text-xs border-l border-r border-inventor-ribbon-border -ml-px",
              isActive
                ? "bg-inventor-viewport text-inventor-text border-t border-t-blueprint rounded-t-sm relative z-10 h-7"
                : "bg-inventor-ribbon text-inventor-text-muted hover:text-inventor-text",
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
