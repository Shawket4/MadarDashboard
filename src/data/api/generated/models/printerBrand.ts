/* eslint-disable */
// @ts-nocheck

export type PrinterBrand = typeof PrinterBrand[keyof typeof PrinterBrand];


export const PrinterBrand = {
  star: 'star',
  epson: 'epson',
} as const;
