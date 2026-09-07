import { createFileRoute } from "@tanstack/react-router";
import { BookingsSettingsPane } from "@/features/settings/bookings-settings-pane";

export const Route = createFileRoute("/_app/settings/bookings")({
  component: BookingsSettingsPane,
});
