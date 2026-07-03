import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Package, Sliders } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { MasterList } from "./master-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useListAddonSlots, useListMenuItems, useListOptionalFields,
} from "@/data/api/generated/api";
import type { AddonSlot } from "@/data/api/generated/models";
import { getTranslatedName } from "@/lib/translation";
import { fmtMoney } from "@/lib/format";

/**
 * Slots & optionals are authored in the MENU STUDIO now (Modifiers + Options
 * tabs on the unified model) — this tab keeps a read-only summary per item
 * (served by the compat views) with a deep link into the Studio. The legacy
 * write endpoints it used were retired by the menu unification.
 */
export function SlotsOptionalsTab({ orgId }: { orgId: string }) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  const items = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId } });
  const list = useMemo(() => items.data ?? [], [items.data]);
  const tname = (n: { name: string; name_translations?: unknown }) => getTranslatedName(n, i18n.language);

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr]">
      <MasterList
        items={list.map((m) => ({ id: m.id, label: tname(m) }))}
        selectedId={selected}
        onSelect={setSelected}
        loading={items.isLoading}
        searchPlaceholder={t("recipes.searchItems", "Search items…")}
        emptyText={t("recipes.noItems", "No items")}
      />
      {selected ? <Detail key={selected} itemId={selected} /> : (
        <div className="rounded-xl border">
          <EmptyState
            icon={Sliders}
            title={t("recipes.selectDrink", "Select an item")}
            description={t("recipes.selectDrinkHint", "Pick an item to review its slots & optionals")}
          />
        </div>
      )}
    </div>
  );
}

function Detail({ itemId }: { itemId: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const slots = useListAddonSlots(itemId, { query: { enabled: !!itemId } });
  const optionals = useListOptionalFields(itemId, { query: { enabled: !!itemId } });

  const slotLabel = (s: AddonSlot) => {
    const ar = (s.label_translations as { ar?: string } | undefined)?.ar;
    return (i18n.language.startsWith("ar") && ar) ? ar : (s.label || t(`menu.addonTypes.${s.addon_type}`, s.addon_type));
  };

  const openStudio = (tab: "modifiers" | "options") =>
    void navigate({ to: "/menu/items/$itemId", params: { itemId }, search: { tab } });

  const slotList = Array.isArray(slots.data) ? slots.data : [];
  const optList = Array.isArray(optionals.data) ? optionals.data : [];

  return (
    <div className="space-y-4">
      {/* Modifier groups (read-only) */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sliders className="size-4 text-muted-foreground" />
              {t("recipes.slots.title", "Add-on slots")}
            </h2>
            <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">
              {t("recipes.slots.movedHint", "Modifier groups are managed in the Menu Studio now.")}
            </p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => openStudio("modifiers")}>
            {t("recipes.slots.editInStudio", "Edit in Menu Studio")} <ArrowRight className="size-4" />
          </Button>
        </div>
        {slotList.length === 0 ? (
          <EmptyState
            className="rounded-none border-0 py-8"
            icon={Sliders}
            title={t("recipes.slots.empty", "No add-on slots")}
            description={t("recipes.slots.emptyStudioHint", "Attach modifier groups from the Menu Studio.")}
          />
        ) : (
          <div className="divide-y divide-border">
            {slotList.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{slotLabel(s)}</p>
                  <p className="text-xs text-muted-foreground">{s.addon_type}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {s.is_required ? <Badge variant="secondary">{t("common.required", "Required")}</Badge> : null}
                  <Badge variant="outline" className="tabular">
                    {s.min_selections}–{s.max_selections ?? "∞"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optionals (read-only) */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Package className="size-4 text-muted-foreground" />
              {t("recipes.optionals.title", "Optional fields")}
            </h2>
            <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">
              {t("recipes.optionals.movedHint", "Priced options are managed in the Menu Studio now.")}
            </p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => openStudio("options")}>
            {t("recipes.slots.editInStudio", "Edit in Menu Studio")} <ArrowRight className="size-4" />
          </Button>
        </div>
        {optList.length === 0 ? (
          <EmptyState
            className="rounded-none border-0 py-8"
            icon={Package}
            title={t("recipes.optionals.empty", "No optional fields")}
            description={t("recipes.optionals.emptyStudioHint", "Add priced options from the Menu Studio.")}
          />
        ) : (
          <div className="divide-y divide-border">
            {optList.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{getTranslatedName(o, i18n.language)}</p>
                  {o.size_label ? <p className="text-xs text-muted-foreground">{o.size_label}</p> : null}
                </div>
                <span className="shrink-0 text-sm font-medium tabular text-muted-foreground">
                  {o.price > 0 ? fmtMoney(o.price) : t("order.customize.noCharge", "No charge")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
