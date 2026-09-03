import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
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
import { putAttendanceSettings, useGetAttendanceSettings } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { invalidateAttendance, WEEKDAYS } from "./util";

/** One rung of the late-penalty ladder, in the shape the API stores. */
interface Tier {
  from_minutes: number;
  to_minutes: number | null;
  kind: "minutes" | "piastres" | "day_fraction";
  value: number;
}

/**
 * The operating rules: what lateness costs, what an absence costs, and whether
 * approved permissions are paid.
 *
 * The ladder is the centrepiece. "31–120 minutes late costs half a day" is
 * exactly one row here, and it is what the backend's `select_late_tier` reads at
 * check-out — so what you set is literally what gets charged, with no separate
 * copy of the policy anywhere.
 */
export function AttendanceRulesPage() {
  const { t } = useTranslation();
  const query = useGetAttendanceSettings({});
  const [busy, setBusy] = useState(false);

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [absenceDays, setAbsenceDays] = useState("1");
  const [otMultiplier, setOtMultiplier] = useState("1.5");
  const [workingDays, setWorkingDays] = useState("30");
  const [autoBuffer, setAutoBuffer] = useState("120");
  const [requireGeofence, setRequireGeofence] = useState(true);
  const [excusedPaid, setExcusedPaid] = useState(true);
  const [weekend, setWeekend] = useState<number[]>([5, 6]);

  useEffect(() => {
    const s = query.data;
    if (!s) return;
    setTiers((s.late_deduction_tiers as Tier[] | undefined) ?? []);
    setAbsenceDays(String(s.absence_deduction_days ?? 1));
    setOtMultiplier(String(s.default_overtime_multiplier ?? 1.5));
    setWorkingDays(String(s.working_days_per_month ?? 30));
    setAutoBuffer(String(s.auto_checkout_buffer_minutes ?? 120));
    setRequireGeofence(s.require_geofence ?? true);
    setExcusedPaid(s.excused_time_paid_default ?? true);
    setWeekend(s.weekend_days ?? [5, 6]);
  }, [query.data]);

  /**
   * The same non-overlap rule the server enforces in `rules::validate_tiers`.
   * Checked here too so the operator sees the problem on the row they are
   * editing rather than as a rejected save.
   */
  const tierError = useMemo(() => {
    const sorted = [...tiers].sort((a, b) => a.from_minutes - b.from_minutes);
    let previousEnd: number | null = null;
    for (const tier of sorted) {
      if (tier.from_minutes < 0) return t("staff.tierNegative", "Minutes cannot be negative");
      if (tier.to_minutes !== null && tier.to_minutes < tier.from_minutes) {
        return t("staff.tierInverted", "A rung cannot end before it starts");
      }
      if (tier.value < 0) return t("staff.tierNegativeValue", "A penalty cannot be negative");
      if (previousEnd !== null && tier.from_minutes <= previousEnd) {
        return t("staff.tierOverlap", "Rungs overlap at {{n}} minutes", { n: tier.from_minutes });
      }
      previousEnd = tier.to_minutes ?? Number.MAX_SAFE_INTEGER;
    }
    return null;
  }, [tiers, t]);

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const from = last?.to_minutes != null ? last.to_minutes + 1 : 1;
    setTiers([...tiers, { from_minutes: from, to_minutes: from + 14, kind: "minutes", value: 15 }]);
  };

  const patchTier = (i: number, patch: Partial<Tier>) =>
    setTiers(tiers.map((tier, index) => (index === i ? { ...tier, ...patch } : tier)));

  const save = async () => {
    if (tierError) {
      toast.error(tierError);
      return;
    }
    setBusy(true);
    try {
      await putAttendanceSettings({
        late_deduction_tiers: tiers,
        absence_deduction_days: Number(absenceDays),
        default_overtime_multiplier: Number(otMultiplier),
        working_days_per_month: Number(workingDays),
        auto_checkout_buffer_minutes: Number(autoBuffer),
        require_geofence: requireGeofence,
        excused_time_paid_default: excusedPaid,
        weekend_days: weekend,
      });
      toast.success(t("staff.rulesSaved", "Rules saved"));
      void invalidateAttendance();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (query.isLoading) return <Page><Skeleton className="h-96 w-full" /></Page>;

  return (
    <Page>
      <PageHeader
        title={t("staff.rules", "Attendance rules")}
        description={t(
          "staff.rulesSubtitle",
          "What lateness and absence cost. These are the rules the system charges against — an approved request waives them for that day.",
        )}
        actions={
          <Button onClick={() => void save()} disabled={busy || !!tierError}>
            <Save className="size-4" />
            {t("common.save", "Save")}
          </Button>
        }
      />

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
                    type="number"
                    min="0"
                    className="w-24"
                    value={tier.from_minutes}
                    onChange={(e) => patchTier(i, { from_minutes: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("staff.toMinutes", "To (min)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    className="w-24"
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
                    type="number"
                    step={tier.kind === "day_fraction" ? "0.25" : "1"}
                    min="0"
                    className="w-28"
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="mb-1"
                  onClick={() => setTiers(tiers.filter((_, index) => index !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}

          {tierError ? <p className="text-sm text-destructive">{tierError}</p> : null}

          <Button variant="outline" size="sm" onClick={addTier}>
            <Plus className="size-4" />
            {t("staff.addTier", "Add a rung")}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
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
              <Input id="ar-days" type="number" min="1" step="0.5" value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ar-absence">{t("staff.absenceDays", "Days docked per absence")}</Label>
              <Input id="ar-absence" type="number" min="0" step="0.25" value={absenceDays}
                onChange={(e) => setAbsenceDays(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ar-ot">{t("staff.otMultiplier", "Overtime multiplier")}</Label>
              <Input id="ar-ot" type="number" min="0.05" step="0.05" value={otMultiplier}
                onChange={(e) => setOtMultiplier(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ar-buffer">{t("staff.autoBuffer", "Auto-close after (min)")}</Label>
              <Input id="ar-buffer" type="number" min="0" value={autoBuffer}
                onChange={(e) => setAutoBuffer(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("staff.policies", "Policies")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label htmlFor="ar-geo">{t("staff.requireGeofence", "Require location to clock in")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("staff.requireGeofenceHint", "Punches outside the branch's radius are refused.")}
                </p>
              </div>
              <Switch id="ar-geo" checked={requireGeofence} onCheckedChange={setRequireGeofence} />
            </div>
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
              <Switch id="ar-excused" checked={excusedPaid} onCheckedChange={setExcusedPaid} />
            </div>
            <div className="space-y-2">
              <Label>{t("staff.weekendDays", "Weekend")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d) => {
                  const on = weekend.includes(d.value);
                  return (
                    <Badge
                      key={d.value}
                      variant="outline"
                      className={`cursor-pointer select-none ${on ? "border-transparent bg-primary/15 text-primary" : ""}`}
                      onClick={() =>
                        setWeekend(
                          on ? weekend.filter((w) => w !== d.value) : [...weekend, d.value].sort(),
                        )
                      }
                    >
                      {t(d.labelKey, d.fallback)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
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
