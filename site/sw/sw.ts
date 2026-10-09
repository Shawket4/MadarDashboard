/// <reference lib="webworker" />
// The site from one archive (site/README.md, "The archive"). Once a visitor's first page
// has loaded, this worker fetches every file a visit needs as one pre-compressed tar
// (assets/pack.<hash>.tar), unpacks it into the browser's cache and from then on answers
// the site's requests from there: pages, scripts, styles, fonts, screenshots, the 3D and
// the cappuccino's animations, online or off.
//  - Until the archive has landed, a file that's in it waits up to 3 s for it, then comes
//    on its own: a slow connection never leaves a screenshot empty.
//  - A release ships a new archive under a new name, and this file names it. The browser
//    notices the change on a later page; the new worker unpacks the new archive while the
//    old one keeps serving, then takes over. A page never mixes two releases.
//  - Anything else (another site, the share images, the sitemap) goes to the network,
//    as it would without a worker.
// integrations/pack.mjs builds the archive and writes this file to /sw.js, with PACK
// (what the archive holds) in front.

declare const PACK: {
  /** The archive's content hash. */
  version: string;
  /** Where it is: /assets/pack.<version>.tar */
  url: string;
  /** How many files it holds. */
  count: number;
  /** Every address it answers: pages by their folder address, everything else by path. */
  files: string[];
  /** A screenshot's widths share a group ("<name>.<hash>"); the archive holds one of them. */
  shots: Record<string, string>;
  /** How a screenshot's address names its group (the same pattern the build groups by). */
  shot: string;
};

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `madar-pack-${PACK.version}`;
/** Written last: this version's archive is all there. */
const DONE = "/__madar-pack";
/** How long a file waits for the archive before it comes on its own. */
const WAIT = 3000;
const FILES = new Set(PACK.files);
const SHOT = new RegExp(PACK.shot);
const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json",
  wasm: "application/wasm",
  woff2: "font/woff2",
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  webmanifest: "application/manifest+json",
};

/** The archive address that answers `path`, or null when the archive doesn't hold it. */
function inPack(path: string): string | null {
  if (FILES.has(path)) return path;
  if (path.endsWith("/index.html")) {
    const folder = path.slice(0, -"index.html".length);
    if (FILES.has(folder)) return folder;
  }
  // Any width of a screenshot gets the one width the archive holds.
  const group = SHOT.exec(path)?.[1];
  return (group && PACK.shots[group]) || null;
}

/** Whether this version's archive is all in: read once when the worker starts. */
let unpacked: Promise<boolean> = caches
  .open(CACHE)
  .then((cache) => cache.match(DONE))
  .then(Boolean, () => false);
let unpacking: Promise<void> | null = null;

/**
 * Fetches and unpacks the archive, once: later calls share the same work. A failure
 * leaves nothing behind, and the next page tries again.
 */
function unpack(): Promise<void> {
  unpacking ??= (async () => {
    if (await unpacked) return;
    const res = await fetch(PACK.url);
    if (!res.ok) throw new Error(`archive: HTTP ${res.status}`);
    const tar = new Uint8Array(await res.arrayBuffer());
    // Its name is its content hash: anything else (a cut-off or damaged download) is no use.
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", tar));
    const hex = Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
    if (!hex.startsWith(PACK.version)) throw new Error("archive: damaged");
    const files = untar(tar);
    if (files.length !== PACK.count) throw new Error(`archive: ${files.length} of ${PACK.count} files`);
    const cache = await caches.open(CACHE);
    await Promise.all(files.map((file) => store(cache, file.name, file.body)));
    await cache.put(DONE, new Response(PACK.version));
    unpacked = Promise.resolve(true);
  })().catch(async (error: unknown) => {
    unpacking = null;
    await caches.delete(CACHE);
    throw error;
  });
  return unpacking;
}

