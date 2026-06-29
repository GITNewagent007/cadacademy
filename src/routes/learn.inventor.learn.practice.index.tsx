import { createFileRoute } from "@tanstack/react-router";
import { PracticeBrowser } from "@/components/inventor/PracticeBrowser";

export const Route = createFileRoute("/learn/inventor/learn/practice/")({
  component: () => <PracticeBrowser />,
});
