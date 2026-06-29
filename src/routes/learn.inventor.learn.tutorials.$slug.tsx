import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TutorialShell } from "@/components/tutorials/TutorialsBrowser";

export const Route = createFileRoute("/learn/inventor/learn/tutorials/$slug")({
  component: () => (
    <TutorialShell>
      <Outlet />
    </TutorialShell>
  ),
});
