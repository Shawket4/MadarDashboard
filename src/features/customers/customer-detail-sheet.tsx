/**
 * One person, whole: who they are, what they have spent, their loyalty card,
 * where their orders go, their recent orders — and, for someone who may, edit,
 * merge and erase.
 *
 * A loyalty member IS a customer under the same id, so this is also the member
 * sheet: the Members tab, an order's member link and the Customers page all
 * open it by that one id. Each section follows its own capability family:
 *
 *  - `customers.view` reads the customer (identity, stats, orders);
 *  - `customers.addresses.view` reads their saved addresses, and only it does;
 *  - `loyalty.members.list` / `loyalty.read` reads the card (balance, ledger);
 *  - someone holding only the loyalty side sees exactly the old member sheet.
 */
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eraser, GitMerge, Pencil, Receipt, Star } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEraseCustomer, useGetCustomer, useGetLoyaltyMember } from "@/data/api/generated/api";
import type { Customer, CustomerDetail, CustomerOrder } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { MemberSection } from "@/features/loyalty/admin/members/member-section";
import { fmtDate, fmtDateTime, fmtMoney, fmtNumber } from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/phone";

import { peopleAccess } from "./access";
import { AddressesSection } from "./addresses-section";
import { CustomerDialog } from "./customer-dialog";
import { MergeDialog } from "./merge-dialog";
import { formatBirthday, isPersonQuery, isSource } from "./util";

