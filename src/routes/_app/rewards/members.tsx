import { createFileRoute } from "@tanstack/react-router";
import { RewardsMembersPage } from "@/features/rewards/members/members-page";
import { rewardsMembersSearch } from "@/features/rewards/search";

/** Rewards › Members: search, segment, sort and page live in the URL. */
export const Route = createFileRoute("/_app/rewards/members")({
  validateSearch: rewardsMembersSearch.validateSearch,
  beforeLoad: rewardsMembersSearch.beforeLoad,
  component: RewardsMembersPage,
});
