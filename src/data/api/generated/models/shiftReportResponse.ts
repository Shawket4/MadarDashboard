/* eslint-disable */
// @ts-nocheck
import type { Shift } from './shift';
import type { TillReportFigures } from './tillReportFigures';

export type ShiftReportResponse = TillReportFigures & {
  shift: Shift;
};
