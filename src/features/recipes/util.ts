import { queryClient } from "@/data/api/query";

/**
 * Invalidate recipe queries plus the cost rollups they feed (catalog cost chips,
 * sku/addon costs) after a recipe mutation.
 *
 * Prefixes covered:
 *  /recipes       – drink & addon ingredient lines
 *  /menu-items    – item detail (recipes embedded), addon-slots, optionals
 *  /addon-items   – addon list (cost column updates after ingredient changes)
 *  /costing       – /costing/menu-items, /costing/addon-items, /costing/catalog rollups
 *  /inventory     – /inventory/orgs/:id/catalog (useListCatalog in all three tabs)
 */
export const invalidateRecipes = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return (
        typeof k === "string" &&
        (k.startsWith("/recipes") ||
          k.startsWith("/menu-items") ||
          k.startsWith("/addon-items") ||
          k.startsWith("/costing") ||
          k.startsWith("/inventory"))
      );
    },
  });
