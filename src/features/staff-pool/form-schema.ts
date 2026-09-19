/**
 * The staff-pool settings form's shape, and its translation to and from the wire.
 *
 * Isolated the way the loyalty programme's mapper is, and for the same reason:
 * everything interesting about this screen is what it SENDS, not how it looks.
 * Three facts make the mapping worth its own tested file.
 *
 * 1. The allowance is a whole count of drinks. A branch that gives "three" must
 *    still give three after a save; a form that coerced "" to 0 would quietly
 *    take the pool away from every shop that cleared the field to retype it.
 * 2. An EMPTY eligible list means the pool is OFF, whatever the switch says.
 *    That is the owner's decision and it is a property of the data, so it is a
 *    function here (`poolIsOff`) that both the form and the report read, rather
 *    than a condition each screen re-derives and eventually disagrees about.
 * 3. A branch row REPLACES the org row wholesale. `toWire` therefore carries
 *    the scope it is saving to, not the scope the response came back with —
 *    the API answers a branch query with the settings IN FORCE, so echoing its
 *    `branch_id` back would write the org's row while looking at a branch.
 */
import { z } from "zod";

import type { StaffPoolSettings } from "@/data/api/generated/models";

/**
 * Drinks per business day, held as a string so a half-typed field is a string
 * and not `NaN`. Zero is allowed and means "none until someone raises it" —
 * going over is marked, never blocked, so a zero allowance is a real setting
 * (every staff drink is an overspend) rather than a way of switching off.
 */
export const dailyAllowance = z
  .string()
  .trim()
  .refine((v) => /^\d+$/.test(v) && Number(v) <= 1000, {
    message: "staffPool.errors.allowance",
  });

export const staffPoolSchema = z.object({
  enabled: z.boolean(),
  daily_allowance: dailyAllowance,
  eligible_item_ids: z.array(z.string()),
});

export type StaffPoolValues = z.infer<typeof staffPoolSchema>;

/**
 * Is the pool actually off?
 *
 * Two independent ways to say no, and the second is the one people miss: with
 * no eligible items there is nothing a teller could ring up as a staff drink,
 * so the switch being on means nothing at all. The UI says so out loud instead
 * of showing a green toggle over a pool that cannot be used.
 */
export const poolIsOff = (v: { enabled: boolean; eligible_item_ids: string[] }): boolean =>
  !v.enabled || v.eligible_item_ids.length === 0;

/** The saved settings, as the form holds them. */
export function fromWire(s: StaffPoolSettings): StaffPoolValues {
  return {
    enabled: s.enabled ?? false,
    // Optional on the wire. Reading it as `undefined` would send `undefined`
    // straight back and let the server pick a default nobody asked for.
    daily_allowance: String(s.daily_allowance ?? 0),
    eligible_item_ids: [...(s.eligible_item_ids ?? [])],
  };
}

/**
 * The form, as a settings body.
 *
 * `saved` is carried in for anything this form does not show, so a field added
 * to the API before it is added to this screen is not silently cleared by the
 * next Save — the failure mode the loyalty form shipped twice.
 */
export function toWire(
  v: StaffPoolValues,
  scope: { orgId: string; branchId: string | null },
  saved: StaffPoolSettings | undefined,
): StaffPoolSettings {
  return {
    ...saved,
    org_id: scope.orgId,
    branch_id: scope.branchId,
    enabled: v.enabled,
    daily_allowance: Number(v.daily_allowance.trim()),
    // De-duplicated and copied: the multi-select hands back the array it was
    // given, and writing through it would mutate the form's own state.
    eligible_item_ids: [...new Set(v.eligible_item_ids)],
  };
}

/**
 * Does a settings response belong to the branch that was asked for?
 *
 * The API answers a branch query with the settings IN FORCE — its override if
 * it has one, otherwise the organisation's. The only way to tell the two apart
 * is whether `branch_id` came back matching what was asked for.
 */
export const isOwnOverride = (
  settings: StaffPoolSettings | undefined,
  branchId: string | null,
): boolean => Boolean(branchId) && settings?.branch_id === branchId;
