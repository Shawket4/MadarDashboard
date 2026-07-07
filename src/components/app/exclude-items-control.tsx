import * as React from "react";
import { useTranslation } from "react-i18next";
import { Check, ListFilter } from "lucide-react";

import { cn } from "@/lib/utils";
import { getTranslatedName } from "@/lib/translation";
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

const storageKey = (orgId: string) => `madar.excluded-line-items.${orgId}`;

/**
 * Menu item / bundle ids excluded from the "Items Sold" KPIs, persisted
 * per-org so the preference survives sessions. Server-side the exclusion
 * touches ONLY the units-sold aggregates — never revenue or order counts.
 */
export function useExcludedItems(): [string[], (ids: string[]) => void] {
  const orgId = useOrgId();
  const [ids, setIds] = React.useState<string[]>(() => {
    if (!orgId) return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey(orgId)) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  // Re-read when the org changes (org switcher).
  React.useEffect(() => {
    if (!orgId) return;
    try {
      setIds(JSON.parse(localStorage.getItem(storageKey(orgId)) ?? "[]") as string[]);
    } catch {
      setIds([]);
    }
  }, [orgId]);

  const update = React.useCallback(
    (next: string[]) => {
      setIds(next);
      if (orgId) localStorage.setItem(storageKey(orgId), JSON.stringify(next));
    },
    [orgId],
  );

  return [ids, update];
}

/** Joined form for the `exclude_items` query param; undefined when empty. */
export function excludeItemsParam(ids: string[]): string | undefined {
  return ids.length ? ids.join(",") : undefined;
}

/**
 * Compact funnel button + searchable multi-select of menu items, meant to sit
 * inside a StatCard's action slot. Active exclusions show as a count badge.
 */
export function ExcludeItemsControl({
  excluded,
  onChange,
}: {
  excluded: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t, i18n } = useTranslation();
  const orgId = useOrgId();
  const [open, setOpen] = React.useState(false);
  // Lazy: the menu list only loads once the popover is opened.
  const q = useListMenuItems({ org_id: orgId ?? "" }, { query: { enabled: !!orgId && open } });

  const options = React.useMemo(
    () =>
      (q.data ?? []).map((m) => ({
        value: m.id,
        label: getTranslatedName({ name: m.name, name_translations: m.name_translations }, i18n.language),
      })),
    [q.data, i18n.language],
  );

  const toggle = (id: string) =>
    onChange(excluded.includes(id) ? excluded.filter((x) => x !== id) : [...excluded, id]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("analytics.excludeItems", "Exclude items from this count")}
          className={cn("size-6 text-muted-foreground", excluded.length && "text-info")}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="relative">
            <ListFilter className="size-3.5" />
            {excluded.length ? (
              <span className="absolute -end-2 -top-2 grid size-3.5 place-items-center rounded-full bg-info text-[9px] font-bold leading-none text-info-foreground">
                {excluded.length}
              </span>
            ) : null}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-64 p-0" onClick={(e) => e.stopPropagation()}>
        {/* Scope disclosure: users must know this bends ONE count, not the books. */}
        <p className="border-b bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {t(
            "analytics.excludeScopeNote",
            "Hides items from the Items Sold count only. Revenue, orders, and all other figures always include every item.",
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
              {q.isLoading ? t("common.loading", "Loading…") : t("common.noResults", "No results found")}
            </CommandEmpty>
            <CommandGroup heading={t("analytics.excludedFromCount", "Excluded from Items Sold")}>
              {options.map((o) => (
                <CommandItem key={o.value} value={o.value} onSelect={() => toggle(o.value)}>
                  <Check className={cn("size-4", excluded.includes(o.value) ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {excluded.length ? (
          <div className="border-t p-1">
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
              {t("common.clear", "Clear")}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
