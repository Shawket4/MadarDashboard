import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useTranslation } from "react-i18next";
import { Direction } from "radix-ui";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { i18n } = useTranslation();
  // Feed the active direction to every Radix primitive (Select, Combobox/cmdk,
  // Tabs, Popover, Dropdown…) so menus, positioning and keyboard nav mirror in
  // Arabic — <html dir> alone only covers CSS logical properties.
  const dir = i18n.dir() === "rtl" ? "rtl" : "ltr";
  return (
    <Direction.Provider dir={dir}>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </Direction.Provider>
  );
}
