import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Contact,
  ArrowLeftRight,
  Wallet,
  BadgePercent,
  BarChart3,
  Boxes,
  Building2,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  Tablet,
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
import type { Authz } from "@/data/authz/use-authz";
import { Cap, type Capability } from "@/generated/capabilities";

export interface NavLeaf {
  to: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  /** Platform (super admin) only. */
  superAdminOnly?: boolean;
  /** Visible when the person holds ANY of these capabilities (sidebar +
   *  command palette). Omitted = visible to everyone signed in. Never a role. */
  caps?: Capability[];
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
      { caps: [Cap.ordersRead], to: "/orders", labelKey: "nav.orders", fallback: "Orders", icon: Receipt },
      { caps: [Cap.floorLayoutRead], to: "/floor", labelKey: "nav.floor", fallback: "Floor", icon: Armchair },
      { caps: [Cap.bookingsRead], to: "/bookings", labelKey: "nav.bookings", fallback: "Bookings", icon: CalendarClock },
      { caps: [Cap.tillRead], to: "/tills", labelKey: "nav.tills", fallback: "Tills", icon: Wallet },
      { caps: [Cap.customersView], to: "/customers", labelKey: "nav.customers", fallback: "Customers", icon: Contact },
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
          { caps: [Cap.menuItemsRead], to: "/menu/items", labelKey: "nav.items", fallback: "Items", icon: CupSoda },
          { caps: [Cap.menuItemsEdit], to: "/menu/pricing", labelKey: "nav.pricingAvailability", fallback: "Pricing & Availability", icon: SlidersHorizontal },
        ],
      },
      { caps: [Cap.menuItemsRead], to: "/menu/bundles", labelKey: "nav.bundles", fallback: "Bundles", icon: Layers },
      { caps: [Cap.discountsRead], to: "/discounts", labelKey: "nav.discounts", fallback: "Discounts", icon: BadgePercent },
    ],
  },
  {
    labelKey: "nav.basira",
    fallback: "Basira",
    entries: [
      { caps: [Cap.reportsRead], to: "/basira", labelKey: "nav.basiraAsk", fallback: "Ask", icon: Telescope },
    ],
  },
  {
    labelKey: "nav.reports",
    fallback: "Reports",
    entries: [
      { caps: [Cap.ordersRead], to: "/reports/sales", labelKey: "nav.salesInsights", fallback: "Sales", icon: BarChart3 },
      { caps: [Cap.inventoryRead], to: "/reports/inventory", labelKey: "nav.reportsInventory", fallback: "Inventory", icon: FileBarChart },
      // The legal audit trail (refunds, voids, discounts, waivers, overrides) was
      // owner-only by role; its capability is the owner's review of flagged acts.
      { caps: [Cap.approvalsReview], to: "/reports/legal", labelKey: "nav.reportsLegal", fallback: "Legal", icon: Scale },
      { caps: [Cap.loyaltyMembersList], to: "/reports/loyalty", labelKey: "nav.reportsLoyalty", fallback: "Loyalty", icon: Star },
      { caps: [Cap.hrAttendanceRead], to: "/reports/staff", labelKey: "nav.reportsStaff", fallback: "Staff", icon: UserRound },
      {
        labelKey: "nav.reportsOperations",
        fallback: "Operations",
        icon: TrendingUp,
        basePath: "/reports/operations",
        children: [
          { caps: [Cap.ordersRead], to: "/reports/operations/profitability", labelKey: "nav.menuProfitability", fallback: "Menu profitability", icon: TrendingUp },
          { caps: [Cap.ordersRead], to: "/reports/operations/tables", labelKey: "nav.tablesInsights", fallback: "Tables", icon: Armchair },
        ],
      },
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
          { caps: [Cap.inventoryRead], to: "/inventory/today", labelKey: "nav.invToday", fallback: "Today", icon: Home },
          { caps: [Cap.inventoryCountsRead], to: "/inventory/counts", labelKey: "nav.invCounts", fallback: "Stock counts", icon: ClipboardList },
          { caps: [Cap.inventoryRead], to: "/inventory/ingredients", labelKey: "nav.ingredients", fallback: "Ingredients", icon: Package },
          { caps: [Cap.purchasingOrdersRead, Cap.purchasingSuppliersRead], to: "/inventory/purchasing", labelKey: "nav.invPurchasing", fallback: "Purchasing", icon: ShoppingCart },
          { caps: [Cap.inventoryWasteRead], to: "/inventory/waste", labelKey: "nav.invWaste", fallback: "Waste", icon: Trash2 },
          { caps: [Cap.inventoryTransfersRead], to: "/inventory/transfers", labelKey: "nav.invTransfers", fallback: "Transfers", icon: ArrowLeftRight },
          { caps: [Cap.inventoryAdjust], to: "/inventory/settings", labelKey: "nav.invSettings", fallback: "Settings", icon: Settings2 },
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
      { caps: [Cap.loyaltyUse, Cap.loyaltyMembersList], to: "/settings/loyalty", labelKey: "nav.loyalty", fallback: "Loyalty", icon: Star },
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
          { caps: [Cap.hrStaffRead], to: "/staff/employees", labelKey: "nav.employees", fallback: "Employees", icon: UserRound },
          { caps: [Cap.hrAttendanceRead], to: "/staff/attendance", labelKey: "nav.attendance", fallback: "Attendance", icon: CalendarClock },
          // "Work shifts" (staff scheduling) — distinct from /tills, the sales sessions.
          { caps: [Cap.hrScheduleRead], to: "/staff/shifts", labelKey: "nav.workShifts", fallback: "Work shifts", icon: CalendarRange },
          { caps: [Cap.hrLeaveRead], to: "/staff/requests", labelKey: "nav.requests", fallback: "Requests", icon: Inbox },
          { caps: [Cap.hrAttendanceEdit], to: "/staff/rules", labelKey: "nav.attendanceRules", fallback: "Rules", icon: Scale },
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
      { caps: [Cap.branchesRead], to: "/branches", labelKey: "nav.branches", fallback: "Branches", icon: Store },
      { caps: [Cap.branchesEdit, Cap.tillOpen], to: "/devices", labelKey: "nav.devices", fallback: "Devices", icon: Tablet },
      { caps: [Cap.staffUsersRead, Cap.staffPermissionsRead], to: "/access/users", labelKey: "nav.usersPermissions", fallback: "Users & Permissions", icon: Users },
    ],
  },
];

/** Whether a nav leaf shows for this person. */
export const leafVisible = (leaf: NavLeaf, authz: Authz): boolean => {
  if (leaf.superAdminOnly) return authz.platform;
  if (leaf.caps) return authz.canAny(...leaf.caps);
  return true;
};
