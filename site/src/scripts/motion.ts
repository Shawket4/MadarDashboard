// The motion engine: the site's one place for motion on scroll. GSAP (ScrollTrigger,
// SplitText, DrawSVG) with Lenis smooth scrolling, all on GSAP's one ticker. It is loaded
// by scripts/load-motion.ts only where a page has something to move and motion is
// allowed, so a page with nothing to move, reduced motion and no JavaScript never fetch
// GSAP and show every page complete and still.
//
// One gsap.matchMedia() arms it: .crew-armed on <html> (the crew's CSS may wait behind it)
// and the vocabulary, with a calmer variant on phones (the *-phone tokens). If the visitor
// turns reduced motion on, all of it reverts to the still page.
//
// The vocabulary. Mark it up; never write a page's own reveal keyframes or observers:
//   data-reveal         a line or a card rises into place as it scrolls in
//   data-reveal-group   on a list: its data-reveal items rise one after another
//   data-split          a heading's words rise from their masks
//   data-pop            pops in on a spring (a tick, a badge); --delay waits first
//   data-draw           an <svg>'s strokes draw (DrawSVG); any other element (a rule)
//                       draws along its longer side from the start
//   data-count          a figure counts up to the value in the HTML
//   data-parallax="f"   drifts f of its height as its section scrolls (calmer on phones)
//   data-sequence="x"   a set piece: the timeline defineSequence("x") builds, played as
//                       it comes in, paused off screen, resumed when back
//   data-progress       the header's page progress line
// The scenes (pins, the screens, the family, the cappuccino, the roadmap, the rail) are
// story.ts's, set up first so every trigger after them measures the page at its length.
//
// Two ways in:
//  - fresh (from outside, or a reload): the first screen's entrance is CSS
//    (styles/motion.css, "First screen"), with the first paint; the engine sets itself up
//    once it has played.
//  - soft (a click from another page of the site): the page transition brings it in.
// Either way, what is on screen when the engine starts stays as it is (settled); only
// what scrolls in later plays. The crew are the exception: a character plays its
// entrance wherever it is.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Lenis from "lenis";
import { DUR, EASE, PARALLAX_PHONE, PHONE, REVEAL_Y, REVEAL_Y_PHONE, STAGGER, STAGGER_PHONE, STAGGER_WORD } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
// Whatever arrives eases out on the tokens' curve unless a tween says otherwise.
gsap.defaults({ ease: EASE.out });
// Phones: the address bar showing and hiding is not a resize worth re-measuring for.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

const root = document.documentElement;
const soft = root.hasAttribute("data-soft");
export const rtl = root.dir === "rtl";
const has = (selector: string) => document.querySelector(selector) !== null;

/** Above the viewport: the page opened, or a # link jumped, past it. */
export const passed = (el: Element) => el.getBoundingClientRect().bottom <= 0;

/**
 * Left exactly as it is, never animated: whatever is on screen when the engine starts, or
 * above it (a # address, a reload half-way down). It has been on show since the first
 * paint; hiding it now to play an entrance would make it blink.
 */
export const settled = (el: Element) => el.getBoundingClientRect().top < window.innerHeight;

/**
 * A flick: the page is moving fast (a thumb's fling, a trackpad throw). Entrances that
 * come up mid-flick just finish: nobody can watch them, and things fading in behind a
 * fast scroll is what reads as jank.
 */
let speed = 0;
let lastY = window.scrollY;
let lastT = performance.now();
window.addEventListener(
  "scroll",
  () => {
    const t = performance.now();
    const dt = t - lastT;
    if (dt > 0) speed = (Math.abs(window.scrollY - lastY) / dt) * 1000;
    lastY = window.scrollY;
    lastT = t;
  },
  { passive: true },
);
export const flicking = () => performance.now() - lastT < 150 && speed > 2400;

/**
 * Plays `anim` (made paused) the first time `el` scrolls in. A jump (a # link, the rail, a
 * chip) can carry the page past `el` in one go: then `anim` just finishes, so nothing you
 * skipped plays out of sight or holds up what is on screen where you land.
 */
export function whenSeen(el: Element, start: string, anim: gsap.core.Animation) {
  ScrollTrigger.create({
    trigger: el,
    start,
    once: true,
    onEnter: () => void (passed(el) || flicking() ? anim.progress(1) : anim.play()),
  });
}

/** Calls `onIn` once, when `el` reaches the reveal line (or a jump carries the page past it). */
export function watch(el: Element, onIn: () => void) {
  ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: onIn });
}

