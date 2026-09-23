import { useEffect } from "react";

import { useGetOrg, useListBranches } from "@/data/api/generated/api";
import { useAuthz } from "@/data/authz/use-authz";
import { APP_TZ } from "@/data/config/constants";
import { Cap } from "@/generated/capabilities";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";

/**
 * Keeps `appStore.activeTimezone` in sync with the current scope, resolving it
 * as **branch.timezone → org.timezone → APP_TZ**. Every date/time formatter
 * (`lib/format.ts`) reads that value, so the dashboard always renders times in
 * the branch/org's configured zone — never the operator's device timezone.
 *
 * The backend already folds the org default into each branch's `timezone`
 * (effective tz), so when a branch is selected its `timezone` alone is correct;
 * the org fetch only supplies the zone for the "all branches" roll-up.
 *
 * Mount once, high in the app shell (`/_app`). Subscribing to `activeTimezone`
 * here makes the shell (and its Outlet subtree) re-render when the zone resolves.
 */
export function useSyncTimezone(): void {
  const user = useAuthStore((s) => s.user);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const selectedBranchId = useAppStore((s) => s.selectedBranchId);
  const setActiveTimezone = useAppStore((s) => s.setActiveTimezone);
  // Subscribe so the shell re-renders (and formatters re-run) on tz change.
  useAppStore((s) => s.activeTimezone);

  const orgId = user?.role === "super_admin" ? selectedOrgId : (user?.org_id ?? null);
  // Reading the org is `org.settings.read` (the owner's). A branch manager
  // never asks: that was a 403 on every page (the audit's stray
  // `GET /orgs/{id}`); his roll-up zone comes from his branches instead.
  const canReadOrg = useAuthz().can(Cap.orgSettingsRead);

  // The org tz is only needed for the "all branches" roll-up; when a branch is
  // selected its effective `timezone` already folds in the org default.
  const { data: org } = useGetOrg(orgId ?? "", {
    query: { enabled: Boolean(orgId) && !selectedBranchId && canReadOrg },
  });
  const { data: branches } = useListBranches(
    { org_id: orgId ?? "" },
    { query: { enabled: Boolean(orgId) } },
  );

  const resolved = resolveTimezone({
    branchTz: selectedBranchId ? branches?.find((b) => b.id === selectedBranchId)?.timezone : undefined,
    orgTz: org?.timezone,
    branchZones: canReadOrg ? [] : (branches ?? []).map((b) => b.timezone),
  });

  useEffect(() => {
    if (resolved && resolved !== useAppStore.getState().activeTimezone) {
      setActiveTimezone(resolved);
    }
  }, [resolved, setActiveTimezone]);
}

/**
 * branch → org → (for someone who can't read the org) the zone of the
 * branches they see → APP_TZ. Each branch's zone already folds in the org
 * default, so the first one is the org's zone unless a branch overrides it.
 */
export function resolveTimezone(z: {
  branchTz?: string | null;
  orgTz?: string | null;
  branchZones: ReadonlyArray<string | null | undefined>;
}): string {
  return z.branchTz || z.orgTz || z.branchZones.find((t) => !!t) || APP_TZ;
}
