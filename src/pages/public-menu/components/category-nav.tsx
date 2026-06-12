import { type MouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import type { PublicCategory } from "@/shared/api/generated/models";

/** Sticky, horizontally-scrolling category pills with scroll-spy highlight. */
export function CategoryNav({
  categories,
  activeCat,
  registerPill,
  onPillClick,
}: {
  categories: PublicCategory[];
  activeCat: string | null;
  registerPill: (id: string, el: HTMLAnchorElement | null) => void;
  onPillClick: (e: MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  return (
    <nav
      aria-label="Menu categories"
      className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide sticky top-16 sm:top-20 z-20 py-2 -mx-4 px-4 bg-[#F8FAFC]/90 backdrop-blur-md"
    >
      {categories.map((cat) => {
        const id = String(cat.id);
        const isActive = activeCat === id;
        return (
          <a
            key={id}
            href={`#cat-${id}`}
            ref={(el) => registerPill(id, el)}
            onClick={(e) => onPillClick(e, id)}
            className={cn(
              "whitespace-nowrap px-5 sm:px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-95 flex items-center gap-2 border shadow-sm",
              isActive
                ? "bg-slate-900 border-slate-900 text-white shadow-slate-900/20"
                : "bg-white border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary",
            )}
          >
            {cat.name}
          </a>
        );
      })}
    </nav>
  );
}
