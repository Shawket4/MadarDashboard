import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useVoidOrder, getListOrdersQueryKey } from "@/shared/api/generated/api";
import { voidOrderSchema, type VoidOrderValues } from "@/entities/order/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtMoney } from "@/shared/lib/format";
import type { Order } from "@/shared/api/generated/models/order";

export function VoidDialog({ open, onClose, order }: { open: boolean; onClose: () => void; order: Order | null }) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const form = useForm<VoidOrderValues>({
    resolver: zodResolver(voidOrderSchema),
    defaultValues: { reason: "customer_request", restore_inventory: true },
  });

  const voidOrder = useVoidOrder({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast.success(t("orders.voidedToast"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("orders.voidOrder")}</DialogTitle>
          <DialogDescription>
            {t("orders.orderNumber", { n: order?.order_number })} · {fmtMoney(order?.total_amount)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => voidOrder.mutate({ orderId: order!.id, data: v }))}>
            <DialogBody>
              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("orders.voidConfirm")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="customer_request">{t("orders.voidReasons.customer_request")}</SelectItem>
                      <SelectItem value="wrong_order">{t("orders.voidReasons.wrong_order")}</SelectItem>
                      <SelectItem value="quality_issue">{t("orders.voidReasons.quality_issue")}</SelectItem>
                      <SelectItem value="other">{t("orders.voidReasons.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="restore_inventory" render={({ field }) => (
                <FormItem className="flex items-center gap-2 rounded-lg bg-muted p-3 !space-y-0">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!m-0 cursor-pointer">{t("orders.restoreInventory")}</FormLabel>
                </FormItem>
              )} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
              <Button type="submit" variant="destructive" loading={voidOrder.isPending}><Ban /> {t("orders.voidOrder")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

