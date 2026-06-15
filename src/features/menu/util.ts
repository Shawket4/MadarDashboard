import { queryClient } from "@/data/api/query";

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
          k.startsWith("/catalog"))
      );
    },
  });

/** Read the Arabic translation off a generated *_translations object. */
export const arOf = (translations: unknown): string => {
  const tr = translations as Record<string, unknown> | null | undefined;
  return tr && typeof tr.ar === "string" ? tr.ar : "";
};
