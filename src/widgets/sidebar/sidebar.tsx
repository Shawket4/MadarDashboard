import { /* useEffect, */ useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart2,
  BookOpen,
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { normalize } from "@/shared/lib/normalize";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Input } from "@/shared/ui/input";
import { useAuthStore } from "@/shared/auth/store";
import { useAppStore } from "@/shared/auth/app-store";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { initials } from "@/shared/lib/format";
import { ThemeToggle } from "@/widgets/theme-toggle/theme-toggle";
import { LanguageToggle } from "@/widgets/language-toggle/language-toggle";
import type { Role } from "@/shared/config/constants";
import type { LucideIcon } from "lucide-react";
// import { useOrg } from "@/entities/org/queries"; // re-enable with org logo override
import { usePermissions } from "@/shared/hooks/use-permissions";

// ─────────────────────────────────────────────────────────────────────────────
// Navigation structure
// ─────────────────────────────────────────────────────────────────────────────
interface NavItem {
  to: string;
  icon: LucideIcon;
  key: string;
  roles: Role[];
  resource?: string;
  /** Sub-items render as an expandable group (e.g. the Menu domain). */
  children?: NavItem[];
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    heading: "nav.overview",
    items: [
      { to: "/", icon: LayoutDashboard, key: "nav.dashboard", roles: ["super_admin", "org_admin", "branch_manager", "teller"] },
    ],
  },
  {
    heading: "nav.operations",
    items: [
      { to: "/orders", icon: ShoppingBag, key: "nav.orders", roles: ["super_admin", "org_admin", "branch_manager"], resource: "orders" },
      { to: "/shifts", icon: Clock, key: "nav.shifts", roles: ["super_admin", "org_admin", "branch_manager"], resource: "shifts" },
      { to: "/inventory", icon: Package, key: "nav.inventory", roles: ["super_admin", "org_admin", "branch_manager"], resource: "inventory" },
      { to: "/analytics", icon: BarChart2, key: "nav.analytics", roles: ["super_admin", "org_admin", "branch_manager"], resource: "orders" },
    ],
  },
  {
    heading: "nav.catalog",
    items: [
      {
        to: "/menu",
        icon: Coffee,
        key: "nav.menu",
        roles: ["super_admin", "org_admin", "branch_manager"],
        resource: "menu_items",
        children: [
          { to: "/menu/items", icon: Coffee, key: "menu.tabs.items", roles: ["super_admin", "org_admin", "branch_manager"], resource: "menu_items" },
          { to: "/menu/recipes", icon: BookOpen, key: "menu.tabs.recipes", roles: ["super_admin", "org_admin", "branch_manager"], resource: "recipes" },
          { to: "/menu/bundles", icon: Boxes, key: "menu.tabs.bundles", roles: ["super_admin", "org_admin", "branch_manager"], resource: "menu_items" },
          { to: "/menu/engineering", icon: BarChart2, key: "menu.tabs.engineering", roles: ["super_admin", "org_admin", "branch_manager"], resource: "orders" },
          { to: "/menu/advisor", icon: Sparkles, key: "menu.tabs.advisor", roles: ["super_admin", "org_admin", "branch_manager"], resource: "menu_items" },
        ],
      },
      { to: "/discounts", icon: Tag, key: "nav.discounts", roles: ["super_admin", "org_admin", "branch_manager"], resource: "discounts" },
    ],
  },
  {
    heading: "nav.admin",
    items: [
      { to: "/orgs", icon: Building2, key: "nav.orgs", roles: ["super_admin"], resource: "orgs" },
      { to: "/branches", icon: GitBranch, key: "nav.branches", roles: ["super_admin", "org_admin", "branch_manager"], resource: "branches" },
      { to: "/users", icon: Users, key: "nav.users", roles: ["super_admin", "org_admin", "branch_manager"], resource: "users" },
      { to: "/permissions", icon: Shield, key: "nav.permissions", roles: ["super_admin", "org_admin"], resource: "permissions" },
      { to: "/settings", icon: Settings, key: "nav.settings", roles: ["super_admin", "org_admin", "branch_manager"], resource: "branches" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Brand logo — shows /sufrix.svg. Falls back to gradient tile + wordmark.
// Org-logo override is commented out below — uncomment to re-enable.
// ─────────────────────────────────────────────────────────────────────────────
function BrandLogo({ collapsed }: { collapsed: boolean }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  if (collapsed) {
    return (
      <svg viewBox="-1 5.5 54.32 54.32" className="w-8 h-8 select-none flex-shrink-0">
        <path className="fill-current" d="M27.39,23.17l14.77-14.77c1.08-1.08,2.57-1.75,4.21-1.75,3.29,0,5.96,2.67,5.96,5.95,0,1.64-.67,3.14-1.75,4.21l-14.77,14.77c-.55-4.39-4.03-7.87-8.41-8.41ZM10.16,8.4l14.77,14.77c-4.39.55-7.86,4.03-8.41,8.41L1.75,16.81c-1.08-1.07-1.75-2.56-1.75-4.21,0-3.29,2.67-5.95,5.95-5.95,1.64,0,3.14.67,4.21,1.75ZM35.8,34.04l14.77,14.77c1.08,1.07,1.75,2.57,1.75,4.21,0,3.28-2.66,5.96-5.96,5.96-1.64,0-3.13-.67-4.21-1.75l-14.77-14.77c4.39-.55,7.87-4.03,8.41-8.41ZM24.93,42.46l-14.75,14.76h-.02c-1.07,1.09-2.56,1.76-4.21,1.76-3.29,0-5.95-2.67-5.95-5.96,0-1.64.67-3.13,1.75-4.21l14.77-14.77c.55,4.39,4.03,7.87,8.41,8.41Z"/>
        <circle className="fill-[#c25b3f]" cx="26.16" cy="32.81" r="5.75"/>
      </svg>
    );
  }

  if (isAr) {
    return (
      <svg viewBox="0 0 109.15 25.58" className="h-8 px-2 select-none flex-shrink-0 text-foreground" style={{ width: "auto" }}>
        <g id="Layer_1-2" data-name="Layer 1">
          <g transform="translate(84.55 -2.05) scale(0.4522)">
            <path className="fill-current" d="M27.39,23.17l14.77-14.77c1.08-1.08,2.57-1.75,4.21-1.75,3.29,0,5.96,2.67,5.96,5.95,0,1.64-.67,3.14-1.75,4.21l-14.77,14.77c-.55-4.39-4.03-7.87-8.41-8.41ZM10.16,8.4l14.77,14.77c-4.39.55-7.86,4.03-8.41,8.41L1.75,16.81c-1.08-1.07-1.75-2.56-1.75-4.21,0-3.29,2.67-5.95,5.95-5.95,1.64,0,3.14.67,4.21,1.75ZM35.8,34.04l14.77,14.77c1.08,1.07,1.75,2.57,1.75,4.21,0,3.28-2.66,5.96-5.96,5.96-1.64,0-3.13-.67-4.21-1.75l-14.77-14.77c4.39-.55,7.87-4.03,8.41-8.41ZM24.93,42.46l-14.75,14.76h-.02c-1.07,1.09-2.56,1.76-4.21,1.76-3.29,0-5.95-2.67-5.95-5.96,0-1.64.67-3.13,1.75-4.21l14.77-14.77c.55,4.39,4.03,7.87,8.41,8.41Z"/>
            <circle className="fill-[#c25b3f]" cx="26.16" cy="32.81" r="5.75"/>
          </g>
          <g>
            <path className="fill-current" d="M21.63,18.2v-2.12h1.93v2.12h-1.93ZM5.53,22.75c-1.05,0-2-.19-2.84-.58s-1.5-.92-1.98-1.61c-.48-.68-.72-1.46-.72-2.32,0-.25.02-.58.06-.98s.09-.85.15-1.35c.06-.5.14-1.01.22-1.53.08-.52.16-1.03.23-1.52l2.42.33c-.13.83-.24,1.58-.34,2.26s-.17,1.25-.22,1.73c-.05.47-.08.82-.08,1.05,0,.48.12.9.37,1.26.24.36.6.64,1.06.84.46.2,1.01.3,1.65.3.67,0,1.22-.1,1.63-.3s.72-.47.91-.81c.19-.34.29-.73.29-1.16v-7.5h2.45v7.5c0,.89-.23,1.66-.69,2.32-.46.66-1.09,1.17-1.88,1.53-.8.36-1.7.54-2.72.54ZM10.79,18.2l.03-2.12h1.49c.39,0,.69-.06.9-.17.21-.12.35-.36.44-.72.08-.36.12-.91.12-1.63v-3.61h2.45v3.61c0,1.09-.14,1.98-.42,2.67-.28.69-.71,1.19-1.28,1.5s-1.31.47-2.22.47h-1.52ZM17.03,18.2c-.5,0-1-.1-1.49-.29-.49-.19-.95-.48-1.38-.86l1.5-1.56c.24.2.47.35.69.44.22.09.45.14.67.14h3.44l-1.28,1.15v-4.08c0-.2-.02-.49-.07-.89-.05-.4-.11-.85-.19-1.36-.08-.51-.16-1.03-.26-1.55l2.41-.36c.09.44.17.93.25,1.47.08.54.15,1.06.21,1.54s.09.87.09,1.15v5.04h-4.6ZM23.57,18.2v-2.12c.07,0,.13.02.17.07.05.05.08.12.11.21.03.09.05.2.06.33.01.13.02.27.02.44s0,.31-.02.44c-.01.13-.04.24-.06.34-.03.09-.06.16-.11.21-.05.05-.1.07-.17.07Z"/>
            <path className="fill-current" d="M23.56,18.2v-2.12h9.2l-.79.65v-2.5c0-.63-.07-1.14-.21-1.52s-.34-.66-.62-.83-.62-.26-1.03-.26h-4.03l-1.51-2.2.93-1.76c.11-.2.24-.43.37-.67.14-.24.31-.54.53-.88s.5-.77.84-1.29l2.05,1.16c-.31.47-.57.87-.76,1.18s-.36.59-.49.82-.26.46-.38.69l-.72,1.38-.37-.55h3.54c.78,0,1.45.13,2,.39s.99.61,1.33,1.06.59.96.75,1.52.24,1.15.24,1.76v3.96h-10.86ZM23.56,18.2c-.07,0-.13-.02-.17-.07-.05-.05-.08-.12-.11-.21-.03-.09-.05-.2-.06-.34-.01-.13-.02-.28-.02-.44,0-.22.01-.41.03-.56s.06-.28.12-.36.13-.13.22-.13v2.12Z"/>
            <path className="fill-current" d="M39.94,18.2v-2.12h2.37v2.12h-2.37ZM36.37,22.76c-.15,0-.32,0-.5-.02-.19-.02-.38-.03-.58-.05l.1-2.09c.19,0,.38.02.55.03s.31.02.4.02c.48,0,.86-.19,1.15-.56s.43-.91.43-1.6v-9.48h2.45v9.48c0,.83-.17,1.58-.5,2.22s-.8,1.15-1.4,1.52c-.6.36-1.3.54-2.09.54ZM42.31,18.2v-2.12c.07,0,.13.02.17.07s.08.12.11.21.05.2.06.33.02.27.02.44,0,.31-.02.44c-.01.13-.04.24-.06.34s-.06.16-.11.21c-.05.05-.1.07-.17.07Z"/>
            <path className="fill-current" d="M52.58,18.2v-2.12h1.93v2.12h-1.93ZM42.31,18.2c-.07,0-.13-.02-.17-.07-.05-.05-.08-.12-.11-.21-.03-.09-.05-.2-.06-.34-.01-.13-.02-.28-.02-.44,0-.22.01-.41.03-.56s.06-.28.12-.36.13-.13.22-.13v2.12ZM42.31,18.2v-2.12h8.56l-.74.64v-6.13l.62.52h-2.31c-.54,0-.96.07-1.27.2s-.52.38-.64.74-.19.87-.19,1.54c0,.71.06,1.25.19,1.6s.34.59.64.7c.3.12.73.18,1.27.18v1.89c-1.04,0-1.9-.14-2.57-.43-.67-.29-1.17-.75-1.49-1.4-.32-.64-.48-1.49-.48-2.54s.16-1.85.48-2.54.82-1.2,1.49-1.55,1.53-.52,2.57-.52h4.15v9.21h-10.27ZM54.51,18.2v-2.12c.07,0,.13.02.17.07s.08.12.11.21.05.2.06.33c.01.13.02.27.02.44s0,.31-.02.44c-.01.13-.04.24-.06.34s-.06.16-.11.21c-.05.05-.1.07-.17.07ZM47.46,7.3v-2.09h2.47v2.09h-2.47Z"/>
            <path className="fill-current" d="M65.29,18.2c-.5,0-1-.1-1.49-.29-.49-.19-.95-.48-1.36-.86l1.5-1.56c.24.2.47.35.69.44.22.09.44.14.67.14h3.44l-1.28,1.15v-4.08c0-.2-.02-.49-.06-.89s-.1-.85-.18-1.36c-.08-.51-.17-1.03-.27-1.55l2.41-.36c.09.44.17.93.25,1.47.08.54.16,1.06.22,1.54s.09.87.09,1.15v5.04h-4.62ZM54.51,18.2v-2.12h2.67l-.53.56v-5.78h2.44v7.34h-4.58ZM59.09,18.2v-2.12h1.5c.39,0,.69-.06.9-.17.2-.12.35-.36.43-.72s.12-.91.12-1.63v-3.61h2.45v3.61c0,1.09-.14,1.98-.42,2.67-.28.69-.7,1.19-1.27,1.5s-1.31.47-2.21.47h-1.5ZM54.51,18.2c-.07,0-.13-.02-.17-.07-.05-.05-.08-.12-.11-.21-.03-.09-.05-.2-.06-.34-.01-.13-.02-.28-.02-.44,0-.22.01-.41.03-.56s.06-.28.12-.36.13-.13.22-.13v2.12Z"/>
          </g>
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 341.28 65.62" className="h-8 px-2 select-none flex-shrink-0 text-foreground" style={{ width: "auto" }}>
      <g id="Layer_1-2" data-name="Layer 1">
        <path className="fill-current" d="M27.39,23.17l14.77-14.77c1.08-1.08,2.57-1.75,4.21-1.75,3.29,0,5.96,2.67,5.96,5.95,0,1.64-.67,3.14-1.75,4.21l-14.77,14.77c-.55-4.39-4.03-7.87-8.41-8.41ZM10.16,8.4l14.77,14.77c-4.39.55-7.86,4.03-8.41,8.41L1.75,16.81c-1.08-1.07-1.75-2.56-1.75-4.21,0-3.29,2.67-5.95,5.95-5.95,1.64,0,3.14.67,4.21,1.75ZM35.8,34.04l14.77,14.77c1.08,1.07,1.75,2.57,1.75,4.21,0,3.28-2.66,5.96-5.96,5.96-1.64,0-3.13-.67-4.21-1.75l-14.77-14.77c4.39-.55,7.87-4.03,8.41-8.41ZM24.93,42.46l-14.75,14.76h-.02c-1.07,1.09-2.56,1.76-4.21,1.76-3.29,0-5.95-2.67-5.95-5.96,0-1.64.67-3.13,1.75-4.21l14.77-14.77c.55,4.39,4.03,7.87,8.41,8.41Z"/>
        <circle className="fill-[#c25b3f]" cx="26.16" cy="32.81" r="5.75"/>
        <path className="fill-current" d="M126.55,65.62c-4.52,0-8.6-.78-12.23-2.34-3.63-1.56-6.62-3.79-8.97-6.7-2.35-2.9-3.88-6.35-4.57-10.34l9.54-1.45c.96,3.85,2.97,6.85,6.04,8.99,3.06,2.15,6.63,3.22,10.72,3.22,2.54,0,4.87-.4,7-1.21,2.13-.8,3.84-1.95,5.14-3.45,1.29-1.5,1.94-3.31,1.94-5.41,0-1.14-.2-2.14-.59-3.02-.39-.88-.93-1.64-1.62-2.3-.68-.66-1.52-1.22-2.5-1.7-.98-.48-2.05-.89-3.22-1.25l-16.14-4.77c-1.58-.47-3.18-1.08-4.82-1.82-1.63-.74-3.12-1.72-4.48-2.93-1.36-1.21-2.46-2.72-3.3-4.51-.84-1.8-1.27-3.98-1.27-6.54,0-3.88,1-7.16,3-9.86,2-2.7,4.7-4.74,8.11-6.13C117.76.73,121.58.04,125.81.04c4.25.06,8.07.82,11.44,2.27,3.37,1.46,6.17,3.55,8.4,6.28,2.23,2.73,3.77,6.04,4.62,9.91l-9.8,1.66c-.44-2.36-1.37-4.4-2.8-6.1-1.43-1.71-3.18-3.02-5.25-3.94-2.07-.92-4.32-1.39-6.74-1.42-2.33-.06-4.46.29-6.41,1.05-1.94.76-3.48,1.82-4.64,3.19-1.15,1.37-1.73,2.94-1.73,4.73s.51,3.16,1.53,4.25c1.02,1.07,2.28,1.93,3.79,2.56,1.5.62,2.99,1.14,4.48,1.55l11.63,3.28c1.46.41,3.11.96,4.96,1.64,1.86.69,3.65,1.64,5.38,2.87,1.73,1.23,3.17,2.85,4.3,4.88,1.14,2.02,1.71,4.57,1.71,7.62s-.64,5.98-1.93,8.39c-1.28,2.41-3.04,4.42-5.27,6.04-2.23,1.61-4.8,2.83-7.72,3.65-2.92.81-6,1.22-9.23,1.22Z"/>
        <path className="fill-current" d="M192.92,64.31v-13.65h-1.09V17.06h9.23v47.25h-8.14ZM177.3,65.58c-3.27,0-6.01-.52-8.23-1.57-2.21-1.05-4.02-2.43-5.4-4.13-1.39-1.7-2.45-3.57-3.17-5.58-.73-2.01-1.23-3.98-1.49-5.91-.26-1.92-.39-3.62-.39-5.07v-26.25h9.27v23.23c0,1.84.15,3.72.46,5.66.3,1.94.89,3.74,1.75,5.4.86,1.66,2.07,3.01,3.63,4.03,1.56,1.02,3.6,1.53,6.11,1.53,1.64,0,3.18-.27,4.64-.81,1.46-.54,2.74-1.41,3.83-2.6,1.09-1.2,1.95-2.77,2.58-4.73.62-1.95.94-4.33.94-7.13l5.69,2.15c0,4.29-.8,8.07-2.41,11.35-1.6,3.28-3.91,5.84-6.91,7.68-3,1.84-6.63,2.75-10.89,2.75Z"/>
        <path className="fill-current" d="M209.29,24.41v-7.35h28.92v7.35h-28.92ZM217.12,64.31V15.39c0-1.19.04-2.47.12-3.82.09-1.36.35-2.7.77-4.03.42-1.32,1.12-2.54,2.12-3.65,1.2-1.31,2.51-2.24,3.94-2.8,1.43-.56,2.85-.88,4.27-.96,1.41-.09,2.72-.13,3.91-.13h5.96v7.52h-5.51c-2.16,0-3.77.54-4.84,1.6-1.06,1.07-1.6,2.58-1.6,4.53v50.66h-9.14Z"/>
        <path className="fill-current" d="M244.68,64.31V17.06h8.14v11.46l-1.14-1.48c.59-1.52,1.34-2.91,2.28-4.18.93-1.27,2.01-2.31,3.23-3.13,1.2-.88,2.53-1.55,4.01-2.03,1.47-.48,2.98-.78,4.53-.88,1.55-.1,3.04-.02,4.46.24v8.57c-1.55-.4-3.26-.52-5.14-.34-1.88.18-3.61.77-5.18,1.79-1.48.96-2.66,2.12-3.52,3.49-.86,1.38-1.48,2.9-1.86,4.58-.38,1.68-.57,3.45-.57,5.32v23.84h-9.23Z"/>
        <rect className="fill-current" x="278.85" y="17.06" width="9.15" height="47.25"/>
        <rect className="fill-[#c25b3f]" x="278.85" y=".43" width="9.15" height="8.89"/>
        <polygon className="fill-current" points="295.34 64.31 313.02 40.42 295.73 17.06 306.58 17.06 318.35 33.29 329.99 17.06 340.84 17.06 323.55 40.42 341.28 64.31 330.38 64.31 318.35 47.55 306.23 64.31 295.34 64.31"/>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav row — left accent bar + primary-colored icon on active, smooth hover
// ─────────────────────────────────────────────────────────────────────────────
function NavRow({
  to, icon: Icon, label, collapsed, onClick,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const row = (
    <NavLink to={to} end={to === "/"} onClick={onClick}>
      {({ isActive }) => (
        <div
          className={cn(
            "group/navrow relative flex items-center rounded-md transition-colors duration-150",
            collapsed ? "h-9 w-9 mx-auto justify-center" : "h-9 px-3 gap-3",
            isActive
              ? "bg-accent text-foreground font-semibold"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          {/* Left accent bar (only when active & expanded — collapsed rail is too narrow) */}
          {isActive && !collapsed && (
            <span
              aria-hidden
              className="absolute start-0 top-1.5 bottom-1.5 w-[3px] rounded-e-full bg-primary"
            />
          )}
          <Icon
            size={collapsed ? 17 : 15}
            strokeWidth={isActive ? 2.2 : 1.75}
            className={cn(
              "flex-shrink-0 transition-colors",
              isActive ? "text-primary" : "text-current",
            )}
          />
          {!collapsed && <span className="text-sm truncate">{label}</span>}
        </div>
      )}
    </NavLink>
  );

  if (!collapsed) return row;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expandable nav group — parent toggles, children indent. Auto-expands while
// the route lives inside it. Collapsed rail falls back to a plain link to the
// first child (tooltip shows the group name).
// ─────────────────────────────────────────────────────────────────────────────
function NavGroupRow({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const inside = location.pathname.startsWith(item.to);
  const [open, setOpen] = useState(inside);
  const Icon = item.icon;
  const children = item.children ?? [];

  if (collapsed) {
    return (
      <NavRow
        to={children[0]?.to ?? item.to}
        icon={item.icon}
        label={t(item.key)}
        collapsed
        onClick={onClick}
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full relative flex items-center rounded-md h-9 px-3 gap-3 transition-colors duration-150",
          inside ? "text-foreground font-semibold" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
      >
        <Icon size={15} strokeWidth={inside ? 2.2 : 1.75} className={cn("flex-shrink-0", inside && "text-primary")} />
        <span className="text-sm truncate flex-1 text-start">{t(item.key)}</span>
        <ChevronRight size={13} className={cn("transition-transform rtl:rotate-180", open && "rotate-90 rtl:rotate-90")} />
      </button>
      {(open || inside) && (
        <div className="ms-4 ps-2 border-s space-y-0.5 mt-0.5">
          {children.map((c) => (
            <NavRow key={c.to} to={c.to} icon={c.icon} label={t(c.key)} collapsed={false} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar content (shared between desktop + mobile drawer)
// ─────────────────────────────────────────────────────────────────────────────
function SidebarContent({
  collapsed,
  onClose,
}: {
  collapsed: boolean;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const { user, role } = useCurrentContext();
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const { can } = usePermissions();

  const groups = useMemo(() => {
    const q = normalize(search);
    const allowed = (i: NavItem) =>
      !!role && i.roles.includes(role) && (!i.resource || can(i.resource, "read"));
    const matches = (i: NavItem) => !q || normalize(t(i.key)).includes(q);

    return NAV.map((g) => ({
      ...g,
      items: g.items
        .map((i) => {
          if (!allowed(i)) return null;
          if (!i.children) return matches(i) ? i : null;
          // RBAC filters each sub-item; search matches parent or any child
          const children = i.children.filter(allowed);
          if (children.length === 0) return null;
          if (matches(i)) return { ...i, children };
          const matched = children.filter(matches);
          return matched.length > 0 ? { ...i, children: matched } : null;
        })
        .filter((i): i is NavItem => i !== null),
    })).filter((g) => g.items.length > 0);
  }, [role, search, t, can]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Brand header ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center border-b flex-shrink-0 h-14",
          collapsed ? "justify-center px-2" : "px-4 justify-between",
        )}
      >
        <BrandLogo collapsed={collapsed} />
        {onClose && !collapsed && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
            className="lg:hidden"
            aria-label="Close menu"
          >
            <X />
          </Button>
        )}
      </div>

      {/* ── Search ───────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search
              size={13}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.search")}
              className="ps-9 pe-14 h-9 bg-muted/50 border-0 focus-visible:bg-background focus-visible:ring-1"
            />
            {/* ⌘K hint — visual only for now */}
            <kbd className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className={cn("flex-1 overflow-y-auto py-2 no-scrollbar", collapsed ? "px-2" : "px-3")}
      >
        {groups.map((group, gi) => (
          <div key={group.heading} className={cn("first:mt-0", gi > 0 && "mt-4")}>
            {!collapsed ? (
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.08em] px-2 mb-1.5">
                {t(group.heading)}
              </p>
            ) : (
              gi > 0 && <div className="h-px bg-border/50 mx-1 my-3" aria-hidden />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) =>
                item.children ? (
                  <NavGroupRow key={item.to} item={item} collapsed={collapsed} onClick={onClose} />
                ) : (
                  <NavRow
                    key={item.to}
                    to={item.to}
                    icon={item.icon}
                    label={t(item.key)}
                    collapsed={collapsed}
                    onClick={onClose}
                  />
                ),
              )}
            </div>
          </div>
        ))}
        {groups.length === 0 && !collapsed && (
          <p className="text-xs text-muted-foreground text-center py-4">{t("common.noResults")}</p>
        )}
      </nav>

      {/* ── Footer: preferences + user card ──────────────────────────────── */}
      <div className={cn("flex-shrink-0 border-t", collapsed ? "p-2 space-y-1" : "p-3 space-y-2")}>
        <div
          className={cn(
            "flex gap-1",
            collapsed ? "flex-col items-center" : "items-center justify-between",
          )}
        >
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
              {t("nav.preferences")}
            </span>
          )}
          <div className={cn("flex gap-0.5", collapsed && "flex-col")}>
            <ThemeToggle side={collapsed ? "right" : "top"} />
            <LanguageToggle side={collapsed ? "right" : "top"} />
          </div>
        </div>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                aria-label={`${user?.name ?? ""} — ${t("nav.signOut")}`}
                className="w-full flex items-center justify-center rounded-md hover:bg-accent/60 transition-colors p-1"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {initials(user?.name ?? "")}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{role ? t(`roles.${role}`) : ""}</p>
              <p className="text-xs text-muted-foreground mt-1">— {t("nav.signOut")}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {initials(user?.name ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {role ? t(`roles.${role}`) : ""}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={handleSignOut}
                    aria-label={t("nav.signOut")}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <LogOut />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t("nav.signOut")}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────────
interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed start-0 top-0 bottom-0 z-50 w-[280px] max-w-[82vw] bg-background border-e shadow-xl lg:hidden safe-top safe-bottom",
          "transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        )}
      >
        <SidebarContent collapsed={false} onClose={onMobileClose} />
      </aside>

      {/* Desktop */}
      <aside
        className={cn(
          "hidden lg:flex relative flex-col bg-background border-e flex-shrink-0 sticky top-0 h-screen safe-top safe-bottom",
          "transition-[width] duration-200 ease-out",
          collapsed ? "w-[72px]" : "w-[244px]",
        )}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Collapse handle — pill on the outer edge, vertically centered */}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -end-3 top-1/2 -translate-y-1/2 z-10",
            "w-6 h-10 rounded-full bg-background border shadow-sm",
            "flex items-center justify-center text-muted-foreground",
            "hover:text-foreground hover:bg-accent transition-colors duration-150",
          )}
        >
          {collapsed ? (
            <ChevronRight size={14} className="rtl:rotate-180" />
          ) : (
            <ChevronLeft size={14} className="rtl:rotate-180" />
          )}
        </button>
      </aside>
    </>
  );
}