/** Whether `el` is on screen (data-live, and `onChange`): loops run only while it is. */
export function onScreen(el: Element, onChange?: (on: boolean) => void) {
  ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      el.toggleAttribute("data-live", self.isActive);
      onChange?.(self.isActive);
    },
  });
}

/** A set piece's timeline, built when its element is set up (data-sequence="name"). */
type Sequence = { build: (el: HTMLElement, tl: gsap.core.Timeline) => void; always: boolean };
const sequences = new Map<string, Sequence>();
/**
 * Names a set piece. `always`: it plays even when it is on screen as the engine starts (a
 * character's entrance); otherwise a settled one is left as it is.
 */
export function defineSequence(name: string, build: Sequence["build"], { always = false } = {}) {
  sequences.set(name, { build, always });
}

/** A custom property on `el` (inherited, so a parent can set it), in seconds. */
const seconds = (el: Element, name: string, fallback: number) => {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const n = parseFloat(raw) / (raw.endsWith("ms") ? 1000 : 1);
  return Number.isNaN(n) ? fallback : n;
};

/** Where a rule draws from: along its longer side, from the reading start or the top. */
const ruleFrom = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.height > r.width
    ? { scaleY: 0, transformOrigin: "50% 0%" }
    : { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%" };
};

/** Hands the main thread back between parts of the setup, so no part is one long task. */
export const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

let lenis: Lenis | null = null;

// ---------- The vocabulary ----------

/** How it moves: the rise, the beat between items and between words, the parallax share (calmer on phones). */
type Feel = { y: number; step: number; word: number; parallax: number };

/**
 * Lines and cards rise into place (data-reveal). What comes in together rises one after
 * another, a step apart (the whole run in at most 0.35 s): each data-reveal-group's items
 * on their own count, the loose ones on theirs.
 */
function reveals(feel: Feel) {
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]").filter((el) => !settled(el));
  gsap.set(items, { autoAlpha: 0, y: feel.y });
  ScrollTrigger.batch(items, {
    start: "top 92%",
    once: true,
    onEnter: (batch) => {
      // A jump or a flick can pass a whole page of these at once: what it passed (or all
      // of them, mid-flick) shows at once, and only what is on screen plays.
      const fast = flicking();
      const gone = batch.filter((el) => fast || passed(el));
      const here = batch.filter((el) => !fast && !passed(el));
      if (gone.length) gsap.set(gone, { autoAlpha: 1, y: 0, overwrite: true });
      if (!here.length) return;
      const group = (el: Element) => el.closest("[data-reveal-group]");
      const size = new Map<Element | null, number>();
      for (const el of here) size.set(group(el), (size.get(group(el)) ?? 0) + 1);
      const count = new Map<Element | null, number>();
      const delay = here.map((el) => {
        const g = group(el);
        const k = count.get(g) ?? 0;
        count.set(g, k + 1);
        return k * Math.min(feel.step, 0.35 / (size.get(g) ?? 1));
      });
      gsap.to(here, { autoAlpha: 1, y: 0, duration: DUR.reveal, delay: (i: number) => delay[i] ?? 0, overwrite: true });
    },
  });
}

/**
 * A heading's words rise into place, each from below its mask. The masks are padded past
 * descenders and Arabic tails and marks (.split-word-mask in styles/motion.css), so the
 * words start far enough down to be fully hidden: the mask's whole height. The split
 * stays once they land: undoing it can re-wrap a heading that fits its line to the pixel.
 */
function splits(feel: Feel) {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-split]")) {
    if (settled(el)) continue;
    const split = SplitText.create(el, { type: "words", mask: "words", wordsClass: "split-word" });
    gsap.set(el, { autoAlpha: 1 });
    const rise = gsap.from(split.words, {
      y: (_: number, word: Element) => word.parentElement?.offsetHeight ?? 0,
      duration: DUR.reveal,
      stagger: feel.word,
      paused: true,
      onComplete: () => void gsap.set(split.words, { clearProps: "transform" }),
    });
    whenSeen(el, "top 88%", rise);
  }
}

/**
 * Pops (data-pop) and draws (data-draw) as they reach the line, those that come in
 * together a step apart (--stagger, which a parent may slow), after --delay; a stroke
 * inside a pop draws once the pop has landed.
 */
