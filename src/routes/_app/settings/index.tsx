import { createFileRoute } from "@tanstack/react-router";
import { AppearancePane } from "@/features/settings/appearance-pane";

export const Route = createFileRoute("/_app/settings/")({
  component: AppearancePane,
});
