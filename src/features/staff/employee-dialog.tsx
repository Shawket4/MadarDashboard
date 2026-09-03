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
import { putEmployee, useListDepartments } from "@/data/api/generated/api";
import type { Employee } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";
import { invalidateEmployees } from "./util";

const NONE = "__none__";

/**
 * Edit one employee's HR profile.
 *
 * Name, email, phone, and role are NOT here — an employee IS a user, and those
 * live on the user account (Users & Permissions). This dialog only writes the
 * `staff_profiles` side, which is also what promotes a plain login to staff.
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
  const departmentsQ = useListDepartments({ query: { enabled: open } });
  const canSeeSalary = employee?.base_salary_piastres !== null
    && employee?.base_salary_piastres !== undefined;

  const schema = useMemo(
    () =>
      z
        .object({
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
        })
        // Mirrors the database CHECK: a terminated profile must say when, and a
        // live one must not carry a termination date.
        .refine((v) => v.employment_status !== "terminated" || v.termination_date !== "", {
          path: ["termination_date"],
          message: t("staff.terminationDateRequired", "A terminated employee needs a termination date"),
        }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      department_id: NONE, employee_code: "", job_title: "", hire_date: "",
      employment_status: "active", termination_date: "", base_salary_egp: 0,
      national_id: "", emergency_contact_name: "", emergency_contact_phone: "", notes: "",
    },
  });
  const status = form.watch("employment_status");

  useEffect(() => {
    if (!employee || !open) return;
    form.reset({
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
    });
  }, [employee, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (v: Values) => {
    if (!employee) return;
    setBusy(true);
    try {
      await putEmployee(employee.user_id, {
        department_id: v.department_id === NONE ? null : v.department_id,
        employee_code: v.employee_code || null,
        job_title: v.job_title || null,
        hire_date: v.hire_date || null,
        employment_status: v.employment_status,
        termination_date: v.employment_status === "terminated" ? v.termination_date : null,
        // Omitted entirely when the caller cannot see salary, so the server's
        // "keep the stored value" branch is what runs.
        ...(canSeeSalary ? { base_salary_piastres: egpToPiastres(v.base_salary_egp) } : {}),
        national_id: v.national_id || null,
        emergency_contact_name: v.emergency_contact_name || null,
        emergency_contact_phone: v.emergency_contact_phone || null,
        notes: v.notes || null,
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
            {t(
              "staff.employeeDialogSubtitle",
              "Employment details. Name, login, and role are managed under Users & Permissions.",
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
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
