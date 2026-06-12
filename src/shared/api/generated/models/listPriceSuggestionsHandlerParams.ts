/* eslint-disable */
// @ts-nocheck

export type ListPriceSuggestionsHandlerParams = {
/**
 * cm | revenue | insufficient
 */
classification_mode?: string;
/**
 * star | plowhorse | puzzle | dog
 */
cm_quadrant?: string;
/**
 * hero | steady | slow | quiet
 */
revenue_class?: string;
/**
 * hold | raise_price | lower_price | bundle | remove | reformulate | monitor
 */
action?: string;
/**
 * low | medium | high
 */
confidence?: string;
category_id?: string;
/**
 * accepted | rejected | ignored | pending
 */
decision_status?: string;
/**
 * Case-insensitive substring match on item name.
 */
search?: string;
};
