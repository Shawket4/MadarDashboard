import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { normalize } from "@/lib/normalize";

interface Item { id: string; label: string; hint?: string }

interface Props {
  items: Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
}

/** Searchable, scrollable master list for the recipes master-detail layout. */
export function MasterList({ items, selectedId, onSelect, loading, searchPlaceholder, emptyText }: Props) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = normalize(q);
    return n ? items.filter((i) => normalize(i.label).includes(n)) : items;
  }, [items, q]);

  return (
    <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-xl border bg-card lg:max-h-[calc(100vh-12rem)]">
      <div className="relative border-b bg-muted/40 p-2">
        <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder ?? t("common.search", "Search…")}
          className="h-9 ps-8"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {loading ? (
          <div className="space-y-1.5 p-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {emptyText ?? t("common.noResults", "No results found")}
          </p>
        ) : (
          filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => onSelect(i.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                i.id === selectedId
                  ? "bg-brand/10 font-semibold text-brand"
                  : "text-foreground hover:bg-muted/60",
              )}
            >
              <span className="min-w-0 truncate">{i.label}</span>
              {i.hint ? (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{i.hint}</span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
