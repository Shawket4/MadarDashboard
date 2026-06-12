/**
 * True when the user has asked the OS to minimise motion. Read at call time
 * (not cached) so toggling the setting takes effect on the next interaction.
 * All decorative animation on the public menu — fly-to-cart, price rolls,
 * card entrances, the order-bar bump, and card tilt — is gated on this.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
