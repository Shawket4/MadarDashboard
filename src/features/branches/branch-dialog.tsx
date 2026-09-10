import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { MapPin, Printer } from "lucide-react";

import { useAuthStore } from "@/data/stores/auth.store";
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

import { MAX_PERCENT, fractionToPercent, percentToFraction } from "@/features/orgs/tax-rate";
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
        printer_port: z.coerce.number<number>().optional(),
        latitude: z.coerce.number<number>().optional(),
        longitude: z.coerce.number<number>().optional(),
        geo_radius_meters: z.coerce.number<number>().optional(),
        // Off = inherit the organisation. The fields below only mean anything
        // when this is on, and are sent as explicit nulls when it is off — a
        // branch must be able to go BACK to inheriting, which is why the API
        // distinguishes "absent" from "null".
        tax_override: z.boolean(),
        tax_rate: z.coerce.number<number>().min(0).max(MAX_PERCENT).optional(),
        tax_inclusive: z.boolean(),
        service_charge_rate: z.coerce.number<number>().min(0).max(MAX_PERCENT).optional(),
        service_charge_taxable: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phone: "", address: "", timezone: "Africa/Cairo", is_active: true,
      printer_brand: "none", printer_ip: "", printer_port: 9100,
      latitude: undefined, longitude: undefined, geo_radius_meters: 200,
      tax_override: false, tax_rate: 0, tax_inclusive: false,
      service_charge_rate: 0, service_charge_taxable: true,
    },
  });
  const printerBrand = form.watch("printer_brand");
  const taxOverride = form.watch("tax_override");
  const isSuperAdmin = useAuthStore((s) => s.user?.role) === "super_admin";

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
        // Any override present means this branch has opted out of the org's
        // policy; the switch reflects that rather than being stored separately.
        tax_override:
          branch?.tax_rate != null ||
          branch?.tax_inclusive != null ||
          branch?.service_charge_rate != null ||
          branch?.service_charge_taxable != null,
        tax_rate: fractionToPercent(branch?.tax_rate),
        tax_inclusive: branch?.tax_inclusive ?? false,
        service_charge_rate: fractionToPercent(branch?.service_charge_rate),
        service_charge_taxable: branch?.service_charge_taxable ?? true,
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
      // Explicit nulls when the override is off: that is what returns the
      // branch to inheriting, and it is why these are sent on every save
      // rather than only when set.
      tax_rate: v.tax_override ? percentToFraction(v.tax_rate) : null,
      tax_inclusive: v.tax_override ? v.tax_inclusive : null,
      service_charge_rate: v.tax_override ? percentToFraction(v.service_charge_rate) : null,
      service_charge_taxable: v.tax_override ? v.service_charge_taxable : null,
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

            {/* Tax is not the shop's to choose.
                A rate is a legal fact about a jurisdiction and a registration,
                not a preference — so like the organisation's own tax settings,
                this is SUPER ADMIN ONLY. `/orgs` was already gated; this was
                not, which left the branch override as a way for an org admin to
                set the very rate the org page keeps out of their hands.

                Off, the branch follows its organisation — the right default and
                the one almost every branch wants. It exists at all because an
                org can trade across jurisdictions, and a branch in a free zone
                or another country cannot be made to charge its head office's
                rate. */}
            {isSuperAdmin ? (
              <>
              <FormField control={form.control} name="tax_override" render={({ field }) => (
                <FormItem className="rounded-lg bg-muted p-3">
                  <div className="flex items-center justify-between gap-4">
                    <FormLabel className="font-normal">
                      {t("branches.taxOverride", "This branch taxes differently")}
                    </FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "branches.taxOverrideHint",
                      "Off, it follows the organisation's tax settings and changes to them apply here automatically.",
                    )}
                  </p>
                </FormItem>
              )} />

              {taxOverride ? (
                <div className="space-y-4 rounded-lg border border-border/70 p-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="tax_rate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orgs.taxRate", "Tax rate (%)")}</FormLabel>
                        <FormControl><Input type="number" step="0.1" min="0" max={MAX_PERCENT} {...field} value={field.value ?? ""} className="font-mono" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="service_charge_rate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orgs.serviceCharge", "Service charge (%)")}</FormLabel>
                        <FormControl><Input type="number" step="0.1" min="0" max={MAX_PERCENT} {...field} value={field.value ?? ""} className="font-mono" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="tax_inclusive" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <FormLabel className="font-normal">{t("orgs.taxInclusive", "Menu prices include tax")}</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="service_charge_taxable" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <FormLabel className="font-normal">{t("orgs.serviceChargeTaxable", "Tax the service charge")}</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              ) : null}
              </>
            ) : null}

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
