import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { orderApi } from "./api";
import type { OrdersQuery } from "@/shared/types";

export const useOrders = (params: OrdersQuery, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.orders(params),
    queryFn: () => orderApi.list(params),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useOrder = (id: string | null) =>
  useQuery({ queryKey: QUERY_KEYS.order(id ?? ""), queryFn: () => orderApi.get(id!), enabled: !!id });
