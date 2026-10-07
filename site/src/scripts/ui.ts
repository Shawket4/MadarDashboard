// Small UI behaviour shared by every page: the contact sheet, the phone menu, the
// header turning solid on scroll, and the sticky WhatsApp bar on phones.
// Everything here degrades to plain links without JavaScript.

// The server can't open folder addresses yet (see src/pages/index.astro): link
// straight to each page's file, so a click doesn't hop through the root page.
if (document.documentElement.hasAttribute("data-files")) {
  for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
    const raw = a.getAttribute("href") ?? "";
    if (raw.startsWith("#")) continue;
    const u = new URL(raw, location.href);
    if (u.origin !== location.origin || u.pathname === location.pathname) continue;
    if (/^\/(en|ar)\/([a-z0-9-]+\/)*$/.test(u.pathname)) a.setAttribute("href", `${u.pathname}index.html${u.search}${u.hash}`);
  }
}

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
  if ((e.target as Element).closest("a")) menu.close();
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
