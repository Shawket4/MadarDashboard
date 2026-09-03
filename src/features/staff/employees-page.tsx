import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
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
  createDepartment, deleteDepartment, deleteEmployee,
  useListDepartments, useListEmployees,
} from "@/data/api/generated/api";
import type { Department, Employee } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney } from "@/lib/format";
import { EmployeeDialog } from "./employee-dialog";
import { EMPLOYMENT_STATUS_CLASS, invalidateDepartments, invalidateEmployees } from "./util";

const ALL = "__all__";

export function EmployeesPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>(ALL);
  const [department, setDepartment] = useState<string>(ALL);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deptOpen, setDeptOpen] = useState(false);
  const confirm = useConfirm();

  const employeesQ = useListEmployees({
    employment_status: status === ALL ? undefined : status,
    department_id: department === ALL ? undefined : department,
  });
  const departmentsQ = useListDepartments();
  const employees = useMemo(() => employeesQ.data ?? [], [employeesQ.data]);

  // Redaction is per-caller, not per-row: if the first row hides salary, the
  // whole column is hidden rather than rendered as a wall of dashes.
  const showSalary = employees.some(
    (e) => e.base_salary_piastres !== null && e.base_salary_piastres !== undefined,
  );

  const remove = async (employee: Employee) => {
    const ok = await confirm({
      title: t("staff.removeProfile", "Remove employee profile"),
      description: t(
        "staff.removeProfileHint",
        "This removes their employment details only. The user account, their attendance history, and any generated payslips are kept.",
      ),
      confirmLabel: t("common.remove", "Remove"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteEmployee(employee.user_id);
      toast.success(t("staff.profileRemoved", "Employee profile removed"));
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
        accessorKey: "employee_code",
        header: t("staff.employeeCode", "Employee number"),
        cell: ({ row }) => row.original.employee_code ?? "—",
      },
      {
        accessorKey: "department_name",
        header: t("staff.department", "Department"),
        cell: ({ row }) => row.original.department_name ?? "—",
      },
      {
        accessorKey: "hire_date",
        header: t("staff.hireDate", "Hire date"),
        cell: ({ row }) => row.original.hire_date ?? "—",
      },
      {
        accessorKey: "employment_status",
        header: t("staff.employmentStatus", "Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`border-transparent ${EMPLOYMENT_STATUS_CLASS[row.original.employment_status] ?? ""}`}
          >
            {t(`staff.status_${row.original.employment_status}`, row.original.employment_status)}
          </Badge>
        ),
      },
    ];
    if (showSalary) {
      base.push({
        id: "salary",
        header: t("staff.baseSalary", "Base salary (monthly)"),
        cell: ({ row }) => fmtMoney(row.original.base_salary_piastres),
      });
    }
    base.push({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("staff.removeProfile", "Remove employee profile")}
          onClick={(e) => {
            e.stopPropagation();
            void remove(row.original);
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    });
    return base;
    // `remove` is stable enough for a row action; re-creating the columns on
    // every render would reset the table's internal state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, showSalary]);

  return (
    <Page>
      <PageHeader
        title={t("staff.employees", "Employees")}
        description={t(
          "staff.employeesSubtitle",
          "Everyone on the payroll. An employee is a user account with an employment profile attached.",
        )}
        actions={
          <Button variant="outline" onClick={() => setDeptOpen(true)}>
            <Users className="size-4" />
            {t("staff.departments", "Departments")}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={employees}
        loading={employeesQ.isLoading}
        getRowId={(r) => r.user_id}
        onRowClick={(r) => setEditing(r)}
        searchPlaceholder={t("staff.searchEmployees", "Search employees…")}
        toolbar={
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
        emptyState={
          <EmptyState
            icon={UserRound}
            title={t("staff.noEmployees", "No employees yet")}
            description={t(
              "staff.noEmployeesHint",
              "Create user accounts under Users & Permissions, then open one here to add its employment details.",
            )}
          />
        }
      />

      <EmployeeDialog employee={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />

      <DepartmentsDialog
        open={deptOpen}
        onOpenChange={setDeptOpen}
        departments={departmentsQ.data ?? []}
      />

    </Page>
  );
}

function DepartmentsDialog({
  open,
  onOpenChange,
  departments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
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

  const remove = async (id: string) => {
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

        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("staff.newDepartment", "New department")}
            onKeyDown={(e) => {
              if (e.key === "Enter") void add();
            }}
          />
          <Button onClick={() => void add()} disabled={busy || !name.trim()}>
            <Plus className="size-4" />
          </Button>
        </div>

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
                    <Badge variant="outline">
                      {t("staff.employeeCount", "{{count}} staff", { count: d.employee_count })}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => void remove(d.id)}>
                      <Trash2 className="size-4" />
                    </Button>
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
