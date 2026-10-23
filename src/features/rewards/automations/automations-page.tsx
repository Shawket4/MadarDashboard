/**
 * Rewards › Automations: what the programme does on its own — birthday gifts,
 * win-back, the sign-up check, and the pass (terms, locations). The same
 * programme form as Rewards › Programme with its other cards; Save sends the
 * whole settings object, for the scope in the header.
 */
import { useTranslation } from "react-i18next";

import { Page, PageHeader } from "@/components/app/page";
import { Restricted } from "@/components/app/restricted";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { ProgramPane } from "@/features/loyalty/admin/program/program-pane";
import { useOrgId } from "@/hooks/use-org-id";

import { rewardsAccess } from "../access";

export function AutomationsPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const access = rewardsAccess(authz);
  const orgId = useOrgId() ?? "";
  const { branchId } = useScope();

  if (authz.ready && !access.canReadProgram && !access.canEditProgram) {
    return (
      <Restricted
        title={t("rewards.automations.title", "Automations")}
        who={t("rewards.common.noAccess", "Your account can't open this page. The owner can give you access.")}
      />
    );
  }

  return (
    <Page width="form">
      <div className="space-y-6">
        <PageHeader
          title={t("rewards.automations.title", "Automations")}
          subtitle={t(
            "rewards.automations.subtitle",
            "Birthday gifts (stamps, points or a free item), win-back nudges, the phone check at sign-up and what the pass says. They run by themselves once switched on.",
          )}
        />
        <ProgramPane key={branchId ?? "org"} scope={{ orgId, branchId }} cards={["signup", "passes"]} />
      </div>
    </Page>
  );
}
