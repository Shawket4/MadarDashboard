import { createFileRoute } from "@tanstack/react-router";
import { ComboSettingsPage } from "@/features/combos/combo-settings-page";

/** Settings › Menu › Combos and deals: channels (org-wide, branch overrides) and the minimum margin. */
export const Route = createFileRoute("/_app/settings/combos")({
  component: ComboSettingsPage,
});
