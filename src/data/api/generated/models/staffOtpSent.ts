/* eslint-disable */
// @ts-nocheck

export interface StaffOtpSent {
  /**
     * The code itself — only from a debug build with `MADAR_DEV_OTP_ECHO=1`,
     * so a developer can sign in without WhatsApp. Never in release.
     * @nullable
     */
  dev_code?: string | null;
  sent: boolean;
}
