/* eslint-disable */
// @ts-nocheck

export interface CreateRoleRequest {
  /**
     * Start from this role's grants; otherwise from the default template.
     * @nullable
     */
  copy_from?: string | null;
  /** branch_manager | teller | waiter | kitchen */
  kind: string;
  name_ar: string;
  name_en: string;
}
