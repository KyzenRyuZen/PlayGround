/* Hand-built vector art and interface glyphs. No external image dependencies. */

const stroke = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

const ITEM_PATHS = {
  weapon: `
    <path d="M30 5 37 12 20 35 13 36 12 29Z" fill="currentColor" opacity=".15"/>
    <path d="M29.5 6.5 36 13 18.5 34.5 12.5 35.5 11.5 29.5Z" ${stroke}/>
    <path d="M10 36 6 42M12 32 16 36M7 35 13 41" ${stroke}/>
    <path d="M30 5 34 5 37 8 37 12" ${stroke}/>
    <path d="M33 12 28 17" ${stroke}/>
    <circle cx="33.5" cy="9.5" r="1.5" fill="currentColor"/>`,
  armor: `
    <path d="M16 9 23 6 28 10 33 6 40 10 43 23 37 27 34 42 16 42 14 27 8 22 11 10Z" fill="currentColor" opacity=".12"/>
    <path d="M16 9 23 6 28 10 33 6 40 10 43 22 37 26 34 42 16 42 14 26 8 22 11 10Z" ${stroke}/>
    <path d="M22 6 27 15 32 6M27 15 27 42M14 25 22 29 27 25 32 29 38 25" ${stroke}/>
    <path d="M18 34h7M29 34h7" ${stroke} opacity=".55"/>`,
  bracelet: `
    <ellipse cx="24" cy="30" rx="15" ry="7" fill="currentColor" opacity=".1"/>
    <ellipse cx="24" cy="30" rx="15" ry="7" ${stroke}/>
    <ellipse cx="24" cy="25" rx="15" ry="7" ${stroke}/>
    <path d="M15 27v4M33 27v4M15 31c3 3 7 4 9 4s6-1 9-4" ${stroke} opacity=".65"/>
    <path d="M24 16 27 20 24 24 21 20Z" fill="currentColor"/>
    <circle cx="14" cy="31" r="1.5" fill="currentColor"/><circle cx="34" cy="31" r="1.5" fill="currentColor"/>`,
  earrings: `
    <path d="M15 8c0 5-4 5-4 10s4 5 4 9M33 8c0 5 4 5 4 10s-4 5-4 9" ${stroke}/>
    <path d="M11 25 14 31 17 25 14 28Z" fill="currentColor"/>
    <path d="M29 25 32 31 35 25 32 28Z" fill="currentColor"/>
    <path d="M13 8c0-2 4-2 4 0M31 8c0-2 4-2 4 0" ${stroke}/>
    <circle cx="14" cy="31" r="2" fill="currentColor" opacity=".5"/><circle cx="32" cy="31" r="2" fill="currentColor" opacity=".5"/>
    <path d="M11 36h6M29 36h6" ${stroke} opacity=".35"/>`,
  helmet: `
    <path d="M13 20c0-11 5-16 11-16s11 5 11 16v11c0 7-5 11-11 11s-11-4-11-11Z" fill="currentColor" opacity=".12"/>
    <path d="M13 20c0-11 5-16 11-16s11 5 11 16v11c0 7-5 11-11 11s-11-4-11-11Z" ${stroke}/>
    <path d="M13 20 6 14 8 25M35 20 42 14 40 25" ${stroke}/>
    <path d="M17 23h5M26 23h5M22 23h4M24 23v9" ${stroke}/>
    <path d="M18 34c4 2 8 2 12 0" ${stroke} opacity=".65"/>
    <path d="M11 18 4 9 10 8 17 17M37 18 44 9 38 8 31 17" ${stroke}/>
    <circle cx="24" cy="11" r="1.8" fill="currentColor"/>`,
  shield: `
    <path d="M24 4 40 9v13c0 11-7 17-16 22C15 39 8 33 8 22V9Z" fill="currentColor" opacity=".12"/>
    <path d="M24 4 40 9v13c0 11-7 17-16 22C15 39 8 33 8 22V9Z" ${stroke}/>
    <path d="M24 9 35 12v9c0 8-5 13-11 17-6-4-11-9-11-17v-9Z" ${stroke} opacity=".55"/>
    <path d="M24 15 28 22 24 31 20 22Z" fill="currentColor"/>
    <path d="M13 13 18 16M35 13 30 16" ${stroke} opacity=".45"/>`,
  boots: `
    <path d="M13 5h10v21l10 5c3 2 4 7-2 9H12c-5 0-6-4-4-7l5-6Z" fill="currentColor" opacity=".12"/>
    <path d="M13 5h10v21l10 5c3 2 4 7-2 9H12c-5 0-6-4-4-7l5-6Z" ${stroke}/>
    <path d="M13 5v23l-5 4M23 5v20M11 37h17M14 31h9" ${stroke}/>
    <path d="M17 12h4M17 18h4" ${stroke} opacity=".5"/>
    <path d="M33 7v15" ${stroke} opacity=".35"/>`,
  necklace: `
    <path d="M9 8c0 19 6 27 15 27s15-8 15-27" ${stroke}/>
    <path d="M10 8h-3M38 8h3M15 12l2 4M33 12l-2 4" ${stroke} opacity=".65"/>
    <path d="M24 27 29 34 24 42 19 34Z" fill="currentColor" opacity=".18"/>
    <path d="M24 27 29 34 24 42 19 34Z" ${stroke}/>
    <circle cx="24" cy="34" r="2.2" fill="currentColor"/>`,
  ring: `
    <ellipse cx="24" cy="29" rx="12" ry="13" ${stroke}/>
    <ellipse cx="24" cy="29" rx="8" ry="9" ${stroke} opacity=".38"/>
    <path d="M17 19 24 8 31 19 24 25Z" fill="currentColor" opacity=".18"/>
    <path d="M17 19 24 8 31 19 24 25Z" ${stroke}/>
    <path d="M17 19h14M24 8v17" ${stroke} opacity=".55"/>
    <circle cx="24" cy="18" r="2" fill="currentColor"/>`
};

