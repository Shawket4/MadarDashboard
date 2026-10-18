/* eslint-disable */
// @ts-nocheck
import type { ArchiveFilter } from './archiveFilter';

export type ListBranchStockParams = {
/**
 * `active` | `archived` | `all`. Omitted = `all`: every non-deleted
 * ingredient, exactly the rows older dashboards and tills read (they look
 * names and costs up in this list, so an archived ingredient a recipe
 * still uses must stay in it). Pickers ask for `active`.
 */
status?: ArchiveFilter;
};
