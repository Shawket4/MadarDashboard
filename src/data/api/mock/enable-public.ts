import { worker } from "./browser";

/**
 * Dev-only: start the MSW worker for the public ordering / landing apps. Unlike
 * `enableMocks`, this seeds NO admin session — the public surfaces are
 * unauthenticated and (by design) never import the admin auth/app stores. Gated
 * behind VITE_MOCK in the order app's entry; tree-shaken from prod builds.
 */
export async function enablePublicMocks(): Promise<void> {
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
  console.info("[mock] public MSW worker active");
}