/** The files in a tar (ustar: a 512-byte header before each file, padded to 512 bytes). */
function untar(tar: Uint8Array<ArrayBuffer>) {
  const files: { name: string; body: Uint8Array<ArrayBuffer> }[] = [];
  const text = new TextDecoder();
  const field = (head: Uint8Array, at: number, length: number) => {
    const bytes = head.subarray(at, at + length);
    const end = bytes.indexOf(0);
    return text.decode(end < 0 ? bytes : bytes.subarray(0, end));
  };
  for (let at = 0; at + 512 <= tar.length; ) {
    const head = tar.subarray(at, at + 512);
    const name = field(head, 0, 100);
    if (!name) break; // the empty blocks at the end
    const prefix = field(head, 345, 155);
    const size = parseInt(field(head, 124, 12).trim() || "0", 8);
    const kind = field(head, 156, 1);
    at += 512;
    if (kind === "0" || kind === "") files.push({ name: prefix ? `${prefix}/${name}` : name, body: tar.slice(at, at + size) });
    at += Math.ceil(size / 512) * 512;
  }
  return files;
}

/**
 * The headers nginx sends with every page (deploy/nginx/get.madar-pos.cloud): a page
 * this worker answers from the archive never touches nginx, so it carries them
 * itself, the CSP included. Keep the two in step.
 */
const PAGE_HEADERS = {
  "content-security-policy":
    "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
};

/** One file into the cache, under the address the site asks for it by. */
function store(cache: Cache, name: string, body: Uint8Array<ArrayBuffer>) {
  const type = TYPES[name.slice(name.lastIndexOf(".") + 1)] ?? "application/octet-stream";
  const page = name === "index.html" || name.endsWith("/index.html");
  const path = `/${page ? name.slice(0, -"index.html".length) : name}`;
  const headers = type.startsWith("text/html") ? { "content-type": type, ...PAGE_HEADERS } : { "content-type": type, "x-content-type-options": "nosniff" };
  return cache.put(path, new Response(body, { headers }));
}

async function fromPack(key: string) {
  if (!(await unpacked)) return undefined;
  return (await caches.open(CACHE)).match(key);
}

/** A file the archive holds: from the archive, or, before it has landed, after up to 3 s on its own. */
async function answer(event: FetchEvent, key: string): Promise<Response> {
  const ready = await fromPack(key);
  if (ready) return ready;
  const pack = unpack();
  event.waitUntil(pack.catch(() => undefined));
  const landed = await Promise.race([
    pack.then(() => true, () => false),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), WAIT)),
  ]);
  return (landed && (await fromPack(key))) || fetch(event.request);
}

/** Offline, an address the site doesn't have gets its 404 page. */
async function notFound() {
  const page = await fromPack("/404.html");
  return page ? new Response(page.body, { status: 404, headers: page.headers }) : Response.error();
}

worker.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== worker.location.origin) return;
  const key = inPack(url.pathname);
  if (key) return event.respondWith(answer(event, key));
  if (request.mode !== "navigate") return;
  // A folder address without its slash: the site's addresses always end in one.
  if (FILES.has(`${url.pathname}/`)) return event.respondWith(Response.redirect(`${url.pathname}/${url.search}`, 301));
  event.respondWith(fetch(request).catch(notFound));
});

worker.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // A release after the first: unpack its archive before taking over, while the
      // version in place keeps serving. A first visit takes over at once and the archive
      // follows (files wait up to 3 s for it).
      const earlier = (await caches.keys()).some((key) => key.startsWith("madar-pack-") && key !== CACHE);
      if (earlier) await unpack();
      await worker.skipWaiting();
    })(),
  );
});

worker.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith("madar-pack-") && key !== CACHE) await caches.delete(key);
      await worker.clients.claim();
    })(),
  );
});

// The page asks once it has loaded (src/scripts/offline.ts). The download runs inside
// this event, which keeps the worker alive until it's done.
worker.addEventListener("message", (event) => {
  if (event.data === "unpack") event.waitUntil(unpack().catch(() => undefined));
});
