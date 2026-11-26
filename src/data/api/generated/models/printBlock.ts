/* eslint-disable */
// @ts-nocheck
import type { PrintTable } from './printTable';

/**
 * What a sheet is made of, top to bottom.
 */
export type PrintBlock = {
  kind: 'group';
  text: string;
} | PrintTable & {
  kind: 'table';
};
