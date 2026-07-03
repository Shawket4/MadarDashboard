import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createZone, updateZone } from "@/data/api/generated/api";
import type { DeliveryZone, ZoneInput } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, piastresToEgp } from "@/lib/format";

// Backend persists distances in METERS; the form works in KM for a friendlier UX.
const M_PER_KM = 1000;
const metersToKm = (m: number): number => m / M_PER_KM;
const kmToMeters = (km: number): number => Math.round(km * M_PER_KM);

interface Props {
  branchId: string;
  zone: DeliveryZone | null;
  /** All existing zones in the branch — used to derive smart defaults for new zones. */
  zones: DeliveryZone[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Called after a successful create/update so the list can refresh. */
  onSaved: () => void;
}

export function ZoneDialog({ branchId, zone, zones, open, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const editing = !!zone;
  const [busy, setBusy] = useState(false);

  // Smart defaults for a NEW zone: distance = farthest existing zone + 1km (else 1km),
  // and a sensible "Zone N" name placeholder for the next ring.
  const farthestMeters = useMemo(
    () => zones.reduce((max, z) => Math.max(max, z.max_road_distance_meters), 0),
    [zones],
  );
  const defaultKm = useMemo(
    () => (zones.length > 0 ? metersToKm(farthestMeters) + 1 : 1),
    [zones.length, farthestMeters],
  );
  const nextZoneNumber = zones.length + 1;
  const defaultName = `${t("delivery.zoneWord", "Zone")} ${nextZoneNumber}`;

  const schema = useMemo(
    () =>
      z.object({
        // Name optional — falls back to "Zone N" on submit when left blank.
        name: z.string(),
        max_road_distance_km: z.coerce
          .number<number>()
          .gt(0, t("delivery.errDistancePositive", "Distance must be greater than 0")),
        fee: z.coerce.number<number>().min(0, t("delivery.errFeeNonNeg", "Fee cannot be negative")),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      max_road_distance_km: 1,
      fee: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: zone?.name ?? "",
        max_road_distance_km: zone != null ? metersToKm(zone.max_road_distance_meters) : defaultKm,
        fee: zone != null ? piastresToEgp(zone.fee) : 0,
        is_active: zone?.is_active ?? true,
      });
    }
    // defaultName intentionally excluded — it only seeds the placeholder, not the value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zone, defaultKm]);

  const submit = async (v: Values) => {
    const trimmed = v.name.trim();
    const payload: ZoneInput = {
      branch_id: branchId,
      name: trimmed.length > 0 ? trimmed : defaultName,
      max_road_distance_meters: kmToMeters(v.max_road_distance_km),
      fee: egpToPiastres(v.fee),
      is_active: v.is_active,
    };
    setBusy(true);
    try {
      if (zone) await updateZone(zone.id, payload);
      else await createZone(payload);
      toast.success(editing ? t("delivery.zoneUpdated", "Zone updated") : t("delivery.zoneCreated", "Zone created"));
      onSaved();
      onOpenChange(false);
    } catch (e) {
      // The unique (branch_id, max_road_distance_meters) constraint surfaces as a 409.
      if (e instanceof AxiosError && e.response?.status === 409) {
        toast.error(t("delivery.errZoneDistanceExists", "A zone with this distance already exists"));
      } else {
        toast.error(getErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("delivery.editZone", "Edit zone") : t("delivery.newZone", "New zone")}</DialogTitle>
          <DialogDescription>{t("delivery.zoneSubtitle", "Define a delivery ring by its road-distance limit and flat fee.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("delivery.zoneName", "Zone name")}</FormLabel>
                <FormControl><Input {...field} placeholder={defaultName} /></FormControl>
                <FormDescription>{t("delivery.zoneNameHint", "Leave blank to auto-name it by its order.")}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="max_road_distance_km" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("delivery.maxRoadDistanceKm", "Up to … km")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" min="0" inputMode="decimal" {...field} className="font-mono" />
                  </FormControl>
                  <FormDescription>{t("delivery.maxRoadDistanceHint", "Road distance from the branch.")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="fee" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("delivery.zoneFee", "Delivery fee (EGP)")}</FormLabel>
                  <FormControl><Input type="number" step="any" min="0" inputMode="decimal" {...field} className="font-mono" /></FormControl>
                  <FormDescription>{t("delivery.zoneFeeHint", "Flat fee for deliveries in this ring.")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <FormLabel>{t("common.active", "Active")}</FormLabel>
                  <p className="text-xs text-muted-foreground">{t("delivery.zoneActiveHint", "Inactive zones are not used for quoting deliveries.")}</p>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" loading={busy}>{editing ? t("common.save", "Save") : t("common.create", "Create")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
