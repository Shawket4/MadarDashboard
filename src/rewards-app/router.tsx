/**
 * Rewards by Madar's router. Code-based (the dashboard's file routes are its
 * own tree), over the same pages at the same internal paths (`/rewards/...`),
 * so every link inside them works unchanged; `rewrite` shows them at the root
 * of the host (see paths.ts).
 */
import { useEffect } from "react";
import { Outlet, createRootRoute, createRoute, createRouter, redirect, type RouteComponent } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Direction } from "radix-ui";

import { Toaster } from "@/components/ui/toast";
import { NotFound } from "@/components/app/not-found";
import { useAuthStore } from "@/data/stores/auth.store";
import { requireAuth } from "@/lib/auth-guard";
import { listScrollKey } from "@/data/scope/list-search";
import { scopeSearchSchema } from "@/data/scope/use-url-scope";
import { rewardsMembersSearch, rewardsProgrammeSearch } from "@/features/rewards/search";
import { RewardsOverviewPage } from "@/features/rewards/overview/overview-page";
import { RewardsMembersPage } from "@/features/rewards/members/members-page";
import { RewardsMemberPage } from "@/features/rewards/members/member-page";
import { RewardsProgrammePage } from "@/features/rewards/programme/programme-page";
import { CardDesignerPage } from "@/features/rewards/card/card-designer-page";
import { NotificationsPage } from "@/features/rewards/notifications/notifications-page";
import { AutomationsPage } from "@/features/rewards/automations/automations-page";
import { z } from "zod";

import { INTERNAL, toExternal, toInternal } from "./paths";
import { RewardsLoginPage } from "./login-page";
import { RewardsShell } from "./shell";

function Root() {
  const { i18n, t } = useTranslation();
  // Radix primitives mirror in Arabic from this, as in the dashboard.
  const dir = i18n.dir() === "rtl" ? "rtl" : "ltr";
  const name = t("rewardsApp.productName", "Rewards by Madar");
  useEffect(() => {
    document.title = name;
  }, [name]);
  return (
    <Direction.Provider dir={dir}>
      <Outlet />
      <Toaster preload />
    </Direction.Provider>
  );
}

const rootRoute = createRootRoute({ component: Root });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: () => {
    if (useAuthStore.getState().token) throw redirect({ to: INTERNAL });
  },
  component: RewardsLoginPage,
});

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  validateSearch: scopeSearchSchema,
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: RewardsShell,
});

const page = (path: string, component: RouteComponent) =>
  createRoute({ getParentRoute: () => shellRoute, path, component });

const routeTree = rootRoute.addChildren([
  loginRoute,
  shellRoute.addChildren([
    page(INTERNAL, RewardsOverviewPage),
    createRoute({
      getParentRoute: () => shellRoute,
      path: `${INTERNAL}/members`,
      validateSearch: rewardsMembersSearch.validateSearch,
      beforeLoad: rewardsMembersSearch.beforeLoad,
      component: RewardsMembersPage,
    }),
    page(`${INTERNAL}/members/$memberId`, RewardsMemberPage),
    createRoute({
      getParentRoute: () => shellRoute,
      path: `${INTERNAL}/programme`,
      validateSearch: rewardsProgrammeSearch.validateSearch,
      beforeLoad: rewardsProgrammeSearch.beforeLoad,
      component: RewardsProgrammePage,
    }),
    page(`${INTERNAL}/card`, CardDesignerPage),
    page(`${INTERNAL}/notifications`, NotificationsPage),
    page(`${INTERNAL}/automations`, AutomationsPage),
  ]),
]);

export function createRewardsRouter() {
  return createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    getScrollRestorationKey: listScrollKey,
    defaultNotFoundComponent: () => <NotFound home={INTERNAL} />,
    rewrite: {
      input: ({ url }) => {
        const path = toInternal(url.pathname);
        if (path === url.pathname) return undefined;
        url.pathname = path;
        return url;
      },
      output: ({ url }) => {
        const path = toExternal(url.pathname);
        if (path === url.pathname) return undefined;
        url.pathname = path;
        return url;
      },
    },
  });
}
