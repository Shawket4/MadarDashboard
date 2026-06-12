import {
  Coffee,
  Cookie,
  Droplet,
  GlassWater,
  IceCream,
  Leaf,
  Sandwich,
  Snowflake,
} from "lucide-react";
import type { CatStyle } from "./types";

/** hex → rgba() with a given alpha. */
export const hexAlpha = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const compute = (name: string): CatStyle => {
  const n = (name ?? "").toLowerCase();

  if (n.includes("matcha"))
    return { icon: Leaf, bgTop: "#E8F5E9", bgBottom: "#C8E6C9", iconColor: "#2E7D32", accent: "#388E3C" };

  if (
    n.includes("latte") || n.includes("espresso") || n.includes("americano") ||
    n.includes("cappuc") || n.includes("flat") || n.includes("cortado") ||
    n.includes("coffee") || n.includes("v60") || n.includes("blended") ||
    n.includes("cold brew")
  )
    return { icon: Coffee, bgTop: "#F5EEE6", bgBottom: "#EDD9C0", iconColor: "#5D4037", accent: "#795548" };

  if (n.includes("chocolate") || n.includes("mocha"))
    return { icon: Coffee, bgTop: "#F3E5E5", bgBottom: "#E8CECE", iconColor: "#6D4C41", accent: "#8D3A3A" };

  if (
    n.includes("croissant") || n.includes("brownie") || n.includes("cookie") ||
    n.includes("pastry") || n.includes("pastries") || n.includes("cake") ||
    n.includes("waffle")
  )
    return { icon: Cookie, bgTop: "#FFF8E8", bgBottom: "#FFF0C8", iconColor: "#E65100", accent: "#F57C00" };

  if (n.includes("sandwich") || n.includes("chicken") || n.includes("turkey") || n.includes("food"))
    return { icon: Sandwich, bgTop: "#FFF3E0", bgBottom: "#FFE0B2", iconColor: "#E64A19", accent: "#EF6C00" };

  if (n.includes("affogato") || n.includes("ice cream"))
    return { icon: IceCream, bgTop: "#F3E5F5", bgBottom: "#E1BEE7", iconColor: "#7B1FA2", accent: "#9C27B0" };

  if (n.includes("lemon") || n.includes("lemonade") || n.includes("refresher") || n.includes("juice"))
    return { icon: GlassWater, bgTop: "#FFFDE7", bgBottom: "#FFF9C4", iconColor: "#F57F17", accent: "#FBC02D" };

  if (n.includes("tea") || n.includes("chai"))
    return { icon: Leaf, bgTop: "#E8F5E9", bgBottom: "#C8E6C9", iconColor: "#388E3C", accent: "#43A047" };

  if (n.includes("water") || n.includes("sparkling"))
    return { icon: Droplet, bgTop: "#E3F2FD", bgBottom: "#BBDEFB", iconColor: "#1565C0", accent: "#1976D2" };

  if (n.includes("iced"))
    return { icon: Snowflake, bgTop: "#E3F2FD", bgBottom: "#BBDEFB", iconColor: "#0277BD", accent: "#0288D1" };

  return { icon: Coffee, bgTop: "#F5EEE6", bgBottom: "#EDD9C0", iconColor: "#795548", accent: "#8D6E63" };
};

/** Memoised per category name — gradients/icons aren't recomputed on re-render. */
const cache = new Map<string, CatStyle>();

export const getCatStyle = (name: string): CatStyle => {
  const key = (name ?? "").toLowerCase();
  let style = cache.get(key);
  if (!style) {
    style = compute(name);
    cache.set(key, style);
  }
  return style;
};
