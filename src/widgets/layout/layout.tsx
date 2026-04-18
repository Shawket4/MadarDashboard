import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/widgets/sidebar/sidebar";
import { Header } from "@/widgets/header/header";
import { CommandPalette } from "@/widgets/command-palette/command-palette";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={() =>
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
          }
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