const SKILL_PATHS = {
  cleave: `<path d="M9 31C14 14 30 7 42 12 30 12 20 20 17 38" ${stroke}/><path d="M13 35 8 40M31 10l2-5M37 15l5-2" ${stroke}/><path d="M23 21c5-2 9-1 12 1" ${stroke} opacity=".5"/>`,
  bulwark: `<path d="M24 5 40 10v12c0 11-7 17-16 22C15 39 8 33 8 22V10Z" ${stroke}/><path d="M24 12 31 15v7c0 7-4 10-7 13-3-3-7-6-7-13v-7Z" fill="currentColor" opacity=".18"/><path d="M17 23h14" ${stroke}/>`,
  shatter: `<path d="M5 38 15 32 22 37 28 29 34 33 43 24M8 44l8-5M35 42l7-4" ${stroke}/><path d="M24 6v10M20 13l4 4 4-4M17 5l3 5M31 5l-3 5" ${stroke}/><path d="M13 22h8l-2 6M33 18l-4 7h6" ${stroke} opacity=".55"/>`,
  lance: `<path d="M7 35 35 10" ${stroke}/><path d="M35 10 42 7 39 15 34 18" fill="currentColor" opacity=".25"/><path d="M35 10 44 6 39 15" ${stroke}/><path d="M12 28 7 24M20 22 18 16M28 16 29 10" ${stroke}/><circle cx="9" cy="38" r="3" ${stroke}/>`,
  nova: `<path d="M24 4v12M24 32v12M4 24h12M32 24h12M10 10l8 8M30 30l8 8M38 10l-8 8M18 30l-8 8" ${stroke}/><path d="M18 18 24 14 30 18 34 24 30 30 24 34 18 30 14 24Z" ${stroke}/><circle cx="24" cy="24" r="3" fill="currentColor"/>`,
  meteor: `<circle cx="32" cy="17" r="8" ${stroke}/><path d="M27 12 12 27M25 17 8 34M30 22 20 40" ${stroke}/><path d="M9 39c4 1 6 1 9-1M6 31c3 1 5 0 7-2" ${stroke} opacity=".65"/><circle cx="32" cy="17" r="2.5" fill="currentColor"/>`,
  pierce: `<path d="M5 35 37 11" ${stroke}/><path d="M37 11 45 10 41 18" ${stroke}/><path d="M13 27 7 27M20 22 13 19M28 17 23 12M10 39l5-5" ${stroke}/><path d="M9 31 5 36M14 35l-3 6" ${stroke} opacity=".55"/>`,
  rain: `<path d="M24 4v15M18 9l6-6 6 6" ${stroke}/><path d="M9 21v8M16 18v11M32 18v11M39 21v8M12 34v6M24 31v9M36 34v6" ${stroke}/><path d="M6 43h36" ${stroke} opacity=".35"/>`,
  shadow: `<path d="M7 37c10 0 14-7 17-16M42 10c-10 0-14 7-17 16" ${stroke}/><path d="M22 15 24 5 31 11M26 28l-2 9-8-5" ${stroke}/><path d="M11 32 5 38l8 2M35 17l6-6-8-2" ${stroke}/><path d="M18 24h12" ${stroke} opacity=".55"/>`
};

