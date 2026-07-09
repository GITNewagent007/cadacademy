import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/learn/inventor/articles/")({
  component: EmptyReader,
});

function EmptyReader() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <FileText className="h-10 w-10" />
          <p className="text-sm">Select an article to read.</p>
        </div>
      </div>
    </div>
  );
}
