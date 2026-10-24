import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { useAppStore } from "@/data/stores/app.store";
import { DEFAULT_PRESET } from "./presets";

/**
 * Scope as typed, validated URL search params on an app shell: the single
 * source of truth for branch + period, so deep links are first-class. Used by
 * the dashboard's `/_app` and Rewards by Madar's shell. See `use-scope.ts`.
 */
export const scopeSearchSchema = z.object({
  branchId: z.string().optional(),
  preset: z.enum(["today", "yesterday", "7d", "30d", "mtd", "custom"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type ScopeUrlSearch = z.infer<typeof scopeSearchSchema>;

/**
 * Keep a shell's URL scope and the app store in step:
 *  - on a bare entry (no scope in the URL), fill it from the last-used scope,
 *    once, so every URL is complete and shareable;
 *  - mirror the URL into the store: branch → X-Branch header + persistence,
 *    preset → persisted default. Covers shared and deep links.
 */
export function useUrlScope(search: ScopeUrlSearch): void {
  const navigate = useNavigate();
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (search.branchId === undefined && search.preset === undefined) {
      const { selectedBranchId, scopePreset } = useAppStore.getState();
      // Only a preset that can resolve itself. The hand-picked range is not
      // persisted, so replaying "custom" would write a period with no dates —
      // a URL that says one thing and shows another. `useScope` now falls back
      // for anyone who still holds such a link; this stops minting new ones.
      const preset = scopePreset && scopePreset !== "custom" ? scopePreset : DEFAULT_PRESET;
      void navigate({
        to: ".",
        replace: true,
        search: (p: Record<string, unknown>) => ({ ...p, branchId: selectedBranchId ?? undefined, preset: preset as never }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const urlBranch = search.branchId ?? null;
    if (urlBranch !== useAppStore.getState().selectedBranchId) useAppStore.getState().setSelectedBranch(urlBranch);
    if (search.preset) useAppStore.getState().setScopePreset(search.preset);
  }, [search.branchId, search.preset]);
}
