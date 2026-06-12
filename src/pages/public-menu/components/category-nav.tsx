import { type MouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import type { PublicCategory } from "@/shared/api/generated/models";

interface Props {
  categories: PublicCategory[];
  activeCat: string | null;
  registerPill: (id: string, el: HTMLAnchorElement | null) => void;
  onPillClick: (e: MouseEvent<HTMLAnchorElement>, catId: string) => void;
}

export function CategoryNav({ categories, activeCat, registerPill, onPillClick }: Props) {
  if (categories.length === 0) return null;

  return (
    <div className="sticky top-14 z-20 -mx-4 px-4 py-2.5 bg-[#FAF8F5]/90 backdrop-blur-md">
      <div className="pm-cat-rail flex gap-2 overflow-x-auto">
        {categories.map((cat) => {
          const isActive = activeCat === String(cat.id);
          return (
            <a
              key={cat.id}
              ref={(el) => registerPill(String(cat.id), el)}
              href={`#cat-${cat.id}`}
              onClick={(e) => onPillClick(e, String(cat.id))}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#0A2540] text-white shadow-sm"
                  : "bg-white text-neutral-500 border border-neutral-200 hover:border-neutral-300 hover:text-neutral-700"
              )}
            >
              {cat.name}
            </a>
          );
        })}
      </div>
    </div>
  );
}
