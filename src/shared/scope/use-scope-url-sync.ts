import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { SCOPE_PRESETS, rangeForPreset, useScopeStore, type ScopePreset } from "./scope-store";

/**
 * Mounted once in Layout: mirrors the scope store to
 * ?branch=&from=&to=&preset= and hydrates from the URL on first load
 * (URL wins, so shared deep links override the persisted scope).
 */
export const useScopeUrlSync = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const branchId = useScopeStore((s) => s.branchId);
  const from = useScopeStore((s) => s.from);
  const to = useScopeStore((s) => s.to);
  const preset = useScopeStore((s) => s.preset);
  const hydrated = useRef(false);

  // First load: URL wins
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const { setBranch, setRange } = useScopeStore.getState();
    const urlBranch = searchParams.get("branch");
    const urlPreset = searchParams.get("preset") as ScopePreset | null;
    const urlFrom = searchParams.get("from");
    const urlTo = searchParams.get("to");

    if (urlBranch) setBranch(urlBranch);
    if (urlPreset && urlPreset !== "custom" && SCOPE_PRESETS.includes(urlPreset as never)) {
      const r = rangeForPreset(urlPreset as Exclude<ScopePreset, "custom">);
      setRange(r.from, r.to, urlPreset);
    } else if (urlFrom && urlTo) {
      setRange(urlFrom, urlTo, "custom");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Afterwards: store wins — keep the URL carrying the current scope
  useEffect(() => {
    if (!hydrated.current) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (branchId) next.set("branch", branchId);
        else next.delete("branch");
        next.set("preset", preset);
        if (preset === "custom" && from && to) {
          next.set("from", from);
          next.set("to", to);
        } else {
          next.delete("from");
          next.delete("to");
        }
        return next;
      },
      { replace: true },
    );
    // location.pathname keeps the params present after every navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, from, to, preset, location.pathname]);
};
