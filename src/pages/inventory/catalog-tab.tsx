import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { Boxes, Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { useListCatalog, useDeleteCatalogItem, getListCatalogQueryKey } from "@/shared/api/generated/api";
import { CatalogItemDialog } from "@/features/dialogs/catalog-item-dialog";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtMoney, fmtUnit } from "@/shared/lib/format";
import { QUERY_KEYS } from "@/shared/config/constants";
import { exportToExcel } from "@/shared/lib/excel";
import type { OrgIngredient } from "@/shared/api/generated/models";

// ── Catalog Tab ──────────────────────────────────────────────────────────────
export function CatalogTab({ orgId }: { orgId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useListCatalog(orgId, { query: { enabled: !!orgId } });
  const [dlg, setDlg] = useState(false);
  const [edit, setEdit] = useState<OrgIngredient | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OrgIngredient | null>(null);

  // Create/edit form lives in CatalogItemDialog (shared with the onboarding wizard)
  const openEdit = (i: OrgIngredient | null) => {
    setEdit(i);
    setDlg(true);
  };

  const { mutate: deleteCatalog, isPending: isRemoving } = useDeleteCatalogItem();

  const remove = (id: string) => {
    deleteCatalog(
      { orgId, id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListCatalogQueryKey(orgId) });
            // also refresh the entity-layer catalog cache used by the recipes page picker
            qc.invalidateQueries({ queryKey: QUERY_KEYS.catalog(orgId) });
          toast.success(t("common.delete"));
          setConfirmDelete(null);
        },
        onError: (e: any) => toast.error(getErrorMessage(e)),
      }
    );
  };

  const cols: ColumnDef<OrgIngredient>[] = [
    {
      accessorKey: "name",
      header: t("common.name"),
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-sm">{row.original.name}</p>
          {row.original.description && <p className="text-xs text-muted-foreground">{row.original.description}</p>}
          {row.original.category && row.original.category !== "general" && (
            <Badge variant="secondary" className="mt-1">{row.original.category.replace("_", " ")}</Badge>
          )}
        </div>
      ),
    },
    { accessorKey: "unit", header: t("common.type"), cell: ({ row }) => <Badge variant="outline">{fmtUnit(row.original.unit)}</Badge> },
    {
      accessorKey: "cost_per_unit",
      header: "Cost / unit",
      // null = cost never entered (backend stores NULL now, not a 0 default)
      cell: ({ row }) => (
        <span className="tabular text-sm">{(row.original.cost_per_unit ?? 0) > 0 ? fmtMoney(row.original.cost_per_unit ?? 0, { maxFractionDigits: 4 }) : "—"}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: t("common.status"),
      cell: ({ row }) => <Badge variant={row.original.is_active ? "success" : "secondary"}>{row.original.is_active ? t("common.active") : t("common.inactive")}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="iconSm" onClick={() => openEdit(row.original)}><Edit2 size={13} /></Button>
          <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setConfirmDelete(row.original)}>
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Catalog",
      sheets: [
        {
          name: "Catalog",
          title: t("inventory.catalog.title"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (i: OrgIngredient) => i.name, width: 28 },
            { key: "unit", header: "Unit", accessor: (i: OrgIngredient) => fmtUnit(i.unit), width: 10 },
            { key: "category", header: t("common.category"), accessor: (i: OrgIngredient) => i.category, width: 16 },
            // "money" divides by 100; unknown (null) stays blank
            { key: "cost", header: "Cost/unit (EGP)", accessor: (i: OrgIngredient) => ((i.cost_per_unit ?? 0) > 0 ? i.cost_per_unit : null), type: "money", width: 14 },
            { key: "is_active", header: t("common.status"), accessor: (i: OrgIngredient) => i.is_active, type: "bool", width: 12 },
          ],
          rows: items,
        },
      ],
    });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openEdit(null)}><Plus /> {t("inventory.catalog.newIngredient")}</Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={t("inventory.catalog.empty")}
          description={t("inventory.catalog.emptyHint")}
          action={<Button size="sm" onClick={() => openEdit(null)}><Plus /> {t("inventory.catalog.addFirst")}</Button>}
        />
      ) : (
        <DataTable columns={cols} data={items} searchKey="name" onExport={handleExport} />
      )}

      {dlg && (
        <CatalogItemDialog
          open={dlg}
          onClose={() => { setDlg(false); setEdit(null); }}
          edit={edit}
          orgId={orgId}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={t("common.confirmDelete", { name: confirmDelete?.name ?? "" })}
        destructive
        loading={isRemoving}
        onConfirm={() => confirmDelete && remove(confirmDelete.id)}
      />
    </div>
  );
}

