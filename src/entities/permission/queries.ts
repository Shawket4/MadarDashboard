import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/shared/config/constants";
import { permissionApi } from "./api";

export const usePermissionMatrix = (userId: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.permissions(userId ?? ""),
    queryFn: () => permissionApi.matrix(userId!),
    enabled: !!userId,
  });
