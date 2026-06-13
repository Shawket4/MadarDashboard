/* eslint-disable */
// @ts-nocheck
import type { CmQuadrant } from './cmQuadrant';
import type { RevenueClass } from './revenueClass';

/**
 * Wire shape: `{"mode":"cm","quadrant":"star"}` / `{"mode":"revenue","class":"hero"}`
 * / `{"mode":"insufficient"}`. By construction `Cm` only ever describes
 * cost-tracked items and `Revenue` only cost-missing ones.
 */
export type Classification = {
  mode: 'cm';
  quadrant: CmQuadrant;
} | {
  class: RevenueClass;
  mode: 'revenue';
} | {
  mode: 'insufficient';
};
