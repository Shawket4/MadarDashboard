import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Banknote,
  Check,
  CreditCard,
  Edit2,
  Gift,
  Landmark,
  Link as LinkIcon,
  PieChart,
  Plus,
  QrCode,
  Receipt,
  Smartphone,
  Star,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/shared/ui/page-shell";
import { DataTable } from "@/shared/ui/data-table";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { StatCard } from "@/shared/ui/stat-card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useActivatePaymentMethod,
  useDeactivatePaymentMethod,
  getListPaymentMethodsQueryKey,
} from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { getErrorMessage } from "@/shared/api/errors";
import { exportToExcel } from "@/shared/lib/excel";
import type { OrgPaymentMethod } from "@/shared/api/generated/models";
import {
  paymentMethodSchema,
  type PaymentMethodValues,
} from "@/entities/payment-method/schemas";

const PREDEFINED_COLORS = [
  "#0F172A",
  "#334155",
  "#10B981",
  "#059669",
  "#3B82F6",
  "#2563EB",
  "#8B5CF6",
  "#7C3AED",
  "#F59E0B",
  "#D97706",
  "#EF4444",
  "#DC2626",
  "#EC4899",
  "#DB2777",
];

const ICONS = [
  { id: "money", label: "Cash / Money", icon: Banknote },
  { id: "credit_card", label: "Credit Card", icon: CreditCard },
  { id: "wallet", label: "Digital Wallet", icon: Wallet },
  { id: "pie_chart", label: "Mixed / Split", icon: PieChart },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "qr_code", label: "QR Code", icon: QrCode },
  { id: "bank", label: "Bank Transfer", icon: Landmark },
  { id: "gift_card", label: "Gift Card", icon: Gift },
  { id: "smartphone", label: "Mobile Pay", icon: Smartphone },
  { id: "receipt", label: "Voucher", icon: Receipt },
  { id: "store", label: "Store Credit", icon: Store },
  { id: "star", label: "Loyalty Points", icon: Star },
  { id: "link", label: "Payment Link", icon: LinkIcon },
];

function PaymentMethodDialog({
  open,
  onClose,
  edit,
  orgId,
}: {
  open: boolean;
  onClose: () => void;
  edit?: OrgPaymentMethod | null;
  orgId: string;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const isSystem = edit
    ? [
        "cash",
        "card",
        "digital_wallet",
        "mixed",
        "talabat_online",
        "talabat_cash",
      ].includes(edit.name)
    : false;

  const trans = edit?.label_translations as Record<string, string> | undefined;

  const form = useForm<PaymentMethodValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: edit?.name ?? "",
      labelEn: trans?.en ?? "",
      labelAr: trans?.ar ?? "",
      color: edit?.color?.startsWith("#") ? edit.color : PREDEFINED_COLORS[2],
      icon: edit?.icon || "money",
      isCash: edit?.is_cash ?? false,
      is_active: edit?.is_active ?? true,
    },
  });

  const createReq = useCreatePaymentMethod({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
        toast.success(t("common.saved"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const updateReq = useUpdatePaymentMethod({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
        toast.success(t("common.saved"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  function onSubmit(v: PaymentMethodValues) {
    const payload = {
      org_id: orgId,
      name: v.name,
      label_translations: {
        en: v.labelEn,
        ar: v.labelAr || "",
      },
      color: v.color,
      icon: v.icon,
      is_cash: v.isCash,
      is_active: v.is_active,
    };

    if (edit) {
      updateReq.mutate({ id: edit.id, data: payload });
    } else {
      createReq.mutate({ data: payload });
    }
  }

  const isPending = createReq.isPending || updateReq.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{edit ? t("common.edit") : t("common.add")}</DialogTitle>
          <DialogDescription>
            {edit
              ? "Modify your payment method settings below."
              : "Create a new payment method for checkout."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.name")} (ID)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. visa_card"
                        disabled={isSystem || !!edit}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, "_"),
                          )
                        }
                      />
                    </FormControl>
                    {isSystem || edit ? (
                      <FormDescription>
                        Payment method IDs cannot be changed.
                      </FormDescription>
                    ) : (
                      <FormDescription>
                        A unique internal identifier (lowercase, underscores
                        only).
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="labelEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label (English)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Visa Card" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="labelAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label (Arabic)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. فيزا"
                          className="text-right"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-64">
                          {ICONS.map((icon) => {
                            const IconComp = icon.icon;
                            return (
                              <SelectItem key={icon.id} value={icon.id}>
                                <div className="flex items-center gap-2">
                                  <IconComp
                                    size={16}
                                    className="text-muted-foreground"
                                  />
                                  <span>{icon.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Theme</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {PREDEFINED_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => field.onChange(c)}
                            className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary`}
                            style={{ backgroundColor: c }}
                            aria-label={`Select color ${c}`}
                          >
                            {field.value === c && (
                              <Check
                                size={16}
                                className="text-white drop-shadow-sm"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isCash"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card h-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Accepts Cash</FormLabel>
                        <FormDescription className="text-xs">
                          Count as cash logic.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card h-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">
                          {t("common.active")}
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Status for checkout.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={isPending}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
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
