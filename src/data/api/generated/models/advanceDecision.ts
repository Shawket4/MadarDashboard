/* eslint-disable */
// @ts-nocheck

/**
 * Deciding a SALARY ADVANCE. Deliberately not called `DecisionRequest`: staff
 * requests have their own decision body carrying `is_paid`, and two structs
 * sharing a name collapse into one OpenAPI schema — which silently gave every
 * generated client the wrong shape for one of them.
 */
export interface AdvanceDecision {
  /** @nullable */
  note?: string | null;
  /** `approved` | `rejected` | `cancelled`. */
  status: string;
}
