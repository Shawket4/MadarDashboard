/**
 * Reading a staff drink's money off the wire.
 *
 * Three kinds of row reach the report, and they must never be folded together:
 *
 * - **unpriced** — rung by a till that predates priced staff drinks (POS ≤
 *   v0.7.12). There is no sale line behind it, so `comp_minor` is `null`. That
 *   is "unknown", not "nothing was given": it renders as a dash, never as 0.
 * - **priced** — the server priced the comp; any figure the till sent agreed,
 *   or none was sent (a live sale).
 * - **priced, and the till disagreed** — an offline till claimed one comp and
 *   the server's recount says another. The sale stands at the till's figure
 *   (the money already moved); the row carries both so the owner can see it.
 */
import type { StaffDrink } from "@/data/api/generated/models";

type CompFields = Pick<StaffDrink, "comp_minor" | "extras_minor" | "comp_minor_reported">;

export type StaffDrinkMoney =
  | { priced: false }
  | {
      priced: true;
      /** What the pool gave free, as the server prices it. */
      comp: number;
      /** What the line was still charged; null when the server did not say. */
      extras: number | null;
      /** The till's claim, only when it differs from the server's. */
      tillSaid: number | null;
    };

export function staffDrinkMoney(d: CompFields): StaffDrinkMoney {
  if (d.comp_minor == null) return { priced: false };
  const reported = d.comp_minor_reported;
  return {
    priced: true,
    comp: d.comp_minor,
    extras: d.extras_minor ?? null,
    tillSaid: reported != null && reported !== d.comp_minor ? reported : null,
  };
}
