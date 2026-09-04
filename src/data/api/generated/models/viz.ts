/* eslint-disable */
// @ts-nocheck

/**
 * How a result is best visualized. A hint: the client may always override, and
 * [`Viz::Auto`] asks the backend to choose from the [`Grain`].
 */
export type Viz = typeof Viz[keyof typeof Viz];


export const Viz = {
  auto: 'auto',
  kpi: 'kpi',
  line: 'line',
  area: 'area',
  bar: 'bar',
  row: 'row',
  pie: 'pie',
  donut: 'donut',
  table: 'table',
  heatmap: 'heatmap',
} as const;
