// The crew (components/crew, CrewMoment.astro). The motion engine (scripts/motion.ts)
// loads this where a page shows them, with motion allowed only.
//  - Their entrances are set pieces on the engine (data-sequence): a figure pops up onto its
//    line (شريحة sweeps her slice open as she does), the Z-report prints in bursts and its
//    stamp lands. They play wherever the figure is as the engine starts.
//  - Their idle life is custom and stays here: they blink and wave at their own uneven
//    pace, follow the pointer with their eyes (or glance around on a phone), hop when
//    tapped or pointed at, and the joyful ones jump as they arrive; a badge falls in on its
//    lanyard and swings like a pendulum. All of it on GSAP's one ticker, timed by the
//    tokens, and only while on screen: nothing loops or spends a frame out of sight.
// Without motion everything is simply there, still (styles/sections/crew.css).
import { gsap, watch, onScreen, defineSequence } from "./motion";
import { DUR, EASE } from "@/lib/motion";

/** A figure pops up onto its line: the whole drawing, shadow and all (the <svg>, so the hop inside stays free for a greeting). */
defineSequence(
  "figure",
  (svg, tl) => {
    tl.fromTo(svg, { autoAlpha: 0, yPercent: 14, scale: 0.9, transformOrigin: "50% 100%" }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.7, ease: EASE.spring });
    // شريحة comes in the way a pie chart draws its slice: her mask sweeps her wedge open from
    // its corner, a quarter turn; her arms and legs come once it is mostly drawn.
    const sweep = svg.querySelector(".crew-sweep");
    if (sweep) tl.fromTo(sweep, { strokeDashoffset: 32 }, { strokeDashoffset: 0, duration: 0.85, ease: "power3.inOut" }, 0.05);
    const limbs = svg.querySelectorAll(".crew-limb");
    if (limbs.length) tl.fromTo(limbs, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power1.out" }, 0.55);
  },
  { always: true },
);

/** The Z-report feeds out of the printer in bursts, as a thermal printer does, and the stamp lands last. */
defineSequence(
  "receipt",
  (zr, tl) => {
    const paper = zr.querySelector(".zr-paper");
    const stamp = zr.querySelector(".zr-stamp");
    if (paper) {
      tl.set(paper, { yPercent: -104 });
      for (const [to, move, rest] of [[-80, 0.42, 0.21], [-52, 0.52, 0.21], [-22, 0.57, 0.21], [0, 0.47, 0]] as const) {
        tl.to(paper, { yPercent: to, duration: move, ease: "none" });
        if (rest) tl.to({}, { duration: rest });
      }
    }
    if (stamp) tl.fromTo(stamp, { autoAlpha: 0, scale: 1.9 }, { autoAlpha: 0.92, scale: 1, duration: DUR.pop, ease: EASE.pop }, "+=0.1");
  },
  { always: true },
);

