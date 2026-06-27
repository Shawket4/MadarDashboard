import { create } from "zustand";

import { useTheme } from "@/lib/theme";

/**
 * Theme for the public customer ordering page only. Unlike the dashboard's
 * global theme (which follows the device by default), this defaults to **light**
 * — a storefront should look the same for every customer regardless of their
 * phone's dark-mode setting — with a toggle to switch. It is persisted under its
 * own key so it never clobbers the operator's dashboard theme.
 *
 * The page applies this on mount and restores the dashboard theme on unmount
 * (see PublicOrderingPage), so it's fully scoped to the order flow.
 */
export type OrderMode = "light" | "dark";

const STORAGE_KEY = "madar.order.theme";

const getStored = (): OrderMode => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "light"; // default light, NOT the device preference
};

const applyClass = (mode: OrderMode) => {
  const el = document.documentElement;
  el.classList.toggle("dark", mode === "dark");
  el.style.colorScheme = mode;
};

interface OrderThemeStore {
  mode: OrderMode;
  /** Apply this page's theme to <html> (call on mount). */
  apply: () => void;
  setMode: (m: OrderMode) => void;
  toggle: () => void;
  /** Restore the dashboard's global theme (call on unmount). */
  restoreGlobal: () => void;
}

export const useOrderTheme = create<OrderThemeStore>((set, get) => ({
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
