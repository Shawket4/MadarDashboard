// A cappuccino, step by step: Madar's prep-step animations played with dotLottie.
//  scrub  the block pins and scrolling plays the steps (desktop and phones)
//  still  (reduced motion) one finished frame, no movement
import { DotLottie } from "@lottiefiles/dotlottie-web";
import wasmUrl from "@lottiefiles/dotlottie-web/dotlottie-player.wasm?url";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Mode = "scrub" | "still";
let players: DotLottie[] = [];

const pad = (n: number) => String(n).padStart(2, "0");

export function initBarista({ mode }: { mode: Mode }): (() => void) | void {
  const root = document.querySelector<HTMLElement>("[data-barista]");
  if (!root) return;
  DotLottie.setWasmUrl(wasmUrl);

  const canvases = Array.from(root.querySelectorAll<HTMLCanvasElement>("canvas[data-lottie]"));
  const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-barista-step]"));
  const names = steps.map((s) => s.querySelector(".font-semibold")?.textContent ?? "");
  const notes = steps.map((s) => s.querySelector(".text-muted-ink")?.textContent ?? "");
  const label = root.querySelector<HTMLElement>("[data-barista-current]");
  const note = root.querySelector<HTMLElement>("[data-barista-note]");
  const count = root.querySelector<HTMLElement>("[data-barista-count]");
  const bar = root.querySelector<HTMLElement>("[data-barista-progress]");
  const n = canvases.length;
  if (!n) return;

  const ensure = () => {
    if (players.length) return;
    players = canvases.map(
      (canvas) =>
        new DotLottie({
          canvas,
          src: canvas.dataset.lottie ?? "",
          autoplay: false,
          loop: false,
          renderConfig: { devicePixelRatio: Math.min(2, window.devicePixelRatio || 1), freezeOnOffscreen: true },
        }),
    );
  };

  let shown = -1;
  const show = (i: number) => {
    if (i === shown) return;
    shown = i;
    canvases.forEach((c, j) => (c.style.opacity = j === i ? "1" : "0"));
    steps.forEach((s, j) => (j === i ? s.setAttribute("data-active", "") : s.removeAttribute("data-active")));
    if (label) label.textContent = names[i] ?? "";
    if (note) note.textContent = notes[i] ?? "";
    if (count) count.textContent = `${pad(i + 1)} / ${pad(n)}`;
  };

  const frameAt = (p: DotLottie, t: number) => {
    try {
      const total = p.totalFrames;
      if (total > 0) p.setFrame(Math.max(0, Math.min(total - 1, t * (total - 1))));
    } catch { /* not loaded yet */ }
  };

  if (mode === "still") {
    ensure();
    const i = Math.min(4, n - 1); // the finished latte art
    const p = players[i];
    p?.addEventListener("load", () => frameAt(p, 1));
    show(i);
    if (bar) bar.style.transform = "scaleX(1)";
    return;
  }

  if (mode === "scrub") {
    const pin = root.querySelector<HTMLElement>(".barista-pin") ?? root;
    ScrollTrigger.create({ trigger: root, start: "top bottom+=400", once: true, onEnter: ensure });
    show(0);
    ScrollTrigger.create({
      trigger: pin,
      pin: true,
      start: "top top",
      end: `+=${n * 55}%`,
      onUpdate: (self) => {
        ensure();
        const x = self.progress * n;
        const i = Math.min(n - 1, Math.floor(x));
        show(i);
        const p = players[i];
        if (p) frameAt(p, Math.min(1, x - i));
        if (bar) bar.style.transform = `scaleX(${self.progress})`;
      },
    });
    return;
  }

  return;
}
