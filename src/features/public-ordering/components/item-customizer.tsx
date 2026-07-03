import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Minus, Plus, Search, UtensilsCrossed, X } from "lucide-react";

import type { DeliveryMenuItem } from "@/data/api/generated/models/deliveryMenuItem";
import type { DeliveryAddonOption } from "@/data/api/generated/models/deliveryAddonOption";
import type { DeliveryOptionalField } from "@/data/api/generated/models/deliveryOptionalField";
import type { DeliveryModifierGroup } from "@/data/api/generated/models/deliveryModifierGroup";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName, getTranslatedDescription } from "@/lib/translation";
import i18n from "@/i18n";

import type { CartLine, SelectedAddon, SelectedOptional } from "../types";
import { itemBasePrice, lineUnitPrice, newUid } from "../utils";
import { FIELD_LIMITS } from "../limits";

interface ItemCustomizerProps {
  item: DeliveryMenuItem | null;
  /** Org-wide global addon catalog (same options on EVERY item, POS model). */
  addons: DeliveryAddonOption[];
  /** When editing an existing line, its current configuration. */
  editing?: CartLine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (line: CartLine) => void;
}

/**
 * `milk_type` is a single-select swap (radio chips, optional, re-tap clears); every
 * other addon type (`coffee_type`, `extra`, and any custom group) is multi-select
 * with qty steppers. The offered groups are derived from the item's own configured
 * addons (see `groups` below) — no hard-coded type list — so custom modifier groups
 * appear. Addon availability/price is resolved server-side per channel.
 */
const SINGLE_SELECT_TYPES = new Set<string>(["milk_type"]);

/** Map of addon_item_id → quantity (single-select types hold at most one key). */
type AddonSelections = Record<string, number>;

