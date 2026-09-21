/* eslint-disable */
// @ts-nocheck

/**
 * A resolution problem that the order path only logs; the preview returns it.
 */
export interface ResolveWarning {
  message: string;
  /**
     * `unit_conversion` | `swap_failed` | `optional_not_found` | `optional_size_mismatch`,
     * or a lint rule id (`F4`…`F10`) when added by the preview.
     */
  rule: string;
}
