import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Wallet,
  BadgePercent,
  BarChart3,
  BookText,
  Boxes,
  Building2,
  ChefHat,
  ClipboardList,
  Clock,
  CupSoda,
  FileBarChart,
  Home,
  Layers,
  LayoutDashboard,
  Package,
  QrCode,
  Receipt,
  Settings,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export interface NavLeaf {
  to: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
}

export interface NavParent {
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  /** Prefix used to detect the active state for the whole group. */
  basePath: string;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavParent;

export interface NavGroup {
  labelKey: string;
  fallback: string;
  entries: NavEntry[];
}

export const isParent = (e: NavEntry): e is NavParent => "children" in e;

export const NAV: NavGroup[] = [
  {
    labelKey: "nav.overview",
    fallback: "Overview",
    entries: [{ to: "/", labelKey: "nav.dashboard", fallback: "Dashboard", icon: LayoutDashboard }],
  },
  {
    labelKey: "nav.operations",
    fallback: "Operations",
    entries: [
      { to: "/orders", labelKey: "nav.orders", fallback: "Orders", icon: Receipt },
      { to: "/shifts", labelKey: "nav.shifts", fallback: "Shifts", icon: Clock },
      {
        labelKey: "nav.inventory",
        fallback: "Inventory",
        icon: Boxes,
        basePath: "/inventory",
        children: [
          { to: "/inventory/today", labelKey: "nav.invToday", fallback: "Today", icon: Home },
          { to: "/inventory/items", labelKey: "nav.invItems", fallback: "Items", icon: Package },
          { to: "/inventory/purchasing", labelKey: "nav.invPurchasing", fallback: "Purchasing", icon: ShoppingCart },
          { to: "/inventory/counts", labelKey: "nav.invCounts", fallback: "Stock counts", icon: ClipboardList },
          { to: "/inventory/waste", labelKey: "nav.invWaste", fallback: "Waste", icon: Trash2 },
          { to: "/inventory/transfers", labelKey: "nav.invTransfers", fallback: "Transfers", icon: ArrowLeftRight },
          { to: "/inventory/reports", labelKey: "nav.invReports", fallback: "Reports", icon: FileBarChart },
          { to: "/inventory/settings", labelKey: "nav.invSettings", fallback: "Settings", icon: Settings2 },
        ],
      },
      { to: "/analytics", labelKey: "nav.analytics", fallback: "Analytics", icon: BarChart3 },
      { to: "/qr", labelKey: "nav.qr", fallback: "QR Codes", icon: QrCode },
      {
        labelKey: "nav.delivery",
        fallback: "Delivery",
        icon: Truck,
        basePath: "/delivery",
        children: [
          { to: "/delivery/settings", labelKey: "nav.deliverySettings", fallback: "Settings", icon: Settings2 },
          { to: "/delivery/zones", labelKey: "nav.deliveryZones", fallback: "Zone rings", icon: Layers },
          { to: "/delivery/channels", labelKey: "nav.deliveryChannels", fallback: "Channel overrides", icon: SlidersHorizontal },
        ],
      },
      {
        labelKey: "nav.kitchen",
        fallback: "Kitchen",
        icon: ChefHat,
        basePath: "/kitchen",
        children: [
          { to: "/kitchen/stations", labelKey: "nav.kitchenStations", fallback: "Stations", icon: ChefHat },
          { to: "/kitchen/routing", labelKey: "nav.kitchenRouting", fallback: "Order routing", icon: SlidersHorizontal },
        ],
      },
    ],
  },
  {
    labelKey: "nav.catalog",
    fallback: "Catalog",
    entries: [
      {
        labelKey: "nav.menu",
        fallback: "Menu",
        icon: UtensilsCrossed,
        basePath: "/menu",
        children: [
          { to: "/menu/items", labelKey: "nav.items", fallback: "Items", icon: CupSoda },
          { to: "/menu/overrides", labelKey: "nav.branchOverrides", fallback: "Branch Overrides", icon: SlidersHorizontal },
          { to: "/menu/recipes", labelKey: "nav.recipes", fallback: "Recipes", icon: ChefHat },
          { to: "/menu/bundles", labelKey: "nav.bundles", fallback: "Bundles", icon: Layers },
          { to: "/menu/engineering", labelKey: "nav.engineering", fallback: "Menu Engineering", icon: BookText },
          { to: "/menu/advisor", labelKey: "nav.menuAdvisor", fallback: "Menu Advisor", icon: Sparkles },
        ],
      },
      { to: "/discounts", labelKey: "nav.discounts", fallback: "Discounts", icon: BadgePercent },
    ],
  },
  {
    labelKey: "nav.admin",
    fallback: "Administration",
    entries: [
      { to: "/orgs", labelKey: "nav.orgs", fallback: "Organizations", icon: Building2, superAdminOnly: true },
      { to: "/branches", labelKey: "nav.branches", fallback: "Branches", icon: Store },
      { to: "/tills", labelKey: "nav.tills", fallback: "Tills", icon: Wallet },
      { to: "/users", labelKey: "nav.users", fallback: "Users", icon: Users },
      { to: "/permissions", labelKey: "nav.permissions", fallback: "Permissions", icon: ShieldCheck },
      { to: "/settings", labelKey: "nav.settings", fallback: "Settings", icon: Settings },
    ],
  },
];
