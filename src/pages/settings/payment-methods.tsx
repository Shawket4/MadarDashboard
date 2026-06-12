import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { CreditCard, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { StatCard } from "@/shared/ui/stat-card";
import { useActivatePaymentMethod, useDeactivatePaymentMethod, getListPaymentMethodsQueryKey } from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { getErrorMessage } from "@/shared/api/errors";
import { exportToExcel } from "@/shared/lib/excel";
import type { OrgPaymentMethod } from "@/shared/api/generated/models";

import { PaymentMethodDialog, ICONS } from "@/features/dialogs/payment-method-dialog";

export default function PaymentMethodsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { orgId } = useCurrentContext();
  const { methods, activeMethods, isLoading, getLabel, colorMap } =
    usePaymentMethods();

  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<OrgPaymentMethod | null>(
    null,
  );

  const activateMut = useActivatePaymentMethod({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() }),
      onError: (err) => toast.error(getErrorMessage(err)),
    },
  });

  const deactivateMut = useDeactivatePaymentMethod({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() }),
      onError: (err) => toast.error(getErrorMessage(err)),
    },
  });

  const toggleStatus = (id: string, current: boolean) => {
    if (current) {
      deactivateMut.mutate({ id });
    } else {
      activateMut.mutate({ id });
    }
  };

  const isSystemMethod = (pm: OrgPaymentMethod) =>
    [
      "cash",
      "card",
      "digital_wallet",
      "mixed",
      "talabat_online",
      "talabat_cash",
    ].includes(pm.name);

  // Map label into the object for searching purposes
  const enrichedMethods = useMemo(() => {
    return methods.map((m) => ({
      ...m,
      mappedLabel: getLabel(m.name),
    }));
  }, [methods, getLabel]);

  const cols: ColumnDef<OrgPaymentMethod & { mappedLabel: string }>[] = [
    {
      accessorKey: "mappedLabel",
      header: t("common.name"),
      cell: ({ row }) => {
        const pm = row.original;
        const color = colorMap[pm.name] || "#ccc";
        const matchedIcon = ICONS.find((i) => i.id === pm.icon) || ICONS[0];
        const IconComponent = matchedIcon.icon;

        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{
                backgroundColor: color.startsWith("#") ? color : "#3b82f6",
              }}
            >
              <IconComponent size={14} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate flex items-center gap-2">
                {pm.mappedLabel}
              </p>
              {isSystemMethod(pm) && (
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  System
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "is_cash",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.is_cash ? "success" : "secondary"}>
          {row.original.is_cash ? "Cash Base" : "Non-Cash"}
        </Badge>
      ),
    },
    {
      accessorKey: "is_active",
      header: t("common.status"),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={row.original.is_active}
            onCheckedChange={() =>
              toggleStatus(row.original.id, row.original.is_active)
            }
            disabled={activateMut.isPending || deactivateMut.isPending}
          />
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div
          className="flex items-center gap-1 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => {
              setEditingMethod(row.original);
              setFormOpen(true);
            }}
          >
            <Edit2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "PaymentMethods",
      sheets: [
        {
          name: "Methods",
          title: t("settings.paymentMethods"),
          columns: [
            {
              key: "name",
              header: "ID",
              accessor: (m: OrgPaymentMethod) => m.name,
              width: 25,
            },
            {
              key: "label",
              header: t("common.name"),
              accessor: (m: OrgPaymentMethod) => getLabel(m.name),
              width: 30,
            },
            {
              key: "type",
              header: "Type",
              accessor: (m: OrgPaymentMethod) =>
                m.is_cash ? "Cash" : "Non-Cash",
              width: 15,
            },
            {
              key: "is_active",
              header: t("common.status"),
              accessor: (m: OrgPaymentMethod) => m.is_active,
              type: "bool",
              width: 12,
            },
          ],
          rows: methods,
        },
      ],
    });

  if (!orgId) return null;

  return (
    <PageShell
      title={t("settings.paymentMethods")}
      description={t("settings.paymentMethodsHint", {
        defaultValue: "Manage payment methods available for checkout.",
      })}
      action={
        <Button
          onClick={() => {
            setEditingMethod(null);
            setFormOpen(true);
          }}
        >
          <Plus /> {t("common.add")}
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard
          label={t("common.total")}
          value={methods.length}
          loading={isLoading}
        />
        <StatCard
          label={t("common.active")}
          value={activeMethods.length}
          loading={isLoading}
          accent="success"
        />
        <StatCard
          label={t("common.inactive")}
          value={methods.length - activeMethods.length}
          loading={isLoading}
          accent="warning"
        />
        <StatCard
          label="System Methods"
          value={methods.filter(isSystemMethod).length}
          loading={isLoading}
          accent="info"
        />
      </div>

      <DataTable
        columns={cols}
        data={enrichedMethods}
        isLoading={isLoading}
        searchKey="mappedLabel"
        onExport={handleExport}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-4">
            <CreditCard size={32} className="text-muted-foreground/40" />
            <p>{t("common.noResults")}</p>
          </div>
        }
      />

      <PaymentMethodDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMethod(null);
        }}
        edit={editingMethod}
        orgId={orgId}
        key={editingMethod?.id ?? "new"}
      />
    </PageShell>
  );
}

