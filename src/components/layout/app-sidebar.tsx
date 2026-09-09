import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
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
import { NAV, isParent, type NavLeaf } from "@/config/nav";
import { useAuthStore } from "@/data/stores/auth.store";
import { useRoutePrefetch } from "@/hooks/use-route-prefetch";
import { useOrgId } from "@/hooks/use-org-id";
import { usePublicBrand } from "@/features/public-shell/use-brand";

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

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const brand = usePublicBrand(useOrgId());
  const side = i18n.dir() === "rtl" ? "right" : "left";
  const { setOpenMobile } = useSidebar();
  const isActive = useIsActive();
  const { pathname } = useLocation();
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "super_admin";

  const visible = (leaf: NavLeaf) => {
    if (leaf.superAdminOnly && !isSuperAdmin) return false;
    if (leaf.roles && (!role || !leaf.roles.includes(role))) return false;
    return true;
  };
  const close = () => setOpenMobile(false);

  // Predictive preloading on hover/focus: route code chunk + the page's queries.
  const pf = useRoutePrefetch();

  // Carry only the scope params across navigation (drop page-specific selection
  // like ?order / ?edit) so links keep branch + period but reset local state.
  const keepScope = (prev: Record<string, unknown>) => ({ branchId: prev.branchId, preset: prev.preset, from: prev.from, to: prev.to });

  return (
    <Sidebar collapsible="icon" side={side} className="border-sidebar-border">
      <SidebarHeader className="group-data-[collapsible=icon]:hidden">
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
                {brand?.ownBranding && brand.logoUrl ? (
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
                    className="h-7 w-auto dark:brightness-0 dark:invert"
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
          const entries = group.entries.filter((e) => (isParent(e) ? true : visible(e)));
          if (entries.length === 0) return null;
          return (
            <SidebarGroup key={group.labelKey}>
              <SidebarGroupLabel className="text-sidebar-foreground/70">{t(group.labelKey, group.fallback)}</SidebarGroupLabel>
              <SidebarMenu>
                {entries.map((entry) => {
                  if (isParent(entry)) {
                    const groupActive = pathname.startsWith(entry.basePath);
                    return (
                      <Collapsible
                        key={entry.labelKey}
                        asChild
                        defaultOpen={groupActive}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={t(entry.labelKey, entry.fallback)}
                              isActive={groupActive}
                              onMouseEnter={() => pf(entry.basePath)}
                              onFocus={() => pf(entry.basePath)}
                            >
                              <entry.icon />
                              <span>{t(entry.labelKey, entry.fallback)}</span>
                              <ChevronRight className="ms-auto transition-transform duration-200 motion-reduce:transition-none group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180 rtl:group-data-[state=open]/collapsible:-rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {entry.children.filter(visible).map((child) => (
                                <SidebarMenuSubItem key={child.to}>
                                  <SidebarMenuSubButton asChild isActive={isActive(child.to)}>
                                    <Link to={child.to} search={keepScope} onClick={close} onMouseEnter={() => pf(child.to)} onFocus={() => pf(child.to)}>
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

                  return (
                    <SidebarMenuItem key={entry.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(entry.to)}
                        tooltip={t(entry.labelKey, entry.fallback)}
                      >
                        <Link to={entry.to} search={keepScope} onClick={close} onMouseEnter={() => pf(entry.to)} onFocus={() => pf(entry.to)}>
                          <entry.icon />
                          <span>{t(entry.labelKey, entry.fallback)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
