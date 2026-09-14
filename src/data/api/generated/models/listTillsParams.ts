/* eslint-disable */
// @ts-nocheck

export type ListTillsParams = {
status?: string;
teller_id?: string;
device_id?: string;
/**
 * Only tills opened while another was open, or with a disagreed reconciliation.
 */
flagged?: boolean;
from?: string;
to?: string;
page?: number;
per_page?: number;
};
