import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { PublicCategory, PublicMenuItem } from "@/shared/api/generated/models";
import { MenuItemCard } from "./menu-item-card";

interface Props {
  category: PublicCategory;
  isRTL: boolean;
  onSelect: (item: PublicMenuItem) => void;
  registerSection: (id: string, el: HTMLElement | null) => void;
}

export const CategorySection = memo(function CategorySection({
  category,
  isRTL,
  onSelect,
  registerSection,
}: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "en";

  const catName =
    (category.name_translations as Record<string, string>)?.[lang] || category.name;

  return (
    <section
      id={`cat-${category.id}`}
      ref={(el) => registerSection(String(category.id), el)}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Category heading */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-base font-bold text-[#0A2540] leading-none">{catName}</h2>
        <div className="flex-1 h-px bg-neutral-100" />
        <span className="text-xs text-neutral-400 tabular-nums">{category.items.length}</span>
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {category.items.map((item, i) => (
          <MenuItemCard
            key={item.id}
            item={item}
            index={i}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
});
