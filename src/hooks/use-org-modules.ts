import { useEffect } from "react";

import { useGetOrg, useGetOrgModules } from "@/data/api/generated/api";
import type { Org, OrgModules } from "@/data/api/generated/models";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { safeStorage } from "@/lib/safe-storage";

/** Every module: what a platform user with no org pinned sees. */
const ALL_MODULES: readonly string[] = ["pos", "dawam"];

/**
 * The current org, when this person may read it (`orgs:read`, the owner's).
 * Only for its name and settings — never for the modules, which every
 * member reads from `GET /orgs/{id}/modules`.
 */
export function useCurrentOrg(): Org | undefined {
  const orgId = useOrgId();
  // Only someone who may read it asks: a manager's page must not 403.
  const canRead = useAuthz().can(Cap.orgSettingsRead);
  return useGetOrg(orgId ?? "", { query: { enabled: !!orgId && canRead } }).data;
}

/**
 * The org's switched-on modules as the server says (PS-2), for anyone who
 * works there — a branch manager included. `known` is false until it answers:
 * nothing module-tagged is shown or routed to on a guess, so a Dawam-only
 * org's manager never glimpses a POS page.
 */
export interface OrgModulesState {
  modules: readonly string[];
  known: boolean;
  /** The server could not be asked (never "all modules" on an error). */
  error?: unknown;
  retry?: () => void;
}

/** Where the last answer for an org is kept (a cold load renders from it at once). */
export const MODULES_KEY_PREFIX = "madar.modules.";
const KEY = (orgId: string) => `${MODULES_KEY_PREFIX}${orgId}`;

/** The last `/orgs/{id}/modules` answer for this org, kept in storage. */
export function rememberedModules(orgId: string | null | undefined): OrgModules | undefined {
  if (!orgId) return undefined;
  try {
    const raw = safeStorage.getItem(KEY(orgId));
    const parsed = raw ? (JSON.parse(raw) as OrgModules) : undefined;
    return parsed && Array.isArray(parsed.modules) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * While the answer loads, the last answer for this org (kept in storage) stands
 * in, like `remembered()` for authz: ModuleGate renders at once on a cold load
 * and the server's answer replaces it in the background, so a plan or module
 * change takes effect as soon as it lands.
 */
export function useOrgModulesState(): OrgModulesState {
  const orgId = useOrgId();
  const q = useGetOrgModules(orgId ?? "", {
    query: { enabled: !!orgId, staleTime: 60_000, placeholderData: () => rememberedModules(orgId) },
  });
  const fresh = !q.isPlaceholderData ? q.data : undefined;
  useEffect(() => {
    if (!orgId || !fresh) return;
    try {
      safeStorage.setItem(KEY(orgId), JSON.stringify(fresh));
    } catch {
      /* storage is a convenience */
    }
  }, [orgId, fresh]);
  if (!orgId) return { modules: ALL_MODULES, known: true };
  if (q.data) return { modules: q.data.modules, known: true };
  return { modules: [], known: false, error: q.error ?? undefined, retry: () => void q.refetch() };
}

/** The switched-on modules; empty until the server has answered. */
export function useOrgModules(): readonly string[] {
  return useOrgModulesState().modules;
}
