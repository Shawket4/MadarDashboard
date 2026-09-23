import { useEffect, useRef } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppFooter } from "@/components/layout/app-footer";
import { DemoBanner } from "@/components/app/demo-banner";
import { ModuleGate } from "@/components/app/module-gate";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAuth } from "@/lib/auth-guard";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { useSyncTimezone } from "@/data/scope/use-timezone";
import { DEFAULT_PRESET } from "@/data/scope/presets";
import { useBranchRealtime } from "@/data/realtime/use-branch-realtime";
import { useOrgId } from "@/hooks/use-org-id";
import { useGetOnboarding } from "@/data/api/generated/api";
import { ONBOARDING_SKIP_KEY } from "@/features/onboarding/config";

/**
 * Scope as typed, validated URL search params on the app shell — the single
 * source of truth for branch + period. Declared here so every `/_app` child
 * inherits them and deep links are first-class. See `data/scope/use-scope.ts`.
 */
const scopeSearchSchema = z.object({
  branchId: z.string().optional(),
  preset: z.enum(["today", "yesterday", "7d", "30d", "mtd", "custom"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const Route = createFileRoute("/_app")({
  validateSearch: scopeSearchSchema,
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: AppLayout,
});

function AppLayout() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const restored = useRef(false);

  // Resolve the active branch/org timezone so every formatter renders in the
  // configured zone, not the device's. See data/scope/use-timezone.ts.
  useSyncTimezone();

  // One realtime stream for the selected branch, shared by every page (floor,
  // bookings, tickets, delivery). Mounted here so navigation never reconnects.
  useBranchRealtime(search.branchId);

  // First-run gate: a fresh org_admin whose onboarding isn't complete is routed
  // into the full-screen setup wizard. Skipping (the wizard's "Skip for now")
  // sets a per-session flag so they aren't bounced straight back; completing it
  // flips `completed` and the gate stops firing for good.
  const orgId = useOrgId();
  const role = useAuthStore((s) => s.user?.role);
  const skipped = (() => {
    try {
      return sessionStorage.getItem(ONBOARDING_SKIP_KEY) === "1";
    } catch {
      return false;
    }
  })();
  const onboarding = useGetOnboarding(orgId ?? "", {
    query: { enabled: !!orgId && role === "org_admin" && !skipped },
  });
  useEffect(() => {
    if (onboarding.data && !onboarding.data.completed && !skipped) {
      void navigate({ to: "/onboarding" });
    }
  }, [onboarding.data, skipped, navigate]);

  // On a bare entry (no scope in the URL), hydrate it from the persisted
  // last-used scope so every URL is complete and shareable. Runs once.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (search.branchId === undefined && search.preset === undefined) {
      const { selectedBranchId, scopePreset } = useAppStore.getState();
      // Only a preset that can resolve itself. The hand-picked range is not
      // persisted, so replaying "custom" would write a period with no dates —
      // a URL that says one thing and shows another. `useScope` now falls back
      // for anyone who still holds such a link; this stops minting new ones.
      const preset = scopePreset && scopePreset !== "custom" ? scopePreset : DEFAULT_PRESET;
      void navigate({
        to: ".",
        replace: true,
        search: (p: Record<string, unknown>) => ({ ...p, branchId: selectedBranchId ?? undefined, preset: preset as never }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror the URL scope into the app store: branch → X-Branch header +
  // persistence, preset → persisted default. Covers shared/deep links.
  useEffect(() => {
    const urlBranch = search.branchId ?? null;
    if (urlBranch !== useAppStore.getState().selectedBranchId) useAppStore.getState().setSelectedBranch(urlBranch);
    if (search.preset) useAppStore.getState().setScopePreset(search.preset);
  }, [search.branchId, search.preset]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DemoBanner />
        <AppHeader />
        <ModuleGate>
          <Outlet />
        </ModuleGate>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