function popsAndDraws(feel: Feel) {
  const items = gsap.utils.toArray<HTMLElement | SVGElement>("[data-pop], [data-draw]").filter((el) => !settled(el));
  const strokes = (el: Element) => el.querySelectorAll("path, line, polyline, circle");
  const from = (el: Element) => {
    if (el.hasAttribute("data-pop")) return { scale: 0 };
    if (el instanceof SVGSVGElement) return null;
    return ruleFrom(el);
  };
  for (const el of items) {
    const f = from(el);
    if (f) gsap.set(el, f);
    else gsap.set(strokes(el), { drawSVG: "0%" });
  }
  ScrollTrigger.batch(items, {
    start: "top 92%",
    once: true,
    onEnter: (batch) => {
      const fast = flicking();
      const n = { pop: 0, draw: 0 };
      for (const el of batch) {
        const pop = el.hasAttribute("data-pop");
        const svg = !pop && el instanceof SVGSVGElement;
        const targets = svg ? strokes(el) : el;
        const done = svg ? { drawSVG: "100%" } : { scale: 1, scaleX: 1, scaleY: 1 };
        if (fast || passed(el)) {
          gsap.set(targets, done);
          continue;
        }
        // A list may slow its beat (--stagger on a parent); otherwise the feel's (calmer on phones).
        const own = seconds(el, "--stagger", STAGGER);
        const step = own === STAGGER ? feel.step : own;
        const after = !pop && el.parentElement?.closest("[data-pop]") ? DUR.pop * 0.36 : 0;
        const delay = seconds(el, "--delay", 0) + after + n[pop ? "pop" : "draw"]++ * step;
        if (pop) gsap.to(el, { scale: 1, duration: DUR.pop, ease: EASE.pop, delay });
        else if (svg) gsap.to(targets, { drawSVG: "100%", duration: DUR.pop, ease: EASE.draw, delay });
        else gsap.to(el, { ...done, duration: DUR.draw, delay });
      }
    },
  });
}

/**
 * A figure counting up to the value the page rendered (CountUp.astro). It reads from zero
 * from the moment it's made, so it never shows the final value first.
 */
function countUp(el: HTMLElement, paused = false) {
  const digits = Number(el.dataset.decimals ?? 0);
  const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const figure = { value: 0 };
  el.textContent = fmt.format(0);
  return gsap.to(figure, {
    value: Number(el.dataset.count ?? 0),
    duration: 1.9,
    paused,
    onUpdate: () => void (el.textContent = fmt.format(figure.value)),
  });
}

/** Figures outside the hero count up the first time they scroll in (data-count). */
function counts() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-count]")) {
    if (el.closest("[data-hero]") || settled(el)) continue;
    const tween = countUp(el, true);
    tween.delay(Number(el.dataset.delay ?? 0));
    whenSeen(el, "top 92%", tween);
  }
}

/**
 * The hero's entrance is CSS. Its chip's figures count up as the chip settles, when the
 * engine is in time for that; otherwise they stay at the values the page rendered (never a
 * count that restarts from zero in plain sight).
 */
function heroCount() {
  const chip = document.querySelector<HTMLElement>("[data-hero-chip]");
  // How far into the entrance we are (ms); the chip shows from 900 ms (its CSS delay).
  const at = Number(chip?.getAnimations()[0]?.currentTime ?? Infinity);
  if (!chip || at >= 900) return;
  for (const figure of chip.querySelectorAll<HTMLElement>("[data-count]")) {
    countUp(figure).delay((1000 - at) / 1000 + Number(figure.dataset.delay ?? 0));
  }
}

/** Set pieces (data-sequence): built paused, played as they come in, paused off screen. `only`: the `always` ones alone (the crew's, built early). */
const built = new WeakSet<Element>();
function playSequences(only?: "always") {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-sequence]")) {
    if (built.has(el)) continue;
    const name = el.dataset.sequence ?? "";
    const seq = sequences.get(name);
    if (!seq) {
      if (!only) console.error(`data-sequence="${name}" has no defineSequence("${name}")`);
      continue;
    }
    if (only && !seq.always) continue;
    if (!seq.always && settled(el)) continue;
    built.add(el);
    const tl = gsap.timeline({ paused: true });
    seq.build(el, tl);
    ScrollTrigger.create({ trigger: el, start: "top 92%", end: "bottom top", toggleActions: "play pause resume pause", animation: tl });
  }
}

/** Drifts as its section scrolls by (data-parallax: a share of its height), half on phones. */
function parallax(feel: Feel) {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-parallax]")) {
    const f = Number(el.dataset.parallax || "0.05") * feel.parallax;
    gsap.to(el, {
      yPercent: -f * 100,
      ease: "none",
      scrollTrigger: { trigger: el.closest("section") ?? el, start: "top top", end: "bottom top", scrub: true },
    });
  }
}

