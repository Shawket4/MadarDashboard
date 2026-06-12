import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { subDays } from "date-fns";
import { cairoDateISO, cairoNow } from "@/shared/lib/format";
import { useAppStore } from "@/shared/auth/app-store";

export type ScopePreset = "today" | "yesterday" | "7d" | "30d" | "mtd" | "custom";

export const SCOPE_PRESETS: Exclude<ScopePreset, "custom">[] = ["today", "yesterday", "7d", "30d", "mtd"];

/** Cairo-calendar [from, to] for a named preset. */
export const rangeForPreset = (preset: Exclude<ScopePreset, "custom">): { from: string; to: string } => {
  const now = cairoNow();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  switch (preset) {
    case "today":
      return { from: cairoDateISO(y, m, d), to: cairoDateISO(y, m, d, true) };
    case "yesterday": {
      const p = subDays(now, 1);
      return {
        from: cairoDateISO(p.getFullYear(), p.getMonth(), p.getDate()),
        to: cairoDateISO(p.getFullYear(), p.getMonth(), p.getDate(), true),
      };
    }
    case "7d": {
      const p = subDays(now, 6);
      return { from: cairoDateISO(p.getFullYear(), p.getMonth(), p.getDate()), to: cairoDateISO(y, m, d, true) };
    }
    case "30d": {
      const p = subDays(now, 29);
      return { from: cairoDateISO(p.getFullYear(), p.getMonth(), p.getDate()), to: cairoDateISO(y, m, d, true) };
    }
    case "mtd":
      return { from: cairoDateISO(y, m, 1), to: cairoDateISO(y, m, d, true) };
  }
};

export interface ScopeState {
  branchId: string | null;
  from: string | null;
  to: string | null;
  preset: ScopePreset;
  setBranch: (id: string | null) => void;
  setRange: (from: string | null, to: string | null, preset: ScopePreset) => void;
}

const DEFAULT_PRESET: ScopePreset = "30d";

/**
 * Global org · branch · period scope, shared by every scoped page.
 * branchId delegates to the app store (which feeds the X-Branch API header
 * and persists), so there is exactly one source of truth for the branch.
 * Only the preset is persisted here — from/to are recomputed from it on
 * every load so "last 30 days" stays anchored to the current day.
 */
export const useScopeStore = create<ScopeState>()(
  persist(
    (set) => ({
      branchId: useAppStore.getState().selectedBranchId,
      preset: DEFAULT_PRESET,
      ...rangeForPreset(DEFAULT_PRESET),
      setBranch: (id) => {
        useAppStore.getState().setSelectedBranch(id);
        set({ branchId: id });
      },
      setRange: (from, to, preset) => set({ from, to, preset }),
    }),
    {
      name: "sufrix-scope",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ preset: s.preset }),
      merge: (persisted, current) => {
        const stored = (persisted as Partial<ScopeState> | undefined)?.preset;
        // custom ranges don't survive reloads — fall back to the default window
        const preset: ScopePreset = stored && stored !== "custom" && SCOPE_PRESETS.includes(stored as never)
          ? stored
          : DEFAULT_PRESET;
        const range = rangeForPreset(preset as Exclude<ScopePreset, "custom">);
        return { ...current, preset, from: range.from, to: range.to };
      },
    },
  ),
);

// The header scope bar isn't the only writer of the selected branch (login
// seeding, command palette, …) — mirror any app-store change into the scope.
useAppStore.subscribe((s, prev) => {
  if (s.selectedBranchId !== prev.selectedBranchId) {
    useScopeStore.setState({ branchId: s.selectedBranchId });
  }
});
