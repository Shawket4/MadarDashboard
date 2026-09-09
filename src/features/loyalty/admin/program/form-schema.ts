/**
 * The program form's shape, and its translation to and from the wire.
 *
 * Isolated deliberately. Every defect this feature has shipped has been a
 * mapping defect, not a rendering one: a reward catalogue that dropped the
 * currency it was priced in, a `reward_any_item` the server rejected because
 * the key was absent, a `terms_ar` quietly overwritten with null by a form that
 * never showed it. Those are all one function's problem, so they live in one
 * function that can be read end to end and tested without a DOM.
 *
 * Money is piastres on the wire and EGP on screen; the two helpers are the only
 * place that conversion happens.
 */
import { z } from "zod";

import type { LoyaltySettings } from "@/data/api/generated/models";
import { egpToPiastres, piastresToEgp } from "@/lib/format";

export const programSchema = z.object({
  enabled: z.boolean(),
  program_name: z.string().min(1),
  program_name_ar: z.string(),
  mode: z.enum(["points", "visits"]),
  /** EGP here, piastres on the wire. */
  earn_egp_per_point: z.coerce.number<number>().positive(),
  earn_on_discounted: z.boolean(),
  earn_include_tax: z.boolean(),
  default_reward_cost: z.coerce.number<number>().int().positive(),
  reward_any_item: z.boolean(),
  /** Off = no ceiling. Strings so "no cap" is an empty field, like the gifts. */
  balance_cap_enabled: z.boolean(),
  balance_cap: z.string(),
  one_reward_per_order: z.boolean(),
  require_otp: z.boolean(),
  birthday_enabled: z.boolean(),
  /** A string so "no gift" is expressible as an empty field, which is the common case. */
  birthday_reward_amount: z.string(),
  birthday_message: z.string(),
  birthday_message_ar: z.string(),
  winback_enabled: z.boolean(),
  /** One override, in whichever language the shop writes it. Empty = the built-ins. */
  winback_message: z.string(),
  winback_reward_amount: z.string(),
  terms: z.string(),
});

export type ProgramValues = z.infer<typeof programSchema>;

/** The saved settings, as the form holds them. */
export function fromWire(s: LoyaltySettings): ProgramValues {
  return {
    enabled: s.enabled,
    program_name: s.program_name,
    program_name_ar: s.program_name_ar ?? "",
    mode: s.mode === "visits" ? "visits" : "points",
    earn_egp_per_point: piastresToEgp(s.earn_piastres_per_point),
    earn_on_discounted: s.earn_on_discounted,
    earn_include_tax: s.earn_include_tax,
    default_reward_cost: s.default_reward_cost,
    // Optional on the wire — the server defaults it so older clients keep
    // working — so it is optional here too rather than trusted to be present.
    reward_any_item: s.reward_any_item ?? false,
    // The switch and the figure are separate: with the switch on, an empty
    // figure means "the dearest reward", not "no ceiling".
    balance_cap_enabled: s.balance_cap_enabled ?? false,
    balance_cap: s.balance_cap != null ? String(s.balance_cap) : "",
    // Stored as a number so a shop could allow two or three, but the toggle
    // offers the only value anyone has asked for. A value already set by hand
    // still reads as "on" rather than being silently discarded.
    one_reward_per_order: (s.max_rewards_per_order ?? 0) > 0,
    require_otp: s.require_otp,
    birthday_enabled: s.birthday_enabled ?? false,
    birthday_reward_amount: s.birthday_reward_amount
      ? String(s.birthday_reward_amount)
      : "",
    birthday_message: s.birthday_message ?? "",
    birthday_message_ar: s.birthday_message_ar ?? "",
    winback_enabled: s.winback_enabled ?? false,
    winback_message: s.winback_message ?? "",
    winback_reward_amount: s.winback_reward_amount
      ? String(s.winback_reward_amount)
      : "",
    terms: s.terms ?? "",
  };
}

/**
 * The form, as a settings body.
 *
 * `saved` is carried in for the fields this form does not show. Sending a body
 * built only from what is on screen silently clears everything that is not —
 * which is how `terms_ar` came to be nulled by a form with no Arabic terms
 * field in it.
 */
export function toWire(
  v: ProgramValues,
  scope: { orgId: string; branchId: string | null },
  saved: LoyaltySettings | undefined,
): LoyaltySettings {
  // A gift and a message belong to birthdays. Leaving them set while the
  // feature is off would mean turning it back on silently restores whatever
  // was configured a year ago.
  const birthday = v.birthday_enabled;
  const winback = v.winback_enabled;
  return {
    ...saved,
    org_id: scope.orgId,
    branch_id: scope.branchId,
    enabled: v.enabled,
    program_name: v.program_name,
    program_name_ar: v.program_name_ar || null,
    mode: v.mode,
    earn_piastres_per_point: egpToPiastres(v.earn_egp_per_point),
    earn_on_discounted: v.earn_on_discounted,
    earn_include_tax: v.earn_include_tax,
    default_reward_cost: v.default_reward_cost,
    reward_any_item: v.reward_any_item,
    balance_cap_enabled: v.balance_cap_enabled,
    // Null is not "no ceiling" here — the switch above is. It means "work it
    // out from the reward list", which is what an empty field should do.
    balance_cap: v.balance_cap_enabled ? Number(v.balance_cap) || null : null,
    max_rewards_per_order: v.one_reward_per_order ? 1 : null,
    require_otp: v.require_otp,
    birthday_enabled: birthday,
    birthday_reward_amount: birthday ? Number(v.birthday_reward_amount) || null : null,
    birthday_message: birthday ? v.birthday_message || null : null,
    birthday_message_ar: birthday ? v.birthday_message_ar || null : null,
    winback_enabled: winback,
    winback_message: winback ? v.winback_message || null : null,
    winback_reward_amount: winback
      ? Number(v.winback_reward_amount) || null
      : null,
    terms: v.terms || null,
  };
}

/**
 * What the birthday preview should render: the saved settings with the form's
 * live edits on top, so it shows what SAVING would send rather than what was
 * last saved.
 */
export function previewOf(
  v: ProgramValues,
  saved: LoyaltySettings | undefined,
): LoyaltySettings | null {
  if (!saved || !v.birthday_enabled) return null;
  return {
    ...saved,
    program_name: v.program_name || saved.program_name,
    mode: v.mode,
    birthday_reward_amount: Number(v.birthday_reward_amount) || null,
    birthday_message: v.birthday_message || null,
    birthday_message_ar: v.birthday_message_ar || null,
  };
}
