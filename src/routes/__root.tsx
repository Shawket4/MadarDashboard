import { useEffect } from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Direction } from "radix-ui";
import { Toaster } from "@/components/ui/sonner";
import { DevTools } from "@/components/app/dev-tools";
import { useAuthStore } from "@/data/stores/auth.store";
import { useSignedInTitle } from "@/hooks/use-signed-in-title";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { i18n } = useTranslation();
  // Feed the active direction to every Radix primitive (Select, Combobox/cmdk,
  // Tabs, Popover, Dropdown…) so menus, positioning and keyboard nav mirror in
  // Arabic — <html dir> alone only covers CSS logical properties.
  const dir = i18n.dir() === "rtl" ? "rtl" : "ltr";
  const signedIn = useAuthStore((s) => !!s.token);
  // index.html's title is for the signed-out visitor ("Madar POS — sign in | مدار").
  useSignedInTitle(signedIn);
  // So is its band about Madar POS (#about-madar, outside #root): signed in, it hides.
  useEffect(() => {
    document.getElementById("about-madar")?.toggleAttribute("hidden", signedIn);
  }, [signedIn]);
  return (
    <Direction.Provider dir={dir}>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
      <DevTools which="router" />
    </Direction.Provider>
  );
}
