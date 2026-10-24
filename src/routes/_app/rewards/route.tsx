import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { rewardsHref } from "@/lib/rewards-host";

/**
 * With Rewards by Madar on its own host (VITE_REWARDS_URL, the production
 * dashboard), every Rewards page here is that host's page: `/rewards/members`
 * → `https://rewards.madar-pos.cloud/members`, signed in by the shared session.
 * Without one (the demo, the desktop app, local development) the pages stay
 * here.
 */
export const Route = createFileRoute("/_app/rewards")({
  beforeLoad: ({ location }) => {
    const path = location.pathname.replace(/^\/rewards/, "") || "/";
    const href = rewardsHref(path, location.searchStr);
    if (href) throw redirect({ href, replace: true });
  },
  component: Outlet,
});
