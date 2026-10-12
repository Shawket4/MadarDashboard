import { createFileRoute } from "@tanstack/react-router";
import { PricingAvailabilityPage } from "@/features/menu/pricing/pricing-availability-page";
import { pricingSearch } from "@/features/menu/pricing/search";

/** Tab, searches and pages live in the URL and are restored on return. */
export const Route = createFileRoute("/_app/menu/pricing")({
  validateSearch: pricingSearch.validateSearch,
  beforeLoad: pricingSearch.beforeLoad,
  component: PricingAvailabilityPage,
});
