import { createFileRoute } from "@tanstack/react-router";
import { RewardsOverviewPage } from "@/features/rewards/overview/overview-page";

/** Rewards › Overview: the programme's figures for the period in the header. */
export const Route = createFileRoute("/_app/rewards/")({
  component: RewardsOverviewPage,
});
