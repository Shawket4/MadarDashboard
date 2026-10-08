// The scroll story: GSAP (ScrollTrigger, SplitText, DrawSVG) with Lenis smooth
// scrolling on mouse and trackpad. An area with screens is a scene: the page pauses on
// it briefly while scrolling turns its screens (all on show, the current one in the
// middle: carousel.ts; a progress line shows the scroll is doing something), then
// carries on. However fast the page moves, every change plays; the ones behind hurry.
// Reduced motion gets none of it (the content is fully visible without this file).
//
// Two ways in:
//  - fresh (from outside, or a reload): the hero and the first headings play their
//    entrance; the head script hid them until now ("m").
//  - soft (a click from another page of the site): the page transition brings the new
//    page in, so whatever is already on screen stays as it is; only what is further
//    down reveals as it scrolls in.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Lenis from "lenis";
import { initBarista } from "./barista";
import { familyScene, type SceneKit } from "./family";
import { carousel } from "./carousel";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
// Phones: the address bar showing and hiding is not a resize worth re-measuring for.
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const soft = root.hasAttribute("data-soft");
const rtl = root.dir === "rtl";
const dir = rtl ? -1 : 1;
const desktop = window.matchMedia("(min-width: 1024px)");

/** Above the viewport: the page opened, or a # link jumped, past it. */
const passed = (el: Element) => el.getBoundingClientRect().bottom <= 0;

/**
 * A flick: the page is moving fast (a thumb's fling, a trackpad throw, a long glide).
 * Entrances that come up mid-flick just finish: nobody can watch them, and things
 * fading in behind a fast scroll is what reads as jank.
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
const flicking = () => performance.now() - lastT < 150 && speed > 2400;

/**
 * Left exactly as it is, never animated: whatever the page opened past (a # address, a
 * reload half-way down) and, on a soft entry, whatever is already on screen.
 */
const settled = (el: Element) => passed(el) || (soft && el.getBoundingClientRect().top < window.innerHeight);

/** The # target in the address, if it names an element on this page. */
const hashTarget = (hash = location.hash) =>
  hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;

let lenis: Lenis | null = null;

if (reduce) {
  root.classList.add("m-ready");
  initBarista({ mode: "still" });
} else {
  run();
  root.classList.add("m-ready");
}

function run() {
  // Smooth scroll on mouse and trackpad only; touch keeps its native momentum.
  if (window.matchMedia("(pointer: fine)").matches) {
    const smooth = new Lenis({ lerp: 0.11, autoRaf: false });
    smooth.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => smooth.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis = smooth;
  }
  anchorLinks();

  // Entrances first, so nothing waits on the scenes below.
  if (!soft) hero();

  // Pins next, in page order: every trigger created after them measures the page with
  // the pins' extra scroll length already in place. (The cappuccino pins on desktop
  // only; on phones its steps play while it is on screen.) The features page's screen
  // sets pin too (pinnedSets).
  const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-family], [data-order], [data-barista]"));
  // What the family scene (family.ts) borrows to behave like the area scenes.
  const sceneKit: SceneKit = { sequencer, whenSeen, hold };
  for (const el of scenes) {
    if (el.hasAttribute("data-barista")) initBarista({ mode: desktop.matches ? "scrub" : "play" });
    else if (el.hasAttribute("data-family")) familyScene(el, sceneKit);
    else areaScene(el);
  }
  const sets = pinnedSets();
  // With the page at its full length, land on a # address before anything below decides
  // what is on screen and what was passed.
  if (scenes.length || sets) ScrollTrigger.refresh();
  landOnHash();

  if (desktop.matches) {
    root.classList.add("story-on");
    parallax();
    rail();
  }

  splits();
  reveals();
  counts();
  orbits();
  lines();
  stageClocks();
  basira();
  roadmap();

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  // Late fonts change line heights a little: measure again once they are in.
  document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
}

