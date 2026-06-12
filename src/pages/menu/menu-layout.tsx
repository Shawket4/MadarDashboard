import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { PageShell, NestedPageShellContext } from "@/shared/ui/page-shell";
import { usePermissions } from "@/shared/hooks/use-permissions";

interface MenuTab {
  to: string;
  key: string;
  resource: string;
}

const TABS: MenuTab[] = [
  { to: "/menu/items", key: "menu.tabs.items", resource: "menu_items" },
  { to: "/menu/recipes", key: "menu.tabs.recipes", resource: "recipes" },
  { to: "/menu/bundles", key: "menu.tabs.bundles", resource: "menu_items" },
  { to: "/menu/engineering", key: "menu.tabs.engineering", resource: "orders" },
  { to: "/menu/advisor", key: "menu.tabs.advisor", resource: "menu_items" },
];

/**
 * One shell for the whole menu domain — items, recipes, bundles,
 * engineering and the advisor render as tab panels inside it.
 */
export default function MenuLayout() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const tabs = TABS.filter((tab) => can(tab.resource, "read"));

  return (
    <PageShell title={t("nav.menu")} description={t("menu.subtitle")}>
      <nav className="flex rounded-lg border p-0.5 bg-muted w-fit max-w-full overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors",
                isActive ? "bg-background shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {t(tab.key)}
          </NavLink>
        ))}
      </nav>

      <NestedPageShellContext.Provider value={true}>
        <Outlet />
      </NestedPageShellContext.Provider>
    </PageShell>
  );
}
