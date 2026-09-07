import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell } from "@/features/settings/settings-shell";

/**
 * Settings owns a shell with its own rail; every pane renders into its Outlet.
 */
export const Route = createFileRoute("/_app/settings")({
  component: SettingsShell,
});
