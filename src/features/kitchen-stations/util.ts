import { queryClient } from "@/data/api/query";

export const invalidateStations = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/kitchen/stations"),
  });

export const invalidateRouting = () =>
  queryClient.invalidateQueries({
    predicate: (q) => {
      const k = q.queryKey[0];
      return typeof k === "string" && (k.startsWith("/kitchen/routes") || k.startsWith("/kitchen/routing-mode"));
    },
  });
