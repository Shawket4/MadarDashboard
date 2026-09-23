import { createFileRoute } from "@tanstack/react-router";
import { SchedulePage } from "@/features/dawam/schedule-page";

export const Route = createFileRoute("/_app/staff/schedule")({
  component: SchedulePage,
});
