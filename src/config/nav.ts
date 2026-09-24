import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  Network,
  Contact,
  ArrowLeftRight,
  Wallet,
  BadgePercent,
  Boxes,
  Building2,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  Tablet,
  Coins,
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
  ListChecks,
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
  /** The org module this page belongs to (PS-2). Omitted = every org. */
  module?: OrgModule;
  /** The set-up checklist (SA-4): shown, to whoever holds `caps`, only while it is incomplete. */
  setup?: boolean;
}

/** `pos` = selling, catalog, stock and their reports; `dawam` = attendance, roster, payroll. */
export type OrgModule = "pos" | "dawam";

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
    entries: [{ module: "pos", to: "/", labelKey: "nav.dashboard", fallback: "Dashboard", icon: LayoutDashboard }],
  },
  {
    labelKey: "nav.sell",
    fallback: "Sell",
    entries: [
      { caps: [Cap.ordersRead], module: "pos", to: "/orders", labelKey: "nav.orders", fallback: "Orders", icon: Receipt },
      { caps: [Cap.floorLayoutRead], module: "pos", to: "/floor", labelKey: "nav.floor", fallback: "Floor", icon: Armchair },
      { caps: [Cap.bookingsRead], module: "pos", to: "/bookings", labelKey: "nav.bookings", fallback: "Bookings", icon: CalendarClock },
      { caps: [Cap.tillRead], module: "pos", to: "/tills", labelKey: "nav.tills", fallback: "Tills", icon: Wallet },
      { caps: [Cap.customersView], module: "pos", to: "/customers", labelKey: "nav.customers", fallback: "Customers", icon: Contact },
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
          { caps: [Cap.menuItemsRead], module: "pos", to: "/menu/items", labelKey: "nav.items", fallback: "Items", icon: CupSoda },
          { caps: [Cap.menuItemsRead], module: "pos", to: "/menu/groups", labelKey: "nav.choiceGroups", fallback: "Choice groups", icon: ListChecks },
          { caps: [Cap.menuItemsEdit], module: "pos", to: "/menu/pricing", labelKey: "nav.pricingAvailability", fallback: "Pricing & Availability", icon: SlidersHorizontal },
          { caps: [Cap.menuItemsRead], module: "pos", to: "/menu/bases", labelKey: "nav.recipeBases", fallback: "Recipe bases", icon: Layers },
          { caps: [Cap.menuItemsRead], module: "pos", to: "/menu/packaging", labelKey: "nav.packagingRules", fallback: "Packaging rules", icon: Package },
        ],
      },
      { caps: [Cap.menuItemsRead], module: "pos", to: "/menu/bundles", labelKey: "nav.bundles", fallback: "Bundles", icon: Layers },
      { caps: [Cap.discountsRead], module: "pos", to: "/discounts", labelKey: "nav.discounts", fallback: "Discounts", icon: BadgePercent },
    ],
  },
  {
    labelKey: "nav.basira",
    fallback: "Basira",
    entries: [
      { caps: [Cap.reportsRead], module: "pos", to: "/basira", labelKey: "nav.basiraAsk", fallback: "Ask", icon: Telescope },
    ],
  },
  {
    labelKey: "nav.reports",
    fallback: "Reports",
    entries: [
      // Every entry on a capability; a page hides the tabs its person can't read.
      { caps: [Cap.ordersRead], module: "pos", to: "/reports/operations", labelKey: "nav.reportsOperations", fallback: "Operations", icon: TrendingUp },
      { caps: [Cap.ordersRead, Cap.inventoryRead, Cap.purchasingOrdersRead], module: "pos", to: "/reports/financial", labelKey: "nav.reportsFinancial", fallback: "Financial", icon: Coins },
      { caps: [Cap.inventoryRead], module: "pos", to: "/reports/inventory", labelKey: "nav.reportsInventory", fallback: "Inventory", icon: FileBarChart },
      // Tax and the audit trail: reports.legal, owner and manager by default, a manager's own branches.
      { caps: [Cap.reportsLegal], to: "/reports/legal", labelKey: "nav.reportsLegal", fallback: "Legal", icon: Scale },
      { caps: [Cap.loyaltyMembersList], module: "pos", to: "/reports/loyalty", labelKey: "nav.reportsLoyalty", fallback: "Loyalty", icon: Star },
      { caps: [Cap.hrAttendanceRead], module: "dawam", to: "/reports/staff", labelKey: "nav.reportsStaff", fallback: "Staff", icon: UserRound },
      // The day's staff drinks pool, per branch. Gated on the capability that
      // lets a person record one: if you can give a staff drink, you can see
      // what the branch has already given.
      { caps: [Cap.ordersStaffDrinkRecord], module: "pos", to: "/reports/staff-pool", labelKey: "nav.reportsStaffPool", fallback: "Staff drinks", icon: CupSoda },
      // Every drawer at the branch, with its variance: till.read.branch. The route
      // answers plain till.read too, but only with the caller's own sessions.
      { caps: [Cap.tillReadBranch], module: "pos", to: "/reports/tills", labelKey: "nav.reportsTills", fallback: "Tills", icon: Wallet },
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
          { caps: [Cap.inventoryRead], module: "pos", to: "/inventory/today", labelKey: "nav.invToday", fallback: "Today", icon: Home },
          { caps: [Cap.inventoryCountsRead], module: "pos", to: "/inventory/counts", labelKey: "nav.invCounts", fallback: "Stock counts", icon: ClipboardList },
          { caps: [Cap.inventoryRead], module: "pos", to: "/inventory/ingredients", labelKey: "nav.ingredients", fallback: "Ingredients", icon: Package },
          { caps: [Cap.purchasingOrdersRead, Cap.purchasingSuppliersRead], module: "pos", to: "/inventory/purchasing", labelKey: "nav.invPurchasing", fallback: "Purchasing", icon: ShoppingCart },
          { caps: [Cap.inventoryWasteRead], module: "pos", to: "/inventory/waste", labelKey: "nav.invWaste", fallback: "Waste", icon: Trash2 },
          { caps: [Cap.inventoryTransfersRead], module: "pos", to: "/inventory/transfers", labelKey: "nav.invTransfers", fallback: "Transfers", icon: ArrowLeftRight },
          { caps: [Cap.inventoryAdjust], module: "pos", to: "/inventory/settings", labelKey: "nav.invSettings", fallback: "Settings", icon: Settings2 },
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
      // The branch's hardware and how it talks: a canvas, so a page of its own
      // rather than a settings pane.
      { caps: [Cap.kitchenStationsEdit], module: "pos", to: "/branch-setup", labelKey: "nav.branchSetup", fallback: "Branch setup", icon: Network },
      { caps: [Cap.loyaltyUse, Cap.loyaltyMembersList], module: "pos", to: "/settings/loyalty", labelKey: "nav.loyalty", fallback: "Loyalty", icon: Star },
      { caps: [Cap.orgSettingsRead, Cap.orgSettingsEdit], module: "pos", to: "/settings/staff-pool", labelKey: "nav.staffPool", fallback: "Staff drinks", icon: CupSoda },
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
          // Set-up is for whoever sets the rules (hr.rules.edit, the owner by default).
          { setup: true, caps: [Cap.hrRulesEdit], module: "dawam", to: "/staff/setup", labelKey: "nav.staffSetup", fallback: "Set-up", icon: ListChecks },
          { caps: [Cap.hrStaffRead], module: "dawam", to: "/staff/employees", labelKey: "nav.employees", fallback: "Employees", icon: UserRound },
          { caps: [Cap.hrAttendanceRead], module: "dawam", to: "/staff/attendance", labelKey: "nav.attendance", fallback: "Attendance", icon: CalendarClock },
          // "Work shifts" (staff scheduling) — distinct from /tills, the sales sessions.
          { caps: [Cap.hrScheduleRead], module: "dawam", to: "/staff/shifts", labelKey: "nav.workShifts", fallback: "Work shifts", icon: CalendarRange },
          { caps: [Cap.hrAttendanceRead], module: "dawam", to: "/staff/team", labelKey: "nav.team", fallback: "Team", icon: Users },
          {
            caps: [Cap.hrLeaveEdit, Cap.hrAdvancesDecide, Cap.hrScheduleEdit, Cap.hrShiftCoverConfirm, Cap.hrOvertimeApprove, Cap.hrPayrollRun],
            module: "dawam", to: "/staff/approvals", labelKey: "nav.approvals", fallback: "Approvals", icon: ListChecks,
          },
          { caps: [Cap.hrScheduleRead], module: "dawam", to: "/staff/schedule", labelKey: "nav.schedule", fallback: "Schedule", icon: CalendarClock },
          { caps: [Cap.hrLeaveRead], module: "dawam", to: "/staff/requests", labelKey: "nav.requests", fallback: "Requests", icon: Inbox },
          // The same run as the staff app's Payroll tab (Dawam PAY-4): one
          // server-side state, so approving in either place is the same act.
          { caps: [Cap.hrPayrollRead, Cap.hrPayrollRun], module: "dawam", to: "/staff/payroll", labelKey: "nav.payroll", fallback: "Payroll", icon: Coins },
          // Attendance, labour against sales, payroll history and advances (DSH-3).
          { caps: [Cap.hrAttendanceRead, Cap.hrPayrollRead], module: "dawam", to: "/staff/reports", labelKey: "nav.staffReports", fallback: "Reports", icon: FileBarChart },
          // Setting the rules is the owner's (hr.rules.edit, every branch); a
          // branch manager sees them read-only (hr.rules.view).
          { caps: [Cap.hrRulesEdit, Cap.hrRulesView], module: "dawam", to: "/staff/rules", labelKey: "nav.attendanceRules", fallback: "Rules", icon: Scale },
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
      { caps: [Cap.branchesEdit, Cap.tillOpen], module: "pos", to: "/devices", labelKey: "nav.devices", fallback: "Devices", icon: Tablet },
      { caps: [Cap.staffUsersRead, Cap.staffPermissionsRead], to: "/access/users", labelKey: "nav.usersPermissions", fallback: "Users & Permissions", icon: Users },
    ],
  },
];

