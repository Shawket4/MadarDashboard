import { memo, useCallback, type CSSProperties } from "react";
import type { PublicCategory, PublicMenuItem } from "@/shared/api/generated/models";
import { MenuItemCard } from "./menu-item-card";

// content-visibility lets the browser skip layout/paint for off-screen
// categories; the `auto` intrinsic-size keyword remembers each section's real
// height after first render so scroll position stays accurate.
const SKIP_OFFSCREEN: CSSProperties = {
  contentVisibility: "auto",
  containIntrinsicSize: "auto 600px",
};

/**
 * One category: heading + responsive card grid. Memoised — when not searching,
 * the category objects keep stable identity so sections don't re-render on
 * cart/scroll state changes. `onSelect`/`registerSection` must be stable.
 */
function CategorySectionBase({
  category,
  isRTL,
  onSelect,
  registerSection,
}: {
  category: PublicCategory;
  isRTL: boolean;
  onSelect: (item: PublicMenuItem) => void;
  registerSection: (id: string, el: HTMLElement | null) => void;
}) {
  const id = String(category.id);
  const setRef = useCallback(
    (el: HTMLElement | null) => registerSection(id, el),
    [id, registerSection],
  );

  return (
    <section
      id={`cat-${id}`}
      ref={setRef}
      style={SKIP_OFFSCREEN}
      className="scroll-mt-36 sm:scroll-mt-40 space-y-6 sm:space-y-8"
      aria-labelledby={`cat-heading-${id}`}
    >
      <div className="flex items-center gap-4">
        <h2
          id={`cat-heading-${id}`}
          className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter"
        >
          {category.name}
        </h2>
        <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-200 to-transparent rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {category.items.map((item) => (
          <MenuItemCard key={String(item.id)} item={item} onSelect={onSelect} isRTL={isRTL} />
        ))}
      </div>
    </section>
  );
}

export const CategorySection = memo(CategorySectionBase);
