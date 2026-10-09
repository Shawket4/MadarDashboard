/**
 * Create or edit a deal (§7.4): its name, kind and numbers, the items it
 * counts (and, for buy X get Y, optionally a different list the free item
 * comes from), a cap per order, when it runs, which branches run it, and
 * whether it's on.
 *
 * The till suggests a deal and the teller applies it (C8); QR and online
 * checkout apply the best one automatically (§11.2). Channels follow the
 * org's combo and deal switches in Settings; there is none per deal.
 */
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { SegmentedControl } from "@/components/app/segmented-control";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/data/api/errors";
import { createDeal, deleteDealBranch, putDealBranch, updateDeal } from "@/features/combos/api";
import type { DealRule } from "@/features/combos/types";
import type { MenuOptions } from "@/features/combos/use-menu-options";
import { invalidateCombos, moneyIn } from "@/features/combos/util";
import { WindowsEditor, type WindowErrors } from "@/features/combos/windows-editor";

import {
  EMPTY_DEAL,
  branchChanges,
  dealFromWire,
  dealSchema,
  dealToWire,
  type BranchState,
  type DealFormInput,
  type DealFormValues,
} from "./form-schema";
import { PoolEditor } from "./pool-editor";
import { dealRuleText } from "./util";

/** The server's field names, in the dialog's words (DEAL_INVALID {field}). */
const FIELD_KEYS: Record<string, [string, string]> = {
  name: ["deals.fields.name", "Name"],
  qty: ["deals.fields.qty", "Quantity"],
  price: ["deals.fields.price", "Price"],
  get_qty: ["deals.fields.getQty", "Free or discounted items"],
  get_percent: ["deals.fields.getPercent", "Percent off"],
  max_per_order: ["deals.fields.maxPerOrder", "Most times per order"],
  pool: ["deals.fields.pool", "Items that count"],
  reward_pool: ["deals.fields.rewardPool", "Reward items"],
  windows: ["deals.fields.windows", "Availability"],
};

const errMsg = (e: unknown): string | undefined => (e as { message?: string } | undefined)?.message;

