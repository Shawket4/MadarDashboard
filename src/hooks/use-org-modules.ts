import { useGetOrg } from "@/data/api/generated/api";
import type { Org } from "@/data/api/generated/models";
import { useOrgId } from "@/hooks/use-org-id";

/** Every module, which is what a person sees until the org answers (PS-2). */
export const ALL_MODULES: readonly string[] = ["pos", "dawam"];

/** The current org, when this person may read it. */
export function useCurrentOrg(): Org | undefined {
  const orgId = useOrgId();
  return useGetOrg(orgId ?? "", { query: { enabled: !!orgId } }).data;
}

/**
 * The org's switched-on modules (`pos`, `dawam`). Unknown (loading, no right
 * to read the org, an older backend) = all of them: hiding a page someone may
 * use is worse than showing one they don't.
 */
export function useOrgModules(): readonly string[] {
  return useCurrentOrg()?.modules ?? ALL_MODULES;
}