/** The orbit motif: its rings draw in from the middle as it arrives; its satellite turns while on screen. */
function orbits() {
  for (const svg of gsap.utils.toArray<SVGSVGElement>("[data-orbit]")) {
    if (!settled(svg)) {
      const draw = gsap.fromTo(svg.querySelectorAll("[data-orbit-ring]"), { drawSVG: "50% 50%" }, {
        drawSVG: "0% 100%",
        duration: 2.4,
        ease: "expo.inOut",
        stagger: 0.12,
        paused: true,
      });
      whenSeen(svg.parentElement ?? svg, "top 90%", draw);
    }
    const sat = svg.querySelector(".orbit-satellite");
    if (sat) {
      gsap.to(sat, {
        rotation: 360 * (rtl ? -1 : 1), svgOrigin: "800 800", duration: 90, ease: "none", repeat: -1,
        scrollTrigger: { trigger: svg, start: "top bottom", end: "bottom top", toggleActions: "play pause resume pause" },
      });
    }
  }
}

/** The header's progress line: how far down the page you are. */
function progress() {
  const bar = document.querySelector<HTMLElement>("[data-progress]");
  if (!bar) return;
  gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
}

// ---------- Built-in set pieces ----------

/** A step of a StepList: its number rises from its mask and its rule draws; a row's steps one after another. */
defineSequence("step", (step, tl) => {
  const row = Array.from(step.parentElement?.children ?? []).filter((s) => (s as HTMLElement).offsetTop === step.offsetTop);
  const at = Math.max(0, row.indexOf(step)) * 0.12;
  const n = step.querySelector("[data-step-n] > span");
  const rule = step.querySelector("[data-step-rule]");
  if (n) tl.fromTo(n, { yPercent: 110 }, { yPercent: 0, duration: 0.9 }, at + 0.1);
  if (rule) tl.fromTo(rule, ruleFrom(rule), { scaleX: 1, scaleY: 1, duration: DUR.draw }, at + 0.3);
});

/** A CtaBand: the band rises, then its words, price and actions one after another. */
defineSequence("band", (band, tl) => {
  tl.fromTo(band, { autoAlpha: 0, y: REVEAL_Y }, { autoAlpha: 1, y: 0, duration: DUR.reveal });
  tl.fromTo(band.querySelectorAll(":scope > :not(.cta-band-crew)"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: STAGGER * 1.5 }, 0.15);
});

// ---------- Setting it up ----------

/**
 * Sets the engine up once the first screen's entrance (CSS) has played and the page is
 * idle, or as soon as the visitor scrolls or touches it, whichever comes first. The setup
 * is the page's one long piece of work (about 220 ms on a mid phone) and it also starts
 * the 3D's download (family.ts), so it never lands mid-entrance. Nothing below the first
 * screen needs it before the page moves: until then that content is simply there.
 */
function afterEntrance(start: () => void) {
  let started = false;
  const events = ["scroll", "touchstart", "wheel", "keydown"] as const;
  const go = () => {
    if (started) return;
    started = true;
    for (const type of events) window.removeEventListener(type, go);
    start();
  };
  for (const type of events) window.addEventListener(type, go, { passive: true });
  // The entrance: every finite animation running now (the CSS ones, a page transition).
  const entrance = document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity);
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 300 }) : setTimeout(go, 50));
  Promise.all(entrance.map((a) => a.finished.catch(() => {}))).then(idle);
  setTimeout(go, 4000); // whatever an animation does, the engine is set up by then
}

/** Smooth scroll on mouse and trackpad only (touch keeps its native momentum), on GSAP's ticker. */
function smoothScroll() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  lenis = new Lenis({ lerp: 0.11, autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/** The # target in the address, if it names an element on this page. */
const hashTarget = (hash = location.hash) => (hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null);

/**
 * Puts `to` at the top at once (the page's scroll-padding keeps it clear of the header).
 * Lenis measures again first: the page's length (it learns of the pins' extra length only
 * after a debounce) and where the page really is. A jump is not a flick: the speed reading
 * starts again from here, so what it lands on plays.
 */
export function jump(to: HTMLElement) {
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(to, { immediate: true, force: true });
  } else {
    to.scrollIntoView({ behavior: "instant", block: "start" });
  }
  speed = 0;
  lastY = window.scrollY;
  lastT = performance.now();
}

/**
 * Same-page # links jump there (owner: no long scroll down the page), then what lands on
 * screen plays its entrance; whatever the jump passes skips its own (whenSeen). Keyboard
 * activation keeps the browser's jump, which also moves focus along.
 */
function anchorLinks() {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.detail === 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element | null)?.closest?.("a[href*='#']");
    if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const to = hashTarget(url.hash);
    if (!to) return;
    e.preventDefault();
    if (url.hash !== location.hash) history.pushState(null, "", url.hash);
    jump(to);
  });
}

