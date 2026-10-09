/**
 * The four set-up steps' bodies (SA-4), each one decision: where each branch
 * is, who works here, when they work, and the rules they're paid by. Every
 * step saves through the same calls its full page makes (patchBranch,
 * createEmployee via the add dialog, the shift dialog, putAttendanceSettings)
 * and says out loud when a save fails.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2, ClipboardPaste, ExternalLink, FileSpreadsheet, LocateFixed, MapPin, MoonStar, Plus, TriangleAlert, UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberField, summarizeDays, endsNextDay, formatSpan, spanMinutes } from "@/components/inputs";
import { errorTextClass, warnTextClass } from "@/components/inputs/shell";
import { useLang } from "@/components/inputs/use-lang";
import { patchBranch, putAttendanceSettings } from "@/data/api/generated/api";
import type { AttendanceSettings, Branch, Employee, WorkShift } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney, fmtWireTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { invalidateBranches } from "@/features/branches/util";
import { invalidateAttendance } from "@/features/staff/util";
import { fullBody, valuesFrom, type Tier } from "@/features/staff/rules-form";
import { tierPiastres } from "@/features/staff/rules-preview";
import { fmtLatLng, inEgypt, mapsLink, parsePin, round6, type LatLng } from "./geo";
import { branchPinned } from "./setup";

type PinBranch = Pick<Branch, "id" | "name" | "latitude" | "longitude" | "geo_radius_meters">;

export const DEFAULT_RADIUS = 200;

// ── Step 1: branches ─────────────────────────────────────────────────────────

export function BranchesStep({ branches, canEdit }: { branches: PinBranch[]; canEdit: boolean }) {
  const { t } = useTranslation();
  const firstOpen = branches.find((b) => !branchPinned(b))?.id ?? null;
  const [open, setOpen] = useState<string | null>(firstOpen);

  if (branches.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title={t("dawam.setupNoBranches", "No branches yet")}
        description={t("dawam.setupNoBranchesHint", "Add the first branch with its name and timezone, then come back here to pin it.")}
        action={<Button asChild><Link to="/branches" search={{ edit: "new" }}><Plus className="size-4" />{t("dawam.setupAddBranch", "Add a branch")}</Link></Button>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {!canEdit ? (
        <p role="note" className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("dawam.setupPinNoAccess", "Pinning a branch needs the right to edit branches. Ask the owner to pin them, or to give you that right.")}
        </p>
      ) : null}
      <ul className="space-y-2">
        {branches.map((b) => (
          <li key={b.id} className="rounded-lg border">
            <BranchPin
              branch={b}
              canEdit={canEdit}
              open={open === b.id}
              onToggle={() => setOpen(open === b.id ? null : b.id)}
              onSaved={() => setOpen(branches.find((x) => x.id !== b.id && !branchPinned(x))?.id ?? null)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

type Locating = { state: "idle" } | { state: "busy" } | { state: "error"; message: string } | { state: "done"; accuracy: number };

function BranchPin({
  branch, canEdit, open, onToggle, onSaved,
}: {
  branch: PinBranch; canEdit: boolean; open: boolean; onToggle: () => void; onSaved: () => void;
}) {
  const { t } = useTranslation();
  const pinned = branchPinned(branch);
  const saved: LatLng | null = branch.latitude != null && branch.longitude != null ? { lat: branch.latitude, lng: branch.longitude } : null;
  const [pin, setPin] = useState<LatLng | null>(saved);
  const [radius, setRadius] = useState<number | null>(branch.geo_radius_meters && branch.geo_radius_meters > 0 ? branch.geo_radius_meters : DEFAULT_RADIUS);
  const [paste, setPaste] = useState("");
  const [locating, setLocating] = useState<Locating>({ state: "idle" });
  const [busy, setBusy] = useState(false);
  const pasted = paste.trim() ? parsePin(paste) : null;

  const pasteError =
    pasted && "error" in pasted
      ? pasted.error === "short_link"
        ? t("dawam.pinShortLink", "That's a short share link, which only opens in a browser. Open it, then copy the long link from the address bar, or long-press the spot in Maps and copy its coordinates.")
        : pasted.error === "out_of_range"
          ? t("dawam.pinOutOfRange", "Those numbers aren't a place on Earth. Check the link.")
          : t("dawam.pinNone", "No coordinates in that. Paste a Google Maps link, or coordinates like 30.0444, 31.2357.")
      : null;

  const onPaste = (text: string) => {
    setPaste(text);
    const r = text.trim() ? parsePin(text) : null;
    if (r && "ok" in r) setPin(r.ok);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setLocating({ state: "error", message: t("dawam.pinNoGeo", "This browser can't read its location. Paste a Maps link instead.") });
      return;
    }
    setLocating({ state: "busy" });
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPin({ lat: round6(p.coords.latitude), lng: round6(p.coords.longitude) });
        setLocating({ state: "done", accuracy: Math.round(p.coords.accuracy) });
      },
      (e) =>
        setLocating({
          state: "error",
          message:
            e.code === e.PERMISSION_DENIED
              ? t("dawam.pinDenied", "Location is blocked for this site. Allow it in the browser's address bar, or paste a Maps link.")
              : t("dawam.pinUnavailable", "Couldn't get a location fix. Try again near a window, or paste a Maps link."),
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  };

  const changed = !saved || !pin || pin.lat !== saved.lat || pin.lng !== saved.lng || radius !== branch.geo_radius_meters;
  const radiusOk = radius !== null && Number.isFinite(radius) && radius >= 10 && radius <= 5000;
  const canSave = canEdit && !!pin && radiusOk && changed;

  const save = async () => {
    if (!pin || !radiusOk || radius === null) return;
    setBusy(true);
    try {
      await patchBranch(branch.id, { latitude: pin.lat, longitude: pin.lng, geo_radius_meters: radius });
      toast.success(t("dawam.pinSaved", { name: branch.name, defaultValue: `${branch.name} is pinned` }));
      void invalidateBranches();
      onSaved();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid={`pin-${branch.id}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-lg p-3 text-start hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {pinned ? <CheckCircle2 aria-hidden className="size-5 shrink-0 text-success" /> : <MapPin aria-hidden className="size-5 shrink-0 text-muted-foreground" />}
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{branch.name}</span>
          <span className="block text-xs text-muted-foreground">
            {pinned
              ? t("dawam.pinnedSummary", { radius: branch.geo_radius_meters, defaultValue: `Pinned, ${branch.geo_radius_meters} m around it` })
              : t("dawam.notPinned", "Not pinned yet")}
          </span>
        </span>
        <span className="text-sm text-muted-foreground">{open ? t("common.close", "Close") : pinned ? t("common.edit", "Edit") : t("dawam.pinIt", "Pin it")}</span>
      </button>

      {open ? (
        <div className="space-y-4 border-t p-3">
          <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("dawam.pinHere", "At the branch now?")}</p>
              <Button type="button" variant="outline" onClick={locate} loading={locating.state === "busy"} disabled={!canEdit}>
                <LocateFixed className="size-4" />
                {t("dawam.useMyLocation", "Use my location")}
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`paste-${branch.id}`}>{t("dawam.pastePin", "Or paste a Google Maps link or coordinates")}</Label>
              <div className="relative">
                {/* The link reads left to right in both languages, so the icon sits on its physical left. */}
                <ClipboardPaste aria-hidden className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id={`paste-${branch.id}`}
                  dir="ltr"
                  className="pl-8"
                  disabled={!canEdit}
                  placeholder="https://www.google.com/maps/… · 30.0444, 31.2357"
                  value={paste}
                  aria-invalid={!!pasteError || undefined}
                  aria-describedby={pasteError ? `paste-${branch.id}-err` : undefined}
                  onChange={(e) => onPaste(e.target.value)}
                />
              </div>
              {pasteError ? <p id={`paste-${branch.id}-err`} role="alert" className={errorTextClass}>{pasteError}</p> : null}
            </div>
          </div>

          {locating.state === "error" ? <p role="alert" className={errorTextClass}>{locating.message}</p> : null}
          {locating.state === "done" && locating.accuracy > 100 ? (
            <p role="status" className={warnTextClass}>
              {t("dawam.pinRough", { m: locating.accuracy, defaultValue: `This fix is only good to about ${locating.accuracy} m. Stand in the branch, or paste a Maps link for a better pin.` })}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor={`radius-${branch.id}`}>{t("dawam.radius", "How far from the pin counts as at the branch")}</Label>
            <NumberField
              id={`radius-${branch.id}`}
              className="max-w-xs"
              value={radius}
              onChange={setRadius}
              min={10}
              max={5000}
              step={50}
              suffix={t("dawam.metres", "m")}
              unitWord={t("dawam.metres", "m")}
              presets={[100, 200, 300, 500]}
              presetLabel={(n) => `${n} ${t("dawam.metres", "m")}`}
              disabled={!canEdit}
              hint={t("dawam.radiusHint", "200 m suits most shops: it allows for a phone's GPS drift indoors without reaching the next street.")}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/60 p-3">
            {pin ? (
              <p className="text-sm">
                <span className="text-muted-foreground">{t("dawam.pinAt", "Pin:")} </span>
                <bdi dir="ltr" className="font-mono text-xs tabular-nums">{fmtLatLng(pin)}</bdi>
                {" · "}
                <a href={mapsLink(pin)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
                  {t("dawam.checkOnMaps", "Check it on Google Maps")}
                  <ExternalLink aria-hidden className="size-3" />
                </a>
                {!inEgypt(pin) ? <span className={cn("block", warnTextClass)}>{t("dawam.pinNotEgypt", "That pin is outside Egypt. Check it before saving.")}</span> : null}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("dawam.pinNone2", "No pin yet: use your location or paste a link.")}</p>
            )}
            <Button type="button" onClick={() => void save()} loading={busy} disabled={!canSave}>
              {pinned ? t("dawam.savePin", "Save the pin") : t("dawam.pinBranch", { name: branch.name, defaultValue: `Pin ${branch.name}` })}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Step 2: employees ────────────────────────────────────────────────────────

export function EmployeesStep({
  employees, canCreate, onAdd,
}: {
  employees: Pick<Employee, "id" | "name" | "employment_status" | "salary_set">[];
  canCreate: boolean;
  onAdd: (how: "one" | "sheet") => void;
}) {
  const { t } = useTranslation();
  const active = employees.filter((e) => e.employment_status === "active");
  const noSalary = active.filter((e) => e.salary_set === false);
  const actions = canCreate ? (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => onAdd("one")}><UserRoundPlus className="size-4" />{t("dawam.addEmployee", "Add employee")}</Button>
      <Button variant="outline" onClick={() => onAdd("sheet")}><FileSpreadsheet className="size-4" />{t("dawam.importTitle", "Import from a spreadsheet")}</Button>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">{t("dawam.setupNoCreate", "Adding people needs the right to create staff. Ask the owner.")}</p>
  );

  if (active.length === 0) {
    return (
      <EmptyState
        icon={UserRoundPlus}
        title={t("dawam.setupNoEmployees", "Nobody here yet")}
        description={t("dawam.setupNoEmployeesHint", "Add people one at a time, or import a spreadsheet of names, WhatsApp numbers, branches and salaries. Staff-app people sign in with a WhatsApp code, so there's no password to hand out.")}
        action={actions}
      />
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm">
        {t("dawam.setupEmployeeCount", { count: active.length })}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {active.slice(0, 24).map((e) => (
          <li key={e.id} className="rounded-full border bg-card px-2.5 py-1 text-sm">{e.name}</li>
        ))}
        {active.length > 24 ? <li className="px-2.5 py-1 text-sm text-muted-foreground">+{active.length - 24}</li> : null}
      </ul>
      {noSalary.length ? (
        <p role="note" className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]" />
          <span>
            {t("dawam.setupNoSalary", { count: noSalary.length })}
          </span>
        </p>
      ) : null}
      {actions}
    </div>
  );
}

// ── Step 3: shifts ───────────────────────────────────────────────────────────

export function ShiftsStep({
  shifts, branchName, canCreate, onNew,
}: {
  shifts: WorkShift[];
  branchName: (id: string | null | undefined) => string;
  canCreate: boolean;
  onNew: () => void;
}) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const active = shifts.filter((s) => s.is_active);
  const newButton = canCreate ? (
    <Button onClick={onNew}><Plus className="size-4" />{t("staff.newShift", "New shift")}</Button>
  ) : (
    <p className="text-sm text-muted-foreground">{t("dawam.setupNoShiftCreate", "Making shifts needs the right to edit the schedule. Ask the owner.")}</p>
  );
  if (active.length === 0) {
    return (
      <EmptyState
        icon={MoonStar}
        title={t("dawam.setupNoShifts", "No shifts yet")}
        description={t("dawam.setupNoShiftsHint", "A shift is a block of time people are rostered on, like Morning 8 AM–4 PM. Start from a common one and adjust it.")}
        action={newButton}
      />
    );
  }
  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-lg border">
        {active.map((s) => {
          const span = spanMinutes(s.start_time, s.end_time);
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3">
              <span className="font-medium">{s.name}</span>
              <span className="text-sm tabular-nums">{fmtWireTime(s.start_time)} – {fmtWireTime(s.end_time)}</span>
              {span ? <span className="text-xs text-muted-foreground tabular-nums">{formatSpan(span, lang)}</span> : null}
              {endsNextDay(s.start_time, s.end_time) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-info/12 px-2 py-0.5 text-xs font-medium text-[color-mix(in_oklab,var(--color-info)_55%,var(--color-foreground))]">
                  <MoonStar aria-hidden className="size-3" />{t("inputs.endsNextDay", "Ends the next day")}
                </span>
              ) : null}
              <span className="ms-auto text-xs text-muted-foreground">
                {summarizeDays(s.valid_days ?? [], lang, t("inputs.everyDay", "Every day"), t("inputs.noDays", "No days"))}
                {" · "}
                {branchName(s.branch_id)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        {newButton}
        <Button asChild variant="link" className="px-0"><Link to="/staff/shifts">{t("dawam.setupOpenShifts", "Open work shifts")}</Link></Button>
      </div>
    </div>
  );
}

// ── Step 4: rules ────────────────────────────────────────────────────────────

const EXAMPLE = { salary: 1200000, workingDays: 30, shiftMinutes: 480 };

export function RulesStep({
  settings, canGender, onSaved,
}: {
  settings: AttendanceSettings;
  canGender: boolean;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const values = useMemo(() => valuesFrom(settings, { suggest: true }), [settings]);
  const ex = { ...EXAMPLE, workingDays: Number(values.workingDays) || 30 };
  const saved = !!settings.rules_saved_at;

  const saveDefaults = async () => {
    setBusy(true);
    try {
      await putAttendanceSettings(fullBody(values, canGender));
      toast.success(t("dawam.setupRulesSaved", "Rules saved: your team can clock in."));
      void invalidateAttendance();
      onSaved?.();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const tierText = (tier: Tier) => {
    const range = tier.to_minutes === null
      ? t("staff.tierFromOnly", "{{from}}+ min late", { from: tier.from_minutes })
      : t("staff.tierRange", "{{from}}–{{to}} min late", { from: tier.from_minutes, to: tier.to_minutes });
    const cost = tier.kind === "minutes"
      ? t("staff.tierCostMinutes", "{{n}} minutes of pay", { n: tier.value })
      : tier.kind === "day_fraction"
        ? t("staff.tierCostDay", "{{n}} of a day's pay", { n: tier.value })
        : fmtMoney(tier.value);
    return { range, cost };
  };

  return (
    <div className="space-y-4">
      <p className="text-sm">
        {saved
          ? t("dawam.setupRulesAreSaved", "Your rules are saved. This is what lateness costs now; change anything on the rules page.")
          : t("dawam.setupRulesSuggested", "A sensible start is filled in. Save it as it is and adjust later, or adjust it first. Nobody can clock in until the rules are saved.")}
      </p>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("staff.lateLadder", "Late arrival penalties")}</caption>
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t("dawam.setupLateBy", "Late by")}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t("staff.deduct", "Deduct")}</th>
              <th scope="col" className="px-3 py-2 text-end font-medium">{t("dawam.setupOnSalary", "On EGP 12,000 a month")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {values.tiers.length === 0 ? (
              <tr><td colSpan={3} className="px-3 py-2 text-muted-foreground">{t("staff.noTiers", "No penalties — lateness is recorded but never charged.")}</td></tr>
            ) : values.tiers.map((tier, i) => {
              const { range, cost } = tierText(tier);
              return (
                <tr key={i}>
                  <td className="px-3 py-2 tabular-nums">{range}</td>
                  <td className="px-3 py-2">{cost}</td>
                  <td className="px-3 py-2 text-end font-medium tabular-nums">{fmtMoney(tierPiastres(tier, ex))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <li>{t("dawam.setupAbsence", { n: values.absenceDays, defaultValue: `An absence docks ${values.absenceDays} day.` })}</li>
        <li>{values.dawam.overtimeMode === "off" ? t("dawam.setupOtOff", "Overtime is off until you turn it on.") : t("dawam.setupOtOn", "Overtime is on.")}</li>
        <li>{t("dawam.setupPayDay", { n: values.dawam.periodStartDay, defaultValue: `The pay period starts on day ${values.dawam.periodStartDay} of the month.` })}</li>
        <li>{t("dawam.setupGrace", "Each shift's grace minutes come first: lateness counts after them.")}</li>
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        {saved ? null : (
          <Button onClick={() => void saveDefaults()} loading={busy}>{t("dawam.setupSaveRules", "Save these rules")}</Button>
        )}
        <Button asChild variant={saved ? "default" : "outline"}>
          <Link to="/staff/rules">{saved ? t("dawam.setupOpenRules", "Open the rules") : t("dawam.setupAdjustRules", "Adjust them first")}</Link>
        </Button>
      </div>
    </div>
  );
}
