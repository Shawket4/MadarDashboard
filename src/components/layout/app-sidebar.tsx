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

const useIsActive = () => {
  const { pathname } = useLocation();
  return (to: string) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`));
};

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const side = i18n.dir() === "rtl" ? "right" : "left";
  const { setOpenMobile } = useSidebar();
  const isActive = useIsActive();
  const { pathname } = useLocation();
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "super_admin";

  const visible = (leaf: NavLeaf) => !leaf.superAdminOnly || isSuperAdmin;
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
                {/* The real wordmark (navy + terracotta dot). Goes monochrome
                    white on the navy rail in dark mode. */}
                <img
                  src={i18n.dir() === "rtl" ? "/madar_ar.svg" : "/madar.svg"}
                  alt={t("app.name", "Madar")}
                  className="h-7 w-auto dark:brightness-0 dark:invert"
                  draggable={false}
                />
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
