import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PracticeDetail } from "@/components/inventor/PracticeBrowser";

export const Route = createFileRoute("/learn/inventor/tutorials/practice-problems/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Practice problem` },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — CAD Academy` },
      { property: "og:url", content: `https://cadacademy.app/learn/inventor/tutorials/practice-problems/${params.slug}` },
    ],
    links: [
      { rel: "canonical", href: `https://cadacademy.app/learn/inventor/tutorials/practice-problems/${params.slug}` },
    ],
  }),
  component: PracticeDetailPage,
});

function PracticeDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  return (
    <PracticeDetail
      slug={slug}
      onBack={() => navigate({ to: "/learn/inventor/tutorials/practice-problems" })}
    />
  );
}
