import { prefetchOrders } from "@/features/orders/queries";
import { prefetchBasira } from "@/features/basira/queries";
import { prefetchBookings } from "@/features/bookings/queries";
import { prefetchCustomers } from "@/features/customers/queries";
import { prefetchDashboard } from "@/features/dashboard/queries";
import { prefetchTills } from "@/features/tills/queries";
import {
  getListFloorTablesQueryOptions,
  getListFloorTransfersQueryOptions,
  getListOpenTicketsQueryOptions,
  getListSectionsQueryOptions,
} from "@/data/api/generated/api";
import type { RoutePrefetchMap } from "@/lib/route-prefetch";

/** Sidebar/palette intent prefetch for the sales area: route → its mount-time queries. */
export const routes: RoutePrefetchMap = {
  "/orders": prefetchOrders,
  "/": prefetchDashboard,
  "/floor": (qc, { branchId }) => {
    if (!branchId) return;
    void qc.prefetchQuery(getListSectionsQueryOptions({ branch_id: branchId }));
    void qc.prefetchQuery(getListFloorTablesQueryOptions({ branch_id: branchId }));
    void qc.prefetchQuery(getListFloorTransfersQueryOptions({ branch_id: branchId }));
    void qc.prefetchQuery(getListOpenTicketsQueryOptions({ branch_id: branchId }));
  },
  "/bookings": prefetchBookings,
  "/tills": prefetchTills,
  "/customers": prefetchCustomers,
  "/basira": (qc) => prefetchBasira(qc),
};
