/**
 * One read-only customer sheet for a surface full of `CustomerLink`s — the
 * orders table, a floor, the bookings list. A link only looks: editing,
 * merging and erasing belong to the Customers page.
 */
import { useState, type ReactNode } from "react";

import { useAuthz } from "@/data/authz/use-authz";
import { OrderDetailSheet } from "@/features/orders/order-detail-sheet";

import { peopleAccess } from "./access";
import { CustomerDetailSheet } from "./customer-detail-sheet";
import type { CustomerLinkControl } from "./customer-link";

export interface CustomerSheetControl extends CustomerLinkControl {
  /** Mount once, anywhere in the surface. */
  sheet: ReactNode;
}

/**
 * `onOpenOrder` is for a surface that already shows orders (the orders page);
 * without it, one of the customer's orders opens in a sheet of its own.
 */
export function useCustomerSheet(opts?: { onOpenOrder?: (orderId: string) => void }): CustomerSheetControl {
  const canOpen = peopleAccess(useAuthz()).canViewCustomers;
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const openOrder = opts?.onOpenOrder ?? setOrderId;
  return {
    canOpen,
    open: setCustomerId,
    sheet: canOpen ? (
      <>
        <CustomerDetailSheet
          customerId={customerId}
          readOnly
          onOpenChange={(o) => !o && setCustomerId(null)}
          onOpenOrder={(id) => {
            setCustomerId(null);
            openOrder(id);
          }}
        />
        {opts?.onOpenOrder ? null : (
          <OrderDetailSheet
            orderId={orderId}
            open={!!orderId}
            onOpenChange={(o) => !o && setOrderId(null)}
            onSwitchOrder={setOrderId}
          />
        )}
      </>
    ) : null,
  };
}
