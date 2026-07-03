/* eslint-disable */
// @ts-nocheck

/**
 * Every field optional — only present keys are updated. `Option<Option<T>>` (with
 * `deserialize_with`) is avoided; nullable columns that must be clearable
 * (`max_selections`) are handled by a dedicated presence flag pattern below.
 */
export interface PatchGroupRequest {
  /** @nullable */
  is_required?: boolean | null;
  /** @nullable */
  max_selections?: number | null;
  /** @nullable */
  min_selections?: number | null;
  /** @nullable */
  name?: string | null;
  name_translations?: unknown;
  /** @nullable */
  selection_type?: string | null;
  /** @nullable */
  sort?: number | null;
}
