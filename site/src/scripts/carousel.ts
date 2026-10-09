// A set of screens, all on show, with the current one in the middle (MediaStack.astro).
//  - strip (browser or iPad): the current screen sits in the middle at full size, and its
//    neighbours peek in from the sides, smaller and dimmed. A change slides the whole
//    strip one place, so the next screen comes to the middle.
//  - fan (phones): every phone is on show, the current one in the middle and lifted. The
//    others stand either side in their order, smaller and dimmed. A change swaps the next
//    phone into the middle; only those two move.
// Places are fractions of a card's own width (xPercent), so they hold at any size. At
// rest the cards never overlap, so nothing shows through anything; while two phones
// swap, the incoming one passes in front and is already opaque when they cross.
import gsap from "gsap";

const dir = document.documentElement.dir === "rtl" ? -1 : 1;

type Place = { x: number; scale: number; alpha: number; lift: number; z: number };

/** The strip: `d` places from the current screen (next ones toward the reading end). */
const STRIP = { scale: 0.88, gap: 0.04, dim: 0.55 };
function stripPlace(d: number): Place {
  const a = Math.abs(d);
  const x = a === 0 ? 0 : Math.sign(d) * (0.5 + STRIP.gap + STRIP.scale / 2 + (a - 1) * (STRIP.scale + STRIP.gap));
  return { x: x * 100 * dir, scale: a ? STRIP.scale : 1, alpha: a === 0 ? 1 : a === 1 ? STRIP.dim : 0, lift: 0, z: 3 - Math.min(a, 2) };
}

/** The fan: slot `s` (0 is the middle; the size steps down twice, then holds). */
const FAN = { scale: [1, 0.84, 0.7], alpha: [1, 0.5, 0.28], gap: 0.07, lift: -3 };
function fanPlace(s: number): Place {
  const a = Math.abs(s);
  const size = (i: number) => FAN.scale[Math.min(i, 2)] ?? 0.7;
  let x = 0;
  for (let i = 1; i <= a; i++) x += size(i - 1) / 2 + FAN.gap + size(i) / 2;
  const k = Math.min(a, 2);
  return { x: Math.sign(s) * x * 100 * dir, scale: size(a), alpha: FAN.alpha[k] ?? 0.28, lift: a ? 0 : FAN.lift, z: 3 - k };
}
/**
 * Where every place stands while place `k` is current: `k` in the middle, the others in
 * their order, split either side. Between two neighbouring `k`s only those two swap.
 */
function fanSlots(n: number, k: number) {
  const left = Math.floor((n - 1) / 2);
  const slots: number[] = [];
  let i = 0;
  for (let p = 0; p < n; p++) {
    if (p === k) {
      slots.push(0);
    } else {
      slots.push(i < left ? i - left : i - left + 1);
      i++;
    }
  }
  return slots;
}

export type Carousel = {
  /** Screen `k` (a place in the order) at rest, at once. */
  place: (k: number) => void;
  /** One step to a neighbouring place: the animation (made playing). */
  turn: (from: number, to: number) => gsap.core.Timeline;
};

/**
 * `order`: the card indices in the order they are shown. Cards it leaves out stay hidden.
 * The counter, dots and caption under the set follow along.
 */
export function carousel(media: HTMLElement, order: number[]): Carousel {
  const fan = media.dataset.media === "fan";
  const cards = Array.from(media.querySelectorAll<HTMLElement>("[data-card]"));
  const dots = Array.from(media.querySelectorAll<HTMLElement>("[data-dot]"));
  const count = media.querySelector<HTMLElement>("[data-media-count]");
  const caption = media.querySelector<HTMLElement>("[data-media-caption]");
  const n = order.length;
  const pad = (v: number) => String(v).padStart(2, "0");
  const altOf = (card: number) => cards[card]?.querySelector("img")?.getAttribute("alt") ?? "";
  const placeOf = (k: number, p: number) => (fan ? fanPlace(fanSlots(n, k)[p] ?? 0) : stripPlace(p - k));
  const vars = (pl: Place) => ({ xPercent: pl.x, yPercent: pl.lift, scale: pl.scale, autoAlpha: pl.alpha, zIndex: pl.z });

  // GSAP owns the cards from here: the ones the order leaves out stay hidden.
  cards.forEach((c, i) => {
    if (!order.includes(i)) gsap.set(c, { autoAlpha: 0 });
  });

  const mark = (k: number) => {
    const card = order[k] ?? 0;
    cards.forEach((c, i) => c.toggleAttribute("data-active", i === card));
    dots.forEach((d, i) => d.toggleAttribute("data-on", i === k));
    media.toggleAttribute("data-last", k === n - 1); // the scroll cue bows out on the last screen
    if (count) count.textContent = `${pad(k + 1)} / ${pad(n)}`;
    if (caption) caption.textContent = altOf(card);
  };

  const place = (k: number) => {
    mark(k);
    order.forEach((card, p) => {
      const el = cards[card];
      if (el) gsap.set(el, vars(placeOf(k, p)));
    });
  };

  const turn = (from: number, to: number) => {
    mark(to);
    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
    order.forEach((card, p) => {
      const el = cards[card];
      if (!el) return;
      const a = placeOf(from, p);
      const b = placeOf(to, p);
      if (a.x === b.x && a.scale === b.scale) return;
      if (a.alpha === 0 && b.alpha === 0) return void tl.set(el, vars(b), 0); // off the strip both ways
      if (fan) {
        // The phone coming to the middle passes in front of everything and is opaque
        // before the two cross; the one leaving passes behind.
        const incoming = b.lift !== 0;
        tl.set(el, { zIndex: incoming ? 6 : 0 }, 0)
          .to(el, { xPercent: b.x, duration: 0.85, ease: "power3.inOut" }, 0)
          .to(el, { scale: b.scale, yPercent: b.lift, duration: 0.85, ease: "power2.inOut" }, 0)
          .to(el, { autoAlpha: b.alpha, duration: incoming ? 0.32 : 0.6, ease: "power1.out" }, incoming ? 0 : 0.12)
          .set(el, { zIndex: b.z }, 0.85);
      } else {
        // The whole strip slides one place; screens coming onto it fade in, leaving ones out.
        tl.set(el, { zIndex: b.z }, 0)
          .to(el, { xPercent: b.x, scale: b.scale, duration: 0.8, ease: "power3.inOut" }, 0)
          .to(el, { autoAlpha: b.alpha, duration: 0.5, ease: "power1.inOut" }, b.alpha > a.alpha ? 0.05 : 0.12);
      }
    });
    return tl;
  };

  return { place, turn };
}
