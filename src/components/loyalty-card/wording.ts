/**
 * What a card counts, in the reader's words.
 *
 * One stamp stands for what the shop decided (madar-card's `text::stamp_unit`,
 * the API's `stamp_unit`): an `order` (one per sale, the default), an `item`
 * (one per item bought), or simply a `stamp` (a Rewards by Madar counter shop,
 * where the teller stamps the card). A points programme counts `points`. Every
 * line that prints a figure takes its noun from here, so the card, its progress
 * line, the stamp row and the rewards list never call one thing two names.
 *
 * Nouns only, in the count's plural form (Arabic has six), and the figure in
 * digits beside them: "6 طلبات", "15 طلبًا" and "من 8 طلبات" all take the same
 * noun, so no sentence needs a case ending of its own.
 */
import type { useTranslation } from "react-i18next";

import { fmtNumber } from "@/lib/format";

export type StampUnit = "order" | "item" | "stamp" | "points";

type T = ReturnType<typeof useTranslation>["t"];

/** The programme's unit: points for a points programme, else the server's word, `order` when it sends none. */
export function stampUnit(mode: string, wire?: string | null): StampUnit {
  if (mode === "points") return "points";
  return wire === "item" || wire === "stamp" ? wire : "order";
}

/** The unit's noun for `count` of them: "orders", "طلبات". */
export function unitNoun(t: T, unit: StampUnit, count: number): string {
  switch (unit) {
    case "points":
      return t("loyalty.unitPoints", { count, defaultValue_one: "point", defaultValue_other: "points" });
    case "item":
      return t("loyalty.unitItems", { count, defaultValue_one: "item", defaultValue_other: "items" });
    case "stamp":
      return t("loyalty.unitStamps", { count, defaultValue_one: "stamp", defaultValue_other: "stamps" });
    default:
      return t("loyalty.unitOrders", { count, defaultValue_one: "order", defaultValue_other: "orders" });
  }
}

/** "4 more orders to your next reward." */
export const toNextReward = (t: T, unit: StampUnit, toGo: number): string =>
  t("loyalty.toNextReward", {
    n: fmtNumber(toGo),
    unit: unitNoun(t, unit, toGo),
    defaultValue: "{{n}} more {{unit}} to your next reward.",
  });

/** "3 of 6 orders": where a card stands, said in full for a screen reader. */
export const stampsOf = (t: T, unit: StampUnit, filled: number, target: number): string =>
  t("loyalty.stampsOf", {
    filled: fmtNumber(filled),
    n: fmtNumber(target),
    unit: unitNoun(t, unit, target),
    defaultValue: "{{filled}} of {{n}} {{unit}}",
  });
