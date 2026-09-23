/**
 * Adding people to Dawam (DSH-7): one at a time, or a spreadsheet of name,
 * WhatsApp number, branch and salary. Each person is one
 * `POST /staff/employees`; they sign in with a WhatsApp code, so there is no
 * password to hand out. The import reads the sheet first, shows every row and
 * what's wrong with it, and creates only when asked — then says, row by row,
 * who was added and who wasn't (a number already in use comes back 409).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, CircleAlert, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createEmployee, useListBranches } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { canonicalPhone } from "@/lib/phone";
import { fmtMoney } from "@/lib/format";
import { invalidateStaff } from "@/features/staff/util";
import { readPounds } from "./money-dialogs";
import { parsePeople, readSheet, type NewPerson, type RowError } from "./people";

function useBranches() {
  const orgId = useOrgId();
  return useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } }).data ?? [];
}

/** One person, typed in (DSH-7). */
export function AddEmployeeDialog({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const branches = useBranches();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [salary, setSalary] = useState("");
  const [job, setJob] = useState("");
  const [gender, setGender] = useState("");
  const [busy, setBusy] = useState(false);
  const branchId = branch || (branches.length === 1 ? branches[0].id : "");
  const phoneOk = canonicalPhone(phone) !== null;
  const salaryOk = salary.trim() === "" || readPounds(salary) !== null;
  const canSave = !!name.trim() && phoneOk && !!branchId && salaryOk;

  const save = async () => {
    setBusy(true);
    try {
      await createEmployee({
        name: name.trim(),
        phone: canonicalPhone(phone)!,
        branch_id: branchId,
        base_salary_piastres: salary.trim() ? readPounds(salary) : null,
        job_title: job.trim() || null,
        gender: gender || null,
      });
      toast.success(t("dawam.employeeAdded", "Employee added. They sign in with a WhatsApp code."));
      void invalidateStaff();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dawam.addEmployee", "Add employee")}</DialogTitle>
          <DialogDescription>{t("dawam.addEmployeeHint", "They sign in to Dawam with a code sent to this WhatsApp number.")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label htmlFor="ae-name">{t("staff.name", "Name")}</Label>
            <Input id="ae-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ae-phone">{t("dawam.whatsapp", "WhatsApp number")}</Label>
            <Input id="ae-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!phone && !phoneOk} />
            {phone && !phoneOk ? <p className="text-xs text-destructive">{t("dawam.importBadPhone", { value: phone, defaultValue: `"${phone}" isn't a phone number` })}</p> : null}
          </div>
          <div className="space-y-1">
            <Label>{t("dawam.branch", "Branch")}</Label>
            <Select value={branchId} onValueChange={setBranch}>
              <SelectTrigger aria-label={t("dawam.branch", "Branch")}><SelectValue placeholder={t("dawam.pickBranch", "Pick a branch")} /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ae-salary">{t("dawam.salaryEgp", "Monthly salary (EGP)")}</Label>
              <Input id="ae-salary" type="number" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ae-job">{t("dawam.jobTitle", "Job title")}</Label>
              <Input id="ae-job" value={job} onChange={(e) => setJob(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("dawam.gender", "Gender")}</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger aria-label={t("dawam.gender", "Gender")}><SelectValue placeholder={t("dawam.notSet", "Not set")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="m">{t("dawam.gender_m", "Male")}</SelectItem>
                <SelectItem value="f">{t("dawam.gender_f", "Female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={() => void save()} disabled={busy || !canSave}>{t("dawam.addEmployee", "Add employee")}</Button>
        </DialogFooter>
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
        await createEmployee({ name: p.name, phone: p.phone, branch_id: p.branchId, base_salary_piastres: p.salaryPiastres });
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
                        <TableCell className="text-end tabular-nums">{person.salaryPiastres === null ? "—" : fmtMoney(person.salaryPiastres)}</TableCell>
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
