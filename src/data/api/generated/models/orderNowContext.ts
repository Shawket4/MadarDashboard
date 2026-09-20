/* eslint-disable */
// @ts-nocheck
import type { OrderNowFull } from './orderNowFull';

export interface OrderNowContext {
  /** First word of the name on file. */
  first_name: string;
  full?: null | OrderNowFull;
  /**
     * NAME only on the masked path; the full context carries the id.
     * @nullable
     */
  last_branch_name?: string | null;
  /** @nullable */
  logo_url?: string | null;
  org_id: string;
  org_name: string;
  /** `•••• 4567`. */
  phone_hint: string;
  /**
     * True → this is the masked context; verify the phone
     * (`/public/otp/request|verify`) and ask again with the device token.
     */
  verify_required: boolean;
}
