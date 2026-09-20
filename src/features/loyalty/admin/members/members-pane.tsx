/**
 * The members of the program: the one customers list, locked to members.
 *
 * A member is a customer under the same id, so there is no second list to keep
 * in step — search, paging, export and the sheet a row opens are the Customers
 * page's. The tab still follows `loyalty.members.list`, as it always did.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/app/empty-state";
import { useAuthz } from "@/data/authz/use-authz";
import { CustomersList } from "@/features/customers/customers-list";

import { loyaltyAccess } from "../../shared/access";
import type { ProgramScope } from "../use-program";

export function MembersPane({ scope }: { scope: ProgramScope }) {
  const { t } = useTranslation();
  const { canListMembers } = loyaltyAccess(useAuthz());
  const [openMember, setOpenMember] = useState<string | null>(null);

  if (!canListMembers) {
    return (
      <EmptyState
        title={t("loyalty.membersRestricted", "Members are for managers")}
        description={t("loyalty.membersRestrictedHint", "Scan or look up the customer in front of you at the till.")}
      />
    );
  }
  return <CustomersList membersOnly branchId={scope.branchId} openId={openMember} onOpenIdChange={setOpenMember} />;
}
