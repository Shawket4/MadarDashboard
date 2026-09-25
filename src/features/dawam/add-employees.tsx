/**
 * Adding people to Dawam (DSH-7): one at a time, or a spreadsheet of name,
 * WhatsApp number, branch and salary. Each person is one
 * `POST /staff/employees`; staff-app people sign in with a WhatsApp code, so
 * there is no password to hand out. The import reads the sheet first, shows every row and
 * what's wrong with it, and creates only when asked — then says, row by row,
 * who was added and who wasn't (a number already in use comes back 409).
 */
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { CheckCircle2, CircleAlert, Upload } from "lucide-react";
import { toast } from "sonner";

import { SegmentedControl } from "@/components/app/segmented-control";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createEmployee, useLinkableUsers, useListBranches } from "@/data/api/generated/api";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { PHONE_RAW_MAX, canonicalPhone, isValidPhone } from "@/lib/phone";
import { fmtMoney } from "@/lib/format";
import { BranchChecklist } from "@/features/staff/branch-checklist";
import { invalidateStaff, todayIso } from "@/features/staff/util";
import { readPounds } from "./money-dialogs";
import { SalaryCalculator } from "./salary-calculator";
import { parsePeople, readSheet, type NewPerson, type RowError } from "./people";

function useBranches() {
  const orgId = useOrgId();
  return useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } }).data ?? [];
}

export type EmployeeKind = "app" | "manual" | "linked";

/**
 * One person, typed in (DSH-7). Three kinds (Phase A):
 * - `app`: signs in to the staff app with a WhatsApp code; no Madar account.
 * - `manual`: records only — attendance and pay are entered for them.
 * - `linked`: an existing Madar user (a cashier, a manager) made an employee.
 * Creating an employee never creates a POS user. Salary is asked only of
 * someone who may set it (`hr.payroll.edit` at every branch); from anyone else
 * the server stores it "not set" (owner decision 9), so no box is offered.
 * The calculator beside it turns a day or hour rate into the monthly figure.
 */