/** The idle life, once the engine is armed. */
export function live() {
  const WAVE = DUR.wave * 1000;
  const HOP = DUR.hop * 1000;
  const swings = Array.from(document.querySelectorAll<HTMLElement>("[data-swing]"));
  const figures = Array.from(document.querySelectorAll<SVGSVGElement>("svg[data-crew]"));
  const seen = new Set<Element>();
  /** What carries on when it comes back on screen (a swing paused mid-swing). */
  const resume = new Map<Element, () => void>();

  for (const el of [...swings, ...figures]) {
    onScreen(el, (on) => {
      if (!on) return void seen.delete(el);
      seen.add(el);
      resume.get(el)?.();
    });
  }

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const live = (f: Element) => seen.has(f) && !document.hidden;

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) for (const go of resume.values()) go();
  });

  /** Set a flag for a while (a blink, a wave, a hop), then clear it. */
  const flash = (el: Element, attr: string, ms: number) => {
    el.setAttribute(attr, "");
    window.setTimeout(() => el.removeAttribute(attr), ms);
  };

  let joys = 0;
  for (const [i, f] of figures.entries()) {
    // Blinks: every few seconds, now and then a double.
    const blink = () => {
      if (live(f)) {
        flash(f, "data-blink", 130);
        if (Math.random() < 0.25) window.setTimeout(() => flash(f, "data-blink", 120), 260);
      }
      window.setTimeout(blink, rand(2600, 6200));
    };
    window.setTimeout(blink, rand(900, 3000));

    // Waves: one soon after it arrives (staggered, so two never wave in step), then idly.
    const wave = () => {
      if (live(f)) flash(f, "data-wave", WAVE);
      window.setTimeout(wave, rand(6500, 12000));
    };
    window.setTimeout(wave, 1600 + i * 900);

    // Pointed at or tapped: a hop, a big smile and a wave.
    const cheer = () => {
      if (f.hasAttribute("data-cheer")) return;
      flash(f, "data-cheer", HOP);
      flash(f, "data-wave", WAVE);
    };
    const target = f.closest("[data-crew-host]") ?? f;
    target.addEventListener("pointerenter", (e) => {
      if ((e as PointerEvent).pointerType === "mouse") cheer();
    });
    target.addEventListener("click", cheer);
    // A joyful one jumps once it has popped in; a pair jumps one after the other.
    if (f.hasAttribute("data-joy")) {
      const delay = 650 + 170 * joys++;
      watch(f, () => window.setTimeout(cheer, delay));
    }
  }

  // Eyes: they follow a mouse (on the next tick, at most once a frame); on touch screens
  // they glance around now and then.
  const pupils = figures.map((f) => ({ f, els: Array.from(f.querySelectorAll<SVGGElement>(".crew-pupil")) }));
  const look = (f: SVGSVGElement, els: SVGGElement[], dx: number, dy: number) => {
    // dx, dy in -1…1; the pupils travel at most 3 units of the artwork inside the eye.
    for (const el of els) el.style.transform = `translate(${(dx * 3).toFixed(2)}px, ${(dy * 2.4).toFixed(2)}px)`;
    f.toggleAttribute("data-looking", dx !== 0 || dy !== 0);
  };
  let pointer: { x: number; y: number } | null = null;
  let queued = false;
  const follow = () => {
    queued = false;
    if (!pointer) return;
    for (const { f, els } of pupils) {
      if (!seen.has(f)) continue;
      const r = f.getBoundingClientRect();
      const dx = pointer.x - (r.left + r.width / 2);
      const dy = pointer.y - (r.top + r.height * 0.45);
      const d = Math.hypot(dx, dy) || 1;
      // Full travel from about a character's width away; closer, the eyes ease to centre.
      const k = Math.min(1, d / Math.max(r.width, 80));
      look(f, els, (dx / d) * k, (dy / d) * k);
    }
  };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      if (!queued) {
        queued = true;
        gsap.ticker.add(follow, true);
      }
    },
    { passive: true },
  );
  // The mouse leaves the window: eyes back to the middle.
  document.addEventListener("mouseout", (e) => {
    if (e.relatedTarget) return;
    pointer = null;
    for (const { f, els } of pupils) look(f, els, 0, 0);
  });

  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const glance = () => {
      for (const { f, els } of pupils) {
        if (!live(f) || Math.random() < 0.4) continue;
        const a = rand(0, Math.PI * 2);
        look(f, els, Math.cos(a), Math.sin(a) * 0.7);
        window.setTimeout(() => look(f, els, 0, 0), rand(700, 1400));
      }
      window.setTimeout(glance, rand(2500, 4500));
    };
    window.setTimeout(glance, 2000);
  }

  // A badge hangs on its lanyard like a pendulum, and everything about it is physics (no
  // keyframes): it falls in from above the screen on a stiff spring, and the instant it
  // lands it swings (a damped pendulum, in degrees). A breeze, a passing mouse, or a hand
  // that holds it and lets go keep it swinging. It falls the moment it comes in.
  const SWING_HZ = 0.42;
  const K = (2 * Math.PI * SWING_HZ) ** 2;
  const C = 1.1;
  for (const s of swings) {
    const badge = s.querySelector<HTMLElement>(".crew-badge");
    if (!badge) continue;
    let a = 0; // angle, degrees
    let v = 0; // degrees per second
    let y = 0; // vertical offset, px (negative = above its place)
    let vy = 0;
    let falling = false;
    let held = false;
    let running = false;
    const landed = () => s.hasAttribute("data-settled");
    const stop = () => {
      running = false;
      gsap.ticker.remove(tick);
    };
    function tick(_time: number, deltaMs: number) {
      // Off screen the swing waits where it is, spending no frames; it carries on when back.
      if (!falling && !held && !live(s)) return stop();
      const dt = Math.min(0.033, deltaMs / 1000 || 0.016);
      if (falling) {
        // A stiff, slightly underdamped spring to 0: arrives fast, one small bounce.
        vy += (-170 * y - 13 * vy) * dt;
        y += vy * dt;
        if (y >= 0 && vy > 0) {
          falling = false;
          y = 0;
          vy = 0;
          s.setAttribute("data-settled", "");
          v += Math.random() < 0.5 ? 62 : -62; // the landing sets it swinging
        }
      }
      if (!held) {
        v += (-K * a - C * v) * dt;
        a = Math.max(-40, Math.min(40, a + v * dt));
      }
      badge!.style.transform = `translateY(${y.toFixed(1)}px) rotate(${a.toFixed(3)}deg)`;
      if (!falling && !held && Math.abs(a) <= 0.02 && Math.abs(v) <= 0.05) {
        badge!.style.transform = "";
        stop();
      }
    }
    const run = () => {
      if (running) return;
      running = true;
      gsap.ticker.add(tick);
    };
    const kick = (dv: number) => {
      v += dv;
      run();
    };
    resume.set(s, () => {
      if (Math.abs(a) > 0.02 || Math.abs(v) > 0.05) run();
    });
    // Waits above the screen; falls in from just above its top as soon as it comes in.
    badge.style.transform = "translateY(-130vh)";
    watch(s, () => {
      y = -(s.getBoundingClientRect().bottom + 60);
      falling = true;
      badge.style.transform = `translateY(${y.toFixed(1)}px)`;
      run();
    });
    // A breeze, only while it is on screen.
    const breeze = () => {
      if (landed() && live(s) && !held && Math.abs(a) < 1) kick(rand(14, 26) * (Math.random() < 0.5 ? -1 : 1));
      window.setTimeout(breeze, rand(3200, 6000));
    };
    window.setTimeout(breeze, 4500);
    s.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse" && landed() && !held) kick(rand(30, 40) * (Math.random() < 0.5 ? -1 : 1));
    });
    // Hold it: the card follows the pointer around the lanyard's top; let go and it swings.
    badge.addEventListener("pointerdown", (e) => {
      if (!landed()) return;
      held = true;
      s.setAttribute("data-held", "");
      badge.setPointerCapture(e.pointerId);
      const r = badge.getBoundingClientRect();
      const lanyard = parseFloat(getComputedStyle(s).getPropertyValue("--lanyard")) * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const px = r.left + r.width / 2;
      const py = r.top - lanyard;
      let prev = a;
      let prevT = performance.now();
      const move = (m: PointerEvent) => {
        const ang = (Math.atan2(m.clientX - px, m.clientY - py) * 180) / Math.PI;
        a = Math.max(-38, Math.min(38, ang));
        const t = performance.now();
        v = ((a - prev) / Math.max(1, t - prevT)) * 1000;
        prev = a;
        prevT = t;
      };
      const up = () => {
        held = false;
        s.removeAttribute("data-held");
        badge.removeEventListener("pointermove", move);
        badge.removeEventListener("pointerup", up);
        badge.removeEventListener("pointercancel", up);
        v = Math.max(-110, Math.min(110, v));
        kick(0);
      };
      badge.addEventListener("pointermove", move);
      badge.addEventListener("pointerup", up);
      badge.addEventListener("pointercancel", up);
      kick(0);
    });
  }
}