const UI_PATHS = {
  sword: `<path d="M6 18 16 8l3 3-7 7 8 8-3 3-8-8-3 3Z" ${stroke}/><path d="M4 20l3 3" ${stroke}/>`,
  map: `<path d="M4 7 11 4 19 7 25 4v17l-6 3-8-3-7 3Z" ${stroke}/><path d="M11 4v17M19 7v17" ${stroke}/>`,
  anvil: `<path d="M4 9h16l2 4 4 1v4H10l-2 5H4l2-5H3c0-5 1-8 1-9Z" ${stroke}/><path d="M22 9h4M7 24h15" ${stroke}/>`,
  user: `<circle cx="14" cy="8" r="5" ${stroke}/><path d="M4 26c0-6 4-9 10-9s10 3 10 9" ${stroke}/>`,
  settings: `<circle cx="14" cy="14" r="4" ${stroke}/><path d="M14 3v4M14 21v4M3 14h4M21 14h4M6 6l3 3M19 19l3 3M22 6l-3 3M9 19l-3 3" ${stroke}/>`,
  volume: `<path d="M4 10h5l6-5v18l-6-5H4Z" ${stroke}/><path d="M18 9c2 2 2 8 0 10M21 6c4 4 4 12 0 16" ${stroke}/>`,
  mute: `<path d="M4 10h5l6-5v18l-6-5H4Z" ${stroke}/><path d="M18 11l6 6M24 11l-6 6" ${stroke}/>`,
  gold: `<circle cx="14" cy="14" r="9" ${stroke}/><path d="M14 8v12M10 11h6c4 0 4 5 0 5h-4" ${stroke}/>`,
  aether: `<path d="M14 3 18 10 25 14 18 18 14 25 10 18 3 14 10 10Z" ${stroke}/><circle cx="14" cy="14" r="3" fill="currentColor"/>`,
  chevron: `<path d="m8 5 6 6-6 6" ${stroke}/>`,
  lock: `<rect x="5" y="11" width="18" height="12" rx="3" ${stroke}/><path d="M9 11V8a5 5 0 0 1 10 0v3" ${stroke}/><circle cx="14" cy="17" r="1.5" fill="currentColor"/>`,
  check: `<path d="m4 14 6 6L24 5" ${stroke}/>`,
  back: `<path d="M22 14H5M11 7l-7 7 7 7" ${stroke}/>`,
  pause: `<path d="M9 5v18M19 5v18" ${stroke}/>`,
  play: `<path d="M8 4 24 14 8 24Z" ${stroke}/>`,
  auto: `<path d="M7 21 14 5l7 16M9 16h10M21 17l3 3 4-4" ${stroke}/>`,
  dash: `<path d="M4 21c8 0 11-4 14-11M18 10l4-6 4 6M20 18l4 5 4-5" ${stroke}/>`,
  clock: `<circle cx="14" cy="14" r="10" ${stroke}/><path d="M14 7v7l5 3" ${stroke}/>`,
  star: `<path d="M14 3 17 10 25 11 19 16 21 24 14 20 7 24 9 16 3 11 11 10Z" ${stroke}/>`,
  flame: `<path d="M14 3c2 6-5 8-5 14a5 5 0 0 0 10 0c0-3-2-5-3-7-1 3-3 4-3 7" ${stroke}/>`,
  skull: `<path d="M5 12a9 9 0 0 1 18 0v5l-3 2v4h-4v-3h-2v3H8v-4l-3-2Z" ${stroke}/><circle cx="10" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/>`,
  trophy: `<path d="M8 4h12v6c0 5-3 8-6 8s-6-3-6-8ZM8 6H4v3c0 3 2 5 5 5M20 6h4v3c0 3-2 5-5 5M14 18v5M9 27h10M11 23h6" ${stroke}/>`,
  spark: `<path d="M14 2 16 10 24 12 16 14 14 22 12 14 4 12 12 10Z" ${stroke}/><path d="M22 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="currentColor"/>`,
  close: `<path d="M5 5l18 18M23 5 5 23" ${stroke}/>`,
  info: `<circle cx="14" cy="14" r="11" ${stroke}/><path d="M14 12v8M14 7v1" ${stroke}/>`,
  tilt: `<rect x="8" y="3" width="12" height="22" rx="3" ${stroke}/><path d="M12 7h4M14 21h.1M4 11l2 3-2 3M24 11l-2 3 2 3" ${stroke}/>`,
  potion: `<path d="M10 3h8M11 3v6l-5 10a5 5 0 0 0 4 7h8a5 5 0 0 0 4-7L17 9V3" ${stroke}/><path d="M8 18h12" ${stroke}/><path d="M11 22h2M15 22h3" ${stroke} opacity=".55"/>`,
  arrow: `<path d="M5 23 23 5M15 5h8v8M5 15l4 4" ${stroke}/>`,
  bolt: `<path d="M15 3 5 17h8l-4 12 10-14h-8Z" ${stroke}/>`,
  crown: `<path d="m4 8 5 4 5-8 5 8 5-4-2 14H6Z" ${stroke}/><path d="M7 26h14" ${stroke}/><circle cx="14" cy="17" r="1.5" fill="currentColor"/>`,
  mapPin: `<path d="M14 26s8-8 8-14A8 8 0 0 0 6 12c0 6 8 14 8 14Z" ${stroke}/><circle cx="14" cy="12" r="2.5" ${stroke}/>`,
  heart: `<path d="M14 25S4 19 4 11a5 5 0 0 1 9-3l1 2 1-2a5 5 0 0 1 9 3c0 8-10 14-10 14Z" ${stroke}/>`,
  shield: `<path d="M14 3 24 6v7c0 7-4 11-10 14C8 24 4 20 4 13V6Z" ${stroke}/><path d="M14 8v12M9 13h10" ${stroke}/>`
};

export function itemIcon(slot, cls = '') {
  return `<svg class="item-icon ${cls}" viewBox="0 0 48 48" aria-hidden="true">${ITEM_PATHS[slot] || ITEM_PATHS.ring}</svg>`;
}

export function skillIcon(id, cls = '') {
  return `<svg class="skill-icon ${cls}" viewBox="0 0 48 48" aria-hidden="true">${SKILL_PATHS[id] || SKILL_PATHS.cleave}</svg>`;
}

export function uiIcon(id, cls = '') {
  return `<svg class="ui-icon ${cls}" viewBox="0 0 28 28" aria-hidden="true">${UI_PATHS[id] || UI_PATHS.star}</svg>`;
}

export function classArt(id) {
  if (id === 'mage') return mageArt();
  if (id === 'archer') return archerArt();
  return warriorArt();
}

