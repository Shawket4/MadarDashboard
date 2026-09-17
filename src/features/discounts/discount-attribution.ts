import type { TFunction } from "i18next";

/** The discount act a sale carried (`orders.discount_kind`). */
export type DiscountKind = "preset" | "manual_amount" | "manual_percent";

/** A label for a discount kind; `null`/unknown reads as "Not recorded". */
export function discountKindLabel(t: TFunction, kind: string | null | undefined): string {
  switch (kind) {
    case "preset":
      return t("discounts.kind.preset", "Preset");
    case "manual_amount":
      return t("discounts.kind.manualAmount", "Amount by hand");
    case "manual_percent":
      return t("discounts.kind.manualPercent", "Percent by hand");
    default:
      return t("discounts.kind.unattributed", "Not recorded");
  }
}

/** Basis points → "12.5%". */
export function bpsLabel(bps: number | null | undefined): string | null {
  if (bps == null) return null;
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(2).replace(/0$/, "")}%`;
}

/** "Amount by hand · 12.5% · by Sara · approved by Omar" for an order. */
export function discountAttribution(
  t: TFunction,
  o: {
    discount_kind?: string | null;
    discount_percent_bps?: number | null;
    discount_applied_by_name?: string | null;
    discount_approved_by_name?: string | null;
  },
): string | null {
  if (!o.discount_kind) return null;
  const parts = [discountKindLabel(t, o.discount_kind)];
  const pct = bpsLabel(o.discount_percent_bps);
  if (pct) parts.push(pct);
  if (o.discount_applied_by_name) parts.push(t("discounts.appliedBy", { defaultValue: "by {{name}}", name: o.discount_applied_by_name }));
  if (o.discount_approved_by_name) parts.push(t("discounts.approvedBy", { defaultValue: "approved by {{name}}", name: o.discount_approved_by_name }));
  return parts.join(" · ");
}
