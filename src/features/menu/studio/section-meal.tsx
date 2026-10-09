/**
 * Menu Studio › "Make it a meal" (C14): point this item at a combo and the
 * slot it fills. On the till, a line of this item then offers "Make it a meal
 * +X", which turns it into that combo with the item already in its slot.
 *
 * It applies at once through `PUT /menu-items/{id}/meal` (like the base
 * picker), outside the studio's batched save: it changes no field of the item.
 * Only slots whose choices admit this item (by id or by its category) are
 * offered, and the "+X" is shown before applying.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGetMenuItemQueryKey, useGetMenuItem } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import { useAuthz } from "@/data/authz/use-authz";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { setItemMeal, useCombo, useCombos } from "@/features/combos/api";
import type { MealTarget } from "@/features/combos/types";
import { mealDelta, slotsAdmitting } from "@/features/combos/meal";
import { useMenuOptions } from "@/features/combos/use-menu-options";
import { Cap } from "@/generated/capabilities";

const NONE = "__none__";

export function SectionMeal({ itemId, categoryId }: { itemId: string; categoryId: string | null }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const canEdit = useAuthz().can(Cap.menuCombosEdit);

  const itemQ = useGetMenuItem(itemId, { query: { enabled: !!itemId } });
  const current: MealTarget = itemQ.data?.meal ?? null;
  const combosQ = useCombos({ per_page: 200 });
  const menu = useMenuOptions();
  const item = menu.item(itemId);

  const [comboId, setComboId] = useState<string>("");
  const [slotId, setSlotId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setComboId(current?.combo_id ?? "");
    setSlotId(current?.slot_id ?? "");
  }, [current?.combo_id, current?.slot_id]);

  const comboQ = useCombo(comboId, {}, { enabled: !!comboId });
  const me = useMemo(() => ({ id: itemId, category_id: categoryId }), [itemId, categoryId]);
  const slots = useMemo(() => (comboQ.data ? slotsAdmitting(comboQ.data, me) : []), [comboQ.data, me]);
  // A combo with exactly one slot for this item needs no second choice.
  useEffect(() => {
    if (comboId && slots.length === 1 && slotId !== slots[0].id) setSlotId(slots[0].id ?? "");
  }, [comboId, slots, slotId]);

  const delta = comboQ.data && slotId && item ? mealDelta(comboQ.data, slotId, item, (id) => menu.item(id)) : null;
  const dirty = (current?.combo_id ?? "") !== comboId || (current?.slot_id ?? "") !== slotId;
  const combos = combosQ.data?.data ?? [];

  const apply = async (target: MealTarget) => {
    setBusy(true);
    try {
      await setItemMeal(itemId, target);
      toast.success(target ? t("combos.meal.saved", "Make it a meal is set") : t("combos.meal.cleared", "Make it a meal is off"));
      void queryClient.invalidateQueries({ queryKey: getGetMenuItemQueryKey(itemId) });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // A combo can't be "made a meal" (COMBO_NESTED); its slots live in the combo editor.
  if (itemQ.data?.kind === "combo") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm">
        <span className="text-muted-foreground">{t("combos.meal.isCombo", "This item is a combo. Its slots and prices are set in the combo editor.")}</span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/menu/combos/$comboId" params={{ comboId: itemId }}>
            {t("combos.meal.openEditor", "Open the combo editor")}
            <ArrowRight aria-hidden className="size-3.5 rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    );
  }

  if (!combosQ.isLoading && combos.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <UtensilsCrossed aria-hidden className="size-4" />
          {t("combos.meal.noCombos", "No combos yet. Create one first, then point this item at it.")}
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/menu/combos">
            {t("combos.title", "Combos")}
            <ArrowRight aria-hidden className="size-3.5 rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="meal-combo">{t("combos.meal.combo", "Combo")}</Label>
          <Select
            value={comboId || NONE}
            onValueChange={(v) => {
              setComboId(v === NONE ? "" : v);
              setSlotId("");
            }}
            disabled={!canEdit || busy}
          >
            <SelectTrigger id="meal-combo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t("combos.meal.none", "Not offered")}</SelectItem>
              {combos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {getTranslatedName(c, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {comboId ? (
          <div className="space-y-1.5">
            <Label htmlFor="meal-slot">{t("combos.meal.slot", "Fills the slot")}</Label>
            <Select value={slotId || undefined} onValueChange={setSlotId} disabled={!canEdit || busy || slots.length === 0}>
              <SelectTrigger id="meal-slot" className="w-full">
                <SelectValue placeholder={comboQ.isLoading ? t("common.loading", "Loading…") : t("combos.meal.pickSlot", "Choose a slot")} />
              </SelectTrigger>
              <SelectContent>
                {slots.map((s) => (
                  <SelectItem key={s.id ?? s.name} value={s.id ?? ""}>
                    {getTranslatedName(s, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!comboQ.isLoading && comboQ.data && slots.length === 0 ? (
              <p role="alert" className="text-xs text-destructive">
                {t("errors.codes.MEAL_TARGET_INVALID", "That combo has no slot for this item.")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {delta !== null ? (
        <p className="rounded-lg bg-secondary/60 px-3 py-2 text-sm">
          {t("combos.meal.preview", { defaultValue: "The till offers: Make it a meal {{delta}}", delta: fmtMoney(delta, { signed: true }) })}
        </p>
      ) : null}

      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={!dirty || busy || (!!comboId && !slotId)} loading={busy} onClick={() => void apply(comboId && slotId ? { combo_id: comboId, slot_id: slotId } : null)}>
            {comboId ? t("combos.meal.apply", "Apply") : t("combos.meal.turnOff", "Turn off")}
          </Button>
          {dirty ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setComboId(current?.combo_id ?? "");
                setSlotId(current?.slot_id ?? "");
              }}
            >
              {t("combos.discard", "Discard")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
