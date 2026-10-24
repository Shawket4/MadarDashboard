import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { Link } from "@/components/app/link";
import { useTranslation } from "react-i18next";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePlan } from "@/hooks/use-plan";
import { NAV, isParent, leafVisible, type NavEntry, type NavGroup, type NavLeaf } from "@/config/nav";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useOrgModules } from "@/hooks/use-org-modules";
import { useSetupProgress } from "@/features/dawam/setup";
import { useNavIntent } from "@/lib/prefetch/nav-context";
import { useOrgId } from "@/hooks/use-org-id";
import { rewardsHref } from "@/lib/rewards-host";
import { usePublicBrand } from "@/features/public-shell/use-brand";
import { Presence } from "@/lib/motion";

// Every leaf destination in the nav, so active-matching can pick the MOST
// SPECIFIC one: a parent-ish link like `/settings` must not light up when a
// more specific sibling (`/settings/payment-methods`) owns the current path.
const NAV_TARGETS: string[] = NAV.flatMap((g) =>
  g.entries.flatMap((e) => (isParent(e) ? e.children.map((c) => c.to) : [e.to])),
);

const useIsActive = () => {
  const { pathname } = useLocation();
  return (to: string) => {
    if (to === "/") return pathname === "/";
    if (pathname !== to && !pathname.startsWith(`${to}/`)) return false;
    // `to` matches — but only win if no other nav target is a longer match.
    return !NAV_TARGETS.some(
      (o) =>
        o.length > to.length &&
        (pathname === o || pathname.startsWith(`${o}/`)),
    );
  };
};

/** A sidebar group past this many entries collapses the rest behind a
 * "show more" toggle rather than growing the whole rail — Reports is the
 * first group to hit it, but the threshold isn't Reports-specific. */
const GROUP_COLLAPSE_THRESHOLD = 4;

/** Off by the owner's call (2026-10-10): the sidebar always shows Madar's wordmark. Flip to bring back a shop's own logo. */
const SHOP_LOGO_IN_SIDEBAR = false;

interface NavRowProps {
  entry: NavEntry;
  isActive: (to: string) => boolean;
  visible: (leaf: NavLeaf) => boolean;
  pathname: string;
  close: () => void;
  keepScope: (prev: Record<string, unknown>) => Record<string, unknown>;
}

