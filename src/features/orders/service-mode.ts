/**
 * How the customer takes an order: the cart's Pickup / Dine in toggle, stored
 * on every order of every plan (`orders.service_mode`). A sale from a till that
 * never sent it is Pickup (`takeaway`), and so is a delivery.
 */
import { ShoppingBag, UtensilsCrossed, type LucideIcon } from "lucide-react";

export type ServiceMode = "takeaway" | "dine_in";

export const SERVICE_MODES: readonly ServiceMode[] = ["takeaway", "dine_in"];

export const serviceModeOf = (order: { service_mode?: string | null } | null | undefined): ServiceMode =>
  order?.service_mode === "dine_in" ? "dine_in" : "takeaway";

export const SERVICE_MODE_ICON: Record<ServiceMode, LucideIcon> = {
  takeaway: ShoppingBag,
  dine_in: UtensilsCrossed,
};

/** The report's rows (`by_service_mode`) in a fixed order, with each one's share of the revenue. */
export interface ServiceModeRow {
  mode: ServiceMode;
  orders: number;
  revenue: number;
  /** 0..1 of the two rows' revenue; 0 when there was none. */
  share: number;
}

export function serviceModeRows(
  rows: ReadonlyArray<{ service_mode: string; orders: number; revenue: number }> | null | undefined,
): ServiceModeRow[] {
  const by = new Map<ServiceMode, { orders: number; revenue: number }>();
  for (const r of rows ?? []) {
    const mode = r.service_mode === "dine_in" ? "dine_in" : "takeaway";
    const cur = by.get(mode) ?? { orders: 0, revenue: 0 };
    by.set(mode, { orders: cur.orders + r.orders, revenue: cur.revenue + r.revenue });
  }
  const total = SERVICE_MODES.reduce((s, m) => s + (by.get(m)?.revenue ?? 0), 0);
  return SERVICE_MODES.map((mode) => {
    const v = by.get(mode) ?? { orders: 0, revenue: 0 };
    return { mode, ...v, share: total > 0 ? v.revenue / total : 0 };
  });
}
