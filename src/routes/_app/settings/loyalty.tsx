import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Moved: Settings › Loyalty lives in the Rewards module now (one place for one
 * programme). Old links keep working, each tab landing where it went.
 */
export const Route = createFileRoute("/_app/settings/loyalty")({
  validateSearch: (s: Record<string, unknown>): { tab?: string } => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
  }),
  beforeLoad: ({ search }) => {
    const tab = (search as { tab?: string }).tab;
    if (tab === "members") throw redirect({ to: "/rewards/members" });
    if (tab === "overview") throw redirect({ to: "/rewards" });
    if (tab === "rewards") throw redirect({ to: "/rewards/programme", search: { tab: "rewards" } });
    throw redirect({ to: "/rewards/programme" });
  },
});
