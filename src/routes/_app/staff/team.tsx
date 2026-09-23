import { createFileRoute } from "@tanstack/react-router";
import { TeamPage } from "@/features/dawam/team-page";

export const Route = createFileRoute("/_app/staff/team")({
  component: TeamPage,
});
