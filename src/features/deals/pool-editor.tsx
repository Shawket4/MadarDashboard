/**
 * Which items a deal counts: items or whole categories, each optionally at
 * one size ("any size" by default). Controlled, so the pool and the reward
 * pool share it.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FolderTree, Tag, Trash2 } from "lucide-react";

import { Combobox } from "@/components/app/combobox";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sizeLabelText, type MenuOptions } from "@/features/combos/use-menu-options";
import { fmtMoney } from "@/lib/format";

import { emptyEntry, type PoolEntryForm } from "./form-schema";

const ANY = "__any__";

export function PoolEditor({
  value,
  onChange,
  menu,
  errors = [],
  disabled,
  label,
}: {
  value: PoolEntryForm[];
  onChange: (next: PoolEntryForm[]) => void;
  menu: MenuOptions;
  errors?: (string | undefined)[];
  disabled?: boolean;
  label: string;
}) {
  const { t } = useTranslation();
  const patch = (i: number, p: Partial<PoolEntryForm>) => onChange(value.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const itemOptions = useMemo(
    () => menu.items.map((it) => ({ value: it.id, label: it.name, hint: fmtMoney(it.sizes[0]?.price), keywords: menu.categoryName(it.category_id) ?? "" })),
    [menu],
  );

  return (
    <div className="space-y-2">
      <ul aria-label={label} className="space-y-2">
        {value.map((e, i) => {
          const sizes = e.target === "item" ? (menu.item(e.menu_item_id)?.sizes.map((s) => s.label) ?? []) : e.category_id ? menu.categorySizeLabels(e.category_id) : [];
          return (
            <li key={e.key} className="space-y-1 rounded-xl border p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                  value={e.target}
                  onChange={(v) => patch(i, { target: v, menu_item_id: "", category_id: "", size_label: "" })}
                  options={[
                    { value: "item", label: t("combos.choice.item", "Item") },
                    { value: "category", label: t("combos.choice.category", "Category") },
                  ]}
                  disabled={disabled}
                />
                <div className="min-w-0 flex-1 basis-44">
                  {e.target === "item" ? (
                    <Combobox
                      options={itemOptions}
                      value={e.menu_item_id || null}
                      onChange={(v) => patch(i, { menu_item_id: v, size_label: "" })}
                      placeholder={t("combos.choice.pickItem", "Choose an item")}
                      disabled={disabled}
                    />
                  ) : (
                    <Select value={e.category_id || undefined} onValueChange={(v) => patch(i, { category_id: v, size_label: "" })} disabled={disabled}>
                      <SelectTrigger className="h-9 w-full" aria-label={t("combos.choice.pickCategory", "Choose a category")}>
                        <SelectValue placeholder={t("combos.choice.pickCategory", "Choose a category")} />
                      </SelectTrigger>
                      <SelectContent>
                        {menu.categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {sizes.length > 1 ? (
                  <Select value={e.size_label || ANY} onValueChange={(v) => patch(i, { size_label: v === ANY ? "" : v })} disabled={disabled}>
                    <SelectTrigger className="h-9 w-36" aria-label={t("deals.pool.size", "Size")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t("deals.pool.anySize", "Any size")}</SelectItem>
                      {sizes.map((s) => (
                        <SelectItem key={s} value={s}>
                          {sizeLabelText(s, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {!disabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    aria-label={t("deals.pool.remove", "Remove from the list")}
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
              {errors[i] ? (
                <p role="alert" className="text-xs text-destructive">
                  {t(errors[i] as string)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!disabled ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptyEntry("item")])}>
            <Tag className="size-4" /> {t("combos.slots.addItem", "Add an item")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptyEntry("category")])}>
            <FolderTree className="size-4" /> {t("combos.slots.addCategory", "Add a whole category")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
