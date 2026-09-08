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
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, PageHeader } from "@/components/app/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListBranches } from "@/data/api/generated/api";
import { useScope } from "@/data/scope/use-scope";
import { useOrgId } from "@/hooks/use-org-id";

import { MembersPane } from "./members/members-pane";
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

  // A shop with one branch has its scope PINNED to that branch by the header
  // picker — there is nothing else to select. Following that literally would
  // mean such a shop could only ever write a branch override, never the
  // organisation defaults every future branch inherits, and could never print
  // the org-wide sign-up code. So one branch reads as the whole shop, which is
  // also what it is.
  const singleBranch = activeBranches.length === 1;
  const branchId = singleBranch ? null : scopedBranchId;
  const scope: ProgramScope = { orgId, branchId };

  return (
    <Page>
      <PageHeader
        title={t("nav.loyalty", "Loyalty")}
        description={t(
          "loyalty.subtitle",
          "Points or stamps, the rewards they buy, and the code that signs people up.",
        )}
      />

      <SignUpCode
        scope={scope}
        branchName={activeBranches.find((b) => b.id === branchId)?.name ?? null}
        singleBranch={singleBranch}
      />

      <Tabs defaultValue="program">
        <TabsList>
          <TabsTrigger value="program">{t("loyalty.tabProgram", "Program")}</TabsTrigger>
          <TabsTrigger value="rewards">{t("loyalty.tabRewards", "Rewards")}</TabsTrigger>
          <TabsTrigger value="members">{t("loyalty.tabMembers", "Members")}</TabsTrigger>
        </TabsList>
        <TabsContent value="program" className="pt-4">
          {/* Keyed on the scope so switching branch remounts the form rather
              than leaving the previous branch's numbers on screen. */}
          <ProgramPane key={branchId ?? "org"} scope={scope} />
        </TabsContent>
        <TabsContent value="rewards" className="pt-4">
          <RewardsPane key={branchId ?? "org"} scope={scope} />
        </TabsContent>
        <TabsContent value="members" className="pt-4">
          <MembersPane scope={scope} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
