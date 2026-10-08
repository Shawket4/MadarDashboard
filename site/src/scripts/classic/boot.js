// Runs in <head>, before the page paints (a classic, render-blocking script, kept out
// of the HTML so the site's CSP can say script-src 'self').
(function (d) {
  d.classList.add("js");
  var motion = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (motion) d.classList.add("motion");
  // A click from another page of this site: the page transition brings the page
  // in, so nothing on screen waits for an entrance ("soft"). The root page's
  // forward marks itself, and that still counts as arriving.
  var soft = false;
  try {
    var hop = sessionStorage.getItem("madar-hop");
    if (hop) sessionStorage.removeItem("madar-hop");
    var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    var ref = document.referrer;
    soft = !hop && !!ref && ref.indexOf(location.origin + "/") === 0 && !(nav && nav.type === "reload");
  } catch (e) {}
  if (soft) d.setAttribute("data-soft", "");
  // Arriving fresh: hide what the entrance animates until it's ready (3 s safety net).
  if (motion && !soft) {
    d.classList.add("m");
    setTimeout(function () { if (!d.classList.contains("m-ready")) d.classList.add("m-fail"); }, 3000);
  }
})(document.documentElement);
