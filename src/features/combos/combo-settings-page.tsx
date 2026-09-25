/**
 * Settings › Menu › Combos and deals.
 *
 * The owner's answer (§11.1): where combos are sold is ORG-WIDE, one switch
 * per channel — POS, QR table menu, online ordering, delivery apps — and a
 * branch may override any of them. There is no per-combo channel switch.
 * Deals follow the same switches (§11.2).
 *
 * The minimum margin (C11) is one org-wide number; blank means no warning.
 * It only ever warns in the combo editor; it never blocks a save.
 */
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Globe, QrCode, Store, Truck, type LucideIcon } from "lucide-react";
import { z } from "zod";

import { ErrorState } from "@/components/app/empty-state";
import { Restricted } from "@/components/app/restricted";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useListBranches } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useOrgId } from "@/hooks/use-org-id";
import { getTranslatedName } from "@/lib/translation";
import { PaneHeader } from "@/features/settings/pane-header";

import { deleteBranchChannels, putBranchChannels, saveComboSettings, useComboSettings } from "./api";
import { ComboCap } from "./caps";
import { COMBO_CHANNELS, type ChannelOverride, type ComboChannel, type ComboSettings } from "./contract";
import { invalidateCombos, percentToRate, rateToPercent } from "./util";

export const CHANNEL_META: Record<ComboChannel, { icon: LucideIcon; key: string; label: string; hintKey: string; hint: string }> = {
  pos: { icon: Store, key: "combos.channels.pos", label: "POS", hintKey: "combos.channels.posHint", hint: "The till: tellers and waiters." },
  qr: { icon: QrCode, key: "combos.channels.qr", label: "QR table menu", hintKey: "combos.channels.qrHint", hint: "Guests ordering from the code on their table." },
  online: { icon: Globe, key: "combos.channels.online", label: "Online ordering", hintKey: "combos.channels.onlineHint", hint: "Your ordering page: delivery and pickup." },
  delivery: { icon: Truck, key: "combos.channels.delivery", label: "Delivery apps", hintKey: "combos.channels.deliveryHint", hint: "Aggregator menus, when they are connected." },
};

export const settingsSchema = z.object({
  min_margin: z.string().refine((v) => {
    if (v.trim() === "") return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n < 100;
  }, "combos.errors.percent"),
  sell: z.object({ pos: z.boolean(), qr: z.boolean(), online: z.boolean(), delivery: z.boolean() }),
});
export type SettingsValues = z.infer<typeof settingsSchema>;

const fromSettings = (s: ComboSettings): SettingsValues => ({ min_margin: rateToPercent(s.min_margin), sell: { ...s.sell } });

type Tri = "inherit" | "on" | "off";
const triOf = (v: boolean | null | undefined): Tri => (v === true ? "on" : v === false ? "off" : "inherit");
const boolOf = (v: Tri): boolean | null => (v === "on" ? true : v === "off" ? false : null);

