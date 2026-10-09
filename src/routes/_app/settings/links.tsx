import { createFileRoute } from "@tanstack/react-router";
import { LinksPane } from "@/features/links/admin/links-pane";

export const Route = createFileRoute("/_app/settings/links")({
  component: LinksPane,
});
