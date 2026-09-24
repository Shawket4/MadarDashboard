/* eslint-disable */
// @ts-nocheck

export interface AuditBreakdownEntry {
  amount_minor: number;
  /**
     * A stable code for a label the SERVER wrote (`unspecified`,
     * `correction_request`, `auto_closed`, a void reason), so a client
     * words it in its own language (AT-13, E2E B-PAY-5). Absent for a
     * person's own words (a typed reason, a name): `label` is the text.
     * @nullable
     */
  code?: string | null;
  count: number;
  label: string;
}
