import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom";
import { Skeleton } from "@/shared/ui/skeleton";
import { ProtectedRoute } from "./protected-route";
import { OnboardingGate } from "./onboarding-gate";
import { Layout } from "@/widgets/layout/layout";

const Login = lazy(() => import("@/pages/auth/login"));
const Dashboard = lazy(() => import("@/pages/dashboard/dashboard"));
const Orgs = lazy(() => import("@/pages/orgs/orgs"));
const Users = lazy(() => import("@/pages/users/users"));
const Branches = lazy(() => import("@/pages/branches/branches"));
const Menu = lazy(() => import("@/pages/menu/menu"));
const MenuLayout = lazy(() => import("@/pages/menu/menu-layout"));
const MenuEngineering = lazy(() => import("@/pages/menu/engineering"));
const Bundles = lazy(() => import("@/pages/bundles/bundles"));
const Inventory = lazy(() => import("@/pages/inventory/inventory"));
const Recipes = lazy(() => import("@/pages/recipes/recipes"));
const Shifts = lazy(() => import("@/pages/shifts/shifts"));
const Orders = lazy(() => import("@/pages/orders/orders"));
const Analytics = lazy(() => import("@/pages/analytics/analytics"));
const Discounts = lazy(() => import("@/pages/discounts/discounts"));
const Permissions = lazy(() => import("@/pages/permissions/permissions"));
const Settings = lazy(() => import("@/pages/settings/settings"));
const PaymentMethods = lazy(() => import("@/pages/settings/payment-methods"));
const PublicMenu = lazy(() => import("@/pages/public-menu/public-menu"));
const MenuAdvisor = lazy(() => import("@/pages/menu-advisor/menu-advisor"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const NotFound = lazy(() => import("@/pages/error/not-found"));
const Landing = lazy(() => import("@/pages/landing/landing"));

function PageLoader() {
  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

const wrap = (el: React.ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

/** Backwards-compat redirect that carries the current scope query string. */
function RedirectWithSearch({ to }: { to: string }) {
  const loc = useLocation();
  return <Navigate to={{ pathname: to, search: loc.search }} replace />;
}

const router = createBrowserRouter([
  { path: "/login", element: wrap(<Login />) },
  { path: "/landing", element: wrap(<Landing />) },
  { path: "/menu/:orgId", element: wrap(<PublicMenu />) },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      // Full-screen wizard — outside the app shell (no sidebar, no header)
      { path: "onboarding", element: wrap(<Onboarding />) },
      {
        element: (
          <OnboardingGate>
            <Layout />
          </OnboardingGate>
        ),
        children: [
          { index: true, element: wrap(<Dashboard />) },
          { path: "orgs", element: wrap(<Orgs />) },
          { path: "users", element: wrap(<Users />) },
          { path: "branches", element: wrap(<Branches />) },
          {
            path: "menu",
            element: wrap(<MenuLayout />),
            children: [
              { index: true, element: <RedirectWithSearch to="/menu/items" /> },
              { path: "items", element: wrap(<Menu />) },
              { path: "add-ons", element: wrap(<Menu />) },
              { path: "recipes", element: wrap(<Recipes />) },
              { path: "bundles", element: wrap(<Bundles />) },
              { path: "engineering", element: wrap(<MenuEngineering />) },
              { path: "advisor", element: wrap(<MenuAdvisor />) },
            ],
          },
          // Backwards-compat: the old flat routes redirect into the menu tabs
          { path: "bundles", element: <RedirectWithSearch to="/menu/bundles" /> },
          { path: "recipes", element: <RedirectWithSearch to="/menu/recipes" /> },
          { path: "menu-advisor", element: <RedirectWithSearch to="/menu/advisor" /> },
          { path: "inventory", element: wrap(<Inventory />) },
          { path: "shifts", element: wrap(<Shifts />) },
          { path: "orders", element: wrap(<Orders />) },
          { path: "analytics", element: wrap(<Analytics />) },
          { path: "discounts", element: wrap(<Discounts />) },
          { path: "permissions", element: wrap(<Permissions />) },
          { path: "permissions/:userId", element: wrap(<Permissions />) },
          { path: "settings", element: wrap(<Settings />) },
          { path: "settings/payment-methods", element: wrap(<PaymentMethods />) },
          { path: "menu-advisor", element: wrap(<MenuAdvisor />) },
          { path: "*", element: wrap(<NotFound />) },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
