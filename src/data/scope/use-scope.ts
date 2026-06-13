import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAppStore } from "@/data/stores/app.store";
import { rangeForPreset, type ScopePreset } from "./presets";

interface ScopeSearch {
  branchId?: string;
  preset?: ScopePreset;
  from?: string;
  to?: string;
}

export interface Scope {
  branchId: string | null;
  preset: ScopePreset;
  /** Cairo day-bounded ISO start; resolved from the preset (or the custom range). */
  from: string | null;
  to: string | null;
  setBranch: (id: string | null) => void;
  setPreset: (preset: ScopePreset) => void;
  setCustomRange: (from: string, to: string) => void;
}

/**
 * The single source of truth for branch + period scope: validated URL search
 * params on the `/_app` route. Every scoped page reads this, so a link always
 * opens the exact same view. Branch selection also feeds the X-Branch header
 * synchronously (via the app store) so the next request carries it.
 */
export function useScope(): Scope {
  const search = useSearch({ strict: false }) as ScopeSearch;
  const navigate = useNavigate();

  const preset: ScopePreset = search.preset ?? "30d";
  const branchId = search.branchId ?? null;
  const range = preset === "custom"
    ? { from: search.from ?? null, to: search.to ?? null }
    : rangeForPreset(preset as Exclude<ScopePreset, "custom">);

  const update = (patch: Partial<ScopeSearch>) =>
    void navigate({ to: ".", replace: true, search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }) });

  return {
    branchId,
    preset,
    from: range.from,
    to: range.to,
    setBranch: (id) => {
      useAppStore.getState().setSelectedBranch(id);
      update({ branchId: id ?? undefined });
    },
    setPreset: (p) => {
      useAppStore.getState().setScopePreset(p);
      update({ preset: p, from: undefined, to: undefined });
    },
    setCustomRange: (from, to) => {
      useAppStore.getState().setScopePreset("custom");
      update({ preset: "custom", from, to });
    },
  };
}
