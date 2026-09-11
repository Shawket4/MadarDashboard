import { create } from "zustand";

import { useTheme } from "@/lib/theme";

/**
 * Theme for the PUBLIC guest surfaces — ordering, order tracking and table
 * bookings. Unlike the dashboard's global theme (which follows the device by
 * default), this defaults to **light**: a storefront should look the same for
 * every customer regardless of their phone's dark-mode setting, with a toggle
 * to switch. It is persisted under its own key so it never clobbers the
 * operator's dashboard theme.
 *
 * Each page applies this on mount and restores the dashboard theme on unmount,
 * so it stays scoped to the guest flow.
 */
export type PublicThemeMode = "light" | "dark";

const STORAGE_KEY = "madar.public.theme";
/** What this was called when it belonged to the ordering feature alone. */
const LEGACY_STORAGE_KEY = "madar.order.theme";

const getStored = (): PublicThemeMode => {
  try {
    const v = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "light"; // default light, NOT the device preference
};

const applyClass = (mode: PublicThemeMode) => {
  const el = document.documentElement;
  el.classList.toggle("dark", mode === "dark");
  el.style.colorScheme = mode;
};

interface PublicThemeStore {
  mode: PublicThemeMode;
  /** Apply this page's theme to <html> (call on mount). */
  apply: () => void;
  setMode: (m: PublicThemeMode) => void;
  toggle: () => void;
  /** Restore the dashboard's global theme (call on unmount). */
  restoreGlobal: () => void;
}

export const usePublicTheme = create<PublicThemeStore>((set, get) => ({
  mode: getStored(),
  apply: () => applyClass(get().mode),
  setMode: (mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    applyClass(mode);
    set({ mode });
  },
  toggle: () => get().setMode(get().mode === "dark" ? "light" : "dark"),
  restoreGlobal: () => applyClass(useTheme.getState().resolvedTheme),
}));

/**
 * Paint the storefront theme at boot — light unless this visitor has chosen
 * otherwise on this shop before.
 *
 * The guest bundles' equivalent of `initDeviceTheme`, and deliberately not the
 * device's preference: a storefront should look the same to every customer
 * whatever their phone is set to, which is what the toggle is for.
 */
export function initPublicTheme(): void {
  usePublicTheme.getState().apply();
}
