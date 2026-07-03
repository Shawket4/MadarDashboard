import { queryClient } from "@/data/api/query";
import { getGetStudioQueryKey, getGetItemCostQueryKey } from "@/data/api/generated/api";

/**
 * Invalidate the Menu Studio aggregate + live-cost queries for one item, plus the
 * broader catalog lists so the items grid / POS-facing catalog reflect the edit.
 * Every studio mutation bumps `catalog_revision` server-side, so we re-fetch the
 * aggregate rather than patch it locally.
 */
export const invalidateStudio = (itemId: string) => {
  void queryClient.invalidateQueries({ queryKey: getGetStudioQueryKey(itemId) });
  void queryClient.invalidateQueries({ queryKey: getGetItemCostQueryKey(itemId) });
  void queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return (
        typeof k === "string" &&
        (k.startsWith("/menu-items") ||
          k.startsWith("/categories") ||
          k.startsWith("/catalog") ||
          k.startsWith("/costing") ||
          k.startsWith("/modifier-groups"))
      );
    },
  });
};

/** Read the Arabic translation off a generated `*_translations` object. */
export const arOf = (translations: unknown): string => {
  const tr = translations as Record<string, unknown> | null | undefined;
  return tr && typeof tr.ar === "string" ? tr.ar : "";
};
