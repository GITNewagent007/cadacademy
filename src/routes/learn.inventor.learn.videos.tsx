import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./learn.inventor.learn";

export const Route = createFileRoute("/learn/inventor/learn/videos")({
  component: () => (
    <ComingSoon
      title="Video Tutorials"
      description="Watch focused, step-by-step video walkthroughs of every Inventor feature."
    />
  ),
});
