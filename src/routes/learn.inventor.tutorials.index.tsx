import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/learn/inventor/tutorials/")({
  beforeLoad: () => {
    throw redirect({ to: "/learn/inventor/tutorials/practice-problems", replace: true });
  },
});
