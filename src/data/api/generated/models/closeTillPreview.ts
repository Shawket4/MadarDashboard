/* eslint-disable */
// @ts-nocheck
import type { CloseTillMethod } from './closeTillMethod';
import type { LastTillWarning } from './lastTillWarning';
import type { Till } from './till';

export interface CloseTillPreview {
  expected_cash: number;
  last_till_warning?: null | LastTillWarning;
  methods: CloseTillMethod[];
  till: Till;
}