/**
 * A # address (a link from another page, a shared link). The browser jumps there while the
 * page loads, before the scenes add their scroll length, and the refreshes after it can
 * drop the jump. Land on it now, and again after each refresh until the visitor moves the
 * page themselves. A reload or back/forward keeps the browser's own memory of the place.
 */
function landOnHash() {
  const to = hashTarget();
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!to || (nav && nav.type !== "navigate")) return;
  let holding = true;
  const land = () => {
    if (holding) jump(to);
  };
  const release = () => {
    holding = false;
    ScrollTrigger.removeEventListener("refresh", land);
  };
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) window.addEventListener(type, release, { once: true, passive: true });
  window.setTimeout(release, 5000);
  ScrollTrigger.addEventListener("refresh", land);
  land();
  // The section it opened on entered in CSS (":target" in styles/motion.css); a later #
  // change is the engine's to play, not that rule's.
  window.addEventListener("hashchange", () => root.removeAttribute("data-arrive"), { once: true });
}

/**
 * Measures again when the page's length may have moved: once the late fonts are in, and
 * after an image loads if the page grew or shrank (images carry their sizes, so usually
 * it doesn't, and nothing is re-measured mid-scroll for nothing). Resizes ScrollTrigger
 * handles itself.
 */
function refreshWhenNeeded() {
  document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
  let height = document.documentElement.scrollHeight;
  let queued = 0;
  document.addEventListener(
    "load",
    (e) => {
      if (!(e.target instanceof HTMLImageElement) || queued) return;
      queued = window.setTimeout(() => {
        queued = 0;
        const now = document.documentElement.scrollHeight;
        if (now !== height) {
          height = now;
          ScrollTrigger.refresh();
        }
      }, 300);
    },
    true,
  );
}

const PHONE_FEEL: Feel = { y: REVEAL_Y_PHONE, step: STAGGER_PHONE, word: STAGGER_WORD * 0.7, parallax: PARALLAX_PHONE };
const WIDE_FEEL: Feel = { y: REVEAL_Y, step: STAGGER, word: STAGGER_WORD, parallax: 1 };

/**
 * The crew, at once (not after the first screen's entrance): their figures, badges and the
 * receipt wait hidden from the first paint (.crew-wait, styles/sections/crew.css) and play
 * their entrances as soon as the engine is here. It is a small setup; the rest waits.
 */
const crewReady = has("[data-crew], [data-swing], .zr")
  ? import("./crew").then((crew) => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        root.classList.add("crew-armed");
        playSequences("always");
        return () => root.classList.remove("crew-armed");
      });
      crew.live();
      root.classList.remove("crew-wait");
      return crew;
    })
  : null;

async function start() {
  // The modules a page needs, before anything is measured.
  const [story] = await Promise.all([
    has("[data-family], [data-order], [data-barista], [data-pin-set], [data-roadmap], [data-basira], [data-stage-time], [data-rail]") ? import("./story") : null,
    crewReady,
  ]);
  if (has("[data-beams]")) void import("./beams").then((m) => m.drawBeams(true));
  smoothScroll();
  anchorLinks();
  // A # address's arrival (CSS, ":target" in styles/motion.css) has played by now: retire it
  // before the pins wrap their sections, or moving them would play it over again.
  root.removeAttribute("data-arrive");

  // The scenes' pins first, in page order: every trigger after them measures the page with
  // the pins' extra scroll length in place. Then land on a # address before anything below
  // decides what is on screen and what was passed.
  if (story?.scenes()) ScrollTrigger.refresh();
  landOnHash();
  await breathe();
  story?.extras();

  // The vocabulary, armed by one matchMedia: the calmer feel on phones, nothing at all
  // (and every piece reverted to the still page) with reduced motion.
  gsap.matchMedia().add({ motion: "(prefers-reduced-motion: no-preference)", phone: PHONE }, (context) => {
    const { motion, phone } = context.conditions ?? {};
    if (!motion) return;
    root.classList.add("crew-armed");
    const feel = phone ? PHONE_FEEL : WIDE_FEEL;
    splits(feel);
    reveals(feel);
    popsAndDraws(feel);
    counts();
    playSequences();
    parallax(feel);
    orbits();
    progress();
    return () => root.classList.remove("crew-armed");
  });
  await breathe();

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  refreshWhenNeeded();
}

if (!soft) heroCount();
afterEntrance(() => void start());
