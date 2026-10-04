/* eslint-disable */
// @ts-nocheck
import type { BranchKind } from './branchKind';

export type ListBranchesParams = {
/**
 * Organization whose branches to list. Must match the caller's JWT org.
 */
org_id: string;
/**
 * Only this kind; omitted = branches and warehouses.
 */
kind?: BranchKind;
};
