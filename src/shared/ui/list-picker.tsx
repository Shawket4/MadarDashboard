import * as React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { normalize } from "@/shared/lib/normalize";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";

export interface ListPickerItem {
  id: string;
  /** Primary label, used for the search index */
  label: string;
  /** Optional secondary text (searched too) */
  sublabel?: string | null;
  /** Optional trailing badge component */
  badge?: React.ReactNode;
}

interface ListPickerProps<T extends ListPickerItem> {
  /** Heading shown above the search box */
  heading: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Custom renderer — falls back to label + sublabel */
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Tailwind class for max-height so callers can control the bounding box */
  maxHeight?: string;
}

/**
 * Narrow side-panel list with a normalized search box on top. Used in Recipes
 * (drinks / addons / slot targets), and any other "pick one of many" UI.
 *
 * Why shared? Every page that lets users pick from a long list of entities
 * needs (a) a search, (b) a stable selection model, (c) an empty state.
 * Doing that per page produces inconsistency; doing it once here doesn't.
 */
export function ListPicker<T extends ListPickerItem>({
  heading,
  items,
  selectedId,
  onSelect,
  renderItem,
  searchPlaceholder,
  emptyLabel,
  maxHeight = "max-h-[560px]",
}: ListPickerProps<T>) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items.filter(
      (it) =>
        normalize(it.label).includes(q) ||
        (it.sublabel ? normalize(it.sublabel).includes(q) : false),
    );
  }, [items, query]);

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
      <div className="p-3 border-b bg-muted/30 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {heading}
        </p>
        <div className="relative">
          <Search
            size={13}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder ?? t("common.searchPlaceholder")}
            className="ps-9 h-8 text-sm"
          />
        </div>
      </div>
      <ScrollArea className={cn(maxHeight)}>
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            {emptyLabel ?? t("common.noResults")}
          </p>
        ) : (
          filtered.map((it) => {
            const isSelected = it.id === selectedId;
            return (
              <button
                key={it.id}
                onClick={() => onSelect(it.id)}
                className={cn(
                  "w-full text-start px-4 py-2.5 border-b last:border-0 transition-colors",
                  isSelected
                    ? "bg-accent"
                    : "hover:bg-muted/40",
                )}
              >
                {renderItem ? (
                  renderItem(it, isSelected)
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate">{it.label}</p>
                      {it.badge}
                    </div>
                    {it.sublabel && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {it.sublabel}
                      </p>
                    )}
                  </>
                )}
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
