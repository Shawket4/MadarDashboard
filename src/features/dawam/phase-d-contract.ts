/**
 * The fields and endpoints the backend built for the minor items but hasn't
 * exported into openapi.json yet (e2e/backend-fixes after 2512322). Each is
 * imported from ONE place, so once the client is regenerated this file is
 * deleted and each import swapped for the generated type or function:
 * - StaffRequestD → StaffRequest (worked_dates, M16): features/staff/requests-inbox.tsx
 * - AttendanceFlagD → AttendanceFlag (deduction_status, M33): features/dawam/team-page.tsx
 * - clearExpenseAdvance / reassignExpenseAdvance → the generated
 *   DELETE / PATCH /staff/expense-advances/{id} (M39): features/dawam/money-dialogs.tsx
 * (PresenceRow.punch_opens_at, M15, and ClaimDecision.warnings, M26, are read
 * structurally in phase-d.ts and need no swap.)
 */
import { customInstance } from "@/data/api/custom-instance";
import type { AttendanceFlag, StaffRequest } from "@/data/api/generated/models";

/** A leave or mission (M16): the days of its span the person already clocked in on. */
export type StaffRequestD = StaffRequest & { worked_dates?: string[] };

/** A handled flag (M33): the deduction it made and whether it counts yet (`pending` waits for the owner). */
export type AttendanceFlagD = AttendanceFlag & { deduction_id?: string | null; deduction_status?: string | null };

/**
 * Correcting a till-tagged expense advance (M39, owner decision 39): the
 * owner clears the tag (DELETE `?reason=`) or moves it (PATCH `{employee_id,
 * reason}`); the cash that left the till stays as it is.
 */
export const clearExpenseAdvance = (id: string, params: { reason: string }) =>
  customInstance<unknown>({ url: `/staff/expense-advances/${id}`, method: "DELETE", params });
export const reassignExpenseAdvance = (id: string, body: { employee_id: string; reason: string }) =>
  customInstance<unknown>({ url: `/staff/expense-advances/${id}`, method: "PATCH", headers: { "Content-Type": "application/json" }, data: body });
