import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export type ID = string;

export type CartLineAddon = {
  slotId: ID;
  slotName: string;
  addonId: ID;
  addonName: string;
  price: number;
};

export type CartLine = {
  lineId: string;
  signature: string;
  itemId: ID;
  itemName: string;
  imageUrl?: string | null;
  size?: { id: ID; name: string };
  addons: CartLineAddon[];
  unitPrice: number;
  quantity: number;
};

export type ThumbVariant = "thumb" | "card" | "hero";

export type CatStyle = {
  icon: ComponentType<LucideProps>;
  bgTop: string;
  bgBottom: string;
  iconColor: string;
  accent: string;
};

export type FlyToCartFn = (sourceEl: HTMLElement | null) => void;
