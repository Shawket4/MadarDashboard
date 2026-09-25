/**
 * The combo picker: the customer fills a combo's slots ("a Coffee", "a
 * Dessert") from the choices the owner allowed, upgrades a size where one is
 * offered, and adds the whole thing as ONE basket line.
 *
 * Same sheet, header and sticky footer as the item customizer, so a combo
 * feels like any other thing on the menu. No add-ons inside a slot yet (v1):
 * the server takes picks without them.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Lock, Minus, Plus, UtensilsCrossed, X } from "lucide-react";

import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { PublicComboChoice } from "@/data/api/generated/models/publicComboChoice";
import type { PublicComboSlot } from "@/data/api/generated/models/publicComboSlot";
import { AssetImage, assetOf } from "@/components/app/asset-image";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { getTranslatedDescription, getTranslatedName } from "@/lib/translation";
import i18n from "@/i18n";

import type { CartLine } from "../types";
import { displaySize, lineUnitPrice, newUid } from "../utils";
import { FIELD_LIMITS } from "../limits";
import {
  buildPicks,
  firstUnmetSlot,
  initialSelection,
  isLockedSlot,
  slotCount,
  slotHint,
  sortedSlots,
  type ComboSelection,
} from "../combo";

interface ComboCustomizerProps {
  /** A menu item of kind "combo" (null = closed). */
  item: DeliveryMenuItem | null;
  /** When editing an existing combo line, its picks and quantity. */
  editing?: CartLine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (line: CartLine) => void;
}

