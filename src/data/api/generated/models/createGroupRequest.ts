/* eslint-disable */
// @ts-nocheck

export interface CreateGroupRequest {
  is_required?: boolean;
  /**
     * The legacy addon type this group is presented as to OLD clients through
     * the compat shim (the managed addon-type dropdown, e.g. `milk_type` /
     * `coffee_type` / `extra`). Swap-family behavior keys on it. `null` = a
     * custom group with no legacy lineage — INVISIBLE to old clients (the shim
     * projects `type` from this value, and the old wire requires it), so set
     * it whenever the pre-teardown fleet must see the group's options.
     * @nullable
     */
  legacy_addon_type?: string | null;
  /** @nullable */
  max_selections?: number | null;
  min_selections?: number;
  name: string;
  name_translations?: unknown;
  /** 'single' | 'multi'. */
  selection_type: string;
  sort?: number;
}
