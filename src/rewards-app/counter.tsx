// The counter (`/counter`): set up once by the owner, then PIN, then stamping.
// One screen at a time, so no router. A staff tool: no shared session with the
// owner's dashboard (a teller signs in with a PIN on the device).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/data/api/query";
import { initPublicTheme } from "@/features/public-shell/use-public-theme";
import { RewardsApp } from "@/features/rewards-teller/rewards-app";

export function mountCounter(root: HTMLElement): void {
  // Its own theme (light unless chosen on this device), not the owner's.
  initPublicTheme();

  // Online-first: the worker only keeps the page's shell for a flaky moment; it
  // never answers an API call (no offline queue).
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RewardsApp />
      </QueryClientProvider>
    </StrictMode>,
  );
}