/**
 * Same-page # links (the hero's "See a café's day", the rail, the day's cards, the
 * features chips) glide there: Lenis on mouse and trackpad, the browser's own smooth
 * scroll on touch. Whatever the glide passes skips its entrance (whenSeen), so the place
 * you land is ready when you get there. Keyboard activation keeps the browser's jump,
 * which also moves focus along.
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
    glide(to, false);
  });
}

/**
 * Scrolls to `to` (the page's scroll-padding keeps it clear of the header). Lenis
 * measures again first: the page's length (it learns of the pins' extra length only
 * after a debounce) and where the page really is (a scroll it didn't see, the
 * browser's own or a script's, would otherwise offset where it lands).
 */
function glide(to: HTMLElement, immediate: boolean) {
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(to, { immediate, force: true });
  } else {
    to.scrollIntoView({ behavior: immediate ? "instant" : "smooth", block: "start" });
  }
}

/**
 * A # address (a link from another page, a shared link). The browser jumps there while
 * the page loads, before the scenes add their scroll length, and the refreshes after it
 * can drop the jump. Land on it now, and again after each refresh until the visitor
 * moves the page themselves. A reload or back/forward keeps the browser's own memory
 * of where you were.
 */
function landOnHash() {
  const to = hashTarget();
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!to || (nav && nav.type !== "navigate")) return;
  let holding = true;
  const land = () => {
    if (holding) glide(to, true);
  };
  const release = () => {
    holding = false;
    ScrollTrigger.removeEventListener("refresh", land);
  };
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
    window.addEventListener(type, release, { once: true, passive: true });
  }
  window.setTimeout(release, 5000);
  ScrollTrigger.addEventListener("refresh", land);
  land();
}

function hero() {
  const el = document.querySelector<HTMLElement>("[data-hero]");
  if (!el) return;
  const title = el.querySelector<HTMLElement>("[data-hero-title]");
  const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.15 } });
  if (title) {
    // Words only: splitting letters would break how Arabic letters join.
    const split = SplitText.create(title, { type: "words", mask: "words", wordsClass: "split-word" });
    gsap.set(title, { autoAlpha: 1 });
    tl.add(rise(split, { duration: 1.15, stagger: 0.055 }), 0.05);
  }
  tl.fromTo("[data-hero-item]", { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07 }, 0.3)
    .fromTo("[data-hero-browser]", { y: 70, autoAlpha: 0, rotateX: 7, transformPerspective: 1400 }, { y: 0, autoAlpha: 1, rotateX: 0, duration: 1.5 }, 0.15)
    .fromTo("[data-hero-ipad]", { y: 110, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.5 }, 0.4)
    .fromTo("[data-hero-chip]", { y: 24, scale: 0.92, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 1 }, 0.9);
  // The chip's figures count up as it settles.
  for (const figure of el.querySelectorAll<HTMLElement>("[data-count]")) {
    tl.add(countUp(figure), 1 + Number(figure.dataset.delay ?? 0));
  }
}

/**
 * A figure counting up to the value the page rendered (CountUp.astro). It reads
 * from zero from the moment it's made, so it never shows the final value first.
 */
function countUp(el: HTMLElement, paused = false) {
  const digits = Number(el.dataset.decimals ?? 0);
  const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const figure = { value: 0 };
  el.textContent = fmt.format(0);
  return gsap.to(figure, {
    value: Number(el.dataset.count ?? 0),
    duration: 1.9,
    ease: "expo.out",
    paused,
    onUpdate: () => void (el.textContent = fmt.format(figure.value)),
  });
}

/** Figures outside the hero count up the first time they scroll in. */
function counts() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-count]")) {
    if (el.closest("[data-hero]") || settled(el)) continue;
    const tween = countUp(el, true);
    tween.delay(Number(el.dataset.delay ?? 0));
    whenSeen(el, "top 92%", tween);
  }
}

/**
 * Plays `anim` (made paused) the first time `el` scrolls in. A jump (a # link, the
 * rail, a chip) can carry the page past `el` in one go: then `anim` just finishes, so
 * nothing you skipped plays out of sight or holds up what is on screen where you land.
 */
