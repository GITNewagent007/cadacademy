import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTutorialBySlug } from "@/hooks/useTutorials";

export const Route = createFileRoute("/learn/inventor/tutorials/library/$tutorialSlug/")({
  component: TutorialIndexRedirect,
});

function TutorialIndexRedirect() {
  const { tutorialSlug } = Route.useParams();
  const { data: tutorial, isLoading } = useTutorialBySlug(tutorialSlug);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tutorial) return;
    const first = tutorial.modules[0];
    if (first) {
      navigate({
        to: "/learn/inventor/tutorials/library/$tutorialSlug/$moduleSlug",
        params: { tutorialSlug, moduleSlug: first.slug },
        replace: true,
      });
    }
  }, [tutorial, tutorialSlug, navigate]);

  if (isLoading) return null;
  if (tutorial && tutorial.modules.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Add a module to get started.
      </div>
    );
  }
  return null;
}
