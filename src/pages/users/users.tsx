import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle, Edit2, GitBranch, Plus, Shield, Trash2, Users as UsersIcon, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { StatCard } from "@/shared/ui/stat-card";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { useListUsers, useDeleteUser, useListUserBranches, useAssignBranch, useUnassignBranch, useListBranches as useBranches, getListUsersQueryKey, getListUserBranchesQueryKey } from "@/shared/api/generated/api";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { usePermissions } from "@/shared/hooks/use-permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { exportToExcel } from "@/shared/lib/excel";
import { initials } from "@/shared/lib/format";
import type { Role } from "@/shared/config/constants";
import type { UserPublic } from "@/shared/types";

const ROLE_COLOR: Record<Role, "success" | "info" | "warning" | "secondary"> = {
  super_admin: "warning",
  org_admin: "info",
  branch_manager: "info",
  teller: "success",
};

import { UserDialog } from "@/features/dialogs/user-dialog";

function BranchAssignDialog({ open, onClose, user }: { open: boolean; onClose: () => void; user: UserPublic | null }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const orgId = user?.org_id ?? null;
  const { data: branches = [] } = useBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const { data: assigned = [] } = useListUserBranches(user?.id ?? "", { query: { enabled: !!user?.id } });
  const assignedIds = new Set(assigned.map((a) => a.branch_id));

  const assignReq = useAssignBranch({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListUserBranchesQueryKey(user?.id ?? "") }),
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const unassignReq = useUnassignBranch({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListUserBranchesQueryKey(user?.id ?? "") }),
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const isPending = assignReq.isPending || unassignReq.isPending;

  const toggle = ({ branchId, isAssigned }: { branchId: string; isAssigned: boolean }) => {
    if (isAssigned) {
      unassignReq.mutate({ id: user!.id, branchId });
    } else {
      assignReq.mutate({ id: user!.id, data: { branch_id: branchId } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.branchAccess")}</DialogTitle>
          <DialogDescription>{t("users.branchAccessHint", { name: user?.name ?? "" })}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("common.noResults")}</p>
          ) : (
            branches.map((b) => {
              const isAssigned = assignedIds.has(b.id);
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg p-3 border hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    {b.address && <p className="text-xs text-muted-foreground truncate">{b.address}</p>}
                  </div>
                  <Switch checked={isAssigned} disabled={isPending} onCheckedChange={() => toggle({ branchId: b.id, isAssigned })} />
                </div>
              );
            })
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>{t("common.done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Users() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { orgId } = useCurrentContext();
  const { can } = usePermissions();
  const [userDlg, setUserDlg] = useState(false);
  const [branchDlg, setBranchDlg] = useState(false);
  const [editUser, setEditUser] = useState<UserPublic | null>(null);
  const [branchUser, setBranchUser] = useState<UserPublic | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserPublic | null>(null);

  const { data: users = [], isLoading } = useListUsers(
    { org_id: orgId || undefined },
    { query: { enabled: !!orgId } }
  );

  const deleteReq = useDeleteUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast.success(t("users.deletedToast"));
        setConfirmDelete(null);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const remove = deleteReq.mutate;
  const removing = deleteReq.isPending;

  const roleCount = (r: Role) => users.filter((u) => u.role === r).length;

  const columns: ColumnDef<UserPublic>[] = [
    {
      accessorKey: "name",
      header: t("common.name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">{initials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{row.original.name}</p>
            <p className="text-xs text-muted-foreground truncate">{row.original.email ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("users.phone"),
      cell: ({ getValue }) => <span className="text-sm font-mono">{(getValue() as string) ?? "—"}</span>,
    },
    {
      accessorKey: "role",
      header: t("users.role"),
      cell: ({ getValue }) => {
        const r = getValue() as Role;
        return <Badge variant={ROLE_COLOR[r]}>{t(`roles.${r}`)}</Badge>;
      },
    },
    {
      accessorKey: "is_active",
      header: t("common.status"),
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge variant="success"><CheckCircle size={11} /> {t("common.active")}</Badge>
        ) : (
          <Badge variant="destructive"><XCircle size={11} /> {t("common.inactive")}</Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          {can("permissions", "read") && (
            <Button variant="ghost" size="iconSm" title={t("users.permissions")} onClick={() => navigate(`/permissions/${row.original.id}`)}>
              <Shield size={13} />
            </Button>
          )}
          {can("users", "update") && (row.original.role === "branch_manager" || row.original.role === "teller") && (
            <Button variant="ghost" size="iconSm" title={t("users.assignBranches")} onClick={() => { setBranchUser(row.original); setBranchDlg(true); }}>
              <GitBranch size={13} />
            </Button>
          )}
          {can("users", "update") && (
            <Button variant="ghost" size="iconSm" onClick={() => { setEditUser(row.original); setUserDlg(true); }}>
              <Edit2 size={13} />
            </Button>
          )}
          {can("users", "delete") && (
            <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setConfirmDelete(row.original)}>
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Users",
      sheets: [
        {
          name: "Users",
          title: t("users.title"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (u: UserPublic) => u.name, width: 28 },
            { key: "email", header: t("auth.email"), accessor: (u: UserPublic) => u.email ?? "—", width: 30 },
            { key: "phone", header: t("users.phone"), accessor: (u: UserPublic) => u.phone ?? "—", width: 18 },
            { key: "role", header: t("users.role"), accessor: (u: UserPublic) => t(`roles.${u.role}`), width: 18 },
            { key: "is_active", header: t("common.status"), accessor: (u: UserPublic) => u.is_active, type: "bool", width: 12 },
          ],
          rows: users,
        },
      ],
    });

  return (
    <PageShell
      title={t("users.title")}
      description={t("users.subtitle")}
      action={can("users", "create") ? <Button onClick={() => { setEditUser(null); setUserDlg(true); }}><Plus /> {t("common.new")}</Button> : undefined}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard label={t("users.totalUsers")} value={users.length} loading={isLoading} />
        <StatCard label={t("users.orgAdmins")} value={roleCount("org_admin")} loading={isLoading} accent="info" />
        <StatCard label={t("users.branchManagers")} value={roleCount("branch_manager")} loading={isLoading} accent="violet" />
        <StatCard label={t("users.tellers")} value={roleCount("teller")} loading={isLoading} accent="success" />
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchKey="name"
        onExport={handleExport}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-4">
            <UsersIcon size={32} className="text-muted-foreground/40" />
            <p>{t("common.noResults")}</p>
          </div>
        }
      />

      <UserDialog open={userDlg} onClose={() => { setUserDlg(false); setEditUser(null); }} edit={editUser} key={editUser?.id ?? "new"} />
      <BranchAssignDialog open={branchDlg} onClose={() => setBranchDlg(false)} user={branchUser} />
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={t("common.confirmDelete", { name: confirmDelete?.name ?? "" })}
        destructive
        loading={removing}
        onConfirm={() => confirmDelete && remove({ id: confirmDelete.id })}
      />
    </PageShell>
  );
}

