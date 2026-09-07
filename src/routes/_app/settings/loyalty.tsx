import { createFileRoute } from "@tanstack/react-router";
import { LoyaltyPage } from "@/features/loyalty/loyalty-page";

export const Route = createFileRoute("/_app/settings/loyalty")({
  component: LoyaltyPage,
});
