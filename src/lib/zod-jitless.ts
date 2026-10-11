/**
 * zod without its JIT. Every page's Content-Security-Policy forbids eval
 * (`deploy/nginx/madar-csp-*.conf`), and zod probes for it with `Function("")`
 * on its first parse: refused, it fell back fine, but the browser reported a
 * violation on every page load. Jitless skips the probe. Every entry imports
 * this module FIRST, before anything that parses.
 */
import { z } from "zod";

z.config({ jitless: true });