function warriorArt() {
  return `
<svg class="class-art" viewBox="0 0 320 420" role="img" aria-label="Warrior">
  <defs>
    <linearGradient id="w-plate" x1="0" y1="0" x2=".8" y2="1">
      <stop stop-color="#7b4c3d"/><stop offset=".42" stop-color="#3a2528"/><stop offset="1" stop-color="#151216"/>
    </linearGradient>
    <linearGradient id="w-gold" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#f7d18d"/><stop offset=".35" stop-color="#b9793e"/><stop offset="1" stop-color="#5b341f"/>
    </linearGradient>
    <linearGradient id="w-cape" x1=".2" y1="0" x2=".8" y2="1">
      <stop stop-color="#5d1e27"/><stop offset=".55" stop-color="#32151e"/><stop offset="1" stop-color="#130e14"/>
    </linearGradient>
    <linearGradient id="w-blade" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#f8f0d5"/><stop offset=".3" stop-color="#b5b5af"/><stop offset="1" stop-color="#4d4b48"/>
    </linearGradient>
    <linearGradient id="w-guard" x1="0" y1="0" x2=".9" y2="1">
      <stop stop-color="#6d5146"/><stop offset=".45" stop-color="#332326"/><stop offset="1" stop-color="#171216"/>
    </linearGradient>
    <radialGradient id="w-aura" cx=".5" cy=".4" r=".6">
      <stop stop-color="#f49b52" stop-opacity=".22"/><stop offset="1" stop-color="#f49b52" stop-opacity="0"/>
    </radialGradient>
    <filter id="w-glow"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <ellipse cx="162" cy="216" rx="142" ry="162" fill="url(#w-aura)"/>
  <path d="M98 79c-20 31-26 87-26 151l-24 129c25 23 62 33 109 33s87-10 116-34l-30-128c2-61-5-119-23-151Z" fill="url(#w-cape)"/>
  <path d="M113 209c-17 43-22 96-19 158-20-3-34-8-46-21l24-129c2-45 8-88 21-116Z" fill="#1a1017" opacity=".85"/>
  <path d="M206 211c19 42 24 98 22 160 20-5 34-12 46-26l-30-128c-1-44-8-85-20-113Z" fill="#1a1017" opacity=".85"/>
  <path d="M119 146c-24-19-43-12-58 12-10 17-8 39 8 53l39 5 25-35Z" fill="url(#w-guard)"/>
  <path d="M205 145c25-20 46-13 61 11 11 17 9 40-7 55l-41 5-26-35Z" fill="url(#w-plate)"/>
  <path d="M126 151c13-26 30-37 40-37 14 0 32 13 44 41l-5 92c-9 17-22 27-38 27-17 0-31-10-41-27Z" fill="url(#w-plate)"/>
  <path d="M144 145c8-15 16-22 24-22 9 0 19 7 27 24l-7 25h-41Z" fill="#24171b"/>
  <path d="M119 147c-9 4-18 5-28 4 8-25 22-41 39-46l27 10-9 27Z" fill="url(#w-plate)"/>
  <path d="M209 151c9 4 19 6 29 5-8-26-24-43-42-48l-27 11 10 27Z" fill="url(#w-plate)"/>
  <path d="M119 147c-9 4-18 5-28 4l-2 20 35 14 13-27Z" fill="url(#w-gold)"/>
  <path d="M209 151c9 4 19 6 29 5l3 20-36 14-13-27Z" fill="url(#w-gold)"/>
  <path d="M144 183c11-8 24-10 38 0l-5 103c-8 14-20 21-32 15-11-6-15-20-15-45Z" fill="#20151a"/>
  <path d="M159 182v106M142 207l-20 9M179 207l20 9" ${stroke} opacity=".5"/>
  <path d="M116 240c-10 26-10 56-3 82l12 39c7 7 16 11 25 12l-13-89Z" fill="url(#w-plate)"/>
  <path d="M204 240c11 26 12 57 5 83l-12 39c-7 7-16 11-25 12l13-89Z" fill="url(#w-plate)"/>
  <path d="M117 246c-10-12-10-29-1-43 5-8 13-13 23-16l7 44Z" fill="#2b1b20"/>
  <path d="M206 246c10-12 11-30 2-44-6-8-14-13-24-16l-7 44Z" fill="#2b1b20"/>
  <path d="M144 115c0-24 8-39 22-39 15 0 25 16 25 41v29c0 21-11 33-24 33-15 0-24-12-24-34Z" fill="#1a1217"/>
  <path d="M141 104c1-28 10-42 26-42 18 0 27 17 27 47l-2 14-11-12h-28l-10 12Z" fill="url(#w-plate)"/>
  <path d="M139 101c-9 2-17-4-20-17l13-9 13 10Z" fill="url(#w-gold)"/>
  <path d="M195 101c9 2 17-5 19-18l-14-8-12 10Z" fill="url(#w-gold)"/>
  <path d="M132 87c6-26 19-40 36-40s30 14 36 40c-14-8-24-11-36-11s-23 3-36 11Z" fill="#1e1519"/>
  <path d="M140 92c7-6 16-9 25-9 11 0 19 3 26 10l-4 17-22 4-22-4Z" fill="#0d0b0e"/>
  <path d="M147 100c5-4 9-5 13 0l-2 4-9-1ZM172 100c4-5 8-4 13 0l-3 4-8 1Z" fill="#ffb058" filter="url(#w-glow)"/>
  <path d="M149 100c3-2 6-2 8 0l-1 1h-6ZM174 100c3-2 6-2 8 0l-2 1h-5Z" fill="#fff4c8"/>
  <path d="M159 151c-10 8-12 16-3 24 5 3 11 2 16-1" ${stroke} opacity=".35"/>
  <path d="M167 186 241 40l24 10-70 151Z" fill="url(#w-blade)" stroke="#e6d5a5" stroke-width="1"/>
  <path d="M167 186 236 43l12 6-65 146Z" fill="#e9dfbf" opacity=".22"/>
  <path d="M237 37 256 27 264 34 263 49 246 51Z" fill="url(#w-gold)"/>
  <path d="M165 188 156 215l27 7 11-22Z" fill="url(#w-gold)"/>
  <path d="M152 190 135 201l9 18 28-2Z" fill="#3b2520"/>
  <path d="M126 211c-9 5-14 16-12 26 3 12 14 17 25 12l12-8-8-25Z" fill="#291a1d"/>
  <path d="M256 27c8-5 19-5 25 3 4 6 3 14-1 19" ${stroke} stroke="#e6b36e" opacity=".5"/>
  <path d="M71 344c51 20 121 24 181 0" ${stroke} stroke="#bc7a4a" opacity=".25"/>
  <circle cx="228" cy="94" r="2" fill="#ffc879"/><circle cx="250" cy="187" r="1.5" fill="#ffc879" opacity=".6"/><circle cx="96" cy="129" r="1.6" fill="#ffc879" opacity=".5"/>
</svg>`;
}

