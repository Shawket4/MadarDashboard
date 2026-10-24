// Rewards by Madar, the owner's side: its own router, shell, sign-in and
// brand, over the dashboard's own Rewards pages (src/features/rewards).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";

import { initDeviceTheme } from "@/lib/theme";
import { setProduct } from "@/lib/product";
// Side-effect modules: the stores that wire themselves into the axios context.
import "@/data/stores/auth.store";
import "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { useAppStore } from "@/data/stores/app.store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/components/app/confirm-dialog";
import { queryClient } from "@/data/api/query";
import { restoreShell } from "@/data/api/persist-shell";
import { adoptSharedSession, keepSessionShared } from "@/data/api/shared-session";
import { loadSetup } from "@/features/rewards-teller/session";
import { createRewardsRouter } from "./router";

/**
 * `?org=` from the dashboard's link: a super admin lands on the shop they had
 * open there. Read once, then dropped from the address bar.
 */
function takeOrgParam(): void {
  const url = new URL(window.location.href);
  const org = url.searchParams.get("org");
  if (!org) return;
  url.searchParams.delete("org");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  if (useAuthStore.getState().user?.role === "super_admin" && useAppStore.getState().selectedOrgId !== org) {
    useAppStore.getState().setSelectedOrg(org);
  }
}

export async function mountOwner(root: HTMLElement): Promise<void> {
  setProduct("rewards");
  initDeviceTheme();

  // Signed out here but signed in to the Madar dashboard in this browser: take
  // that session (bounded), alongside the shell kept from the last visit.
  await Promise.all([adoptSharedSession(), restoreShell(queryClient)]);
  keepSessionShared();
  takeOrgParam();

  // A counter tablet (set up for a branch) that opens the bare address goes
  // to its counter, not to the owner's sign-in.
  if (!useAuthStore.getState().token && window.location.pathname === "/" && loadSetup()) {
    window.location.replace("/counter");
    return;
  }

  const router = createRewardsRouter();
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
