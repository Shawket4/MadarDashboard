import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandPalette } from "./command-palette";
import { ScopeBar, ScopeBarMobile } from "./scope-bar";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  return (
    <header className="safe-top no-scrollbar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-b bg-background px-3 sm:px-4">
      <SidebarTrigger className="-ms-1 shrink-0" />
      <div className="shrink-0">
        <CommandPalette />
      </div>
      {/* Right cluster stays intact and scrolls into view at narrow widths
          rather than clipping the toggles. */}
      <div className="ms-auto flex shrink-0 items-center gap-1">
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
