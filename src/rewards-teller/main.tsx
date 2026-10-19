// The Rewards teller page — loyalty sold on its own (REWARDS_DESIGN.md), served on its
// OWN origin (rewards.madar-pos.cloud) like the loyalty, ordering and reservations
// apps: its own bundle (no admin code), no shared cookies or storage with the
// dashboard, and the public CSP at the edge. One screen at a time (set up →
// PIN → counter), so no router.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

// The same self-hosted superfamily as the other public apps, Latin + Arabic only.
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-400.css";
import "@fontsource/ibm-plex-sans-arabic/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";

import { i18nReady } from "@/i18n";
import "@/styles/globals.css";
import { bootMotion } from "@/lib/motion";
import { queryClient } from "@/data/api/query";
import { initRules } from "@/lib/rules";
import * as rulesWasm from "@/lib/rules/wasm/public/madar_web.js";
import { ConfirmProvider } from "@/components/app/confirm-dialog";
import { PublicToaster } from "@/features/public-shell/public-toaster";
import { initPublicTheme } from "@/features/public-shell/use-public-theme";
import { RewardsApp } from "@/features/rewards-teller/rewards-app";

document.documentElement.classList.add("brand-surface");
initPublicTheme();
bootMotion();

// Online-first: the worker only keeps the page's shell for a flaky moment; it
// never answers an API call (no offline queue).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

void Promise.all([initRules(rulesWasm), i18nReady]).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <RewardsApp />
        </ConfirmProvider>
        <PublicToaster />
      </QueryClientProvider>
    </StrictMode>,
  );
});
