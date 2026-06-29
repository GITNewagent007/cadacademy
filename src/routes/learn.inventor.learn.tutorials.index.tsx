import { createFileRoute } from "@tanstack/react-router";
import { TutorialsList } from "@/components/tutorials/TutorialsBrowser";

export const Route = createFileRoute("/learn/inventor/learn/tutorials/")({
  component: () => <TutorialsList />,
});