/**
 * Whether a nav leaf shows for this person, in an org with these modules on.
 * `setupIncomplete` is true only once the set-up checklist is known unfinished.
 */
export const leafVisible = (leaf: NavLeaf, authz: Authz, modules?: readonly string[], setupIncomplete = false): boolean => {
  if (leaf.module && modules && !modules.includes(leaf.module)) return false;
  if (leaf.setup) return setupIncomplete && authz.canAny(...(leaf.caps ?? []));
  if (leaf.superAdminOnly) return authz.platform;
  if (leaf.caps) return authz.canAny(...leaf.caps);
  return true;
};

/**
 * Pages that belong to a module but have no nav leaf of their own (old
 * aliases, settings sub-pages, detail routes). Matched like the leaves.
 */
const EXTRA_MODULE_ROUTES: Array<[string, OrgModule]> = [
  ["/staff", "dawam"],
  ["/analytics", "pos"],
  ["/insights", "pos"],
  ["/inventory", "pos"],
  ["/menu", "pos"],
  ["/delivery", "pos"],
  ["/kitchen", "pos"],
  ["/qr", "pos"],
  ["/shifts", "pos"],
  ["/reports/sales", "pos"],
  ["/settings/bookings", "pos"],
  ["/settings/brand", "pos"],
  ["/settings/integrations", "pos"],
  ["/settings/delivery", "pos"],
  ["/settings/delivery-zones", "pos"],
  ["/settings/kitchen-routing", "pos"],
  ["/settings/kitchen-stations", "pos"],
  ["/settings/payment-methods", "pos"],
  ["/settings/qr", "pos"],
];

const MODULE_ROUTES: Array<[string, OrgModule]> = [
  ...NAV.flatMap((g) => g.entries.flatMap((e) => (isParent(e) ? e.children : [e])))
    // "/" is the home redirect, which routes a Dawam-only org itself.
    .filter((l): l is NavLeaf & { module: OrgModule } => !!l.module && l.to !== "/")
    .map((l): [string, OrgModule] => [l.to, l.module]),
  ...EXTRA_MODULE_ROUTES,
];

/**
 * The module a URL path belongs to (PS-2), for route gating: the longest
 * tagged prefix on a segment boundary, so `/reports/staff-pool` is POS while
 * `/reports/staff` is Dawam. Undefined = every org.
 */
export function moduleOfPath(pathname: string): OrgModule | undefined {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  let best: [string, OrgModule] | undefined;
  for (const r of MODULE_ROUTES) {
    if (path === r[0] || path.startsWith(`${r[0]}/`)) {
      if (!best || r[0].length > best[0].length) best = r;
    }
  }
  return best?.[1];
}