export function CustomerDetailSheet({
  customerId,
  branchId = null,
  readOnly = false,
  onOpenChange,
  onOpenOrder,
  onSwitch,
}: {
  customerId: string | null;
  /** The branch whose program the balance is read under; null = the organisation's. */
  branchId?: string | null;
  /** Opened from somewhere that only looks (an order): no edit, merge, erase, adjust or delete. */
  readOnly?: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenOrder: (orderId: string) => void;
  /** After a merge, the sheet follows the customer that was kept. */
  onSwitch?: (customerId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const side = i18n.dir() === "rtl" ? "left" : "right";
  const access = peopleAccess(useAuthz());
  const canEdit = access.canEdit && !readOnly;
  const canMerge = access.canMerge && !readOnly;
  // PDPL erase is its own capability: the owner's by default, never a manager's.
  const canErase = access.canErase && !readOnly;
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [merging, setMerging] = useState(false);
  const erase = useEraseCustomer();

  const detail = useGetCustomer(customerId ?? "", { query: { enabled: !!customerId && access.canViewCustomers } });
  const customer = access.canViewCustomers ? detail.data?.customer : undefined;
  // After a merge the id that was opened resolves to the one that was kept;
  // the card, if there is one, lives under the kept id.
  const personId = customer?.id ?? customerId;

  // The card: asked for once the customer says there is one — or straight away
  // by someone who can only see the loyalty side.
  const wantsCard = access.canViewMember && (access.canViewCustomers ? customer?.is_member === true : true);
  const card = useGetLoyaltyMember(personId ?? "", branchId ? { branch_id: branchId } : undefined, {
    query: { enabled: !!personId && wantsCard, retry: false },
  });

  const primary = access.canViewCustomers ? detail : card;
  const name = customer?.name ?? card.data?.member.name;
  const phone = customer?.phone ?? card.data?.member.phone;
  const isMember = customer ? customer.is_member === true : !!card.data;

  const doErase = async () => {
    if (!customer) return;
    const ok = await confirm({
      title: t("customers.eraseTitle", { defaultValue: "Erase {{name}}?", name: customer.name }),
      description: t(
        "customers.eraseBody",
        "Their name, phone, birthday and notes are wiped for good and they leave the customer list (PDPL). It reaches everywhere they appear: the name and phone typed on their orders, deliveries, bookings and open bills, their saved addresses and their phone history. If they hold a loyalty card, the membership and the wallet card are removed too and any unspent balance is lost. Order totals, items and the points ledger stay, without their details. This can't be undone.",
      ),
      confirmLabel: t("customers.erase", "Erase customer"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await erase.mutateAsync({ id: customer.id });
      toast.success(t("customers.erased", "Customer erased"));
      await qc.invalidateQueries({ predicate: isPersonQuery });
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Sheet open={!!customerId} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            <span dir="auto">{name ?? t("customers.customer", "Customer")}</span>
            {isMember ? (
              <StatusPill tone="accent" size="sm" icon={Star}>
                {t("customers.member", "Member")}
              </StatusPill>
            ) : null}
          </SheetTitle>
          <SheetDescription>
            {phone ? (
              <bdi dir="ltr" className="font-mono">
                {formatPhoneDisplay(phone)}
              </bdi>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {primary.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : primary.isError || !primary.data ? (
            <EmptyState
              title={
                access.canViewCustomers
                  ? t("customers.loadFailed", "Couldn't load this customer")
                  : t("loyalty.memberLoadFailed", "Couldn't load this member")
              }
              description={primary.error ? getErrorMessage(primary.error) : undefined}
              action={
                <Button variant="outline" onClick={() => void primary.refetch()}>
                  {t("common.retry", "Retry")}
                </Button>
              }
            />
          ) : (
            <>
              {detail.data && customer ? (
                <>
                  {detail.data.resolved_from ? (
                    <p role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
                      {t("customers.resolvedFrom", "The customer you opened was merged into this one.")}
                    </p>
                  ) : null}

                  <CustomerStats customer={customer} />

                  {canEdit || canMerge || canErase ? (
                    <div className="flex flex-wrap gap-2">
                      {canEdit ? (
                        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                          <Pencil className="size-4" />
                          {t("common.edit", "Edit")}
                        </Button>
                      ) : null}
                      {canMerge ? (
                        <Button variant="outline" size="sm" onClick={() => setMerging(true)}>
                          <GitMerge className="size-4" />
                          {t("customers.mergeInto", "Merge into…")}
                        </Button>
                      ) : null}
                      {canErase ? (
                        <Button variant="outline" size="sm" className="text-destructive" loading={erase.isPending} onClick={() => void doErase()}>
                          <Eraser className="size-4" />
                          {t("customers.erase", "Erase customer")}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  <Identity detail={detail.data} />
                </>
              ) : null}

              {wantsCard ? (
                <Section title={t("customers.loyalty", "Loyalty")}>
                  {card.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : card.data ? (
                    <MemberSection
                      detail={card.data}
                      branchId={branchId}
                      access={access}
                      readOnly={readOnly}
                      onOpenOrder={onOpenOrder}
                      // They left the programme and are still a customer: the sheet stays
                      // for someone who can see the customer, and closes for someone who
                      // could only ever see the card.
                      onForgotten={() => {
                        if (!access.canViewCustomers) onOpenChange(false);
                      }}
                    />
                  ) : (
                    <EmptyState
                      title={t("loyalty.memberLoadFailed", "Couldn't load this member")}
                      description={card.error ? getErrorMessage(card.error) : undefined}
                      action={
                        <Button variant="outline" onClick={() => void card.refetch()}>
                          {t("common.retry", "Retry")}
                        </Button>
                      }
                    />
                  )}
                </Section>
              ) : null}

              {detail.data && customer ? (
                <>
                  {access.canViewAddresses ? <AddressesSection customerId={customer.id} /> : null}
                  <RecentOrders orders={detail.data.recent_orders} onOpenOrder={onOpenOrder} />
                  {canEdit ? <CustomerDialog open={editing} onOpenChange={setEditing} customer={customer} /> : null}
                  {canMerge ? (
                    <MergeDialog
                      open={merging}
                      onOpenChange={setMerging}
                      duplicate={customer}
                      onMerged={(kept) => onSwitch?.(kept.customer.id)}
                    />
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function CustomerStats({ customer: c }: { customer: Customer }) {
  const { t } = useTranslation();
  const stat = (label: string, value: string) => (
    <div className="rounded-lg border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono text-lg font-semibold tabular">{value}</dd>
    </div>
  );
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stat(t("customers.orders", "Orders"), fmtNumber(c.orders_count))}
      {stat(t("customers.totalSpent", "Total spent"), fmtMoney(c.total_spent))}
      {stat(t("customers.lastVisit", "Last visit"), c.last_order_at ? fmtDate(c.last_order_at) : "—")}
      {stat(t("customers.since", "Customer since"), fmtDate(c.created_at))}
    </dl>
  );
}

/** Who they are. Read-only here — Edit changes name, phone and notes. */
function Identity({ detail }: { detail: CustomerDetail }) {
  const { t, i18n } = useTranslation();
  const c = detail.customer;
  const birthday = formatBirthday(c.birth_month, c.birth_day, i18n.language);
  const unknown = <span className="text-muted-foreground">{t("customers.notGiven", "Not given")}</span>;
  const row = (label: string, value: ReactNode) => (
    <div className="flex items-baseline justify-between gap-4 px-3 py-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-end">{value}</dd>
    </div>
  );
  return (
    <Section title={t("customers.details", "Details")}>
      <dl className="divide-y rounded-lg border text-sm">
        {row(t("customers.phone", "Phone"), c.phone ? <bdi dir="ltr" className="font-mono">{formatPhoneDisplay(c.phone)}</bdi> : unknown)}
        {row(
          t("customers.language", "Language"),
          c.locale === "ar" ? t("customers.languageAr", "Arabic") : c.locale === "en" ? t("customers.languageEn", "English") : unknown,
        )}
        {row(t("customers.birthday", "Birthday"), birthday ?? unknown)}
        {row(t("customers.source.label", "Came from"), isSource(c.source) ? t(`customers.source.${c.source}`) : unknown)}
        {row(
          t("customers.marketing", "Offers and greetings"),
          c.marketing_opt_out ? t("customers.marketingOff", "Opted out") : t("customers.marketingOn", "Allowed"),
        )}
      </dl>
      <p className="text-xs text-muted-foreground">
        {t("customers.marketingNote", "Only the customer can change whether they get offers, from their loyalty card page.")}
      </p>
      {c.notes ? (
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{t("customers.notes", "Notes")}</p>
          <p dir="auto" className="whitespace-pre-wrap text-sm">{c.notes}</p>
        </div>
      ) : null}
      {detail.merged_from.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("customers.mergedFrom", { defaultValue: "Merged duplicates: {{n}}", n: detail.merged_from.length })}
        </p>
      ) : null}
    </Section>
  );
}

export function RecentOrders({ orders, onOpenOrder }: { orders: CustomerOrder[]; onOpenOrder: (id: string) => void }) {
  const { t } = useTranslation();
  if (orders.length === 0) {
    return <EmptyState icon={Receipt} title={t("customers.noOrders", "No orders yet")} />;
  }
  return (
    <Section title={t("customers.recentOrders", "Recent orders")}>
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
    </Section>
  );
}
