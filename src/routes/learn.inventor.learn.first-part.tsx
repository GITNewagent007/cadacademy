import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./learn.inventor.learn";

export const Route = createFileRoute("/learn/inventor/learn/first-part")({
  component: () => (
    <ComingSoon
      title="First Part Course"
      description="A guided beginner course that takes you from a blank sketch to your first finished part."
    />
  ),
});
