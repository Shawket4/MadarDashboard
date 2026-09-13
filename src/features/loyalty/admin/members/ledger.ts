/**
 * Reading a member's ledger aloud.
 *
 * The server says what a row IS (`kind`) and what CAUSED it (`source`); this
 * turns the pair into the sentence a manager needs — "Refund clawback",
 * "Reward redeemed", "Manual adjustment" — and marks which rows have since
 * been undone, so a voided sale does not read as two unrelated movements.
 */
import type { TFunction } from "i18next";

import type { LedgerEntry } from "@/data/api/generated/models";

export type LedgerTone = "earn" | "spend" | "reversal" | "gift" | "manual";

export function ledgerTone(e: Pick<LedgerEntry, "kind" | "source">): LedgerTone {
  if (e.kind.startsWith("reverse_")) return "reversal";
  if (e.source === "manual") return "manual";
  if (e.source === "birthday" || e.source === "winback") return "gift";
  if (e.kind === "redeem") return "spend";
  return "earn";
}

export function ledgerLabel(e: Pick<LedgerEntry, "kind" | "source">, t: TFunction): string {
  const reversal = e.kind.startsWith("reverse_");
  if (reversal) {
    const what = e.kind.slice("reverse_".length);
    if (e.source === "refund") {
      return what === "redeem"
        ? t("loyalty.ledger.refundRedeem", "Reward returned (refund)")
        : t("loyalty.ledger.refundEarn", "Refund clawback");
    }
    if (e.source === "void") {
      return what === "redeem"
        ? t("loyalty.ledger.voidRedeem", "Reward returned (void)")
        : what === "adjust"
          ? t("loyalty.ledger.voidAdjust", "Adjustment reversed (void)")
          : t("loyalty.ledger.voidEarn", "Earn reversed (void)");
    }
    return t("loyalty.ledger.reversal", "Reversal");
  }
  switch (e.source) {
    case "sale":
      return t("loyalty.ledger.sale", "Earned on a sale");
    case "redemption":
      return t("loyalty.ledger.redemption", "Reward redeemed");
    case "birthday":
      return t("loyalty.ledger.birthday", "Birthday gift");
    case "winback":
      return t("loyalty.ledger.winback", "Win-back gift");
    case "manual":
      return t("loyalty.ledger.manual", "Manual adjustment");
    default:
      return e.kind;
  }
}

/** Ids of rows that a later reversal undoes. */
export const reversedIds = (entries: Pick<LedgerEntry, "reverses_id">[]): Set<string> =>
  new Set(entries.map((e) => e.reverses_id).filter((id): id is string => !!id));

/** "+12" / "−5" with a real minus sign, so it reads right in either direction. */
export const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
