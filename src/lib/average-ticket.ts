/**
 * The average bill, as the till and `GET /reports/branches/{id}/pos-metrics`
 * work it (`madar_money::metrics::average_ticket`): sales over orders, rounded
 * half up, 0 when there is nothing to divide by.
 */
export const averageTicket = (sales: number, orders: number): number =>
  orders > 0 ? Math.floor((2 * sales + orders) / (2 * orders)) : 0;
