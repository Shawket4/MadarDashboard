import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import type { PublicAddonItem, PublicMenuItem } from "@/data/api/generated/models";
import { lineKey, type CartLine } from "./lib";

interface Props {
  item: PublicMenuItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (line: CartLine) => void;
}

export function ItemDetailSheet({ item, open, onOpenChange, onAdd }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);

  // Reset transient config whenever a new item opens.
  const itemId = item?.id;
  useMemo(() => { setSizeId(item?.sizes?.[0]?.id ?? null); setSelected({}); setQty(1); }, [itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosenAddons = useMemo(() => {
    const out: { id: string; name: string; price: number }[] = [];
    for (const slot of item?.addon_slots ?? []) {
      for (const id of selected[slot.id] ?? []) {
        const a = slot.addon_items.find((x) => x.id === id);
        if (a) out.push({ id: a.id, name: getTranslatedName(a as PublicAddonItem, lang), price: a.default_price });
      }
    }
    return out;
  }, [item, selected, lang]);

  if (!item) return null;
  const name = getTranslatedName(item, lang);
  const desc = lang === "ar" ? ((item.description_translations as { ar?: string } | null)?.ar ?? item.description) : item.description;

  const size = item.sizes.find((s) => s.id === sizeId) ?? null;
  const basePrice = size ? size.price_override : item.base_price;

  const toggleAddon = (slotId: string, addonId: string, max: number | null | undefined) => {
    setSelected((prev) => {
      const cur = prev[slotId] ?? [];
      if (cur.includes(addonId)) return { ...prev, [slotId]: cur.filter((x) => x !== addonId) };
      if (max === 1) return { ...prev, [slotId]: [addonId] };
      if (max && cur.length >= max) return prev;
      return { ...prev, [slotId]: [...cur, addonId] };
    });
  };

  const unitPrice = basePrice + chosenAddons.reduce((s, a) => s + a.price, 0);
  const unmetRequired = item.addon_slots.some((slot) => slot.is_required && (selected[slot.id]?.length ?? 0) < (slot.min_selections || 1));

  const add = () => {
    const addonNames = chosenAddons.map((a) => a.name);
    onAdd({
      key: lineKey(item.id, size?.label, addonNames),
      itemId: item.id,
      name,
      sizeLabel: size?.label,
      addons: chosenAddons.map((a) => ({ name: a.name, price: a.price })),
      unitPrice,
      qty,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl p-0">
        {item.image_url ? <img src={item.image_url} alt="" className="h-44 w-full object-cover" /> : null}
        <div className="space-y-5 p-5">
          <SheetHeader className="p-0">
            <SheetTitle className="text-xl">{name}</SheetTitle>
            {desc ? <p className="text-sm text-muted-foreground">{desc}</p> : null}
          </SheetHeader>

          {item.sizes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">{t("publicMenu.size", "Size")}</p>
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((s) => (
                  <button key={s.id} onClick={() => setSizeId(s.id)}
                    className={cn("rounded-full border px-4 py-1.5 text-sm transition-colors", sizeId === s.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                    {s.label} · {fmtMoney(s.price_override)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {item.addon_slots.map((slot) => {
            const label = slot.label ? getTranslatedName({ name: slot.label, name_translations: slot.label_translations }, lang) : t("publicMenu.options", "Options");
            const max = slot.max_selections;
            return (
              <div key={slot.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{label}</p>
                  <span className="text-xs text-muted-foreground">{slot.is_required ? t("publicMenu.required", "Required") : t("publicMenu.optional", "Optional")}{max ? ` · ${t("publicMenu.upTo", "up to")} ${max}` : ""}</span>
                </div>
                <div className="grid gap-2">
                  {slot.addon_items.map((a) => {
                    const checked = (selected[slot.id] ?? []).includes(a.id);
                    return (
                      <button key={a.id} onClick={() => toggleAddon(slot.id, a.id, max)}
                        className={cn("flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors", checked ? "border-primary bg-primary/5" : "hover:bg-muted")}>
                        <span className="flex items-center gap-2">
                          <span className={cn("grid size-4 place-items-center rounded-full border", checked && "border-primary bg-primary text-primary-foreground")}>{checked ? <Plus className="size-2.5 rotate-45" /> : null}</span>
                          {getTranslatedName(a as PublicAddonItem, lang)}
                        </span>
                        {a.default_price > 0 ? <span className="text-muted-foreground">+{fmtMoney(a.default_price)}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3 rounded-full border p-1">
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="size-4" /></Button>
              <span className="w-6 text-center font-semibold tabular">{qty}</span>
              <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={() => setQty((q) => q + 1)}><Plus className="size-4" /></Button>
            </div>
            <Button className="flex-1" size="lg" disabled={unmetRequired} onClick={add}>
              {t("publicMenu.add", "Add")} · {fmtMoney(unitPrice * qty)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
