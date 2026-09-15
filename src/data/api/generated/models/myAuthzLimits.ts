/* eslint-disable */
// @ts-nocheck
import type { LimitsView } from './limitsView';

/**
 * Limits on held capabilities, by key; absent = unlimited.
 */
export type MyAuthzLimits = {[key: string]: LimitsView};
