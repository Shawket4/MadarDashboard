import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createStation, updateStation } from "@/data/api/generated/api";
import type { KitchenStation } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateStations } from "./util";

interface Props {
  branchId: string;
  station: KitchenStation | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const numOrNull = (v: number | undefined) => (v == null || Number.isNaN(v) ? null : v);

export function StationDialog({ branchId, station, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const editing = !!station;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        printer_brand: z.enum(["none", "star", "epson"]),
        printer_ip: z.string().optional(),
        printer_port: z.coerce.number().optional(),
        is_default: z.boolean(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", printer_brand: "none", printer_ip: "", printer_port: 9100, is_default: false, is_active: true },
  });
  const printerBrand = form.watch("printer_brand");

  useEffect(() => {
    if (open) {
      form.reset({
        name: station?.name ?? "",
        printer_brand: (station?.printer_brand as "star" | "epson") ?? "none",
        printer_ip: station?.printer_ip ?? "",
        printer_port: station?.printer_port ?? 9100,
        is_default: station?.is_default ?? false,
        is_active: station?.is_active ?? true,
      });
    }
  }, [open, station]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (v: Values) => {
    setBusy(true);
    const hasPrinter = v.printer_brand !== "none";
    const printer = {
      printer_brand: hasPrinter ? (v.printer_brand as "star" | "epson") : null,
      printer_ip: hasPrinter ? (v.printer_ip || null) : null,
      printer_port: hasPrinter ? numOrNull(v.printer_port) : null,
    };
    try {
      if (station) {
        await updateStation(station.id, { name: v.name.trim(), is_default: v.is_default, is_active: v.is_active, ...printer });
        toast.success(t("kitchen.stationUpdated", "Station updated"));
      } else {
        await createStation({ branch_id: branchId, name: v.name.trim(), is_default: v.is_default, is_active: v.is_active, ...printer });
        toast.success(t("kitchen.stationCreated", "Station created"));
      }
      void invalidateStations();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("kitchen.editStation", "Edit station") : t("kitchen.newStation", "New station")}</DialogTitle>
          <DialogDescription>{t("kitchen.stationSubtitle", "A kitchen area (Grill, Bar…) that shows and prints its routed items.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("kitchen.stationName", "Name")}</FormLabel>
                <FormControl><Input placeholder="Grill" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Printer className="size-3.5 text-muted-foreground" />
                <p className="text-sm font-semibold">{t("branches.printerConfig", "Printer Configuration")}</p>
              </div>
              <FormField control={form.control} name="printer_brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branches.printerBrand", "Brand")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t("branches.brands.none", "None (no printer)")}</SelectItem>
                      <SelectItem value="star">Star</SelectItem>
                      <SelectItem value="epson">Epson</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              {printerBrand !== "none" ? (
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="printer_ip" render={({ field }) => (
                    <FormItem><FormLabel>{t("branches.printerIp", "IP address")}</FormLabel><FormControl><Input placeholder="192.168.1.50" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="printer_port" render={({ field }) => (
                    <FormItem><FormLabel>{t("branches.printerPort", "Port")}</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              ) : null}
            </div>

            <FormField control={form.control} name="is_default" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>{t("kitchen.defaultStation", "Default station")}</FormLabel>
                  <FormDescription>{t("kitchen.defaultStationHint", "Catches items that aren't routed anywhere else.")}</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel>{t("common.active", "Active")}</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={busy}>{busy ? t("common.saving", "Saving…") : t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
