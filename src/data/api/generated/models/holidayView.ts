/* eslint-disable */
// @ts-nocheck

export interface HolidayView {
  /**
     * null = not decided yet: a normal day unless set up (RU-10).
     * @nullable
     */
  decision?: string | null;
  name_ar: string;
  name_en: string;
  on_date: string;
}
