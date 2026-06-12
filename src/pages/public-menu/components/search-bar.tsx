import { Search, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { haptic } from "../lib/menu-format";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: Props) {
  const clear = () => {
    haptic("light");
    onChange("");
  };

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-10 pl-9 pr-9 rounded-full text-sm",
          "bg-white border border-neutral-200 text-[#0A2540] placeholder:text-neutral-400",
          "focus:outline-none focus:border-[#0A2540]/30 focus:ring-2 focus:ring-[#0A2540]/10",
          "transition-shadow duration-150"
        )}
      />
      {value && (
        <button
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-300 transition-colors"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
