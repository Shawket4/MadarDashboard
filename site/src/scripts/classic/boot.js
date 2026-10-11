// Runs in <head>, before the page paints (a classic, render-blocking script, kept out
// of the HTML so the site's CSP can say script-src 'self').
(function (d) {
  d.classList.add("js");
  var motion = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (motion) d.classList.add("motion");
  // A click from another page of this site: the page transition brings the page
  // in, so nothing on screen waits for an entrance ("soft").
  var soft = false;
  try {
    var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    var ref = document.referrer;
    soft = !!ref && ref.indexOf(location.origin + "/") === 0 && !(nav && nav.type === "reload");
  } catch (e) {}
  if (soft) d.setAttribute("data-soft", "");
  // Arriving fresh: the first screen plays its entrance (CSS, global.css "First screen").
  if (motion && !soft) d.classList.add("m");
})(document.documentElement);
