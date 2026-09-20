/**
 * A customer's loyalty card: what they hold, how they got it, and where it went.
 * It is a section of the one customer sheet (`features/customers`), not a sheet
 * of its own — a member IS a customer, under the same id.
 *
 * The ledger is the member's whole story and the shop's audit trail at once —
 * earns, redemptions, void and refund reversals, gifts and hand adjustments,
 * each with its branch, its order and (for an adjustment) the reason typed.
 * A row a later reversal undoes is struck through, so a voided sale reads as
 * one event rather than two unrelated movements.
 *
 * The one write that creates value from nothing is an adjustment, so it is
 * gated on its own capability here and by the server.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Receipt, SlidersHorizontal, Wallet } from "lucide-react";

import { StatusPill, type StatusTone } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/app/empty-state";
import { useListBranches } from "@/data/api/generated/api";
import type { LedgerEntry, MemberDetail, MemberView } from "@/data/api/generated/models";
import { useOrgId } from "@/hooks/use-org-id";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { LoyaltyAccess } from "../../shared/access";
import { currencyLabel } from "../../shared/util";
import { AdjustDialog } from "./adjust-dialog";
import { DeleteMemberButton } from "./delete-member-dialog";
import { GoogleObjectDialog } from "./google-object-dialog";
import { ledgerActor, ledgerLabel, ledgerTone, reversedIds, signed, type LedgerTone } from "./ledger";

const TONE: Record<LedgerTone, StatusTone> = {
  earn: "success",
  spend: "accent",
  reversal: "danger",
  gift: "warning",
  manual: "neutral",
};

export function MemberSection({
  detail,
  branchId,
  access,
  readOnly = false,
  onOpenOrder,
  onForgotten,
}: {
  detail: MemberDetail;
  /** The branch an adjustment defaults to (the scope the list was opened under). */
  branchId: string | null;
  access: Pick<LoyaltyAccess, "canAdjust" | "canForget" | "canInspectWallet">;
  /** Opened from somewhere that only looks (an order): no actions at all. */
  readOnly?: boolean;
  onOpenOrder: (orderId: string) => void;
  /** The member was deleted — and with it the person; close whatever shows them. */
  onForgotten: () => void;
}) {
  const { t } = useTranslation();
  const { member, ledger } = detail;
  const canAdjust = access.canAdjust && !readOnly;
  const canForget = access.canForget && !readOnly;
  const canInspect = access.canInspectWallet && !readOnly;
  const [adjusting, setAdjusting] = useState(false);
  const [inspecting, setInspecting] = useState(false);

  const orgId = useOrgId() ?? "";
  const branches = useListBranches({ org_id: orgId }, { query: { enabled: !!orgId && canAdjust } });
  const activeBranches = useMemo(
    () => (branches.data ?? []).filter((b) => b.is_active).map((b) => ({ id: b.id, name: b.name })),
    [branches.data],
  );

  return (
    <div className="space-y-4">
      <MemberSummary member={member} />

      {canAdjust || canForget || canInspect ? (
        <div className="flex flex-wrap gap-2">
          {canAdjust ? (
            <Button variant="outline" size="sm" onClick={() => setAdjusting(true)}>
              <SlidersHorizontal className="size-4" />
              {t("loyalty.adjustTitle", "Adjust balance")}
            </Button>
          ) : null}
          {canInspect ? (
            <Button variant="outline" size="sm" onClick={() => setInspecting(true)}>
              <Wallet className="size-4" />
              {t("loyalty.googleObject", "Google Wallet object")}
            </Button>
          ) : null}
          {canForget ? <DeleteMemberButton member={member} onDeleted={onForgotten} /> : null}
        </div>
      ) : null}

      <LedgerTable entries={ledger} onOpenOrder={onOpenOrder} />
      {ledger.length >= 200 ? (
        <p className="text-xs text-muted-foreground">
          {t("loyalty.ledgerTruncated", "Showing the latest 200 movements.")}
        </p>
      ) : null}

      {canAdjust ? (
        <AdjustDialog
          member={member}
          branches={activeBranches}
          defaultBranchId={branchId}
          open={adjusting}
          onOpenChange={setAdjusting}
        />
      ) : null}
      {canInspect ? (
        <GoogleObjectDialog
          memberId={inspecting ? member.id : null}
          memberName={member.name}
          onOpenChange={(o) => !o && setInspecting(false)}
        />
      ) : null}
    </div>
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
                    <StatusPill tone={TONE[tone]} size="sm">
                      {ledgerLabel(e, t)}
                    </StatusPill>
                    {isUndone ? (
                      <span className="text-xs text-muted-foreground">
                        {t("loyalty.ledgerUndone", "reversed")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground" data-testid="ledger-actor">
                    {ledgerActor(e, t)}
                  </p>
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
                      className="mt-0.5 inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
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
