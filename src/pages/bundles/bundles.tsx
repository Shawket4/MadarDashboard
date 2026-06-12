import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams, Navigate } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { Boxes, Plus, Trash2, Edit2, CheckCircle, XCircle, Activity } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { StatCard } from "@/shared/ui/stat-card";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

import { type BundleFormValues } from "@/entities/bundle/schemas";
import { useListBundles, useDeleteBundle, useActivateBundle, useArchiveBundle, getListBundlesQueryKey } from "@/shared/api/generated/api";
import { usePermissions } from "@/shared/hooks/use-permissions";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtMoney, piastresToEgp } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import type { BundleWithComponents } from "@/shared/api/generated/models/bundleWithComponents";

import { BundleDialog } from "./bundle-dialog";
import { PerformanceDialog } from "./performance-dialog";

// ── Main Page Component ──────────────────────────────────────────────────────
export default function Bundles() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { orgId } = useCurrentContext();
  const { role, can } = usePermissions();

  // Dialog & state values
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editItem, setEditItem] = useState<BundleWithComponents | null>(null);
  const [perfItem, setPerfItem] = useState<BundleWithComponents | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BundleWithComponents | null>(null);
  const [advisorHydration, setAdvisorHydration] = useState<Partial<BundleFormValues> | null>(null);

  const { data: paginated, isLoading } = useListBundles({
    org_id: orgId!,
    page: 1,
    per_page: 500,
    search: searchParams.get("search") || undefined,
  }, { query: { enabled: !!orgId } });

  const bundles = paginated?.data || [];

  // Mutations
  const qc = useQueryClient();
  // FIX: Orval mutation hooks don't auto-invalidate — status/delete changes never refreshed the table
  const invalidateBundles = () => qc.invalidateQueries({ queryKey: getListBundlesQueryKey() });
  const activateMutation = useActivateBundle({ mutation: { onSuccess: invalidateBundles } });
  const archiveMutation = useArchiveBundle({ mutation: { onSuccess: invalidateBundles } });
  const deleteMutation = useDeleteBundle({ mutation: { onSuccess: invalidateBundles } });

  // URL Gating & Hydration logic from Menu Advisor
  useEffect(() => {
    if (searchParams.get("action") === "create" && searchParams.get("advisor_suggestion") === "true") {
      const name = searchParams.get("name") || "";
      const itemIds = searchParams.get("item_ids")?.split(",") || [];
      const prices = searchParams.get("prices")?.split(",").map(Number) || [];

      const totalPrice = prices.reduce((a, b) => a + b, 0);
      const suggestedPrice = Math.round(totalPrice * 0.85 * 100) / 100; // default 15% combo save

      const componentsPayload = itemIds.map((id, index) => ({
        item_id: id,
        quantity: 1,
        position: index + 1,
      }));

      // Set Advisor Hydration triggers
      setEditItem(null);
      setAdvisorHydration({
        name,
        price: suggestedPrice,
        components: componentsPayload,
        branch_ids: [],
      });
      setDlgOpen(true);

      // Clean search parameters to prevent looping
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("action");
      newParams.delete("advisor_suggestion");
      newParams.delete("name");
      newParams.delete("item_ids");
      newParams.delete("prices");
      setSearchParams(newParams);

      toast.success(t("bundles.advisor.prompt"));
    }
  }, [searchParams, setSearchParams, t]);

  // Gating - placed after all React hooks have executed
  if (role === "teller") {
    return <Navigate to="/" replace />;
  }

  if (!orgId) {
    return <PageShell title={t("bundles.title")} description={t("bundles.subtitle")}>{null}</PageShell>;
  }

  // Excel Export definitions
  const handleExport = () =>
    exportToExcel({
      filename: "Bundles",
      sheets: [
        {
          name: "Bundles",
          title: t("bundles.title"),
          columns: [
            { key: "name", header: t("bundles.bundleName"), accessor: (b: BundleWithComponents) => b.name, width: 28 },
            { key: "price", header: t("bundles.price"), accessor: (b: BundleWithComponents) => piastresToEgp(b.price), type: "number", width: 14 },
            { key: "computed_cost", header: t("bundles.cost"), accessor: (b: BundleWithComponents) => piastresToEgp(b.computed_cost), type: "number", width: 14 },
            {
              key: "components",
              header: t("bundles.components"),
              accessor: (b: BundleWithComponents) => b.components.map((c) => `${c.item_name} (x${c.quantity})`).join(", "),
              width: 38,
            },
            { key: "status", header: t("common.status"), accessor: (b: BundleWithComponents) => t(`bundles.status.${b.status}`), width: 12 },
          ],
          rows: bundles,
        },
      ],
    });

  const columns: ColumnDef<BundleWithComponents>[] = [
    {
      accessorKey: "name",
      header: t("bundles.bundleName"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            {row.original.image_url ? (
              <img src={row.original.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Boxes className="text-primary" size={18} />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-xs">{row.original.description || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "components",
      header: t("bundles.components"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-sm">
          {row.original.components.map((c) => (
            <Badge key={c.id} variant="secondary" className="text-xs font-medium py-0.5 px-1.5">
              {c.item_name} <span className="text-primary font-bold ms-1">x{c.quantity}</span>
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: t("bundles.price"),
      cell: ({ row }) => <span className="font-bold tabular text-sm">{fmtMoney(row.original.price)}</span>,
    },
    {
      accessorKey: "computed_cost",
      header: t("bundles.cost"),
      cell: ({ row }) => <span className="font-semibold tabular text-muted-foreground text-xs">{fmtMoney(row.original.computed_cost)}</span>,
    },
    {
      accessorKey: "status",
      header: t("common.status"),
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <Badge variant={s === "active" ? "success" : s === "archived" ? "secondary" : "outline"} className="capitalize">
            {s === "active" ? <CheckCircle size={10} className="me-1" /> : s === "archived" ? <XCircle size={10} className="me-1" /> : null}
            {t(`bundles.status.${s}`)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="iconSm"
              title={t("bundles.performance.title")}
              className="text-primary hover:bg-primary/10"
              onClick={() => setPerfItem(item)}
            >
              <Activity size={13} />
            </Button>

            {item.status === "draft" && (
              <Button
                variant="ghost"
                size="iconSm"
                title={t("bundles.activate")}
                className="text-emerald-500 hover:bg-emerald-500/10"
                onClick={() =>
                  activateMutation.mutate(
                    { id: item.id },
                    {
                      onSuccess: () => toast.success(t("bundles.activatedToast")),
                      onError: (e) => toast.error(getErrorMessage(e)),
                    }
                  )
                }
              >
                <CheckCircle size={13} />
              </Button>
            )}

            {item.status === "active" && (
              <Button
                variant="ghost"
                size="iconSm"
                title={t("bundles.archive")}
                className="text-muted-foreground hover:bg-muted/10"
                onClick={() =>
                  archiveMutation.mutate(
                    { id: item.id },
                    {
                      onSuccess: () => toast.success(t("bundles.archivedToast")),
                      onError: (e) => toast.error(getErrorMessage(e)),
                    }
                  )
                }
              >
                <XCircle size={13} />
              </Button>
            )}

            {can("menu_items", "update") && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => {
                  setEditItem(item);
                  setAdvisorHydration(null);
                  setDlgOpen(true);
                }}
              >
                <Edit2 size={13} />
              </Button>
            )}

            {can("menu_items", "delete") && (
              <Button variant="ghost" size="iconSm" className="text-destructive" onClick={() => setConfirmDelete(item)}>
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const activeCount = bundles.filter((b) => b.status === "active").length;
  const draftCount = bundles.filter((b) => b.status === "draft").length;
  const archivedCount = bundles.filter((b) => b.status === "archived").length;

  return (
    <PageShell
      title={t("bundles.title")}
      description={t("bundles.subtitle")}
      action={
        can("menu_items", "create") ? (
          <Button
            onClick={() => {
              setEditItem(null);
              setAdvisorHydration(null);
              setDlgOpen(true);
            }}
          >
            <Plus /> {t("common.new")}
          </Button>
        ) : undefined
      }
    >
      {/* Sleek Dark Mode Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard label={t("common.total")} value={bundles.length} loading={isLoading} />
        <StatCard label={t("bundles.status.active")} value={activeCount} loading={isLoading} accent="success" />
        <StatCard label={t("bundles.status.draft")} value={draftCount} loading={isLoading} accent="info" />
        <StatCard label={t("bundles.status.archived")} value={archivedCount} loading={isLoading} />
      </div>

      {bundles.length === 0 && !isLoading ? (
        <div className="rounded-xl border bg-card p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Boxes size={24} className="text-muted-foreground animate-bounce" />
          </div>
          <p className="font-semibold">{t("bundles.empty")}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{t("bundles.emptyHint")}</p>
          {can("menu_items", "create") && (
            <Button onClick={() => setDlgOpen(true)}>
              <Plus /> {t("bundles.newTitle")}
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={bundles}
          isLoading={isLoading}
          searchKey="name"
          onExport={handleExport}
        />
      )}

      {/* CRUD dialog popup */}
      {dlgOpen && (
        <BundleDialog
          open={dlgOpen}
          onClose={() => {
            setDlgOpen(false);
            setEditItem(null);
            setAdvisorHydration(null);
          }}
          editItem={editItem}
          advisorValues={advisorHydration}
          orgId={orgId}
          key={editItem?.id ?? (advisorHydration ? "advisor" : "new")}
        />
      )}

      {/* Performance dialog popup */}
      {perfItem && (
        <PerformanceDialog
          open={!!perfItem}
          onClose={() => setPerfItem(null)}
          bundle={perfItem}
          key={perfItem.id}
        />
      )}

      {/* Confirm deletion popup */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={t("common.confirmDelete", { name: confirmDelete?.name ?? "" })}
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() =>
          confirmDelete &&
          deleteMutation.mutate(
            { id: confirmDelete.id },
            {
              onSuccess: () => {
                toast.success(t("bundles.deletedToast"));
                setConfirmDelete(null);
              },
              onError: (e) => toast.error(getErrorMessage(e)),
            }
          )
        }
      />
    </PageShell>
  );
}

