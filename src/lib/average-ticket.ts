import { rules } from "@/lib/rules";

/**
 * The average bill, as the till and `GET /reports/branches/{id}/pos-metrics`
 * work it (`madar_money::metrics::average_ticket`, WebAssembly): sales over
 * orders, rounded half up, 0 when there is nothing to divide by.
 */
export const averageTicket = (sales: number, orders: number): number => rules.average_ticket(sales, orders);
