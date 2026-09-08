import { createFileRoute } from "@tanstack/react-router";
import { LoyaltyPage } from "@/features/loyalty/admin";

export const Route = createFileRoute("/_app/settings/loyalty")({
  component: LoyaltyPage,
});
