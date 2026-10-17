// What waits hidden for the motion engine, from the first paint (styles/motion.css,
// "Waiting for the engine", holds the same list: change both together). With motion
// allowed, the head script (classic/boot.js) sets .reveal-wait on <html> before anything
// paints; these stay hidden until the engine has set each one's entrance up, then they
// play, wherever they are, on screen included. Nothing is painted whole and then hidden,
// and nothing that was waiting is skipped because the engine arrived late.
// If the engine is late (scripts/load-motion.ts: PATIENCE_MS), whatever scrolls into view
// rises in on CSS transitions instead (data-shown), and the engine leaves it be.
export const WAITS = [
  "[data-reveal]",
  "[data-split]",
  "[data-pop]",
  "[data-draw]",
  "[data-count]:not([data-hero] *)",
  "[data-sequence='band']",
  "[data-step-n] > span",
  "[data-step-rule]",
  "[data-stage-time]",
  "[data-basira]",
].join(", ");

/** How long what is on screen waits for the engine before the CSS fallback shows it. */
export const PATIENCE_MS = 1200;
