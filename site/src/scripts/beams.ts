// The "one ledger" beams (LedgerBeams.astro): a curve from each input to the
// ledger and from the ledger to each output, measured from where the nodes sit
// (again whenever the layout changes), and a light travelling along each one.
// The light is a gradient band sliding from the curve's start to its end, so it
// always flows from input to ledger to output, in either language. It only runs
// while the beams are on screen, and not at all under reduced motion.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SVG = "http://www.w3.org/2000/svg";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** [from, to, lane]: the lane spreads the curves apart and staggers their timing. */
const BEAMS: [string, string, number][] = [
  ["till", "ledger", 0],
  ["ordering", "ledger", 1],
  ["inventory", "ledger", 2],
  ["loyalty", "ledger", 3],
  ["ledger", "dashboard", 1],
  ["ledger", "exports", 2],
  ["ledger", "basira", 3],
];

let uid = 0;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number>) {
  const node = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function beams(box: HTMLElement) {
  const svg = box.querySelector<SVGSVGElement>("[data-beam-svg]");
  if (!svg) return;
  const nodes = new Map(Array.from(box.querySelectorAll<HTMLElement>("[data-beam-node]")).map((n) => [n.dataset.beamNode, n]));
  const defs = el("defs", {});
  svg.append(defs);

  const lines = BEAMS.map(([from, to, lane]) => {
    const id = `beam-${++uid}`;
    const gradient = el("linearGradient", { id, gradientUnits: "userSpaceOnUse" });
    for (const [offset, color, opacity] of [
      [0, "#2E94A6", 0],
      [0.06, "#2E94A6", 1],
      [0.33, "#0D6273", 1],
      [1, "#0D6273", 0],
    ] as const) {
      gradient.append(el("stop", { offset, "stop-color": color, "stop-opacity": opacity }));
    }
    defs.append(gradient);
    const base = el("path", { fill: "none", stroke: "#14181E", "stroke-opacity": 0.12, "stroke-width": 1.75, "stroke-linecap": "round" });
    const light = el("path", { fill: "none", stroke: `url(#${id})`, "stroke-width": 1.75, "stroke-linecap": "round" });
    svg.append(base, light);
    return { from: nodes.get(from), to: nodes.get(to), lane, gradient, base, light, a: { x: 0, y: 0 }, b: { x: 0, y: 0 } };
  });

  // Curves from node centre to node centre, bowed apart by lane.
  const layout = () => {
    const frame = box.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${frame.width} ${frame.height}`);
    for (const line of lines) {
      if (!line.from || !line.to) continue;
      const r1 = line.from.getBoundingClientRect();
      const r2 = line.to.getBoundingClientRect();
      line.a = { x: r1.left - frame.left + r1.width / 2, y: r1.top - frame.top + r1.height / 2 };
      line.b = { x: r2.left - frame.left + r2.width / 2, y: r2.top - frame.top + r2.height / 2 };
      const bow = (line.lane - 1.5) * 26;
      const d = `M ${line.a.x},${line.a.y} Q ${(line.a.x + line.b.x) / 2},${line.a.y - bow} ${line.b.x},${line.b.y}`;
      line.base.setAttribute("d", d);
      line.light.setAttribute("d", d);
    }
  };
  new ResizeObserver(layout).observe(box);
  layout();

  if (reduce) {
    for (const line of lines) line.light.remove();
    return;
  }

  // The light: a band 30% of the beam long, its head leading, from start to end.
  const runs = lines.map((line, i) => {
    const at = { t: -0.05 };
    const place = () => {
      const { a, b } = line;
      const head = { x: a.x + (b.x - a.x) * at.t, y: a.y + (b.y - a.y) * at.t };
      const tail = { x: head.x - (b.x - a.x) * 0.3, y: head.y - (b.y - a.y) * 0.3 };
      line.gradient.setAttribute("x1", String(head.x));
      line.gradient.setAttribute("y1", String(head.y));
      line.gradient.setAttribute("x2", String(tail.x));
      line.gradient.setAttribute("y2", String(tail.y));
    };
    place();
    return gsap.to(at, {
      t: 1.3,
      duration: 3.6 + line.lane * 0.35,
      delay: i * 0.2,
      ease: "expo.out",
      repeat: -1,
      paused: true,
      onUpdate: place,
    });
  });
  ScrollTrigger.create({
    trigger: box,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => runs.forEach((run) => (self.isActive ? run.play() : run.pause())),
  });
}

for (const box of document.querySelectorAll<HTMLElement>("[data-beams]")) beams(box);
