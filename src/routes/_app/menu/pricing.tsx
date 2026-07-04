import { createFileRoute } from "@tanstack/react-router";
import { PricingAvailabilityPage } from "@/features/menu/pricing/pricing-availability-page";

export const Route = createFileRoute("/_app/menu/pricing")({
  component: PricingAvailabilityPage,
});
