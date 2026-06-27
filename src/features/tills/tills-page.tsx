import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, Pencil, Plus, Star, Store, Trash2, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { DataTable } from "@/components/app/data-table";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TillDialog } from "./till-dialog";
import { deleteTill, useListTills } from "@/data/api/generated/api";
import type { Till } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { invalidateTills } from "./util";

export function TillsPage() {
  const { t } = useTranslation();
  const scope = useScope();
  const branchId = scope.branchId;
  const confirm = useConfirm();

  const list = useListTills({ branch_id: branchId ?? "" }, { query: { enabled: !!branchId } });
  const tills = useMemo(() => list.data ?? [], [list.data]);

  const [editing, setEditing] = useState<Till | null>(null);
  const [dlgOpen, setDlgOpen] = useState(false);
  const openNew = () => { setEditing(null); setDlgOpen(true); };
  const openEdit = (x: Till) => { setEditing(x); setDlgOpen(true); };

  const remove = async (x: Till) => {
    if (await confirm({
      title: t("common.confirmDelete", { name: x.name, defaultValue: `Delete "${x.name}"?` }),
      destructive: true,
      confirmLabel: t("common.delete", "Delete"),
    })) {
      try {
        await deleteTill(x.id);
        toast.success(t("tills.deleted", "Till deleted"));
        void invalidateTills();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    }
  };

  const columns = useMemo<ColumnDef<Till>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("tills.name", "Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{row.original.name}</span>
            {row.original.is_default ? (
              <Badge variant="outline" className="border-transparent bg-warning/15 text-warning">
                <Star className="size-3" /> {t("tills.default", "Default")}
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: t("common.status", "Status"),
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="outline" className="border-transparent bg-success/15 text-success">
              <CheckCircle className="size-3" /> {t("common.active", "Active")}
            </Badge>
          ) : (
            <Badge variant="outline"><XCircle className="size-3" /> {t("common.inactive", "Inactive")}</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)} aria-label={t("common.edit", "Edit")}><Pencil className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => void remove(row.original)} aria-label={t("common.delete", "Delete")}><Trash2 className="size-4" /></Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("tills.title", "Tills")}</h1>
          <p className="text-sm text-muted-foreground">{t("tills.pageSubtitle", "Cash drawers / registers for this branch. Each open shift runs on one till.")}</p>
        </div>
        {branchId ? <Button onClick={openNew}><Plus className="size-4" /> {t("tills.newTill", "New till")}</Button> : null}
      </div>
      {!branchId ? (
        <EmptyState icon={Store} title={t("tills.pickBranch", "Select a branch in the top bar to manage its tills")} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={tills}
            loading={list.isLoading}
            getRowId={(x) => x.id}
            onRowClick={openEdit}
            searchPlaceholder={t("common.search", "Search…")}
            emptyState={
              <EmptyState
                icon={Wallet}
                title={t("tills.empty", "No tills yet")}
                description={t("tills.emptyHint", "Every branch gets a default till; add more for multiple registers.")}
                action={<Button onClick={openNew}><Plus className="size-4" /> {t("tills.newTill", "New till")}</Button>}
              />
            }
          />
          <TillDialog branchId={branchId} till={editing} open={dlgOpen} onOpenChange={setDlgOpen} />
        </>
      )}
    </Page>
  );
}
