/**
 * Rewards › Programme: the rules (the existing programme form), the stamp
 * tracks, the reward catalogue and the join codes, one tab each, the tab in
 * the URL. This is what Settings › Loyalty was (it redirects here); the panes
 * are the same components.
 *
 * The scope is the header's: "All branches" is the organisation's own row,
 * a branch is that branch's override, as before. Tracks belong to the shop.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Page, PageHeader } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Restricted } from "@/components/app/restricted";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useListBranches } from "@/data/api/generated/api";
import { useAuthz } from "@/data/authz/use-authz";
import { useListFilters } from "@/data/scope/use-list-filters";
import { useScope } from "@/data/scope/use-scope";
import { ProgramPane } from "@/features/loyalty/admin/program/program-pane";
import { RewardsPane } from "@/features/loyalty/admin/rewards/rewards-pane";
import { SignUpCode } from "@/features/loyalty/admin/sign-up-code";
import { useIsStandaloneLoyalty } from "@/hooks/use-plan";
import { useOrgId } from "@/hooks/use-org-id";

import { rewardsAccess } from "../access";
import { rewardsProgrammeSearch } from "../search";

export function RewardsProgrammePage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const access = rewardsAccess(authz);
  const orgId = useOrgId() ?? "";
  const { branchId } = useScope();
  const standalone = useIsStandaloneLoyalty();
  const { values, set } = useListFilters(rewardsProgrammeSearch);
  // A stamp card sold on its own has no reward catalogue to edit.
  const tab = values.tab === "rewards" && standalone ? "programme" : values.tab;
  const branches = useListBranches({ org_id: orgId }, { query: { enabled: !!orgId } });
  const branchName = useMemo(
    () => (branches.data ?? []).find((b) => b.is_active && b.id === branchId)?.name ?? null,
    [branches.data, branchId],
  );
  const scope = { orgId, branchId };

  if (authz.ready && !access.canReadProgram && !access.canEditProgram) {
    return (
      <Restricted
        title={t("rewards.programme.title", "Programme")}
        who={t("rewards.common.noAccess", "Your account can't open this page. The owner can give you access.")}
      />
    );
  }

  return (
    <Page width="form">
      <Tabs value={tab} onValueChange={(v) => set({ tab: v as typeof tab })} className="gap-6">
        <PageHeader
          title={t("rewards.programme.title", "Programme")}
          subtitle={t("rewards.programme.subtitle", "What customers collect, the rewards they earn, and the code that signs them up.")}
          below={
            <PageTabsList prefetch="tab">
              <PageTabsTrigger value="programme" className="first:ps-0">
                {t("rewards.programme.tabProgramme", "Programme")}
              </PageTabsTrigger>
              <PageTabsTrigger value="tracks">{t("rewards.programme.tabTracks", "Stamp tracks")}</PageTabsTrigger>
              {standalone ? null : <PageTabsTrigger value="rewards">{t("rewards.programme.tabRewards", "Rewards")}</PageTabsTrigger>}
              <PageTabsTrigger value="codes">{t("rewards.programme.tabCodes", "Join codes")}</PageTabsTrigger>
            </PageTabsList>
          }
        />
        {/* Keyed on the scope: switching branch remounts the form rather than
            leaving the previous branch's numbers on screen. */}
        <TabsContent value="programme">
          <ProgramPane key={branchId ?? "org"} scope={scope} cards={["basics", "collecting"]} />
        </TabsContent>
        <TabsContent value="tracks">
          <TracksEditor />
        </TabsContent>
        {standalone ? null : (
          <TabsContent value="rewards">
            <RewardsPane key={branchId ?? "org"} scope={scope} />
          </TabsContent>
        )}
        <TabsContent value="codes">
          <SignUpCode scope={scope} branchName={branchName} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

// TEMP until tracks-editor.tsx lands.
function TracksEditor() {
  return null;
}
