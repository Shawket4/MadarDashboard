import { useAuthStore } from "@/data/stores/auth.store";
import { useAppStore } from "@/data/stores/app.store";
import { APP_TZ } from "@/data/config/constants";
import { MOCK_TOKEN, MOCK_USER } from "./data";
import { worker } from "./browser";

/**
 * Dev-only: start the MSW service worker and seed a logged-in org_admin session
 * so the auth guard passes and queries resolve against curated data.
 * Called from main.tsx before render when VITE_MOCK is set.
 * Never bundled in prod.
 */
export async function enableMocks(): Promise<void> {
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });

  useAuthStore.getState().signIn(MOCK_TOKEN, MOCK_USER);
  if (MOCK_USER.org_id) useAppStore.getState().setSelectedOrg(MOCK_USER.org_id);
  useAppStore.getState().setActiveTimezone(APP_TZ);

  console.info(`[mock] MSW service worker active — ${MOCK_USER.name}`);
}
