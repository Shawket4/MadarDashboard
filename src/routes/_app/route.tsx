import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppFooter } from "@/components/layout/app-footer";
import { DemoBanner } from "@/components/app/demo-banner";
import { ModuleGate } from "@/components/app/module-gate";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAuth } from "@/lib/auth-guard";
import { useSyncTimezone } from "@/data/scope/use-timezone";
import { scopeSearchSchema, useUrlScope } from "@/data/scope/use-url-scope";
import { useBranchRealtime } from "@/data/realtime/use-branch-realtime";
import { useSyncPlan } from "@/hooks/use-plan";
import { useRoutePrefetch } from "@/hooks/use-route-prefetch";
import { NavPrefetchProvider } from "@/lib/prefetch/nav-context";

export const Route = createFileRoute("/_app")({
  validateSearch: scopeSearchSchema,
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: AppLayout,
});

function AppLayout() {
  const search = Route.useSearch();
  // Every link, tab and row in the app warms its destination's data on intent through this.
  const warmRoute = useRoutePrefetch();

  // Resolve the active branch/org timezone so every formatter renders in the
  // configured zone, not the device's. See data/scope/use-timezone.ts.
  useSyncTimezone();
  // The org's plan (Free / Paid) gates nav, panes and routes.
  useSyncPlan();

  // One realtime stream for the selected branch, shared by every page (floor,
  // bookings, tickets, delivery). Mounted here so navigation never reconnects.
  useBranchRealtime(search.branchId);

  // Branch + period live in the URL, mirrored into the app store.
  useUrlScope(search);

  return (
    <NavPrefetchProvider warm={warmRoute}>
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
    </NavPrefetchProvider>
  );
}
