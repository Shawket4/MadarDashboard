// The only script: reveals the copy buttons and keeps the baked list honest.
// With JS off the page is the snapshot it was built from; with JS on it asks the
// server for manifest.json and, if that is newer, renders the same template again.
import { renderProducts, type Manifest } from "../lib/render";
import type { Lang } from "../lib/i18n";

const root = document.getElementById("products")!;
const lang = root.dataset.lang as Lang;
const reveal = () => document.querySelectorAll<HTMLElement>(".js-only").forEach((e) => (e.hidden = false));
reveal();

document.addEventListener("click", async (e) => {
  const b = (e.target as Element).closest<HTMLElement>("[data-copy]");
  if (!b) return;
  const text = b.hasAttribute("data-abs") ? location.origin + b.dataset.copy : b.dataset.copy!;
  try { await navigator.clipboard.writeText(text); } catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  b.classList.add("done");
  setTimeout(() => b.classList.remove("done"), 1400);
});

// ?app=<product> (or #<product>) spotlights that product's card: scrolled to the middle
// of the screen, ringed. The links on get.madar-pos.cloud use it ("pos", "kitchen", "dawam",
// "dashboard", "dashboard-desktop"). Without JS the #<product> address still scrolls to it.
function spotlight() {
  const id = new URLSearchParams(location.search).get("app") ?? decodeURIComponent(location.hash.slice(1));
  root.querySelectorAll(".spotlight").forEach((c) => c.classList.remove("spotlight"));
  const card = id ? root.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null;
  if (!card) return;
  card.classList.add("spotlight");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  card.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
}
spotlight();

fetch("/manifest.json", { cache: "no-cache" })
  .then((r) => (r.ok ? (r.json() as Promise<Manifest>) : null))
  .then((m) => {
    if (!m || !m.generated || m.generated === root.dataset.generated) return;
    const open = [...root.querySelectorAll("details[open]")].map((d) => d.closest("section")?.id);
    root.innerHTML = renderProducts(m, lang);
    root.dataset.generated = m.generated;
    for (const id of open) if (id) root.querySelector<HTMLDetailsElement>(`#${CSS.escape(id)} details`)!.open = true;
    reveal();
    spotlight();
  })
  .catch(() => {});
