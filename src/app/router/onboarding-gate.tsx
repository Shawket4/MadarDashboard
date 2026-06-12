import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useGetOnboarding } from "@/shared/api/generated/api";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { usePermissions } from "@/shared/hooks/use-permissions";

/**
 * After auth resolves, org admins whose org has not completed onboarding are
 * routed into the full-screen wizard — there is no client-side bypass; the
 * gate is locked until the backend reports `completed`. Orgs with historical
 * orders are pre-marked completed by the backend and never land here.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { orgId, isOrgAdmin, isSuperAdmin } = useCurrentContext();
  const { can, isLoading: permsLoading } = usePermissions();

  // Spec: gate org_admins (not super admins browsing other orgs)
  const eligible = !!orgId && isOrgAdmin && !isSuperAdmin && !permsLoading && can("orgs", "update");

  const { data: status } = useGetOnboarding(orgId ?? "", {
    query: { enabled: eligible, staleTime: 30_000 },
  });

  if (eligible && status && !status.completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
