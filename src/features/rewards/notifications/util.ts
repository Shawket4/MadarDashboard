/**
 * The composer's vocabulary: madar-card's message problems in words, the
 * schedule window, and a segment summarised for the log.
 */
import type { TFunction } from "i18next";

import type { Broadcast, Limits, Rule } from "@/data/api/generated/models";
import { fromZonedInput } from "@/lib/zoned-input";

import { PRESETS, presetLabel, ruleTypeLabel, sameRules, thisMonth } from "../audience/rules";
import type { TrackName } from "../audience/audience-builder";

export function messageProblemText(code: string, t: TFunction, max: number): string {
  switch (code) {
    case "message_empty":
      return t("rewards.notifications.problemEmpty", "Write the message in English, Arabic or both.");
    case "message_long":
      return t("rewards.notifications.problemLong", { defaultValue: "Keep it to {{max}} characters.", max });
    case "message_one_line":
      return t("rewards.notifications.problemOneLine", "Keep it to one line.");
    case "message_link":
      return t("rewards.notifications.problemLink", "Links aren't allowed: the card can't open them, and they invite phishing.");
    default:
      return t("rewards.notifications.problemOther", "This message can't be sent.");
  }
}

/**
 * Minutes from `now` to a `datetime-local` value read on `tz`'s wall clock (the
 * shop's, not the laptop's), or null when it isn't a date.
 */
export function minutesAhead(local: string, tz: string, now = Date.now()): number | null {
  const at = fromZonedInput(local, tz);
  return at === null ? null : (Date.parse(at) - now) / 60_000;
}

/** The server's window: `schedule_min_minutes` to `schedule_max_days` ahead. */
export const scheduleOk = (mins: number | null, limits: Pick<Limits, "schedule_min_minutes" | "schedule_max_days">): boolean =>
  mins !== null && mins >= limits.schedule_min_minutes && mins <= limits.schedule_max_days * 24 * 60;

/** A segment in one line: a preset's name, else each filter with its figure. */
export function audienceSummary(rules: Rule[], t: TFunction, months: string[], tracks: TrackName[], month = thisMonth()): string {
  if (rules.length === 0) return t("rewards.audience.everyone", "Every member");
  const preset = PRESETS.find((p) => sameRules(rules, p.rules(month)));
  if (preset) return presetLabel(preset.id, t);
  const trackName = (n: number) => (tracks.length > 1 ? ` (${tracks.find((x) => x.position === n)?.name ?? n})` : "");
  return rules
    .map((r) => {
      const label = ruleTypeLabel(r.type, t).replace(/…$/, "");
      switch (r.type) {
        case "balance_at_least":
        case "balance_at_most":
          return `${label} ${r.value}${trackName(r.track)}`;
        case "reward_ready":
          return `${label}${trackName(r.track)}`;
        case "visited_within":
        case "not_visited_for":
        case "joined_within":
          return `${label} ${r.days} ${t("rewards.audience.daysUnit", "days")}`;
        case "birthday_month":
          return `${label} ${months[r.month - 1] ?? r.month}`;
        case "has_wallet":
          return `${label}: ${
            r.wallet === "apple"
              ? t("rewards.audience.walletApple", "Apple Wallet")
              : r.wallet === "google"
                ? t("rewards.audience.walletGoogle", "Google Wallet")
                : t("rewards.audience.walletNone", "Neither (no card)")
          }`;
      }
    })
    .join(t("common.listSeparator", ", "));
}

export const statusTone = (s: Broadcast["status"]) =>
  s === "sent" ? "success" : s === "sending" ? "warning" : s === "scheduled" ? "info" : "neutral";