export function ComboCustomizer({ item, editing, open, onOpenChange, onConfirm }: ComboCustomizerProps) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const combo = item?.combo ?? null;

  const [sel, setSel] = useState<ComboSelection>({});
  const [qty, setQty] = useState(1);

  // (Re)initialise whenever a fresh combo or edit is opened.
  useEffect(() => {
    if (!open || !combo) return;
    setSel(initialSelection(combo, editing?.combo?.picks));
    setQty(editing?.quantity ?? 1);
  }, [open, combo, editing]);

  const slots = useMemo(() => (combo ? sortedSlots(combo) : []), [combo]);

  const draft = useMemo<CartLine | null>(() => {
    if (!item || !combo) return null;
    return {
      uid: editing?.uid ?? newUid(),
      item,
      size_label: null,
      base_price: item.price,
      quantity: qty,
      addons: [],
      optionals: [],
      notes: editing?.notes ?? null,
      combo: { picks: buildPicks(combo, sel) },
    };
  }, [item, combo, sel, qty, editing]);

  if (!item || !combo) return null;

  const unmet = firstUnmetSlot(combo, sel);
  const unitPrice = draft ? lineUnitPrice(draft) : item.price;
  const totalPrice = unitPrice * qty;
  const description = getTranslatedDescription(item, lang);

  // Single select (max 1): picking one replaces the other; re-tapping clears an optional slot.
  const pickOnly = (slot: PublicComboSlot, choice: PublicComboChoice) =>
    setSel((prev) => {
      const cur = prev[slot.id]?.[choice.menu_item_id];
      if (cur) {
        if (slot.min > 0) return prev;
        return { ...prev, [slot.id]: {} };
      }
      return {
        ...prev,
        [slot.id]: { [choice.menu_item_id]: { qty: 1, size: choice.included_size_label } },
      };
    });

  // Several units (max > 1): a stepper per choice, the slot's total capped at max.
  const setChoiceQty = (slot: PublicComboSlot, choice: PublicComboChoice, n: number) =>
    setSel((prev) => {
      const slotSel = { ...(prev[slot.id] ?? {}) };
      const cur = slotSel[choice.menu_item_id];
      const others = slotCount(slotSel) - (cur?.qty ?? 0);
      const next = Math.max(0, Math.min(n, slot.max - others));
      if (next <= 0) delete slotSel[choice.menu_item_id];
      else slotSel[choice.menu_item_id] = { qty: next, size: cur?.size ?? choice.included_size_label };
      return { ...prev, [slot.id]: slotSel };
    });

  const setChoiceSize = (slot: PublicComboSlot, choice: PublicComboChoice, size: string) =>
    setSel((prev) => {
      const cur = prev[slot.id]?.[choice.menu_item_id];
      if (!cur) return prev;
      return { ...prev, [slot.id]: { ...prev[slot.id], [choice.menu_item_id]: { ...cur, size } } };
    });

  const unmetName = unmet
    ? getTranslatedName({ name: unmet.name, name_translations: unmet.name_translations }, lang)
    : "";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent showHandle={false} className="mx-auto max-h-[92dvh] max-w-[480px]">
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-2.5 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-background/70"
            />
            {item.image_url ? (
              <AssetImage
                asset={assetOf(item)}
                legacyUrl={item.image_url}
                sizes="(max-width: 640px) 512px, 1600px"
                className="h-52 w-full rounded-t-lg object-cover sm:h-56"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-t-lg bg-muted text-muted-foreground">
                <UtensilsCrossed className="size-10" />
              </div>
            )}
            <DrawerClose
              aria-label={t("common.close", "Close")}
              className="absolute end-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
            >
              <X className="size-4" />
            </DrawerClose>
          </div>

          <div className="space-y-6 px-4 pb-5 pt-4">
            <div className="text-start">
              <div className="flex items-baseline justify-between gap-3">
                <DrawerTitle className="font-serif text-xl leading-tight">{getTranslatedName(item, lang)}</DrawerTitle>
                <span className="shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
                  {fmtMoney(item.price)}
                </span>
              </div>
              {description ? (
                <DrawerDescription className="mt-1 leading-relaxed">{description}</DrawerDescription>
              ) : (
                <DrawerDescription className="sr-only">{t("order.combo.describe", "Choose what goes in your combo")}</DrawerDescription>
              )}
              {combo.is_fixed ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("order.combo.fixedHint", "Everything below comes in the box.")}
                </p>
              ) : null}
            </div>

            {slots.map((slot) => (
              <SlotSection
                key={slot.id}
                slot={slot}
                locked={isLockedSlot(combo, slot)}
                lang={lang}
                sel={sel}
                onPickOnly={(c) => pickOnly(slot, c)}
                onSetQty={(c, n) => setChoiceQty(slot, c, n)}
                onSetSize={(c, s) => setChoiceSize(slot, c, s)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border/60 bg-background px-4 py-3">
          <div className="flex items-center gap-1 rounded-full border border-border/70 p-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label={t("order.menu.decrease")}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-7 text-center text-sm font-bold tabular-nums">{qty}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              disabled={qty >= FIELD_LIMITS.lineQty}
              onClick={() => setQty((q) => Math.min(FIELD_LIMITS.lineQty, q + 1))}
              aria-label={t("order.menu.increase")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <Button
            className="flex-1"
            size="lg"
            disabled={!draft || !!unmet}
            onClick={() => draft && !unmet && (onConfirm(draft), onOpenChange(false))}
          >
            {unmet
              ? t("order.combo.chooseSlot", { defaultValue: "Choose your {{slot}}", slot: unmetName })
              : editing
                ? t("order.customize.updateCart", { price: fmtMoney(totalPrice) })
                : t("order.customize.addToCartPrice", { price: fmtMoney(totalPrice) })}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ── One slot ────────────────────────────────────────────────────────────── */

function SlotSection({
  slot,
  locked,
  lang,
  sel,
  onPickOnly,
  onSetQty,
  onSetSize,
}: {
  slot: PublicComboSlot;
  locked: boolean;
  lang: string;
  sel: ComboSelection;
  onPickOnly: (c: PublicComboChoice) => void;
  onSetQty: (c: PublicComboChoice, n: number) => void;
  onSetSize: (c: PublicComboChoice, size: string) => void;
}) {
  const { t } = useTranslation();
  const slotSel = sel[slot.id] ?? {};
  const count = slotCount(slotSel);
  const title = getTranslatedName({ name: slot.name, name_translations: slot.name_translations }, lang);
  const single = slot.max <= 1;
  // A locked slot shows only what is in it; the others offer every choice.
  const choices = locked ? slot.choices.filter((c) => slotSel[c.menu_item_id]) : slot.choices;

  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">{locked ? t("order.combo.included", "Included") : slotHint(slot, t)}</span>
          {!locked && slot.min > 0 ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide",
                count >= slot.min ? "bg-muted text-muted-foreground" : "bg-brand/10 text-brand",
              )}
            >
              {count >= slot.min ? <Check aria-hidden className="size-3" /> : t("order.customize.required")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {choices.map((choice) => {
          const pick = slotSel[choice.menu_item_id];
          const active = !!pick;
          const name = getTranslatedName(choice, lang);
          return (
            <div
              key={choice.menu_item_id}
              className={cn(
                "rounded-xl border transition-colors",
                active ? "border-brand/40 bg-brand/5" : "border-border/70",
              )}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  disabled={locked}
                  aria-pressed={active}
                  onClick={() => (single ? onPickOnly(choice) : onSetQty(choice, active ? 0 : 1))}
                  className="flex min-w-0 flex-1 items-center gap-3 text-start disabled:cursor-default"
                >
                  {choice.image_url ? (
                    <AssetImage
                      asset={assetOf(choice)}
                      legacyUrl={choice.image_url}
                      sizes="80px"
                      className="size-10 shrink-0 rounded-lg"
                    />
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <UtensilsCrossed className="size-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{name}</span>
                    {choice.surcharge > 0 ? (
                      <span className="block text-xs text-muted-foreground tabular-nums">+{fmtMoney(choice.surcharge)}</span>
                    ) : null}
                  </span>
                  {locked ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-muted-foreground">
                      <Lock aria-hidden className="size-3" />×{pick?.qty ?? 0}
                    </span>
                  ) : single ? (
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-brand bg-brand text-brand-foreground" : "border-border",
                      )}
                    >
                      {active && <Check className="size-3.5" />}
                    </span>
                  ) : null}
                </button>
                {!locked && !single ? (
                  <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/70">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full"
                      disabled={!active}
                      onClick={() => onSetQty(choice, (pick?.qty ?? 0) - 1)}
                      aria-label={t("order.combo.less", { defaultValue: "One less {{name}}", name })}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-5 text-center text-xs font-bold tabular-nums">{pick?.qty ?? 0}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full"
                      disabled={count >= slot.max}
                      onClick={() => onSetQty(choice, (pick?.qty ?? 0) + 1)}
                      aria-label={t("order.combo.more", { defaultValue: "One more {{name}}", name })}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Size chips — only when this pick has a real choice of size. */}
              {active && choice.sizes.length > 1 ? (
                <div
                  role="radiogroup"
                  aria-label={t("order.customize.size")}
                  className="flex flex-wrap gap-2 border-t border-border/60 px-3 py-2.5"
                >
                  {/* Smallest first, so the included size leads and upgrades follow. */}
                  {[...choice.sizes].sort((x, y) => x.price - y.price).map((s) => {
                    const on = pick.size === s.label;
                    const included = s.label === choice.included_size_label;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => onSetSize(choice, s.label)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                          on
                            ? "border-brand bg-brand text-brand-foreground shadow-sm"
                            : "border-border/70 bg-card hover:border-brand/40",
                        )}
                      >
                        <span>{displaySize(s.label) ?? t("order.combo.regular", "Regular")}</span>
                        <span className="opacity-80 tabular-nums">
                          {included
                            ? t("order.combo.included", "Included")
                            : s.extra > 0
                              ? `+${fmtMoney(s.extra)}`
                              : t("order.customize.noCharge")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
