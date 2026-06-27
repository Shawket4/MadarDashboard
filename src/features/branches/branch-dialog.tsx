import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { MapPin, Printer } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimezoneSelect } from "@/components/app/timezone-select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createBranch, updateBranch } from "@/data/api/generated/api";
import type { Branch } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateBranches } from "./util";

const numOrNull = (v: number | undefined) => (v === undefined || Number.isNaN(v) ? null : v);

interface Props {
  orgId: string;
  branch: Branch | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function BranchDialog({ orgId, branch, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const editing = !!branch;
  const [busy, setBusy] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        phone: z.string().optional(),
        address: z.string().optional(),
        timezone: z.string().min(1, t("common.requiredField", "This field is required")),
        is_active: z.boolean(),
        printer_brand: z.enum(["none", "star", "epson"]),
        printer_ip: z.string().optional(),
        printer_port: z.coerce.number().optional(),
        latitude: z.coerce.number().optional(),
        longitude: z.coerce.number().optional(),
        geo_radius_meters: z.coerce.number().optional(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phone: "", address: "", timezone: "Africa/Cairo", is_active: true,
      printer_brand: "none", printer_ip: "", printer_port: 9100,
      latitude: undefined, longitude: undefined, geo_radius_meters: 200,
    },
  });
  const printerBrand = form.watch("printer_brand");

  useEffect(() => {
    if (open) {
      form.reset({
        name: branch?.name ?? "",
        phone: branch?.phone ?? "",
        address: branch?.address ?? "",
        timezone: branch?.timezone ?? "Africa/Cairo",
        is_active: branch?.is_active ?? true,
        printer_brand: (branch?.printer_brand as "star" | "epson") ?? "none",
        printer_ip: branch?.printer_ip ?? "",
        printer_port: branch?.printer_port ?? 9100,
        latitude: branch?.latitude ?? undefined,
        longitude: branch?.longitude ?? undefined,
        geo_radius_meters: branch?.geo_radius_meters ?? 200,
      });
    }
  }, [open, branch, form]);

  const submit = async (v: Values) => {
    const hasPrinter = v.printer_brand !== "none";
    const base = {
      name: v.name,
      address: v.address || null,
      phone: v.phone || null,
      timezone: v.timezone,
      printer_brand: hasPrinter ? (v.printer_brand as "star" | "epson") : null,
      printer_ip: hasPrinter ? (v.printer_ip || null) : null,
      printer_port: hasPrinter ? numOrNull(v.printer_port) : null,
      latitude: numOrNull(v.latitude),
      longitude: numOrNull(v.longitude),
      geo_radius_meters: numOrNull(v.geo_radius_meters),
    };
    setBusy(true);
    try {
      if (branch) await updateBranch(branch.id, { ...base, is_active: v.is_active });
      else await createBranch({ org_id: orgId, ...base });
      void invalidateBranches();
      toast.success(editing ? t("branches.updatedToast", "Branch updated") : t("branches.createdToast", "Branch created"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("branches.editTitle", "Edit Branch") : t("branches.newTitle", "New Branch")}</DialogTitle>
          <DialogDescription>{t("branches.subtitle", "Manage your branch locations and printer config")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("branches.branchName", "Branch Name")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{t("branches.phone", "Phone")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="timezone" render={({ field }) => (
                <FormItem><FormLabel>{t("branches.timezone", "Timezone")}</FormLabel><FormControl><TimezoneSelect value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>{t("branches.address", "Address")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2"><Printer className="size-3.5 text-muted-foreground" /><p className="text-sm font-semibold">{t("branches.printerConfig", "Printer Configuration")}</p></div>
              <FormField control={form.control} name="printer_brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branches.printerBrand", "Printer Model")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t("branches.brands.none", "None (no printer)")}</SelectItem>
                      <SelectItem value="star">{t("branches.brands.star", "Star TSP100")}</SelectItem>
                      <SelectItem value="epson">{t("branches.brands.epson", "Epson TM-T88")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {printerBrand !== "none" ? (
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="printer_ip" render={({ field }) => (
                    <FormItem><FormLabel>{t("branches.printerIp", "Printer IP")}</FormLabel><FormControl><Input {...field} value={field.value ?? ""} placeholder="192.168.1.100" className="font-mono" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="printer_port" render={({ field }) => (
                    <FormItem><FormLabel>{t("branches.printerPort", "Port")}</FormLabel><FormControl><Input type="number" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /><p className="text-sm font-semibold">{t("branches.location", "Location (geofencing)")}</p></div>
              <p className="text-xs text-muted-foreground">{t("branches.geoHint", "Optional. Used to auto-resolve which branch a device is at.")}</p>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="latitude" render={({ field }) => (
                  <FormItem><FormLabel>{t("branches.latitude", "Latitude")}</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} className="font-mono" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="longitude" render={({ field }) => (
                  <FormItem><FormLabel>{t("branches.longitude", "Longitude")}</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} className="font-mono" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="geo_radius_meters" render={({ field }) => (
                  <FormItem><FormLabel>{t("branches.geoRadius", "Radius (m)")}</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} className="font-mono" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            {editing ? (
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <div><FormLabel>{t("common.active", "Active")}</FormLabel><p className="text-xs text-muted-foreground">{t("branches.activeHint", "Inactive branches are hidden from the POS.")}</p></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" loading={busy}>{editing ? t("common.save", "Save") : t("common.create", "Create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
