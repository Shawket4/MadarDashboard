import type { PublicAddonItem, PublicItemSize } from "@/shared/api/generated/models";
import type { ID } from "./types";

/** RFC4122 id when available, else a timestamp+random fallback. */
export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** A size's price, falling back to the item base when there's no override. */
export const getSizePrice = (basePrice: number, size?: PublicItemSize): number => {
  if (!size) return basePrice;
  // nullish fallback — 0 is a legitimate override, undefined/null means "use base"
  return size.price_override ?? basePrice;
};

export const getAddonPrice = (a: PublicAddonItem): number => a.default_price ?? 0;

/** Stable signature so identical configurations merge into one cart line. */
export const lineSignature = (itemId: ID, sizeId: ID | undefined, addonIds: ID[]): string =>
  `${itemId}|${sizeId ?? "-"}|${[...addonIds].sort().join(",")}`;

/** Subtle haptic feedback. No-op on iOS Safari and desktop. */
export const haptic = (intensity: "light" | "medium" | "heavy" = "light"): void => {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const map = { light: 8, medium: 14, heavy: 22 };
  try {
    navigator.vibrate(map[intensity]);
  } catch {
    /* noop */
  }
};

/** Up-to-two-letter monogram for the image fallback. */
export const getMonogram = (name: string): string => {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "·";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const w = words[0];
  return w.substring(0, Math.min(w.length, 2)).toUpperCase();
};

// Combining diacritical marks (U+0300–U+036F), built without literal marks in source.
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/** Accent-insensitive normalisation for search (café → cafe). */
export const normalize = (s: string): string =>
  (s ?? "").toLowerCase().normalize("NFD").replace(DIACRITICS, "");
