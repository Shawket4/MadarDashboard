// The root page (/): pick the language before anything paints. Arabic when the
// browser's first language is Arabic, English otherwise; the query and hash carry
// over. The server serves folder addresses, so this goes straight to /en/ or /ar/.
// A classic script kept out of the HTML so the site's CSP can say script-src 'self'.
(function (d) {
  var l = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  var to = (/^ar\b/i.test(l) ? "/ar/" : "/en/") + location.search + location.hash;
  d.className = "go";
  // The page we land on counts this as arriving, not as a click inside the site.
  try { sessionStorage.setItem("madar-hop", "1"); } catch (e) {}
  location.replace(to);
})(document.documentElement);
