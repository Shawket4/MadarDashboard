/**
 * Which menu items a customer may claim, and what each one costs.
 *
 * Per-item pricing is the point: one list holds "espresso, 5 orders" beside
 * "cake, 10 orders", which a single program-wide threshold could not express.
 *
 * Scoped like the settings — a branch with no list of its own inherits the
 * org's, so an org curates one catalogue and a branch departs from it only when
 * it means to. An empty branch list means INHERIT, not "no rewards": a branch
 * that wants none turns the program off for itself.
 *
 * The rules a save must pass live in `catalogue-schema`, mirrored from the
 * server; this file only renders them.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/app/combobox";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import {
  useGetLoyaltyRewardItems,
  useGetLoyaltySettings,
  useListMenuItems,
  usePutLoyaltyRewardItems,
} from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { fmtMoney } from "@/lib/format";

import { loyaltyAccess } from "../../shared/access";
import { loyaltyServerError } from "../../shared/server-errors";
import { currencyLabel, modeOf } from "../../shared/util";
import type { ProgramScope } from "../use-program";
import {
  catalogueChanged,
  catalogueSchema,
  isBlocking,
  isOfferable,
  rowProblems,
  rowsFromCatalogue,
  rowsToWire,
  type RewardRow,
} from "./catalogue-schema";

const formSchema = z.object({ items: catalogueSchema });
type FormValues = z.infer<typeof formSchema>;

export function RewardsPane({ scope }: { scope: ProgramScope }) {
  const { orgId, branchId } = scope;
  const { t } = useTranslation();
  const params = branchId ? { branch_id: branchId } : {};
  const catalogue = useGetLoyaltyRewardItems(params);
  const settings = useGetLoyaltySettings(params);
  const menu = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId } });
  const save = usePutLoyaltyRewardItems();
  const authz = useAuthz();
  const { canEditProgram } = loyaltyAccess(authz);

  const mode = modeOf(settings.data);
  const anyItem = settings.data?.reward_any_item === true;
  const [picked, setPicked] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { items: [] },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "key",
  });

  // The server's list is the truth; local edits start from whatever it last
  // returned, including an inherited list a branch is about to depart from.
  useEffect(() => {
    if (catalogue.data) form.reset({ items: rowsFromCatalogue(catalogue.data.items) });
  }, [catalogue.data, form]);

  const rows = form.watch("items");
  const problems = rowProblems(rows, menu.data);
  const dirty = catalogue.data ? catalogueChanged(rows, catalogue.data.items) : false;

  const options = useMemo(
    () =>
      (menu.data ?? [])
        .filter(isOfferable)
        .filter((m) => !rows.some((r) => r.menu_item_id === m.id))
        .map((m) => ({ value: m.id, label: `${m.name} · ${fmtMoney(m.base_price)}` })),
    [menu.data, rows],
  );

  if (catalogue.isLoading || settings.isLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }
  if (catalogue.isError || settings.isError) {
    return (
      <ErrorState
        title={t("loyalty.rewardsLoadFailed", "Couldn't load the rewards")}
        message={getErrorMessage(catalogue.error ?? settings.error)}
        onRetry={() => {
          void catalogue.refetch();
          void settings.refetch();
        }}
      />
    );
  }

  const add = () => {
    const item = (menu.data ?? []).find((m) => m.id === picked);
    if (!item || !isOfferable(item)) return;
    if (rows.some((r) => r.menu_item_id === item.id)) return;
    append({
      menu_item_id: item.id,
      name: item.name,
      // The scope's default, which the admin can then price on its own.
      cost_amount: settings.data?.default_reward_cost ?? 100,
    } satisfies RewardRow);
    setPicked("");
  };

  const submit = async (v: FormValues) => {
    if (problems.some(isBlocking)) {
      toast.error(
        t("loyalty.errors.rewardFixRows", "Fix the highlighted rewards, then save."),
      );
      return;
    }
    try {
      await save.mutateAsync({
        data: { branch_id: branchId, items: rowsToWire(v.items, mode) },
      });
      toast.success(t("loyalty.rewardsSaved", "Rewards saved"));
      await catalogue.refetch();
    } catch (e) {
      toast.error(loyaltyServerError(e, t).message);
    }
  };

  const inherited = catalogue.data?.inherited === true && Boolean(branchId);
  const problemText = (p: Exclude<ReturnType<typeof rowProblems>[number], null>) =>
    p === "cost"
      ? t("loyalty.errors.rewardCost", "Enter a whole number above zero.")
      : p === "duplicate"
        ? t("loyalty.errors.rewardDuplicate", "This item is already on the list.")
        : p === "unavailable"
          ? t(
              "loyalty.errors.rewardUnavailable",
              "This menu item has been deleted. Remove it to save.",
            )
          : t(
              "loyalty.rewardInactive",
              "This menu item is switched off, so the till can't hand it over until it's back on.",
            );

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
      {inherited ? (
        <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
          {t(
            "loyalty.rewardsInherited",
            "This branch offers the organisation's rewards. Saving here gives it a list of its own.",
          )}
        </p>
      ) : null}
      {anyItem ? (
        <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          {t("loyalty.rewardsAnyItemOn", {
            defaultValue:
              "“Any item can be a reward” is on: every menu item costs {{cost}} and the prices below are not used until you switch it off.",
            cost: `${settings.data?.default_reward_cost ?? 0} ${currencyLabel(mode, settings.data?.default_reward_cost)}`,
          })}
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-5">
          {fields.length === 0 ? (
            <EmptyState
              title={t("loyalty.noRewards", "No rewards yet")}
              description={t(
                "loyalty.noRewardsHint",
                "Add the items a customer can claim, and price each one.",
              )}
            />
          ) : (
            fields.map((field, i) => {
              const problem = problems[i];
              const costId = `reward-cost-${field.menu_item_id}`;
              return (
                <div key={field.key} className="space-y-1">
                  <div className="flex flex-wrap items-end gap-3 sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{field.name}</p>
                    </div>
                    <div className="w-24 shrink-0 space-y-1.5 sm:w-32">
                      <Label htmlFor={costId} className="text-xs text-muted-foreground">
                        {currencyLabel(mode, rows[i]?.cost_amount)}
                      </Label>
                      <Input
                        id={costId}
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        className="font-mono"
                        disabled={!canEditProgram}
                        aria-invalid={problem === "cost" ? true : undefined}
                        {...form.register(`items.${i}.cost_amount`, { valueAsNumber: true })}
                      />
                    </div>
                    {canEditProgram ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("common.remove", "Remove")}
                        onClick={() => remove(i)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                  {problem ? (
                    <p
                      role="alert"
                      className={
                        isBlocking(problem)
                          ? "flex items-center gap-1 text-xs text-destructive"
                          : "flex items-center gap-1 text-xs text-warning"
                      }
                    >
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {problemText(problem)}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}

          {canEditProgram ? (
            <div className="flex items-end gap-3 border-t border-border/60 pt-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("loyalty.addReward", "Add a reward")}
                </Label>
                <Combobox
                  value={picked}
                  onChange={setPicked}
                  options={options}
                  placeholder={t("loyalty.pickItem", "Pick a menu item")}
                />
                <p className="text-xs text-muted-foreground">
                  {t(
                    "loyalty.pickItemHint",
                    "Only active menu items. Combos can't be rewards — a reward covers whole units of one item.",
                  )}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={add} disabled={!picked}>
                <Plus className="size-4" />
                {t("common.add", "Add")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canEditProgram ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            disabled={save.isPending || (!dirty && !inherited) || problems.some(isBlocking)}
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("common.save", "Save")}
          </Button>
          {dirty && catalogue.data ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => form.reset({ items: rowsFromCatalogue(catalogue.data.items) })}
            >
              {t("loyalty.discardChanges", "Discard changes")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
