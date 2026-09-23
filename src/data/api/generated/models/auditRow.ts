/* eslint-disable */
// @ts-nocheck

export interface AuditRow {
  action: string;
  /** @nullable */
  actor_id?: string | null;
  /** @nullable */
  actor_name?: string | null;
  created_at: string;
  details: unknown;
  /** @nullable */
  employee_id?: string | null;
  /** @nullable */
  employee_name?: string | null;
  entity: string;
  /** @nullable */
  entity_id?: string | null;
  id: string;
  /** @nullable */
  period_id?: string | null;
  /** @nullable */
  reason?: string | null;
}
