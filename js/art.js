/* ============================================================
   EMBERFALL — vector art. No external assets.
   ============================================================ */

const ICONS = {
  weapon: `<path d="M14.2 3.3 20.7 3l-.3 6.5-8.2 8.2-2.7-2.7 8.2-8.2-3.5-.3-8.2 8.2-2.7-2.7 8.2-8.2Z"/><path d="m5.2 16.7 2.1 2.1-2.6 2.6a1.5 1.5 0 0 1-2.1-2.1l2.6-2.6Z"/>`,
  helmet: `<path d="M4.2 13.3V9.7A7.8 7.8 0 0 1 12 2a7.8 7.8 0 0 1 7.8 7.7v3.6"/><path d="M4.2 13h15.6v3.2c0 1.6-1.2 2.8-2.8 2.8H7c-1.6 0-2.8-1.2-2.8-2.8V13Z"/><path d="M9 8.5h1.4M13.6 8.5H15M9.5 13v2.2h5V13"/>`,
  chest: `<path d="M7 3.5 12 2l5 1.5 3.4 4-2 3.2-1.7-1.1V22H7.3V9.6L5.6 10.7l-2-3.2 3.4-4Z"/><path d="M9.5 9.5h5M12 2v20"/>`,
  gloves: `<path d="M6.5 20.5V11l-1-4.7a1.3 1.3 0 0 1 2.5-.6L9.5 10V5.2a1.2 1.2 0 0 1 2.4 0V10 4.5a1.2 1.2 0 0 1 2.4 0V10 5.7a1.2 1.2 0 0 1 2.4 0v5.8l1.1-2.3a1.1 1.1 0 0 1 2 1l-2 5.4v4.9H6.5Z"/>`,
  boots: `<path d="M7.2 2.5h5.9v8.2l5.8 5.2c1.5 1.3.6 3.1-1.2 3.1H4v-4.3l3.2-2.7V2.5Z"/><path d="M7 8.7h6.1M5 16.4h7"/>`,
  ring: `<circle cx="12" cy="14.2" r="5.9"/><path d="m8 8.5 2.1-4.8h3.8L16 8.5M9.2 4.5h5.6"/><path d="m12 4.7 1.4 2.3-1.4 1.4L10.6 7 12 4.7Z"/>`,
  necklace: `<path d="M4 3.5c.6 6.3 3.5 10 8 10s7.4-3.7 8-10"/><path d="m12 12.2 3.2 3.4L12 22l-3.2-6.4 3.2-3.4Z"/><path d="M10.5 17h3"/>`,
  sword: `<path d="M14.2 3.3 20.7 3l-.3 6.5-8.2 8.2-2.7-2.7 8.2-8.2-3.5-.3-8.2 8.2-2.7-2.7 8.2-8.2Z"/><path d="m5.2 16.7 2.1 2.1-2.6 2.6a1.5 1.5 0 0 1-2.1-2.1l2.6-2.6Z"/>`,
  heart: `<path d="M12 21s-8-4.8-8-10.5A4.8 4.8 0 0 1 12 6.3 4.8 4.8 0 0 1 20 10.5C20 16.2 12 21 12 21Z"/>`,
  shield: `<path d="M12 2.4 20 5.5v5.6c0 5.2-3.4 8.8-8 10.5-4.6-1.7-8-5.3-8-10.5V5.5l8-3.1Z"/><path d="M12 6v10M8.6 9.2h6.8"/>`,
  crit: `<path d="m12 2 2.2 6.1L20 6l-3.4 5.3L22 14l-6.4.9L16 21l-4-5-4 5 .4-6.1L2 14l5.4-2.7L4 6l5.8 2.1L12 2Z"/>`,
  haste: `<path d="M5 5.5 11 12l-6 6.5M12 5.5l7 6.5-7 6.5"/>`,
  scroll: `<path d="M6 3.5h12v14.8c0 1.5-1.2 2.7-2.7 2.7H8.7A2.7 2.7 0 0 1 6 18.3V3.5Z"/><path d="M6 5.5H4.7A1.7 1.7 0 0 0 3 7.2c0 .9.8 1.7 1.7 1.7H6M9.5 8h5.5M9.5 11.5h5.5M9.5 15h3.5"/>`,
  coin: `<circle cx="12" cy="12" r="9"/><path d="M14.8 8.3c-.6-.7-1.6-1.1-2.8-1.1-1.8 0-3 .8-3 2.1 0 3.3 6 1.7 6 5 0 1.3-1.2 2.2-3.1 2.2-1.3 0-2.5-.5-3.2-1.3M12 5.2v13.6"/>`,
  clover: `<path d="M12 12c-4.6-1.3-5.7-5.4-3.2-7 1.9-1.2 3.2 1.1 3.2 3 0-1.9 1.3-4.2 3.2-3 2.5 1.6 1.4 5.7-3.2 7Zm0 0c4.6 1.3 5.7 5.4 3.2 7-1.9 1.2-3.2-1.1-3.2-3 0 1.9-1.3 4.2-3.2 3-2.5-1.6-1.4-5.7 3.2-7Z"/><path d="M12 12c-1.5 3.6-2.2 6-2.2 9.5"/>`,
  skull: `<path d="M5 10a7 7 0 0 1 14 0v3.2l-1.7 1.7v3c0 1.2-1 2.1-2.1 2.1H8.8c-1.2 0-2.1-1-2.1-2.1v-3L5 13.2V10Z"/><circle cx="9" cy="10.2" r="1.4"/><circle cx="15" cy="10.2" r="1.4"/><path d="m12 13.2-1.2 2.2h2.4L12 13.2ZM10 20v-1.8M14 20v-1.8"/>`,
  drop: `<path d="M12 2.5s6.2 6.7 6.2 11.1a6.2 6.2 0 0 1-12.4 0C5.8 9.2 12 2.5 12 2.5Z"/><path d="M9.2 14.2a3.2 3.2 0 0 0 2.5 3.1"/>`,
  execute: `<path d="M6 3.5h12l-5 7.2L19 21H5l6-10.3L6 3.5Z"/><path d="M8.5 17.5h7"/>`,
  level: `<path d="m12 2.5 3 6.1 6.7 1-4.8 4.7 1.1 6.7-6-3.1-6 3.1 1.1-6.7-4.8-4.7 6.7-1 3-6.1Z"/>`,
  satchel: `<path d="M5 8.5h14l1.5 12H3.5l1.5-12Z"/><path d="M8 8.5V6a4 4 0 0 1 8 0v2.5M8 13.5h8"/>`,
  anvil: `<path d="M4 6h10.5c2.5 0 4 1.5 5.5 1.5v2.8H13v1.8c0 1 .8 1.8 1.8 1.8H17v2H7v-2h2.2c1 0 1.8-.8 1.8-1.8v-1.8H8L4 8.5V6Z"/><path d="M6 18.5h12M8 21h8"/>`,
  flame: `<path d="M12 2.5c1.3 4.4-2.4 5.7-1.2 8.4.8-1.4 2-2.1 2-2.1.4 2.5 3.7 3.9 3.7 7.4A5.5 5.5 0 0 1 11 21.5a5.5 5.5 0 0 1-5.5-5.3c0-4.7 5-6.9 6.5-13.7Z"/>`,
  lock: `<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5"/>`,
  sound: `<path d="M4 9h4l5-4v14l-5-4H4V9Z"/><path d="M16 8.5a5.5 5.5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12"/>`,
  mute: `<path d="M4 9h4l5-4v14l-5-4H4V9Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>`,
  help: `<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 3.7 2c-1 .7-1.4 1.3-1.4 2.5M12 17h.01"/>`,
  close: `<path d="m6 6 12 12M18 6 6 18"/>`,
  map: `<path d="m3 6 6-2.5L15 6l6-2.5v14.5L15 21l-6-2.5L3 21V6Z"/><path d="M9 3.5V18.5M15 6v14.5"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
  star: `<path d="m12 3 2.7 5.4 6 .9-4.4 4.2 1 6-5.3-2.9-5.3 2.9 1-6L3.3 9.3l6-.9L12 3Z"/>`,
  chevron: `<path d="m8 10 4 4 4-4"/>`,
  trash: `<path d="M4 6.5h16M9 6.5V4h6v2.5M6.5 6.5 7.4 21h9.2l.9-14.5M10 10.5v6M14 10.5v6"/>`,
  filter: `<path d="M3.5 5h17L14 12.8V20l-4 1.5v-8.7L3.5 5Z"/>`,
  trophy: `<path d="M8 4h8v5.5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4.5v2A3.5 3.5 0 0 0 8 11.5M16 6h3.5v2a3.5 3.5 0 0 1-3.5 3.5M12 13.5V18M8.5 21h7M10 18h4"/>`,
  plus: `<path d="M12 4v16M4 12h16"/>`,
  check: `<path d="m4.5 12.5 4.8 4.8L19.5 6.8"/>`,
};

export function gearIcon(name, className = "") {
  const body = ICONS[name] || ICONS.star;
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export function portraitSvg() {
  return `<svg viewBox="0 0 220 230" class="portrait-svg" aria-hidden="true">
    <defs>
      <radialGradient id="portraitGlow" cx="50%" cy="38%" r="60%">
        <stop offset="0%" stop-color="#d49a58" stop-opacity=".3"/>
        <stop offset="100%" stop-color="#d49a58" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="hoodGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#30313a"/>
        <stop offset="55%" stop-color="#181920"/>
        <stop offset="100%" stop-color="#090a0e"/>
      </linearGradient>
      <linearGradient id="armorGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8d7755"/>
        <stop offset="35%" stop-color="#4b3d2a"/>
        <stop offset="100%" stop-color="#18140f"/>
      </linearGradient>
      <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#e6e3d6"/>
        <stop offset="55%" stop-color="#9a9b9b"/>
        <stop offset="100%" stop-color="#474a50"/>
      </linearGradient>
      <filter id="portraitSoft"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <ellipse cx="110" cy="107" rx="104" ry="105" fill="url(#portraitGlow)"/>
    <path d="M32 219c8-37 37-59 78-59s70 22 78 59" fill="#0c0c11"/>
    <path d="M45 220c8-30 31-48 65-48s57 18 65 48" fill="#19171b" stroke="#4e4030" stroke-width="1.5"/>
    <path d="M71 191c4-19 18-32 39-32s35 13 39 32l-19 29H90l-19-29Z" fill="url(#armorGrad)" stroke="#7b6341" stroke-width="1.4"/>
    <path d="m78 180 32 26 32-26-9-14-23 10-23-10-9 14Z" fill="#231e18" stroke="#6d573a" stroke-width="1"/>
    <path d="M66 118c0-38 17-65 44-65s44 27 44 65c0 20-7 37-19 49-8 8-16 12-25 12s-17-4-25-12c-12-12-19-29-19-49Z" fill="url(#hoodGrad)" stroke="#4c4539" stroke-width="1.8"/>
    <path d="M79 117c0-28 12-47 31-47s31 19 31 47c0 15-5 29-14 38-5 5-11 8-17 8s-12-3-17-8c-9-9-14-23-14-38Z" fill="#08090c"/>
    <path d="M93 123c5-4 11-4 16 0" fill="none" stroke="#d1a662" stroke-width="2" stroke-linecap="round"/>
    <path d="M121 123c5-4 11-4 16 0" fill="none" stroke="#d1a662" stroke-width="2" stroke-linecap="round"/>
    <circle cx="101" cy="128" r="2.4" fill="#ffd58a"/>
    <circle cx="129" cy="128" r="2.4" fill="#ffd58a"/>
    <circle cx="101" cy="128" r="7" fill="#ffc76b" opacity=".18" filter="url(#portraitSoft)"/>
    <circle cx="129" cy="128" r="7" fill="#ffc76b" opacity=".18" filter="url(#portraitSoft)"/>
    <path d="M96 151c8 3 20 3 28 0" fill="none" stroke="#5f4a35" stroke-width="1.4"/>
    <path d="M70 130c-7 9-10 21-7 34l-12 33 21 14 15-22-7-31-10-28Z" fill="#22232a" stroke="#4a4031" stroke-width="1.4"/>
    <path d="M150 130c7 9 10 21 7 34l12 33-21 14-15-22 7-31 10-28Z" fill="#22232a" stroke="#4a4031" stroke-width="1.4"/>
    <path d="m69 182-10 19 13 2 13-17-16-4ZM151 182l10 19-13 2-13-17 16-4Z" fill="#473a29" stroke="#8b7049" stroke-width="1"/>
    <path d="M172 199 137 93l8-4 35 106-8 4Z" fill="url(#bladeGrad)" stroke="#ddd7c5" stroke-width="1.2"/>
    <path d="m142 104 10-24 6 3-9 24-7-3Z" fill="#5d4930"/>
    <path d="m139 105 28 9-3 9-28-9 3-9Z" fill="#95754b" stroke="#d0ac70" stroke-width="1"/>
    <path d="M165 199c-15 0-27 8-34 20h58c-5-12-13-20-24-20Z" fill="#0a0a0d"/>
  </svg>`;
}

/* ---------------------------- monster art ---------------------------- */

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function shade(hex, amount) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  const r = clampByte(((num >> 16) & 255) + amount);
  const g = clampByte(((num >> 8) & 255) + amount);
  const b = clampByte((num & 255) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function auraSvg(p, isBoss) {
  if (!isBoss) return "";
  return `
    <g class="boss-rings" opacity=".8">
      <ellipse cx="170" cy="262" rx="113" ry="25" fill="none" stroke="${p.accent}" stroke-width="1.4" stroke-dasharray="4 9" opacity=".55"/>
      <ellipse cx="170" cy="256" rx="84" ry="18" fill="none" stroke="${p.accent}" stroke-width="1" stroke-dasharray="2 7" opacity=".4"/>
    </g>
    <g class="boss-flames" fill="${p.accent}" opacity=".72">
      <path d="M58 276c-5-15 6-20 5-34 9 8 8 16 11 22 3-10 10-13 10-24 9 12 3 23 9 36H58Z"/>
      <path d="M242 277c-5-15 6-20 5-34 9 8 8 16 11 22 3-10 10-13 10-24 9 12 3 23 9 36h-35Z"/>
      <circle cx="79" cy="202" r="2.3"/><circle cx="268" cy="188" r="1.8"/>
      <circle cx="247" cy="128" r="2.1"/><circle cx="66" cy="148" r="1.5"/>
    </g>`;
}

const ARCHETYPES = {
  slime: (p, boss) => `
    <path d="M60 248c-18-25-14-65 13-92 21-22 36-40 77-43 38-3 69 18 94 48 22 27 24 61 10 83-18 27-71 34-116 34-38 0-64-8-78-30Z"
      fill="url(#{{P}}-body)" stroke="${shade(p.accent, -55)}" stroke-width="2"/>
    <path d="M79 223c-4-31 10-56 33-73 18-14 36-22 63-20 24 2 45 13 61 30-22-10-47-13-73-6-31 8-53 29-65 57-5 12-7 25-4 39-8-7-13-16-15-27Z"
      fill="${shade(p.accent, -60)}" opacity=".7"/>
    <path d="M102 160c9-13 25-21 44-22 19-1 38 5 50 15-16-4-31-3-46 2-18 6-33 16-48 5Z" fill="${p.accent}" opacity=".18"/>
    <g class="slime-bubbles" fill="${shade(p.accent, -20)}" opacity=".55">
      <circle cx="102" cy="143" r="11"/><circle cx="125" cy="127" r="6"/><circle cx="238" cy="147" r="8"/>
      <circle cx="218" cy="116" r="5"/><circle cx="82" cy="176" r="4"/>
    </g>
    <g class="m-eye">
      <path d="M116 200c9-12 27-13 37-1-9 10-28 11-37 1Z" fill="${p.accent}" opacity=".95"/>
      <path d="M194 198c9-12 27-13 37-1-9 10-28 11-37 1Z" fill="${p.accent}" opacity=".95"/>
      <ellipse cx="136" cy="199" rx="3.2" ry="7" fill="#09090d"/>
      <ellipse cx="212" cy="198" rx="3.2" ry="7" fill="#09090d"/>
    </g>
    <path d="M143 231c17 8 37 9 57 2" fill="none" stroke="${shade(p.accent, -35)}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M170 145c7-11 19-11 26 0l-13 17-13-17Z" fill="${p.accent}" opacity=".65"/>
    <path d="M170 158v50M165 185h10" stroke="${p.accent}" stroke-width="1" opacity=".35"/>
    <path d="M85 275c-10 6-21 8-31 5M255 276c10 4 20 4 28 0" stroke="${shade(p.accent, -30)}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
    ${boss ? `<path d="M123 128 111 94l28 15 31-17 31 17 28-15-12 34c-28-14-65-14-94 0Z" fill="${shade(p.accent, -48)}" stroke="${p.accent}" stroke-width="1.4"/>` : ""}
  `,

  hound: (p, boss) => `
    <g class="m-wing-left" opacity=".5">
      <path d="M112 173c-31-12-49-7-65 5 14 1 20 9 31 7-10 7-13 15-20 22 17-1 25-8 37-12-7 10-8 19-13 27 18-7 23-20 38-29Z" fill="${shade(p.accent, -45)}" opacity=".6"/>
    </g>
    <path d="M64 196c12-22 41-33 76-35 27-2 46 10 60 24l21-23-3 38c-8 9-17 14-26 16l-8 38h-19l5-34-17 3-4 40h-20l-3-40-25 2-6 38H76l4-45-16-22Z"
      fill="url(#{{P}}-body)" stroke="${shade(p.accent, -55)}" stroke-width="2"/>
    <path d="M122 184c22-7 46-7 67 1-23-2-44 3-63 10-2-4-3-8-4-11Z" fill="${p.accent}" opacity=".12"/>
    <path d="M214 163c8-9 23-12 36-4 7 5 12 12 14 20l-18 7-6 20-15-3c-4-15-8-27-11-40Z" fill="${shade(p.accent, -58)}" stroke="${shade(p.accent, -35)}" stroke-width="1.8"/>
    <path d="m241 161 10-18 5 20-15-2ZM224 158l-4-20 14 15-10 5Z" fill="${shade(p.accent, -45)}" stroke="${p.accent}" stroke-width="1"/>
    <path d="M246 177c5 0 8 3 8 7-5 2-10 0-13-3l5-4Z" fill="${p.accent}" opacity=".75"/>
    <circle class="m-eye" cx="234" cy="170" r="3.1" fill="${p.accent}"/>
    <circle cx="234" cy="170" r="7" fill="${p.accent}" opacity=".16"/>
    <path d="M255 187c9 7 21 9 33 4M61 192c-9 7-13 18-11 31" fill="none" stroke="${shade(p.accent, -35)}" stroke-width="2" stroke-linecap="round"/>
    <g fill="${shade(p.accent, -30)}" opacity=".8">
      <path d="m105 168 7-19 5 20-12-1ZM126 160l7-21 6 22-13-1ZM149 156l7-20 5 21-12-1Z"/>
    </g>
    <path d="M92 226h31M78 246h28M180 225h25M196 248h23" stroke="${shade(p.accent, -40)}" stroke-width="1.3" opacity=".7"/>
    ${boss ? `<path d="M221 150c-7-17-1-28 12-35-4 11-1 16 4 19l10-17c3 14 12 18 14 31l-17 9-23-7Z" fill="${shade(p.accent, -50)}" stroke="${p.accent}" stroke-width="1.1"/>` : ""}
  `,

  goblin: (p, boss) => `
    <path d="M113 212c-7-21 3-43 23-56l24-15-4-34 21 18 20-18-4 35 23 17c14 12 19 30 13 48l-12 35H127l-14-30Z"
      fill="url(#{{P}}-body)" stroke="${shade(p.accent, -50)}" stroke-width="2"/>
    <path d="M136 155c-23-8-38-22-44-44 16 4 24 1 30-8 5 10 13 16 24 18l-10 34ZM204 155c23-8 38-22 44-44-16 4-24 1-30-8-5 10-13 16-24 18l10 34Z"
      fill="${shade(p.accent, -55)}" stroke="${shade(p.accent, -35)}" stroke-width="1.7"/>
    <path d="M140 132c0-17 12-29 30-29s30 12 30 29c0 18-12 31-30 31s-30-13-30-31Z" fill="${shade(p.accent, -62)}" stroke="${shade(p.accent, -40)}" stroke-width="1.6"/>
    <path d="M145 119c8-11 22-15 34-12 8 2 14 6 17 12-9-3-18-4-28-2-8 2-16 5-23 10v-8Z" fill="${p.accent}" opacity=".25"/>
    <g class="m-eye">
      <ellipse cx="158" cy="132" rx="6.5" ry="4.4" fill="${p.accent}"/><ellipse cx="182" cy="132" rx="6.5" ry="4.4" fill="${p.accent}"/>
      <circle cx="159" cy="132" r="2.2" fill="#08090c"/><circle cx="181" cy="132" r="2.2" fill="#08090c"/>
    </g>
    <path d="M158 148c5 4 13 4 17 0M162 147l-2 7 5-2 5 2-2-7" fill="none" stroke="${shade(p.accent, -20)}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M133 184c-21 6-35 20-42 40l17 8 30-26-5-22ZM211 184c21 6 35 20 42 40l-17 8-30-26 5-22Z" fill="${shade(p.accent, -58)}" stroke="${shade(p.accent, -32)}" stroke-width="1.6"/>
    <path d="m95 222 17 8-5 19-15-6 3-21Z" fill="${shade(p.accent, -45)}"/>
    <path d="m240 228 46-58 6 5-38 66-20-3 6-10Z" fill="${shade(p.accent, 20)}" stroke="${shade(p.accent, 55)}" stroke-width="1"/>
    <path d="m160 217 4 46 10 2 8-40" fill="${shade(p.accent, -65)}" stroke="${shade(p.accent, -38)}" stroke-width="1.2"/>
    <path d="M140 197c11 7 25 10 40 8" fill="none" stroke="${p.accent}" stroke-width="1.1" opacity=".35"/>
    ${boss ? `<path d="M127 104 119 74l25 15 30-18 27 20 24-17-5 31-24 12-21-7-24 7-24-13Z" fill="${shade(p.accent, -52)}" stroke="${p.accent}" stroke-width="1.3"/>` : ""}
  `,

  skeleton: (p, boss) => `
    <path d="M108 286c-11-46-5-79 10-105l-20-38 31 11 31-31 8 28 34 5 11 36 25 6-15 30 14 58H108Z"
      fill="${shade(p.accent, -73)}" stroke="${shade(p.accent, -45)}" stroke-width="2"/>
    <path d="M148 78c0-18 13-31 31-31s31 13 31 31c0 13-7 24-18 29l-3 23-20 13-20-13-3-23c-11-5-18-16-18-29Z"
      fill="${shade(p.accent, -42)}" stroke="${shade(p.accent, -8)}" stroke-width="1.7"/>
    <path d="M150 73c8-10 18-15 29-15s21 5 29 15c-8-3-17-4-29-4s-21 1-29 4Z" fill="${shade(p.accent, -12)}" opacity=".45"/>
    <g class="m-eye">
      <ellipse cx="163" cy="84" rx="7" ry="8" fill="#090a0d"/>
      <ellipse cx="195" cy="84" rx="7" ry="8" fill="#090a0d"/>
      <circle cx="164" cy="85" r="3" fill="${p.accent}"/><circle cx="194" cy="85" r="3" fill="${p.accent}"/>
    </g>
    <path d="m174 97-5 9h10l-5-9ZM157 117v-6h44v6M157 123h44M157 129h44" fill="none" stroke="${shade(p.accent, -25)}" stroke-width="2"/>
    <path d="M154 128v67M189 128v67M161 132h21M161 143h21M161 154h21M161 165h21M161 176h17" stroke="${shade(p.accent, -50)}" stroke-width="2.2"/>
    <path d="M111 183 91 170l-21 9 13 15 21-2 13 20-4 38 18 2 6-41-17-28Z" fill="${shade(p.accent, -62)}" stroke="${shade(p.accent, -36)}" stroke-width="1.4"/>
    <path d="m216 184 17-21 22 4 8 18-19 11-22 10 5 35-17 3-8-37 14-23Z" fill="${shade(p.accent, -62)}" stroke="${shade(p.accent, -36)}" stroke-width="1.4"/>
    <path d="m235 194 11-13 5 7-10 14-6-8Z" fill="${shade(p.accent, 20)}"/>
    <path d="M111 206c-21 10-36 27-43 50M218 203c19 13 29 32 33 56" fill="none" stroke="${shade(p.accent, -65)}" stroke-width="18" stroke-linecap="round"/>
    <path d="M111 206c-21 10-36 27-43 50M218 203c19 13 29 32 33 56" fill="none" stroke="${shade(p.accent, -30)}" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>
    <path d="m69 255 20 15M250 258l14 20" stroke="${shade(p.accent, -25)}" stroke-width="1.2"/>
    ${boss ? `<path d="M148 51 138 18l24 15 18-22 17 22 26-15-9 34-20-8-14 9-16-8-16 7Z" fill="${shade(p.accent, -50)}" stroke="${p.accent}" stroke-width="1.3"/>
      <path d="m137 18 3 17 11-2-3-15M196 18l-4 18-11-2 4-16" fill="${p.accent}" opacity=".25"/>` : ""}
  `,

  wraith: (p, boss) => `
    <path d="M89 278c-14-62 5-111 28-138 17-20 34-34 56-34s40 14 55 35c19 28 35 77 20 137-19-14-34-10-48 1-13-11-27-15-42-2-18-17-37-16-55 3-5-2-10-3-14-2Z"
      fill="url(#{{P}}-body)" stroke="${shade(p.accent, -50)}" stroke-width="2"/>
    <path d="M99 252c-7-48 5-84 20-105 13-18 27-30 47-35-12 12-20 27-20 48 0 25 12 38 5 63-10 35-34 47-52 29Z" fill="${shade(p.accent, -63)}" opacity=".65"/>
    <path d="M127 130c0-31 17-54 44-54s44 23 44 54c0 28-18 50-44 50s-44-22-44-50Z" fill="#07080b"/>
    <path d="M118 117c7-31 25-50 52-53 24-2 43 12 53 37-18-14-36-18-56-13-17 4-32 14-49 29Z" fill="${shade(p.accent, -55)}" stroke="${shade(p.accent, -35)}" stroke-width="1.4"/>
    <g class="m-eye">
      <path d="M145 125c6-7 15-7 20 1-6 7-15 7-20-1Z" fill="${p.accent}"/>
      <path d="M180 126c6-7 15-7 20 1-6 7-15 7-20-1Z" fill="${p.accent}"/>
      <circle cx="155" cy="126" r="8" fill="${p.accent}" opacity=".14"/>
      <circle cx="190" cy="127" r="8" fill="${p.accent}" opacity=".14"/>
    </g>
    <path d="M147 167c13 5 30 5 44 0" fill="none" stroke="${shade(p.accent, -28)}" stroke-width="1.6"/>
    <path d="M106 188c-24 12-36 34-31 60 2 10 11 18 19 10 8-9 3-26 16-38l15-17-19-15Z" fill="${shade(p.accent, -65)}" stroke="${shade(p.accent, -30)}" stroke-width="1.4"/>
    <path d="M232 189c24 13 35 35 29 61-3 10-11 17-19 9-8-9-2-26-15-39l-15-17 20-14Z" fill="${shade(p.accent, -65)}" stroke="${shade(p.accent, -30)}" stroke-width="1.4"/>
    <g fill="${p.accent}" opacity=".75">
      <path d="m72 240 4 14 7-4-11-10ZM250 238l-4 15-7-5 11-10Z"/>
    </g>
    <g class="wraith-wisps" fill="none" stroke="${p.accent}" stroke-width="1.2" opacity=".5">
      <path d="M73 163c-12 9-13 22-4 31 8 8 2 17-8 18"/>
      <path d="M267 170c12 7 14 20 6 30-7 9-2 18 8 18"/>
      <circle cx="88" cy="128" r="2" fill="${p.accent}"/>
      <circle cx="246" cy="107" r="1.5" fill="${p.accent}"/>
    </g>
    ${boss ? `<path d="M139 81c-12-17-8-34 1-45 0 11 6 15 10 17l5-25 12 22 12-22 5 25c5-3 11-7 11-17 9 12 12 28 0 45h-56Z" fill="${shade(p.accent, -45)}" stroke="${p.accent}" stroke-width="1.2"/>` : ""}
  `,

  golem: (p, boss) => `
    <path d="M117 283c-9-30-16-60-8-89l-24-41 22-10 23 18 22-9 22 9 24-18 21 10-24 41c9 31 2 60-8 89h-70Z"
      fill="url(#{{P}}-body)" stroke="${shade(p.accent, -52)}" stroke-width="2"/>
    <path d="M91 175c-18 2-32 10-39 24l-11 55 23 9 24-38 13-39-10-11ZM249 174c18 1 31 10 38 24l9 56-24 8-23-38-13-39 13-11Z"
      fill="${shade(p.accent, -62)}" stroke="${shade(p.accent, -38)}" stroke-width="1.8"/>
    <path d="m43 252 22 9 16-28-24-5-14 24ZM276 252l-23 8-15-28 23-5 15 25Z" fill="${shade(p.accent, -45)}" stroke="${shade(p.accent, -28)}" stroke-width="1"/>
    <path d="M121 104c1-18 17-31 49-31s48 13 50 31l-11 26h-76l-12-26Z" fill="${shade(p.accent, -58)}" stroke="${shade(p.accent, -30)}" stroke-width="1.8"/>
    <path d="M132 81c9-8 20-12 38-12 17 0 29 4 38 12-10-2-22-3-38-3s-28 1-38 3Z" fill="${shade(p.accent, -20)}" opacity=".35"/>
    <g class="m-eye">
      <rect x="146" y="96" width="17" height="5" rx="2.5" fill="${p.accent}"/>
      <rect x="180" y="96" width="17" height="5" rx="2.5" fill="${p.accent}"/>
    </g>
    <path d="M124 154h93v77h-93v-77Z" fill="${shade(p.accent, -68)}" stroke="${shade(p.accent, -36)}" stroke-width="1.8"/>
    <path d="M137 166c14 12 28 6 39 14 11-8 24-3 31-11M128 199l17 8-3 14M210 191l-15 13 16 12M150 218l-7 13M184 220l8 10" fill="none" stroke="${p.accent}" stroke-width="1.8" opacity=".75"/>
    <g class="m-core">
      <path d="m171 169 16 14-16 26-17-26 17-14Z" fill="${p.accent}" opacity=".85"/>
      <path d="m171 179 8 7-8 12-8-12 8-7Z" fill="#fff8df"/>
      <circle cx="171" cy="191" r="28" fill="${p.accent}" opacity=".08"/>
    </g>
    <path d="m113 242 30 6M208 247l28-5M135 272h71" stroke="${shade(p.accent, -25)}" stroke-width="1.2" opacity=".6"/>
    ${boss ? `<g fill="${p.accent}" opacity=".7"><path d="m124 73-9-28 24 15 14-20 14 20 24-15-10 28-28-5-29 5Z"/><circle cx="112" cy="60" r="2"/><circle cx="228" cy="58" r="2"/></g>` : ""}
  `,

  demon: (p, boss) => `
    <g class="m-wing-left" opacity=".75">
      <path d="M128 152C88 108 43 95 22 106c27 9 31 24 47 29-21 5-31 17-47 25 23 4 36-2 51 4-15 8-20 19-29 33 26-5 37-20 56-25 9 13 20 21 36 26l-8-46Z"
        fill="${shade(p.accent, -69)}" stroke="${shade(p.accent, -30)}" stroke-width="1.3"/>
      <path d="M38 117c19 10 37 22 51 38M39 158c17-1 33-3 48-6M52 188c14-10 28-17 43-22" fill="none" stroke="${p.accent}" stroke-width=".8" opacity=".55"/>
    </g>
    <g class="m-wing-right" opacity=".75">
      <path d="M212 152c40-44 85-57 106-46-27 9-31 24-47 29 21 5 31 17 47 25-23 4-36-2-51 4 15 8 20 19 29 33-26-5-37-20-56-25-9 13-20 21-36 26l8-46Z"
        fill="${shade(p.accent, -69)}" stroke="${shade(p.accent, -30)}" stroke-width="1.3"/>
      <path d="M302 117c-19 10-37 22-51 38M301 158c-17-1-33-3-48-6M288 188c-14-10-28-17-43-22" fill="none" stroke="${p.accent}" stroke-width=".8" opacity=".55"/>
    </g>
    <path d="M145 285c2-35-7-69-11-98l-19-35 25-19 30-4 30 4 25 19-19 35c-4 29-13 63-11 98h-50Z"
      fill="url(#{{P}}-body)" stroke="${shade(p.accent, -55)}" stroke-width="2"/>
    <path d="M142 101c0-23 13-38 28-38s28 15 28 38c0 16-8 30-20 35l-8 12-8-12c-12-5-20-19-20-35Z" fill="${shade(p.accent, -60)}" stroke="${shade(p.accent, -38)}" stroke-width="1.6"/>
    <path d="M143 97c-17-12-28-31-25-49 8 9 14 11 21 12l-7-22c10 7 15 15 18 27l8-19 3 25 15-19-4 25c6 4 12 6 20 1-4 20-16 32-33 38l-16-19Z"
      fill="${shade(p.accent, -50)}" stroke="${p.accent}" stroke-width="1.2"/>
    <g class="m-eye">
      <path d="M153 108c5-4 10-4 14 0-4 5-10 5-14 0Z" fill="${p.accent}"/>
      <path d="M173 108c5-4 10-4 14 0-4 5-10 5-14 0Z" fill="${p.accent}"/>
    </g>
    <path d="M158 129c7 4 17 4 24 0" fill="none" stroke="${shade(p.accent, -18)}" stroke-width="1.5"/>
    <path d="M129 170c-23 5-36 23-35 51l16 43 19-6-3-49 15-22-12-17ZM211 170c23 5 36 23 34 51l-17 43-19-6 4-49-15-22 13-17Z"
      fill="${shade(p.accent, -65)}" stroke="${shade(p.accent, -38)}" stroke-width="1.5"/>
    <g fill="${shade(p.accent, -25)}" opacity=".8">
      <path d="m110 261 15-2 1 19-19-2 3-15ZM215 259l15 2-2 19-17-3 4-18Z"/>
    </g>
    <g class="m-core"><path d="M171 183c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14Z" fill="${p.accent}" opacity=".55"/><path d="m171 190 6 7-6 7-6-7 6-7Z" fill="#fff2d6"/></g>
    <path d="M150 239c9 7 23 8 35 2" fill="none" stroke="${p.accent}" stroke-width="1.1" opacity=".4"/>
    ${boss ? `<path d="M146 76C134 51 134 32 146 15c1 14 7 20 12 23l6-26 7 27 12-23c9 17 5 36-5 58l-32 2Z" fill="${shade(p.accent, -45)}" stroke="${p.accent}" stroke-width="1.2"/>` : ""}
  `,

  horror: (p, boss) => `
    <g class="horror-tentacles" fill="none" stroke="${shade(p.accent, -35)}" stroke-linecap="round">
      <path d="M111 209C70 197 39 213 45 248c4 24 32 28 43 13" stroke-width="14"/>
      <path d="M96 230c-21 17-25 37-13 52 9 11 24 6 27-6" stroke-width="10"/>
      <path d="M229 209c41-12 72 4 66 39-4 24-32 28-43 13" stroke-width="14"/>
      <path d="M244 230c21 17 25 37 13 52-9 11-24 6-27-6" stroke-width="10"/>
      <path d="M82 169c-29-19-53-12-60 8-5 15 8 28 21 24" stroke-width="9"/>
      <path d="M260 169c29-19 53-12 60 8 5 15-8 28-21 24" stroke-width="9"/>
    </g>
    <path d="M170 77c44 0 82 33 82 82 0 55-37 94-82 94s-82-39-82-94c0-49 38-82 82-82Z" fill="url(#{{P}}-body)" stroke="${shade(p.accent, -50)}" stroke-width="2"/>
    <path d="M108 146c6-35 27-55 62-55 33 0 56 17 65 48-22-19-47-27-76-22-21 4-37 13-51 29Z" fill="${shade(p.accent, -72)}" opacity=".75"/>
    <ellipse cx="170" cy="164" rx="61" ry="51" fill="${shade(p.accent, -73)}" stroke="${shade(p.accent, -38)}" stroke-width="2"/>
    <ellipse cx="170" cy="164" rx="43" ry="38" fill="${p.accent}" opacity=".42"/>
    <ellipse cx="170" cy="164" rx="22" ry="28" fill="#07080b"/>
    <ellipse class="m-eye" cx="170" cy="160" rx="7" ry="19" fill="${p.accent}"/>
    <circle cx="170" cy="160" r="4" fill="#fff3cb"/>
    <g fill="${shade(p.accent, -63)}" stroke="${shade(p.accent, -28)}" stroke-width="1.3">
      <path d="m112 202 15 4 3 26-16-7-2-23ZM129 207l14 4 2 24-15-6-1-22ZM212 202l-15 4-3 26 16-7 2-23ZM195 207l-14 4-2 24 15-6 1-22Z"/>
    </g>
    <g class="m-eye" opacity=".8">
      <circle cx="130" cy="120" r="2.5" fill="${p.accent}"/><circle cx="212" cy="126" r="2" fill="${p.accent}"/>
    </g>
    <path d="M123 228c14 16 30 23 48 23s34-7 48-23" fill="none" stroke="${p.accent}" stroke-width="1.3" opacity=".35"/>
    <g class="horror-orbs" fill="${p.accent}">
      <circle cx="71" cy="118" r="3" opacity=".5"/><circle cx="269" cy="99" r="2" opacity=".6"/>
      <circle cx="286" cy="208" r="3.5" opacity=".35"/><circle cx="51" cy="220" r="2" opacity=".4"/>
    </g>
    ${boss ? `<path d="M112 83C89 55 91 31 107 12c-2 17 4 25 10 30l3-34 13 32 9-36 11 38 9-32 8 34c9-9 17-16 16-32 14 24 13 49-9 73l-55-2Z" fill="${shade(p.accent, -50)}" stroke="${p.accent}" stroke-width="1.2"/>` : ""}
  `,

  sentinel: (p, boss) => `
    <g class="m-wing-left" opacity=".82">
      <path d="M130 148C95 125 62 84 46 48c33 12 51 34 74 39-12-25-13-44-8-64 19 25 26 52 47 69l-29 56Z" fill="${shade(p.accent, -65)}" stroke="${shade(p.accent, -24)}" stroke-width="1.3"/>
      <path d="M63 66c22 23 44 43 62 65M67 93c17 12 32 25 48 42" fill="none" stroke="${p.accent}" stroke-width=".9" opacity=".5"/>
    </g>
    <g class="m-wing-right" opacity=".82">
      <path d="M210 148c35-23 68-64 84-100-33 12-51 34-74 39 12-25 13-44 8-64-19 25-26 52-47 69l29 56Z" fill="${shade(p.accent, -65)}" stroke="${shade(p.accent, -24)}" stroke-width="1.3"/>
      <path d="M277 66c-22 23-44 43-62 65M273 93c-17 12-32 25-48 42" fill="none" stroke="${p.accent}" stroke-width=".9" opacity=".5"/>
    </g>
    <circle cx="170" cy="62" r="30" fill="none" stroke="${p.accent}" stroke-width="2.4" opacity=".5"/>
    <circle cx="170" cy="62" r="23" fill="none" stroke="${p.accent}" stroke-width="1" opacity=".35"/>
    <path d="M144 285c-5-37-3-70 10-96l-22-38 24-17 14-2 14 2 24 17-22 38c13 26 15 59 10 96h-52Z"
      fill="url(#{{P}}-body)" stroke="${shade(p.accent, -50)}" stroke-width="2"/>
    <path d="M158 89c0-13 5-23 12-23s12 10 12 23l-5 20h-14l-5-20Z" fill="${shade(p.accent, -58)}" stroke="${shade(p.accent, -28)}" stroke-width="1.3"/>
    <path d="M157 93c-12-4-22-12-28-22l21 3c-2-12 0-18 7-24 2 9 6 14 13 22s12 13 12 21h-25Z" fill="${shade(p.accent, -45)}" stroke="${shade(p.accent, -15)}" stroke-width="1"/>
    <path d="M195 93c18-6 28-18 28-35-10 8-17 8-24 4-3 13-10 20-21 25l17 6Z" fill="${p.accent}" opacity=".35"/>
    <g class="m-eye"><rect x="165" y="96" width="11" height="2.5" rx="1" fill="${p.accent}"/></g>
    <path d="M154 124h33l14 20-8 53h-45l-8-53 14-20Z" fill="${shade(p.accent, -67)}" stroke="${shade(p.accent, -33)}" stroke-width="1.6"/>
    <path d="m170 134 18 17-18 38-18-38 18-17Z" fill="${p.accent}" opacity=".78"/>
    <path d="m170 143 8 10-8 19-8-19 8-10Z" fill="#fff9e2"/>
    <path d="M143 131c-20 4-34 17-39 36l-4 54 18 3 13-45 12-21M197 131c20 4 34 17 39 36l4 54-18 3-13-45-12-21" fill="${shade(p.accent, -62)}" stroke="${shade(p.accent, -35)}" stroke-width="1.4"/>
    <path d="M217 127 232 36l6 1-9 93-12-3Z" fill="${shade(p.accent, 22)}" stroke="${shade(p.accent, 62)}" stroke-width="1"/>
    <path d="m231 36 6-16 4 17-10-1Z" fill="${p.accent}"/>
    <path d="M187 240c8 6 18 8 28 5M146 268h48" stroke="${p.accent}" stroke-width="1.1" opacity=".35"/>
    ${boss ? `<g fill="none" stroke="${p.accent}"><circle cx="170" cy="57" r="42" stroke-width="1" opacity=".45"/><circle cx="170" cy="57" r="50" stroke-width=".7" stroke-dasharray="3 8" opacity=".55"/></g>` : ""}
  `,

  dragon: (p, boss) => `
    <g class="m-wing-left" opacity=".9">
      <path d="M135 145C96 100 56 72 18 63c28 21 29 39 45 50-26-4-42 2-57 13 26 2 43 9 60 21-21 2-36 12-48 28 32-5 53-8 73-3 15 20 27 31 47 40l-3-67Z"
        fill="${shade(p.accent, -73)}" stroke="${shade(p.accent, -30)}" stroke-width="1.4"/>
      <path d="M38 83c28 20 50 43 67 64M27 119c24 6 41 14 58 28M31 157c22-6 38-8 57-4" fill="none" stroke="${p.accent}" stroke-width=".85" opacity=".5"/>
    </g>
    <g class="m-wing-right" opacity=".9">
      <path d="M205 145c39-45 79-73 117-82-28 21-29 39-45 50 26-4 42 2 57 13-26 2-43 9-60 21 21 2 36 12 48 28-32-5-53-8-73-3-15 20-27 31-47 40l3-67Z"
        fill="${shade(p.accent, -73)}" stroke="${shade(p.accent, -30)}" stroke-width="1.4"/>
      <path d="M302 83c-28 20-50 43-67 64M313 119c-24 6-41 14-58 28M309 157c-22-6-38-8-57-4" fill="none" stroke="${p.accent}" stroke-width=".85" opacity=".5"/>
    </g>
    <path d="M122 251c6-34 2-65 17-91l-18-31 25-18 24-3 25 3 24 18-18 31c15 26 11 57 17 91-23 15-72 15-96 0Z"
      fill="url(#{{P}}-body)" stroke="${shade(p.accent, -52)}" stroke-width="2"/>
    <path d="M158 115c0-33 5-50 12-58 8 10 13 28 13 58l-4 28h-17l-4-28Z" fill="${shade(p.accent, -60)}" stroke="${shade(p.accent, -35)}" stroke-width="1.5"/>
    <path d="M146 76c2-23 13-38 24-38s22 15 24 38c0 19-9 33-24 38-15-5-24-19-24-38Z" fill="${shade(p.accent, -65)}" stroke="${shade(p.accent, -37)}" stroke-width="1.6"/>
    <path d="M149 60c-12-15-21-16-30-10 5-14 19-20 33-13M185 60c12-15 21-16 30-10-5-14-19-20-33-13" fill="${shade(p.accent, -50)}" stroke="${p.accent}" stroke-width="1.1"/>
    <path d="M149 55c-8-13-15-21-15-30 8 3 13 10 20 20M191 55c8-13 15-21 15-30-8 3-13 10-20 20" fill="${shade(p.accent, -45)}" stroke="${shade(p.accent, 15)}" stroke-width="1"/>
    <path d="M146 88c8-8 17-8 24 0 7 10 16 13 25 9-4 10-12 15-24 15-13 0-22-7-25-24Z" fill="${shade(p.accent, -40)}" stroke="${shade(p.accent, -20)}" stroke-width="1.1"/>
    <circle class="m-eye" cx="160" cy="81" r="4" fill="${p.accent}"/>
    <circle cx="160" cy="81" r="8" fill="${p.accent}" opacity=".15"/>
    <path d="M151 100c7 3 15 3 23 0M153 105l4 6 4-7 4 7 4-6" fill="none" stroke="${p.accent}" stroke-width="1.1" opacity=".8"/>
    <path d="M160 143c8-5 18-5 26 0-8 4-18 4-26 0ZM166 178c-3 23 1 44 8 64M190 178c7 20 9 43 5 64" fill="none" stroke="${shade(p.accent, -25)}" stroke-width="1.2" opacity=".55"/>
    <path d="M115 260c-13 1-24 7-32 18l32 2 12-15-12-5ZM217 260c13 1 24 7 32 18l-32 2-12-15 12-5Z" fill="${shade(p.accent, -45)}" stroke="${shade(p.accent, -20)}" stroke-width="1"/>
    ${boss ? `<path d="M131 147 88 137l20 21-31 6 34 10 16-10 13 10 34-10-31-6 20-21-43 10Z" fill="${shade(p.accent, -55)}" stroke="${p.accent}" stroke-width="1.2"/>
      <circle cx="170" cy="192" r="42" fill="${p.accent}" opacity=".06"/>` : ""}
  `,
};

export function monsterSvg(archetype, palette, isBoss = false) {
  const p = palette || { accent: "#e59a58", sky: "#222", glow: "#ff8b4a" };
  const unique = Math.random().toString(36).slice(2, 8);
  const shape = (ARCHETYPES[archetype] || ARCHETYPES.slime)(p, isBoss).replaceAll("{{P}}", unique);
  const crown = isBoss
    ? `<g class="boss-crown" opacity=".75" fill="${p.accent}">
        <circle cx="170" cy="22" r="1.8"/><circle cx="144" cy="34" r="1.2"/><circle cx="196" cy="34" r="1.2"/>
        <path d="M153 38h34l-5 8h-24l-5-8Z" opacity=".5"/>
      </g>`
    : "";
  return `<svg class="monster-svg" viewBox="0 0 340 310" role="img" aria-label="${archetype}">
    <defs>
      <linearGradient id="${unique}-body" x1="0" y1="0" x2=".8" y2="1">
        <stop offset="0%" stop-color="${shade(p.accent, -48)}"/>
        <stop offset="45%" stop-color="${shade(p.accent, -78)}"/>
        <stop offset="100%" stop-color="#08090c"/>
      </linearGradient>
      <radialGradient id="${unique}-ground" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${p.glow}" stop-opacity=".5"/>
        <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
      </radialGradient>
      <filter id="${unique}-soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5"/>
      </filter>
    </defs>
    <ellipse cx="170" cy="265" rx="126" ry="31" fill="url(#${unique}-ground)"/>
    <ellipse cx="170" cy="271" rx="91" ry="14" fill="#020305" opacity=".72"/>
    ${auraSvg(p, isBoss)}
    <g class="m-glow" opacity=".7">
      <circle cx="170" cy="162" r="104" fill="${p.accent}" opacity=".045" filter="url(#${unique}-soft)"/>
    </g>
    <g class="m-float">
      ${shape}
    </g>
    ${crown}
  </svg>`;
}
