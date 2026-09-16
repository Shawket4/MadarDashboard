/**
 * Devices (TILLS_CONTRACT §2.4) and payment-method availability (§2.3) on top
 * of the orval-generated client. No hand-written requests live here.
 */
import {
  useGetAvailability,
  useGetEffective,
  useCreateCode,
  useListClientVersions,
  useListCodes,
  useListDevices,
  useRevokeCode,
  usePutBranchAvailability,
  usePutDeviceAvailability,
  usePutUserAvailability,
  useUpdateDevice,
} from "@/data/api/generated/api";
import type {
  ActivationCode,
  AllowList,
  ClientSeen,
  Device,
  DeviceKind,
  PaymentMethodAvailability,
  UpdateDeviceRequest,
} from "@/data/api/generated/models";
import { queryClient } from "@/data/api/query";

export type PatchDeviceRequest = UpdateDeviceRequest;
export type { ActivationCode, AllowList, ClientSeen, Device, DeviceKind, PaymentMethodAvailability };

export type AvailabilityScope = "branches" | "users" | "devices";

export const DEVICE_CODE_RE = /^[A-Z0-9]{1,6}$/;

const invalidate = (...prefixes: string[]) =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && prefixes.some((p) => (q.queryKey[0] as string).startsWith(p)),
  });

export function useDevices(branchId: string | null | undefined) {
  return useListDevices({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId } });
}

/** Clients seen in the window (org-wide without a branch); `legacyOnly` keeps those still on pre-rework paths. */
export function useClientVersions(branchId: string | null | undefined, legacyOnly: boolean, days = 14) {
  return useListClientVersions({ branch_id: branchId || undefined, legacy_only: legacyOnly, days });
}

/** A branch's device activation codes (POS_SIGNIN_OVERHAUL §4), newest first. */
export function useActivationCodes(branchId: string | null | undefined) {
  return useListCodes({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId } });
}

export function useIssueActivationCode() {
  return useCreateCode({ mutation: { onSuccess: () => void invalidate("/devices/activation-codes") } });
}

export function useRevokeActivationCode() {
  return useRevokeCode({ mutation: { onSuccess: () => void invalidate("/devices/activation-codes") } });
}

export function usePatchDevice() {
  return useUpdateDevice({ mutation: { onSuccess: () => void invalidate("/devices", "/tills") } });
}

export function useAvailability(branchId: string | null | undefined) {
  return useGetAvailability({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId } });
}

/** The methods a charge would offer for this branch/teller/device. */
export function useEffectiveMethods(branchId: string | null | undefined, userId?: string, deviceId?: string) {
  return useGetEffective(
    { branch_id: branchId ?? "", user_id: userId, device_id: deviceId },
    { query: { enabled: !!branchId } },
  );
}

/** One mutation over the three owner-scoped PUTs. */
export function usePutAvailability() {
  const opts = { mutation: { onSuccess: () => void invalidate("/payment-methods") } };
  const branch = usePutBranchAvailability(opts);
  const user = usePutUserAvailability(opts);
  const device = usePutDeviceAvailability(opts);
  const pending = branch.isPending || user.isPending || device.isPending;
  return {
    isPending: pending,
    mutate: (
      v: { scope: AvailabilityScope; id: string; data: AllowList },
      cb?: { onSuccess?: () => void; onError?: (e: unknown) => void },
    ) => {
      if (v.scope === "branches") branch.mutate({ branchId: v.id, data: v.data }, cb);
      else if (v.scope === "users") user.mutate({ userId: v.id, data: v.data }, cb);
      else device.mutate({ deviceId: v.id, data: v.data }, cb);
    },
  };
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
