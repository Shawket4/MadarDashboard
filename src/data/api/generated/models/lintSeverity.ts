/* eslint-disable */
// @ts-nocheck

export type LintSeverity = typeof LintSeverity[keyof typeof LintSeverity];


export const LintSeverity = {
  error: 'error',
  warn: 'warn',
} as const;
