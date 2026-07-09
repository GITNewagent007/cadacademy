import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/learn/inventor/")({
  beforeLoad: () => {
    throw redirect({ to: "/learn/inventor/part1", replace: true });
  },
});
