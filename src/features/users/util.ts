import { queryClient } from "@/data/api/query";

export const invalidateUsers = () =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/users"),
  });
