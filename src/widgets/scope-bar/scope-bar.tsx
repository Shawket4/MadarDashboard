import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { SearchableSelect } from "@/shared/ui/searchable-select";
import { DateRangePicker } from "@/shared/ui/date-range-picker";
import { useListBranches } from "@/shared/api/generated/api";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import {
  SCOPE_PRESETS, rangeForPreset, useScopeStore, type ScopePreset,
} from "@/shared/scope/scope-store";
import { ScopeFilterDrawer } from "./scope-filter-drawer";

/**
 * Global scope bar (branch · period) in the header.
 *
 * - At `lg` and up: full controls inline (branch select, preset pills, range).
 * - Below `lg`: a single compact "Filters" chip that opens a bottom-sheet
 *   drawer, so the header never crowds on phones/tablets and every preset stays
 *   reachable (the inline preset pills are hidden under `lg`).
 *
 * The branch select is replaced by static text when the org has a single branch.
 */
export function ScopeBar() {
  const { t } = useTranslation();
  const { orgId, isReady } = useCurrentContext();
  const { data: branches = [] } = useListBranches(
    { org_id: orgId ?? "" },
    { query: { enabled: !!orgId } },
  );

  const branchId = useScopeStore((s) => s.branchId);
  const from = useScopeStore((s) => s.from);
  const to = useScopeStore((s) => s.to);
  const preset = useScopeStore((s) => s.preset);
  const setBranch = useScopeStore((s) => s.setBranch);
  const setRange = useScopeStore((s) => s.setRange);

  // Default to the first branch so scoped pages always have one
  useEffect(() => {
    if (!branches.length) return;
    const valid = branchId && branches.some((b) => b.id === branchId);
    if (!valid) setBranch(branches[0].id);
  }, [branches, branchId, setBranch]);

  if (!isReady || !orgId || branches.length === 0) return null;

  const applyPreset = (p: Exclude<ScopePreset, "custom">) => {
    const r = rangeForPreset(p);
    setRange(r.from, r.to, p);
  };

  return (
    <>
      {/* ≥ lg — full inline controls */}
      <div className="hidden lg:flex items-center gap-2 justify-end min-w-0">
        {branches.length === 1 ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <MapPin size={12} /> {branches[0].name}
          </span>
        ) : (
          <SearchableSelect
            className="w-40 h-8 text-xs"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
            value={branchId}
            onChange={(v) => v && setBranch(v)}
            placeholder={t("scope.selectBranch")}
          />
        )}

        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
          {SCOPE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={cn(
                "px-2 py-1 rounded-md text-xs transition-colors",
                preset === p
                  ? "bg-background shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`scope.presets.${p}`)}
            </button>
          ))}
        </div>

        <DateRangePicker from={from} to={to} onChange={(f, to2) => setRange(f, to2, "custom")} />
      </div>

      {/* < lg — compact filters drawer */}
      <div className="flex lg:hidden">
        <ScopeFilterDrawer
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          branchId={branchId}
          onBranch={setBranch}
          from={from}
          to={to}
          preset={preset}
          onPreset={applyPreset}
          onRange={(f, to2) => setRange(f, to2, "custom")}
        />
      </div>
    </>
  );
}
