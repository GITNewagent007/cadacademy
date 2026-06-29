import { createFileRoute } from "@tanstack/react-router";
import { ModuleReaderBySlug } from "@/components/tutorials/TutorialsBrowser";

export const Route = createFileRoute("/learn/inventor/learn/tutorials/$slug/$moduleSlug")({
  component: ModulePage,
});

function ModulePage() {
  const { slug, moduleSlug } = Route.useParams();
  return <ModuleReaderBySlug tutorialSlug={slug} moduleSlug={moduleSlug} />;
}
