import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useProgramLayout } from "@/hooks/useProgramLayout";

export const Route = createFileRoute("/learn/inventor/part1/")({
  component: Part1IndexRedirect,
});

function Part1IndexRedirect() {
  const { data } = useProgramLayout("inventor");
  const navigate = useNavigate();
  useEffect(() => {
    if (!data) return;
    const first =
      data.layout.tabs.find((t) => t.id === "model" && t.enabled) ??
      data.layout.tabs.find((t) => t.enabled) ??
      data.layout.tabs[0];
    if (first) {
      navigate({ to: "/learn/inventor/part1/$tabId", params: { tabId: first.id }, replace: true });
    }
  }, [data, navigate]);
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}
