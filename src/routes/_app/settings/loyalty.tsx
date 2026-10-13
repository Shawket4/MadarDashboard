import { createFileRoute } from "@tanstack/react-router";
import { LoyaltyPage } from "@/features/loyalty/admin";
import { loyaltySearch } from "@/features/loyalty/admin/search";

/** ?tab= picks the open tab; it is restored on return. */
export const Route = createFileRoute("/_app/settings/loyalty")({
  validateSearch: loyaltySearch.validateSearch,
  beforeLoad: loyaltySearch.beforeLoad,
  component: LoyaltyPage,
});
