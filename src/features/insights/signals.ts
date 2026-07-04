import type { TFunction } from "i18next";

import type { Signal } from "@/data/api/generated/models";
import { fmtMoney, fmtNumber } from "@/lib/format";

/** The six advisory signal kinds the ledger emits. */
export type SignalKind =
  | "below_cost"
  | "below_target"
  | "cost_spike"
  | "price_candidate"
  | "removal_candidate"
  | "recipe_incomplete";

/** Quiet chip washes — soft tint per severity, no saturated fills. */
export const SIGNAL_TONE: Record<string, string> = {
  below_cost: "bg-destructive/10 text-destructive",
  below_target: "bg-warning/10 text-warning",
  cost_spike: "bg-warning/10 text-warning",
  price_candidate: "bg-info/10 text-info",
  removal_candidate: "bg-muted text-muted-foreground",
  recipe_incomplete: "bg-muted text-muted-foreground",
};

/** Short chip label for a signal kind. */
export const signalLabel = (t: TFunction, kind: string): string => {
  switch (kind) {
    case "below_cost":
      return t("insights.signals.label.below_cost", "Below cost");
    case "below_target":
      return t("insights.signals.label.below_target", "Below target");
    case "cost_spike":
      return t("insights.signals.label.cost_spike", "Cost spike");
    case "price_candidate":
      return t("insights.signals.label.price_candidate", "Price check");
    case "removal_candidate":
      return t("insights.signals.label.removal_candidate", "No sales");
    case "recipe_incomplete":
      return t("insights.signals.label.recipe_incomplete", "No recipe");
    default:
      return kind;
  }
};

const pct1 = (v: number): string => fmtNumber(v, { maximumFractionDigits: 1 });

/** Plain-language reason templated from `signal.kind` + its evidence params.
 *  Money params arrive as integer piastres; percents on the 0–100 scale. */
export const signalReason = (t: TFunction, signal: Signal): string => {
  const p = signal.params as Record<string, unknown>;
  const num = (k: string): number => (typeof p[k] === "number" ? (p[k] as number) : Number(p[k] ?? 0));
  switch (signal.kind) {
    case "below_cost":
      return t("insights.signals.reason.below_cost", {
        margin: fmtMoney(num("margin")),
        defaultValue: "Sells below cost — margin {{margin}}",
      });
    case "below_target":
      return t("insights.signals.reason.below_target", {
        marginPct: pct1(num("margin_pct")),
        targetPct: pct1(num("target_pct")),
        defaultValue: "Margin {{marginPct}}% is under the {{targetPct}}% target",
      });
    case "cost_spike":
      return t("insights.signals.reason.cost_spike", {
        ingredient: String(p.ingredient ?? ""),
        pct: pct1(num("pct")),
        defaultValue: "{{ingredient}} cost moved {{pct}}% this period",
      });
    case "price_candidate":
      return t("insights.signals.reason.price_candidate", {
        price: fmtMoney(num("suggested_price")),
        defaultValue: "Top seller under target — suggested price {{price}}",
      });
    case "removal_candidate":
      return t("insights.signals.reason.removal_candidate", "No sales this period");
    case "recipe_incomplete":
      return t("insights.signals.reason.recipe_incomplete", "Recipe incomplete — cost unknown");
    default:
      return signal.kind;
  }
};
