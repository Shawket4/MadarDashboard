/* eslint-disable */
// @ts-nocheck
import type { BundleStatus } from './bundleStatus';

export type ListBundlesParams = {
org_id?: string;
status?: BundleStatus;
branch_id?: string;
search?: string;
page?: number;
per_page?: number;
/**
 * Sort: name_asc | name_desc | price_asc | price_desc | created_asc |
 * created_desc (default).
 */
sort?: string;
};
