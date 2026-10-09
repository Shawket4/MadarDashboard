/**
 * The branch plan on top of the orval-generated client (`/branch-plan`). No
 * hand-written requests: this file only maps the wire shape to `Plan`, whose
 * fields are all present, so the pure functions in `plan.ts` never deal with
 * `undefined`.
 */
import {
  getGetPlanQueryKey, getListVersionsQueryKey, savePlan, useCreateCode, useGetPlan, useListVersions,
} from "@/data/api/generated/api";
import type {
  BranchPlan, BranchPlanView, PlanRegisteredDevice, PrinterBrand,
} from "@/data/api/generated/models";
import { queryClient } from "@/data/api/query";

import type { DeviceKind, Plan, PrinterRole, Connection } from "./plan";

export type { BranchPlanView, PlanRegisteredDevice, PrinterBrand };

export const fromWire = (p: BranchPlan): Plan => ({
  devices: (p.devices ?? []).map((d) => ({
    id: d.id,
    kind: d.kind as DeviceKind,
    name: d.name,
    receipt_printer_id: d.receipt_printer_id ?? null,
    device_id: d.device_id ?? null,
    x: d.x,
    y: d.y,
  })),
  printers: (p.printers ?? []).map((pr) => ({
    id: pr.id,
    role: pr.role as PrinterRole,
    name: pr.name,
    connection: pr.connection as Connection,
    brand: pr.brand ?? null,
    ip: pr.ip ?? null,
    port: pr.port ?? null,
    paper_mm: pr.paper_mm,
    host_device_id: pr.host_device_id ?? null,
    x: pr.x,
    y: pr.y,
  })),
  sections: (p.sections ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    is_default: s.is_default,
    category_ids: s.category_ids ?? [],
    screen_ids: s.screen_ids ?? [],
    printer_ids: s.printer_ids ?? [],
    x: s.x,
    y: s.y,
  })),
  till_prints_kitchen: p.till_prints_kitchen ?? false,
});

/** The wire shape is the plan itself; names are trimmed on the way out. */
export const toWire = (plan: Plan): BranchPlan => ({
  ...plan,
  devices: plan.devices.map((d) => ({ ...d, name: d.name.trim() })),
  printers: plan.printers.map((p) => ({
    ...p,
    name: p.name.trim(),
    brand: (p.brand as PrinterBrand | null) ?? null,
    ip: p.connection === "network" ? (p.ip ?? "").trim() || null : null,
    port: p.connection === "network" ? p.port ?? 9100 : null,
    host_device_id: p.connection === "network" ? null : p.host_device_id,
  })),
  sections: plan.sections.map((s) => ({ ...s, name: s.name.trim() })),
});

export function useBranchPlan(branchId: string | null) {
  return useGetPlan({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId } });
}

export function usePlanVersions(branchId: string | null, enabled: boolean) {
  return useListVersions({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId && enabled } });
}

export async function saveBranchPlan(branchId: string, expectedVersion: number, plan: Plan): Promise<BranchPlanView> {
  const view = await savePlan({ branch_id: branchId, expected_version: expectedVersion, plan: toWire(plan) });
  queryClient.setQueryData(getGetPlanQueryKey({ branch_id: branchId }), view);
  void queryClient.invalidateQueries({ queryKey: getListVersionsQueryKey({ branch_id: branchId }) });
  // Sections are kitchen stations and categories their routes: the kitchen
  // pages read the same rows.
  void queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/kitchen"),
  });
  return view;
}

export const reloadBranchPlan = (branchId: string) =>
  queryClient.invalidateQueries({ queryKey: getGetPlanQueryKey({ branch_id: branchId }) });

/** An 8-digit code whose device fills one slot of the plan (BB-8). */
export function useSlotCode() {
  return useCreateCode({
    mutation: {
      onSuccess: () =>
        void queryClient.invalidateQueries({
          predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/devices"),
        }),
    },
  });
}

/** The API's refusal code on a 409, if there is one. */
export const refusalCode = (err: unknown): string | null => {
  const r = (err as { response?: { status?: number; data?: { code?: string } } })?.response;
  return r?.status === 409 ? r.data?.code ?? null : null;
};

// ── Live state ──────────────────────────────────────────────────────────────

/** A device reports in at most every 5 minutes; twice that is still "online". */
export const ONLINE_WITHIN_MS = 10 * 60_000;

export type Presence = "online" | "offline" | "unclaimed";

export const presenceOf = (
  deviceId: string | null,
  registered: Map<string, PlanRegisteredDevice>,
  now: number,
): { presence: Presence; seen: PlanRegisteredDevice | null } => {
  const seen = deviceId ? registered.get(deviceId) ?? null : null;
  if (!seen) return { presence: "unclaimed", seen: null };
  return { presence: now - Date.parse(seen.last_seen_at) <= ONLINE_WITHIN_MS ? "online" : "offline", seen };
};

/** The registered install kind a slot takes: a kitchen screen runs the KDS app. */
export const installKindFor = (kind: DeviceKind): string => (kind === "kitchen" ? "kds" : kind);
