import { useEffect } from "react";
import type { PublicMenuItem } from "@/shared/api/generated/models";
import type { ID } from "../lib/types";

/**
 * Pre-warm the browser image cache for the active category and the next one,
 * so scrolling forward shows decoded images immediately. Capped per category.
 */
export function useImagePreload(
  menu: { categories: Array<{ id: ID; items: PublicMenuItem[] }> } | undefined,
  activeCat: string | null,
): void {
  useEffect(() => {
    if (!menu || !activeCat) return;
    const idx = menu.categories.findIndex((c) => String(c.id) === activeCat);
    if (idx < 0) return;

    const urls: string[] = [];
    for (let i = idx; i <= idx + 1 && i < menu.categories.length; i++) {
      for (const item of menu.categories[i].items.slice(0, 6)) {
        if (item.image_url) urls.push(item.image_url);
      }
    }
    // Discard the Image() instances — they live long enough to populate the cache.
    urls.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, [menu, activeCat]);
}
