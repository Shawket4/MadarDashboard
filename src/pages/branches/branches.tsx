import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle, Edit2, GitBranch, MapPin, Phone, Plus, Printer, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { StatCard } from "@/shared/ui/stat-card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useListBranches, useDeleteBranch, getListBranchesQueryKey } from "@/shared/api/generated/api";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { getErrorMessage } from "@/shared/api/errors";
import { exportToExcel } from "@/shared/lib/excel";
import type { Branch } from "@/shared/types";

import { BranchDialog } from "@/features/dialogs/branch-dialog";

export default function Branches() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { orgId } = useCurrentContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useListBranches({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });

  const { mutate: remove, isPending: removing } = useDeleteBranch({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListBranchesQueryKey({ org_id: orgId ?? "" }) });
        toast.success(t("branches.deletedToast"));
        setConfirmDelete(null);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const columns: ColumnDef<Branch>[] = [
    {
      accessorKey: "name",
      header: t("common.name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <GitBranch size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{row.original.name}</p>
            {row.original.address && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <MapPin size={9} /> {row.original.address}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("branches.phone"),
      cell: ({ row }) =>
        row.original.phone ? (
          <span className="text-sm font-mono flex items-center gap-1"><Phone size={11} />{row.original.phone}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      accessorKey: "printer_brand",
      header: t("branches.printer"),
      cell: ({ row }) =>
        row.original.printer_brand ? (
          <div className="flex items-center gap-1.5">
            <Printer size={12} className="text-muted-foreground" />
            <div>
              <p className="text-xs font-semibold capitalize">{row.original.printer_brand}</p>
              <p className="text-xs text-muted-foreground font-mono">{row.original.printer_ip}:{row.original.printer_port}</p>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">{t("branches.noPrinter")}</span>
        ),
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
          <Button data-testid={`edit-branch-${row.original.id}`} variant="ghost" size="iconSm" onClick={() => { setEditBranch(row.original); setDialogOpen(true); }}>
            <Edit2 size={13} />
          </Button>
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setConfirmDelete(row.original)}>
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Branches",
      sheets: [
        {
          name: "Branches",
          title: t("branches.title"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (b: Branch) => b.name, width: 28 },
            { key: "address", header: t("branches.address"), accessor: (b: Branch) => b.address ?? "—", width: 32 },
            { key: "phone", header: t("branches.phone"), accessor: (b: Branch) => b.phone ?? "—", width: 18 },
            { key: "timezone", header: t("branches.timezone"), accessor: (b: Branch) => b.timezone, width: 18 },
            { key: "printer", header: t("branches.printer"), accessor: (b: Branch) => (b.printer_brand ? `${b.printer_brand} @ ${b.printer_ip}:${b.printer_port}` : "—"), width: 26 },
            { key: "is_active", header: t("common.status"), accessor: (b: Branch) => b.is_active, type: "bool", width: 12 },
          ],
          rows: branches,
        },
      ],
    });

  if (!orgId) return <PageShell title={t("branches.title")} description={t("branches.subtitle")}>{null}</PageShell>;

  return (
    <PageShell
      title={t("branches.title")}
      description={t("branches.subtitle")}
      action={<Button onClick={() => { setEditBranch(null); setDialogOpen(true); }}><Plus /> {t("common.new")}</Button>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard label={t("common.total")} value={branches.length} loading={isLoading} />
        <StatCard label={t("common.active")} value={branches.filter((b) => b.is_active).length} loading={isLoading} accent="success" />
        <StatCard label={t("branches.withPrinter")} value={branches.filter((b) => b.printer_brand).length} loading={isLoading} accent="violet" />
        <StatCard label={t("common.inactive")} value={branches.filter((b) => !b.is_active).length} loading={isLoading} accent="warning" />
      </div>

      <DataTable
        columns={columns}
        data={branches}
        isLoading={isLoading}
        searchKey="name"
        onExport={handleExport}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-4">
            <GitBranch size={32} className="text-muted-foreground/40" />
            <p>{t("common.noResults")}</p>
          </div>
        }
      />

      <BranchDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditBranch(null); }}
        edit={editBranch}
        orgId={orgId}
        key={editBranch?.id ?? "new"}
      />

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

