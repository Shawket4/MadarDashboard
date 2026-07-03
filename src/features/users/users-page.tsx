import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, GitBranch, Pencil, Plus, Shield, Trash2, Users as UsersIcon, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { UserDialog } from "./user-dialog";
import { BranchAssignDialog } from "./branch-assign-dialog";
import { invalidateUsers } from "./util";
import { deleteUser, useListUsers } from "@/data/api/generated/api";
import type { UserPublic, UserRole } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { initials } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useOrgId } from "@/hooks/use-org-id";
import { usePageSearch } from "@/data/scope/use-page-search";

const ROLE_CLASS: Record<UserRole, string> = {
  super_admin: "bg-warning/15 text-warning",
  org_admin: "bg-info/15 text-info",
  branch_manager: "bg-secondary text-secondary-foreground",
  teller: "bg-success/15 text-success",
  waiter: "bg-primary/15 text-primary",
  kitchen: "bg-accent/15 text-accent-foreground",
};

export function UsersPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();

  const list = useListUsers({ org_id: orgId || undefined }, { query: { enabled: !!orgId } });
  const users = useMemo(() => list.data ?? [], [list.data]);

  const [s, update] = usePageSearch<{ edit: string; branches: string }>();
  const editId = s.edit ?? null;
  const editing = editId && editId !== "new" ? (users.find((u) => u.id === editId) ?? null) : null;
  const dlgOpen = editId === "new" || !!editing;
  const branchUser = s.branches ? (users.find((u) => u.id === s.branches) ?? null) : null;

  const remove = async (u: UserPublic) => {
    if (await confirm({ title: t("common.confirmDelete", { name: u.name, defaultValue: `Delete "${u.name}"?` }), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
      try { await deleteUser(u.id); void invalidateUsers(); toast.success(t("users.deletedToast", "User deleted")); } catch (e) { toast.error(getErrorMessage(e)); }
    }
  };

  const roleCount = (r: UserRole) => users.filter((u) => u.role === r).length;

  const columns = useMemo<ColumnDef<UserPublic>[]>(
    () => [
      {
        accessorKey: "name", header: t("common.name", "Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 shrink-0"><AvatarFallback className="text-xs">{initials(row.original.name)}</AvatarFallback></Avatar>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{row.original.name}</p><p className="truncate text-xs text-muted-foreground">{row.original.email ?? "—"}</p></div>
          </div>
        ),
      },
      { accessorKey: "phone", header: t("users.phone", "Phone"), cell: ({ row }) => <span className="font-mono text-sm">{row.original.phone ?? "—"}</span> },
      { accessorKey: "role", header: t("users.role", "Role"), cell: ({ row }) => <Badge variant="outline" className={cn("border-transparent", ROLE_CLASS[row.original.role])}>{t(`roles.${row.original.role}`, row.original.role)}</Badge> },
      {
        accessorKey: "is_active", header: t("common.status", "Status"),
        cell: ({ row }) => row.original.is_active
          ? <Badge variant="outline" className="border-transparent bg-success/15 text-success"><CheckCircle className="size-3" /> {t("common.active", "Active")}</Badge>
          : <Badge variant="outline"><XCircle className="size-3" /> {t("common.inactive", "Inactive")}</Badge>,
      },
      {
        id: "actions", header: "",
        cell: ({ row }) => {
          const u = row.original;
          const assignable = u.role === "branch_manager" || u.role === "teller" || u.role === "waiter" || u.role === "kitchen";
          return (
            <div className="flex justify-end gap-1 rtl:flex-row-reverse" onClick={(e) => e.stopPropagation()}>
              <Button asChild variant="ghost" size="icon-sm" title={t("users.permissions", "Manage permissions")}>
                <Link to="/access/roles" search={{ user: u.id } as never}><Shield className="size-4" /></Link>
              </Button>
              {assignable ? <Button variant="ghost" size="icon-sm" title={t("users.assignBranches", "Assign branches")} onClick={() => update({ branches: u.id })}><GitBranch className="size-4" /></Button> : null}
              <Button variant="ghost" size="icon-sm" onClick={() => update({ edit: u.id })}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => void remove(u)}><Trash2 className="size-4" /></Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, update],
  );

  const handleExport = () => {
    const cols: ExcelColumn<UserPublic>[] = [
      { header: t("common.name", "Name"), accessor: (u) => u.name, type: "text", width: 28 },
      { header: t("auth.email", "Email"), accessor: (u) => u.email ?? "—", type: "text", width: 30 },
      { header: t("users.phone", "Phone"), accessor: (u) => u.phone ?? "—", type: "text", width: 18 },
      { header: t("users.role", "Role"), accessor: (u) => t(`roles.${u.role}`, u.role), type: "text", width: 18 },
      { header: t("common.status", "Status"), accessor: (u) => (u.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
    ];
    void exportToExcel({ filename: "Madar-Users", sheets: [{ name: t("users.title", "Users"), title: t("users.title", "Users"), rows: users as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
  };

  if (!orgId) return <Page><div className="space-y-1.5"><h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("users.title", "Users")}</h1></div><EmptyState icon={UsersIcon} title={t("users.pickOrg", "Select an organization")} /></Page>;

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{t("users.title", "Users")}</h1>
          <p className="text-sm text-muted-foreground">{t("users.subtitle", "Manage staff accounts and access")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton onExport={handleExport} disabled={!users.length} />
          <Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("common.new", "New")}</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("users.totalUsers", "Total Users")} value={users.length} loading={list.isLoading} />
        <StatCard label={t("users.orgAdmins", "Org Admins")} value={roleCount("org_admin")} accent="info" loading={list.isLoading} />
        <StatCard label={t("users.branchManagers", "Branch Managers")} value={roleCount("branch_manager")} accent="primary" loading={list.isLoading} />
        <StatCard label={t("users.tellers", "Tellers")} value={roleCount("teller")} accent="success" loading={list.isLoading} />
      </div>
      <DataTable
        columns={columns}
        data={users}
        loading={list.isLoading}
        getRowId={(u) => u.id}
        onRowClick={(u) => update({ edit: u.id })}
        searchPlaceholder={t("common.search", "Search…")}
        emptyState={<EmptyState icon={UsersIcon} title={t("common.noResults", "No results")} />}
      />
      {dlgOpen ? <UserDialog orgId={orgId} user={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
      {branchUser ? <BranchAssignDialog user={branchUser} open onOpenChange={(o) => { if (!o) update({ branches: undefined }); }} /> : null}
    </Page>
  );
}
