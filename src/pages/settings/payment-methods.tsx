import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Pencil,
  Banknote,
  CreditCard,
  Wallet,
  PieChart,
  Truck,
  QrCode,
  Landmark,
  Gift,
  Smartphone,
  Receipt,
  Store,
  Star,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/shared/ui/form";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { DataTable } from "@/shared/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrgPaymentMethod } from "@/shared/api/generated/models";
import {
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useActivatePaymentMethod,
  useDeactivatePaymentMethod,
} from "@/shared/api/generated/api";
import { queryClient } from "@/shared/api/query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/errors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ScrollArea } from "@/shared/ui/scroll-area";

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

export default function PaymentMethodsPage() {
  const { t } = useTranslation();
  const { orgId } = useCurrentContext();
  const { methods, activeMethods, isLoading, getLabel, colorMap } =
    usePaymentMethods();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<OrgPaymentMethod | null>(
    null,
  );

  const activateMut = useActivatePaymentMethod({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: ["/v1/payment-methods", orgId],
        }),
    },
  });

  const deactivateMut = useDeactivatePaymentMethod({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: ["/v1/payment-methods", orgId],
        }),
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

  const cols: ColumnDef<OrgPaymentMethod>[] = [
    {
      accessorKey: "name",
      header: t("common.name"),
      cell: ({ row }: { row: { original: OrgPaymentMethod } }) => {
        const pm = row.original;
        const color = colorMap[pm.name] || "#ccc";
        const matchedIcon = ICONS.find((i) => i.id === pm.icon) || ICONS[0];
        const IconComponent = matchedIcon.icon;

        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{
                backgroundColor: color.startsWith("#") ? color : "#3b82f6",
              }}
            >
              <IconComponent size={14} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">
                {getLabel(pm.name)}
              </span>
              {isSystemMethod(pm) && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  System
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: t("common.status"),
      cell: ({ row }: { row: { original: OrgPaymentMethod } }) => (
        <Switch
          checked={row.original.is_active}
          onCheckedChange={() =>
            toggleStatus(row.original.id, row.original.is_active)
          }
          disabled={activateMut.isPending || deactivateMut.isPending}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: OrgPaymentMethod } }) => (
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => {
              setEditingMethod(row.original);
              setFormOpen(true);
            }}
          >
            <Pencil size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const filtered = useMemo(() => {
    if (!search) return methods;
    const s = search.toLowerCase();
    return methods.filter(
      (m) =>
        getLabel(m.name).toLowerCase().includes(s) ||
        m.name.toLowerCase().includes(s),
    );
  }, [methods, search, getLabel]);

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
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.search")}
                className="pl-8"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {activeMethods.length} {t("common.active")} / {methods.length}{" "}
              {t("common.total")}
            </div>
          </CardContent>
        </Card>

        <DataTable columns={cols} data={filtered} isLoading={isLoading} />
      </div>

      <PaymentMethodForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMethod(null);
        }}
        method={editingMethod}
        orgId={orgId ?? ""}
      />
    </PageShell>
  );
}

const formSchema = z.object({
  name: z
    .string()
    .min(2, "ID must be at least 2 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores allowed",
    ),
  labelEn: z.string().min(1, "English label is required"),
  labelAr: z.string().optional(),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon is required"),
  isCash: z.boolean(),
});

function PaymentMethodForm({
  open,
  onClose,
  method,
  orgId,
}: {
  open: boolean;
  onClose: () => void;
  method: OrgPaymentMethod | null;
  orgId: string;
}) {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      labelEn: "",
      labelAr: "",
      color: PREDEFINED_COLORS[2],
      icon: "money",
      isCash: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (method) {
        const trans = method.label_translations as
          | Record<string, string>
          | undefined;
        form.reset({
          name: method.name,
          labelEn: trans?.en || "",
          labelAr: trans?.ar || "",
          color: method.color?.startsWith("#")
            ? method.color
            : PREDEFINED_COLORS[2],
          icon: method.icon || "money",
          isCash: method.is_cash,
        });
      } else {
        form.reset({
          name: "",
          labelEn: "",
          labelAr: "",
          color: PREDEFINED_COLORS[2],
          icon: "money",
          isCash: false,
        });
      }
    }
  }, [open, method, form]);

  const createMut = useCreatePaymentMethod();
  const updateMut = useUpdatePaymentMethod();

  const isPending = createMut.isPending || updateMut.isPending;
  const isSystem = method
    ? [
        "cash",
        "card",
        "digital_wallet",
        "mixed",
        "talabat_online",
        "talabat_cash",
      ].includes(method.name)
    : false;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      org_id: orgId,
      name: values.name,
      label_translations: {
        en: values.labelEn,
        ar: values.labelAr || values.labelEn,
      },
      color: values.color,
      icon: values.icon,
      is_cash: values.isCash,
      is_active: method ? method.is_active : true,
    };

    if (method) {
      updateMut.mutate(
        { id: method.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["/v1/payment-methods", orgId],
            });
            toast.success(t("common.saved"));
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        },
      );
    } else {
      createMut.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["/v1/payment-methods", orgId],
            });
            toast.success(t("common.saved"));
            onClose();
          },
          onError: (err) => toast.error(getErrorMessage(err)),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {method ? t("common.edit") : t("common.add")}
          </DialogTitle>
          <DialogDescription>
            {method
              ? "Modify your payment method settings below."
              : "Create a new payment method for checkout."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 pt-2"
          >
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
                      disabled={isSystem}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, "_"),
                        )
                      }
                    />
                  </FormControl>
                  {isSystem ? (
                    <FormDescription>
                      System method IDs cannot be changed.
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

            <FormField
              control={form.control}
              name="isCash"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-card">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Accepts Cash</FormLabel>
                    <FormDescription>
                      Is this payment method considered cash for the drawer?
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

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
