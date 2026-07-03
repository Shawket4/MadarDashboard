/* eslint-disable */
// @ts-nocheck

export interface CreateOptionRequest {
  is_active?: boolean;
  is_default?: boolean;
  name: string;
  name_translations?: unknown;
  price: number;
  /** @nullable */
  replaces_ingredient_id?: string | null;
}
