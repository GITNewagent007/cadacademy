import { createFileRoute } from "@tanstack/react-router";
import { PracticeDetail } from "@/components/inventor/PracticeBrowser";

export const Route = createFileRoute("/learn/inventor/learn/practice/$slug")({
  component: PracticeDetailPage,
});

function PracticeDetailPage() {
  const { slug } = Route.useParams();
  return <PracticeDetail slug={slug} backTo="/learn/inventor/learn/practice" />;
}
