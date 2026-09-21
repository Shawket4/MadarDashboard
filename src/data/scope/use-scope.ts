import { useNavigate, useSearch } from "@tanstack/react-router";
import { APP_TZ } from "@/data/config/constants";
import { useAppStore } from "@/data/stores/app.store";
import { DEFAULT_PRESET, rangeForPreset, type ScopePreset } from "./presets";

interface ScopeSearch {
  branchId?: string;
  preset?: ScopePreset;
  from?: string;
  to?: string;
}

/**
 * The all-zeros UUID is the backend's "every branch in my org" sentinel for the
 * `/reports/branches/{branch_id}/…` endpoints. The scope models "All branches"
 * as `branchId === null`; report hooks pass `scopeBranchId`, which substitutes
 * this id so a single endpoint serves both a specific branch and the roll-up.
 */
export const ALL_BRANCHES_ID = "00000000-0000-0000-0000-000000000000";

export interface Scope {
  /** The selected branch, or `null` for "All branches". */
  branchId: string | null;
  /** Branch id to send to branch-scoped report endpoints: the selected branch,
   *  or the all-branches sentinel when none is selected. Never null. */
  scopeBranchId: string;
  /** True when no single branch is selected (the all-branches roll-up). */
  isAllBranches: boolean;
  preset: ScopePreset;
  /**
   * Active-timezone day-bounded ISO instants, resolved from the preset or the
   * custom range. NEVER null: a scope always names a period, so no page has to
   * decide what "no period" means (they disagreed — see the fallback below).
   */
  from: string;
  to: string;
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

  const urlPreset: ScopePreset = search.preset ?? DEFAULT_PRESET;
  const branchId = search.branchId ?? null;
  // Subscribe to the resolved branch/org timezone so preset day-boundaries are
  // recomputed when the scope (and thus its zone) changes.
  const tz = useAppStore((s) => s.activeTimezone) || APP_TZ;
  // "Custom" is only a period while it carries its dates, and it can arrive
  // without them: the last-used preset is persisted, the hand-picked range is
  // not, so a bare-URL entry replays `custom` with nothing to resolve. A null
  // range is not a smaller period — it asks every page a different question.
  // Pages that gate on `from`/`to` (the till sessions report) then show "none
  // in this period" for ever, and pages that pass them through as `undefined`
  // quietly query ALL time. Neither is what the picker claims to be showing,
  // so an incomplete custom falls back to the default preset, and SAYS so:
  // the label in the picker and the rows on screen describe one window.
  const custom = urlPreset === "custom" && search.from && search.to
    ? { from: search.from, to: search.to }
    : null;
  const namedPreset: Exclude<ScopePreset, "custom"> =
    urlPreset === "custom" ? DEFAULT_PRESET : urlPreset;
  const preset: ScopePreset = custom ? "custom" : namedPreset;
  const range = custom ?? rangeForPreset(namedPreset, tz);

  const update = (patch: Partial<ScopeSearch>) =>
    void navigate({ to: ".", replace: true, search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }) });

  return {
    branchId,
    scopeBranchId: branchId ?? ALL_BRANCHES_ID,
    isAllBranches: branchId === null,
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
