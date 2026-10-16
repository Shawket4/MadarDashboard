// Small UI behaviour shared by every page: the contact sheet, the phone menu, the
// header turning solid on scroll, the sticky WhatsApp bar on phones, and the pricing pick.
// Everything here degrades to plain links without JavaScript.

const contact = document.getElementById("contact-dialog") as HTMLDialogElement | null;

// iOS Safari applies :active (the press feedback, .press / .btn) only where a touch
// listener is: one on the document does for the whole page.
document.addEventListener("touchstart", () => {}, { passive: true });
const menu = document.getElementById("mobile-menu") as HTMLDialogElement | null;

const openSheet = (d: HTMLDialogElement | null) => {
  if (d && typeof d.showModal === "function" && !d.open) d.showModal();
};

document.addEventListener("click", (e) => {
  const target = e.target as Element | null;
  if (!target) return;
  const contactTrigger = target.closest("[data-open-contact]");
  if (contactTrigger && contact) {
    e.preventDefault();
    if (menu?.open) menu.close();
    openSheet(contact);
    return;
  }
  const menuTrigger = target.closest("[data-open-menu]");
  if (menuTrigger && menu) {
    e.preventDefault();
    openSheet(menu);
  }
});

// Click on the backdrop closes a sheet; following a link inside the menu closes it too.
for (const d of [contact, menu]) {
  d?.addEventListener("click", (e) => {
    if (e.target === d) d.close();
  });
}
menu?.addEventListener("click", (e) => {
  const target = e.target as Element;
  if (target.closest("a")) menu.close();
  else if (target.closest("[data-close-menu]")) closeMenu();
});

/** The menu's way out: its short fade (styles/motion.css), then shut. Instant when there is none. */
function closeMenu() {
  if (!menu?.open || menu.hasAttribute("data-closing")) return;
  menu.setAttribute("data-closing", "");
  const done = () => {
    menu.removeAttribute("data-closing");
    menu.close();
  };
  const fade = menu.getAnimations()[0];
  if (fade) fade.finished.then(done, done);
  else done();
}
// Escape (and Android's back) fades it out too; the native dialog keeps focus inside while
// open and hands it back to the menu button after.
menu?.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeMenu();
});
// Never back with the menu open: a page restored from the back/forward cache, a # change.
for (const type of ["pageshow", "hashchange"]) {
  window.addEventListener(type, () => void (menu?.open && menu.close()));
}

// Features opens onto its areas; shut, they are inert (out of the tab order and unheard).
const more = menu?.querySelector<HTMLButtonElement>(".menu-more");
const areas = document.getElementById("menu-areas");
more?.addEventListener("click", () => {
  const open = more.getAttribute("aria-expanded") !== "true";
  more.setAttribute("aria-expanded", String(open));
  if (areas) areas.inert = !open;
});

// Header: transparent over the hero, solid once the page moves.
const header = document.querySelector<HTMLElement>(".site-header");
const onScroll = () => {
  if (header) header.dataset.solid = String(window.scrollY > 24);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Phones: WhatsApp bar once the first section is gone, hidden again from the closing band
// down (the band and the footer carry their own contact links), and while a page's own
// call to action is on screen (data-hides-sticky: the pricing pick, a CtaBand), never two at once.
const sticky = document.getElementById("sticky-wa");
const first = document.querySelector("main > section, main > div > section");
const closing = document.getElementById("closing");
const own = document.querySelectorAll("[data-hides-sticky]");
if (sticky && "IntersectionObserver" in window) {
  let firstVisible = true;
  let closingVisible = false;
  let ownVisible = false;
  const update = () => {
    sticky.dataset.visible = String(!firstVisible && !closingVisible && !ownVisible);
  };
  if (first) new IntersectionObserver(([en]) => { firstVisible = !!en?.isIntersecting; update(); }).observe(first);
  if (closing) new IntersectionObserver(([en]) => { closingVisible = !!en && (en.isIntersecting || en.boundingClientRect.top < 0); update(); }).observe(closing);
  const showing = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) showing.add(en.target); else showing.delete(en.target);
    ownVisible = showing.size > 0;
    update();
  });
  for (const el of own) io.observe(el);
}

// Pricing: the package follows the pick (its name, its price and the WhatsApp message,
// there and on the phones' sticky bar). Without this the page still opens on its package.
const priceList = document.querySelector<HTMLFieldSetElement>("[data-price-list]");
const pickName = document.querySelector<HTMLElement>("[data-pick-name]");
const pickPrice = document.querySelector<HTMLElement>("[data-pick-price]");
const pickCta = document.querySelector<HTMLAnchorElement>("[data-pick-cta]");
const stickyLink = document.querySelector<HTMLAnchorElement>("#sticky-wa a");
const stickyLabel = stickyLink?.querySelector<HTMLElement>("[data-sticky-label]");
const showPick = (input: HTMLInputElement | null) => {
  const d = input?.dataset;
  if (!d?.href) return;
  if (pickName) pickName.textContent = d.name ?? "";
  if (pickPrice) pickPrice.textContent = d.price ?? "";
  if (pickCta) pickCta.href = d.href;
  if (stickyLink) stickyLink.href = d.href;
  if (stickyLabel) stickyLabel.textContent = d.name ?? "";
};
showPick(priceList?.querySelector<HTMLInputElement>("input:checked") ?? null);
priceList?.addEventListener("change", (e) => showPick(e.target as HTMLInputElement));
