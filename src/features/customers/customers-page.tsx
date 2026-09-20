/**
 * Customers: the people the tills attach to orders. Search by name or phone,
 * see what each has spent, open one to edit, merge a duplicate or erase (PDPL).
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Users } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { PeopleList } from "@/components/app/people-list";
import { Restricted } from "@/components/app/restricted";
import { Button } from "@/components/ui/button";
import { useListCustomers } from "@/data/api/generated/api";
import type { Customer } from "@/data/api/generated/models";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { OrderDetailSheet } from "@/features/orders/order-detail-sheet";
import { useListSearch } from "@/hooks/use-list-search";
import { useLoadMore } from "@/hooks/use-load-more";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";

import { CustomerDetailSheet } from "./customer-detail-sheet";
import { CustomerDialog } from "./customer-dialog";
import { LIMIT_MAX, PAGE_SIZE } from "./util";

export function CustomersPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const canView = authz.can(Cap.customersView);
  const canCreate = authz.can(Cap.customersCreate);
  const { search, setSearch, q } = useListSearch();
  const [adding, setAdding] = useState(false);
  const [openCustomer, setOpenCustomer] = useState<string | null>(null);
  const [openOrder, setOpenOrder] = useState<string | null>(null);

  // "Load more" widens the window from the top; a new search starts over.
  const more = useLoadMore({ resetKey: q, pageSize: PAGE_SIZE, max: LIMIT_MAX });
  const { limit } = more;
  const list = useListCustomers(
    { q: q || undefined, limit, offset: 0 },
    { query: { enabled: canView, placeholderData: keepPreviousData } },
  );
  const rows = list.data ?? [];

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("customers.name", "Name"),
        meta: { phone: "title", label: t("customers.name", "Name") },
        cell: ({ row }) => (
          <span className="font-medium" data-testid="customer-row">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: t("customers.phone", "Phone"),
        meta: { label: t("customers.phone", "Phone") },
        cell: ({ row }) =>
          row.original.phone ? (
            <bdi dir="ltr" className="font-mono text-sm">
              {row.original.phone}
            </bdi>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "orders_count",
        header: t("customers.orders", "Orders"),
        meta: { numeric: true, label: t("customers.orders", "Orders") },
        cell: ({ row }) => fmtNumber(row.original.orders_count),
      },
      {
        accessorKey: "total_spent",
        header: t("customers.totalSpent", "Total spent"),
        meta: { numeric: true, label: t("customers.totalSpent", "Total spent") },
        cell: ({ row }) => fmtMoney(row.original.total_spent),
      },
      {
        accessorKey: "last_order_at",
        header: t("customers.lastVisit", "Last visit"),
        meta: { numeric: true, label: t("customers.lastVisit", "Last visit") },
        cell: ({ row }) => (row.original.last_order_at ? fmtDate(row.original.last_order_at) : "—"),
      },
    ],
    [t],
  );

  if (authz.ready && !canView) {
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
        description={t("customers.subtitle", "The people your tills attach to orders: what they spent and when they last came.")}
        actions={
          canCreate ? (
            <Button onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              {t("customers.add", "Add customer")}
            </Button>
          ) : null
        }
      />
      <PeopleList
        columns={columns}
        data={rows}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => void list.refetch()}
        getRowId={(c) => c.id}
        onRowClick={(c) => setOpenCustomer(c.id)}
        hideViewOptions
        loadMore={more.props(rows.length, list.isFetching)}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t("customers.searchPlaceholder", "Search by name or phone"),
          className: "sm:max-w-xs",
        }}
        emptyState={
          <EmptyState
            icon={Users}
            title={q ? t("customers.emptySearch", "No customers match") : t("customers.empty", "No customers yet")}
            description={
              q
                ? t("customers.emptySearchHint", "Try another name or phone number.")
                : t("customers.emptyHint", "Customers added at the till or here appear in this list.")
            }
          />
        }
      />

      {canCreate ? (
        <CustomerDialog open={adding} onOpenChange={setAdding} onSaved={(d) => setOpenCustomer(d.customer.id)} />
      ) : null}
      <CustomerDetailSheet
        customerId={openCustomer}
        onOpenChange={(o) => !o && setOpenCustomer(null)}
        onOpenOrder={setOpenOrder}
        onSwitch={setOpenCustomer}
      />
      <OrderDetailSheet orderId={openOrder} open={!!openOrder} onOpenChange={(o) => !o && setOpenOrder(null)} onSwitchOrder={setOpenOrder} />
    </Page>
  );
}