function NavRow({ entry, isActive, visible, pathname, close, keepScope }: NavRowProps) {
  const { t } = useTranslation();
  const nav = useNavIntent();
  const { state, isMobile, setOpen } = useSidebar();
  const groupActive = isParent(entry) && pathname.startsWith(entry.basePath);
  const [groupOpen, setGroupOpen] = useState(groupActive);

  if (isParent(entry)) {
    // On the folded icon rail a parent cannot show its children: its click
    // unfolds the sidebar with the group open, instead of toggling a group
    // nobody can see.
    const folded = state === "collapsed" && !isMobile;
    return (
      <Collapsible
        open={groupOpen}
        onOpenChange={(open) => {
          if (folded) {
            setOpen(true);
            setGroupOpen(true);
            return;
          }
          setGroupOpen(open);
        }}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={t(entry.labelKey, entry.fallback)}
              isActive={groupActive}
              // The group only unfolds; its first page is where the hand goes next.
              {...nav({ to: entry.basePath, search: keepScope })}
            >
              <entry.icon />
              <span>{t(entry.labelKey, entry.fallback)}</span>
              <ChevronRight className="ms-auto transition-transform duration-base group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180 rtl:group-data-[state=open]/collapsible:-rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {entry.children.filter(visible).map((child) => (
                <SidebarMenuSubItem key={child.to}>
                  <SidebarMenuSubButton asChild isActive={isActive(child.to)}>
                    <Link to={child.to} search={keepScope} onClick={close}>
                      <child.icon />
                      <span>{t(child.labelKey, child.fallback)}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  if (entry.href) {
    // Another site (Rewards by Madar): a new tab, signed in by the shared session.
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={t(entry.labelKey, entry.fallback)}>
          <a
            href={entry.href}
            target="_blank"
            rel="noopener"
            onClick={(e) => {
              e.currentTarget.href = rewardsHref() ?? entry.href!;
              close();
            }}
          >
            <entry.icon />
            <span>{t(entry.labelKey, entry.fallback)}</span>
            <ExternalLink className="ms-auto opacity-60 rtl:-scale-x-100" aria-hidden />
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive(entry.to)} tooltip={t(entry.labelKey, entry.fallback)}>
        <Link to={entry.to} search={keepScope} onClick={close}>
          <entry.icon />
          <span>{t(entry.labelKey, entry.fallback)}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Every leaf `to` (or parent `basePath`) an entry owns, so a hidden entry
 * that's actually the current page still forces the group open. */
function entryPaths(entry: NavEntry): string[] {
  return isParent(entry) ? [entry.basePath, ...entry.children.map((c) => c.to)] : [entry.to];
}

interface NavGroupSectionProps {
  group: NavGroup;
  entries: NavEntry[];
  isActive: (to: string) => boolean;
  visible: (leaf: NavLeaf) => boolean;
  pathname: string;
  close: () => void;
  keepScope: (prev: Record<string, unknown>) => Record<string, unknown>;
}

function NavGroupSection({ group, entries, pathname, ...rowProps }: NavGroupSectionProps) {
  const { t } = useTranslation();
  const [manuallyExpanded, setManuallyExpanded] = useState(false);

  const overflow = entries.length > GROUP_COLLAPSE_THRESHOLD;
  const hidden = overflow ? entries.slice(GROUP_COLLAPSE_THRESHOLD) : [];
  // A direct link (or refresh) into a hidden entry must not hide the page
  // you're actually on.
  const hasActiveHidden = hidden.some((e) =>
    entryPaths(e).some((p) => pathname === p || pathname.startsWith(`${p}/`)),
  );
  const expanded = !overflow || manuallyExpanded || hasActiveHidden;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-muted">{t(group.labelKey, group.fallback)}</SidebarGroupLabel>
      <SidebarMenu>
        {(overflow ? entries.slice(0, GROUP_COLLAPSE_THRESHOLD) : entries).map((entry) => (
          <NavRow key={isParent(entry) ? entry.labelKey : entry.to} entry={entry} pathname={pathname} {...rowProps} />
        ))}
        {/* "N more": the rest rise in when shown and leave when hidden. */}
        <Presence show={overflow && expanded} initial={false}>
          <li className="list-none">
            <SidebarMenu>
              {hidden.map((entry) => (
                <NavRow key={isParent(entry) ? entry.labelKey : entry.to} entry={entry} pathname={pathname} {...rowProps} />
              ))}
            </SidebarMenu>
          </li>
        </Presence>
        {overflow ? (
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-muted"
              tooltip={expanded ? t("nav.showLess", "Show less") : t("nav.showMore", "Show more")}
              onClick={() => setManuallyExpanded((v) => !v)}
            >
              <ChevronDown className={expanded ? "rotate-180 transition-transform" : "transition-transform"} />
              <span>
                {expanded
                  ? t("nav.showLess", "Show less")
                  : t("nav.showMoreCount", { defaultValue: "{{count}} more", count: entries.length - GROUP_COLLAPSE_THRESHOLD })}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : null}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const brand = usePublicBrand(useOrgId());
  const side = i18n.dir() === "rtl" ? "right" : "left";
  const { setOpenMobile } = useSidebar();
  const isActive = useIsActive();
  const { pathname } = useLocation();

  const authz = useAuthz();
  const modules = useOrgModules();
  const setup = useSetupProgress(authz.can(Cap.hrRulesEdit) && modules.includes("dawam"));
  const plan = usePlan();
  const visible = (leaf: NavLeaf) => leafVisible(leaf, authz, modules, setup.ready && !setup.complete, plan);
  const close = () => setOpenMobile(false);

  // A deep link to a page low in the list scrolls its row into sight (a
  // child row before its group's). "nearest": a row in view stays put. Again
  // once permissions and modules answer: until then the row is not drawn.
  const drawn = `${authz.ready}|${modules.join(",")}|${plan}`;
  useEffect(() => {
    const row =
      document.querySelector('[data-sidebar="menu-sub-button"][data-active="true"]') ??
      document.querySelector('[data-sidebar="menu-button"][data-active="true"]');
    row?.scrollIntoView?.({ block: "nearest" });
  }, [pathname, drawn]);

  // Carry only the scope params across navigation (drop page-specific selection
  // like ?order / ?edit) so links keep branch + period but reset local state.
  const keepScope = (prev: Record<string, unknown>) => ({ branchId: prev.branchId, preset: prev.preset, from: prev.from, to: prev.to });

  return (
    <Sidebar collapsible="icon" side={side} className="border-sidebar-border">
      <SidebarHeader className="group-data-[collapsible=icon]:invisible">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="px-2 hover:bg-transparent active:bg-transparent">
              <Link to="/" search={keepScope} onClick={close} aria-label={t("app.name", "Madar")}>
                {/* The shop's own mark where it is on the branding tier, and
                    Madar's wordmark otherwise. Read through the tier-gated
                    endpoint rather than the org row, so an org off the tier
                    cannot get here by accident — and so this needs no
                    permission a teller might not have.

                    Not inverted in dark mode the way the wordmark is: that
                    trick works on a two-colour wordmark and would flatten a
                    shop's logo to a silhouette. */}
                {SHOP_LOGO_IN_SIDEBAR && brand?.ownBranding && brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.orgName}
                    className="h-7 w-auto object-contain"
                    draggable={false}
                  />
                ) : (
                  <img
                    src={i18n.dir() === "rtl" ? "/madar_ar.svg" : "/madar.svg"}
                    alt={t("app.name", "Madar")}
                    className="h-7 w-auto brightness-0 invert"
                    draggable={false}
                  />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group) => {
          const entries = group.entries.filter((e) => (isParent(e) ? e.children.some(visible) : visible(e)));
          if (entries.length === 0) return null;
          return (
            <NavGroupSection
              key={group.labelKey}
              group={group}
              entries={entries}
              isActive={isActive}
              visible={visible}
              pathname={pathname}
              close={close}
              keepScope={keepScope}
            />
          );
        })}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
