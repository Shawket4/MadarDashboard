import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Bike, MapPin, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Page } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { TimePicker } from "@/components/app/time-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { putBranchSettings, useGetBranchSettings, useListDiscounts } from "@/data/api/generated/api";
import type { BranchSettingsInput } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateBranchSettings } from "./util";
import { egpToPiastres, fmtMoney, piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";

const NO_DISCOUNT = "none";

/** Backend `NaiveTime` is `HH:MM:SS`; the TimePicker uses the same string (or null). */
const timeOrNull = (v: string | null | undefined): string | null => v || null;

const numOrNull = (v: number | null | undefined): number | null =>
  v === null || v === undefined || Number.isNaN(v) ? null : v;

// ── Branch settings card ────────────────────────────────────────────────────────

function BranchSettingsCard({ branchId }: { branchId: string }) {
  const { t, i18n } = useTranslation();
  const settings = useGetBranchSettings({ branch_id: branchId });
  const orgId = useOrgId();
  const discounts = useListDiscounts({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const [busy, setBusy] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        in_mall_enabled: z.boolean(),
        outside_enabled: z.boolean(),
        in_mall_open_time: z.string().nullable(),
        in_mall_close_time: z.string().nullable(),
        outside_open_time: z.string().nullable(),
        outside_close_time: z.string().nullable(),
        in_mall_fee: z.coerce.number().min(0, t("delivery.errFeeNonNeg", "Fee cannot be negative")),
        prep_time_minutes: z.coerce.number().int().min(0, t("delivery.errPrepNonNeg", "Prep time cannot be negative")),
        max_road_distance_meters: z.coerce
          .number()
          .gt(0, t("delivery.errDistancePositive", "Distance must be greater than 0"))
          .optional(),
        in_mall_discount_id: z.string().nullable(),
        outside_discount_id: z.string().nullable(),
        otp_required: z.boolean(),
        in_mall_require_location: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      in_mall_enabled: false,
      outside_enabled: false,
      in_mall_open_time: null,
      in_mall_close_time: null,
      outside_open_time: null,
      outside_close_time: null,
      in_mall_fee: 0,
      prep_time_minutes: 0,
      max_road_distance_meters: undefined,
      in_mall_discount_id: null,
      outside_discount_id: null,
      otp_required: true,
      in_mall_require_location: true,
    },
  });

  useEffect(() => {
    const s = settings.data;
    if (s) {
      form.reset({
        in_mall_enabled: s.in_mall_enabled,
        outside_enabled: s.outside_enabled,
        in_mall_open_time: s.in_mall_open_time ?? null,
        in_mall_close_time: s.in_mall_close_time ?? null,
        outside_open_time: s.outside_open_time ?? null,
        outside_close_time: s.outside_close_time ?? null,
        in_mall_fee: piastresToEgp(s.in_mall_fee),
        prep_time_minutes: s.prep_time_minutes,
        max_road_distance_meters: s.max_road_distance_meters ?? undefined,
        in_mall_discount_id: s.in_mall_discount_id ?? null,
        outside_discount_id: s.outside_discount_id ?? null,
        otp_required: s.otp_required,
        in_mall_require_location: s.in_mall_require_location,
      });
    }
  }, [settings.data, form]);

  const inMallEnabled = form.watch("in_mall_enabled");
  const outsideEnabled = form.watch("outside_enabled");

  const submit = async (v: Values) => {
    const payload: BranchSettingsInput = {
      branch_id: branchId,
      in_mall_enabled: v.in_mall_enabled,
      outside_enabled: v.outside_enabled,
      in_mall_open_time: timeOrNull(v.in_mall_open_time),
      in_mall_close_time: timeOrNull(v.in_mall_close_time),
      outside_open_time: timeOrNull(v.outside_open_time),
      outside_close_time: timeOrNull(v.outside_close_time),
      in_mall_fee: egpToPiastres(v.in_mall_fee),
      prep_time_minutes: v.prep_time_minutes,
      max_road_distance_meters: numOrNull(v.max_road_distance_meters),
      in_mall_discount_id: v.in_mall_discount_id,
      outside_discount_id: v.outside_discount_id,
      otp_required: v.otp_required,
      in_mall_require_location: v.in_mall_require_location,
    };
    setBusy(true);
    try {
      await putBranchSettings(payload);
      toast.success(t("delivery.branchSettingsSaved", "Branch delivery settings saved"));
      void invalidateBranchSettings();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const discountOptions = discounts.data ?? [];
  const valueLabel = (d: (typeof discountOptions)[number]) =>
    d.dtype === "percentage" ? `${d.value}%` : fmtMoney(d.value);
  const discountField = (name: "in_mall_discount_id" | "outside_discount_id") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("delivery.channelDiscount", "Discount")}</FormLabel>
          <Select
            value={field.value ?? NO_DISCOUNT}
            onValueChange={(v) => field.onChange(v === NO_DISCOUNT ? null : v)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t("delivery.noDiscount", "No discount")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NO_DISCOUNT}>{t("delivery.noDiscount", "No discount")}</SelectItem>
              {discountOptions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {getTranslatedName(d, i18n.language)} · {valueLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            {t("delivery.channelDiscountHint", "Applied to the item subtotal at checkout — the delivery fee is always charged in full.")}
          </FormDescription>
        </FormItem>
      )}
    />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("delivery.branchSettingsTitle", "Branch settings")}</CardTitle>
        <CardDescription>
          {t("delivery.branchSettingsSubtitle", "Enable delivery channels, set daily windows, fees, and operating limits for this branch.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
            {/* In-mall channel */}
            <div className="space-y-3 rounded-lg border p-4">
              <FormField control={form.control} name="in_mall_enabled" render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="size-4 text-muted-foreground" />
                    <div>
                      <FormLabel>{t("delivery.inMall", "In-mall delivery")}</FormLabel>
                      <p className="text-xs text-muted-foreground">{t("delivery.inMallHint", "Orders delivered within the mall.")}</p>
                    </div>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              {inMallEnabled ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="in_mall_open_time" render={({ field }) => (
                      <FormItem><FormLabel>{t("delivery.openTime", "Opens")}</FormLabel><FormControl><TimePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="in_mall_close_time" render={({ field }) => (
                      <FormItem><FormLabel>{t("delivery.closeTime", "Closes")}</FormLabel><FormControl><TimePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="in_mall_fee" render={({ field }) => (
                    <FormItem><FormLabel>{t("delivery.inMallFee", "In-mall fee (EGP)")}</FormLabel><FormControl><Input type="number" step="any" min="0" {...field} className="font-mono" /></FormControl><FormMessage /></FormItem>
                  )} />
                  {discountField("in_mall_discount_id")}
                  <FormField control={form.control} name="in_mall_require_location" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-md border border-dashed p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-muted-foreground" />
                        <div>
                          <FormLabel>{t("delivery.inMallRequireLocation", "Require GPS location")}</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t(
                              "delivery.inMallRequireLocationHint",
                              "Customers must share their device location to confirm they're at the branch before ordering. Turn off if indoor GPS is unreliable (shop, floor, and unit are always required).",
                            )}
                          </p>
                        </div>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </>
              ) : null}
            </div>

            {/* Outside channel */}
            <div className="space-y-3 rounded-lg border p-4">
              <FormField control={form.control} name="outside_enabled" render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bike className="size-4 text-muted-foreground" />
                    <div>
                      <FormLabel>{t("delivery.outside", "Outside delivery")}</FormLabel>
                      <p className="text-xs text-muted-foreground">{t("delivery.outsideHint", "Road-distance delivery to customers outside the mall.")}</p>
                    </div>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              {outsideEnabled ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="outside_open_time" render={({ field }) => (
                      <FormItem><FormLabel>{t("delivery.openTime", "Opens")}</FormLabel><FormControl><TimePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="outside_close_time" render={({ field }) => (
                      <FormItem><FormLabel>{t("delivery.closeTime", "Closes")}</FormLabel><FormControl><TimePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="max_road_distance_meters" render={({ field }) => (
                    <FormItem><FormLabel>{t("delivery.maxRoadDistance", "Max road distance (meters)")}</FormLabel><FormControl><Input type="number" step="1" min="0" {...field} value={field.value ?? ""} className="font-mono" /></FormControl><FormMessage /></FormItem>
                  )} />
                  {discountField("outside_discount_id")}
                </>
              ) : null}
            </div>

            {/* Customer verification */}
            <div className="rounded-lg border p-4">
              <FormField control={form.control} name="otp_required" render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    <div>
                      <FormLabel>{t("delivery.otpRequired", "Require OTP verification")}</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "delivery.otpRequiredHint",
                          "Customers verify their phone with a one-time code before ordering. Turn off to let them order without OTP (faster, but unverified).",
                        )}
                      </p>
                    </div>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="prep_time_minutes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("delivery.prepTime", "Prep time (minutes)")}</FormLabel>
                <FormControl><Input type="number" step="1" min="0" {...field} className="font-mono w-40" /></FormControl>
                <FormDescription>{t("delivery.prepTimeHint", "Added to the delivery ETA quoted to the customer.")}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end">
              <Button type="submit" loading={busy} disabled={settings.isLoading}>{t("common.save", "Save")}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function DeliverySettingsPage() {
  const { t } = useTranslation();
  const scope = useScope();
  const branchId = scope.branchId;

  return (
    <Page>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{t("delivery.settingsTitle", "Delivery settings")}</h1>
        <p className="text-sm text-muted-foreground">{t("delivery.settingsSubtitle", "Configure per-branch delivery channels, windows, and fees.")}</p>
      </div>
      {branchId ? (
        <BranchSettingsCard key={branchId} branchId={branchId} />
      ) : (
        <EmptyState
          icon={Store}
          title={t("delivery.pickBranch", "Select a branch in the top bar to manage its delivery settings")}
        />
      )}
    </Page>
  );
}
