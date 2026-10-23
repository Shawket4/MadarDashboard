// The Rewards teller page: online-first. The network answers everything; the only
// things kept are the page's shell and its hashed build files (and the brand
// SVGs), so a blink in the shop's Wi-Fi reloads the page and it says "offline"
// instead of showing the browser's error. API calls are never cached or
// answered from here (there is no offline queue: a stamp needs the server).
const SHELL = "rewards-shell-v2";
// The shell by its file name: nginx serves it for "/", and it exists under any server.
const PAGE = "/rewards.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.add(PAGE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Same-origin GETs that never change under one name: Vite's hashed /assets/ and
// the design system's SVGs. Cache-first, kept as they are fetched.
const isStatic = (url) =>
  url.origin === self.location.origin && (url.pathname.startsWith("/assets/") || /^\/[\w-]+\.svg$/.test(url.pathname));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === "GET" && isStatic(url)) {
    event.respondWith(
      caches.open(SHELL).then((c) =>
        c.match(event.request).then(
          (hit) =>
            hit ??
            fetch(event.request).then((res) => {
              if (res.ok) void c.put(event.request, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        void caches.open(SHELL).then((c) => c.put(PAGE, copy));
        return res;
      })
      .catch(() => caches.match(PAGE).then((hit) => hit ?? Response.error())),
  );
});
