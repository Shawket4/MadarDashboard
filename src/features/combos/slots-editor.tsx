/**
 * The combo's slots (C1, C9): each slot is "pick min–max from these", its
 * choices are items or whole categories, and each choice says which size the
 * combo price covers, what it costs extra, and what a bigger size costs.
 *
 * A bigger size left blank costs the size's usual price difference (C9); the
 * placeholder shows that difference so the owner sees what blank means.
 */
import { useMemo } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, FolderTree, Plus, Tag, Trash2 } from "lucide-react";

import { Combobox } from "@/components/app/combobox";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { emptyChoice, emptySlot, type ChoiceFormValues, type ComboFormInput, type ComboFormValues } from "./form-schema";
import { cheapestSize, sizeLabelText, type ItemOption, type MenuOptions } from "./use-menu-options";
import { moneyIn } from "./util";

const NONE = "__none__";

type Errs = Record<string, { message?: string } | undefined> | undefined;

function FieldError({ message }: { message?: string }) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {t(message)}
    </p>
  );
}

export function SlotsEditor({ menu, disabled }: { menu: MenuOptions; disabled?: boolean }) {
  const { t } = useTranslation();
  const { control, formState } = useFormContext<ComboFormInput, unknown, ComboFormValues>();
  const slots = useFieldArray({ control, name: "slots", keyName: "_k" });
  const rootError = (formState.errors.slots as { message?: string; root?: { message?: string } } | undefined);

  return (
    <div className="space-y-4">
      {slots.fields.map((f, i) => (
        <SlotCard
          key={f._k}
          index={i}
          count={slots.fields.length}
          menu={menu}
          disabled={disabled}
          onMove={(to) => slots.move(i, to)}
          onRemove={() => slots.remove(i)}
        />
      ))}
      <FieldError message={rootError?.message ?? rootError?.root?.message} />
      {!disabled ? (
        <Button type="button" variant="outline" onClick={() => slots.append(emptySlot())}>
          <Plus className="size-4" /> {t("combos.slots.add", "Add a slot")}
        </Button>
      ) : null}
    </div>
  );
}

