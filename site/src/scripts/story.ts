// The scroll story: GSAP (ScrollTrigger, SplitText, DrawSVG, Flip) with Lenis smooth
// scrolling on desktop pointers. Phones get lighter reveals with no pinning; reduced
// motion gets none of it (content is fully visible without this file).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import Lenis from "lenis";
import { initBarista } from "./barista";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, Flip);

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rtl = root.dir === "rtl";
const dir = rtl ? -1 : 1;

if (reduce) {
  root.classList.add("m-ready");
  initBarista({ mode: "still" });
} else {
  run().finally(() => root.classList.add("m-ready"));
}

async function run() {
  // Smooth scroll on mouse and trackpad only; touch keeps its native momentum.
  if (window.matchMedia("(pointer: fine)").matches) {
    const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -88 }, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Split only once the real fonts are in, so lines measure correctly.
  try { await document.fonts.ready; } catch { /* fonts API missing: carry on */ }

  // Pins first: every trigger created after them measures the page with the pin's
  // extra scroll length already in place (ScrollTrigger wants page order).
  const mm = gsap.matchMedia();
  mm.add("(min-width: 1024px)", () => {
    root.classList.add("story-on");
    const stop = initBarista({ mode: "scrub" });
    parallax();
    areas();
    rail();
    return () => {
      root.classList.remove("story-on");
      stop?.();
    };
  });
  mm.add("(max-width: 1023px)", () => {
    const stop = initBarista({ mode: "autoplay" });
    return () => stop?.();
  });

  hero();
  splits();
  reveals();
  orbits();
  lines();
  stageClocks();
  basira();

  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

function hero() {
  const el = document.querySelector<HTMLElement>("[data-hero]");
  if (!el) return;
  const title = el.querySelector<HTMLElement>("[data-hero-title]");
  const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.15 } });
  if (title) {
    const split = SplitText.create(title, { type: "words", mask: "words", wordsClass: "split-word" });
    gsap.set(title, { autoAlpha: 1 });
    tl.from(split.words, { yPercent: 115, stagger: 0.055 }, 0.1);
  }
  tl.fromTo("[data-hero-item]", { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07 }, 0.35)
    .fromTo("[data-hero-browser]", { y: 70, autoAlpha: 0, rotateX: 7, transformPerspective: 1400 }, { y: 0, autoAlpha: 1, rotateX: 0, duration: 1.5 }, 0.2)
    .fromTo("[data-hero-ipad]", { y: 110, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.5 }, 0.45)
    .fromTo("[data-hero-chip]", { y: 24, scale: 0.92, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 1 }, 0.95);
}

function splits() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-split]")) {
    // Words only: splitting letters would break how Arabic letters join.
    const split = SplitText.create(el, { type: "words", mask: "words", wordsClass: "split-word" });
    gsap.set(el, { autoAlpha: 1 });
    gsap.from(split.words, {
      yPercent: 110,
      duration: 1,
      ease: "expo.out",
      stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }
}

function reveals() {
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  gsap.set(items, { autoAlpha: 0, y: 26 });
  ScrollTrigger.batch(items, {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.95, ease: "expo.out", stagger: 0.07, overwrite: true }),
  });
}

function orbits() {
  for (const svg of gsap.utils.toArray<SVGSVGElement>("[data-orbit]")) {
    const rings = svg.querySelectorAll("[data-draw]");
    gsap.fromTo(rings, { drawSVG: "50% 50%" }, {
      drawSVG: "0% 100%",
      duration: 2.4,
      ease: "expo.inOut",
      stagger: 0.12,
      scrollTrigger: { trigger: svg.parentElement ?? svg, start: "top 90%", once: true },
    });
    const sat = svg.querySelector(".orbit-satellite");
    if (sat) gsap.to(sat, { rotation: 360 * dir, svgOrigin: "800 800", duration: 90, ease: "none", repeat: -1 });
  }
}

function lines() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-draw-line]")) {
    gsap.fromTo(el, { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%" }, {
      scaleX: 1, duration: 1.4, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  }
}

