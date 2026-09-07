import { createFileRoute } from "@tanstack/react-router";
import { BrandPane } from "@/features/settings/brand-pane";

export const Route = createFileRoute("/_app/settings/brand")({
  component: BrandPane,
});