function whenSeen(el: Element, start: string, anim: gsap.core.Animation) {
  ScrollTrigger.create({
    trigger: el,
    start,
    once: true,
    onEnter: () => void (passed(el) || flicking() ? anim.progress(1) : anim.play()),
  });
}

/**
 * A heading's words rise into place, each from below its mask. The masks are padded
 * past descenders and Arabic tails and marks (.split-word-mask in global.css), so the
 * words start far enough down to be fully hidden: the mask's whole height. The split
 * stays once they land: undoing it can re-wrap a heading that fits its line to the
 * pixel, and the heading would jump.
 */
function rise(split: SplitText, vars: gsap.TweenVars) {
  return gsap.from(split.words, {
    y: (_: number, word: Element) => word.parentElement?.offsetHeight ?? 0,
    ease: "expo.out",
    onComplete: () => void gsap.set(split.words, { clearProps: "transform" }),
    ...vars,
  });
}

function splits() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-split]")) {
    if (el.closest("[data-hero]") || settled(el)) continue;
    const split = SplitText.create(el, { type: "words", mask: "words", wordsClass: "split-word" });
    gsap.set(el, { autoAlpha: 1 });
    whenSeen(el, "top 88%", rise(split, { duration: 1, stagger: 0.045, paused: true }));
  }
}

function reveals() {
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]").filter((el) => !settled(el));
  gsap.set(items, { autoAlpha: 0, y: 26 });
  ScrollTrigger.batch(items, {
    start: "top 92%",
    once: true,
    onEnter: (batch) => {
      // A jump or a flick can pass a whole page of these at once: what it passed (or
      // all of them, mid-flick) shows at once, and only what is on screen plays.
      const fast = flicking();
      const gone = batch.filter((el) => fast || passed(el));
      const here = batch.filter((el) => !fast && !passed(el));
      if (gone.length) gsap.set(gone, { autoAlpha: 1, y: 0, overwrite: true });
      if (here.length) {
        gsap.to(here, { autoAlpha: 1, y: 0, duration: 0.95, ease: "expo.out", stagger: Math.min(0.07, 0.35 / here.length), overwrite: true });
      }
    },
  });
}

function orbits() {
  for (const svg of gsap.utils.toArray<SVGSVGElement>("[data-orbit]")) {
    if (!settled(svg)) {
      const draw = gsap.fromTo(svg.querySelectorAll("[data-draw]"), { drawSVG: "50% 50%" }, {
        drawSVG: "0% 100%",
        duration: 2.4,
        ease: "expo.inOut",
        stagger: 0.12,
        paused: true,
      });
      whenSeen(svg.parentElement ?? svg, "top 90%", draw);
    }
    const sat = svg.querySelector(".orbit-satellite");
    if (sat) gsap.to(sat, { rotation: 360 * dir, svgOrigin: "800 800", duration: 90, ease: "none", repeat: -1 });
  }
}

function lines() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-draw-line]")) {
    if (settled(el)) continue;
    const draw = gsap.fromTo(el, { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%" }, {
      scaleX: 1, duration: 1.4, ease: "expo.out", paused: true,
    });
    whenSeen(el, "top 92%", draw);
  }
}

