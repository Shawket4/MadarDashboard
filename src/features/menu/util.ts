import { queryClient } from "@/data/api/query";

/**
 * The label of the single size that carries a simple item's price.
 *
 * An item has no price of its own: price lives in `menu_item_sizes`, and every
 * item always has at least one row there. An item with exactly this one size
 * reads as "one price" — the editor shows a single Price box for it, and the
 * label is never shown to anyone or offered to a till as a size to choose.
 */
export const ONE_SIZE = "one_size";


/** Invalidate all catalog-related queries after a mutation. */
export const invalidateCatalog = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return (
        typeof k === "string" &&
        (k.startsWith("/menu-items") ||
          k.startsWith("/categories") ||
          k.startsWith("/addon-items") ||
          k.startsWith("/branch-menu-overrides") ||
          k.startsWith("/branch-addon-overrides") ||
          k.startsWith("/catalog") ||
          k.startsWith("/costing"))
      );
    },
  });

/** Read the Arabic translation off a generated *_translations object. */
export const arOf = (translations: unknown): string => {
  const tr = translations as Record<string, unknown> | null | undefined;
  return tr && typeof tr.ar === "string" ? tr.ar : "";
};
