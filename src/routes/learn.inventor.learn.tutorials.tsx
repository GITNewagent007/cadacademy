import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/learn/inventor/learn/tutorials")({
  component: () => <Outlet />,
});
