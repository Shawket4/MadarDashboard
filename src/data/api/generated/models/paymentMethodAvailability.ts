/* eslint-disable */
// @ts-nocheck
import type { AllowList } from './allowList';
import type { DeviceAllowList } from './deviceAllowList';
import type { UserAllowList } from './userAllowList';

export interface PaymentMethodAvailability {
  branch: AllowList;
  branch_id: string;
  devices: DeviceAllowList[];
  users: UserAllowList[];
}
