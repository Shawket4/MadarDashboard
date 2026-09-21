/**
 * Reading a replay flag's `capability` cell.
 *
 * The reason vocabulary (`authz_replay_flags.reason`) is fixed, so the server
 * carries the DETAIL of a flag in the capability cell as `capability:detail` —
 * `orders.staff_drink.record:comp_mismatch`. For those rows the reason alone
 * misleads: a till whose comp differs from the server's did nothing "without
 * the permission". The detail is what happened, so where we know its wording
 * it takes the "What happened" cell, and the capability is named like a person
 * would name it rather than shown as a key.
 */
import type { StatusTone } from "@/components/app/status-pill";

/** Every detail the staff-drink replay path can write (staff-drink-comp contract §2). */
const STAFF_DRINK_DETAILS: Record<string, StatusTone> = {
  comp_mismatch: "warning",
  overspent: "warning",
  device_overcounted: "info",
  duplicate_id: "warning",
  pool_off: "danger",
  no_eligible_items: "danger",
  item_not_eligible: "danger",
  note_required: "warning",
};

const DETAILS: Record<string, Record<string, StatusTone>> = {
  "orders.staff_drink.record": STAFF_DRINK_DETAILS,
};

export interface FlagCapability {
  /** The capability key with any detail removed. */
  capability: string;
  detail: string | null;
  /** i18n key + tone for a detail whose wording we own; null otherwise. */
  known: { key: string; tone: StatusTone } | null;
}

export function readFlagCapability(cell: string): FlagCapability {
  const at = cell.indexOf(":");
  if (at < 0) return { capability: cell, detail: null, known: null };
  const capability = cell.slice(0, at);
  const detail = cell.slice(at + 1);
  const tone = DETAILS[capability]?.[detail];
  return {
    capability,
    detail,
    known: tone ? { key: `access.review.details.${capability.replaceAll(".", "_")}.${detail}`, tone } : null,
  };
}
