// The site from one archive (sw/sw.ts): once this page has loaded, the service worker
// fetches every file a visit needs as one pre-compressed file and from then on answers
// the site's requests from it, offline included. Where a browser can't run one (an
// in-app browser on iPhone, some private windows), nothing changes: the site loads as it
// always has.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const start = () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => registration.active?.postMessage("unpack"))
      .catch(() => {});
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