function mageArt() {
  return `
<svg class="class-art" viewBox="0 0 320 420" role="img" aria-label="Mage">
  <defs>
    <linearGradient id="m-robe" x1=".2" y1="0" x2=".8" y2="1">
      <stop stop-color="#3a3672"/><stop offset=".42" stop-color="#1d214c"/><stop offset="1" stop-color="#0c0b19"/>
    </linearGradient>
    <linearGradient id="m-trim" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#a5f1ec"/><stop offset=".4" stop-color="#4db8c8"/><stop offset="1" stop-color="#31507c"/>
    </linearGradient>
    <radialGradient id="m-orb">
      <stop stop-color="#f5ffff"/><stop offset=".25" stop-color="#9af4ef"/><stop offset=".62" stop-color="#5c8fe9"/><stop offset="1" stop-color="#5c8fe9" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="m-aura" cx=".5" cy=".38" r=".64">
      <stop stop-color="#72e4e8" stop-opacity=".26"/><stop offset="1" stop-color="#6f79ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="m-glow"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="m-soft"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <ellipse cx="162" cy="198" rx="145" ry="180" fill="url(#m-aura)"/>
  <circle cx="159" cy="157" r="109" fill="none" stroke="#7fe7e4" stroke-opacity=".13"/>
  <circle cx="159" cy="157" r="77" fill="none" stroke="#7fe7e4" stroke-opacity=".09" stroke-dasharray="2 9"/>
  <path d="M121 167c-25 84-44 151-66 210 45 29 83 38 117 36 44-2 82-18 105-40-24-61-45-131-63-208Z" fill="url(#m-robe)"/>
  <path d="M127 175c-13 70-28 146-42 216 25-6 45-21 62-41l3-171Z" fill="#151838" opacity=".7"/>
  <path d="M195 177c9 67 19 140 30 214-24-8-44-23-60-43l-4-170Z" fill="#10122b" opacity=".72"/>
  <path d="M128 178c2-42 12-70 33-70 20 0 32 29 35 70l-12 76c-12 13-30 14-43 1Z" fill="#242656"/>
  <path d="M137 188c-6-22-6-51 4-65 7-10 17-16 28-12 16 6 23 29 22 64l-15 20-25 2Z" fill="#0c0b17"/>
  <path d="M119 163c-16 21-23 50-22 81l17 67 18-9 9-92-11-50Z" fill="#292b63"/>
  <path d="M198 162c17 20 25 50 25 82l-15 68-20-9-10-92 11-50Z" fill="#1d1e4b"/>
  <path d="M117 167c11-12 27-20 43-20 17 0 32 8 43 21l-8 24-17-10-18 4-17-4-18 10Z" fill="url(#m-trim)" opacity=".78"/>
  <path d="M134 128c15-38 35-55 51-50 22 7 33 38 26 77l-22 26-35-9Z" fill="#151632"/>
  <path d="M134 128c8-44 27-67 48-61 12 4 21 17 25 40-14-11-27-14-40-12-12 2-23 12-33 33Z" fill="#2b2e6c"/>
  <path d="M137 117c11-37 26-55 44-51 11 3 20 14 25 31-16-10-30-12-42-7-9 4-18 13-27 27Z" fill="#101126"/>
  <path d="M146 123c13-10 28-12 42-4l-6 26-29 9-17-14Z" fill="#07070e"/>
  <path d="M151 126c6-3 11-1 14 3l-4 4-11-2Z" fill="#9af6f1" filter="url(#m-glow)"/>
  <path d="M173 126c5-3 10-1 13 4l-5 4-10-3Z" fill="#9af6f1" filter="url(#m-glow)"/>
  <path d="M153 127c3-1 5 0 7 2h-7ZM175 127c3-1 5 0 6 2h-6Z" fill="#fff"/>
  <path d="M147 332c18 9 37 12 57 8M135 350c29 12 58 14 86 6" ${stroke} stroke="#80dfe2" opacity=".25"/>
  <path d="M242 107 253 62l-8-38" ${stroke} stroke="#5a4433" stroke-width="5"/>
  <path d="M245 112c6-51 5-79 1-91" ${stroke} stroke="#b28b62" stroke-width="2"/>
  <path d="M231 54c3-20 13-30 25-28 13 2 21 16 18 37Z" fill="#1c1829"/>
  <circle cx="249" cy="32" r="25" fill="url(#m-orb)" opacity=".9"/>
  <circle cx="249" cy="32" r="9" fill="#eaffff" filter="url(#m-soft)"/>
  <circle cx="249" cy="32" r="4" fill="#fff"/>
  <path d="M218 30c11-7 17-17 21-27M277 21c-11-6-18-14-22-22" ${stroke} stroke="#87e8e7" opacity=".45"/>
  <path d="M245 130c-9 11-13 26-12 42M246 145l-31 16 12 18 29-13M243 168l30-18 12 20-31 18" ${stroke} stroke="#303266" stroke-width="8" stroke-linecap="round"/>
  <path d="M134 218c-7 45-14 86-23 129l17 5 29-131ZM190 222c5 42 10 84 17 125l-17 4-25-129Z" fill="#1a1b42" opacity=".6"/>
  <path d="M124 348c7 6 17 6 24 0M179 348c7 6 17 6 24 0" ${stroke} stroke="#7ae7e4" opacity=".55"/>
  <g fill="#8ce8e5" opacity=".8">
    <path d="m92 160 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/>
    <path d="m218 94 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" opacity=".65"/>
    <path d="m96 253 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" opacity=".55"/>
  </g>
  <path d="M103 69c14-17 31-26 50-28M189 52c13 7 23 17 30 30" ${stroke} stroke="#71dce3" opacity=".22"/>
</svg>`;
}

