// The product list as an HTML string. Pure (no DOM): Astro bakes it at build time and
// src/scripts/live.ts runs the very same function on the live manifest.json, so there is
// one template. Every dynamic value goes through esc().
import { ICONS } from "./icons";
import { PRODUCTS, t, type Lang } from "./i18n";

export type FileEntry = { name: string; size: number; sha256: string; url: string; date: string; tag: string; latest?: string };
export type Release = { version: string; tag: string; date: string; files: FileEntry[] };
export type Manifest = { generated: string | null; products: Record<string, { releases: Release[] }> };

export const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function platformOf(name: string): { os: string; icon: string; label: Record<Lang, string> } {
  const n = name.toLowerCase();
  const abi = /arm64|aarch64|v8a/.test(n) ? "ARM64" : /armv7|armeabi/.test(n) ? "ARMv7" : /x86_64|x64|amd64/.test(n) ? "x64" : "";
  const sfx = abi ? ` · ${abi}` : "";
  if (n.endsWith(".apk")) return { os: "android", icon: "android", label: { en: `Android · APK${sfx}`, ar: `أندرويد · APK${sfx}` } };
  if (n.endsWith(".aab")) return { os: "android", icon: "bundle", label: { en: "Android · Play bundle", ar: "أندرويد · حزمة Play" } };
  if (n.endsWith(".ipa")) return { os: "ios", icon: "ios", label: { en: "iOS · IPA", ar: "iOS · IPA" } };
  if (n.endsWith(".dmg") || /macos|\.app\.tar\.gz/.test(n)) return { os: "macos", icon: "macos", label: { en: `macOS${sfx}`, ar: `macOS${sfx}` } };
  if (/\.(exe|msi)$/.test(n) || /windows/.test(n)) return { os: "windows", icon: "windows", label: { en: `Windows${sfx}`, ar: `ويندوز${sfx}` } };
  if (/\.(appimage|deb|rpm)$/.test(n)) return { os: "linux", icon: "linux", label: { en: `Linux${sfx}`, ar: `لينكس${sfx}` } };
  return { os: "file", icon: "file", label: { en: "File", ar: "ملف" } };
}

export function size(bytes: number): string {
  if (bytes < 1e6) return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
  return bytes < 1e9 ? `${(bytes / 1e6).toFixed(bytes < 1e7 ? 1 : 0)} MB` : `${(bytes / 1e9).toFixed(2)} GB`;
}
/** Latin digits in both languages; the figure sits in an .ltr span either way. */
export function day(iso: string, lang: Lang): string {
  const d = new Date(iso);
  return Number.isNaN(+d) ? "" : new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}
const num = (s: string) => `<span class="ltr num">${esc(s)}</span>`;

function fileRow(f: FileEntry, lang: Lang): string {
  const c = t(lang), p = platformOf(f.name);
  return `<li class="file" data-os="${p.os}">
  <span class="file-os">${ICONS[p.icon]}<span>${esc(p.label[lang])}</span></span>
  <span class="file-main"><a class="file-name ltr" href="${esc(f.url)}" download>${esc(f.name)}</a>
    <span class="file-meta">${num(size(f.size))} <span aria-hidden="true">·</span> ${num(day(f.date, lang))}</span>
    <span class="sha"><span class="sha-k">SHA-256</span><code class="ltr" title="${esc(f.sha256)}">${esc(f.sha256)}</code></span></span>
  <span class="file-actions">
    <a class="btn btn-primary" href="${esc(f.url)}" download>${ICONS.download}<span>${c.download}</span></a>
    <button type="button" class="btn btn-quiet js-only" hidden data-copy="${esc(f.sha256)}" aria-label="${c.copySha}" title="${c.copySha}">${ICONS.copy}<span>SHA-256</span></button>
    ${f.latest ? `<button type="button" class="btn btn-quiet js-only" hidden data-copy="${esc(f.latest)}" data-abs aria-label="${c.copyLink}" title="${c.copyLink}">${ICONS.link}<span>${c.stable}</span></button>` : ""}
  </span></li>`;
}

function release(r: Release, lang: Lang, isLatest: boolean): string {
  const c = t(lang);
  const pre = r.version.includes("-");
  return `<div class="rel">
  <div class="rel-head"><span class="ver ltr">${esc(r.tag)}</span>${isLatest ? `<span class="pill pill-latest">${c.latest}</span>` : ""}${pre ? `<span class="pill">${c.pre}</span>` : ""}<span class="rel-date">${num(day(r.date, lang))}</span></div>
  <ul class="files">${r.files.map((f) => fileRow(f, lang)).join("")}</ul></div>`;
}

function card(id: string, releases: Release[], lang: Lang): string {
  const c = t(lang);
  const def = PRODUCTS.find((p) => p.id === id);
  const name = def?.name[lang] ?? id;
  const [first, ...rest] = releases;
  return `<section class="card" id="${esc(id)}" aria-labelledby="h-${esc(id)}">
  <header class="card-head"><span class="card-ic">${ICONS[def?.icon ?? "file"]}</span>
    <div><h2 id="h-${esc(id)}">${esc(name)}</h2>${def ? `<p>${def.blurb[lang]}</p>` : ""}</div></header>
  ${first ? release(first, lang, true) : `<p class="empty">${c.noBuilds}</p>`}
  ${rest.length ? `<details class="older"><summary>${c.versions(rest.length)}</summary>${rest.map((r) => release(r, lang, false)).join("")}</details>` : ""}
  ${def?.testflight ? `<p class="note">${c.ios}</p>` : ""}
</section>`;
}

/** Cards for the known products in order (an empty one says so), then any unknown product. */
export function renderProducts(m: Manifest, lang: Lang): string {
  const known = PRODUCTS.map((p) => p.id);
  const ids = [...known, ...Object.keys(m.products).filter((id) => !known.includes(id))];
  const any = Object.values(m.products).some((p) => p.releases?.length);
  if (!any) return `<div class="card empty-state"><h2>${t(lang).emptyTitle}</h2><p>${t(lang).emptyBody}</p></div>`;
  return ids.filter((id) => m.products[id]?.releases?.length).map((id) => card(id, m.products[id].releases, lang)).join("\n");
}
