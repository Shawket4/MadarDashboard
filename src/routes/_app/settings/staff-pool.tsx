import { createFileRoute } from "@tanstack/react-router";
import { StaffPoolSettingsPage } from "@/features/staff-pool/staff-pool-settings-page";

export const Route = createFileRoute("/_app/settings/staff-pool")({
  component: StaffPoolSettingsPage,
});