function archerArt() {
  return `
<svg class="class-art" viewBox="0 0 320 420" role="img" aria-label="Archer">
  <defs>
    <linearGradient id="a-cloak" x1=".15" y1="0" x2=".85" y2="1">
      <stop stop-color="#38584f"/><stop offset=".4" stop-color="#1a3231"/><stop offset="1" stop-color="#0c1418"/>
    </linearGradient>
    <linearGradient id="a-leather" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#bd9160"/><stop offset=".45" stop-color="#725438"/><stop offset="1" stop-color="#33251e"/>
    </linearGradient>
    <linearGradient id="a-bow" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#e5c37b"/><stop offset=".5" stop-color="#846134"/><stop offset="1" stop-color="#35291f"/>
    </linearGradient>
    <radialGradient id="a-aura" cx=".48" cy=".4" r=".62">
      <stop stop-color="#a3dc8d" stop-opacity=".19"/><stop offset="1" stop-color="#a3dc8d" stop-opacity="0"/>
    </radialGradient>
    <filter id="a-glow"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <ellipse cx="158" cy="204" rx="143" ry="172" fill="url(#a-aura)"/>
  <path d="M104 171c-27 63-41 133-46 208 40 25 87 35 129 28 38-6 68-21 85-41-21-70-38-138-52-198Z" fill="url(#a-cloak)"/>
  <path d="M112 178c-8 71-18 143-31 203 20-2 36-9 49-20l14-171Z" fill="#0f1c20"/>
  <path d="M205 181c10 68 23 140 37 204-23-5-41-15-55-29l-12-168Z" fill="#0b1418"/>
  <path d="M127 175c-13 7-24 22-29 44l10 73 25-6 13-109Z" fill="#2d453e"/>
  <path d="M195 175c13 7 25 23 30 45l-9 74-27-7-12-109Z" fill="#243b37"/>
  <path d="M131 153c11-20 24-30 37-30 15 0 29 11 39 32l-5 78c-8 21-21 34-36 34-16 0-29-13-37-35Z" fill="#23352f"/>
  <path d="M122 150c-18 2-31 22-33 55l6 59 20 5 21-113Z" fill="#332d27"/>
  <path d="M195 150c20 1 34 21 37 55l-5 61-22 4-21-114Z" fill="#2a241f"/>
  <path d="M138 142c8-29 20-44 35-44 16 0 28 17 33 48l-8 34-28 11-25-11Z" fill="url(#a-leather)"/>
  <path d="M136 135c11-35 25-51 43-49 20 2 32 22 35 53-18-10-36-12-55-6-9 3-16 4-23 2Z" fill="#111d20"/>
  <path d="M136 125c13-32 28-44 45-40 13 3 23 14 29 33-15-8-30-10-45-6-11 3-20 8-29 13Z" fill="#263f3a"/>
  <path d="M145 112c7-14 18-20 30-17 11 3 19 12 23 26-17-8-32-10-53-9Z" fill="#0b1215"/>
  <path d="M143 121c13-8 28-9 41-2l-4 30-20 11-25-12Z" fill="#080d10"/>
  <path d="M150 124c6-3 11-2 14 3l-3 4-10-2Z" fill="#d5f2a4" filter="url(#a-glow)"/>
  <path d="M173 125c5-3 10-1 12 4l-4 3-9-3Z" fill="#d5f2a4" filter="url(#a-glow)"/>
  <path d="M152 125c3-1 5 0 7 2h-7ZM174 126c3-1 5 0 6 2h-6Z" fill="#fff"/>
  <path d="M149 143c7 4 13 4 20 0" ${stroke} opacity=".28"/>
  <path d="M132 193c16-8 34-8 50 0l-3 66c-9 12-27 17-40 5l-7-31Z" fill="#151e1e"/>
  <path d="M132 198c-10 24-8 46 4 63M194 198c9 23 7 45-4 62" ${stroke} stroke="#9e7650" opacity=".55"/>
  <path d="M139 206h34M137 218h38M139 230h34" ${stroke} stroke="#a87f54" opacity=".35"/>
  <path d="M178 235c25 28 38 59 39 94" ${stroke} stroke="#6c4b2f" stroke-width="14"/>
  <path d="M216 316c-44-30-49-79-19-125" ${stroke} stroke="url(#a-bow)" stroke-width="6"/>
  <path d="M216 316c-31-33-37-77-19-125" ${stroke} stroke="#d9ba74" stroke-width="1.4"/>
  <path d="M216 316 197 191M184 256l65-52" ${stroke} stroke="#e7d7a2" opacity=".72"/>
  <path d="M249 204 277 181M265 200l-8-11-7 12" ${stroke} stroke="#d9ba74"/>
  <path d="M249 204 284 178M270 183l-4 14" ${stroke} stroke="#f3e5be" opacity=".6"/>
  <path d="M117 243c-7 23-5 45 5 64M208 244c8 20 7 41-1 60" ${stroke} stroke="#8fc487" opacity=".22"/>
  <g fill="#cdec9c">
    <path d="m75 218 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" opacity=".75"/>
    <path d="m240 105 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" opacity=".6"/>
  </g>
  <path d="M103 348c48 19 107 23 154 4" ${stroke} stroke="#b3945d" opacity=".22"/>
</svg>`;
}

export function miniPortrait(classId) {
  const color = classId === 'mage' ? '#77d7db' : classId === 'archer' ? '#93d9a2' : '#e5a35d';
  const glyph = classId === 'mage'
    ? '<path d="M22 20 30 9 38 20 30 31Z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="30" cy="20" r="3" fill="currentColor"/>'
    : classId === 'archer'
      ? '<path d="M20 36c8-9 10-19 6-27M22 34c12-4 17-11 18-23" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M18 38 35 11" fill="none" stroke="currentColor" stroke-width="1.5"/>'
      : '<path d="M20 36V10l14 10-14 7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 32h12" stroke="currentColor" stroke-width="1.6"/>';
  return `<svg viewBox="0 0 60 60" aria-hidden="true" style="color:${color}"><circle cx="30" cy="30" r="27" fill="rgba(0,0,0,.28)" stroke="currentColor" stroke-opacity=".25"/><circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" stroke-opacity=".1"/>${glyph}</svg>`;
}

