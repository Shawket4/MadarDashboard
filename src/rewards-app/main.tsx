// Rewards by Madar (rewards.madar-pos.cloud): loyalty sold as its own product.
// One bundle, two screens, picked by the path before anything else loads:
//  - `/counter`: the teller page (set up, PIN, stamp), its own chunk;
//  - everything else: the owner's dashboard (members, programme, card,
//    messages), with its own sign-in, sharing the browser session with the
//    Madar dashboard (data/api/shared-session.ts).
// Served on its own origin with the public CSP: the API is the host's `/api/`.

// The same self-hosted superfamily as the dashboard, Latin + Arabic only.
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource/ibm-plex-sans-arabic/latin-400.css";
import "@fontsource/ibm-plex-sans-arabic/latin-500.css";
import "@fontsource/ibm-plex-sans-arabic/latin-600.css";
import "@fontsource/ibm-plex-sans-arabic/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";

import { i18nReady } from "@/i18n";
import "@/styles/globals.css";
import { bootMotion } from "@/lib/motion";
import { initRules } from "@/lib/rules";
// One rules build for both screens, so the HTML preloads one wasm.
import * as rulesWasm from "@/lib/rules/wasm/full/madar_web.js";
import { isCounterPath } from "./paths";

bootMotion();

const root = document.getElementById("root")!;
const counter = isCounterPath(window.location.pathname);
const screen = counter
  ? import("./counter").then((m) => () => m.mountCounter(root))
  : import("./owner").then((m) => () => m.mountOwner(root));

void Promise.all([screen, initRules(rulesWasm), i18nReady]).then(([mount]) => mount());
