/**
 * How a Basira result formats its figures, by each column's declared kind.
 * Shared by the result block and the pie view.
 */
import { fmtMoney, fmtMoneyCompact, fmtNumber } from "@/lib/format";
import type { Column, ColumnKind } from "./types";

/**
 * Format one cell by its declared kind.
 *
 * `null` renders as an em dash, never as zero. The backend returns null for a
 * cost or margin it genuinely does not know — a missing cost snapshot — and
 * showing 0 there would read as "this item costs nothing", which is a different
 * and much worse claim than "we do not know".
 */
export function formatCell(value: unknown, kind: ColumnKind, compact = false): string {
  if (value === null || value === undefined) return "—";
  switch (kind) {
    case "money":
      return compact ? fmtMoneyCompact(Number(value)) : fmtMoney(Number(value));
    case "count":
      return fmtNumber(Number(value));
    case "number":
      return `${fmtNumber(Number(value), { maximumFractionDigits: 1 })}`;
    case "minutes": {
      const mins = Number(value);
      if (mins < 60) return `${fmtNumber(Math.round(mins))}m`;
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
    case "date":
    case "label":
    default:
      return String(value);
  }
}

export const dimensionsOf = (columns: Column[]) => columns.filter((c) => !isNumeric(c.kind));
export const measuresOf = (columns: Column[]) => columns.filter((c) => isNumeric(c.kind));

export function isNumeric(kind: ColumnKind): boolean {
  return kind === "money" || kind === "count" || kind === "number" || kind === "minutes";
}