export function stageArt(chapterIndex, boss = false) {
  if (chapterIndex === 1) return `
  <svg class="stage-art-svg" viewBox="0 0 920 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="d-sea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0c2635"/><stop offset=".5" stop-color="#0b1b28"/><stop offset="1" stop-color="#050b12"/></linearGradient>
      <radialGradient id="d-light" cx=".52" cy=".18" r=".62"><stop stop-color="#6fd9de" stop-opacity=".38"/><stop offset="1" stop-color="#6fd9de" stop-opacity="0"/></radialGradient>
      <linearGradient id="d-arch" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#315c65"/><stop offset="1" stop-color="#12242e"/></linearGradient>
      <filter id="d-blur"><feGaussianBlur stdDeviation="8"/></filter>
    </defs>
    <rect width="920" height="420" fill="url(#d-sea)"/>
    <rect width="920" height="420" fill="url(#d-light)"/>
    <path d="M0 320c120-46 190-24 290-53s170-4 278-33 220-28 352 10v176H0Z" fill="#071019"/>
    <path d="M0 344c124-25 208-12 313-28s196-12 296-2 207 3 311-23v129H0Z" fill="#0a1821" opacity=".8"/>
    <g opacity=".8">
      <path d="M190 305V161c0-44 38-74 78-74s77 30 77 74v144" fill="none" stroke="url(#d-arch)" stroke-width="28"/>
      <path d="M202 300V161c0-36 29-61 66-61s65 26 65 61v139" fill="none" stroke="#183843" stroke-width="3"/>
      <path d="M552 302V180c0-35 29-58 63-58s62 24 62 58v122" fill="none" stroke="#152f39" stroke-width="18" opacity=".7"/>
    </g>
    <g stroke="#6cd3da" stroke-opacity=".2" filter="url(#d-blur)">
      <path d="M0 246c120-18 168 16 272-2s163-21 268 4 177 23 380-4" fill="none" stroke-width="2"/>
      <path d="M0 282c146 18 214-19 340-3s190 12 294-4 190-12 286 7" fill="none" stroke-width="1"/>
    </g>
    <g fill="#67cbd3" opacity=".55">
      <circle cx="112" cy="102" r="2"/><circle cx="824" cy="84" r="1.5"/><circle cx="731" cy="154" r="2"/><circle cx="405" cy="76" r="1.2"/><circle cx="283" cy="187" r="1.6"/>
    </g>
    <g fill="none" stroke="#a4edf0" stroke-opacity=".18" stroke-width="1">
      <path d="M620 90c30 16 54 14 83 0M646 73c14 9 25 10 41 3"/>
      <path d="M90 176c26-11 48-10 70 3M105 161c11-5 21-4 31 2"/>
    </g>
    <path d="M458 420c-8-62-4-108 17-146 19-35 43-51 77-58-31 23-46 49-51 82-5 30 3 66 18 122Z" fill="#0a141c"/>
    ${boss ? '<g opacity=".55"><path d="M635 195 660 154 685 195 664 188 650 213 642 188Z" fill="#8ff5ff"/><circle cx="660" cy="211" r="30" fill="none" stroke="#8ff5ff" stroke-width="1.2" stroke-dasharray="3 6"/></g>' : ''}
  </svg>`;
  if (chapterIndex === 2) return `
  <svg class="stage-art-svg" viewBox="0 0 920 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#241538"/><stop offset=".55" stop-color="#130e21"/><stop offset="1" stop-color="#08070d"/></linearGradient>
      <radialGradient id="h-light" cx=".5" cy=".33" r=".55"><stop stop-color="#b391f0" stop-opacity=".4"/><stop offset=".5" stop-color="#7452b7" stop-opacity=".08"/><stop offset="1" stop-color="#7452b7" stop-opacity="0"/></radialGradient>
      <linearGradient id="h-peak" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#44365d"/><stop offset="1" stop-color="#0d0a15"/></linearGradient>
      <filter id="h-blur"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <rect width="920" height="420" fill="url(#h-sky)"/>
    <rect width="920" height="420" fill="url(#h-light)"/>
    <circle cx="480" cy="141" r="92" fill="none" stroke="#c8afff" stroke-opacity=".16"/>
    <circle cx="480" cy="141" r="62" fill="none" stroke="#c8afff" stroke-opacity=".08" stroke-dasharray="2 8"/>
    <path d="M0 312 132 170 218 238 333 82 438 231 531 142 664 284 744 205 920 333v87H0Z" fill="url(#h-peak)"/>
    <path d="M0 352 134 239 240 310 354 185 455 304 579 217 721 334 842 278 920 323v97H0Z" fill="#0c0913"/>
    <g stroke="#c7a8ff" stroke-opacity=".28" filter="url(#h-blur)">
      <path d="M126 56 100 117l-29 13 35 9 17 42 8-34 30-2-23-19Z" fill="none" stroke-width="2"/>
      <path d="M786 70l-13 42-35 6 23 22-8 41 30-24 29 15-9-37 21-26-37 2Z" fill="none" stroke-width="1.4"/>
    </g>
    <path d="M520 420c-29-60-19-108 6-135 23-25 29-48 22-73 31 40 29 62 8 88-24 30-27 66-12 120Z" fill="#0c0912"/>
    <g transform="translate(458 211)" fill="#0e0a17" stroke="#8b6fc1" stroke-opacity=".45">
      <path d="M-84 0h168l-13 30H-71Z"/><path d="M-47-33h94l-9 18h-76Z"/><path d="M-76 31h152v10H-76Z"/>
      <path d="M-58-34 0-80 58-34 34-48 0-60-34-48Z" fill="#6f5698"/>
      <path d="M-24-78 0-105 24-78 12-85 0-76-12-85Z" fill="#8f72c4"/>
    </g>
    <g fill="#d7c4ff" opacity=".5"><circle cx="160" cy="114" r="1.6"/><circle cx="740" cy="105" r="2"/><circle cx="836" cy="201" r="1.2"/><circle cx="252" cy="180" r="1.2"/></g>
    <path d="M0 380c170-30 278 13 413-10s256-30 507 7" fill="none" stroke="#7c5eb0" stroke-opacity=".22"/>
  </svg>`;
  return `
  <svg class="stage-art-svg" viewBox="0 0 920 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="a-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#321a1a"/><stop offset=".45" stop-color="#1c1013"/><stop offset="1" stop-color="#0a090a"/></linearGradient>
      <radialGradient id="a-sun" cx=".5" cy=".5" r=".5"><stop stop-color="#ffc47b" stop-opacity=".52"/><stop offset=".38" stop-color="#e67a44" stop-opacity=".18"/><stop offset="1" stop-color="#e67a44" stop-opacity="0"/></radialGradient>
      <linearGradient id="a-mount" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4e2927"/><stop offset="1" stop-color="#130c10"/></linearGradient>
      <filter id="a-blur"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <rect width="920" height="420" fill="url(#a-sky)"/>
    <circle cx="668" cy="135" r="180" fill="url(#a-sun)"/>
    <circle cx="668" cy="135" r="62" fill="#1b1215" stroke="#f2a25e" stroke-opacity=".38"/>
    <circle cx="668" cy="135" r="83" fill="none" stroke="#f2a25e" stroke-opacity=".12" stroke-dasharray="1 9"/>
    <path d="M0 292 154 149 258 236 389 101 510 244 626 151 774 287 878 218 920 239v181H0Z" fill="url(#a-mount)"/>
    <path d="M0 337 135 266 246 322 369 230 481 316 606 249 746 331 849 280 920 301v119H0Z" fill="#100b0d"/>
    <g transform="translate(185 237)" fill="#0c080a" stroke="#b86b42" stroke-opacity=".35">
      <path d="M-60 50h120l-10 40H-50Z"/><path d="M-42 0h84v50h-84Z"/><path d="M-42 0 0-28 42 0Z"/>
      <path d="M-20 12h40v38h-40Z" fill="#171012"/><path d="M-8 50V68M8 50V68"/>
    </g>
    <path d="M490 420c-6-39 1-62 20-88 17-23 20-42 13-67 27 28 30 54 15 81-15 28-13 51 2 74Z" fill="#0b090a"/>
    <g stroke="#ed9857" stroke-opacity=".22" filter="url(#a-blur)">
      <path d="M90 113c28 11 47 4 68-13M746 218c19-9 38-8 57 2" fill="none"/>
    </g>
    <g fill="#ffb06a" opacity=".7">
      <circle cx="116" cy="139" r="1.6"/><circle cx="198" cy="102" r="1"/><circle cx="314" cy="173" r="1.4"/><circle cx="750" cy="95" r="1.2"/><circle cx="830" cy="185" r="1.6"/><circle cx="576" cy="221" r="1"/>
    </g>
    <path d="M0 392c170 18 280-20 433-1s280 10 487-23" fill="none" stroke="#d57445" stroke-opacity=".16"/>
    ${boss ? '<g fill="#ffb45f" opacity=".35"><path d="M690 283 714 247 738 283 718 277 706 298 699 277Z"/><circle cx="714" cy="300" r="28" fill="none" stroke="#ffb45f" stroke-width="1" stroke-dasharray="3 6"/></g>' : ''}
  </svg>`;
}

