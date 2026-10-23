import { createFileRoute } from "@tanstack/react-router";
import { RewardsProgrammePage } from "@/features/rewards/programme/programme-page";
import { rewardsProgrammeSearch } from "@/features/rewards/search";

/** ?tab= picks programme | tracks | rewards | codes; restored on return. */
export const Route = createFileRoute("/_app/rewards/programme")({
  validateSearch: rewardsProgrammeSearch.validateSearch,
  beforeLoad: rewardsProgrammeSearch.beforeLoad,
  component: RewardsProgrammePage,
});
