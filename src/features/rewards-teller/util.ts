/**
 * The counter page's decisions that are not the shared rules: when a captured
 * string is ready to look up, and how many stamps the card shows. What a
 * string IS comes from madar-shared (`classifyScan`); how many stamps a visit
 * earns and what completing a card deducts is the server's.
 */
import { classifyScan } from "@/lib/scan";

/** The counter's most items in one visit (the server's `counter::MAX_ITEMS`). */
export const MAX_ITEMS = 50;

export type LookupBy = { token: string } | { phone: string };

/**
 * A whole card token looks itself up as soon as it is complete (a wedge
 * scanner types it and often sends no Enter). A phone waits for Enter or the
 * button: "0100123456" is already a plausible number one digit before the
 * person has finished typing.
 */
export function readyToLookUp(raw: string, submitted: boolean): LookupBy | null {
  const s = classifyScan(raw);
  if (s.kind === "token") return { token: s.value };
  if (s.kind === "phone" && submitted) return { phone: s.value };
  return null;
}

/** The dots a card shows: filled up to its size; stamps past it are the next card's. */
export function cardDots(balance: number, size: number): { filled: number; size: number; extra: number } {
  const n = Math.max(0, size);
  const b = Math.max(0, balance);
  return { filled: Math.min(b, n), size: n, extra: Math.max(0, b - n) };
}

export const clampItems = (n: number): number => Math.min(MAX_ITEMS, Math.max(1, Math.trunc(n) || 1));
