/**
 * One customer: who they are, what they have spent, their recent orders, and
 * (for someone who may edit) edit and merge into another; PDPL erase needs customers.erase.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eraser, GitMerge, Pencil, Receipt, Star } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEraseCustomer, useGetCustomer, useGetLoyaltyMember } from "@/data/api/generated/api";
import type { CustomerDetail, CustomerOrder } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { fmtDate, fmtDateTime, fmtMoney, fmtNumber } from "@/lib/format";

import { CustomerDialog } from "./customer-dialog";
import { MergeDialog } from "./merge-dialog";
import { isCustomersQuery } from "./util";

export function CustomerDetailSheet({
  customerId,
  onOpenChange,
  onOpenOrder,
  onSwitch,
}: {
  customerId: string | null;
  onOpenChange: (open: boolean) => void;
  onOpenOrder: (orderId: string) => void;
  /** After a merge, the sheet follows the customer that was kept. */
  onSwitch: (customerId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const side = i18n.dir() === "rtl" ? "left" : "right";
  const authz = useAuthz();
  const canEdit = authz.can(Cap.customersEdit);
  // PDPL erase is its own capability: the owner's by default, never a manager's.
  const canErase = authz.can(Cap.customersErase);
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [merging, setMerging] = useState(false);
  const erase = useEraseCustomer();

  const detail = useGetCustomer(customerId ?? "", { query: { enabled: !!customerId } });
  const customer = detail.data?.customer;

  const doErase = async () => {
    if (!customer) return;
    const ok = await confirm({
      title: t("customers.eraseTitle", { defaultValue: "Erase {{name}}?", name: customer.name }),
      description: t(
        "customers.eraseBody",
        "Their name, phone and notes are wiped for good and they leave the customer list (PDPL). Past orders stay, without their details. This can't be undone.",
      ),
      confirmLabel: t("customers.erase", "Erase customer"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await erase.mutateAsync({ id: customer.id });
      toast.success(t("customers.erased", "Customer erased"));
      await qc.invalidateQueries({ predicate: isCustomersQuery });
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Sheet open={!!customerId} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{customer?.name ?? t("customers.customer", "Customer")}</SheetTitle>
          <SheetDescription>
            {customer?.phone ? (
              <span dir="ltr" className="font-mono">
                {customer.phone}
              </span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {detail.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : detail.isError || !customer || !detail.data ? (
            <EmptyState
              title={t("customers.loadFailed", "Couldn't load this customer")}
              description={detail.error ? getErrorMessage(detail.error) : undefined}
              action={
                <Button variant="outline" onClick={() => void detail.refetch()}>
                  {t("common.retry", "Retry")}
                </Button>
              }
            />
          ) : (
            <>
              {detail.data.resolved_from ? (
                <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
                  {t("customers.resolvedFrom", "The customer you opened was merged into this one.")}
                </p>
              ) : null}

              <CustomerSummary detail={detail.data} canSeeLoyalty={authz.canAny(Cap.loyaltyMembersList, Cap.loyaltyRead)} />

              {canEdit || canErase ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        <Pencil className="size-4" />
                        {t("common.edit", "Edit")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setMerging(true)}>
                        <GitMerge className="size-4" />
                        {t("customers.mergeInto", "Merge into…")}
                      </Button>
                    </>
                  ) : null}
                  {canErase ? (
                    <Button variant="outline" size="sm" className="text-destructive" loading={erase.isPending} onClick={() => void doErase()}>
                      <Eraser className="size-4" />
                      {t("customers.erase", "Erase customer")}
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <RecentOrders orders={detail.data.recent_orders} onOpenOrder={onOpenOrder} />

              {canEdit ? (
                <>
                  <CustomerDialog open={editing} onOpenChange={setEditing} customer={customer} />
                  <MergeDialog
                    open={merging}
                    onOpenChange={setMerging}
                    duplicate={customer}
                    onMerged={(kept) => onSwitch(kept.customer.id)}
                  />
                </>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CustomerSummary({ detail, canSeeLoyalty }: { detail: CustomerDetail; canSeeLoyalty: boolean }) {
  const { t } = useTranslation();
  const c = detail.customer;
  const loyaltyId = c.loyalty_customer_id ?? null;
  const member = useGetLoyaltyMember(loyaltyId ?? "", undefined, {
    query: { enabled: !!loyaltyId && canSeeLoyalty, retry: false },
  });
  const stat = (label: string, value: string) => (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-semibold tabular">{value}</p>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stat(t("customers.orders", "Orders"), fmtNumber(c.orders_count))}
        {stat(t("customers.totalSpent", "Total spent"), fmtMoney(c.total_spent))}
        {stat(t("customers.lastVisit", "Last visit"), c.last_order_at ? fmtDate(c.last_order_at) : "—")}
        {stat(t("customers.since", "Customer since"), fmtDate(c.created_at))}
      </div>
      {c.notes ? (
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{t("customers.notes", "Notes")}</p>
          <p className="whitespace-pre-wrap text-sm">{c.notes}</p>
        </div>
      ) : null}
      {loyaltyId ? (
        <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
          <Star className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t("customers.loyaltyLink", "Loyalty member")}</span>
          {member.data?.member ? (
            <span className="font-medium">{member.data.member.name}</span>
          ) : (
            <bdi dir="ltr" className="font-mono text-xs">
              {loyaltyId}
            </bdi>
          )}
        </div>
      ) : null}
      {detail.merged_from.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("customers.mergedFrom", {
            defaultValue: "Merged duplicates: {{n}}",
            n: detail.merged_from.length,
          })}
        </p>
      ) : null}
    </div>
  );
}

export function RecentOrders({ orders, onOpenOrder }: { orders: CustomerOrder[]; onOpenOrder: (id: string) => void }) {
  const { t } = useTranslation();
  if (orders.length === 0) {
    return <EmptyState icon={Receipt} title={t("customers.noOrders", "No orders yet")} />;
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("customers.recentOrders", "Recent orders")}</h3>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("customers.order", "Order")}</TableHead>
              <TableHead>{t("customers.branch", "Branch")}</TableHead>
              <TableHead>{t("common.status", "Status")}</TableHead>
              <TableHead className="text-end">{t("common.total", "Total")}</TableHead>
              <TableHead className="text-end">{t("common.date", "Date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} data-testid="customer-order-row">
                <TableCell>
                  <Button variant="link" size="sm" className="h-auto p-0 font-mono" onClick={() => onOpenOrder(o.id)}>
                    {o.order_ref ?? o.id.slice(0, 8)}
                  </Button>
                </TableCell>
                <TableCell>{o.branch_name ?? "—"}</TableCell>
                <TableCell>{t(`orderStatus.${o.status}`, { defaultValue: o.status })}</TableCell>
                <TableCell className="text-end font-mono tabular">{fmtMoney(o.total_amount)}</TableCell>
                <TableCell className="text-end">{fmtDateTime(o.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
