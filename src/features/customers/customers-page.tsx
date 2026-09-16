/**
 * Customers: the people the tills attach to orders. Search by name or phone,
 * see what each has spent, open one to edit, merge a duplicate or erase (PDPL).
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search, Users } from "lucide-react";
import { keepPreviousData } from "@tanstack/react-query";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { Restricted } from "@/components/app/restricted";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListCustomers } from "@/data/api/generated/api";
import type { Customer } from "@/data/api/generated/models";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { OrderDetailSheet } from "@/features/orders/order-detail-sheet";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";

import { CustomerDetailSheet } from "./customer-detail-sheet";
import { CustomerDialog } from "./customer-dialog";
import { LIMIT_MAX, PAGE_SIZE, useDebouncedValue } from "./util";

export function CustomersPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const canView = authz.can(Cap.customersView);
  const canCreate = authz.can(Cap.customersCreate);
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const [pages, setPages] = useState(1);
  const [adding, setAdding] = useState(false);
  const [openCustomer, setOpenCustomer] = useState<string | null>(null);
  const [openOrder, setOpenOrder] = useState<string | null>(null);

  // "Load more" widens the window from the top; a new search starts over.
  const [lastQ, setLastQ] = useState(q);
  if (lastQ !== q) {
    setLastQ(q);
    setPages(1);
  }
  const limit = Math.min(PAGE_SIZE * pages, LIMIT_MAX);
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
      <DataTable
        columns={columns}
        data={rows}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => void list.refetch()}
        getRowId={(c) => c.id}
        onRowClick={(c) => setOpenCustomer(c.id)}
        hideViewOptions
        loadMore={{
          hasMore: rows.length >= limit && limit < LIMIT_MAX,
          loading: list.isFetching,
          onLoadMore: () => setPages((p) => p + 1),
        }}
        toolbar={
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("customers.searchPlaceholder", "Search by name or phone")}
              aria-label={t("customers.searchPlaceholder", "Search by name or phone")}
              className="ps-9"
            />
          </div>
        }
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
      <OrderDetailSheet orderId={openOrder} open={!!openOrder} onOpenChange={(o) => !o && setOpenOrder(null)} />
    </Page>
  );
}
