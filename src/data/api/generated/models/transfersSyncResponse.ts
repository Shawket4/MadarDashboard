/* eslint-disable */
// @ts-nocheck
import type { TransferView } from './transferView';

export interface TransfersSyncResponse {
  server_time: string;
  transfers: TransferView[];
}
