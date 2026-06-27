/**
 * Field limits for the public ordering form. These MIRROR the backend caps in
 * MadarRust `src/delivery/mod.rs` (`MAX_NAME_LEN`, `MAX_LINE_QTY`, …). The server
 * is authoritative and re-validates every field — these are the UX guard so a
 * customer can never type/submit a payload the backend will reject.
 */
export const FIELD_LIMITS = {
  /** customer_name */
  name: 120,
  /** place_name / floor / unit_number / landmark */
  shortText: 120,
  /** address_line */
  address: 500,
  /** delivery_notes */
  notes: 1000,
  /** per-line notes */
  lineNotes: 500,
  /** distinct cart lines */
  cartLines: 100,
  /** per-line item quantity */
  lineQty: 999,
  /** per-addon quantity */
  addonQty: 99,
} as const;
