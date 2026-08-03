/* eslint-disable */
// @ts-nocheck

export interface OrgPaymentMethod {
  color: string;
  created_at: string;
  icon: string;
  id: string;
  is_active: boolean;
  is_cash: boolean;
  label_translations: unknown;
  name: string;
  org_id: string;
  updated_at: string;
  /**
     * When false, orders tendered with this method are excluded entirely
     * from the partner analytics API (`/integrations/analytics/orders`) —
     * rows and aggregates alike. Defaults to true.
     */
  visible_in_integrations: boolean;
}
