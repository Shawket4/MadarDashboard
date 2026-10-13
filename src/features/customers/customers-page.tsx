/**
 * Customers: everybody the shop knows — added at a till, met through an online
 * order or a booking, or joined the loyalty program. Search, filter by where
 * they came from or to members, open one for the whole picture.
 *
 * The list itself is `CustomersList`; Loyalty → Members draws the same one,
 * locked to members.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { Restricted } from "@/components/app/restricted";
import { Button } from "@/components/ui/button";
import { useAuthz } from "@/data/authz/use-authz";

import { peopleAccess } from "./access";
import { CustomerDialog } from "./customer-dialog";
import { CustomersList } from "./customers-list";
import { customersSearch } from "./search";
import { useListFilters } from "@/data/scope/use-list-filters";

export function CustomersPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const { canViewCustomers, canCreate } = peopleAccess(authz);
  const [adding, setAdding] = useState(false);
  // Search and filters live in the URL (./search.ts) and are restored on return.
  const filters = useListFilters(customersSearch);
  const [openCustomer, setOpenCustomer] = useState<string | null>(null);

  if (authz.ready && !canViewCustomers) {
    return (
      <Restricted
        title={t("nav.customers", "Customers")}
        who={t("customers.noAccess", "Only people who can see customers can open this page.")}
      />
    );
  }

  return (
    <Page>
      <PageHeader
        title={t("customers.title", "Customers")}
        description={t("customers.subtitle", "Everyone your shop knows: where they came from, what they spent and when they last came.")}
        actions={
          canCreate ? (
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              {t("customers.add", "Add customer")}
            </Button>
          ) : null
        }
      />
      <CustomersList openId={openCustomer} onOpenIdChange={setOpenCustomer} filters={filters} />
      {canCreate ? (
        <CustomerDialog open={adding} onOpenChange={setAdding} onSaved={(d) => setOpenCustomer(d.customer.id)} />
      ) : null}
    </Page>
  );
}
