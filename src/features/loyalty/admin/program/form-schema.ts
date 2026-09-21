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

/**
 * An optional whole number above zero, held as a string so "none" is an empty
 * field. Mirrors the server's `is_some_and(|c| c <= 0)` refusals in
 * `LoyaltySettings::validate`: empty is fine, `0`, `-3`, `2.5` and `abc` are not
 * — the last two used to be sent as `null` without a word, quietly turning a
 * typo into "unlimited".
 */
export const optionalPositiveInt = (message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 2_147_483_647), {
      message,
    });

/** The parsed value of an `optionalPositiveInt`, or null for empty. */
export const intOrNull = (v: string): number | null => {
  const n = Number(v.trim());
  return v.trim() === "" || !Number.isInteger(n) || n <= 0 ? null : n;
};

export const programSchema = z.object({
  enabled: z.boolean(),
  program_name: z.string().trim().min(1, { message: "loyalty.errors.nameRequired" }),
  program_name_ar: z.string(),
  mode: z.enum(["points", "visits"]),
  /** EGP here, piastres on the wire. */
  earn_egp_per_point: z.coerce
    .number<number>({ message: "loyalty.errors.earnRate" })
    // The wire is whole piastres and the server refuses anything <= 0, so the
    // smallest honest rate is one piastre.
    .min(0.01, { message: "loyalty.errors.earnRate" })
    .max(1_000_000, { message: "loyalty.errors.earnRate" }),
  earn_on_discounted: z.boolean(),
  earn_include_tax: z.boolean(),
  /**
   * Stamps mode only. On, a bill of three coffees is three stamps; off, it is
   * one. Held as a plain boolean here because the form always knows the
   * switch's real position — the server answers with a concrete value and the
   * nullable wire field exists only so a client that never SHOWS the switch
   * cannot move it. This form shows it, so it always sends one.
   */
  stamp_per_line_item: z.boolean(),
  default_reward_cost: z.coerce
    .number<number>({ message: "loyalty.errors.positiveInt" })
    .int({ message: "loyalty.errors.positiveInt" })
    .positive({ message: "loyalty.errors.positiveInt" }),
  reward_any_item: z.boolean(),
  /** Off = no ceiling. Strings so "no cap" is an empty field, like the gifts. */
  balance_cap_enabled: z.boolean(),
  balance_cap: optionalPositiveInt("loyalty.errors.optionalPositiveInt"),
  /** Empty = unlimited. A number, so a shop that allows two keeps two. */
  max_rewards_per_order: optionalPositiveInt("loyalty.errors.optionalPositiveInt"),
  require_otp: z.boolean(),
  birthday_enabled: z.boolean(),
  /** A string so "no gift" is expressible as an empty field, which is the common case. */
  birthday_reward_amount: optionalPositiveInt("loyalty.errors.optionalPositiveInt"),
  birthday_message: z.string(),
  birthday_message_ar: z.string(),
  winback_enabled: z.boolean(),
  /** One override, in whichever language the shop writes it. Empty = the built-ins. */
  winback_message: z.string(),
  winback_reward_amount: optionalPositiveInt("loyalty.errors.optionalPositiveInt"),
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
    // Null only from a server that predates the field. Per-order is what such
    // a programme was actually running.
    stamp_per_line_item: s.stamp_per_line_item ?? false,
    default_reward_cost: s.default_reward_cost,
    // Optional on the wire — the server defaults it so older clients keep
    // working — so it is optional here too rather than trusted to be present.
    reward_any_item: s.reward_any_item ?? false,
    // The switch and the figure are separate: with the switch on, an empty
    // figure means "the dearest reward", not "no ceiling".
    balance_cap_enabled: s.balance_cap_enabled ?? false,
    balance_cap: s.balance_cap != null ? String(s.balance_cap) : "",
    // The number itself. A toggle that could only say "1" rewrote a shop's
    // "3 per order" to 1 the next time anyone pressed Save.
    max_rewards_per_order:
      s.max_rewards_per_order != null && s.max_rewards_per_order > 0
        ? String(s.max_rewards_per_order)
        : "",
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
    program_name: v.program_name.trim(),
    program_name_ar: v.program_name_ar.trim() || null,
    mode: v.mode,
    earn_piastres_per_point: egpToPiastres(v.earn_egp_per_point),
    earn_on_discounted: v.earn_on_discounted,
    earn_include_tax: v.earn_include_tax,
    // Always concrete, never omitted: an omission tells the server "leave it",
    // which would silently discard the owner flipping this switch off.
    stamp_per_line_item: v.stamp_per_line_item,
    default_reward_cost: v.default_reward_cost,
    reward_any_item: v.reward_any_item,
    balance_cap_enabled: v.balance_cap_enabled,
    // Null is not "no ceiling" here — the switch above is. It means "work it
    // out from the reward list", which is what an empty field should do.
    balance_cap: v.balance_cap_enabled ? intOrNull(v.balance_cap) : null,
    max_rewards_per_order: intOrNull(v.max_rewards_per_order),
    require_otp: v.require_otp,
    birthday_enabled: birthday,
    birthday_reward_amount: birthday ? intOrNull(v.birthday_reward_amount) : null,
    birthday_message: birthday ? v.birthday_message || null : null,
    birthday_message_ar: birthday ? v.birthday_message_ar || null : null,
    winback_enabled: winback,
    winback_message: winback ? v.winback_message || null : null,
    winback_reward_amount: winback ? intOrNull(v.winback_reward_amount) : null,
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
    birthday_reward_amount: intOrNull(v.birthday_reward_amount),
    birthday_message: v.birthday_message || null,
    birthday_message_ar: v.birthday_message_ar || null,
  };
}
