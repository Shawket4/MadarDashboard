import { useGetOrg, useGetOrgModules } from "@/data/api/generated/api";
import type { Org } from "@/data/api/generated/models";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";

/** Every module: what a platform user with no org pinned sees. */
export const ALL_MODULES: readonly string[] = ["pos", "dawam"];

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
export function useOrgModulesState(): { modules: readonly string[]; known: boolean } {
  const orgId = useOrgId();
  const q = useGetOrgModules(orgId ?? "", { query: { enabled: !!orgId, staleTime: 60_000 } });
  if (!orgId) return { modules: ALL_MODULES, known: true };
  if (q.data) return { modules: q.data.modules, known: true };
  return { modules: [], known: false };
}

/** The switched-on modules; empty until the server has answered. */
export function useOrgModules(): readonly string[] {
  return useOrgModulesState().modules;
}
