// The pure half of RankedTable (ranked-table.tsx): ranking, sorting, search,
// the category filter and the share figures, kept here so they are tested
// without a DOM.
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";

export type SortDir = "asc" | "desc";
export interface SortState {
  /** A column id, or RANK for the table's own order. */
  id: string;
  dir: SortDir;
}

/** The rank column's id: sorting by it is sorting by the ranking metric. */
export const RANK = "rank";
/** The category filter's "everything" value. */
export const ALL = "__all__";

/**
 * Competition ranks ("1, 2, 2, 4") by `metric`, highest first: two items that
 * sold the same share a place. Ties keep the order the server sent them in.
 */
export function rankBy<T>(rows: readonly T[], idOf: (r: T) => string, metric: (r: T) => number): Map<string, number> {
  const ordered = rows.map((r, i) => ({ id: idOf(r), v: metric(r), i })).sort((a, b) => b.v - a.v || a.i - b.i);
  const ranks = new Map<string, number>();
  ordered.forEach((o, i) => {
    const prev = ordered[i - 1];
    ranks.set(o.id, prev && prev.v === o.v ? ranks.get(prev.id)! : i + 1);
  });
  return ranks;
}

/** A column's sort key: numbers sort numerically, text by the reader's language. */
export type SortValue = number | string | null | undefined;

/**
 * Rows in `sort` order. Text sorts by `locale`'s collation (Arabic names in
 * Arabic order), missing values last either way, and ties fall back to rank so
 * the order never jitters between renders.
 */
export function sortRows<T>(
  rows: readonly T[],
  sort: SortState,
  valueOf: (r: T, columnId: string) => SortValue,
  rankOf: (r: T) => number,
  locale: string,
): T[] {
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" });
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.id === RANK) return sign * (rankOf(a) - rankOf(b)) || 0;
    const va = valueOf(a, sort.id);
    const vb = valueOf(b, sort.id);
    const missA = va === null || va === undefined || (typeof va === "number" && !Number.isFinite(va));
    const missB = vb === null || vb === undefined || (typeof vb === "number" && !Number.isFinite(vb));
    if (missA !== missB) return missA ? 1 : -1;
    let c = 0;
    if (!missA && !missB) {
      c = typeof va === "number" && typeof vb === "number" ? va - vb : collator.compare(String(va), String(vb));
    }
    return sign * c || rankOf(a) - rankOf(b);
  });
}

/**
 * What a click on a header does: a new column starts at its natural direction
 * (figures biggest first, names A to Z, rank 1 first); the same column flips.
 */
export function nextSort(current: SortState, id: string, kind: "number" | "text"): SortState {
  if (current.id === id) return { id, dir: current.dir === "asc" ? "desc" : "asc" };
  return { id, dir: id === RANK || kind === "text" ? "asc" : "desc" };
}

/** The `aria-sort` a header carries: only the sorted column says anything. */
export function ariaSortOf(sort: SortState, id: string): "ascending" | "descending" | undefined {
  if (sort.id !== id) return undefined;
  return sort.dir === "asc" ? "ascending" : "descending";
}

/** Fold a string for search: case, Latin accents and Arabic diacritics and hamza forms. */
export function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .trim();
}

/**
 * Rows whose any `haystack` string holds the query (outer spaces ignored), in
 * the chosen category (`ALL` for every one).
 */
export function filterRows<T>(
  rows: readonly T[],
  query: string,
  haystack: (r: T) => (string | null | undefined)[],
  category: string = ALL,
  categoryOf?: (r: T) => string | null | undefined,
): T[] {
  const q = fold(query);
  return rows.filter((r) => {
    if (category !== ALL && categoryOf && (categoryOf(r) ?? "") !== category) return false;
    if (!q) return true;
    return haystack(r).some((h) => !!h && fold(h).includes(q));
  });
}

/** The distinct categories of `rows`, in the order they first appear. */
export function categoriesOf<T>(rows: readonly T[], categoryOf: (r: T) => string | null | undefined): string[] {
  const seen = new Set<string>();
  for (const r of rows) {
    const c = categoryOf(r);
    if (c) seen.add(c);
  }
  return [...seen];
}

/** part ÷ total as a ratio in [0, 1]; 0 when there is no total. */
export function shareOf(part: number, total: number): number {
  if (!total || !Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(1, Math.max(0, part / total));
}

/** A share as the column prints it: always one decimal, so the column's digits line up. */
export function fmtShareCell(ratio: number): string {
  return fmtPercent(ratio, { minimumFractionDigits: 1 });
}

/** Revenue ÷ units as money, or "—" when nothing sold (never a division by zero). */
export function avgPrice(revenue: number, qty: number): number | null {
  return qty > 0 ? Math.round(revenue / qty) : null;
}

export const fmtAvgPrice = (revenue: number, qty: number): string => fmtMoney(avgPrice(revenue, qty));
export const fmtCount = (n: number): string => fmtNumber(n);

/** Turn a raw add-on type ("milk_type") into words ("Milk") when there is no translation. */
export function humanizeType(type: string): string {
  const base = type.endsWith("_type") ? type.slice(0, -"_type".length) : type;
  return base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
