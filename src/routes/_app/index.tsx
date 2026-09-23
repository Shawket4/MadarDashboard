import { Navigate, createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { useOrgModulesState } from "@/hooks/use-org-modules";

/** A Dawam-only org has no sales to show: home is its team (PS-3, DSH-2). */
function Home() {
  const { modules, known } = useOrgModulesState();
  // Nothing on a guess: a Dawam-only org's manager never sees the sales home.
  if (!known) return null;
  if (!modules.includes("pos") && modules.includes("dawam")) {
    return <Navigate to="/staff/team" replace />;
  }
  return <DashboardPage />;
}

export const Route = createFileRoute("/_app/")({
  component: Home,
});
