/* eslint-disable */
// @ts-nocheck
import type { CreateDecisionRequestDetail } from './createDecisionRequestDetail';

export interface CreateDecisionRequest {
  /** `acted` | `dismissed` | `snoozed`. */
  action: string;
  /** @nullable */
  branch_id?: string | null;
  detail?: CreateDecisionRequestDetail;
  menu_item_id: string;
  signal_kind: string;
  size_label?: string;
}
