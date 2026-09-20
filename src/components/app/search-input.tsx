import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The search box over a server-searched list: a magnifier and an input. It is
 * controlled and knows nothing of debouncing — pair it with `useListSearch`.
 * Width is the caller's (`className`), since toolbars differ.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Also the accessible name — a search box has no visible label. */
  placeholder: string;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <div data-slot="search-input" className={cn("relative w-full", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn("ps-9", inputClassName)}
      />
    </div>
  );
}
