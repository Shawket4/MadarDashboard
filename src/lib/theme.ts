import { create } from "zustand";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "sufrix.theme";

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
 * class on <html> and persists the raw choice under "sufrix.theme".
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

// Apply immediately on module load to avoid a flash of the wrong theme.
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
