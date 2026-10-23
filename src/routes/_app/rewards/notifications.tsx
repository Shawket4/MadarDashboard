import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/rewards/notifications/notifications-page";

/** Messages on the card: the composer and the log. */
export const Route = createFileRoute("/_app/rewards/notifications")({
  component: NotificationsPage,
});
