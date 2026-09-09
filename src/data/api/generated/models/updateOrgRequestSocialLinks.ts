/* eslint-disable */
// @ts-nocheck

/**
 * Where else to find the shop. Validated against a closed list of
 * platforms and `https` only — these are printed onto a customer's wallet
 * pass, and a card that renders whatever was typed can be made to say
 * anything. See `orgs::social`.
 * @nullable
 */
export type UpdateOrgRequestSocialLinks = { [key: string]: unknown } | null;
