import { useSyncExternalStore } from "react";

/**
 * The browser's view of the connection. It can say "online" on a Wi-Fi with
 * no internet, so a failed request is still read on its own (`failureOf`);
 * "offline" is trusted, and the counter says so before anyone taps.
 */
const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export const useOnline = (): boolean =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
