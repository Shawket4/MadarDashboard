import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ScopeBar } from "@/widgets/scope-bar/scope-bar";

const TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: "nav.dashboard", sub: "dashboard.subtitle" },
  "/orgs": { title: "nav.orgs", sub: "orgs.subtitle" },
  "/users": { title: "nav.users", sub: "users.subtitle" },
  "/branches": { title: "nav.branches", sub: "branches.subtitle" },
  "/menu": { title: "nav.menu", sub: "menu.subtitle" },
  "/inventory": { title: "nav.inventory", sub: "inventory.subtitle" },
  "/recipes": { title: "nav.recipes", sub: "recipes.subtitle" },
  "/shifts": { title: "nav.shifts", sub: "shifts.subtitle" },
  "/orders": { title: "nav.orders", sub: "orders.subtitle" },
  "/analytics": { title: "nav.analytics", sub: "analytics.subtitle" },
  "/discounts": { title: "nav.discounts", sub: "discounts.subtitle" },
  "/permissions": { title: "nav.permissions", sub: "permissions.subtitle" },
  "/settings": { title: "nav.settings", sub: "" },
};

interface Props {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function Header({ onMenuClick, onSearchClick }: Props) {
  const { t } = useTranslation();
  const loc = useLocation();
  const segs = loc.pathname.split("/").filter(Boolean);
  const base = segs.length ? "/" + segs[0] : "/";
  const meta = TITLES[base] ?? { title: "app.name", sub: "" };

  return (
    <header className="h-14 flex-shrink-0 bg-background border-b flex items-center px-4 gap-3 sticky top-0 z-30">
      <Button variant="ghost" size="iconSm" onClick={onMenuClick} className="lg:hidden flex-shrink-0">
        <Menu />
      </Button>
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-bold leading-tight truncate">{t(meta.title)}</h1>
        {meta.sub && <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block truncate">{t(meta.sub)}</p>}
      </div>
      <ScopeBar />
      <button
        onClick={onSearchClick}
        className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg"
      >
        <Search size={12} />
        <span>{t("common.search")}</span>
        <kbd className="text-xs bg-background border rounded px-1 font-mono">⌘K</kbd>
      </button>
    </header>
  );
}
