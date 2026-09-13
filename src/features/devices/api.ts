/**
 * Devices (TILLS_CONTRACT §2.4) and payment-method availability (§2.3).
 * Hand-typed until the backend exports openapi.json; then orval replaces these.
 */
import { useMutation, useQuery } from "@tanstack/react-query";

import { customInstance } from "@/data/api/custom-instance";
import { queryClient } from "@/data/api/query";

export interface Device {
  id: string;
  org_id: string;
  branch_id: string | null;
  code: string;
  label: string | null;
  kind: "pos" | "kds" | "waiter";
  platform: string | null;
  app_version: string | null;
  first_seen_at: string;
  last_seen_at: string;
  retired_at: string | null;
  code_conflict: boolean;
}

export interface PatchDeviceRequest {
  code?: string;
  label?: string | null;
  branch_id?: string;
  retired?: boolean;
}

export interface AllowList {
  restricted: boolean;
  payment_method_ids: string[];
}

export interface PaymentMethodAvailability {
  branch_id: string;
  branch: AllowList;
  users: { user_id: string; payment_method_ids: string[] }[];
  devices: { device_id: string; payment_method_ids: string[] }[];
}

export type AvailabilityScope = "branches" | "users" | "devices";

export const DEVICE_CODE_RE = /^[A-Z0-9]{1,6}$/;

const invalidate = (...prefixes: string[]) =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && prefixes.some((p) => (q.queryKey[0] as string).startsWith(p)),
  });

export function useDevices(branchId: string | null | undefined) {
  return useQuery({
    queryKey: ["/devices", branchId],
    queryFn: () => customInstance<Device[]>({ url: "/devices", method: "GET", params: { branch_id: branchId } }),
    enabled: !!branchId,
  });
}

export function usePatchDevice() {
  return useMutation({
    mutationFn: (v: { id: string; data: PatchDeviceRequest }) =>
      customInstance<Device>({ url: `/devices/${v.id}`, method: "PATCH", data: v.data }),
    onSuccess: () => void invalidate("/devices", "/tills"),
  });
}

export function useAvailability(branchId: string | null | undefined) {
  return useQuery({
    queryKey: ["/payment-methods/availability", branchId],
    queryFn: () =>
      customInstance<PaymentMethodAvailability>({ url: "/payment-methods/availability", method: "GET", params: { branch_id: branchId } }),
    enabled: !!branchId,
  });
}

export function usePutAvailability() {
  return useMutation({
    mutationFn: (v: { scope: AvailabilityScope; id: string; data: AllowList }) =>
      customInstance<AllowList>({ url: `/payment-methods/availability/${v.scope}/${v.id}`, method: "PUT", data: v.data }),
    onSuccess: () => void invalidate("/payment-methods"),
  });
}

/** Wire allow-list for an owner: rows present = restricted. */
export function allowListFor(
  a: PaymentMethodAvailability | undefined,
  scope: AvailabilityScope,
  id: string,
): AllowList {
  if (!a) return { restricted: false, payment_method_ids: [] };
  if (scope === "branches") return a.branch;
  const rows = scope === "users" ? a.users.find((u) => u.user_id === id) : a.devices.find((d) => d.device_id === id);
  return rows ? { restricted: true, payment_method_ids: rows.payment_method_ids } : { restricted: false, payment_method_ids: [] };
}
