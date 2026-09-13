/**
 * The loyalty admin screen: edit the programme in scope, its rewards, or look
 * at its members.
 *
 * The scope is read once here and passed down, rather than each pane deriving
 * its own — three panes independently deciding what "this branch" meant is how
 * one of them ended up showing the organisation's rewards next to a branch's
 * rules.
 *
 * It comes from the app-wide picker in the header, not from a second one on
 * this page. Two pickers for one idea is two chances to be looking at a
 * different shop from the one you think you are.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { SegmentedControl } from "@/components/app/segmented-control";
import { PaneHeader } from "@/features/settings/pane-header";
import { useListBranches } from "@/data/api/generated/api";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";

import { useAuthStore } from "@/data/stores/auth.store";

import { loyaltyAccess } from "../shared/access";
import { MembersPane } from "./members/members-pane";
import { OverviewPane } from "./overview/overview-pane";
import { ProgramPane } from "./program/program-pane";
import { RewardsPane } from "./rewards/rewards-pane";
import { SignUpCode } from "./sign-up-code";
import type { ProgramScope } from "./use-program";

export function LoyaltyPage() {
  const { t } = useTranslation();
  // A super admin's token carries no org; the one they picked in the header
  // does. Reading the token directly left them with an empty org id, which is
  // why no code would print for a shop they had selected.
  const orgId = useOrgId() ?? "";
  const { branchId: scopedBranchId } = useScope();
  const branches = useListBranches(
    { org_id: orgId },
    { query: { enabled: !!orgId } },
  );
  const activeBranches = useMemo(
    () => (branches.data ?? []).filter((b) => b.is_active),
    [branches.data],
  );

  // Whatever the header says, with no special case for a shop that happens to
  // have one branch: "All branches" is the organisation's own row, and picking
  // a branch is that branch's override. The header used to pin a one-branch
  // shop to its only branch, which took away the org scope entirely — so this
  // page had to invent it back. The pin is gone; nothing to invent.
  const branchId = scopedBranchId;
  const { canListMembers } = loyaltyAccess(useAuthStore((s) => s.user?.role));
  const scope: ProgramScope = { orgId, branchId };
  const [tab, setTab] = useState<"program" | "rewards" | "members" | "overview">("program");

  return (
    <div className="space-y-4">
      <PaneHeader
        title={t("nav.loyalty", "Loyalty")}
        description={t(
          "loyalty.subtitle",
          "Points or stamps, the rewards they buy, and the code that signs people up.",
        )}
      />

      <SignUpCode
        scope={scope}
        branchName={activeBranches.find((b) => b.id === branchId)?.name ?? null}
      />

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: "program", label: t("loyalty.tabProgram", "Program") },
          { value: "rewards", label: t("loyalty.tabRewards", "Rewards") },
          { value: "members", label: t("loyalty.tabMembers", "Members") },
          ...(canListMembers
            ? [{ value: "overview" as const, label: t("loyalty.tabOverview", "Overview") }]
            : []),
        ]}
      />

      <div className="pt-1">
        {/* Keyed on the scope so switching branch remounts the form rather
            than leaving the previous branch's numbers on screen. */}
        {tab === "program" ? <ProgramPane key={branchId ?? "org"} scope={scope} /> : null}
        {tab === "rewards" ? <RewardsPane key={branchId ?? "org"} scope={scope} /> : null}
        {tab === "members" ? <MembersPane scope={scope} /> : null}
        {tab === "overview" && canListMembers ? (
          <OverviewPane key={branchId ?? "org"} scope={scope} />
        ) : null}
      </div>
    </div>
  );
}
