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
};
