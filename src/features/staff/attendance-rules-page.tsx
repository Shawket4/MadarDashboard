import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, GripVertical, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { ErrorState } from "@/components/app/empty-state";
import { Restricted } from "@/components/app/restricted";
import { useConfirm } from "@/components/app/confirm-dialog";
import { RowAction } from "@/features/users/row-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  deleteBranchRules, putAttendanceSettings, useGetAttendanceSettings, useListBranchRules,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { invalidateAttendance } from "./util";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { DawamRulesCard } from "@/features/dawam/rules-card";
import {
  branchBody, EMPTY_VALUES, fullBody, ruleLabel, rulesSchema, valuesFrom,
  type RulesValues, type Tier,
} from "./rules-form";

/** The business's own rules in the branch selector. */
const BUSINESS = "__business__";

/**
 * The operating rules: what lateness costs, what an absence costs, and whether
 * approved permissions are paid — for the business, or one branch's overrides
 * of it (RU-2).
 *
 * The ladder is the centrepiece. "31–120 minutes late costs half a day" is
 * exactly one row here, and it is what the backend's `select_late_tier` reads at
 * check-out — so what you set is literally what gets charged, with no separate
 * copy of the policy anywhere.
 *
 * Who: `hr.rules.edit` changes them; `hr.rules.view` (a branch manager) sees
 * them read-only, for their own branches. The server enforces both.
 */
