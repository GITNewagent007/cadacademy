import { createFileRoute } from "@tanstack/react-router";
import { ModuleReaderBySlug } from "@/components/tutorials/TutorialsBrowser";

export const Route = createFileRoute("/learn/inventor/learn/tutorials/$slug/")({
  component: FirstModule,
});

function FirstModule() {
  const { slug } = Route.useParams();
  return <ModuleReaderBySlug tutorialSlug={slug} />;
}
