import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { orgApi } from "./api";

export const useOrgs = () => useQuery({ queryKey: QUERY_KEYS.orgs, queryFn: orgApi.list });
export const useOrg = (id: string | null) =>
  useQuery({ queryKey: QUERY_KEYS.org(id ?? ""), queryFn: () => orgApi.get(id!), enabled: !!id });
