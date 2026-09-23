import { Navigate, createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { useOrgModules } from "@/hooks/use-org-modules";

/** A Dawam-only org has no sales to show: home is its team (PS-3, DSH-2). */
function Home() {
  const modules = useOrgModules();
  if (!modules.includes("pos") && modules.includes("dawam")) {
    return <Navigate to="/staff/team" replace />;
  }
  return <DashboardPage />;
}

export const Route = createFileRoute("/_app/")({
  component: Home,
});
