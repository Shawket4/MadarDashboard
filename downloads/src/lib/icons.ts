// Inline 24px stroke icons (lucide-style, drawn here: no dependency).
const wrap = (d: string) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICONS: Record<string, string> = {
  android: wrap('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
  ios: wrap('<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M11 17h2"/>'),
  macos: wrap('<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/>'),
  windows: wrap('<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1"/><rect x="13" y="13" width="7.5" height="7.5" rx="1"/>'),
  linux: wrap('<path d="M4 17l6-6-6-6"/><path d="M12 19h8"/>'),
  bundle: wrap('<path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>'),
  file: wrap('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  download: wrap('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
  copy: wrap('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>'),
  link: wrap('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  till: wrap('<rect x="4" y="3" width="16" height="7" rx="1.5"/><path d="M6 10v10h12V10M9 14h6"/>'),
  flame: wrap('<path d="M12 22c4 0 7-2.7 7-6.5 0-3-2-4.5-3-7-1 1-1.5 2-1.5 3.5C13 9 12.5 5.5 10 3c0 3-5 5.5-5 12 0 4 3 7 7 7z"/>'),
  clock: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  chart: wrap('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  window: wrap('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'),
};
