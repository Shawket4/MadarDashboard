import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Target } from "lucide-react";

import { useGetMarginTargets, usePutMarginTarget } from "@/data/api/generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtNumber } from "@/lib/format";
import { invalidateInsights } from "./util";

const pctValid = (s: string): boolean => {
  if (s.trim() === "") return true; // empty = leave unchanged
  const v = Number(s);
  return Number.isFinite(v) && v > 0 && v < 100;
};

/**
 * Inline margin-target readout + editor. The trigger states the effective
 * target and where it comes from (branch override → org default → built-in);
 * the popover sets the org default and, when a single branch is scoped, that
 * branch's override. Saves PUT /insights/margin-target then invalidate the
 * ledger so rows re-rank against the new bar.
 */
export function TargetEditor({
  orgId,
  branchId,
  targetPct,
  targetSource,
}: {
  orgId: string;
  /** The scoped branch, or null for all-branches (org default only). */
  branchId: string | null;
  /** Effective target the report was ranked against (0–100). */
  targetPct: number | undefined;
  /** `branch` | `org` | `default` — from the report. */
  targetSource: string | undefined;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [orgStr, setOrgStr] = useState("");
  const [branchStr, setBranchStr] = useState("");

  const targets = useGetMarginTargets({ org_id: orgId }, { query: { enabled: open && !!orgId } });
  const put = usePutMarginTarget();

  // Seed the inputs from the fetched targets each time the popover opens.
  useEffect(() => {
    if (!open || !targets.data) return;
    setOrgStr(targets.data.org_default_pct != null ? String(targets.data.org_default_pct) : "");
    const override = branchId ? targets.data.branches.find((b) => b.branch_id === branchId) : undefined;
    setBranchStr(override ? String(override.target_pct) : "");
  }, [open, targets.data, branchId]);

  const pctLabel = fmtNumber(targetPct ?? 0, { maximumFractionDigits: 1 });
  const triggerText =
    targetSource === "branch"
      ? t("insights.target.branchSource", { pct: pctLabel, defaultValue: "Branch target {{pct}}%" })
      : targetSource === "org"
        ? t("insights.target.orgSource", { pct: pctLabel, defaultValue: "Org target {{pct}}%" })
        : t("insights.target.defaultSource", { pct: pctLabel, defaultValue: "Default {{pct}}% — set yours" });

  const initialOrg = targets.data?.org_default_pct != null ? String(targets.data.org_default_pct) : "";
  const initialBranch = branchId
    ? (() => {
        const o = targets.data?.branches.find((b) => b.branch_id === branchId);
        return o ? String(o.target_pct) : "";
      })()
    : "";
  const orgDirty = orgStr.trim() !== "" && orgStr !== initialOrg;
  const branchDirty = !!branchId && branchStr.trim() !== "" && branchStr !== initialBranch;
  const valid = pctValid(orgStr) && pctValid(branchStr);
  const canSave = valid && (orgDirty || branchDirty) && !put.isPending;

  const save = async () => {
    try {
      if (orgDirty) {
        await put.mutateAsync({ data: { target_pct: Number(orgStr) }, params: { org_id: orgId } });
      }
      if (branchDirty && branchId) {
        await put.mutateAsync({ data: { branch_id: branchId, target_pct: Number(branchStr) }, params: { org_id: orgId } });
      }
      await invalidateInsights();
      toast.success(t("common.savedChanges", "Changes saved"));
      setOpen(false);
    } catch {
      toast.error(t("common.somethingWrong", "Something went wrong"));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground underline decoration-dotted decoration-muted-foreground/40 underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Target className="size-3.5" />
          {triggerText}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-72 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t("insights.target.title", "Margin target")}</p>
          <p className="text-xs text-muted-foreground">
            {t("insights.target.hint", "Rows under this gross-margin bar get flagged.")}
          </p>
        </div>
        {targets.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            {branchId ? <Skeleton className="h-9 w-full" /> : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="insights-org-target">{t("insights.target.orgDefault", "Org default %")}</Label>
              <Input
                id="insights-org-target"
                type="number"
                inputMode="decimal"
                min={1}
                max={99}
                step={1}
                dir="ltr"
                value={orgStr}
                onChange={(e) => setOrgStr(e.target.value)}
                placeholder={String(targets.data?.builtin_default_pct ?? 60)}
                aria-invalid={!pctValid(orgStr)}
                className="tabular"
              />
            </div>
            {branchId ? (
              <div className="space-y-1.5">
                <Label htmlFor="insights-branch-target">{t("insights.target.branchOverride", "This branch %")}</Label>
                <Input
                  id="insights-branch-target"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={99}
                  step={1}
                  dir="ltr"
                  value={branchStr}
                  onChange={(e) => setBranchStr(e.target.value)}
                  placeholder={orgStr || String(targets.data?.builtin_default_pct ?? 60)}
                  aria-invalid={!pctValid(branchStr)}
                  className="tabular"
                />
              </div>
            ) : null}
          </div>
        )}
        <div className="flex justify-end">
          <Button size="sm" disabled={!canSave} loading={put.isPending} onClick={() => void save()}>
            {t("common.save", "Save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
