/** A configured line in the customer's in-memory order. */
export interface CartLine {
  key: string;
  itemId: string;
  name: string;
  sizeLabel?: string;
  addons: { name: string; price: number }[];
  unitPrice: number; // piastres, incl. addons
  qty: number;
}

/** Diacritic/locale-insensitive normalize for search. */
export const normalize = (s: string): string =>
  s.toLowerCase().normalize("NFKD").replace(/[ؗ-ًؚ-ْ]/g, "").trim();

/** Stable signature so identical configurations merge into one line. */
export const lineKey = (itemId: string, sizeLabel: string | undefined, addonNames: string[]): string =>
  `${itemId}::${sizeLabel ?? ""}::${[...addonNames].sort().join("|")}`;
