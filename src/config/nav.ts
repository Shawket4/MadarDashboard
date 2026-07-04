import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Wallet,
  BadgePercent,
  BarChart3,
  Boxes,
  Building2,
  CalendarCheck,
  ChefHat,
  ClipboardList,
  Clock,
  CreditCard,
  CupSoda,
  FileBarChart,
  Home,
  Layers,
  LayoutDashboard,
  MessageCircle,
  Package,
  QrCode,
  Receipt,
  Settings,
  Settings2,
  SlidersHorizontal,
  ShoppingCart,
  Store,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { UserRole } from "@/data/api/generated/models";

export interface NavLeaf {
  to: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  /** Show only to super_admin. Shorthand for `roles: ["super_admin"]`. */
  superAdminOnly?: boolean;
  /** Restrict visibility to these roles (sidebar + command palette). When
   *  omitted the entry is visible to everyone. */
  roles?: UserRole[];
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
    labelKey: "nav.sell",
    fallback: "Sell",
    entries: [
      { to: "/orders", labelKey: "nav.orders", fallback: "Orders", icon: Receipt },
      { to: "/reservations", labelKey: "nav.reservations", fallback: "Reservations", icon: CalendarCheck },
      { to: "/shifts", labelKey: "nav.shifts", fallback: "Shifts", icon: Clock },
      { to: "/tills", labelKey: "nav.tills", fallback: "Tills", icon: Wallet },
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
          { to: "/menu/pricing", labelKey: "nav.pricingAvailability", fallback: "Pricing & Availability", icon: SlidersHorizontal },
        ],
      },
      { to: "/menu/bundles", labelKey: "nav.bundles", fallback: "Bundles", icon: Layers },
      { to: "/discounts", labelKey: "nav.discounts", fallback: "Discounts", icon: BadgePercent },
    ],
  },
  {
    labelKey: "nav.insights",
    fallback: "Insights",
    entries: [
      { to: "/insights/sales", labelKey: "nav.salesInsights", fallback: "Sales", icon: BarChart3 },
      { to: "/insights/profitability", labelKey: "nav.menuProfitability", fallback: "Menu profitability", icon: TrendingUp },
    ],
  },
  {
    labelKey: "nav.inventory",
    fallback: "Inventory",
    entries: [
      {
        labelKey: "nav.inventory",
        fallback: "Inventory",
        icon: Boxes,
        basePath: "/inventory",
        children: [
          { to: "/inventory/today", labelKey: "nav.invToday", fallback: "Today", icon: Home },
          { to: "/inventory/ingredients", labelKey: "nav.ingredients", fallback: "Ingredients", icon: Package },
          { to: "/inventory/purchasing", labelKey: "nav.invPurchasing", fallback: "Purchasing", icon: ShoppingCart },
          { to: "/inventory/counts", labelKey: "nav.invCounts", fallback: "Stock counts", icon: ClipboardList },
          { to: "/inventory/waste", labelKey: "nav.invWaste", fallback: "Waste", icon: Trash2 },
          { to: "/inventory/transfers", labelKey: "nav.invTransfers", fallback: "Transfers", icon: ArrowLeftRight },
          { to: "/inventory/reports", labelKey: "nav.invReports", fallback: "Reports", icon: FileBarChart },
          { to: "/inventory/settings", labelKey: "nav.invSettings", fallback: "Settings", icon: Settings2 },
        ],
      },
    ],
  },
  {
    labelKey: "nav.setup",
    fallback: "Setup",
    entries: [
      {
        labelKey: "nav.delivery",
        fallback: "Delivery",
        icon: Truck,
        basePath: "/delivery",
        children: [
          { to: "/delivery/settings", labelKey: "nav.deliverySettings", fallback: "Settings", icon: Settings2 },
          { to: "/delivery/zones", labelKey: "nav.deliveryZones", fallback: "Zone rings", icon: Layers },
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
      { to: "/qr", labelKey: "nav.qr", fallback: "QR Codes", icon: QrCode },
      {
        to: "/settings/payment-methods",
        labelKey: "nav.paymentMethods",
        fallback: "Payment methods",
        icon: CreditCard,
        roles: ["org_admin", "super_admin"],
      },
      {
        to: "/settings/whatsapp",
        labelKey: "nav.whatsapp",
        fallback: "WhatsApp",
        icon: MessageCircle,
        superAdminOnly: true,
      },
      { to: "/settings", labelKey: "nav.settings", fallback: "General settings", icon: Settings },
    ],
  },
  {
    labelKey: "nav.admin",
    fallback: "Administration",
    entries: [
      { to: "/orgs", labelKey: "nav.orgs", fallback: "Organizations", icon: Building2, superAdminOnly: true },
      { to: "/branches", labelKey: "nav.branches", fallback: "Branches", icon: Store },
      { to: "/access/users", labelKey: "nav.usersPermissions", fallback: "Users & Permissions", icon: Users },
    ],
  },
];
