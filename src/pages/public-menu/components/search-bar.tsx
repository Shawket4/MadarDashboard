import { Search, X } from "lucide-react";
import { haptic } from "../lib/menu-format";

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        strokeWidth={2.2}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 ps-12 pe-12 rounded-2xl bg-white border border-slate-200 text-[15px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
      />
      {value && (
        <button
          onClick={() => {
            haptic("light");
            onChange("");
          }}
          aria-label="Clear search"
          className="absolute end-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition active:scale-90"
        >
          <X size={14} strokeWidth={3} className="text-slate-500" />
        </button>
      )}
    </div>
  );
}