export function AddEmployeeDialog({
  onOpenChange,
  userId,
}: {
  onOpenChange: (o: boolean) => void;
  /** Preset: make this Madar user an employee (from the Users page). */
  userId?: string;
}) {
  const { t } = useTranslation();
  const branches = useBranches();
  const authz = useAuthz();
  const canSetSalary = authz.canEverywhere(Cap.hrPayrollEdit);
  const linkableQ = useLinkableUsers({ query: { staleTime: 30_000 } });
  const linkable = useMemo(() => linkableQ.data ?? [], [linkableQ.data]);

  const schema = useMemo(
    () =>
      z
        .object({
          kind: z.enum(["app", "manual", "linked"]),
          user_id: z.string(),
          name: z.string().max(120),
          phone: z.string().max(PHONE_RAW_MAX),
          app_access: z.boolean(),
          branch_ids: z.array(z.string()).min(1, t("dawam.pickBranchError", "Pick at least one branch")),
          job_title: z.string().max(120),
          hire_date: z.string(),
          salary: z.string().refine((v) => v.trim() === "" || readPounds(v) !== null, t("dawam.badSalary", "Not an amount")),
          gender: z.enum(["", "m", "f"]),
        })
        .superRefine((v, ctx) => {
          if (v.kind === "linked" && !v.user_id) {
            ctx.addIssue({ code: "custom", path: ["user_id"], message: t("dawam.pickUserError", "Pick a person") });
          }
          if (v.kind !== "linked" && !v.name.trim()) {
            ctx.addIssue({ code: "custom", path: ["name"], message: t("dawam.nameRequired", "A name is needed") });
          }
          if (v.phone.trim() && !isValidPhone(v.phone)) {
            ctx.addIssue({ code: "custom", path: ["phone"], message: t("dawam.importBadPhone", { value: v.phone, defaultValue: `"${v.phone}" isn't a phone number` }) });
          }
          // App access is signing in with a code sent to this number.
          const needsPhone = v.kind === "app" || (v.kind === "linked" && v.app_access);
          if (needsPhone && !v.phone.trim()) {
            ctx.addIssue({ code: "custom", path: ["phone"], message: t("dawam.phoneForApp", "The staff app needs their WhatsApp number") });
          }
        }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      kind: userId ? "linked" : "app", user_id: userId ?? "", name: "", phone: "", app_access: false,
      branch_ids: [], job_title: "", hire_date: "", salary: "", gender: "",
    },
  });
  const kind = form.watch("kind");
  const pickedUser = form.watch("user_id");
  const hireDate = form.watch("hire_date");
  const { isSubmitting } = form.formState;

  // One branch: nothing to choose.
  useEffect(() => {
    if (branches.length === 1 && form.getValues("branch_ids").length === 0) {
      form.setValue("branch_ids", [branches[0].id], { shouldValidate: true });
    }
  }, [branches, form]);

  // A linked person's number defaults to their account's.
  useEffect(() => {
    const u = linkable.find((l) => l.user_id === pickedUser);
    if (u?.phone && !form.getValues("phone")) form.setValue("phone", u.phone);
  }, [pickedUser, linkable, form]);

  const save = async (v: Values) => {
    const phone = v.phone.trim() ? canonicalPhone(v.phone) : null;
    const appAccess = v.kind === "app" || (v.kind === "linked" && v.app_access);
    try {
      await createEmployee({
        ...(v.kind === "linked" ? { user_id: v.user_id } : { name: v.name.trim() }),
        phone,
        app_access: appAccess,
        branch_ids: v.branch_ids,
        job_title: v.job_title.trim() || null,
        hire_date: v.hire_date || null,
        gender: v.gender || null,
        ...(canSetSalary && v.salary.trim() ? { base_salary_piastres: readPounds(v.salary) } : {}),
      });
      toast.success(
        appAccess
          ? t("dawam.employeeAdded", "Employee added. They sign in with a WhatsApp code.")
          : t("dawam.employeeAddedNoApp", "Employee added."),
      );
      void invalidateStaff();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const kindOptions = [
    { value: "app" as const, label: t("dawam.kind_app", "Staff app") },
    { value: "manual" as const, label: t("dawam.kind_manual", "Records only") },
    { value: "linked" as const, label: t("dawam.kind_linked", "Madar user") },
  ];
  const kindHint: Record<EmployeeKind, string> = {
    app: t("dawam.kindHint_app", "Signs in to the Dawam app with a code sent to their WhatsApp. No Madar account, no till."),
    manual: t("dawam.kindHint_manual", "No app: attendance and pay are entered for them here."),
    linked: t("dawam.kindHint_linked", "Someone who already has a Madar account (a cashier, a manager). Their role doesn't change."),
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{userId ? t("dawam.makeEmployee", "Make employee") : t("dawam.addEmployee", "Add employee")}</DialogTitle>
          <DialogDescription>{kindHint[kind]}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(save)} className="grid gap-3">
            {userId ? null : (
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dawam.employeeKind", "Kind")}</FormLabel>
                    <SegmentedControl value={field.value} onChange={(k) => form.setValue("kind", k, { shouldValidate: true })} options={kindOptions} />
                  </FormItem>
                )}
              />
            )}
            {kind === "linked" ? (
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dawam.madarUser", "Madar user")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!!userId}>
                      <FormControl>
                        <SelectTrigger aria-label={t("dawam.madarUser", "Madar user")}>
                          <SelectValue placeholder={t("dawam.pickUser", "Pick a person")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {linkable.map((u) => (
                          <SelectItem key={u.user_id} value={u.user_id}>
                            {u.name} · {t(`roles.${u.role}`, u.role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!userId && linkable.length === 0 ? (
                      <FormDescription>{t("dawam.noLinkable", "Everyone with a Madar account is already an employee.")}</FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.name", "Name")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dawam.whatsapp", "WhatsApp number")}</FormLabel>
                  <FormControl><Input type="tel" inputMode="tel" dir="ltr" {...field} /></FormControl>
                  {kind === "manual" ? <FormDescription>{t("dawam.phoneOptional", "Optional. Only for reaching them.")}</FormDescription> : null}
                  <FormMessage />
                </FormItem>
              )}
            />
            {kind === "linked" ? (
              <FormField
                control={form.control}
                name="app_access"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                    </FormControl>
                    <FormLabel className="font-normal">{t("dawam.appAccessLabel", "May sign in to the staff app")}</FormLabel>
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="branch_ids"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("dawam.branches", "Branches")}</FormLabel>
                  <BranchChecklist branches={branches} value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="job_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dawam.jobTitle", "Job title")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.hireDate", "Hire date")}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
            {canSetSalary ? (
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <SalaryCalculator
                      id="add-salary"
                      label={t("dawam.salaryEgp", "Monthly salary (EGP)")}
                      monthly={field.value}
                      onMonthly={(v) => form.setValue("salary", v, { shouldValidate: true, shouldDirty: true })}
                      hireDate={hireDate || todayIso()}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dawam.gender", "Gender")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label={t("dawam.gender", "Gender")}><SelectValue placeholder={t("dawam.notSet", "Not set")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="m">{t("dawam.gender_m", "Male")}</SelectItem>
                      <SelectItem value="f">{t("dawam.gender_f", "Female")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {userId ? t("dawam.makeEmployee", "Make employee") : t("dawam.addEmployee", "Add employee")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type Outcome = { ok: true } | { ok: false; message: string };

const ERROR_FALLBACK: Record<RowError["key"], string> = {
  importNoName: "No name",
  importBadPhone: "\"{{value}}\" isn't a phone number",
  importNoBranch: "No branch called \"{{value}}\"",
  importBadSalary: "\"{{value}}\" isn't a salary",
  importDuplicatePhone: "{{value}} is already on an earlier row",
};

/** A spreadsheet of people: preview, per-row problems, then one create each (DSH-7). */
export function ImportPeopleDialog({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const branches = useBranches();
  // The server keeps a salary only from someone who may set pay
  // (hr.payroll.edit); anyone else is told, and the salaries aren't sent.
  const canSetSalary = useAuthz().canEverywhere(Cap.hrPayrollEdit);
  const [parsed, setParsed] = useState<{ people: NewPerson[]; errors: RowError[] } | null>(null);
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [busy, setBusy] = useState(false);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      setParsed(parsePeople(await readSheet(file), branches));
      setOutcomes({});
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  // One at a time: a sheet of 40 people is not worth 40 parallel requests
  // racing each other for the same phone-number uniqueness check.
  const run = async () => {
    if (!parsed) return;
    setBusy(true);
    const done: Record<number, Outcome> = { ...outcomes };
    for (const p of parsed.people) {
      if (done[p.row]?.ok) continue;
      try {
        // A sheet row is a staff-app person: a name, a WhatsApp number, a branch.
        await createEmployee({
          name: p.name, phone: p.phone, app_access: true, branch_ids: [p.branchId],
          ...(canSetSalary && p.salaryPiastres !== null ? { base_salary_piastres: p.salaryPiastres } : {}),
        });
        done[p.row] = { ok: true };
      } catch (e) {
        done[p.row] = { ok: false, message: getErrorMessage(e) };
      }
      setOutcomes({ ...done });
    }
    setBusy(false);
    void invalidateStaff();
    const added = Object.values(done).filter((o) => o.ok).length;
    toast.success(t("dawam.importDone", { added, total: parsed.people.length, defaultValue: `${added} of ${parsed.people.length} added` }));
  };

  const rows = parsed
    ? [
        ...parsed.people.map((p) => ({ row: p.row, person: p, error: null as RowError | null })),
        ...parsed.errors.map((e) => ({ row: e.row, person: null, error: e })),
      ].sort((a, b) => a.row - b.row)
    : [];
  const pending = parsed ? parsed.people.filter((p) => !outcomes[p.row]?.ok).length : 0;
  const salariesDropped = !canSetSalary && !!parsed?.people.some((p) => p.salaryPiastres !== null);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("dawam.importTitle", "Import from a spreadsheet")}</DialogTitle>
          <DialogDescription>{t("dawam.importHint", "An .xlsx or .csv with columns for name, WhatsApp number, branch and salary. Nothing is added until you confirm.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="import-file">{t("dawam.importFile", "Spreadsheet")}</Label>
          <Input id="import-file" type="file" accept=".xlsx,.csv" onChange={(e) => void pick(e.target.files?.[0])} />
        </div>
        {salariesDropped ? (
          <p role="status" className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            {t("dawam.importNoSalaryRight", "The salaries in this sheet won't be saved: setting pay needs the owner's permission. The people are added without one.")}
          </p>
        ) : null}
        {parsed ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("staff.name", "Name")}</TableHead>
                <TableHead>{t("dawam.whatsapp", "WhatsApp number")}</TableHead>
                <TableHead>{t("dawam.branch", "Branch")}</TableHead>
                <TableHead className="text-end">{t("dawam.salary", "Salary")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ row, person, error }) => {
                const out = outcomes[row];
                return (
                  <TableRow key={row} data-testid={`import-row-${row}`}>
                    <TableCell className="tabular-nums">{row}</TableCell>
                    {person ? (
                      <>
                        <TableCell>{person.name}</TableCell>
                        <TableCell className="tabular-nums" dir="ltr">+{person.phone}</TableCell>
                        <TableCell>{branchName.get(person.branchId)}</TableCell>
                        <TableCell className="text-end tabular-nums">{!canSetSalary || person.salaryPiastres === null ? "—" : fmtMoney(person.salaryPiastres)}</TableCell>
                      </>
                    ) : (
                      <TableCell colSpan={4} className="text-destructive">
                        {t(`dawam.${error!.key}`, { value: error!.value ?? "", defaultValue: ERROR_FALLBACK[error!.key] })}
                      </TableCell>
                    )}
                    <TableCell>
                      {out?.ok ? (
                        <span className="flex items-center gap-1 text-success"><CheckCircle2 className="size-4" />{t("dawam.importAdded", "Added")}</span>
                      ) : out ? (
                        <span className="flex items-center gap-1 text-destructive"><CircleAlert className="size-4" />{out.message}</span>
                      ) : error ? (
                        <span className="text-xs text-muted-foreground">{t("dawam.importSkipped", "Skipped")}</span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.close", "Close")}</Button>
          <Button onClick={() => void run()} disabled={busy || pending === 0}>
            <Upload className="size-4" />
            {t("dawam.importRun", { n: pending, defaultValue: `Add ${pending}` })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
