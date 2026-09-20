/* eslint-disable */
// @ts-nocheck

export type OrderNowContextParams = {
/**
 * From `/public/otp/verify`, for the customer's current phone. Absent or
 * not valid for that phone → the masked context.
 */
device_token?: string;
};
