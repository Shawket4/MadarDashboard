import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { GitBranch, Pencil, Plus, Shield, Trash2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { StatusPill } from "@/components/app/status-pill";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { StatCard } from "@/components/app/stat-card";
import { ExportButton } from "@/components/app/export-button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserDialog } from "./user-dialog";
import { BranchAssignDialog } from "./branch-assign-dialog";
import { RowAction } from "./row-action";
import { invalidateUsers } from "./util";
import { deleteUser, useListUsers } from "@/data/api/generated/api";
import type { UserPublic, UserRole } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { initials } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useOrgId } from "@/hooks/use-org-id";
import { usePageSearch } from "@/data/scope/use-page-search";

export function UsersPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();

  // `/users` is unpaginated, so the table holds every account in scope and the
  // export has nothing extra to fetch.
  const list = useListUsers({ org_id: orgId || undefined }, { query: { enabled: !!orgId } });
  const users = useMemo(() => list.data ?? [], [list.data]);

  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

  const [s, update] = usePageSearch<{ edit: string; branches: string }>();
  const editId = s.edit ?? null;
  const editing = editId && editId !== "new" ? (users.find((u) => u.id === editId) ?? null) : null;
  const dlgOpen = editId === "new" || !!editing;
  const branchUser = s.branches ? (users.find((u) => u.id === s.branches) ?? null) : null;

  const remove = async (u: UserPublic) => {
    if (await confirm({ title: t("users.deleteTitle", { name: u.name, defaultValue: `Delete ${u.name}'s account?` }), description: t("users.deleteDescription", "They can no longer sign in to the dashboard or the POS. Their past orders and shifts stay on record."), destructive: true, confirmLabel: t("common.delete", "Delete") })) {
      try { await deleteUser(u.id); void invalidateUsers(); toast.success(t("users.deletedToast", "User deleted")); } catch (e) { toast.error(getErrorMessage(e)); }
    }
  };

  const roleCount = (r: UserRole) => users.filter((u) => u.role === r).length;

  const columns = useMemo<ColumnDef<UserPublic>[]>(
    () => [
      {
        accessorKey: "name", header: t("common.name", "Name"), meta: { label: t("common.name", "Name"), phone: "title" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 shrink-0"><AvatarFallback className="text-xs">{initials(row.original.name)}</AvatarFallback></Avatar>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{row.original.name}</p><p className="truncate text-xs text-muted-foreground">{row.original.email ?? "—"}</p></div>
          </div>
        ),
      },
      { accessorKey: "phone", header: t("users.phone", "Phone"), meta: { label: t("users.phone", "Phone"), numeric: true, align: "start" }, cell: ({ row }) => <span dir="ltr">{row.original.phone ?? "—"}</span> },
      { accessorKey: "role", header: t("users.role", "Role"), meta: { label: t("users.role", "Role") }, cell: ({ row }) => <Badge variant="secondary">{t(`roles.${row.original.role}`, row.original.role)}</Badge> },
      {
        accessorKey: "is_active", header: t("common.status", "Status"),
        meta: { label: t("common.status", "Status") },
        cell: ({ row }) => row.original.is_active
          ? <StatusPill tone="success">{t("common.active", "Active")}</StatusPill>
          : <StatusPill tone="neutral">{t("common.inactive", "Inactive")}</StatusPill>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, update],
  );

  const handleExport = async () => {
    const cols: ExcelColumn<UserPublic>[] = [
      { header: t("common.name", "Name"), accessor: (u) => u.name, type: "text", width: 28 },
      { header: t("auth.email", "Email"), accessor: (u) => u.email ?? "—", type: "text", width: 30 },
      { header: t("users.phone", "Phone"), accessor: (u) => u.phone ?? "—", type: "text", width: 18 },
      { header: t("users.role", "Role"), accessor: (u) => t(`roles.${u.role}`, u.role), type: "text", width: 18 },
      { header: t("common.status", "Status"), accessor: (u) => (u.is_active ? t("common.active", "Active") : t("common.inactive", "Inactive")), type: "text", width: 12 },
    ];
    setExporting(true);
    try {
      await exportToExcel({ filename: "Madar-Users", logoUrl, sheets: [{ name: t("users.title", "Users"), title: t("users.title", "Users"), rows: users as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }] });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  if (!orgId) return <Page><PageHeader title={t("users.title", "Users")} /><EmptyState icon={UsersIcon} title={t("users.pickOrg", "Select an organization")} /></Page>;

  const rowActions = (u: UserPublic) => {
    const assignable = u.role === "branch_manager" || u.role === "teller" || u.role === "waiter" || u.role === "kitchen";
    return (
      <>
        <RowAction asChild label={t("users.permissions", "Manage permissions")}>
          <Link to="/access/roles" search={{ user: u.id } as never}><Shield className="size-4" /></Link>
        </RowAction>
        {assignable ? <RowAction label={t("users.assignBranches", "Assign branches")} onClick={() => update({ branches: u.id })}><GitBranch className="size-4" /></RowAction> : null}
        <RowAction label={t("common.edit", "Edit")} onClick={() => update({ edit: u.id })}><Pencil className="size-4" /></RowAction>
        <RowAction destructive label={t("common.delete", "Delete")} onClick={() => void remove(u)}><Trash2 className="size-4" /></RowAction>
      </>
    );
  };

  return (
    <Page>
      <PageHeader
        title={t("users.title", "Users")}
        subtitle={t("users.subtitle", "Manage staff accounts and access")}
        actions={<><ExportButton onExport={handleExport} loading={exporting} disabled={!users.length} /><Button onClick={() => update({ edit: "new" })}><Plus className="size-4" /> {t("common.new", "New")}</Button></>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("users.totalUsers", "Total Users")} value={users.length} loading={list.isLoading} />
        <StatCard label={t("users.orgAdmins", "Org Admins")} value={roleCount("org_admin")} loading={list.isLoading} />
        <StatCard label={t("users.branchManagers", "Branch Managers")} value={roleCount("branch_manager")} loading={list.isLoading} />
        <StatCard label={t("users.tellers", "Tellers")} value={roleCount("teller")} loading={list.isLoading} />
      </div>
      <DataTable
        columns={columns}
        data={users}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => void list.refetch()}
        rowActions={rowActions}
        getRowId={(u) => u.id}
        onRowClick={(u) => update({ edit: u.id })}
        searchPlaceholder={t("common.search", "Search…")}
        emptyState={<EmptyState icon={UsersIcon} title={t("users.empty", "Staff accounts you add appear here")} />}
      />
      {dlgOpen ? <UserDialog orgId={orgId} user={editing} open={dlgOpen} onOpenChange={(o) => { if (!o) update({ edit: undefined }); }} /> : null}
      {branchUser ? <BranchAssignDialog user={branchUser} open onOpenChange={(o) => { if (!o) update({ branches: undefined }); }} /> : null}
    </Page>
  );
}