export function ComboSettingsPage() {
  const { t, i18n } = useTranslation();
  const authz = useAuthz();
  const canRead = authz.canAny(Cap.orgSettingsRead, ComboCap.menuCombosEdit);
  const canEdit = authz.can(ComboCap.menuCombosEdit);
  const orgId = useOrgId() ?? "";

  const q = useComboSettings({ enabled: canRead && !!orgId });
  const branchesQ = useListBranches({ org_id: orgId }, { query: { enabled: canRead && !!orgId } });
  const branches = useMemo(
    () => (branchesQ.data ?? []).map((b) => ({ id: b.id, name: getTranslatedName(b, i18n.language) })),
    [branchesQ.data, i18n.language],
  );

  const form = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), defaultValues: { min_margin: "", sell: { pos: true, qr: true, online: true, delivery: true } } });
  useEffect(() => {
    if (q.data) form.reset(fromSettings(q.data));
  }, [q.data, form]);
  const sell = form.watch("sell");
  const [savingBranch, setSavingBranch] = useState<string | null>(null);

  const title = t("combos.settings.title", "Combos and deals");
  if (authz.ready && !canRead) {
    return <Restricted title={title} who={t("combos.settings.noAccess", "Your account can't open these settings. The owner can give you access.")} />;
  }
  if (q.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <ErrorState
        title={t("combos.settings.loadFailed", "Couldn't load the combo settings")}
        message={q.error ? getErrorMessage(q.error) : undefined}
        onRetry={() => void q.refetch()}
        retrying={q.isFetching}
      />
    );
  }
  const settings = q.data;

  const submit = async (v: SettingsValues) => {
    try {
      await saveComboSettings({ min_margin: percentToRate(v.min_margin), sell: v.sell });
      toast.success(t("combos.settings.saved", "Combo settings saved"));
      void invalidateCombos();
      await q.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const overrideOf = (branchId: string): ChannelOverride => settings.branch_overrides.find((o) => o.branch_id === branchId)?.sell ?? {};

  const setBranch = async (branchId: string, channel: ComboChannel, v: Tri) => {
    const next: ChannelOverride = { ...overrideOf(branchId), [channel]: boolOf(v) };
    const any = COMBO_CHANNELS.some((c) => next[c] === true || next[c] === false);
    setSavingBranch(branchId);
    try {
      if (any) await putBranchChannels(branchId, next);
      else await deleteBranchChannels(branchId);
      toast.success(t("combos.settings.branchSaved", "Branch exception saved"));
      void invalidateCombos();
      await q.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSavingBranch(null);
    }
  };

  const marginError = form.formState.errors.min_margin?.message;
  // A branch follows what is SAVED for the org, not what is being typed above.
  const orgOn = (c: ComboChannel) => settings.sell[c];

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
      <PaneHeader
        title={title}
        description={t(
          "combos.settings.subtitle",
          "Where combos and deals are sold, and the margin below which the combo editor warns you.",
        )}
      />
      {!canEdit ? (
        <p className="rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
          {t("combos.settings.readOnly", "You can see these settings, but only someone who can edit combos can change them.")}
        </p>
      ) : null}

      <fieldset disabled={!canEdit} className="min-w-0 space-y-4">
        <Card>
          <CardContent className="space-y-1 p-5">
            <p className="text-sm font-bold">{t("combos.settings.channelsTitle", "Sold on")}</p>
            <p className="pb-2 text-xs text-muted-foreground">
              {t("combos.settings.channelsHint", "One switch per channel for every combo and deal. A branch can differ below.")}
            </p>
            {COMBO_CHANNELS.map((c) => {
              const m = CHANNEL_META[c];
              return (
                <div key={c} className="flex items-center justify-between gap-4 border-t py-3 first:border-t-0">
                  <div className="flex min-w-0 items-start gap-3">
                    <m.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <Label htmlFor={`sell-${c}`} className="text-sm font-medium">
                        {t(m.key, m.label)}
                      </Label>
                      <p className="text-xs text-muted-foreground">{t(m.hintKey, m.hint)}</p>
                    </div>
                  </div>
                  <Switch
                    id={`sell-${c}`}
                    checked={sell[c]}
                    onCheckedChange={(v) => form.setValue(`sell.${c}`, v, { shouldDirty: true })}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5">
            <Label htmlFor="combo-min-margin" className="text-sm font-bold">
              {t("combos.settings.minMargin", "Minimum margin")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="combo-min-margin"
                type="number"
                inputMode="decimal"
                min={0}
                max={99}
                step={1}
                dir="ltr"
                className="w-28 font-mono"
                placeholder={t("combos.settings.noWarning", "No warning")}
                aria-invalid={!!marginError}
                aria-describedby="combo-min-margin-hint"
                {...form.register("min_margin")}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            {marginError ? (
              <p role="alert" className="text-xs text-destructive">
                {t(marginError, "Enter a percentage from 0 to 99.")}
              </p>
            ) : (
              <p id="combo-min-margin-hint" className="text-xs text-muted-foreground">
                {t(
                  "combos.settings.minMarginHint",
                  "The combo editor warns when a combo's margin falls below this. Leave it blank for no warning. It never stops a save.",
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </fieldset>

      {canEdit ? (
        <div className="flex items-center gap-2">
          <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty || form.formState.isSubmitting}>
            {t("common.save", "Save")}
          </Button>
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <p className="text-sm font-bold">{t("combos.settings.branchesTitle", "Branch exceptions")}</p>
            <p className="text-xs text-muted-foreground">
              {t("combos.settings.branchesHint", "A branch follows the switches above unless you set a channel on or off here. Changes save at once.")}
            </p>
          </div>
          {branches.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("combos.settings.noBranches", "No branches yet.")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="text-start text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <th scope="col" className="py-2 pe-3 text-start">
                      {t("combos.settings.branch", "Branch")}
                    </th>
                    {COMBO_CHANNELS.map((c) => (
                      <th key={c} scope="col" className="px-1 py-2 text-start">
                        {t(CHANNEL_META[c].key, CHANNEL_META[c].label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => {
                    const o = overrideOf(b.id);
                    return (
                      <tr key={b.id} className="border-t" aria-busy={savingBranch === b.id}>
                        <th scope="row" className="py-2 pe-3 text-start font-medium">
                          {b.name}
                        </th>
                        {COMBO_CHANNELS.map((c) => (
                          <td key={c} className="px-1 py-2">
                            <Select
                              value={triOf(o[c])}
                              onValueChange={(v) => void setBranch(b.id, c, v as Tri)}
                              disabled={!canEdit || savingBranch === b.id}
                            >
                              <SelectTrigger
                                className="h-8 w-full min-w-28"
                                aria-label={t("combos.settings.branchChannel", {
                                  defaultValue: "{{branch}}: {{channel}}",
                                  branch: b.name,
                                  channel: t(CHANNEL_META[c].key, CHANNEL_META[c].label),
                                })}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inherit">
                                  {orgOn(c) ? t("combos.settings.followOn", "Follow (on)") : t("combos.settings.followOff", "Follow (off)")}
                                </SelectItem>
                                <SelectItem value="on">{t("combos.settings.on", "On here")}</SelectItem>
                                <SelectItem value="off">{t("combos.settings.off", "Off here")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
