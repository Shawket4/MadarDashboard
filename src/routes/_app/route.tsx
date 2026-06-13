import { useEffect, useRef } from "react";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAuth } from "@/lib/auth-guard";
import { useAppStore } from "@/data/stores/app.store";

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

  // On a bare entry (no scope in the URL), hydrate it from the persisted
  // last-used scope so every URL is complete and shareable. Runs once.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (search.branchId === undefined && search.preset === undefined) {
      const { selectedBranchId, scopePreset } = useAppStore.getState();
      void navigate({
        to: ".",
        replace: true,
        search: (p: Record<string, unknown>) => ({ ...p, branchId: selectedBranchId ?? undefined, preset: (scopePreset || "30d") as never }),
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
        <AppHeader />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
