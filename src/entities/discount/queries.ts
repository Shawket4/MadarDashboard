import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { discountApi } from "./api";

export const useDiscounts = (orgId: string | null) =>
  useQuery({ queryKey: QUERY_KEYS.discounts(orgId ?? ""), queryFn: () => discountApi.list(orgId!), enabled: !!orgId });
