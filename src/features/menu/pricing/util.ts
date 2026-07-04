import { queryClient } from "@/data/api/query";

/**
 * Reads on this screen come from the four legacy override list views (branch +
 * channel, items + add-ons) plus the per-item Studio aggregate. A single write
 * to the unified override table can change any of them, so we invalidate all of
 * them with one broad prefix predicate after every upsert / delete. Keeping the
 * net wide means switching the branch/channel dropdown never shows stale rows.
 */
const OVERRIDE_PREFIXES = [
  "/branch-menu-overrides",
  "/branch-addon-overrides",
  "/delivery/channel-overrides",
  "/delivery/channel-addon-overrides",
] as const;

export const invalidatePricingOverrides = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      if (typeof k !== "string") return false;
      // Per-item Studio aggregate (`/menu-items/{id}/studio`) carries the live
      // per-size override rows the expanded item cards read.
      if (k.startsWith("/menu-items/") && k.endsWith("/studio")) return true;
      return OVERRIDE_PREFIXES.some((p) => k.startsWith(p));
    },
  });
