import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { NAV, isParent, type NavLeaf } from "@/config/nav";
import { useAuthStore } from "@/data/stores/auth.store";
import { useRoutePrefetch } from "@/hooks/use-route-prefetch";

export function CommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefetch = useRoutePrefetch();
  const [open, setOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const visible = (leaf: NavLeaf) => !leaf.superAdminOnly || isSuperAdmin;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={t("common.search", "Search…")}
        className="h-8 w-9 justify-center gap-2 px-0 text-foreground sm:w-64 sm:justify-start sm:px-3"
      >
        <Search className="size-4" />
        <span className="hidden truncate sm:inline">{t("common.search", "Search…")}</span>
        <kbd className="ms-auto hidden items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-xs sm:inline-flex">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("common.search", "Search…")}
        description={t("commandPalette.hint", "Jump to any page")}
      >
        <CommandInput placeholder={t("common.searchPlaceholder", "Search…")} />
        <CommandList>
          <CommandEmpty>{t("common.noResults", "No results found")}</CommandEmpty>
          {NAV.map((group) => {
            const leaves: NavLeaf[] = group.entries.flatMap((e) =>
              isParent(e) ? e.children.filter(visible) : visible(e) ? [e] : [],
            );
            if (leaves.length === 0) return null;
            return (
              <CommandGroup key={group.labelKey} heading={t(group.labelKey, group.fallback)}>
                {leaves.map((leaf) => (
                  <CommandItem
                    key={leaf.to}
                    value={`${t(leaf.labelKey, leaf.fallback)} ${leaf.to}`}
                    onSelect={() => go(leaf.to)}
                    onMouseEnter={() => prefetch(leaf.to)}
                    onFocus={() => prefetch(leaf.to)}
                  >
                    <leaf.icon className="size-4" />
                    {t(leaf.labelKey, leaf.fallback)}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
