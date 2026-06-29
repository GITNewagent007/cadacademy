import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/learn/inventor/learn/")({
  beforeLoad: () => {
    throw redirect({ to: "/learn/inventor/learn/practice" });
  },
});
