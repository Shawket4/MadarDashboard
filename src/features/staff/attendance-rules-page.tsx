import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { ErrorState } from "@/components/app/empty-state";
import { Restricted } from "@/components/app/restricted";
import { useConfirm } from "@/components/app/confirm-dialog";
import { RowAction } from "@/features/users/row-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { fmtMoney, fmtWireTime } from "@/lib/format";
import { invalidateAttendance } from "./util";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { dawamQuery, failedEmpty } from "@/features/dawam/live";
import { DawamRefreshButton } from "@/features/dawam/refresh-button";
import { DawamRulesCard, type CoverChoice } from "@/features/dawam/rules-card";
import { MoneyField, NumberField } from "@/components/inputs";
import { RulesPreview } from "./rules-preview-card";
import { changedRules, dayPiastres, tierPiastres, type PayExample, type RuleChange } from "./rules-preview";
import {
  BUSINESS_ONLY, branchBody, EMPTY_VALUES, fullBody, ruleLabel, rulesSchema, valuesFrom,
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
  const branchesQ = useListBranchRules({ query: dawamQuery({ enabled: canView }) });
  // The form below is reset from this answer (the effect on `query.data`), so it
  // refetches on focus only for someone who can't edit: a background refetch
  // must never throw away rules half typed (live.ts).
  const query = useGetAttendanceSettings(
    branchId ? { branch_id: branchId } : {},
    { query: dawamQuery({ enabled: canView, refetchOnWindowFocus: readOnly }) },
  );
  const [busy, setBusy] = useState(false);
  const [exampleIn, setExample] = useState<PayExample>({ salary: 1200000, workingDays: 30, shiftMinutes: 480 });
  // Rules this branch hands back to the business on the next save.
  const [inherit, setInherit] = useState<string[]>([]);
  // Cover pay a branch picked for itself though it followed the business (D5):
  // saved as its own even at the value it runs on now.
  const [coverOwnNew, setCoverOwnNew] = useState(false);

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
    setCoverOwnNew(false);
  }, [query.data, branchId, canEdit, form]);

  const values = form.watch();
  // The worked examples divide by the working days being edited, as payroll will.
  const example: PayExample = { ...exampleIn, workingDays: Number(values.workingDays) || 0 };
  const tiers = values.tiers;
  const errors = form.formState.errors;
  const tierError = errors.tiers?.message ?? errors.tiers?.root?.message;
  const overridden = branchId ? query.data?.overridden ?? [] : [];
  const COVER = "cover_pay_mode";
  const coverFollows = !coverOwnNew && (!overridden.includes(COVER) || inherit.includes(COVER));
  const chooseCover = (c: CoverChoice) => {
    if (c === "business") {
      setCoverOwnNew(false);
      if (overridden.includes(COVER) && !inherit.includes(COVER)) setInherit([...inherit, COVER]);
      // Back to what it runs on now, so nothing is sent as a change.
      form.setValue("dawam", { ...values.dawam, coverPayMode: loaded.dawam.coverPayMode }, { shouldDirty: true });
      return;
    }
    setInherit(inherit.filter((n) => n !== COVER));
    setCoverOwnNew(!overridden.includes(COVER));
    form.setValue("dawam", { ...values.dawam, coverPayMode: c }, { shouldDirty: true, shouldValidate: true });
  };

  const branchName = branchesQ.data?.find((b) => b.branch_id === branchId)?.branch_name ?? "";
  const dirty = form.formState.isDirty || inherit.length > 0;
  const setTiers = (next: Tier[]) => form.setValue("tiers", next, { shouldDirty: true, shouldValidate: true });
  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const from = last?.to_minutes != null ? last.to_minutes + 1 : 1;
    setTiers([...tiers, { from_minutes: from, to_minutes: from + 14, kind: "minutes", value: 15 }]);
  };
  const patchTier = (i: number, patch: Partial<Tier>) =>
    setTiers(tiers.map((tier, index) => (index === i ? { ...tier, ...patch } : tier)));

  /** Rules already in force change people's pay: say exactly what changes first. */
  const confirmChanges = async (v: RulesValues): Promise<boolean> => {
    if (!query.data?.rules_saved_at && !branchId) return true; // the first save sets them up
    const changes = changedRules(v, loaded, canGender).filter((c) => !branchId || !BUSINESS_ONLY.includes(c.name as never));
    if (changes.length === 0 && inherit.length === 0) return true;
    return confirm({
      title: branchId
        ? t("staff.rulesConfirmBranchTitle", { name: branchName, defaultValue: `Change ${branchName}'s rules?` })
        : t("staff.rulesConfirmTitle", "Change the rules for everyone?"),
      description: (
        <span className="block space-y-2">
          <span className="block">{t("staff.rulesConfirmHint", "From the next clock-in, these change what people are charged and paid:")}</span>
          <span className="block space-y-1">
            {changes.map((c) => (
              <span key={c.name} className="flex flex-wrap items-baseline gap-x-2 text-foreground">
                <span className="font-medium">{ruleLabel(c.name, t)}</span>
                <span className="text-muted-foreground tabular-nums">{describeChange(c, t)}</span>
              </span>
            ))}
            {inherit.map((n) => (
              <span key={n} className="block text-foreground">
                {t("staff.rulesConfirmInherit", { rule: ruleLabel(n, t), defaultValue: `${ruleLabel(n, t)}: back to the business's` })}
              </span>
            ))}
          </span>
        </span>
      ),
      confirmLabel: t("staff.rulesConfirmSave", "Save the changes"),
    });
  };

  const save = form.handleSubmit(
    async (v) => {
      const body = branchId ? branchBody(branchId, v, loaded, inherit, coverOwnNew ? [COVER] : []) : fullBody(v, canGender);
      if (!body) {
        toast.info(t("staff.rulesNothingChanged", "Nothing changed"));
        return;
      }
      if (!(await confirmChanges(v))) return;
      setBusy(true);
      try {
        await putAttendanceSettings(body);
        toast.success(t("staff.rulesSaved", "Rules saved"));
        void invalidateAttendance();
      } catch (e) {
        toast.error(getErrorMessage(e, { fieldLabel: (f) => ruleLabel(f, t) }));
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
    const name = branchName;
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
        <PageHeader title={title} actions={<DawamRefreshButton />} below={branchSelect} />
        {failedEmpty(query) ? (
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
        actions={<DawamRefreshButton />}
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
          {canEdit && !((query.data.late_deduction_tiers as unknown[] | undefined) ?? []).length ? (
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
            <ol className="space-y-2">
              {tiers.map((tier, i) => (
                <li key={i} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start">
                  <span aria-hidden className="hidden size-7 place-items-center rounded-full bg-secondary text-xs font-semibold tabular-nums md:grid">{i + 1}</span>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={`tier-${i}-from`} className="text-xs">{t("staff.fromMinutes", "From (min)")}</Label>
                      <NumberField
                        id={`tier-${i}-from`}
                        aria-label={t("staff.fromMinutes", "From (min)")}
                        suffix={t("inputs.unitMin", "min")}
                        min={0}
                        disabled={readOnly}
                        invalid={!!tierError}
                        value={tier.from_minutes}
                        onChange={(n) => patchTier(i, { from_minutes: n ?? 0 })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`tier-${i}-to`} className="text-xs">{t("staff.toMinutes", "To (min)")}</Label>
                      <NumberField
                        id={`tier-${i}-to`}
                        aria-label={t("staff.toMinutes", "To (min)")}
                        suffix={t("inputs.unitMin", "min")}
                        min={0}
                        allowEmpty
                        emptyLabel={t("staff.noLimit", "no limit")}
                        disabled={readOnly}
                        invalid={!!tierError}
                        value={tier.to_minutes}
                        onChange={(n) => patchTier(i, { to_minutes: n })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("staff.deduct", "Deduct")}</Label>
                      <Select
                        value={tier.kind}
                        disabled={readOnly}
                        onValueChange={(v) => patchTier(i, { kind: v as Tier["kind"], value: defaultTierValue(v as Tier["kind"]) })}
                      >
                        <SelectTrigger className="w-full" aria-label={t("staff.deduct", "Deduct")}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">{t("staff.kindMinutes", "Minutes of pay")}</SelectItem>
                          <SelectItem value="day_fraction">{t("staff.kindDayFraction", "Fraction of a day")}</SelectItem>
                          <SelectItem value="piastres">{t("staff.kindFixed", "Fixed amount")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`tier-${i}-amount`} className="text-xs">{t("staff.amount", "Amount")}</Label>
                      {tier.kind === "piastres" ? (
                        <MoneyField
                          id={`tier-${i}-amount`}
                          aria-label={t("staff.amount", "Amount")}
                          disabled={readOnly}
                          value={tier.value}
                          onChange={(p) => patchTier(i, { value: p ?? 0 })}
                        />
                      ) : (
                        <NumberField
                          id={`tier-${i}-amount`}
                          aria-label={t("staff.amount", "Amount")}
                          suffix={tier.kind === "minutes" ? t("inputs.unitMin", "min") : t("staff.ofADay", "of a day")}
                          step={tier.kind === "day_fraction" ? 0.25 : 5}
                          decimals={tier.kind === "day_fraction" ? 2 : 0}
                          min={0}
                          max={tier.kind === "day_fraction" ? 31 : undefined}
                          disabled={readOnly}
                          value={tier.value}
                          onChange={(n) => patchTier(i, { value: n ?? 0 })}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
                      {describeTier(tier, t)}
                      {tier.kind !== "piastres" ? (
                        <span className="tabular-nums"> · {t("staff.tierExample", { amount: fmtMoney(tierPiastres(tier, example)), defaultValue: `about ${fmtMoney(tierPiastres(tier, example))} on the example salary` })}</span>
                      ) : null}
                    </p>
                  </div>
                  {readOnly ? null : (
                    <RowAction
                      destructive
                      label={t("staff.removeTier", "Remove rung")}
                      onClick={() => setTiers(tiers.filter((_, index) => index !== i))}
                    >
                      <Trash2 className="size-4" />
                    </RowAction>
                  )}
                </li>
              ))}
            </ol>
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

      <RulesPreview tiers={tiers} example={example} onExample={setExample} />

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
            <div className="space-y-1.5">
              <Label htmlFor="ar-days">{t("staff.workingDays", "Working days per month")}</Label>
              <NumberField
                id="ar-days"
                step={0.5} decimals={2} suffix={t("staff.daysUnit", "days")}
                disabled={readOnly}
                invalid={!!errors.workingDays}
                value={values.workingDays.trim() === "" ? null : Number(values.workingDays)}
                onChange={(n) => form.setValue("workingDays", n === null ? "" : String(n), { shouldDirty: true, shouldValidate: true })}
              />
              {errors.workingDays ? <p className="text-xs text-destructive">{errors.workingDays.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-absence">{t("staff.absenceDays", "Days docked per absence")}</Label>
              <NumberField
                id="ar-absence"
                step={0.25} decimals={2} suffix={t("staff.daysUnit", "days")}
                hint={t("staff.absenceExample", { amount: fmtMoney(dayPiastres(example, Number(values.absenceDays) || 0)), defaultValue: `An absence docks about ${fmtMoney(dayPiastres(example, Number(values.absenceDays) || 0))} on the example salary.` })}
                disabled={readOnly}
                invalid={!!errors.absenceDays}
                value={values.absenceDays.trim() === "" ? null : Number(values.absenceDays)}
                onChange={(n) => form.setValue("absenceDays", n === null ? "" : String(n), { shouldDirty: true, shouldValidate: true })}
              />
              {errors.absenceDays ? <p className="text-xs text-destructive">{errors.absenceDays.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ar-buffer">{t("staff.autoBuffer", "Auto-close after (min)")}</Label>
              <NumberField
                id="ar-buffer"
                step={15} suffix={t("inputs.unitMin", "min")}
                disabled={readOnly}
                invalid={!!errors.autoBuffer}
                value={values.autoBuffer.trim() === "" ? null : Number(values.autoBuffer)}
                onChange={(n) => form.setValue("autoBuffer", n === null ? "" : String(n), { shouldDirty: true, shouldValidate: true })}
              />
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
          coverFollows={coverFollows}
          onCoverChoice={chooseCover}
        />
        {errors.dawam?.message ? <p className="text-sm text-destructive">{errors.dawam.message}</p> : null}
      </div>

      {readOnly ? null : (
        <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-t-xl border border-b-0 bg-card/95 px-4 py-3 shadow-[0_-4px_12px_-8px_rgb(0_0_0/0.2)] backdrop-blur supports-[backdrop-filter]:bg-card/85">
          <p role="status" className="text-sm">
            {tierError || Object.keys(errors).length ? (
              <span className="text-destructive">{t("staff.rulesFixFirst", "Fix the highlighted rules to save.")}</span>
            ) : dirty ? (
              <span className="font-medium">{t("staff.rulesUnsaved", "Unsaved changes")}</span>
            ) : !branchId && query.data && !query.data.rules_saved_at ? (
              <span className="font-medium">{t("staff.rulesNotSavedYet", "Not saved yet: nobody can clock in until you save.")}</span>
            ) : (
              <span className="text-muted-foreground">{t("staff.rulesAllSaved", "Everything is saved.")}</span>
            )}
          </p>
          <div className="flex gap-2">
            {dirty ? (
              <Button variant="ghost" onClick={() => { form.reset(valuesFrom(query.data!, { suggest: !branchId && canEdit })); setInherit([]); setCoverOwnNew(false); }}>
                {t("staff.rulesDiscard", "Discard changes")}
              </Button>
            ) : null}
            <Button onClick={() => void save()} loading={busy} disabled={!!tierError}>
              <Save className="size-4" />
              {t("common.save", "Save")}
            </Button>
          </div>
        </div>
      )}
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

/** A new rung's amount when its kind changes: a sensible start, never a leftover from another unit. */
function defaultTierValue(kind: Tier["kind"]): number {
  return kind === "minutes" ? 15 : kind === "day_fraction" ? 0.25 : 5000;
}

/** One changed rule, before → after, in words. */
function describeChange(c: RuleChange, t: TFunction): string {
  const show = (v: unknown): string => {
    if (v === null || v === undefined || v === "") return t("staff.changeNone", "none");
    if (typeof v === "boolean") return v ? t("common.yes", "Yes") : t("common.no", "No");
    if (Array.isArray(v)) return t("staff.changeRungs", { count: v.length, defaultValue: `${v.length} rungs` });
    if (typeof v === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(v)) return fmtWireTime(v);
    return String(v);
  };
  if (Array.isArray(c.after)) return `${show(c.before)} → ${show(c.after)}${Array.isArray(c.before) && c.before.length === c.after.length ? ` (${t("staff.changeEdited", "edited")})` : ""}`;
  return `${show(c.before)} → ${show(c.after)}`;
}