/** The stage clock runs up to its hour as the stage comes in: 04:00 → 07:00. */
function stageClocks() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-stage-time]")) {
    if (settled(el)) continue;
    const [h = 0, m = 0] = (el.dataset.stageTime ?? "00:00").split(":").map(Number);
    const target = h * 60 + m;
    const clock = { t: Math.max(0, target - 180) };
    const show = () => {
      const v = Math.round(clock.t / 5) * 5;
      el.textContent = `${String(Math.floor(v / 60) % 24).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
    };
    show();
    whenSeen(el, "top 85%", gsap.to(clock, { t: target, duration: 1.6, ease: "expo.out", onUpdate: show, paused: true }));
  }
}

function basira() {
  for (const box of gsap.utils.toArray<HTMLElement>("[data-basira]")) {
    if (settled(box)) continue;
    const tl = gsap.timeline({ paused: true });
    whenSeen(box, "top 75%", tl);
    tl.from(box.querySelector("[data-basira-q]"), { y: 16, autoAlpha: 0, duration: 0.7, ease: "expo.out" })
      .from(box.querySelector("[data-basira-a]"), { y: 16, autoAlpha: 0, duration: 0.7, ease: "expo.out" }, "+=0.25")
      .from(box.querySelectorAll("[data-bar]"), { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%", duration: 1.1, ease: "expo.out", stagger: 0.09 }, "-=0.3");
  }
}

/**
 * The roadmap's line draws through time as it arrives: each stretch runs on to the next
 * stop, whose marker lands as the line gets there (a shipped one ticks) with its words
 * following. Desktop plays the row as one, under its labels. On phones each stop plays
 * as it scrolls in, after the line above it has reached it.
 */
function roadmap() {
  const box = document.querySelector<HTMLElement>("[data-roadmap]");
  if (!box) return;
  const across = desktop.matches;
  const from = across
    ? { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%" }
    : { scaleY: 0, transformOrigin: "50% 0%" };
  const to = across ? { scaleX: 1 } : { scaleY: 1 };
  const stops = Array.from(box.querySelectorAll<HTMLElement>("[data-rm-stop]"));

  /** One stop from `at`; returns when the line reaches the next one. */
  const stop = (tl: gsap.core.Timeline, el: HTMLElement, at: number) => {
    const check = el.querySelector("[data-rm-check]");
    const out = el.querySelector("[data-rm-seg='out']");
    tl.fromTo(el.querySelector("[data-rm-marker]"), { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: "back.out(1.7)" }, at)
      .fromTo(el.querySelector("[data-rm-text]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }, at + 0.1);
    if (check) tl.fromTo(check, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.4, ease: "power2.out" }, at + 0.18);
    if (out) tl.fromTo(out, from, { ...to, duration: 0.42, ease: "power1.inOut" }, at + 0.16);
    return at + 0.5;
  };

  if (across) {
    if (settled(box)) return;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(box.querySelectorAll("[data-rm-zone]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.15 }, 0)
      .fromTo(box.querySelectorAll("[data-rm-bracket]"), { scaleX: 0, transformOrigin: rtl ? "100% 0%" : "0% 0%" }, { scaleX: 1, duration: 0.9, ease: "expo.inOut", stagger: 0.15 }, 0.1);
    let at = 0.2;
    const lead = box.querySelector("[data-rm-seg='lead']");
    if (lead) {
      tl.fromTo(lead, from, { ...to, duration: 0.45, ease: "power1.in" }, at);
      at += 0.4;
    }
    for (const el of stops) at = stop(tl, el, at);
    whenSeen(box, "top 80%", tl);
    return;
  }

  let free = 0; // when the line reaches the next stop down
  for (const el of stops) {
    if (settled(el)) continue;
    const tl = gsap.timeline({ paused: true });
    const reach = stop(tl, el, 0);
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (passed(el) || flicking()) return void tl.progress(1);
        const wait = Math.max(0, free - gsap.ticker.time);
        free = gsap.ticker.time + wait + reach;
        gsap.delayedCall(wait, () => void tl.play());
      },
    });
  }
}

function parallax() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-parallax]")) {
    const f = Number(el.dataset.parallax ?? "0.05");
    gsap.to(el, {
      yPercent: -f * 100,
      ease: "none",
      scrollTrigger: { trigger: el.closest("section") ?? el, start: "top top", end: "bottom top", scrub: true },
    });
  }
}

/**
 * Plays changes one after another, every one of them. When the target moves on while a
 * change is still running (a fast scroll, a flick), the running change and the ones
 * after it speed up with the backlog (from about twice to four and a half times as
 * fast), so the screens catch up without skipping any. Out of sight (a jump went past the
 * scene, or back over it) it goes straight to where it should be: nobody would see it.
 */
function sequencer(
  change: (from: number, to: number) => gsap.core.Animation,
  snap: (to: number) => void,
  inView: () => boolean,
) {
  let current = 0; // where the running change is headed, or where things rest
  let target = 0;
  let running: gsap.core.Animation | null = null;
  const pace = () => {
    const behind = Math.abs(target - current);
    if (running && behind) running.timeScale(Math.max(running.timeScale(), Math.min(4.5, 1.6 + 0.7 * behind)));
  };
  const next = () => {
    if (running || current === target) return;
    const from = current;
    current += Math.sign(target - current);
    running = change(from, current);
    pace();
    running.eventCallback("onComplete", () => {
      running = null;
      next();
    });
  };
  return (to: number) => {
    if (to === target) return;
    target = to;
    if (!inView()) {
      running?.kill();
      running = null;
      current = to;
      snap(to);
      return;
    }
    pace();
    next();
  };
}

let pausedScenes = 0;
/** While a scene holds the page, the phone's WhatsApp bar steps aside for its words. */
function hold(holding: boolean) {
  pausedScenes = Math.max(0, pausedScenes + (holding ? 1 : -1));
  root.classList.toggle("scene-on", pausedScenes > 0);
}

/**
 * An area with screens: the page pauses on it while scrolling turns its screens (all on
 * show, the current one in the middle: carousel.ts), then carries on. The pause is kept
 * short (about two-thirds of a screen of scrolling per screen) and always visibly
 * moving: the progress line fills with the scroll. However fast the page moves, every
 * change plays (sequencer).
 */
function areaScene(area: HTMLElement) {
  const order: number[] = JSON.parse(area.dataset.order || "[]");
  const n = order.length;
  const panel = area.querySelector<HTMLElement>("[data-area-pin]");
  const media = area.querySelector<HTMLElement>("[data-media]");
  if (n < 2 || !panel || !media) return;
  const steps = Array.from(area.querySelectorAll<HTMLElement>("[data-step]"));
  const texts = Array.from(area.querySelectorAll<HTMLElement>("[data-screen-text]"));
  const bar = area.querySelector<HTMLElement>("[data-media-progress]");
  const screens = carousel(media, order);

  // The words that go with screen k, at once: its points stay bright beside it (desktop),
  // its own lines show under it (phones).
  const words = (k: number) => {
    const card = order[k] ?? 0;
    steps.forEach((s) => s.toggleAttribute("data-active", Number(s.dataset.screen) === card));
    texts.forEach((t, i) => t.toggleAttribute("data-active", i === k));
  };
  // Screen k at rest, without moving: the start, and where a jump past the scene leaves it.
  const snap = (k: number) => {
    words(k);
    screens.place(k);
    texts.forEach((t, i) => gsap.set(t, { autoAlpha: i === k ? 1 : 0, y: 0 }));
  };
  snap(0);
  const inView = () => {
    const r = panel.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };

  // The screens turn (carousel.ts); the words swap one after the other, never overlapping.
  const change = (from: number, to: number) => {
    words(to);
    const tl = screens.turn(from, to);
    const ta = texts[from];
    const tb = texts[to];
    if (ta && tb) {
      const way = to > from ? 1 : -1;
      tl.to(ta, { autoAlpha: 0, y: -8 * way, duration: 0.18, ease: "power2.in" }, 0)
        .fromTo(tb, { autoAlpha: 0, y: 12 * way }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" }, 0.2);
    }
    return tl;
  };
  const go = sequencer(change, snap, inView);

  // Each screen gets about two-thirds of a screen's height of scrolling.
  ScrollTrigger.create({
    trigger: panel,
    pin: true,
    anticipatePin: 1,
    start: "top top",
    end: () => `+=${Math.round(window.innerHeight * 0.65 * n)}`,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (bar) gsap.set(bar, { scaleX: self.progress });
      go(Math.min(n - 1, Math.floor(self.progress * n)));
    },
    onToggle: (self) => hold(self.isActive),
  });
}

/**
 * The features page's screen sets (MediaStack in "pass" mode). Each set pins on its own,
 * not its section (some sections' words are taller than the screen), while scrolling
 * turns its screens, as the home page's scenes do: about two-thirds of a screen of
 * scrolling per screen, the progress line filling as it goes, and every change played
 * however fast the page moves (sequencer). It holds below the header and the sticky jump
 * nav, centred in the height left. On desktop the words stay beside it (their column is
 * sticky); on phones they read above it. Returns how many sets it pinned.
 */
function pinnedSets() {
  const nav = document.querySelector<HTMLElement>("[data-jump-nav]");
  // Where the free screen starts: under the jump nav (itself stuck under the header), or
  // under the header alone; with a little air.
  const clear = () => (nav ? (parseFloat(getComputedStyle(nav).top) || 0) + nav.offsetHeight : 64) + 16;
  let pinned = 0;
  for (const set of gsap.utils.toArray<HTMLElement>("[data-pin-set]")) {
    const media = set.querySelector<HTMLElement>("[data-media-mode='pass']");
    if (!media) continue;
    const order: number[] = JSON.parse(media.dataset.order || "[]");
    const n = order.length;
    if (n < 2) continue;
    const bar = media.querySelector<HTMLElement>("[data-media-progress]");
    const screens = carousel(media, order);
    screens.place(0);
    const inView = () => {
      const r = media.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const go = sequencer(screens.turn, screens.place, inView);
    const top = () => {
      const free = window.innerHeight - clear();
      return Math.round(clear() + Math.max(0, (free - set.offsetHeight) / 2));
    };
    ScrollTrigger.create({
      trigger: set,
      pin: true,
      // Spelled out: ScrollTrigger leaves the spacing off when the pin's parent is a flex
      // box (this one is, a column), and without it the page below scrolls up through
      // the held set instead of waiting for it.
      pinSpacing: true,
      anticipatePin: 1,
      start: () => `top ${top()}px`,
      end: () => `+=${Math.round(window.innerHeight * 0.65 * n)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (bar) gsap.set(bar, { scaleX: self.progress });
        go(Math.min(n - 1, Math.floor(self.progress * n)));
      },
      onToggle: (self) => hold(self.isActive),
    });
    pinned++;
  }
  return pinned;
}

