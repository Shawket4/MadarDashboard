import { createFileRoute } from "@tanstack/react-router";
import { DeliverySettingsPage } from "@/features/delivery/settings-page";

export const Route = createFileRoute("/_app/delivery/settings")({
  component: DeliverySettingsPage,
});
