import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { putEmployee, revokeDevice, useListBranches, useListDepartments } from "@/data/api/generated/api";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { PHONE_RAW_MAX, canonicalPhone, isValidPhone } from "@/lib/phone";
import { useConfirm } from "@/components/app/confirm-dialog";
import type { Employee } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtDate, piastresToEgp } from "@/lib/format";
import { BranchChecklist } from "./branch-checklist";
import { invalidateEmployees } from "./util";

const NONE = "__none__";

/**
 * Edit one employee (Phase A: an employee is their own record, optionally
 * linked to a Madar user). Name, WhatsApp number, staff-app access and
 * branches are the employee's; a linked person's login and role stay on their
 * user account (Users & Permissions). A new number, app access off, or any
 * status but active signs their phone out (RO-10).
 *
 * Salary is entered in EGP and sent in piastres. When the caller lacks
 * `payroll:read` the API returns `base_salary_piastres: null`; the field is
 * hidden rather than shown empty, because an empty box invites someone to type
 * a number the server will silently ignore.
 */
export function EmployeeDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const authz = useAuthz();
  const canRevoke = authz.can(Cap.hrStaffEdit);
  const orgId = useOrgId();
  const departmentsQ = useListDepartments({ query: { enabled: open } });
  const branches = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: open && !!orgId } }).data ?? [];
  // Shown and sent only to someone who may set it (hr.payroll.edit): the
  // server ignores it from anyone else, and an ignored box is a lie.
  const canEditSalary = authz.can(Cap.hrPayrollEdit);
  const canSeeSalary = canEditSalary
    && employee?.base_salary_piastres !== null
    && employee?.base_salary_piastres !== undefined;

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(1, t("dawam.nameRequired", "A name is needed")).max(120),
          phone: z.string().max(PHONE_RAW_MAX),
          app_access: z.boolean(),
          branch_ids: z.array(z.string()).min(1, t("dawam.pickBranchError", "Pick at least one branch")),
          department_id: z.string(),
          employee_code: z.string().max(64),
          job_title: z.string().max(120),
          hire_date: z.string(),
          employment_status: z.enum(["active", "suspended", "terminated"]),
          termination_date: z.string(),
          base_salary_egp: z.coerce.number<number>().min(0),
          national_id: z.string().max(64),
          emergency_contact_name: z.string().max(120),
          emergency_contact_phone: z.string().max(40),
          notes: z.string().max(2000),
          gender: z.enum([NONE, "m", "f"]),
          pay_method: z.enum(["cash", "bank", "wallet"]),
          pay_account: z.string().max(64),
          on_payroll: z.boolean(),
        })
        // Mirrors the database CHECK: a terminated profile must say when, and a
        // live one must not carry a termination date.
        .refine((v) => v.employment_status !== "terminated" || v.termination_date !== "", {
          path: ["termination_date"],
          message: t("staff.terminationDateRequired", "A terminated employee needs a termination date"),
        })
        .refine((v) => !v.phone.trim() || isValidPhone(v.phone), {
          path: ["phone"],
          message: t("dawam.badPhone", "Not a phone number"),
        })
        .refine((v) => !v.app_access || !!v.phone.trim(), {
          path: ["phone"],
          message: t("dawam.phoneForApp", "The staff app needs their WhatsApp number"),
        }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phone: "", app_access: false, branch_ids: [],
      department_id: NONE, employee_code: "", job_title: "", hire_date: "",
      employment_status: "active", termination_date: "", base_salary_egp: 0,
      national_id: "", emergency_contact_name: "", emergency_contact_phone: "", notes: "",
      gender: NONE, pay_method: "cash", pay_account: "", on_payroll: true,
    },
  });
  const status = form.watch("employment_status");
  const payMethod = form.watch("pay_method");

  useEffect(() => {
    if (!employee || !open) return;
    form.reset({
      name: employee.name,
      phone: employee.phone ?? "",
      app_access: employee.app_access,
      branch_ids: employee.branch_ids,
      department_id: employee.department_id ?? NONE,
      employee_code: employee.employee_code ?? "",
      job_title: employee.job_title ?? "",
      hire_date: employee.hire_date ?? "",
      employment_status: (employee.employment_status as Values["employment_status"]) ?? "active",
      termination_date: employee.termination_date ?? "",
      base_salary_egp: piastresToEgp(employee.base_salary_piastres ?? 0),
      national_id: employee.national_id ?? "",
      emergency_contact_name: employee.emergency_contact_name ?? "",
      emergency_contact_phone: employee.emergency_contact_phone ?? "",
      notes: employee.notes ?? "",
      gender: employee.gender === "m" || employee.gender === "f" ? employee.gender : NONE,
      pay_method: (["cash", "bank", "wallet"].includes(employee.pay_method) ? employee.pay_method : "cash") as Values["pay_method"],
      pay_account: employee.pay_account ?? "",
      on_payroll: employee.on_payroll ?? true,
    });
  }, [employee, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // One live phone per person (RO-4): signing it out makes them sign in again
  // with a WhatsApp code; their records stay.
  const revokePhone = async () => {
    if (!employee) return;
    const ok = await confirm({
      title: t("dawam.revokeTitle", { name: employee.name, defaultValue: `Sign ${employee.name}'s phone out?` }),
      description: t("dawam.revokeHint", "The phone is refused on its next request. They sign in again with a WhatsApp code."),
      confirmLabel: t("dawam.revokePhoneShort", "Sign the phone out"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await revokeDevice(employee.id);
      toast.success(t("dawam.phoneRevoked", "Phone signed out"));
      void invalidateEmployees();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const submit = async (v: Values) => {
    if (!employee) return;
    setBusy(true);
    try {
      await putEmployee(employee.id, {
        name: v.name.trim(),
        // Empty clears it; the server signs the old phone out on a change.
        phone: v.phone.trim() ? canonicalPhone(v.phone) : "",
        app_access: v.app_access,
        branch_ids: v.branch_ids,
        department_id: v.department_id === NONE ? null : v.department_id,
        employee_code: v.employee_code || null,
        job_title: v.job_title || null,
        hire_date: v.hire_date || null,
        employment_status: v.employment_status,
        termination_date: v.employment_status === "terminated" ? v.termination_date : null,
        // Omitted entirely when the caller cannot see salary, so the server's
        // "keep the stored value" branch is what runs.
        ...(canSeeSalary ? { base_salary_piastres: egpToPiastres(v.base_salary_egp) } : {}),
        // Same gate as the salary (hr.payroll.edit everywhere): the server
        // ignores it from anyone else.
        ...(canEditSalary ? { on_payroll: v.on_payroll } : {}),
        national_id: v.national_id || null,
        emergency_contact_name: v.emergency_contact_name || null,
        emergency_contact_phone: v.emergency_contact_phone || null,
        notes: v.notes || null,
        gender: v.gender === NONE ? null : v.gender,
        pay_method: v.pay_method,
        pay_account: v.pay_method === "cash" ? null : v.pay_account || null,
      });
      toast.success(t("staff.employeeSaved", "Employee saved"));
      void invalidateEmployees();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{employee?.name ?? t("staff.employee", "Employee")}</DialogTitle>
          <DialogDescription>
            {employee?.user_id
              ? t("staff.employeeDialogLinked", "Also a Madar user: their login and role are managed under Users & Permissions.")
              : t("staff.employeeDialogUnlinked", "On the staff records only; no Madar login.")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
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
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dawam.whatsapp", "WhatsApp number")}</FormLabel>
                  <FormControl><Input type="tel" inputMode="tel" dir="ltr" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="app_access"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                    </FormControl>
                    <FormLabel className="font-normal">{t("dawam.appAccessLabel", "May sign in to the staff app")}</FormLabel>
                  </div>
                  <FormDescription>
                    {employee?.device_model
                      ? t("dawam.deviceSince", {
                          model: employee.device_model,
                          since: fmtDate(employee.device_since),
                          defaultValue: `Signed in on ${employee.device_model} since ${fmtDate(employee.device_since)}`,
                        })
                      : t("dawam.noDevice", "No phone signed in.")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branch_ids"
              render={({ field, fieldState }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("dawam.branches", "Branches")}</FormLabel>
                  <BranchChecklist branches={branches} value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.jobTitle", "Job title")}</FormLabel>
                  <FormControl><Input {...field} placeholder={t("staff.jobTitlePlaceholder", "Head chef")} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employee_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.employeeCode", "Employee number")}</FormLabel>
                  <FormControl><Input {...field} placeholder="EMP-001" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.department", "Department")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("staff.noDepartment", "No department")}</SelectItem>
                      {(departmentsQ.data ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.employmentStatus", "Status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{t("staff.statusActive", "Active")}</SelectItem>
                      <SelectItem value="suspended">{t("staff.statusSuspended", "Suspended")}</SelectItem>
                      <SelectItem value="terminated">{t("staff.statusTerminated", "Terminated")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("staff.suspendedCannotClockIn", "A suspended or terminated employee cannot clock in.")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {status === "terminated" ? (
              <FormField
                control={form.control}
                name="termination_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.terminationDate", "Termination date")}</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            {canEditSalary ? (
              <FormField
                control={form.control}
                name="on_payroll"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                      </FormControl>
                      <FormLabel className="font-normal">{t("dawam.onPayroll", "Paid through Dawam")}</FormLabel>
                    </div>
                    <FormDescription>{t("dawam.onPayrollHint", "Off for someone who uses the app and is rostered but is not paid here — an owner, say. They are skipped by the payroll run, the estimate and the payslips.")}</FormDescription>
                  </FormItem>
                )}
              />
            ) : null}
            {canSeeSalary ? (
              <FormField
                control={form.control}
                name="base_salary_egp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("staff.baseSalary", "Base salary (monthly)")}</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
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
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("dawam.genderUnset", "Not set")}</SelectItem>
                      <SelectItem value="f">{t("dawam.genderF", "Female")}</SelectItem>
                      <SelectItem value="m">{t("dawam.genderM", "Male")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{t("dawam.genderHint", "Suggestions lean late and night shifts to men by default; a person's own preferences win.")}</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pay_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("dawam.payMethod", "Paid by")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="cash">{t("dawam.pay_cash", "Cash")}</SelectItem>
                      <SelectItem value="bank">{t("dawam.pay_bank", "Bank transfer")}</SelectItem>
                      <SelectItem value="wallet">{t("dawam.pay_wallet", "Mobile wallet")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {payMethod !== "cash" ? (
              <FormField
                control={form.control}
                name="pay_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{payMethod === "bank" ? t("dawam.iban", "Account (IBAN)") : t("dawam.walletNumber", "Wallet number")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormDescription>{t("dawam.payAccountHint", "Goes on the bank and wallet lists when payroll is approved.")}</FormDescription>
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="national_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.nationalId", "National ID")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.emergencyName", "Emergency contact")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergency_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.emergencyPhone", "Emergency phone")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("staff.notes", "Notes")}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sm:col-span-2">
              {canRevoke && employee?.device_model ? (
                <Button type="button" variant="outline" className="me-auto" onClick={() => void revokePhone()}>
                  {t("dawam.revokePhoneShort", "Sign the phone out")}
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={busy}>{t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