export function AttendanceRulesPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const confirm = useConfirm();
  const canEdit = authz.can(Cap.hrRulesEdit);
  const canView = canEdit || authz.can(Cap.hrRulesView);
  const readOnly = !canEdit;
  const canGender = canEdit && authz.can(Cap.hrRosterSettings);

  const [scope, setScope] = useState(BUSINESS);
  const branchId = scope === BUSINESS ? null : scope;
  const branchesQ = useListBranchRules({ query: { enabled: canView } });
  const query = useGetAttendanceSettings(branchId ? { branch_id: branchId } : {}, { query: { enabled: canView } });
  const [busy, setBusy] = useState(false);
  // Rules this branch hands back to the business on the next save.
  const [inherit, setInherit] = useState<string[]>([]);

  const schema = useMemo(() => rulesSchema(t), [t]);
  const form = useForm<RulesValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES, mode: "onChange" });
  const [loaded, setLoaded] = useState<RulesValues>(EMPTY_VALUES);

  useEffect(() => {
    const s = query.data;
    if (!s) return;
    // A business that never saved starts from the suggested ladder (RU-1).
    const v = valuesFrom(s, { suggest: !branchId && canEdit });
    setLoaded(valuesFrom(s));
    form.reset(v);
    setInherit([]);
  }, [query.data, branchId, canEdit, form]);

  const values = form.watch();
  const tiers = values.tiers;
  const errors = form.formState.errors;
  const tierError = errors.tiers?.message ?? errors.tiers?.root?.message;
  const overridden = branchId ? query.data?.overridden ?? [] : [];

  const setTiers = (next: Tier[]) => form.setValue("tiers", next, { shouldDirty: true, shouldValidate: true });
  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const from = last?.to_minutes != null ? last.to_minutes + 1 : 1;
    setTiers([...tiers, { from_minutes: from, to_minutes: from + 14, kind: "minutes", value: 15 }]);
  };
  const patchTier = (i: number, patch: Partial<Tier>) =>
    setTiers(tiers.map((tier, index) => (index === i ? { ...tier, ...patch } : tier)));

  const save = form.handleSubmit(
    async (v) => {
      const body = branchId ? branchBody(branchId, v, loaded, inherit) : fullBody(v, canGender);
      if (!body) {
        toast.info(t("staff.rulesNothingChanged", "Nothing changed"));
        return;
      }
      setBusy(true);
      try {
        await putAttendanceSettings(body);
        toast.success(t("staff.rulesSaved", "Rules saved"));
        void invalidateAttendance();
      } catch (e) {
        toast.error(getErrorMessage(e));
      } finally {
        setBusy(false);
      }
    },
    (errs) => {
      const first = Object.values(errs)[0] as { message?: string; root?: { message?: string } } | undefined;
      toast.error(first?.message ?? first?.root?.message ?? t("staff.rulesInvalid", "Check the highlighted rules"));
    },
  );

  const followBusiness = async () => {
    if (!branchId) return;
    const name = branchesQ.data?.find((b) => b.branch_id === branchId)?.branch_name ?? "";
    const ok = await confirm({
      title: t("staff.rulesFollowBusinessTitle", { name, defaultValue: `${name} follows the business's rules?` }),
      description: t("staff.rulesFollowBusinessHint", "Every rule this branch sets itself goes back to the business's value."),
      confirmLabel: t("staff.rulesFollowBusiness", "Follow the business"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteBranchRules(branchId);
      toast.success(t("staff.rulesSaved", "Rules saved"));
      void invalidateAttendance();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const title = t("staff.rules", "Attendance rules");
  if (authz.ready && !canView) {
    return <Restricted title={title} who={t("staff.rulesNoAccess", "The owner sets the rules. Ask them for access to see them.")} />;
  }

  const branchSelect = (
    <Select value={scope} onValueChange={setScope}>
      <SelectTrigger className="w-64" aria-label={t("staff.rulesFor", "Rules for")}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={BUSINESS}>{t("staff.rulesBusiness", "The business (every branch)")}</SelectItem>
        {(branchesQ.data ?? []).map((b) => (
          <SelectItem key={b.branch_id} value={b.branch_id}>
            {b.overridden.length
              ? t("staff.rulesBranchOwn", { name: b.branch_name, defaultValue: `${b.branch_name} · own rules` })
              : b.branch_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (query.isLoading || query.error) {
    return (
      <Page width="reading">
        <PageHeader title={title} below={branchSelect} />
        {query.error ? (
          <ErrorState
            title={t("staff.rulesLoadError", "Couldn't load attendance rules")}
            message={getErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}
      </Page>
    );
  }

  return (
    <Page width="reading">
      <PageHeader
        title={title}
        description={t(
          "staff.rulesSubtitle",
          "What lateness and absence cost. These are the rules the system charges against — an approved request waives them for that day.",
        )}
        actions={
          readOnly ? null : (
            <Button onClick={() => void save()} disabled={busy || !!tierError}>
              <Save className="size-4" />
              {t("common.save", "Save")}
            </Button>
          )
        }
        below={branchSelect}
      />

      {readOnly ? (
        <p role="status" className="flex items-center gap-2 rounded-2xl border bg-muted/40 p-4 text-sm">
          <Eye className="size-4 shrink-0" />
          {t("staff.rulesReadOnly", "You can see the rules. Only the owner changes them.")}
        </p>
      ) : null}

      {!branchId && query.data && !query.data.rules_saved_at ? (
        <p role="status" className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm font-medium">
          {t("dawam.rulesFirstTitle", "Save the rules before anyone can clock in")}
          {canEdit ? (
            <span className="block font-normal text-muted-foreground">
              {t("staff.rulesSuggested", "A suggested ladder is filled in. Change it to suit you, then save.")}
            </span>
          ) : null}
        </p>
      ) : null}

      {branchId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("staff.rulesBranchTitle", "This branch's own rules")}</CardTitle>
            <CardDescription>
              {t(
                "staff.rulesBranchHint",
                "Everything else is the business's. A rule you change here becomes this branch's own; the pay period, the advance cap and gender mode are the business's only.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overridden.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("staff.rulesBranchNone", "None — this branch follows the business.")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {overridden.map((name) => {
                  const going = inherit.includes(name);
                  return (
                    <Badge key={name} variant={going ? "outline" : "secondary"} className={going ? "gap-1 line-through" : "gap-1"}>
                      {ruleLabel(name, t)}
                      {readOnly ? null : (
                        <button
                          type="button"
                          className="rounded-full p-0.5 hover:bg-muted"
                          aria-label={
                            going
                              ? t("staff.rulesKeepOwn", { rule: ruleLabel(name, t), defaultValue: `Keep ${ruleLabel(name, t)}` })
                              : t("staff.rulesInherit", { rule: ruleLabel(name, t), defaultValue: `Use the business's ${ruleLabel(name, t)}` })
                          }
                          onClick={() => setInherit(going ? inherit.filter((n) => n !== name) : [...inherit, name])}
                        >
                          {going ? <RotateCcw className="size-3" /> : <X className="size-3" />}
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
            )}
            {!readOnly && overridden.length ? (
              <Button variant="outline" size="sm" onClick={() => void followBusiness()}>
                <RotateCcw className="size-4" />
                {t("staff.rulesFollowBusiness", "Follow the business")}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("staff.lateLadder", "Late arrival penalties")}</CardTitle>
          <CardDescription>
            {t(
              "staff.lateLadderHint",
              "Charged from the end of the shift's grace period, so a rung starting at 1 minute means one minute past grace. Rungs must not overlap; leave the last rung's end empty to catch everything above it.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tiers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("staff.noTiers", "No penalties — lateness is recorded but never charged.")}
            </p>
          ) : (
            tiers.map((tier, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
                <GripVertical className="mb-2 size-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1">
                  <Label className="text-xs">{t("staff.fromMinutes", "From (min)")}</Label>
                  <Input
                    aria-label={t("staff.fromMinutes", "From (min)")}
                    type="number"
                    min="0"
                    className="w-24"
                    disabled={readOnly}
                    value={tier.from_minutes}
                    onChange={(e) => patchTier(i, { from_minutes: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("staff.toMinutes", "To (min)")}</Label>
                  <Input
                    aria-label={t("staff.toMinutes", "To (min)")}
                    type="number"
                    min="0"
                    className="w-24"
                    disabled={readOnly}
                    placeholder={t("staff.noLimit", "no limit")}
                    value={tier.to_minutes ?? ""}
                    onChange={(e) =>
                      patchTier(i, {
                        to_minutes: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("staff.deduct", "Deduct")}</Label>
                  <Select
                    value={tier.kind}
                    disabled={readOnly}
                    onValueChange={(v) => patchTier(i, { kind: v as Tier["kind"] })}
                  >
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">{t("staff.kindMinutes", "Minutes of pay")}</SelectItem>
                      <SelectItem value="day_fraction">{t("staff.kindDayFraction", "Fraction of a day")}</SelectItem>
                      <SelectItem value="piastres">{t("staff.kindFixed", "Fixed amount")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("staff.amount", "Amount")}</Label>
                  <Input
                    aria-label={t("staff.amount", "Amount")}
                    type="number"
                    step={tier.kind === "day_fraction" ? "0.25" : "1"}
                    min="0"
                    className="w-28"
                    disabled={readOnly}
                    value={tier.kind === "piastres" ? piastresToEgp(tier.value) : tier.value}
                    onChange={(e) =>
                      patchTier(i, {
                        value:
                          tier.kind === "piastres"
                            ? egpToPiastres(Number(e.target.value))
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <p className="mb-2 flex-1 text-xs text-muted-foreground">
                  {describeTier(tier, t)}
                </p>
                {readOnly ? null : (
                  <RowAction
                    destructive
                    label={t("staff.removeTier", "Remove rung")}
                    className="mb-1"
                    onClick={() => setTiers(tiers.filter((_, index) => index !== i))}
                  >
                    <Trash2 className="size-4" />
                  </RowAction>
                )}
              </div>
            ))
          )}

          {tierError ? <p className="text-sm text-destructive">{tierError}</p> : null}

          {readOnly ? null : (
            <Button variant="outline" size="sm" onClick={addTier}>
              <Plus className="size-4" />
              {t("staff.addTier", "Add a rung")}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("staff.payBasis", "Pay basis")}</CardTitle>
            <CardDescription>
              {t(
                "staff.payBasisHint",
                "How a monthly salary is divided. Everything above is priced from these two numbers.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ar-days">{t("staff.workingDays", "Working days per month")}</Label>
              <Input id="ar-days" type="number" min="1" step="0.5" disabled={readOnly} {...form.register("workingDays")} />
              {errors.workingDays ? <p className="text-xs text-destructive">{errors.workingDays.message}</p> : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ar-absence">{t("staff.absenceDays", "Days docked per absence")}</Label>
              <Input id="ar-absence" type="number" min="0" step="0.25" disabled={readOnly} {...form.register("absenceDays")} />
              {errors.absenceDays ? <p className="text-xs text-destructive">{errors.absenceDays.message}</p> : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ar-buffer">{t("staff.autoBuffer", "Auto-close after (min)")}</Label>
              <Input id="ar-buffer" type="number" min="0" disabled={readOnly} {...form.register("autoBuffer")} />
              {errors.autoBuffer ? <p className="text-xs text-destructive">{errors.autoBuffer.message}</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("staff.policies", "Policies")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* No location switch: app punches are always fenced (CL-2). */}
            <p className="text-xs text-muted-foreground">
              {t("staff.fenceAlwaysOn", "Clocking in from the app always checks the phone is inside the branch's radius.")}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="ar-excused">{t("staff.excusedPaid", "Approved permissions are paid")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "staff.excusedPaidHint",
                    "The default when approving a mid-shift permission or early departure. Any single request can be decided the other way.",
                  )}
                </p>
              </div>
              <Switch
                id="ar-excused"
                disabled={readOnly}
                checked={values.excusedPaid}
                onCheckedChange={(v) => form.setValue("excusedPaid", v, { shouldDirty: true })}
              />
            </div>
          </CardContent>
        </Card>
        <DawamRulesCard
          value={values.dawam}
          onChange={(v) => form.setValue("dawam", v, { shouldDirty: true, shouldValidate: true })}
          canGender={canGender}
          readOnly={readOnly}
          branch={!!branchId}
        />
        {errors.dawam?.message ? <p className="text-sm text-destructive">{errors.dawam.message}</p> : null}
      </div>
    </Page>
  );
}

/** A plain-language restatement of a rung, so the operator can read back what
 *  they just built without doing the arithmetic in their head. */
function describeTier(tier: Tier, t: TFunction): string {
  const range =
    tier.to_minutes === null
      ? t("staff.tierFromOnly", "{{from}}+ min late", { from: tier.from_minutes })
      : t("staff.tierRange", "{{from}}–{{to}} min late", {
          from: tier.from_minutes,
          to: tier.to_minutes,
        });
  const cost =
    tier.kind === "minutes"
      ? t("staff.tierCostMinutes", "{{n}} minutes of pay", { n: tier.value })
      : tier.kind === "day_fraction"
        ? t("staff.tierCostDay", "{{n}} of a day's pay", { n: tier.value })
        : fmtMoney(tier.value);
  return `${range} → ${cost}`;
}
