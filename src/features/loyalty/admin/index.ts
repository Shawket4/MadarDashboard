/**
 * The loyalty admin module.
 *
 * One export. Everything else in here is internal, which is what keeps the
 * customer-facing bundle (`../public`) from reaching into dashboard code — the
 * two are separately built and separately deployed, and the old flat folder let
 * either import the other without anything complaining.
 */
export { LoyaltyPage } from "./loyalty-page";
