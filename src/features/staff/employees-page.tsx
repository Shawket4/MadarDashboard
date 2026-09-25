import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { FileSpreadsheet, Plus, Smartphone, Trash2, UserRound, UserX, Users } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { RowAction } from "@/features/users/row-action";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createDepartment, deleteDepartment, deleteEmployee, revokeDevice,
  useListBranches, useListDepartments, useListEmployees,
} from "@/data/api/generated/api";
import { useAuthz } from "@/data/authz/use-authz";
import { salaryState } from "@/features/dawam/phase-d";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { AddEmployeeDialog, ImportPeopleDialog } from "@/features/dawam/add-employees";
import type { Department, Employee } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtDate, fmtMoney } from "@/lib/format";
import { EmployeeDialog } from "./employee-dialog";
import { EMPLOYMENT_STATUS_TONE, invalidateDepartments, invalidateEmployees } from "./util";

const ALL = "__all__";

const KIND_FALLBACK: Record<string, string> = {
  linked: "Madar user",
  app: "Staff app",
  manual: "Records only",
};

export function EmployeesPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>(ALL);
  const [department, setDepartment] = useState<string>(ALL);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deptOpen, setDeptOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const confirm = useConfirm();
  const authz = useAuthz();
  const canCreate = authz.can(Cap.hrStaffCreate);
  const canEdit = authz.can(Cap.hrStaffEdit);
  const canDelete = authz.can(Cap.hrStaffDelete);
  const orgId = useOrgId();
  const branchesQ = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const branchName = useMemo(() => new Map((branchesQ.data ?? []).map((b) => [b.id, b.name])), [branchesQ.data]);

  const employeesQ = useListEmployees({
    employment_status: status === ALL ? undefined : status,
    department_id: department === ALL ? undefined : department,
  });
  const departmentsQ = useListDepartments();
  const employees = useMemo(() => employeesQ.data ?? [], [employeesQ.data]);

  // Redaction is per-caller, not per-row: if the first row hides salary, the
  // whole column is hidden rather than rendered as a wall of dashes. Whoever
  // sets pay (the owner) sees it even while nobody has a salary yet (D9).
  const showSalary = employees.some(
    (e) => e.base_salary_piastres !== null && e.base_salary_piastres !== undefined,
  ) || authz.canEverywhere(Cap.hrPayrollEdit);

  // An employee with history is never deleted (AT-6): removing one ends
  // their employment, signs their phone out and keeps every record.
  const remove = async (employee: Employee) => {
    const ok = await confirm({
      title: t("staff.endEmploymentTitle", { name: employee.name, defaultValue: `End ${employee.name}'s employment?` }),
      description: t(
        "staff.endEmploymentHint",
        "They are marked terminated today and their phone is signed out. Attendance, payslips and any Madar login are kept.",
      ),
      confirmLabel: t("staff.endEmployment", "End employment"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteEmployee(employee.id);
      toast.success(t("staff.employmentEnded", "Employment ended"));
      void invalidateEmployees();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const revoke = async (employee: Employee) => {
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

  const columns: ColumnDef<Employee>[] = useMemo(() => {
    const base: ColumnDef<Employee>[] = [
      {
        accessorKey: "name",
        header: t("staff.name", "Name"),
        meta: { label: t("staff.name", "Name"), phone: "title" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.job_title ?? t("staff.noJobTitle", "No job title")}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "kind",
        header: t("staff.kind", "Kind"),
        meta: { label: t("staff.kind", "Kind") },
        cell: ({ row }) => (
          <Badge variant="secondary" data-testid="employee-kind">
            {t(`staff.kind_${row.original.kind}`, KIND_FALLBACK[row.original.kind] ?? row.original.kind)}
          </Badge>
        ),
      },
      {
        id: "branches",
        header: t("dawam.branches", "Branches"),
        meta: { label: t("dawam.branches", "Branches") },
        cell: ({ row }) =>
          row.original.branch_ids.map((id) => branchName.get(id)).filter(Boolean).join("، ") || "—",
      },
      {
        accessorKey: "phone",
        header: t("dawam.whatsapp", "WhatsApp number"),
        meta: { label: t("dawam.whatsapp", "WhatsApp number"), numeric: true, align: "start" },
        cell: ({ row }) =>
          row.original.phone ? <span dir="ltr" className="tabular-nums">+{row.original.phone.replace(/^\+/, "")}</span> : "—",
      },
      {
        accessorKey: "app_access",
        header: t("staff.appAccess", "Staff app"),
        meta: { label: t("staff.appAccess", "Staff app") },
        cell: ({ row }) =>
          row.original.app_access ? t("staff.appAccessYes", "Yes") : t("staff.appAccessNo", "No"),
      },
      {
        accessorKey: "role",
        header: t("staff.madarRole", "Madar role"),
        meta: { label: t("staff.madarRole", "Madar role") },
        cell: ({ row }) => (row.original.role ? t(`roles.${row.original.role}`, row.original.role) : "—"),
      },
      {
        id: "device",
        header: t("staff.device", "Phone"),
        meta: { label: t("staff.device", "Phone") },
        cell: ({ row }) =>
          row.original.device_model ? (
            <div className="min-w-0">
              <div className="truncate">{row.original.device_model}</div>
              <div className="truncate text-xs text-muted-foreground">
                {t("staff.deviceSince", { date: fmtDate(row.original.device_since), defaultValue: `since ${fmtDate(row.original.device_since)}` })}
              </div>
            </div>
          ) : "—",
      },
      {
        accessorKey: "department_name",
        header: t("staff.department", "Department"),
        meta: { label: t("staff.department", "Department") },
        cell: ({ row }) => row.original.department_name ?? "—",
      },
      {
        accessorKey: "employment_status",
        header: t("staff.employmentStatus", "Status"),
        meta: { label: t("staff.employmentStatus", "Status") },
        cell: ({ row }) => (
          <StatusPill tone={EMPLOYMENT_STATUS_TONE[row.original.employment_status] ?? "neutral"}>
            {t(`staff.status_${row.original.employment_status}`, row.original.employment_status)}
          </StatusPill>
        ),
      },
    ];
    if (showSalary) {
      base.push({
        id: "salary",
        header: t("staff.baseSalary", "Base salary (monthly)"),
        meta: { label: t("staff.baseSalary", "Base salary (monthly)"), numeric: true },
        cell: ({ row }) => {
          const state = salaryState(row.original);
          // Nobody set one (owner decision 9): payroll won't approve until it is.
          if (state === "not_set") return <Badge variant="outline">{t("dawam.notSet", "Not set")}</Badge>;
          return state === "hidden" ? "—" : fmtMoney(row.original.base_salary_piastres);
        },
      });
    }
    return base;
    // `remove` is stable enough for a row action; re-creating the columns on
    // every render would reset the table's internal state.
  }, [t, showSalary, branchName]);

  return (
    <Page>
      <PageHeader
        title={t("staff.employees", "Employees")}
        description={t(
          "staff.employeesSubtitle2",
          "Everyone who works here. Someone can be on the staff app, on the records only, or a Madar user who is also an employee.",
        )}
        actions={
          <>
            <Button variant="outline" onClick={() => setDeptOpen(true)}>
              <Users className="size-4" />
              {t("staff.departments", "Departments")}
            </Button>
            {canCreate ? (
              <>
                {/* The sheet import lives here too, not only on Team and Set-up (DSH-7). */}
                <Button variant="outline" onClick={() => setImporting(true)}>
                  <FileSpreadsheet className="size-4" />
                  {t("dawam.importTitle", "Import from a spreadsheet")}
                </Button>
                <Button onClick={() => setAdding(true)}>
                  <Plus className="size-4" />
                  {t("dawam.addEmployee", "Add employee")}
                </Button>
              </>
            ) : null}
          </>
        }
        below={
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("staff.allStatuses", "All statuses")}</SelectItem>
                <SelectItem value="active">{t("staff.statusActive", "Active")}</SelectItem>
                <SelectItem value="suspended">{t("staff.statusSuspended", "Suspended")}</SelectItem>
                <SelectItem value="terminated">{t("staff.statusTerminated", "Terminated")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("staff.allDepartments", "All departments")}</SelectItem>
                {(departmentsQ.data ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={employees}
        loading={employeesQ.isLoading}
        error={employeesQ.error}
        onRetry={() => void employeesQ.refetch()}
        rowActions={canEdit || canDelete ? (r) => (
          <>
            {canEdit && r.device_model ? (
              <RowAction label={t("dawam.revokePhoneShort", "Sign the phone out")} onClick={() => void revoke(r)}>
                <Smartphone className="size-4" />
              </RowAction>
            ) : null}
            {canDelete && r.employment_status !== "terminated" ? (
              <RowAction destructive label={t("staff.endEmployment", "End employment")} onClick={() => void remove(r)}>
                <UserX className="size-4" />
              </RowAction>
            ) : null}
          </>
        ) : undefined}
        getRowId={(r) => r.id}
        onRowClick={(r) => setEditing(r)}
        searchPlaceholder={t("staff.searchEmployees", "Search employees…")}
        emptyState={
          <EmptyState
            icon={UserRound}
            title={t("staff.noEmployees", "No employees yet")}
            description={t(
              "staff.noEmployeesHint2",
              "Add someone who signs in to the staff app, someone on the records only, or make an existing Madar user an employee.",
            )}
            action={canCreate ? (
              <Button onClick={() => setAdding(true)}>
                <Plus className="size-4" />
                {t("dawam.addEmployee", "Add employee")}
              </Button>
            ) : undefined}
          />
        }
      />

      {adding ? <AddEmployeeDialog onOpenChange={(o) => !o && setAdding(false)} /> : null}
      {importing ? <ImportPeopleDialog onOpenChange={(o) => !o && setImporting(false)} /> : null}

      <EmployeeDialog employee={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />

      <DepartmentsDialog
        open={deptOpen}
        onOpenChange={setDeptOpen}
        departments={departmentsQ.data ?? []}
        // A department spans the business: the server wants the right at
        // every branch, so a branch manager only reads the list (O-2).
        canAdd={authz.canEverywhere(Cap.hrStaffCreate)}
        canDelete={authz.canEverywhere(Cap.hrStaffDelete)}
      />

    </Page>
  );
}

function DepartmentsDialog({
  open,
  onOpenChange,
  departments,
  canAdd,
  canDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  canAdd: boolean;
  canDelete: boolean;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createDepartment({ name: name.trim() });
      setName("");
      void invalidateDepartments();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = useConfirm();
  const remove = async (d: Department) => {
    const ok = await confirm({
      title: t("staff.deleteDepartmentTitle", { name: d.name, defaultValue: `Delete the ${d.name} department?` }),
      description: t("staff.deleteDepartmentHint", "Employees keep their profiles; only the grouping is removed. A department that still has staff can't be deleted."),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    const id = d.id;
    try {
      await deleteDepartment(id);
      void invalidateDepartments();
    } catch (e) {
      // The backend refuses to delete a department that still holds people;
      // its message says how many, so show it verbatim.
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("staff.departments", "Departments")}</DialogTitle>
        </DialogHeader>

        {canAdd ? (
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("staff.newDepartment", "New department")}
            onKeyDown={(e) => {
              if (e.key === "Enter") void add();
            }}
          />
          <Button onClick={() => void add()} disabled={busy || !name.trim()} aria-label={t("staff.addDepartment", "Add department")}>
            <Plus className="size-4" />
          </Button>
        </div>
        ) : null}

        <div className="space-y-2">
          {departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("staff.noDepartments", "No departments yet.")}
            </p>
          ) : (
            departments.map((d) => (
              <Card key={d.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                  <CardTitle className="text-sm font-medium">{d.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="tabular-nums">
                      {t("staff.employeeCount", "{{count}} staff", { count: d.employee_count })}
                    </Badge>
                    {canDelete ? (
                      <RowAction destructive label={t("common.delete", "Delete")} onClick={() => void remove(d)}>
                        <Trash2 className="size-4" />
                      </RowAction>
                    ) : null}
                  </div>
                </CardHeader>
                {d.manager_name ? (
                  <CardContent className="pt-0 text-xs text-muted-foreground">
                    {t("staff.managedBy", "Managed by {{name}}", { name: d.manager_name })}
                  </CardContent>
                ) : null}
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.close", "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
