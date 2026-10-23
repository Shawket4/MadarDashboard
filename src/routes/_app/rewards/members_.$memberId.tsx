import { createFileRoute } from "@tanstack/react-router";
import { RewardsMemberPage } from "@/features/rewards/members/member-page";

/** One member: balances per track, wallet, ledger, adjust, leave. */
export const Route = createFileRoute("/_app/rewards/members_/$memberId")({
  component: RewardsMemberPage,
});