function SlotCard({
  index: i,
  count,
  menu,
  disabled,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  menu: MenuOptions;
  disabled?: boolean;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const { control, register, formState, setValue } = useFormContext<ComboFormInput, unknown, ComboFormValues>();
  const choices = useFieldArray({ control, name: `slots.${i}.choices`, keyName: "_k" });
  const slot = useWatch({ control, name: `slots.${i}` });
  const errs = (formState.errors.slots?.[i] ?? {}) as Record<string, unknown> & {
    choices?: { message?: string; root?: { message?: string } } & Record<number, Errs>;
  };
  const e = (k: string) => (errs[k] as { message?: string } | undefined)?.message;

  // The slot's default can be any item its choices admit.
  const defaultOptions = useMemo(() => {
    const ids = new Set<string>();
    const out: ItemOption[] = [];
    for (const c of slot?.choices ?? []) {
      if (!c) continue; // a watched array can hold a hole while a row is added
      const list = c.target === "item" ? [menu.item(c.menu_item_id)].filter(Boolean) : c.category_id ? menu.itemsOfCategory(c.category_id) : [];
      for (const it of list as ItemOption[]) if (!ids.has(it.id)) (ids.add(it.id), out.push(it));
    }
    return out;
  }, [slot?.choices, menu]);
  const defaultItem = menu.item(slot?.default_item_id);
  const title = slot?.name?.trim() || t("combos.slots.slotN", { defaultValue: "Slot {{n}}", n: i + 1 });
  const fixedPick = Number(slot?.min) === Number(slot?.max);

  return (
    <section aria-labelledby={`slot-${i}-title`} className="rounded-2xl border bg-card p-4 sm:p-5">
      {/* A disabled fieldset disables every control in the slot for a read-only viewer. */}
      <fieldset disabled={disabled} className="min-w-0 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`slot-${i}-title`} className="truncate text-sm font-semibold">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {fixedPick
              ? t("combos.slots.pickExactly", { defaultValue: "Pick {{count}}", count: Number(slot?.min) || 0 })
              : t("combos.slots.pickRange", { defaultValue: "Pick {{min}} to {{max}}", min: slot?.min, max: slot?.max })}
          </p>
        </div>
        {!disabled ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} aria-label={t("combos.slots.moveUp", "Move up")} onClick={() => onMove(i - 1)}>
              <ArrowUp className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" disabled={i === count - 1} aria-label={t("combos.slots.moveDown", "Move down")} onClick={() => onMove(i + 1)}>
              <ArrowDown className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" className="text-destructive" aria-label={t("combos.slots.remove", "Remove this slot")} onClick={onRemove}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_5rem_5rem]">
        <div className="space-y-1.5">
          <Label htmlFor={`slot-${i}-name`}>{t("combos.slots.name", "Slot name")}</Label>
          <Input id={`slot-${i}-name`} placeholder={t("combos.slots.namePlaceholder", "Drink")} aria-invalid={!!e("name")} {...register(`slots.${i}.name`)} />
          <FieldError message={e("name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`slot-${i}-name-ar`}>{t("combos.slots.nameAr", "Slot name (Arabic)")}</Label>
          <Input id={`slot-${i}-name-ar`} dir="rtl" placeholder="مشروب" {...register(`slots.${i}.name_ar`)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`slot-${i}-min`}>{t("combos.slots.min", "At least")}</Label>
          <Input id={`slot-${i}-min`} type="number" inputMode="numeric" min={0} max={10} dir="ltr" className="font-mono" aria-invalid={!!e("min")} {...register(`slots.${i}.min`)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`slot-${i}-max`}>{t("combos.slots.max", "At most")}</Label>
          <Input id={`slot-${i}-max`} type="number" inputMode="numeric" min={1} max={10} dir="ltr" className="font-mono" aria-invalid={!!e("max")} {...register(`slots.${i}.max`)} />
        </div>
      </div>
      <FieldError message={e("min") ?? e("max")} />
      {Number(slot?.min) === 0 ? (
        <p className="text-xs text-muted-foreground">{t("combos.slots.optionalHint", "At least 0 makes this slot optional: the customer may skip it.")}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t("combos.slots.choices", "Choices")}</p>
        <ul className="space-y-2">
          {choices.fields.map((cf, j) => (
            <li key={cf._k}>
              <Controller
                control={control}
                name={`slots.${i}.choices.${j}`}
                render={({ field }) => (
                  <ChoiceRow
                    value={field.value as ChoiceFormValues}
                    onChange={field.onChange}
                    onRemove={() => choices.remove(j)}
                    menu={menu}
                    disabled={disabled}
                    errors={errs.choices?.[j]}
                    idBase={`slot-${i}-c${j}`}
                  />
                )}
              />
            </li>
          ))}
        </ul>
        <FieldError message={errs.choices?.message ?? errs.choices?.root?.message} />
        {!disabled ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => choices.append(emptyChoice())}>
              <Tag className="size-4" /> {t("combos.slots.addItem", "Add an item")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => choices.append({ ...emptyChoice(), target: "category" })}>
              <FolderTree className="size-4" /> {t("combos.slots.addCategory", "Add a whole category")}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`slot-${i}-default`}>{t("combos.slots.default", "Default pick")}</Label>
          <Select
            value={slot?.default_item_id || NONE}
            onValueChange={(v) => {
              setValue(`slots.${i}.default_item_id`, v === NONE ? "" : v, { shouldDirty: true, shouldValidate: formState.isSubmitted });
              setValue(`slots.${i}.default_size_label`, "", { shouldDirty: true });
            }}
            disabled={disabled}
          >
            <SelectTrigger id={`slot-${i}-default`} className="w-full" aria-invalid={!!e("default_item_id")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t("combos.slots.defaultFirst", "The first choice")}</SelectItem>
              {defaultOptions.map((it) => (
                <SelectItem key={it.id} value={it.id}>
                  {it.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={e("default_item_id")} />
          <p className="text-xs text-muted-foreground">
            {t("combos.slots.defaultHint", "Pre-selected on the till, used for the default margin, and applied when a synced sale arrives without picks.")}
          </p>
        </div>
        {defaultItem && defaultItem.sizes.length > 1 ? (
          <div className="space-y-1.5">
            <Label htmlFor={`slot-${i}-default-size`}>{t("combos.slots.defaultSize", "Default size")}</Label>
            <Select
              value={slot?.default_size_label || NONE}
              onValueChange={(v) => setValue(`slots.${i}.default_size_label`, v === NONE ? "" : v, { shouldDirty: true })}
              disabled={disabled}
            >
              <SelectTrigger id={`slot-${i}-default-size`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("combos.slots.includedSize", "The included size")}</SelectItem>
                {defaultItem.sizes.map((s) => (
                  <SelectItem key={s.label} value={s.label}>
                    {sizeLabelText(s.label, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      </fieldset>
    </section>
  );
}

function ChoiceRow({
  value: c,
  onChange,
  onRemove,
  menu,
  disabled,
  errors,
  idBase,
}: {
  value: ChoiceFormValues;
  onChange: (next: ChoiceFormValues) => void;
  onRemove: () => void;
  menu: MenuOptions;
  disabled?: boolean;
  errors?: Errs & { size_surcharges?: Record<number, Errs> };
  idBase: string;
}) {
  const { t } = useTranslation();
  const patch = (p: Partial<ChoiceFormValues>) => onChange({ ...c, ...p });
  const item = c.target === "item" ? menu.item(c.menu_item_id) : undefined;
  const labels = c.target === "item" ? (item?.sizes.map((s) => s.label) ?? []) : c.category_id ? menu.categorySizeLabels(c.category_id) : [];
  const included = c.included_size_label || (c.target === "item" ? cheapestSize(item)?.label : undefined) || "";
  const bigger = labels.filter((l) => l !== included);
  const basePrice = item?.sizes.find((s) => s.label === included)?.price;
  const err = (k: string) => errors?.[k]?.message;

  const itemOptions = useMemo(
    () =>
      menu.items.map((it) => ({
        value: it.id,
        label: it.name,
        hint: fmtMoney(cheapestSize(it)?.price),
        keywords: menu.categoryName(it.category_id) ?? "",
      })),
    [menu],
  );

  const sizeSurcharge = (label: string) => c.size_surcharges.find((x) => x.size_label === label)?.surcharge ?? "";
  const setSizeSurcharge = (label: string, v: string) => {
    const rest = c.size_surcharges.filter((x) => x.size_label !== label);
    patch({ size_surcharges: v.trim() === "" ? rest : [...rest, { size_label: label, surcharge: v }] });
  };

  return (
    <div className={cn("space-y-3 rounded-xl border p-3", !item && c.target === "item" && c.menu_item_id && "border-warning")}>
      <div className="flex flex-wrap items-start gap-2">
        <SegmentedControl
          value={c.target}
          onChange={(v) => patch({ target: v, menu_item_id: "", category_id: "", included_size_label: "", size_surcharges: [] })}
          options={[
            { value: "item", label: t("combos.choice.item", "Item") },
            { value: "category", label: t("combos.choice.category", "Category") },
          ]}
          disabled={disabled}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1 basis-48">
          {c.target === "item" ? (
            <Combobox
              options={itemOptions}
              value={c.menu_item_id || null}
              onChange={(v) => patch({ menu_item_id: v, included_size_label: "", size_surcharges: [] })}
              placeholder={t("combos.choice.pickItem", "Choose an item")}
              disabled={disabled}
            />
          ) : (
            <Select value={c.category_id || undefined} onValueChange={(v) => patch({ category_id: v, included_size_label: "", size_surcharges: [] })} disabled={disabled}>
              <SelectTrigger className="h-9 w-full" aria-label={t("combos.choice.pickCategory", "Choose a category")}>
                <SelectValue placeholder={t("combos.choice.pickCategory", "Choose a category")} />
              </SelectTrigger>
              <SelectContent>
                {menu.categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FieldError message={err("target")} />
          {c.target === "category" && c.category_id ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("combos.choice.categoryCount", { defaultValue: "{{count}} items today; new items in it join automatically.", count: menu.itemsOfCategory(c.category_id).length })}
            </p>
          ) : null}
          {item && !item.is_active ? (
            <Badge variant="secondary" className="mt-1">
              {t("common.inactive", "Inactive")}
            </Badge>
          ) : null}
        </div>
        <div className="w-28 shrink-0 space-y-1">
          <Label htmlFor={`${idBase}-extra`} className="text-xs">
            {t("combos.choice.surcharge", "Extra charge")}
          </Label>
          <Input
            id={`${idBase}-extra`}
            inputMode="decimal"
            dir="ltr"
            className="h-9 font-mono"
            placeholder="0"
            value={c.surcharge}
            onChange={(ev) => patch({ surcharge: ev.target.value })}
            aria-invalid={!!err("surcharge")}
            disabled={disabled}
          />
        </div>
        {!disabled ? (
          <Button type="button" variant="ghost" size="icon-sm" className="mt-6 text-destructive" aria-label={t("combos.choice.remove", "Remove this choice")} onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
      <FieldError message={err("surcharge")} />

      {labels.length > 1 ? (
        <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-included`} className="text-xs">
              {t("combos.choice.includedSize", "Size the price covers")}
            </Label>
            <Select
              value={c.included_size_label || NONE}
              onValueChange={(v) => patch({ included_size_label: v === NONE ? "" : v, size_surcharges: c.size_surcharges.filter((x) => x.size_label !== v) })}
              disabled={disabled}
            >
              <SelectTrigger id={`${idBase}-included`} className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("combos.choice.cheapest", "The cheapest size")}</SelectItem>
                {labels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {sizeLabelText(l, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {bigger.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-medium">{t("combos.choice.otherSizes", "Other sizes cost")}</p>
              <div className="flex flex-wrap gap-2">
                {bigger.map((label) => {
                  const sizePrice = item?.sizes.find((s) => s.label === label)?.price;
                  const diff = basePrice !== undefined && sizePrice !== undefined ? Math.max(0, sizePrice - basePrice) : undefined;
                  const k = c.size_surcharges.findIndex((x) => x.size_label === label);
                  const bad = k >= 0 ? errors?.size_surcharges?.[k]?.surcharge?.message : undefined;
                  const typed = moneyIn(sizeSurcharge(label));
                  return (
                    <label key={label} className="flex items-center gap-1.5 text-xs">
                      <span className="min-w-12 text-muted-foreground">{sizeLabelText(label, t)}</span>
                      <Input
                        inputMode="decimal"
                        dir="ltr"
                        className="h-8 w-28 font-mono"
                        value={sizeSurcharge(label)}
                        onChange={(ev) => setSizeSurcharge(label, ev.target.value)}
                        placeholder={
                          diff !== undefined
                            ? t("combos.choice.differenceAmount", { defaultValue: "+{{amount}} difference", amount: fmtMoney(diff, { currency: false }) })
                            : t("combos.choice.difference", "the difference")
                        }
                        aria-label={t("combos.choice.sizeExtra", { defaultValue: "Extra for {{size}}", size: sizeLabelText(label, t) })}
                        aria-invalid={!!bad || (typed !== null && !Number.isFinite(typed))}
                        disabled={disabled}
                      />
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("combos.choice.blankMeansDifference", "Left blank, a bigger size costs its usual price difference.")}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
