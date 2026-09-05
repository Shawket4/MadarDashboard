/* eslint-disable */
// @ts-nocheck

export type AvailabilityParams = {
branch_id: string;
date: string;
party_size: number;
section_id?: string;
/**
 * Ignore this booking's own claims (when moving it).
 */
exclude_booking_id?: string;
};
