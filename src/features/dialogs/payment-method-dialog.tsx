import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Banknote, Check, CreditCard, Gift, Landmark, Link as LinkIcon, PieChart, QrCode, Receipt, Smartphone, Star, Store, Truck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
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
import { useCreatePaymentMethod, useUpdatePaymentMethod, getListPaymentMethodsQueryKey } from "@/shared/api/generated/api";
import { getErrorMessage } from "@/shared/api/errors";
import type { OrgPaymentMethod } from "@/shared/api/generated/models";
import { paymentMethodSchema, type PaymentMethodValues } from "@/entities/payment-method/schemas";

export const PREDEFINED_COLORS = [
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

export const ICONS = [
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

export function PaymentMethodDialog({
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

