import { queryClient } from "@/data/api/query";

/**
 * Invalidate recipe queries plus the cost rollups they feed (catalog cost chips,
 * sku/addon costs) after a recipe mutation.
 */
export const invalidateRecipes = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return typeof k === "string" && (k.startsWith("/recipes") || k.startsWith("/costing") || k.startsWith("/menu-items"));
    },
  });