export function bossEmblem(bossId) {
  if (bossId === 'tidebound') return `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 8c-16 0-26 11-26 26 0 11 6 18 13 21v13h26V55c8-4 13-12 13-22C66 19 56 8 40 8Z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M29 36c4-4 7-4 11 0M44 36c3-3 6-3 8 0M32 52c6 4 12 4 18 0" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M40 8V2M23 19 18 14M57 19l5-5" stroke="currentColor" stroke-width="1.2"/></svg>`;
  if (bossId === 'hollowking') return `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 6 52 19 67 17 62 32 73 42 58 48 57 66 43 60 40 74 37 60 23 66 22 48 7 42 18 32 13 17 28 19Z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M28 37h7M45 37h7M33 50c5 3 9 3 14 0" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M40 19v10" stroke="currentColor" stroke-width="1.2"/></svg>`;
  return `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 5 48 19 63 16 60 31 73 40 60 49 63 64 48 61 40 75 32 61 17 64 20 49 7 40 20 31 17 16 32 19Z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M30 32h6M44 32h6M30 49c7 5 13 5 20 0" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M40 17v13" stroke="currentColor" stroke-width="1.4"/></svg>`;
}

export function crestMark() {
  return `<svg class="crest-mark" viewBox="0 0 52 52" aria-hidden="true">
    <path d="M26 2 33 19 50 26 33 33 26 50 19 33 2 26 19 19Z" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M26 10 30 22 42 26 30 30 26 42 22 30 10 26 22 22Z" fill="currentColor" opacity=".18"/>
    <circle cx="26" cy="26" r="5" fill="none" stroke="currentColor" stroke-width="1"/>
    <circle cx="26" cy="26" r="1.8" fill="currentColor"/>
    <path d="M26 2v5M26 45v5M2 26h5M45 26h5" stroke="currentColor" stroke-width="1"/>
  </svg>`;
}

export function enemyGlyph(type) {
  if (type === 'wisp' || type === 'mote') return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="16" cy="16" r="2" fill="currentColor"/><path d="M16 3v5M16 24v5M3 16h5M24 16h5M7 7l4 4M21 21l4 4M25 7l-4 4M11 21l-4 4" stroke="currentColor" stroke-width="1"/></svg>`;
  if (type === 'brute') return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 27V13c0-6 4-9 8-9s8 3 8 9v14M5 27h22M10 13h12M12 19h2M18 19h2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M3 8 7 12M29 8l-4 4" stroke="currentColor" stroke-width="1.3"/></svg>`;
  if (type === 'sentinel') return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 27 6v8c0 8-5 12-11 15C10 26 5 22 5 14V6Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11 13h10M16 9v9" stroke="currentColor" stroke-width="1.2"/></svg>`;
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 27V14c0-6 2-10 6-10s6 4 6 10v13M7 27h18M12 12l-3-5M20 12l3-5M13 17h1M18 17h1" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
}
