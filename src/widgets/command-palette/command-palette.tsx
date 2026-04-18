import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart2,
  BookOpen,
  Building2,
  Clock,
  Coffee,
  GitBranch,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shared/ui/command";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import type { Role } from "@/shared/config/constants";

const ITEMS = [
  { to: "/", icon: LayoutDashboard, key: "nav.dashboard", roles: ["super_admin", "org_admin", "branch_manager", "teller"] },
  { to: "/orgs", icon: Building2, key: "nav.orgs", roles: ["super_admin"] },
  { to: "/users", icon: Users, key: "nav.users", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/branches", icon: GitBranch, key: "nav.branches", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/menu", icon: Coffee, key: "nav.menu", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/inventory", icon: Package, key: "nav.inventory", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/recipes", icon: BookOpen, key: "nav.recipes", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/shifts", icon: Clock, key: "nav.shifts", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/orders", icon: ShoppingBag, key: "nav.orders", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/analytics", icon: BarChart2, key: "nav.analytics", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/discounts", icon: Tag, key: "nav.discounts", roles: ["super_admin", "org_admin", "branch_manager"] },
  { to: "/permissions", icon: Shield, key: "nav.permissions", roles: ["super_admin", "org_admin"] },
  { to: "/settings", icon: Settings, key: "nav.settings", roles: ["super_admin", "org_admin", "branch_manager"] },
] as const;

export function CommandPalette() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useCurrentContext();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const filtered = ITEMS.filter((i) => role && (i.roles as readonly Role[]).includes(role));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-lg" showClose={false}>
        <Command>
          <CommandInput placeholder={`${t("common.search")}…`} />
          <CommandList>
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            <CommandGroup heading={t("nav.overview")}>
              {filtered.map(({ to, icon: Icon, key }) => (
                <CommandItem
                  key={to}
                  onSelect={() => {
                    navigate(to);
                    setOpen(false);
                  }}
                >
                  <Icon />
                  <span>{t(key)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
