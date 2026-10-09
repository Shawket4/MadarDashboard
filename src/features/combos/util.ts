/**
 * The combos module's shared vocabulary: weekday bits, rates, money in the
 * form, the "is this a fixed bundle" rule and the warning wording. Deals and
 * the Bundles report use the same helpers, so a window or a margin reads the
 * same on every screen.
 */
import type { TFunction } from "i18next";

import { queryClient } from "@/data/api/query";
import { egpToPiastres, fmtMoney, fmtPercent, piastresToEgp } from "@/lib/format";

import type { ComboWarning, SaleWindow } from "./types";

// ── Weekdays (bit0 = Sunday … bit6 = Saturday) ───────────────────────────────

export const ALL_WEEKDAYS = 127;
/** Sunday first, the order the bits and the Egyptian week both use. */
export const WEEKDAY_BITS = [0, 1, 2, 3, 4, 5, 6] as const;
export const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export const hasDay = (mask: number, day: number): boolean => (mask & (1 << day)) !== 0;
export const toggleDay = (mask: number, day: number): number => mask ^ (1 << day);

/** "Every day", "Weekdays", or the chosen short names in week order. */
export function weekdaysLabel(t: TFunction, mask: number): string {
  if (mask === ALL_WEEKDAYS) return t("combos.windows.everyDay", "Every day");
  const days = WEEKDAY_BITS.filter((d) => hasDay(mask, d)).map((d) =>
    t(`combos.windows.day.${WEEKDAY_KEYS[d]}`, WEEKDAY_KEYS[d]),
  );
  return days.join(t("combos.listSeparator", ", "));
}

/** "HH:MM[:SS]" → "HH:MM" (the wire form); empty/invalid → null. */
export function hhmm(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(v);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/** A window in one line: days · hours · dates. */
export function windowSummary(t: TFunction, w: SaleWindow, branchName?: (id: string) => string | undefined): string {
  const parts = [weekdaysLabel(t, w.weekdays ?? ALL_WEEKDAYS)];
  if (w.starts_at && w.ends_at) {
    parts.push(
      t("combos.windows.hoursRange", { defaultValue: "{{from}} to {{to}}", from: hhmm(w.starts_at), to: hhmm(w.ends_at) }),
    );
  }
  if (w.valid_from || w.valid_to) {
    parts.push(
      t("combos.windows.datesRange", {
        defaultValue: "{{from}} to {{to}}",
        from: w.valid_from ?? "…",
        to: w.valid_to ?? "…",
      }),
    );
  }
  parts.push(w.branch_id ? (branchName?.(w.branch_id) ?? "—") : t("combos.windows.allBranches", "All branches"));
  return parts.join(" · ");
}

// ── Rates ────────────────────────────────────────────────────────────────────

/** A wire rate ("0.5933") as a number, or null. */
export function rateOf(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** A wire rate as a percent label ("59.3%"), or an em-dash when unknown. */
export const fmtRate = (v: string | number | null | undefined): string => {
  const r = rateOf(v);
  return r === null ? "—" : fmtPercent(r);
};

/** The settings form's percent ("55") → the wire's string decimal ("0.5500"); blank → null. */
export function percentToRate(pct: string | number | null | undefined): string | null {
  if (pct === null || pct === undefined || String(pct).trim() === "") return null;
  const n = Number(pct);
  if (!Number.isFinite(n)) return null;
  return (Math.round(n * 100) / 10000).toFixed(4);
}

/** The wire's string decimal → the form's percent ("0.55" → "55"); null → "". */
export function rateToPercent(rate: string | null | undefined): string {
  const r = rateOf(rate);
  if (r === null) return "";
  return String(Math.round(r * 10000) / 100);
}

// ── Money in forms (EGP strings in, piastres out) ────────────────────────────

/** An EGP text box → piastres; blank → null; negative or junk → NaN. */
export function moneyIn(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? egpToPiastres(n) : Number.NaN;
}

/** Piastres → the EGP text a form shows ("150", "12.5"). */
export const moneyOut = (p: number | null | undefined): string => (p === null || p === undefined ? "" : String(piastresToEgp(p)));

// ── Fixed bundle (C1): every slot has exactly one item choice with min == max ─

export function isFixedShape(slots: { min: number; max: number; choices: { menu_item_id?: string | null; category_id?: string | null }[] }[]): boolean {
  return (
    slots.length > 0 &&
    slots.every((s) => s.min === s.max && s.choices.length === 1 && !!s.choices[0].menu_item_id && !s.choices[0].category_id)
  );
}

// ── Warnings (§2.2 / §2.7). Never refusals. ─────────────────────────────────

export interface WarningNames {
  item?: (id: string) => string | undefined;
  slot?: (id: string) => string | undefined;
}

export function warningText(t: TFunction, w: ComboWarning, names: WarningNames = {}): string {
  const v = (w.vars ?? {}) as Record<string, string | undefined>;
  switch (w.code) {
    case "MARGIN_BELOW_MIN":
      return t("combos.warnings.MARGIN_BELOW_MIN", {
        defaultValue: "Margin {{margin}} is below your minimum {{min}}.",
        margin: fmtRate(v.margin),
        min: fmtRate(v.min),
      });
    case "NO_SAVING":
      return t("combos.warnings.NO_SAVING", "Customers save nothing versus ordering separately.");
    case "COST_UNKNOWN":
      return t("combos.warnings.COST_UNKNOWN", {
        defaultValue: "{{item}} has no known cost, so the margin is incomplete.",
        item: (v.menu_item_id && names.item?.(v.menu_item_id)) ?? t("combos.warnings.anItem", "An item"),
      });
    case "SLOT_EMPTY_NOW":
      return t("combos.warnings.SLOT_EMPTY_NOW", {
        defaultValue: "{{slot}} has no choice that can be sold right now.",
        slot: (v.slot_id && names.slot?.(v.slot_id)) ?? t("combos.warnings.aSlot", "A slot"),
      });
    case "CHOICE_INACTIVE":
      return t("combos.warnings.CHOICE_INACTIVE", {
        defaultValue: "{{item}} is switched off, so it can't be picked.",
        item: (v.menu_item_id && names.item?.(v.menu_item_id)) ?? t("combos.warnings.anItem", "An item"),
      });
    default:
      return t("combos.warnings.unknown", { defaultValue: "Check this combo ({{code}}).", code: w.code });
  }
}

/** The saving a price gives against a list value, for a label ("saves EGP 60.00"). */
export const savingLabel = (t: TFunction, saving: number): string =>
  saving > 0
    ? t("combos.savesAmount", { defaultValue: "Saves {{amount}}", amount: fmtMoney(saving) })
    : t("combos.noSaving", "No saving");

// ── Cache ────────────────────────────────────────────────────────────────────

const PREFIXES = ["/combos", "/deals", "/settings/combos", "/reports/bundles", "/menu-items", "/costing"];

/** After any combo, deal or settings write: every list, editor and report that reads them. */
export const invalidateCombos = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return typeof k === "string" && PREFIXES.some((p) => k.startsWith(p));
    },
  });
