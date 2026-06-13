import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/inventory/settings-page";

export const Route = createFileRoute("/_app/inventory/settings")({
  component: SettingsPage,
});
