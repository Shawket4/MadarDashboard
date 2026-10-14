import { createFileRoute } from "@tanstack/react-router";
import { PlanPane } from "@/features/settings/plan-pane";

export const Route = createFileRoute("/_app/settings/plan")({
  component: PlanPane,
});
