/* eslint-disable */
// @ts-nocheck

export interface StaffDocument {
  created_at: string;
  employee_id: string;
  /** @nullable */
  expires_on?: string | null;
  /** @nullable */
  file_url?: string | null;
  id: string;
  kind: string;
  org_id: string;
  title: string;
  /** @nullable */
  uploaded_by?: string | null;
}
