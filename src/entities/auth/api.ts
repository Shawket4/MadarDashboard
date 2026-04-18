import { apiClient } from "@/shared/api/client";
import type { LoginResponse, UserPublic } from "@/shared/types";

export const authApi = {
  login: (data: { email?: string; password?: string; pin?: string; name?: string }) =>
    apiClient.post<LoginResponse>("/auth/login", data).then((r) => r.data),
  me: () => apiClient.get<{ user: UserPublic }>("/auth/me").then((r) => r.data),
};
