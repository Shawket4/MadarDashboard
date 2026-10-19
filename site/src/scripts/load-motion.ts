// Every page's motion door (BaseLayout loads it; it is tiny and holds no GSAP). It fetches
// the motion engine (scripts/motion.ts: GSAP and its plugins, Lenis, and through it the
// scenes and the crew) only when the page has something to move and motion is allowed. A
// page with nothing to move, reduced motion, or no JavaScript pays nothing and shows every
// page complete and still. With reduced motion the two still pieces that need a script
// are drawn without GSAP: the cappuccino's still frame, the ledger's beams.
import { WAITS, PATIENCE_MS } from "./waits";

const MOVES = [
  "[data-reveal]", "[data-split]", "[data-pop]", "[data-draw]", "[data-count]", "[data-parallax]", "[data-sequence]",
  "[data-orbit]", "[data-light]", "[data-crew]", "[data-swing]", "[data-beams]",
  "[data-family]", "[data-order]", "[data-barista]", "[data-pin-set]", "[data-roadmap]", "[data-rail]", "[data-foodics]",
].join(", ");

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const has = (selector: string) => document.querySelector(selector) !== null;
const root = document.documentElement;

/**
 * Until the engine has armed, what waits for it (scripts/waits.ts) is hidden. If it is
 * late (a slow network, a busy phone), what comes into view after PATIENCE_MS rises in on
 * CSS transitions (data-shown, styles/motion.css) so nobody scrolls past blank space; the
 * engine, when it arms, leaves those as they are and plays the rest.
 */
function patience() {
  let armed = false;
  document.addEventListener("motion:armed", () => (armed = true), { once: true });
  window.setTimeout(() => {
    if (armed || !root.classList.contains("reveal-wait")) return;
    root.classList.add("reveal-late");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.setAttribute("data-shown", "");
        io.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    for (const el of document.querySelectorAll(WAITS)) io.observe(el);
    document.addEventListener("motion:armed", () => io.disconnect(), { once: true });
  }, PATIENCE_MS);
}

if (!reduce) {
  if (has(MOVES)) {
    patience();
    // The engine and the parts the page needs, fetched at once and side by side (not one
    // after another): the scenes and the crew import the engine themselves.
    void import("./motion");
    if (has("[data-family], [data-order], [data-barista], [data-pin-set], [data-roadmap], [data-basira], [data-stage-time], [data-rail]")) void import("./story");
    if (has("[data-foodics]")) void import("./foodics");
    if (has("[data-crew], [data-swing], .zr")) void import("./crew");
    else root.classList.remove("crew-wait");
  } else root.classList.remove("reveal-wait", "crew-wait");
} else {
  if (has("[data-barista]")) void import("./barista").then((m) => m.initBarista({ mode: "still" }));
  if (has("[data-beams]")) void import("./beams").then((m) => m.drawBeams(false));
}
