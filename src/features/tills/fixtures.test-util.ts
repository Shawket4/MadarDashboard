import type { Till } from "./api";

export const till = (over: Partial<Till> = {}): Till => ({
  id: "t1",
  branch_id: "b1",
  teller_id: "u1",
  teller_name: "Mona Adel",
  status: "closed",
  opening_cash: 100_000,
  opening_cash_was_edited: false,
  opened_at: "2026-09-13T06:00:00Z",
  closed_at: "2026-09-13T15:00:00Z",
  cash_discrepancy: 0,
  device_id: "d1",
  device_code: "36B",
  device_label: "Counter",
  verification: "server",
  opened_while_another_open: false,
  other_till_id: null,
  reconciliation_status: "clean",
  disagreement_count: 0,
  ...over,
});
