import { queryClient } from "@/data/api/query";

/**
 * NOTE (cross-session): this file was restored to unblock the inventory build
 * after it was removed during unrelated cleanup. `invalidateInventory` matches
 * the predicate pattern used by every other feature `util.ts`. The CATEGORIES /
 * WASTE_REASONS lists are frontend-only conventions (the backend stores both as
 * free-form strings) — the inventory module owner should confirm/replace them.
 * Both are surfaced through `t(key, rawValue)` so unknown values still render.
 */
export const invalidateInventory = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return typeof k === "string" && (
        k.startsWith("/inventory") ||
        k.startsWith("/org-ingredients") ||
        k.startsWith("/branch-inventory") ||
        k.startsWith("/stocktakes") ||
        k.startsWith("/purchasing") ||
        // Inventory reports (valuation, low-stock, consumption, shrinkage, waste)
        // read the same stock/movements a mutation just changed — refresh them too.
        k.startsWith("/reports")
      );
    },
  });

/** Measurement units for ingredients (canonical set from the legacy dashboard). */
export const UNITS = ["g", "kg", "ml", "l", "pcs"] as const;

/** Ingredient categories (frontend convention; backend `category` is free text). */
export const CATEGORIES = ["dairy", "produce", "meat", "dry_goods", "beverages", "packaging", "other"] as const;

/** Waste reasons (frontend convention; backend `reason` is free text). */
export const WASTE_REASONS = ["spoilage", "expired", "damaged", "overproduction", "spillage", "theft", "other"] as const;
