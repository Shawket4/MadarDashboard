/**
 * Names inside sentences, kept in their own direction.
 *
 * A Latin member, shop or track name inside an Arabic sentence otherwise drags
 * its neighbours with it: "تسليم هدية عيد ميلاد Laila Mostafa؟" rendered with the
 * question mark before the name. Every name the teller interpolates goes
 * through here: as a `<bdi>` in markup, or between Unicode isolates (FSI…PDI)
 * where only a string fits (an aria-label).
 */
import type { ReactNode } from "react";
import type { TFunction } from "i18next";

/** Marks a name's slot in the translated string; never typed by anyone. */
const SLOT = "\u0001";

/**
 * `t(key, vars)` with each of `names` (keys of `vars`) rendered inside its own
 * `<bdi>`. Everything else interpolates as usual.
 */
export function tNames(t: TFunction, key: string, vars: Record<string, unknown>, names: string[]): ReactNode {
  const slotted: Record<string, unknown> = { ...vars };
  names.forEach((n, i) => (slotted[n] = `${SLOT}${i}${SLOT}`));
  const text = String(t(key, slotted));
  return text.split(SLOT).map((part, i) => (i % 2 ? <bdi key={i}>{String(vars[names[Number(part)]] ?? "")}</bdi> : part));
}

/** A name isolated for a plain string (aria-label, title). */
export const isolate = (name: string | null | undefined): string => `⁨${name ?? ""}⁩`;
