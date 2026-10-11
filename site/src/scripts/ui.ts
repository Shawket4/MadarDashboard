// Small UI behaviour shared by every page: the contact sheet, the phone menu, the
// header turning solid on scroll, and the sticky WhatsApp bar on phones.
// Everything here degrades to plain links without JavaScript.

const contact = document.getElementById("contact-dialog") as HTMLDialogElement | null;
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

/** The menu's way out: its short fade (global.css), then shut. Instant when there is none. */
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
// down (the band and the footer carry their own contact links).
const sticky = document.getElementById("sticky-wa");
const first = document.querySelector("main > section, main > div > section");
const closing = document.getElementById("closing");
if (sticky && "IntersectionObserver" in window) {
  let firstVisible = true;
  let closingVisible = false;
  const update = () => {
    sticky.dataset.visible = String(!firstVisible && !closingVisible);
  };
  if (first) new IntersectionObserver(([en]) => { firstVisible = !!en?.isIntersecting; update(); }).observe(first);
  if (closing) new IntersectionObserver(([en]) => { closingVisible = !!en && (en.isIntersecting || en.boundingClientRect.top < 0); update(); }).observe(closing);
}
