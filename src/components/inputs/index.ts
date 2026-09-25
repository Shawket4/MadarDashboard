/**
 * The input kit: the fields every Dawam (and, in time, every) form uses in
 * place of the browser's native time/date/number controls. Each one types in
 * Latin or Arabic digits, reads back on the app's clock and calendar, works
 * by keyboard and touch, flips for RTL, and refuses what it can't read out
 * loud instead of saving something else.
 */
export { TimeField, type TimeFieldProps } from "./time-field";
export { TimeRangeField, rangeProblem, type TimeRange, type TimeRangeFieldProps, type RangeProblem } from "./time-range-field";
export { NumberField, type NumberFieldProps } from "./number-field";
export { DurationField, type DurationFieldProps } from "./duration-field";
export { MoneyField, type MoneyFieldProps } from "./money-field";
export { DateField, DateRangeField, quickRange, type DateRange, type QuickRange } from "./date-field";
export { WeekdayPicker, weekdayName, summarizeDays } from "./weekday-picker";
export { PhoneField, phoneProblem } from "./phone-field";
export { EmployeePicker, BranchPicker, type PickerItem } from "./pickers";
export * from "./time";
export { parseNumber } from "./number";
