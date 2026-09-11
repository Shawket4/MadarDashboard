import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "madar.theme";

const getStored = (): Theme => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
};

const prefersDark = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolve = (t: Theme): "light" | "dark" => (t === "system" ? (prefersDark() ? "dark" : "light") : t);

const applyClass = (resolved: "light" | "dark") => {
  const el = document.documentElement;
  el.classList.toggle("dark", resolved === "dark");
  el.style.colorScheme = resolved;
};

interface ThemeStore {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
}

const initial = getStored();

/**
 * Minimal global theme controller (replaces next-themes). Toggles the `.dark`
 * class on <html> and persists the raw choice under "madar.theme".
 */
export const useTheme = create<ThemeStore>((set) => ({
  theme: initial,
  resolvedTheme: resolve(initial),
  setTheme: (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    const resolvedTheme = resolve(theme);
    applyClass(resolvedTheme);
    set({ theme, resolvedTheme });
  },
}));

/**
 * Paint the operator's theme and follow the device from then on.
 *
 * CALLED, not a module side effect. It used to run on import, and every public
 * bundle imports this module — for `restoreGlobal`, transitively — so a
 * customer opening a menu on a dark phone got the dark dashboard theme painted
 * before any page could say otherwise, and the OS listener below then fought
 * the storefront's own light theme for the life of the page.
 *
 * A storefront is not the operator's console: it should look the same to every
 * customer whatever their phone is set to. Only the dashboard and the marketing
 * site call this; the guest surfaces call `initPublicTheme` instead.
 */
export function initDeviceTheme(): void {
  // Immediately, to avoid a flash of the wrong theme.
  applyClass(useTheme.getState().resolvedTheme);

  // Follow the OS when in "system" mode.
  if (typeof window !== "undefined") {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (useTheme.getState().theme === "system") {
        const resolvedTheme = resolve("system");
        applyClass(resolvedTheme);
        useTheme.setState({ resolvedTheme });
      }
    });
  }
}
