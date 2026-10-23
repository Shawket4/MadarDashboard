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
 * Every line that prints a count is a whole sentence per unit, in each of
 * Arabic's six plural forms: one is written out ("طلب واحد"), two is a dual in
 * the case its sentence needs ("بقي طلبان", "من طلبين"), 3 to 10 take the plural,
 * 11 to 99 the accusative singular ("12 طلبًا"), 100 to 102 the singular. The bare
 * noun (`unitNoun`) is only the caption beside a balance figure.
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

/** The count for the plural form, and the figure as the page prints it (1,500). */
const counted = (count: number) => ({ count, n: fmtNumber(count) });

/**
 * "4 more orders to your next reward." A whole sentence per unit, so Arabic
 * gets its grammar rather than a figure glued to a noun: "بقي طلب واحد",
 * "بقي طلبان", "بقيت 3 طلبات", "بقي 12 طلبًا", "بقي 100 طلب".
 */
export function toNextReward(t: T, unit: StampUnit, toGo: number): string {
  const o = counted(toGo);
  switch (unit) {
    case "points":
      return t("loyalty.toNext.points", { ...o, defaultValue_one: "{{n}} more point to your next reward.", defaultValue_other: "{{n}} more points to your next reward." });
    case "item":
      return t("loyalty.toNext.item", { ...o, defaultValue_one: "{{n}} more item to your next reward.", defaultValue_other: "{{n}} more items to your next reward." });
    case "stamp":
      return t("loyalty.toNext.stamp", { ...o, defaultValue_one: "{{n}} more stamp to your next reward.", defaultValue_other: "{{n}} more stamps to your next reward." });
    default:
      return t("loyalty.toNext.order", { ...o, defaultValue_one: "{{n}} more order to your next reward.", defaultValue_other: "{{n}} more orders to your next reward." });
  }
}

/** "3 of 6 orders": where a card stands, said in full for a screen reader ("3 من طلبين" in Arabic). */
export function stampsOf(t: T, unit: StampUnit, filled: number, target: number): string {
  const o = { ...counted(target), filled: fmtNumber(filled) };
  switch (unit) {
    case "points":
      return t("loyalty.stampsOf.points", { ...o, defaultValue_one: "{{filled}} of {{n}} point", defaultValue_other: "{{filled}} of {{n}} points" });
    case "item":
      return t("loyalty.stampsOf.item", { ...o, defaultValue_one: "{{filled}} of {{n}} item", defaultValue_other: "{{filled}} of {{n}} items" });
    case "stamp":
      return t("loyalty.stampsOf.stamp", { ...o, defaultValue_one: "{{filled}} of {{n}} stamp", defaultValue_other: "{{filled}} of {{n}} stamps" });
    default:
      return t("loyalty.stampsOf.order", { ...o, defaultValue_one: "{{filled}} of {{n}} order", defaultValue_other: "{{filled}} of {{n}} orders" });
  }
}

/** The rewards list's price, a `Trans` key with `<n>` around the figure ("طلب واحد", "<n>12</n> طلبًا"). */
export const COST_KEY: Record<StampUnit, string> = {
  order: "loyalty.cost.order",
  item: "loyalty.cost.item",
  stamp: "loyalty.cost.stamp",
  points: "loyalty.cost.points",
};
