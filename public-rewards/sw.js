// The Rewards teller page: online-first. The network answers everything; the only
// thing kept is the page's shell, so a blink in the shop's Wi-Fi reloads the
// page instead of showing the browser's error. API calls are never cached or
// answered from here (there is no offline queue: a stamp needs the server).
const SHELL = "rewards-shell-v1";
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

self.addEventListener("fetch", (event) => {
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
