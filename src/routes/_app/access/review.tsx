import { createFileRoute } from "@tanstack/react-router";
import { ReviewPage } from "@/features/access/review-page";

/** Access ▸ Review: flagged offline acts and wrong-branch PINs. */
export const Route = createFileRoute("/_app/access/review")({
  component: ReviewPage,
});
