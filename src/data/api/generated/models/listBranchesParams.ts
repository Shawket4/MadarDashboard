/* eslint-disable */
// @ts-nocheck
import type { BranchKind } from './branchKind';

export type ListBranchesParams = {
/**
 * Organization whose branches to list. Must match the caller's JWT org.
 */
org_id: string;
/**
 * Only this kind. Omitted: selling branches, plus warehouses when
 * `include_warehouses` is set.
 */
kind?: BranchKind;
/**
 * Also list warehouses (when `kind` is omitted). Off by default so a
 * client that predates warehouses (POS and KDS device setup, the staff
 * app) never offers one as a branch to sell from.
 */
include_warehouses?: boolean;
};