export function DealDialog({
  deal,
  open,
  onOpenChange,
  menu,
  canEdit,
  nextSort,
}: {
  deal: DealRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu: MenuOptions;
  canEdit: boolean;
  nextSort: number;
}) {
  const { t } = useTranslation();
  const form = useForm<DealFormInput, unknown, DealFormValues>({ resolver: zodResolver(dealSchema), defaultValues: EMPTY_DEAL });
  const [saving, setSaving] = useState(false);
  const initialBranches = useMemo(() => (deal ? dealFromWire(deal).branches : {}), [deal]);

  useEffect(() => {
    if (open) form.reset(deal ? dealFromWire(deal) : EMPTY_DEAL);
  }, [open, deal, form]);

  const v = useWatch({ control: form.control }) as DealFormInput;
  const errs = form.formState.errors;
  const ro = !canEdit;
  const nFor = v.kind === "n_for_price";
  const preview = dealRuleText(t, {
    kind: v.kind ?? "n_for_price",
    qty: Number(v.qty) || 0,
    price: moneyIn(v.price ?? "") ?? 0,
    get_qty: Number(v.get_qty) || 1,
    get_percent: Number(v.get_percent) || 100,
  });

  const submit = async (values: DealFormValues) => {
    setSaving(true);
    try {
      const body = dealToWire(values, deal?.sort ?? nextSort);
      const saved = deal ? await updateDeal(deal.id, body) : await createDeal(body);
      const { put, clear } = branchChanges(initialBranches, values.branches);
      for (const p of put) await putDealBranch(saved.id, p.branch_id, p.is_active);
      for (const b of clear) await deleteDealBranch(saved.id, b);
      toast.success(deal ? t("common.savedChanges", "Changes saved") : t("deals.created", "Deal created"));
      void invalidateCombos();
      onOpenChange(false);
    } catch (e) {
      // DEAL_INVALID {field} names the field in the dialog's own words.
      toast.error(getErrorMessage(e, { fieldLabel: (f) => (FIELD_KEYS[f] ? t(FIELD_KEYS[f][0], FIELD_KEYS[f][1]) : f) }));
    } finally {
      setSaving(false);
    }
  };

  const entryErrors = (key: "pool" | "reward_pool", n: number) =>
    Array.from({ length: n }, (_, i) => errMsg((errs[key] as unknown as Record<number, { target?: unknown }> | undefined)?.[i]?.target));
  const windowErrors = (errs.windows as unknown as Record<string, unknown>[] | undefined)?.map((w) =>
    w ? ({ weekdays: errMsg(w.weekdays), ends_at: errMsg(w.ends_at), valid_to: errMsg(w.valid_to) } satisfies WindowErrors) : undefined,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{deal ? t("deals.edit", "Edit deal") : t("deals.new", "New deal")}</DialogTitle>
          <DialogDescription>
            {t(
              "deals.dialogHint",
              "The till suggests it when the cart qualifies and the teller applies it. QR and online checkout apply the best deal by themselves.",
            )}
          </DialogDescription>
        </DialogHeader>

        <form id="deal-form" noValidate onSubmit={form.handleSubmit(submit)} className="space-y-5">
          <fieldset disabled={ro} className="min-w-0 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="deal-name">{t("deals.fields.name", "Name")}</Label>
                <Input id="deal-name" placeholder={t("deals.namePlaceholder", "Any 2 bites for 90")} aria-invalid={!!errs.name} {...form.register("name")} />
                {errs.name?.message ? (
                  <p role="alert" className="text-xs text-destructive">
                    {t(errs.name.message)}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-name-ar">{t("deals.fields.nameAr", "Name (Arabic)")}</Label>
                <Input id="deal-name-ar" dir="rtl" {...form.register("name_ar")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("deals.fields.kind", "Kind")}</Label>
              <Controller
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <SegmentedControl
                    value={field.value}
                    onChange={field.onChange}
                    disabled={ro}
                    options={[
                      { value: "n_for_price", label: t("deals.kind.nForPrice", "N for a price") },
                      { value: "buy_get", label: t("deals.kind.buyGet", "Buy X get Y") },
                    ]}
                  />
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <NumberField
                id="deal-qty"
                label={nFor ? t("deals.fields.qtyN", "How many") : t("deals.fields.qtyBuy", "Buy")}
                error={errMsg(errs.qty)}
                {...form.register("qty")}
              />
              {nFor ? (
                <div className="space-y-1.5">
                  <Label htmlFor="deal-price">{t("deals.fields.price", "Price")}</Label>
                  <Input id="deal-price" inputMode="decimal" dir="ltr" className="font-mono" aria-invalid={!!errs.price} {...form.register("price")} />
                  {errMsg(errs.price) ? (
                    <p role="alert" className="text-xs text-destructive">
                      {t(errMsg(errs.price) as string)}
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <NumberField id="deal-get" label={t("deals.fields.get", "Get")} error={errMsg(errs.get_qty)} {...form.register("get_qty")} />
                  <NumberField id="deal-pct" label={t("deals.fields.getPercent", "Percent off")} hint={t("deals.fields.percentHint", "100 = free")} error={errMsg(errs.get_percent)} {...form.register("get_percent")} />
                </>
              )}
            </div>
            <p className="rounded-lg bg-secondary/60 px-3 py-2 text-sm font-medium">{preview}</p>

            <div className="space-y-2">
              <Label>{t("deals.fields.pool", "Items that count")}</Label>
              <Controller
                control={form.control}
                name="pool"
                render={({ field }) => (
                  <PoolEditor
                    label={t("deals.fields.pool", "Items that count")}
                    value={field.value as DealFormValues["pool"]}
                    onChange={field.onChange}
                    menu={menu}
                    errors={entryErrors("pool", (field.value ?? []).length)}
                    disabled={ro}
                  />
                )}
              />
              {errMsg(errs.pool) ? (
                <p role="alert" className="text-xs text-destructive">
                  {t(errMsg(errs.pool) as string)}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">{t("deals.pool.hint", "A deal covers the item price at its size; add-ons are always charged.")}</p>
            </div>

            {!nFor ? (
              <div className="space-y-2 rounded-xl border p-3">
                <Controller
                  control={form.control}
                  name="use_reward_pool"
                  render={({ field }) => (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="deal-reward-switch">{t("deals.fields.rewardPool", "Reward items")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("deals.reward.hint", "Off: the free or discounted item comes from the same list. On: from its own list (buy 2 coffees, get a cookie).")}
                        </p>
                      </div>
                      <Switch id="deal-reward-switch" checked={!!field.value} onCheckedChange={field.onChange} disabled={ro} />
                    </div>
                  )}
                />
                {v.use_reward_pool ? (
                  <>
                    <Controller
                      control={form.control}
                      name="reward_pool"
                      render={({ field }) => (
                        <PoolEditor
                          label={t("deals.fields.rewardPool", "Reward items")}
                          value={field.value as DealFormValues["reward_pool"]}
                          onChange={field.onChange}
                          menu={menu}
                          errors={entryErrors("reward_pool", (field.value ?? []).length)}
                          disabled={ro}
                        />
                      )}
                    />
                    {errMsg(errs.reward_pool) ? (
                      <p role="alert" className="text-xs text-destructive">
                        {t(errMsg(errs.reward_pool) as string)}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}

            <NumberField
              id="deal-max"
              label={t("deals.fields.maxPerOrder", "Most times per order")}
              hint={t("deals.fields.maxHint", "Blank = no limit")}
              error={errMsg(errs.max_per_order)}
              className="sm:max-w-48"
              {...form.register("max_per_order")}
            />

            <div className="space-y-2">
              <Label>{t("combos.sections.availability", "Availability")}</Label>
              <Controller
                control={form.control}
                name="windows"
                render={({ field }) => (
                  <WindowsEditor
                    idPrefix="deal"
                    value={field.value as DealFormValues["windows"]}
                    onChange={field.onChange}
                    branches={menu.branches}
                    errors={windowErrors}
                    disabled={ro}
                  />
                )}
              />
            </div>

            {menu.branches.length > 0 ? (
              <div className="space-y-2">
                <Label>{t("deals.fields.branches", "Branches")}</Label>
                <p className="text-xs text-muted-foreground">{t("deals.branchesHint", "Each branch follows the deal's switch unless set on or off here.")}</p>
                <Controller
                  control={form.control}
                  name="branches"
                  render={({ field }) => (
                    <ul className="divide-y rounded-xl border">
                      {menu.branches.map((b) => {
                        const state = ((field.value ?? {}) as Record<string, BranchState>)[b.id] ?? "inherit";
                        return (
                          <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2">
                            <span className="min-w-0 truncate text-sm">{b.name}</span>
                            <Select
                              value={state}
                              onValueChange={(s) => field.onChange({ ...(field.value ?? {}), [b.id]: s as BranchState })}
                              disabled={ro}
                            >
                              <SelectTrigger className="h-8 w-40" aria-label={b.name}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inherit">{t("deals.branch.follow", "Follow the deal")}</SelectItem>
                                <SelectItem value="on">{t("combos.settings.on", "On here")}</SelectItem>
                                <SelectItem value="off">{t("combos.settings.off", "Off here")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                />
              </div>
            ) : null}

            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
                  <Label htmlFor="deal-active">{t("deals.fields.active", "Deal is on")}</Label>
                  <Switch id="deal-active" checked={!!field.value} onCheckedChange={field.onChange} disabled={ro} />
                </div>
              )}
            />
          </fieldset>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {canEdit ? t("common.cancel", "Cancel") : t("common.close", "Close")}
          </Button>
          {canEdit ? (
            <Button type="submit" form="deal-form" loading={saving} disabled={saving}>
              {deal ? t("common.save", "Save") : t("deals.create", "Create deal")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  id,
  label,
  hint,
  error,
  className,
  ...rest
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
} & React.ComponentProps<"input">) {
  const { t } = useTranslation();
  return (
    <div className={className ? `space-y-1.5 ${className}` : "space-y-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="numeric" dir="ltr" className="font-mono" aria-invalid={!!error} {...rest} />
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {t(error)}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
