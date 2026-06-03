import { GraduationCap } from "lucide-react";

export function TutorialsView() {
  return (
    <div className="flex-1 bg-inventor-viewport overflow-auto flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-inventor-text-muted">
        <GraduationCap className="h-12 w-12" />
        <h2 className="text-lg font-semibold text-inventor-text">Tutorials &amp; Practice</h2>
        <p className="text-sm">Coming soon — guided lessons and practice tasks will live here.</p>
      </div>
    </div>
  );
}