export function ItemCustomizer({
  item,
  addons,
  editing,
  open,
  onOpenChange,
  onConfirm,
}: ItemCustomizerProps) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const [size, setSize] = useState<string | null>(null);
  const [selections, setSelections] = useState<AddonSelections>({});
  const [optionals, setOptionals] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [addonQuery, setAddonQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Per-item allowlist set. Empty = item has no configuration.
  const allowedSet = useMemo(
    () => new Set(item?.allowed_addon_ids ?? []),
    [item],
  );

  // Default view: only the item's configured addons (nothing when allowedSet is empty).
  // "Show all" bypasses the filter and shows the full available catalog.
  //
  // Groups are derived DYNAMICALLY from whatever addon types the item actually
  // offers — not a hard-coded list — so custom modifier groups (beyond
  // milk/coffee/extra) surface too. milk_type/coffee_type keep their swap ordering
  // and 'extra' sorts last; any other type slots in between, alphabetically.
  const groups = useMemo(() => {
    const byType = new Map<string, DeliveryAddonOption[]>();
    for (const a of addons) {
      if (!a.is_available) continue;
      if (!showAll && !allowedSet.has(a.addon_item_id)) continue;
      const list = byType.get(a.type) ?? [];
      list.push(a);
      byType.set(a.type, list);
    }
    const rank = (type: string) =>
      type === "milk_type" ? 0 : type === "coffee_type" ? 1 : type === "extra" ? 3 : 2;
    return [...byType.keys()]
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((type) => ({ type, options: byType.get(type)! }));
  }, [addons, allowedSet, showAll]);

  // Unified per-item MODIFIER GROUPS from the server (menu-unification). When
  // present they are the authoritative default view — group names, min/max/
  // required constraints and channel-effective prices come from the backend.
  // Options are mapped onto the flat-catalog shape (stable ids: option_id ==
  // addon_item_id) so selection/pricing/submission stay unchanged. "Show all"
  // still flips to the flat full-catalog view.
  const serverGroups = useMemo(() => {
    const raw: DeliveryModifierGroup[] = item?.modifier_groups ?? [];
    const byId = new Map(addons.map((a) => [a.addon_item_id, a]));
    return raw
      .map((g) => ({
        key: g.group_id,
        title: getTranslatedName(
          { name: g.name, name_translations: g.name_translations },
          lang,
        ),
        single: g.selection_type === "single" || g.max_selections === 1,
        min: Math.max(g.min_selections, g.is_required ? 1 : 0),
        max: g.max_selections ?? null,
        type: g.addon_type ?? "extra",
        options: g.options.map(
          (o): DeliveryAddonOption => ({
            addon_item_id: o.option_id,
            name: o.name,
            name_translations: o.name_translations,
            type: byId.get(o.option_id)?.type ?? g.addon_type ?? "extra",
            price: o.price,
            is_available: true,
          }),
        ),
      }))
      .filter((g) => g.options.length > 0);
  }, [item, addons, lang]);
  const useServerGroups = serverGroups.length > 0 && !showAll;

  // Groups whose min/max constraint the current selection breaks — the confirm
  // CTA stays disabled until every group is satisfied.
  const groupViolations = useMemo(() => {
    if (!useServerGroups) return [];
    return serverGroups.filter((g) => {
      const selected = g.options.reduce(
        (n, o) => n + (selections[o.addon_item_id] ?? 0),
        0,
      );
      return selected < g.min || (g.max != null && selected > g.max);
    });
  }, [useServerGroups, serverGroups, selections]);

  // Milk/coffee are swap selections (never searched). The generic "extra" add-ons
  // are the searchable list — the search filters ONLY those.
  const swapGroups = useMemo(() => groups.filter((g) => g.type !== "extra"), [groups]);
  const extraGroup = useMemo(() => groups.find((g) => g.type === "extra") ?? null, [groups]);
  const showAddonSearch = (extraGroup?.options.length ?? 0) > 5;

  const filteredExtraOptions = useMemo(() => {
    if (!extraGroup) return [];
    const q = addonQuery.trim().toLowerCase();
    if (!q) return extraGroup.options;
    return extraGroup.options.filter(
      (o) =>
        getTranslatedName(o, lang).toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q),
    );
  }, [extraGroup, addonQuery, lang]);

  // Swap "base" price per swap-type, mirroring the POS sheet (_initBaseMilk /
  // _adjustedPrice): the recipe's default milk is already included, so picking it
  // costs nothing; swapping to a pricier milk costs only the delta (floored 0).
  // coffee_type has no recipe default, so its base is 0 → full price. ESTIMATE
  // ONLY — the cart still sends {addon_item_id, quantity} and the backend prices
  // the true swap delta from the recipe at intake.
  const baseSwapPrices = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    const dm = item?.default_milk_addon_id;
    if (dm != null) {
      const base = addons.find((a) => a.addon_item_id === dm);
      if (base) out.milk_type = base.price;
    }
    return out;
  }, [item, addons]);

  const swapAdjustedPrice = useCallback(
    (a: DeliveryAddonOption): number =>
      a.type === "milk_type" || a.type === "coffee_type"
        ? Math.max(0, a.price - (baseSwapPrices[a.type] ?? 0))
        : a.price,
    [baseSwapPrices],
  );

  // (Re)initialize whenever a fresh item/edit is opened.
  useEffect(() => {
    if (!open || !item) return;
    setAddonQuery("");
    setShowAll(false);
    if (editing) {
      setSize(editing.size_label);
      const sel: AddonSelections = {};
      for (const a of editing.addons) sel[a.addon_item_id] = a.quantity;
      setSelections(sel);
      setOptionals(new Set(editing.optionals.map((o) => o.id)));
      setQty(editing.quantity);
      setNotes(editing.notes ?? "");
    } else {
      setSize(item.sizes.length > 0 ? item.sizes[0].label : null);
      // Pre-select the item's base milk (mirrors the POS _initBaseMilk): only for
      // a NEW line, only when the item declares a default and a single-select
      // milk_type option with that id actually exists in the global catalog. The
      // customer can re-tap to change/clear it; the server prices the swap delta.
      const defaultMilk = item.default_milk_addon_id;
      const hasMilkOption =
        defaultMilk != null &&
        addons.some(
          (a) =>
            a.addon_item_id === defaultMilk &&
            SINGLE_SELECT_TYPES.has(a.type) &&
            a.is_available,
        );
      setSelections(hasMilkOption ? { [defaultMilk!]: 1 } : {});
      setOptionals(new Set());
      setQty(1);
      setNotes("");
    }
  }, [open, item, editing, addons]);

  // Optionals visible for the current size (size_label null = always; else match).
  const visibleOptionals = useMemo<DeliveryOptionalField[]>(
    () => (item ? item.optionals.filter((o) => !o.size_label || o.size_label === size) : []),
    [item, size],
  );

  // Single-select: picking one clears every sibling in `clearIds` (the group's
  // options for a server group; every option of the type for the legacy view),
  // so a hidden, previously-picked option can't linger; re-tapping the active
  // option clears it (optional swap).
  const pickSingleAmong = (addonId: string, clearIds: readonly string[]) =>
    setSelections((prev) => {
      const next = { ...prev };
      const wasActive = (prev[addonId] ?? 0) > 0;
      for (const id of clearIds) delete next[id];
      if (!wasActive) next[addonId] = 1;
      return next;
    });
  const pickSingle = (addonId: string, type: string) =>
    pickSingleAmong(
      addonId,
      addons.filter((a) => a.type === type).map((a) => a.addon_item_id),
    );

  // Multi-select (coffee_type / extra): qty stepper, 0 removes the option.
  const setMultiQty = (addonId: string, n: number) =>
    setSelections((prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[addonId];
      else next[addonId] = Math.min(FIELD_LIMITS.addonQty, n);
      return next;
    });

  const toggleOptional = (id: string) =>
    setOptionals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Build the would-be cart line (for live estimate + confirm). The surcharge
  // shown is an ESTIMATE; the backend computes the true price (incl. the milk /
  // coffee swap delta) and the confirmation shows authoritative totals.
  const draft = useMemo<CartLine | null>(() => {
    if (!item) return null;
    const optionById = new Map(addons.map((a) => [a.addon_item_id, a]));
    const selected: SelectedAddon[] = [];
    for (const [addonId, n] of Object.entries(selections)) {
      if (n <= 0) continue;
      const opt = optionById.get(addonId);
      if (!opt) continue;
      selected.push({
        addon_item_id: addonId,
        quantity: n,
        name: opt.name,
        name_translations: opt.name_translations,
        price: swapAdjustedPrice(opt),
        type: opt.type,
      });
    }
    const opts: SelectedOptional[] = visibleOptionals
      .filter((o) => optionals.has(o.id))
      .map((o) => ({ id: o.id, name: o.name, name_translations: o.name_translations, price: o.price }));

    return {
      uid: editing?.uid ?? newUid(),
      item,
      size_label: size,
      base_price: itemBasePrice(item, size),
      quantity: qty,
      addons: selected,
      optionals: opts,
      notes: notes.trim() || null,
    };
  }, [item, addons, selections, visibleOptionals, optionals, size, qty, notes, editing, swapAdjustedPrice]);

  if (!item) return null;

  const unitPrice = draft ? lineUnitPrice(draft) : 0;
  const totalPrice = unitPrice * qty;
  const description = getTranslatedDescription(item, lang);
  const hasSizes = item.sizes.length > 0;
  const fromPrice = hasSizes ? Math.min(...item.sizes.map((s) => s.price)) : item.price;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent showHandle={false} className="mx-auto max-h-[92dvh] max-w-[480px]">
        {/* Scrollable body — full-bleed hero, then configuration. no-scrollbar so the
            hero image reaches both edges (the scrollbar gutter was insetting it). */}
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          <div className="relative">
            {/* Drag handle floats over the image (no separate background strip). */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-2.5 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/70"
            />
            {item.image_url ? (
              <img
                src={item.image_url}
                alt=""
                className="h-52 w-full rounded-t-lg object-cover sm:h-56"
                loading="lazy"
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
            {/* Title + base price */}
            <div className="text-start">
              <div className="flex items-baseline justify-between gap-3">
                <DrawerTitle className="font-serif text-xl leading-tight">
                  {getTranslatedName(item, lang)}
                </DrawerTitle>
                <span className="shrink-0 text-sm font-medium text-muted-foreground">
                  {hasSizes
                    ? t("order.menu.from", { price: fmtMoney(fromPrice) })
                    : fmtMoney(fromPrice)}
                </span>
              </div>
              {description ? (
                <DrawerDescription className="mt-1 leading-relaxed">{description}</DrawerDescription>
              ) : (
                <DrawerDescription className="sr-only">
                  {t("order.menu.customize")}
                </DrawerDescription>
              )}
            </div>

            {/* Sizes */}
            {item.sizes.length > 0 && (
              <Section title={t("order.customize.size")} required>
                <div className="flex flex-wrap gap-2">
                  {item.sizes.map((s) => (
                    <Chip key={s.label} active={size === s.label} onClick={() => setSize(s.label)}>
                      <span>{s.label}</span>
                      <span className="text-xs opacity-80">{fmtMoney(s.price)}</span>
                    </Chip>
                  ))}
                </div>
              </Section>
            )}

            {/* "Show all add-ons" — always present; default view is the item's configured set (or nothing) */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {showAll
                  ? t("order.customize.showConfigured", "Show customized options")
                  : t("order.customize.showAllAddons", "Show all add-ons")}
              </button>
            </div>

            {/* Unified modifier groups (server-authoritative constraints) */}
            {useServerGroups &&
              serverGroups.map((g) => (
                <AddonGroupSection
                  key={g.key}
                  type={g.type}
                  title={g.title}
                  single={g.single}
                  rule={
                    g.min > 0
                      ? t("order.customize.required", "Required")
                      : g.single
                        ? t("order.customize.pickOne")
                        : t("order.customize.optional")
                  }
                  options={g.options}
                  lang={lang}
                  selections={selections}
                  priceOf={swapAdjustedPrice}
                  onPickSingle={(addonId) =>
                    pickSingleAmong(
                      addonId,
                      g.options.map((o) => o.addon_item_id),
                    )
                  }
                  onSetQty={setMultiQty}
                />
              ))}

            {/* Milk / coffee — swap selections (never searched) */}
            {!useServerGroups &&
              swapGroups.map(({ type, options }) => (
                <AddonGroupSection
                  key={type}
                  type={type}
                  options={options}
                  lang={lang}
                  selections={selections}
                  priceOf={swapAdjustedPrice}
                  onPickSingle={(addonId) => pickSingle(addonId, type)}
                  onSetQty={setMultiQty}
                />
              ))}

            {/* Extra add-ons — searchable */}
            {!useServerGroups && extraGroup && (
              <div className="space-y-3">
                {showAddonSearch && (
                  <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={addonQuery}
                      onChange={(e) => setAddonQuery(e.target.value)}
                      placeholder={t("order.customize.searchAddons", "Search add-ons")}
                      className="ps-9"
                      inputMode="search"
                    />
                  </div>
                )}
                {filteredExtraOptions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("order.customize.noAddons", "No add-ons match your search.")}
                  </p>
                ) : (
                  <AddonGroupSection
                    type="extra"
                    options={filteredExtraOptions}
                    lang={lang}
                    selections={selections}
                    priceOf={swapAdjustedPrice}
                    onPickSingle={(addonId) => pickSingle(addonId, "extra")}
                    onSetQty={setMultiQty}
                  />
                )}
              </div>
            )}

            {/* Optionals */}
            {visibleOptionals.length > 0 && (
              <Section title={t("order.customize.extras")}>
                <div className="space-y-2">
                  {visibleOptionals.map((o) => {
                    const active = optionals.has(o.id);
                    return (
                      <OptionRow
                        key={o.id}
                        active={active}
                        label={getTranslatedName(o, lang)}
                        price={o.price}
                        onClick={() => toggleOptional(o.id)}
                      />
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Notes */}
            <Section title={t("order.customize.notes")}>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("order.customize.notesPlaceholder")}
                maxLength={FIELD_LIMITS.lineNotes}
              />
            </Section>
          </div>
        </div>

        {/* Sticky footer: qty stepper + add/update. No required addon validation —
            the global catalog is entirely optional, like the POS sheet. */}
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
            disabled={!draft || groupViolations.length > 0}
            onClick={() => draft && (onConfirm(draft), onOpenChange(false))}
          >
            {groupViolations.length > 0
              ? `${groupViolations[0].title}: ${t("order.customize.required", "Required")}`
              : editing
                ? t("order.customize.updateCart", { price: fmtMoney(totalPrice) })
                : t("order.customize.addToCartPrice", { price: fmtMoney(totalPrice) })}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function AddonGroupSection({
  type,
  options,
  lang,
  selections,
  priceOf,
  onPickSingle,
  onSetQty,
  title: titleOverride,
  single: singleOverride,
  rule: ruleOverride,
}: {
  type: string;
  options: DeliveryAddonOption[];
  lang: string;
  selections: AddonSelections;
  priceOf: (opt: DeliveryAddonOption) => number;
  onPickSingle: (addonId: string) => void;
  onSetQty: (addonId: string, n: number) => void;
  /** Server-group overrides (unified model): authored name + constraints. */
  title?: string;
  single?: boolean;
  rule?: string;
}) {
  const { t } = useTranslation();
  const single = singleOverride ?? SINGLE_SELECT_TYPES.has(type);
  const title =
    titleOverride ?? t(`order.customize.addonType.${type}`, addonTypeFallback(type));
  const rule =
    ruleOverride ??
    (single ? t("order.customize.pickOne") : t("order.customize.optional"));

  return (
    <Section title={title} rule={rule}>
      <div className={cn(single ? "flex flex-wrap gap-2" : "space-y-2")}>
        {options.map((opt) => {
          const qn = selections[opt.addon_item_id] ?? 0;
          const active = qn > 0;
          const price = priceOf(opt);
          if (single) {
            return (
              <Chip
                key={opt.addon_item_id}
                active={active}
                onClick={() => onPickSingle(opt.addon_item_id)}
              >
                <span>{getTranslatedName(opt, lang)}</span>
                {price > 0 && <span className="text-xs opacity-80">+{fmtMoney(price)}</span>}
              </Chip>
            );
          }
          return (
            <AddonQtyRow
              key={opt.addon_item_id}
              option={opt}
              price={price}
              lang={lang}
              qty={qn}
              onIncrease={() => onSetQty(opt.addon_item_id, qn + 1)}
              onDecrease={() => onSetQty(opt.addon_item_id, qn - 1)}
              onToggle={() => onSetQty(opt.addon_item_id, qn > 0 ? 0 : 1)}
            />
          );
        })}
      </div>
    </Section>
  );
}

function AddonQtyRow({
  option,
  price,
  lang,
  qty,
  onIncrease,
  onDecrease,
  onToggle,
}: {
  option: DeliveryAddonOption;
  price: number;
  lang: string;
  qty: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const active = qty > 0;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        active ? "border-brand/40 bg-brand/5" : "border-border/70",
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-start"
        onClick={onToggle}
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md border",
            active ? "border-brand bg-brand text-brand-foreground" : "border-border",
          )}
        >
          {active && <Check className="size-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{getTranslatedName(option, lang)}</span>
        </span>
      </button>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {price > 0 ? `+${fmtMoney(price)}` : t("order.customize.noCharge")}
      </span>
      {active && (
        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/70">
          <Button
            variant="ghost"
            size="icon-xs"
            className="rounded-full"
            onClick={onDecrease}
            aria-label={t("order.menu.decrease")}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-5 text-center text-xs font-bold tabular-nums">{qty}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="rounded-full"
            onClick={onIncrease}
            aria-label={t("order.menu.increase")}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function OptionRow({
  active,
  label,
  price,
  onClick,
}: {
  active: boolean;
  label: string;
  price: number;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-colors",
        active ? "border-brand/40 bg-brand/5" : "border-border/70 hover:border-brand/30",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border",
          active ? "border-brand bg-brand text-brand-foreground" : "border-border",
        )}
      >
        {active && <Check className="size-3.5" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {price > 0 ? `+${fmtMoney(price)}` : t("order.customize.noCharge")}
      </span>
    </button>
  );
}

function Section({
  title,
  required,
  rule,
  children,
}: {
  title: string;
  required?: boolean;
  rule?: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold">{title}</h3>
        <div className="flex items-center gap-2 text-[11px]">
          {rule && <span className="text-muted-foreground">{rule}</span>}
          {required && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-brand">
              {t("order.customize.required")}
            </span>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
        active
          ? "border-brand bg-brand text-brand-foreground shadow-sm"
          : "border-border/70 bg-card hover:border-brand/40",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

/** Humanize an unknown addon type when no i18n key exists (e.g. "milk_type" → "Milk"). */
function addonTypeFallback(type: string): string {
  const base = type.endsWith("_type") ? type.slice(0, -"_type".length) : type;
  return base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
