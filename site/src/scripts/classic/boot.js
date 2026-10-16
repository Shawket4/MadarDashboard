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
  // Arriving fresh: the first screen plays its entrance (CSS, styles/motion.css "First screen").
  if (motion && !soft) d.classList.add("m");
  // Arriving on a # address: the browser opens on that section, which plays its entrance
  // in CSS too (styles/motion.css, ":target"), however the page was reached.
  if (motion && location.hash.length > 1) d.setAttribute("data-arrive", "");
  // A page transition the browser skips (a second click mid-transition, a hidden tab)
  // rejects its promises, and nothing else holds them: catch them here, before the
  // first paint, so a skipped transition isn't an uncaught error.
  var quiet = function (e) {
    var vt = e.viewTransition;
    if (!vt) return;
    var no = function () {};
    if (vt.ready) vt.ready.catch(no);
    if (vt.finished) vt.finished.catch(no);
    if (vt.updateCallbackDone) vt.updateCallbackDone.catch(no);
  };
  window.addEventListener("pagereveal", quiet);
  window.addEventListener("pageswap", quiet);
})(document.documentElement);
