import { useEffect, useMemo } from "react";
import { useFieldArray, useForm, useFormContext, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info, Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import { Combobox, type ComboboxOption } from "@/components/app/combobox";
import { SegmentedControl } from "@/components/app/segmented-control";
import {
  createGroup,
  createOption,
  deleteOption,
  getListAddonIngredientsQueryOptions,
  listGroups,
  patchGroup,
  patchOption,
  putOptionRecipe,
  useListCatalog,
  useListGroups,
} from "@/data/api/generated/api";
import type { GroupOut, OrgIngredient } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { egpToPiastres, fmtMoney, fmtUnit, piastresToEgp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { arOf, invalidateCatalog } from "../util";
import {
  SWAP_SLUGS,
  effectToLegacyType,
  formPickRule,
  isSwapType,
  legacyTypeToEffect,
  makeGroupSchema,
  optionRecipeLines,
  pickRuleToSelection,
  selectionToPickRule,
  type GroupFormInput,
  type GroupFormValues,
} from "./group-model";

interface Props {
  orgId: string;
  /** null = create a new group. */
  group: GroupOut | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Items the group is attached to, when known (the groups page computes it). */
  usedOn?: number | null;
  onManageItems?: () => void;
  onSaved?: (group: GroupOut) => void;
}

const EMPTY: GroupFormInput = {
  name: "",
  name_ar: "",
  pick: "any",
  up_to: 1,
  effect: "adds",
  swap_target: "milk",
  options: [],
};

const recipeSig = (lines: { ingredient_id: string; quantity: number; unit: string }[]) =>
  JSON.stringify(lines.map((l) => [l.ingredient_id, Number(l.quantity), l.unit]));

/**
 * The choice-group editor (MENU_MODELING_AUDIT §4.1). One form: name, pick
 * rule, "what does choosing do?", and the options inline with their price and
 * ingredient lines. Save writes the group, then each option (create / patch /
 * delete), then each option's recipe replace-set where it changed.
 *
 * The group's legacy type is derived from the effect (B3) and fixed after
 * creation: PatchGroupRequest has no `legacy_addon_type` yet, so an existing
 * group's effect can only move between "Nothing" and "Adds ingredients".
 */
export function GroupEditorDialog({ orgId, group, open, onOpenChange, usedOn, onManageItems, onSaved }: Props) {
  const { t } = useTranslation();
  const editing = !!group;

  const catalogQ = useListCatalog(orgId, { query: { enabled: open && !!orgId } });
  const catalog = useMemo(() => catalogQ.data ?? [], [catalogQ.data]);
  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const groupsQ = useListGroups({ org_id: orgId }, { query: { enabled: open && !!orgId } });

  const optionIds = useMemo(() => group?.options.map((o) => o.id) ?? [], [group]);
  const recipes = useQueries({
    queries: optionIds.map((id) => getListAddonIngredientsQueryOptions(id, { query: { enabled: open } })),
  });
  const recipesLoaded = recipes.every((q) => q.isSuccess || q.isError);
  const recipesKey = recipes.map((q) => q.dataUpdatedAt).join(",");

  const schema = useMemo(
    () =>
      makeGroupSchema({
        required: t("common.requiredField", "This field is required"),
        maxAtLeastOne: t("menu.groups.editor.maxAtLeastOne", "Must be at least 1"),
        swapNeedsIngredient: t("menu.groups.editor.swapNeedsIngredient", "Pick the ingredient this option pours"),
        duplicateIngredient: t("menu.groups.editor.duplicateIngredient", "This ingredient is already on this option"),
        qtyPositive: t("menu.groups.editor.qtyPositive", "Enter an amount above 0"),
      }),
    [t],
  );

  const form = useForm<GroupFormInput, unknown, GroupFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const options = useFieldArray({ control: form.control, name: "options" });

  // Seed once the option recipes are in (the form is the dirty store).
  const seeded = useMemo<GroupFormInput | null>(() => {
    if (!group) return EMPTY;
    if (!recipesLoaded) return null;
    const lineSets = recipes.map((q) => q.data ?? []);
    const anyLines = lineSets.some((ls) => ls.length > 0);
    const { effect, swapTarget } = legacyTypeToEffect(group.legacy_addon_type, anyLines);
    const rule = selectionToPickRule(group);
    return {
      name: group.name,
      name_ar: arOf(group.name_translations),
      pick: rule.kind,
      up_to: rule.kind === "up_to" ? rule.max : 1,
      effect,
      swap_target: swapTarget ?? "milk",
      options: [...group.options]
        .map((o, i) => ({ o, lines: lineSets[i] ?? [] }))
        .sort((a, b) => a.o.sort - b.o.sort)
        .map(({ o, lines }) => ({
          id: o.id,
          name: o.name,
          name_ar: arOf(o.name_translations),
          price: String(piastresToEgp(o.price)),
          is_active: o.is_active,
          swap_ingredient_id: lines[0]?.org_ingredient_id ?? o.replaces_ingredient_id ?? "",
          lines: lines
            .filter((l) => l.org_ingredient_id)
            .map((l) => ({ ingredient_id: l.org_ingredient_id!, quantity: String(l.quantity_used), unit: l.unit })),
        })),
    };
    // recipesKey stands in for the query results' identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, recipesLoaded, recipesKey]);

  useEffect(() => {
    if (open && seeded) form.reset(seeded);
  }, [open, seeded, form]);

  const effect = useWatch({ control: form.control, name: "effect" });
  const pick = useWatch({ control: form.control, name: "pick" });
  const swapTarget = useWatch({ control: form.control, name: "swap_target" });
  const lockedSwap = editing && isSwapType(group?.legacy_addon_type);
  // A PATCH can't clear max_selections, so an existing capped group can't become "any number".
  const anyBlocked = editing && group?.max_selections != null && !lockedSwap;

  const ingredientOptions = useMemo<ComboboxOption[]>(
    () =>
      catalog
        .filter((c) => c.is_active)
        .map((c) => ({ value: c.id, label: c.name, hint: fmtUnit(c.unit), keywords: c.category_name })),
    [catalog],
  );
  const swapOptions = useMemo<ComboboxOption[]>(
    () =>
      catalog
        .filter((c) => c.is_active && c.category_slug === SWAP_SLUGS[swapTarget])
        .map((c) => ({ value: c.id, label: c.name, hint: fmtUnit(c.unit) })),
    [catalog, swapTarget],
  );

  const submit = async (v: GroupFormValues) => {
    const sel = pickRuleToSelection(formPickRule(v));
    const unitOf = (id: string) => catalogById.get(id)?.unit;
    try {
      let saved: GroupOut;
      if (group) {
        saved = await patchGroup(group.id, {
          name: v.name,
          name_translations: { ...(group.name_translations as object), ar: v.name_ar },
          selection_type: sel.selection_type,
          min_selections: sel.min_selections,
          max_selections: sel.max_selections ?? undefined,
          is_required: sel.is_required,
        });
      } else {
        const taken = (groupsQ.data ?? []).map((g) => g.legacy_addon_type).filter((x): x is string => !!x);
        saved = await createGroup({
          name: v.name,
          name_translations: v.name_ar ? { ar: v.name_ar } : {},
          ...sel,
          sort: groupsQ.data?.length ?? 0,
          legacy_addon_type: effectToLegacyType(v.effect, v.effect === "swaps" ? v.swap_target : null, v.name, taken),
        });
      }

      const originals = new Map((group?.options ?? []).map((o) => [o.id, o]));
      const seededById = new Map((seeded?.options ?? []).filter((o) => o.id).map((o) => [o.id!, o]));
      const kept = new Set(v.options.map((o) => o.id).filter(Boolean));
      for (const id of originals.keys()) if (!kept.has(id)) await deleteOption(id);

      for (const o of v.options) {
        const price = egpToPiastres(o.price);
        const swapIng = v.effect === "swaps" && o.swap_ingredient_id ? o.swap_ingredient_id : null;
        let optionId = o.id;
        if (optionId) {
          const prev = originals.get(optionId)!;
          if (
            prev.name !== o.name ||
            arOf(prev.name_translations) !== o.name_ar ||
            prev.price !== price ||
            prev.is_active !== o.is_active ||
            (swapIng && prev.replaces_ingredient_id !== swapIng)
          ) {
            await patchOption(optionId, {
              name: o.name,
              name_translations: { ...(prev.name_translations as object), ar: o.name_ar },
              price,
              is_active: o.is_active,
              replaces_ingredient_id: swapIng ?? undefined,
            });
          }
        } else {
          optionId = (
            await createOption(saved.id, {
              name: o.name,
              name_translations: o.name_ar ? { ar: o.name_ar } : {},
              price,
              is_active: o.is_active,
              replaces_ingredient_id: swapIng,
            })
          ).id;
        }
        const next = optionRecipeLines(v.effect, o, unitOf);
        const before = o.id ? seededById.get(o.id) : undefined;
        const prevLines = before
          ? optionRecipeLines(
              (seeded?.effect ?? v.effect) as GroupFormValues["effect"],
              before as GroupFormValues["options"][number],
              unitOf,
            )
          : [];
        if (recipeSig(next) !== recipeSig(prevLines)) {
          await putOptionRecipe(optionId, next);
        }
      }

      toast.success(t("common.savedChanges", "Changes saved"));
      void invalidateCatalog();
      if (onSaved) {
        // `saved` predates the option writes; hand back the group with its options.
        const fresh = await listGroups({ org_id: orgId }).catch(() => []);
        onSaved(fresh.find((g) => g.id === saved.id) ?? saved);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const busy = form.formState.isSubmitting;
  const loading = editing && !seeded;

  const pickOptions = [
    { value: "exactly_one" as const, label: t("menu.groups.pick.exactlyOne", "Exactly 1") },
    { value: "up_to" as const, label: t("menu.groups.pick.upTo", "Up to…") },
    ...(anyBlocked ? [] : [{ value: "any" as const, label: t("menu.groups.pick.any", "Any number") }]),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("menu.groups.editor.editTitle", "Edit choice group") : t("menu.groups.editor.newTitle", "New choice group")}
          </DialogTitle>
          <DialogDescription>
            {t("menu.groups.editor.desc", "A set of choices the cashier offers on an item, like Milk or Red Bull Type.")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
              <BilingualField control={form.control} enName="name" arName="name_ar" label={t("common.name", "Name")} />

              {/* What does choosing do? */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t("menu.groups.editor.effectLabel", "What does choosing do?")}</legend>
                <FormField
                  control={form.control}
                  name="effect"
                  render={({ field }) => (
                    <div role="radiogroup" className="space-y-1.5">
                      {(["none", "adds", "swaps"] as const).map((value) => {
                        const disabled = editing && (lockedSwap ? value !== "swaps" : value === "swaps");
                        return (
                          <label
                            key={value}
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                              field.value === value && "border-primary bg-accent/50",
                              disabled && "opacity-50",
                            )}
                          >
                            <input
                              type="radio"
                              name={field.name}
                              value={value}
                              checked={field.value === value}
                              disabled={disabled}
                              onChange={() => field.onChange(value)}
                              className="accent-primary"
                            />
                            {value === "none" ? (
                              t("menu.groups.effect.none", "Nothing to stock (just a note or a price)")
                            ) : value === "adds" ? (
                              t("menu.groups.effect.adds", "Adds ingredients")
                            ) : (
                              <span className="flex flex-wrap items-center gap-2">
                                {t("menu.groups.effect.swapsPrefix", "Swaps the drink's")}
                                <FormField
                                  control={form.control}
                                  name="swap_target"
                                  render={({ field: target }) => (
                                    <SegmentedControl
                                      value={target.value}
                                      onChange={(x) => {
                                        if (!lockedSwap && !editing) {
                                          target.onChange(x);
                                          field.onChange("swaps");
                                        }
                                      }}
                                      options={[
                                        { value: "milk" as const, label: t("menu.groups.swap.milk", "Milk") },
                                        { value: "beans" as const, label: t("menu.groups.swap.beans", "Beans") },
                                      ]}
                                    />
                                  )}
                                />
                                {t("menu.groups.effect.swapsSuffix", "for the chosen one")}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                {editing ? (
                  <p className="text-xs text-muted-foreground">
                    {lockedSwap
                      ? t("menu.groups.editor.swapLocked", "A swap group stays a swap group. To stop swapping, create a new group.")
                      : t("menu.groups.editor.effectLocked", "An existing group can't start swapping. Create a new swap group instead.")}
                  </p>
                ) : null}
                {effect === "none" && editing ? (
                  <p className="text-xs text-muted-foreground">
                    {t("menu.groups.editor.noneClears", "Saving as Nothing removes the ingredient lines from these options.")}
                  </p>
                ) : null}
              </fieldset>

              {/* Customer must pick */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t("menu.groups.editor.pickLabel", "Customer must pick")}</legend>
                {effect === "swaps" ? (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {t("menu.groups.editor.swapExactlyOne", "Exactly 1. A drink has one milk and one bean, so a swap group always takes exactly one choice.")}
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <FormField
                      control={form.control}
                      name="pick"
                      render={({ field }) => <SegmentedControl value={field.value} onChange={field.onChange} options={pickOptions} />}
                    />
                    {pick === "up_to" ? (
                      <FormField
                        control={form.control}
                        name="up_to"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                className="h-9 w-20 tabular"
                                aria-label={t("menu.groups.editor.upToCount", "Most choices")}
                                {...field}
                                value={field.value as number | string}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}
                  </div>
                )}
                {anyBlocked && effect !== "swaps" ? (
                  <p className="text-xs text-muted-foreground">
                    {t("menu.groups.editor.anyBlocked", "This group has a limit. Removing the limit isn't possible yet; raise it instead.")}
                  </p>
                ) : null}
              </fieldset>

              {/* Options */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">{t("menu.groups.editor.optionsLabel", "Options")}</legend>
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {effect === "swaps"
                    ? t("menu.groups.editor.swapHelp", "The drink's own recipe decides the default and the amount (e.g. Latte 280 g). Choosing Oat pours 280 g of Oat Milk instead. The price is what the option adds on top.")
                    : effect === "adds"
                      ? t("menu.groups.editor.addsHelp", "These amounts are deducted on top of the drink's recipe whenever the option is chosen.")
                      : t("menu.groups.editor.noneHelp", "Choosing an option only changes the price and the ticket. No stock moves.")}
                </p>
                {effect === "swaps" && swapOptions.length === 0 && !catalogQ.isLoading ? (
                  <p className="text-xs text-destructive">
                    {swapTarget === "milk"
                      ? t("menu.groups.editor.noMilk", "No ingredient is in the Milk category yet. Put your milks in it under Inventory settings.")
                      : t("menu.groups.editor.noBeans", "No ingredient is in the Coffee bean category yet. Put your beans in it under Inventory settings.")}
                  </p>
                ) : null}

                {options.fields.map((f, i) => (
                  <OptionRow
                    key={f.id}
                    index={i}
                    control={form.control}
                    effect={effect}
                    swapOptions={swapOptions}
                    ingredientOptions={ingredientOptions}
                    catalogById={catalogById}
                    onRemove={() => options.remove(i)}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    options.append({ name: "", name_ar: "", price: "0", is_active: true, swap_ingredient_id: "", lines: [] })
                  }
                >
                  <Plus className="size-4" /> {t("menu.groups.editor.addOption", "Add option")}
                </Button>
              </fieldset>

              {editing && usedOn != null ? (
                <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
                  <span>{t("menu.groups.usedOn", { count: usedOn, defaultValue: "Used on {{count}} items" })}</span>
                  {onManageItems ? (
                    <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onManageItems}>
                      {t("menu.groups.manage", "Manage…")}
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button type="submit" loading={busy}>
                  {t("common.save", "Save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface OptionRowProps {
  index: number;
  control: Control<GroupFormInput, unknown, GroupFormValues>;
  effect: GroupFormInput["effect"];
  swapOptions: ComboboxOption[];
  ingredientOptions: ComboboxOption[];
  catalogById: Map<string, OrgIngredient>;
  onRemove: () => void;
}

function OptionRow({ index, control, effect, swapOptions, ingredientOptions, catalogById, onRemove }: OptionRowProps) {
  const { t } = useTranslation();
  const { setValue } = useFormContext<GroupFormInput, unknown, GroupFormValues>();
  const lines = useFieldArray({ control, name: `options.${index}.lines` });
  const watchedLines = useWatch({ control, name: `options.${index}.lines` });

  const cost = useMemo(() => {
    if (effect !== "adds" || !watchedLines?.length) return null;
    let sum = 0;
    for (const l of watchedLines) {
      const ing = catalogById.get(l.ingredient_id);
      const qty = Number(l.quantity);
      if (!ing || ing.cost_per_unit == null || !Number.isFinite(qty) || l.unit !== ing.unit) return null;
      sum += ing.cost_per_unit * qty;
    }
    return sum;
  }, [effect, watchedLines, catalogById]);

  return (
    <div className="rounded-lg border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_7rem_auto_auto] sm:items-end">
        <FormField
          control={control}
          name={`options.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t("common.name", "Name")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("menu.groups.editor.optionNamePh", "e.g. Oat")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`options.${index}.name_ar`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t("menu.groups.editor.arabicName", "Arabic name")}</FormLabel>
              <FormControl>
                <Input dir="rtl" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`options.${index}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">{t("menu.groups.editor.priceAdds", "Adds (EGP)")}</FormLabel>
              <FormControl>
                <Input type="number" inputMode="decimal" step="0.01" min="0" className="tabular" {...field} value={field.value as number | string} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`options.${index}.is_active`}
          render={({ field }) => (
            <label className="flex h-9 items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              {t("common.active", "Active")}
            </label>
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive"
          aria-label={t("menu.groups.editor.removeOption", "Remove option")}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {effect === "swaps" ? (
        <FormField
          control={control}
          name={`options.${index}.swap_ingredient_id`}
          render={({ field }) => (
            <FormItem className="mt-2">
              <FormLabel className="text-xs text-muted-foreground">{t("menu.groups.editor.usesIngredient", "Uses ingredient")}</FormLabel>
              <Combobox options={swapOptions} value={field.value || null} onChange={field.onChange} className="sm:w-72" />
              <FormMessage />
            </FormItem>
          )}
        />
      ) : effect === "adds" ? (
        <div className="mt-2 space-y-2">
          <span className="block text-xs font-medium text-muted-foreground">{t("menu.groups.editor.deducts", "Deducts")}</span>
          {lines.fields.map((lf, j) => (
            <div key={lf.id} className="flex flex-wrap items-start gap-2">
              <FormField
                control={control}
                name={`options.${index}.lines.${j}.ingredient_id`}
                render={({ field }) => (
                  <FormItem className="min-w-48 flex-1">
                    <Combobox
                      options={ingredientOptions}
                      value={field.value || null}
                      onChange={(id) => {
                        field.onChange(id);
                        const unit = catalogById.get(id)?.unit;
                        if (unit) setValue(`options.${index}.lines.${j}.unit`, unit);
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`options.${index}.lines.${j}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-1.5">
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          className="h-9 w-24 tabular"
                          aria-label={t("menu.groups.editor.amount", "Amount")}
                          {...field}
                          value={field.value as number | string}
                        />
                      </FormControl>
                      <span className="w-8 text-xs text-muted-foreground">{fmtUnit(watchedLines?.[j]?.unit)}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("menu.groups.editor.removeLine", "Remove ingredient")}
                onClick={() => lines.remove(j)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => lines.append({ ingredient_id: "", quantity: "", unit: "g" })}>
              <Plus className="size-4" /> {t("menu.groups.editor.addLine", "Add ingredient")}
            </Button>
            {cost != null ? (
              <span className="text-xs text-muted-foreground tabular">
                {t("menu.groups.editor.cost", "Cost")} {fmtMoney(cost)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