/** The floating pill: which part of the day we're in, and how far through it. */
function rail() {
  const story = document.querySelector<HTMLElement>("[data-story]");
  const pill = document.querySelector<HTMLElement>("[data-rail]");
  if (!story || !pill) return;
  const progress = pill.querySelector<HTMLElement>("[data-rail-progress]");
  const chips = Array.from(pill.querySelectorAll<HTMLElement>("[data-rail-chip]"));
  // These ranges contain pinned scenes, so they measure after them (refreshPriority -1);
  // measured before, they would end a whole pin-length too early.
  if (progress) {
    gsap.to(progress, { scaleX: 1, ease: "none", scrollTrigger: { trigger: story, start: "top 20%", end: "bottom bottom", scrub: 0.4, refreshPriority: -1 } });
  }
  gsap.fromTo(pill, { autoAlpha: 0, y: 16 }, {
    autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out",
    scrollTrigger: { trigger: story, start: "top 40%", end: "bottom 55%", toggleActions: "play reverse play reverse", refreshPriority: -1 },
  });
  for (const block of gsap.utils.toArray<HTMLElement>("[data-stage-block]")) {
    const key = block.dataset.stageBlock;
    ScrollTrigger.create({
      trigger: block,
      start: "top 50%",
      end: "bottom 50%",
      refreshPriority: -1,
      onToggle: (self) => {
        if (!self.isActive) return;
        chips.forEach((c) => (c.dataset.railChip === key ? c.setAttribute("data-active", "") : c.removeAttribute("data-active")));
      },
    });
  }
}
