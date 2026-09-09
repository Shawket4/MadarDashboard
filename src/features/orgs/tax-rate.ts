/**
 * Percent on screen, fraction on the wire.
 *
 * The backend stores `tax_rate` as a FRACTION — `0.14` is 14% — and rejects
 * anything above 1. The dashboard labelled the same field "Tax Rate (%)" and
 * rendered it with a percent sign, so:
 *
 *   * typing `14`, which is what the label asked for, was refused with
 *     "tax_rate must be between 0 and 1";
 *   * typing `0.14`, which the backend accepted, then displayed as "0.14%".
 *
 * There was no value that both saved and read correctly, which is why the
 * setting appeared to do nothing at all. The unit is not the thing to change —
 * every consumer multiplies by it, and a percentage would silently charge
 * 1400% — so the conversion lives here, at the one boundary that needs it.
 */

/** Most tax authorities stop well short of this; it exists to catch a 14 typed where 0.14 belongs. */
export const MAX_PERCENT = 100;

/**
 * `0.14` → `14`.
 *
 * Rounded to four decimal places because binary floating point makes
 * `0.14 * 100` into `14.000000000000002`, and a settings field that reads
 * `14.000000000000002` looks broken even though it is right. Four places is
 * what the column stores (`numeric(5,4)`), so nothing is lost.
 */
export function fractionToPercent(fraction: number | null | undefined): number {
  if (fraction == null || !Number.isFinite(fraction)) return 0;
  return Math.round(fraction * 100 * 10_000) / 10_000;
}

/**
 * `14` → `0.14`.
 *
 * Rounded to six places: a percentage with four decimals is a fraction with
 * six, and `numeric(5,4)` would reject anything longer.
 */
export function percentToFraction(percent: number | null | undefined): number {
  if (percent == null || !Number.isFinite(percent)) return 0;
  return Math.round((percent / 100) * 1_000_000) / 1_000_000;
}

/** How a rate reads in a table or a summary: `0.14` → `"14%"`. */
export function formatRate(fraction: number | null | undefined): string {
  return `${fractionToPercent(fraction)}%`;
}
