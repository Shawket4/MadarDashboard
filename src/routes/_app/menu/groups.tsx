import { createFileRoute } from "@tanstack/react-router";
import { GroupsPage } from "@/features/menu/groups/groups-page";

/** Choice groups. `?edit=<groupId>|new` opens the group editor. */
export const Route = createFileRoute("/_app/menu/groups")({
  validateSearch: (s: Record<string, unknown>): { edit?: string } => ({
    edit: typeof s.edit === "string" ? s.edit : undefined,
  }),
  component: GroupsPage,
});
