/**
 * Which menu items count as a staff drink.
 *
 * A searchable multi-select over the org's menu, modelled on
 * `components/app/exclude-items-control` — same Popover + cmdk shape, because a
 * second way of picking menu items is a second set of keyboard behaviours to
 * get wrong. It differs in one respect that matters: this list is not a
 * preference, it is the feature's on switch. An empty list means no item can
 * ever be rung up as a staff drink, so the emptiness is stated in words here
 * rather than left to be inferred from a trigger that reads "0 selected".
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Check, CupSoda, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { getTranslatedName } from "@/lib/translation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useListMenuItems } from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";

export function EligibleItemsControl({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const orgId = useOrgId();
  const [open, setOpen] = React.useState(false);
  // The menu is loaded once the picker is opened, and also whenever there are
  // ids to name: a chip reading a raw uuid is worse than no chip.
  const q = useListMenuItems(
    { org_id: orgId ?? "" },
    { query: { enabled: !!orgId && (open || value.length > 0) } },
  );

  const options = React.useMemo(
    () =>
      (q.data ?? []).map((m) => ({
        value: m.id,
        label: getTranslatedName(
          { name: m.name, name_translations: m.name_translations },
          i18n.language,
        ),
      })),
    [q.data, i18n.language],
  );

  const labelOf = (id: string) => options.find((o) => o.value === id)?.label ?? id;
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" disabled={disabled} className="w-full justify-start">
            <CupSoda aria-hidden className="size-4" />
            {value.length
              ? t("staffPool.itemsChosen", {
                  defaultValue: "{{count}} item counts as a staff drink",
                  defaultValue_other: "{{count}} items count as a staff drink",
                  count: value.length,
                })
              : t("staffPool.itemsNoneChosen", "No items chosen — the pool is off")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="w-72 p-0">
          <p className="border-b bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            {t(
              "staffPool.itemsPickerNote",
              "Only these items can be rung up as a staff drink. Leave the list empty and nobody can ring one up at all.",
            )}
          </p>
          <Command
            filter={(val, search) => {
              const opt = options.find((o) => o.value === val);
              return (opt?.label ?? "").toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <CommandInput placeholder={t("common.search", "Search…")} />
            <CommandList>
              <CommandEmpty>
                {q.isLoading
                  ? t("common.loading", "Loading…")
                  : t("common.noResults", "No results found")}
              </CommandEmpty>
              <CommandGroup heading={t("staffPool.itemsHeading", "Counts as a staff drink")}>
                {options.map((o) => (
                  <CommandItem key={o.value} value={o.value} onSelect={() => toggle(o.value)}>
                    <Check className={cn("size-4", value.includes(o.value) ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1 truncate">{o.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {value.length ? (
            <div className="border-t p-1">
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
                {t("common.clear", "Clear")}
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {value.length ? (
        // Chips, not a count: the list is short by nature and the whole point
        // of the setting is knowing exactly which drinks are on it.
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="outline" className="gap-1 ps-2 pe-1">
              <span className="truncate">{labelOf(id)}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(id)}
                aria-label={t("staffPool.itemRemove", {
                  defaultValue: "Remove {{item}}",
                  item: labelOf(id),
                })}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X aria-hidden className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
