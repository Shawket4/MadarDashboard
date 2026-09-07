import { createFileRoute } from "@tanstack/react-router";
import { DeliverySettingsPage } from "@/features/delivery/settings-page";

export const Route = createFileRoute("/_app/settings/delivery")({
  component: DeliverySettingsPage,
});
