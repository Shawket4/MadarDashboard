import type { PresetId } from "./export/types";

/** `?till=` (also `?till_id=` and the pre-rework `?shift_id=`) narrows orders to one till. */
export function readTillSearch(s: Record<string, unknown>): string | undefined {
  for (const k of ["till", "till_id", "shift_id"]) {
    const v = s[k];
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

/** Saved/remembered preset ids from before the rework still resolve. */
export function normalizePresetId(id: string | null | undefined): PresetId {
  if (id === "shift_handoff") return "till_handoff";
  const known: PresetId[] = ["accountant_daily", "talabat_reconcile", "till_handoff", "ingredient_consumption", "custom"];
  return known.includes(id as PresetId) ? (id as PresetId) : "accountant_daily";
}

