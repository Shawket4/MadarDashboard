import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { normalize } from "@/lib/normalize";

interface Item { id: string; label: string }

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
    <div className="flex max-h-[70vh] flex-col rounded-xl border lg:max-h-[calc(100vh-12rem)]">
      <div className="relative border-b p-2">
        <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder ?? t("common.search", "Search…")} className="h-9 ps-8" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {loading ? (
          <div className="space-y-1.5 p-1">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">{emptyText ?? t("common.noResults", "No results found")}</p>
        ) : (
          filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => onSelect(i.id)}
              className={cn(
                "w-full truncate rounded-md px-3 py-2 text-start text-sm transition-colors",
                i.id === selectedId ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {i.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
