import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { healthApi } from "./api";

export const useHealth = () =>
  useQuery({ queryKey: QUERY_KEYS.health, queryFn: healthApi.get, refetchInterval: 30_000, retry: false });
