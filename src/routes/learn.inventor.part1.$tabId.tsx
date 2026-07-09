import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/learn/inventor/part1/$tabId")({
  component: () => <Outlet />,
});
