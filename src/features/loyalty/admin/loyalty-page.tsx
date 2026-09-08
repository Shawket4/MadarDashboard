/**
 * The loyalty admin screen: pick a scope, then edit its programme, its rewards
 * or look at its members.
 *
 * The scope is owned here and passed down, rather than each pane deriving its
 * own — three panes independently deciding what "this branch" meant is how one
 * of them ended up showing the organisation's rewards next to a branch's rules.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Page, PageHeader } from "@/components/app/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/data/stores/auth.store";

import { MembersPane } from "./members/members-pane";
import { ProgramPane } from "./program/program-pane";
import { RewardsPane } from "./rewards/rewards-pane";
import { SignUpCode } from "./sign-up-code";
import type { ProgramScope } from "./use-program";

export function LoyaltyPage() {
  const { t } = useTranslation();
  const orgId = useAuthStore((s) => s.user?.org_id) ?? "";
  const [branchId, setBranchId] = useState<string | null>(null);
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

      <SignUpCode scope={scope} onScopeChange={setBranchId} />

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
