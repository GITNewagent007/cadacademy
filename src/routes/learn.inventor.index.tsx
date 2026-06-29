import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/learn/inventor/")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/learn/inventor/part", search });
  },
});