/** The stage clock runs up to its hour as the stage comes in: 04:00 → 07:00. */
function stageClocks() {
  for (const el of gsap.utils.toArray<HTMLElement>("[data-stage-time]")) {
    const [h = 0, m = 0] = (el.dataset.stageTime ?? "00:00").split(":").map(Number);
    const target = h * 60 + m;
    const clock = { t: Math.max(0, target - 180) };
    const show = () => {
      const v = Math.round(clock.t / 5) * 5;
      el.textContent = `${String(Math.floor(v / 60) % 24).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
    };
    show();
    gsap.to(clock, {
      t: target,
      duration: 1.6,
      ease: "expo.out",
      onUpdate: show,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  }
}

function basira() {
  for (const box of gsap.utils.toArray<HTMLElement>("[data-basira]")) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: box, start: "top 75%", once: true } });
    tl.from(box.querySelector("[data-basira-q]"), { y: 16, autoAlpha: 0, duration: 0.7, ease: "expo.out" })
      .from(box.querySelector("[data-basira-a]"), { y: 16, autoAlpha: 0, duration: 0.7, ease: "expo.out" }, "+=0.25")
      .from(box.querySelectorAll("[data-bar]"), { scaleX: 0, transformOrigin: rtl ? "100% 50%" : "0% 50%", duration: 1.1, ease: "expo.out", stagger: 0.09 }, "-=0.3");
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

type Pos = { xPercent: number; yPercent: number; scale: number; autoAlpha: number; zIndex: number };

function deckPos(k: number, n: number): Pos {
  return {
    xPercent: k * 4.5 * dir,
    yPercent: -k * 4.5,
    scale: 1 - k * 0.065,
    autoAlpha: k === 0 ? 1 : Math.max(0.35, 1 - k * 0.3),
    zIndex: n - k,
  };
}

/** Each paragraph of an area brings its matching screen forward. */
function areas() {
  for (const area of gsap.utils.toArray<HTMLElement>("[data-area]")) {
    const steps = Array.from(area.querySelectorAll<HTMLElement>("[data-step]"));
    const map: number[] = JSON.parse(area.dataset.stepMap || "[]");
    const media = area.querySelector<HTMLElement>("[data-media]");
    const kind = media?.dataset.media;
    const cards = media ? Array.from(media.querySelectorAll<HTMLElement>("[data-card]")) : [];
    const n = cards.length;
    let current = -1;

    // Take over the inline styles so GSAP owns every transform from here on.
    cards.forEach((c, i) => {
      c.style.transform = "";
      c.style.opacity = "";
      if (kind === "deck") gsap.set(c, deckPos(i, n));
      else gsap.set(c, { yPercent: i === 0 ? -4 : 2, scale: i === 0 ? 1.04 : 0.94, autoAlpha: i === 0 ? 1 : 0.72 });
    });

    const showCard = (target: number) => {
      if (!media || n === 0 || target === current) return;
      current = target;
      if (kind === "deck") {
        const order = [target, ...cards.map((_, i) => i).filter((i) => i !== target)];
        cards.forEach((c, i) => gsap.to(c, { ...deckPos(order.indexOf(i), n), duration: 0.8, ease: "expo.out" }));
      } else if (kind === "fan") {
        // Move the active phone to the middle with Flip, then let it step forward.
        const state = Flip.getState(cards);
        const active = cards[target];
        const others = cards.filter((_, i) => i !== target);
        const left = others[0];
        const right = others[1];
        if (left && active) media.append(left, active, ...(right ? [right] : []));
        cards.forEach((c) => {
          const on = c === active;
          gsap.set(c, { zIndex: on ? 3 : 1 });
          c.dataset.on = String(on);
        });
        Flip.from(state, { duration: 0.75, ease: "expo.inOut" });
        cards.forEach((c) => gsap.to(c, { yPercent: c === active ? -4 : 2, scale: c === active ? 1.04 : 0.94, autoAlpha: c === active ? 1 : 0.7, duration: 0.75, ease: "expo.out" }));
      }
    };

    const activate = (i: number) => {
      steps.forEach((s, j) => (j === i ? s.setAttribute("data-active", "") : s.removeAttribute("data-active")));
      showCard(map[i] ?? 0);
    };

    steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top 62%",
        end: "bottom 62%",
        onToggle: (self) => { if (self.isActive) activate(i); },
      });
    });
    activate(0);

    // The media settles in as the area arrives.
    if (media) {
      gsap.from(media, { y: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: area, start: "top 70%", once: true } });
    }
  }
}

/** The floating pill: which part of the day we're in, and how far through it. */
function rail() {
  const story = document.querySelector<HTMLElement>("[data-story]");
  const pill = document.querySelector<HTMLElement>("[data-rail]");
  if (!story || !pill) return;
  const progress = pill.querySelector<HTMLElement>("[data-rail-progress]");
  const chips = Array.from(pill.querySelectorAll<HTMLElement>("[data-rail-chip]"));
  // These ranges contain the barista pin, so they measure after it (refreshPriority -1);
  // measured before it, they would end a whole pin-length too early.
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
