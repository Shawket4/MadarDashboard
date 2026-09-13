/**
 * One member: what they hold, how they got it, and where it went.
 *
 * The ledger is the member's whole story and the shop's audit trail at once —
 * earns, redemptions, void and refund reversals, gifts and hand adjustments,
 * each with its branch, its order and (for an adjustment) the reason typed.
 * A row a later reversal undoes is struck through, so a voided sale reads as
 * one event rather than two unrelated movements.
 */
import { useTranslation } from "react-i18next";
import { Receipt, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/app/empty-state";
import { useGetLoyaltyMember } from "@/data/api/generated/api";
import type { LedgerEntry, MemberView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { currencyLabel } from "../../shared/util";
import { ledgerLabel, ledgerTone, reversedIds, signed, type LedgerTone } from "./ledger";

const TONE: Record<LedgerTone, string> = {
  earn: "bg-success/15",
  spend: "bg-primary/10",
  reversal: "bg-destructive/10",
  gift: "bg-warning/15",
  manual: "bg-muted",
};

export function MemberDetailSheet({
  memberId,
  branchId,
  canAdjust,
  onOpenChange,
  onAdjust,
  onOpenOrder,
}: {
  memberId: string | null;
  branchId: string | null;
  canAdjust: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjust: (member: MemberView) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const side = i18n.dir() === "rtl" ? "left" : "right";
  const detail = useGetLoyaltyMember(
    memberId ?? "",
    branchId ? { branch_id: branchId } : undefined,
    { query: { enabled: !!memberId } },
  );
  const member = detail.data?.member;
  const ledger = detail.data?.ledger ?? [];

  return (
    <Sheet open={!!memberId} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{member?.name ?? t("loyalty.member", "Member")}</SheetTitle>
          <SheetDescription>
            {member ? (
              <span dir="ltr" className="font-mono">
                {member.phone}
              </span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {detail.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : detail.isError || !member ? (
            <EmptyState
              title={t("loyalty.memberLoadFailed", "Couldn't load this member")}
              description={detail.error ? getErrorMessage(detail.error) : undefined}
              action={
                <Button variant="outline" onClick={() => void detail.refetch()}>
                  {t("common.retry", "Retry")}
                </Button>
              }
            />
          ) : (
            <>
              <MemberSummary member={member} />

              {canAdjust ? (
                <Button variant="outline" size="sm" onClick={() => onAdjust(member)}>
                  <SlidersHorizontal className="size-4" />
                  {t("loyalty.adjustTitle", "Adjust balance")}
                </Button>
              ) : null}

              <LedgerTable entries={ledger} onOpenOrder={onOpenOrder} />
              {ledger.length >= 200 ? (
                <p className="text-xs text-muted-foreground">
                  {t("loyalty.ledgerTruncated", "Showing the latest 200 movements.")}
                </p>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MemberSummary({ member }: { member: MemberView }) {
  const { t } = useTranslation();
  const other = member.mode === "visits" ? "points" : "visits";
  const otherBalance = member.mode === "visits" ? member.points_balance : member.visits_balance;
  const stat = (label: string, value: string) => (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-semibold tabular">{value}</p>
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stat(
          t("loyalty.balance", "Balance"),
          `${member.balance} ${currencyLabel(member.mode, member.balance)}`,
        )}
        {stat(
          t("loyalty.lifetime", "Lifetime"),
          String(member.mode === "visits" ? member.lifetime_visits : member.lifetime_points),
        )}
        {stat(t("loyalty.rewardsReady", "Rewards earned"), String(member.rewards_ready))}
        {stat(
          t("loyalty.progress", "To next reward"),
          `${member.points_to_next_reward} ${currencyLabel(member.mode, member.points_to_next_reward)}`,
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("loyalty.joinedOn", { defaultValue: "Joined {{date}}", date: fmtDate(member.enrolled_at) })}
        {otherBalance !== 0
          ? ` · ${t("loyalty.otherBalance", {
              defaultValue: "Also holds {{amount}} from before the program changed mode",
              amount: `${otherBalance} ${currencyLabel(other, otherBalance)}`,
            })}`
          : null}
      </p>
    </div>
  );
}

export function LedgerTable({
  entries,
  onOpenOrder,
}: {
  entries: LedgerEntry[];
  onOpenOrder: (orderId: string) => void;
}) {
  const { t } = useTranslation();
  if (entries.length === 0) {
    return (
      <EmptyState
        title={t("loyalty.noLedger", "No movements yet")}
        description={t("loyalty.noLedgerHint", "Earns, rewards and adjustments will show here.")}
      />
    );
  }
  const undone = reversedIds(entries);
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("loyalty.ledgerWhen", "When")}</TableHead>
            <TableHead>{t("loyalty.ledgerWhat", "What")}</TableHead>
            <TableHead className="text-end">{t("loyalty.ledgerAmount", "Amount")}</TableHead>
            <TableHead>{t("loyalty.ledgerWhere", "Branch / order")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => {
            const tone = ledgerTone(e);
            const isUndone = undone.has(e.id);
            return (
              <TableRow key={e.id} data-testid="ledger-row">
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {fmtDateTime(e.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className={cn("border-transparent text-foreground", TONE[tone])}>
                      {ledgerLabel(e, t)}
                    </Badge>
                    {isUndone ? (
                      <span className="text-xs text-muted-foreground">
                        {t("loyalty.ledgerUndone", "reversed")}
                      </span>
                    ) : null}
                  </div>
                  {e.reward_name ? <p className="mt-1 text-xs">{e.reward_name}</p> : null}
                  {e.note ? (
                    <p className="mt-1 text-xs text-muted-foreground" dir="auto">
                      “{e.note}”
                    </p>
                  ) : null}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-end font-mono tabular whitespace-nowrap",
                    isUndone && "text-muted-foreground line-through",
                  )}
                >
                  <span dir="ltr">{signed(e.points)}</span>{" "}
                  <span className="text-xs text-muted-foreground">{currencyLabel(e.currency, Math.abs(e.points))}</span>
                </TableCell>
                <TableCell className="text-xs">
                  <p>{e.branch_name ?? "—"}</p>
                  {e.order_id ? (
                    <button
                      type="button"
                      className="mt-0.5 inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                      onClick={() => onOpenOrder(e.order_id as string)}
                    >
                      <Receipt className="size-3" />
                      {t("loyalty.viewOrder", "View order")}
                    </button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
