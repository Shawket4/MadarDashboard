/**
 * The input kit: the fields every Dawam (and, in time, every) form uses in
 * place of the browser's native time/date/number controls. Each one types in
 * Latin or Arabic digits, reads back on the app's clock and calendar, works
 * by keyboard and touch, flips for RTL, and refuses what it can't read out
 * loud instead of saving something else.
 */
export { TimeField } from "./time-field";
export { TimeRangeField } from "./time-range-field";
export { NumberField } from "./number-field";
export { DurationField } from "./duration-field";
export { MoneyField } from "./money-field";
export { DateField, DateRangeField, quickRange, type DateRange } from "./date-field";
export { WeekdayPicker, summarizeDays } from "./weekday-picker";
export { PhoneField } from "./phone-field";
export { BirthdayField } from "./birthday-field";
export * from "./birthday";
export { EmployeePicker } from "./pickers";
export * from "./time";
