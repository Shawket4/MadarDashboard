import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  ArrowLeftRight,
  Wallet,
  BadgePercent,
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  Clock,
  CupSoda,
  FileBarChart,
  Home,
  Inbox,
  Layers,
  LayoutDashboard,
  Package,
  Receipt,
  Scale,
  Settings,
  Settings2,
  SlidersHorizontal,
  Star,
  ShoppingCart,
  // MessagesSquare, // unused while AI analytics is disabled (see below)
  Store,
  Trash2,
  Telescope,
  TrendingUp,
  UserRound,
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
      { to: "/floor", labelKey: "nav.floor", fallback: "Floor", icon: Armchair },
      { to: "/bookings", labelKey: "nav.bookings", fallback: "Bookings", icon: CalendarClock },
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
    labelKey: "nav.basira",
    fallback: "Basira",
    entries: [
      { to: "/basira", labelKey: "nav.basiraAsk", fallback: "Ask", icon: Telescope },
    ],
  },
  {
    labelKey: "nav.insights",
    fallback: "Insights",
    entries: [
      // AI analytics disabled 2026-08-31 pending rework. The backend returns 503
      // ("AI analytics is not configured") once GEMINI_API_KEY/GROQ_API_KEY are
      // unset, so this entry is hidden rather than leading users to an error.
      // Re-enable by restoring this line and the keys in the backend .env.
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
          { to: "/inventory/counts", labelKey: "nav.invCounts", fallback: "Stock counts", icon: ClipboardList },
          { to: "/inventory/ingredients", labelKey: "nav.ingredients", fallback: "Ingredients", icon: Package },
          { to: "/inventory/purchasing", labelKey: "nav.invPurchasing", fallback: "Purchasing", icon: ShoppingCart },
          { to: "/inventory/waste", labelKey: "nav.invWaste", fallback: "Waste", icon: Trash2 },
          { to: "/inventory/transfers", labelKey: "nav.invTransfers", fallback: "Transfers", icon: ArrowLeftRight },
          { to: "/inventory/reports", labelKey: "nav.invReports", fallback: "Reports", icon: FileBarChart },
          { to: "/inventory/settings", labelKey: "nav.invSettings", fallback: "Settings", icon: Settings2 },
        ],
      },
    ],
  },
  {
    // Configuration is a PLACE now, not a pile scattered across the sidebar.
    // Delivery, bookings, loyalty, QR, payment methods, kitchen routing,
    // integrations and WhatsApp all live under Settings, each on its own route.
    // What stays out of it: users, orgs, branches, permissions and staff —
    // those are entities you work with all day, not rules you set once.
    labelKey: "nav.setup",
    fallback: "Setup",
    entries: [
      { to: "/settings", labelKey: "nav.settings", fallback: "Settings", icon: Settings },
      { to: "/settings/loyalty", labelKey: "nav.loyalty", fallback: "Loyalty", icon: Star },
    ],
  },
  {
    labelKey: "nav.team",
    fallback: "Team",
    entries: [
      {
        labelKey: "nav.staff",
        fallback: "Staff",
        icon: UserRound,
        basePath: "/staff",
        children: [
          { to: "/staff/employees", labelKey: "nav.employees", fallback: "Employees", icon: UserRound },
          { to: "/staff/attendance", labelKey: "nav.attendance", fallback: "Attendance", icon: CalendarClock },
          // "Work shifts" deliberately, not "Shifts" — /shifts is the cash drawer.
          { to: "/staff/shifts", labelKey: "nav.workShifts", fallback: "Work shifts", icon: CalendarRange },
          { to: "/staff/requests", labelKey: "nav.requests", fallback: "Requests", icon: Inbox },
          { to: "/staff/rules", labelKey: "nav.attendanceRules", fallback: "Rules", icon: Scale },
          // Payroll deliberately absent: the RUN lives in the staff app, where a
          // manager approves it with the team in front of them. Splitting it
          // across two surfaces would mean two places to approve the same money.
        ],
      },
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
