import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, SlidersHorizontal, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker } from "@/components/app/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListBranches } from "@/data/api/generated/api";
import { useAppStore } from "@/data/stores/app.store";
import { useAuthStore } from "@/data/stores/auth.store";
import { useScope } from "@/data/scope/use-scope";
import { SCOPE_PRESETS, type ScopePreset } from "@/data/scope/presets";
import { cn } from "@/lib/utils";

const ALL_BRANCHES = "__all__";

const presetFallback: Record<ScopePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom",
};

function ScopeControls({ className }: { className?: string }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  const canPickBranch = user?.role === "super_admin" || user?.role === "org_admin";
  const orgId = user?.role === "super_admin" ? selectedOrgId : (user?.org_id ?? null);

  const { branchId, preset, from, to, setBranch, setPreset, setCustomRange } = useScope();

  const { data: branches, isLoading: branchesLoading } = useListBranches(
    { org_id: orgId ?? "" },
    { query: { enabled: Boolean(canPickBranch && orgId) } },
  );
  const activeBranches = useMemo(() => (branches ?? []).filter((b) => b.is_active), [branches]);

  // Self-heal a stale/invalid scoped branch: a branchId persisted from a prior
  // session/org (login doesn't reset it) or one since deactivated isn't in this
  // org's list, yet every scoped query still fires against it and 403/404s — a
  // silent, data-less state that today only a logout clears. If the scoped
  // branch isn't a valid active branch here, fall back to "all branches".
  useEffect(() => {
    if (!canPickBranch || !orgId || branchesLoading || !branches) return;
    if (branchId && !activeBranches.some((b) => b.id === branchId)) setBranch(null);
  }, [canPickBranch, orgId, branchesLoading, branches, activeBranches, branchId, setBranch]);

  // An org with a single branch has nothing to pick: pin scope to it and drop
  // the "All branches" multi-select for a static label.
  const singleBranch = activeBranches.length === 1 ? activeBranches[0] : null;
  useEffect(() => {
    if (singleBranch && branchId !== singleBranch.id) setBranch(singleBranch.id);
  }, [singleBranch, branchId, setBranch]);

  const presetOptions = useMemo(
    () => SCOPE_PRESETS.map((p) => ({ value: p, label: t(`scope.preset.${p}`, presetFallback[p]) })),
    [t],
  );

  return (
    <div className={className}>
      {canPickBranch && branchesLoading && !singleBranch ? (
        <div
          className="flex h-8 w-auto min-w-32 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground"
          aria-busy="true"
        >
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
          <span>{t("common.loading", "Loading…")}</span>
        </div>
      ) : canPickBranch && singleBranch ? (
        <div className="flex h-8 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium" title={singleBranch.name}>
          <Store className="size-4 text-muted-foreground" />
          <span className="max-w-40 truncate">{singleBranch.name}</span>
        </div>
      ) : canPickBranch ? (
        <Select value={branchId ?? ALL_BRANCHES} onValueChange={(v) => setBranch(v === ALL_BRANCHES ? null : v)}>
          <SelectTrigger className="h-8 w-auto min-w-32 gap-2">
            <Store className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BRANCHES}>{t("scope.allBranches", "All branches")}</SelectItem>
            {activeBranches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <DateRangePicker
        preset={preset}
        from={from}
        to={to}
        presets={presetOptions}
        onSelectPreset={(key) => setPreset(key as ScopePreset)}
        onApplyCustom={(f, t2) => setCustomRange(f, t2)}
      />
    </div>
  );
}

/** Inline scope controls for the desktop header. */
export function ScopeBar() {
  return <ScopeControls className="flex items-center gap-2" />;
}

/** Compact popover with the same controls — for the mobile header. */
export function ScopeBarMobile({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon-sm" className={cn(className)} aria-label={t("common.filters", "Filters")}>
          <SlidersHorizontal className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60">
        <ScopeControls className="flex flex-col gap-2 [&_[data-slot=select-trigger]]:w-full" />
      </PopoverContent>
    </Popover>
  );
}
