import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PracticeBrowser } from "@/components/inventor/PracticeBrowser";

export const Route = createFileRoute("/learn/inventor/tutorials/practice-problems/")({
  component: PracticeListPage,
});

function PracticeListPage() {
  const navigate = useNavigate();
  return (
    <PracticeBrowser
      onSelect={(slug) =>
        navigate({ to: "/learn/inventor/tutorials/practice-problems/$slug", params: { slug } })
      }
    />
  );
}
