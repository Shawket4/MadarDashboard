import { queryClient } from "@/data/api/query";

export const invalidateOrgs = () =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/orgs"),
  });
