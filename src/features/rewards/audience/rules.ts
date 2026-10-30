/**
 * Segments of members (madar-card's audience rules): the members table filters
 * by them and a message is sent to them. The rules and their checks are the
 * crate's (`audience_validate` in the `card` package); this file holds only
 * what the dashboard adds: the presets, a new rule's starting values and the
 * words for each rule and problem.
 */
import type { TFunction } from "i18next";

import type { Rule } from "@/data/api/generated/models";
import { businessDate, dateParts } from "@/lib/format";

export type RuleType = Rule["type"];

export const RULE_TYPES: RuleType[] = [
  "not_visited_for",
  "visited_within",
  "joined_within",
  "reward_ready",
  "balance_at_least",
  "balance_at_most",
  "birthday_month",
  "has_wallet",
];

/**
 * This month (1–12) on the shop's clock (the active zone), not the laptop's: at
 * the turn of a month the two disagree for an owner abroad.
 */
export const thisMonth = (now: Date | number = Date.now()): number => dateParts(businessDate(now)).m + 1;

/** A rule as it is first added, before the owner edits its figure. */
export function newRule(type: RuleType, month = thisMonth()): Rule {
  switch (type) {
    case "balance_at_least":
    case "balance_at_most":
      return { type, track: 1, value: 1 };
    case "reward_ready":
      return { type, track: 1 };
    case "visited_within":
      return { type, days: 30 };
    case "not_visited_for":
      return { type, days: 30 };
    case "joined_within":
      return { type, days: 7 };
    case "birthday_month":
      return { type, month };
    case "has_wallet":
      return { type, wallet: "none" };
  }
}

export interface Preset {
  id: string;
  rules: (month: number) => Rule[];
}

/** One click to a common segment. */
export const PRESETS: Preset[] = [
  { id: "lapsed", rules: () => [{ type: "not_visited_for", days: 30 }] },
  { id: "rewardWaiting", rules: () => [{ type: "reward_ready", track: 1 }] },
  { id: "birthday", rules: (m) => [{ type: "birthday_month", month: m }] },
  { id: "newWeek", rules: () => [{ type: "joined_within", days: 7 }] },
  { id: "noCard", rules: () => [{ type: "has_wallet", wallet: "none" }] },
];

export const sameRules = (a: Rule[], b: Rule[]): boolean => JSON.stringify(a) === JSON.stringify(b);

export function presetLabel(id: string, t: TFunction): string {
  switch (id) {
    case "lapsed":
      return t("rewards.audience.presetLapsed", "Lapsed 30 days");
    case "rewardWaiting":
      return t("rewards.audience.presetRewardWaiting", "Reward waiting");
    case "birthday":
      return t("rewards.audience.presetBirthday", "Birthday this month");
    case "newWeek":
      return t("rewards.audience.presetNewWeek", "New this week");
    default:
      return t("rewards.audience.presetNoCard", "No card in a wallet");
  }
}

export function ruleTypeLabel(type: RuleType, t: TFunction): string {
  switch (type) {
    case "balance_at_least":
      return t("rewards.audience.typeBalanceAtLeast", "Balance at least");
    case "balance_at_most":
      return t("rewards.audience.typeBalanceAtMost", "Balance at most");
    case "reward_ready":
      return t("rewards.audience.typeRewardReady", "Has a reward waiting");
    case "visited_within":
      return t("rewards.audience.typeVisitedWithin", "Visited in the last…");
    case "not_visited_for":
      return t("rewards.audience.typeNotVisitedFor", "Not seen for…");
    case "joined_within":
      return t("rewards.audience.typeJoinedWithin", "Joined in the last…");
    case "birthday_month":
      return t("rewards.audience.typeBirthdayMonth", "Birthday in…");
    case "has_wallet":
      return t("rewards.audience.typeHasWallet", "Card in a wallet");
  }
}

/** The words for an audience problem (madar-card's codes). */
export function audienceProblemText(code: string, t: TFunction): string {
  switch (code) {
    case "too_many_rules":
      return t("rewards.audience.problemTooMany", "Use at most 6 filters.");
    case "track_unknown":
      return t("rewards.audience.problemTrack", "A filter names a stamp track the card no longer has.");
    case "balance_range":
      return t("rewards.audience.problemBalance", "A balance must be between 0 and 1,000,000.");
    case "days_range":
      return t("rewards.audience.problemDays", "Days must be between 1 and 365.");
    case "month_range":
      return t("rewards.audience.problemMonth", "Pick a month.");
    case "rules_contradict":
      return t("rewards.audience.problemContradict", "Two filters can never both be true, so nobody would match.");
    default:
      return t("rewards.audience.problemOther", "This segment isn't valid.");
  }
}
