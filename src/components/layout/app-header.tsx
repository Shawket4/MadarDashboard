import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandPalette } from "./command-palette";
import { ScopeBar, ScopeBarMobile } from "./scope-bar";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  return (
    <header className="safe-top sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
      <SidebarTrigger className="-ms-1" />
      <CommandPalette />
      <div className="ms-auto flex items-center gap-1">
        <div className="hidden md:block">
          <ScopeBar />
        </div>
        <ScopeBarMobile className="md:hidden" />
        <ThemeToggle />
        <LanguageToggle />
        <UserMenu />
      </div>
    </header>
  );
}
