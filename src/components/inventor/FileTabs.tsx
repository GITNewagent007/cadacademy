import { Home, Box, GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type FileTabId = "part" | "tutorials" | "articles";

const TABS: { id: FileTabId; label: string; icon: React.ComponentType<{ className?: string }>; closable?: boolean }[] = [
  { id: "part", label: "Part1", icon: Box, closable: true },
  { id: "tutorials", label: "Tutorials", icon: GraduationCap, closable: true },
  { id: "articles", label: "Articles", icon: BookOpen, closable: true },
];

export function FileTabs({
  active,
  onChange,
}: {
  active: FileTabId;
  onChange: (id: FileTabId) => void;
}) {
  return (
    <div className="flex items-end h-7 bg-inventor-ribbon border-t border-inventor-ribbon-border pl-2 select-none">
      <button
        className="flex items-center gap-1 h-6 px-2 text-xs text-inventor-text-muted hover:text-inventor-text"
        title="Home"
        type="button"
      >
        <Home className="h-3 w-3" />
        <span>Home</span>
      </button>
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            type="button"
            className={cn(
              "flex items-center gap-1.5 h-6 px-2.5 text-xs border-l border-r border-inventor-ribbon-border -ml-px",
              isActive
                ? "bg-inventor-viewport text-inventor-text border-t border-t-blueprint rounded-t-sm relative z-10 h-7"
                : "bg-inventor-ribbon text-inventor-text-muted hover:text-inventor-text",
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{t.label}</span>
            {t.closable && (
              <span className="text-inventor-text-muted hover:text-inventor-text ml-1">×</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
