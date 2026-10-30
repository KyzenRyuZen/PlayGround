/* ---------------------------------------------------------------
   Inline SVG icon set — stroke-based, inherits currentColor.
   --------------------------------------------------------------- */
const P = {
  sword: '<path d="M5 19l3-3M4 20l2-2M14 4l6-2-2 6L9 17l-3-3z"/><path d="M8 14l2 2M11 11l2 2"/>',
  staff: '<path d="M7 21L17 4"/><circle cx="18" cy="3.5" r="2.2"/><path d="M5 21h4"/>',
  bow: '<path d="M6 4c7 3 8 13 0 16"/><path d="M6 4v16"/><path d="M6 12h13"/><path d="M16 9l3 3-3 3"/>',
  armor: '<path d="M8 3l4 2 4-2 4 3-2 4v9H6v-9L4 6z"/><path d="M9 9h6M12 9v7"/>',
  bracelet: '<circle cx="12" cy="12" r="6"/><path d="M12 6V3M12 21v-3M6 12H3M21 12h-3"/><path d="M9 12h6"/>',
  earrings: '<circle cx="8" cy="17" r="2.2"/><path d="M8 15V5"/><circle cx="16" cy="17" r="2.2"/><path d="M16 15V5"/><path d="M5 5h6M13 5h6"/>',
  helmet: '<path d="M4 14a8 8 0 0116 0v4H4z"/><path d="M4 14h16M9 18v-3M15 18v-3"/><path d="M12 6v3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M12 7v8M8 11h8"/>',
  boots: '<path d="M5 3v10l-2 4v4h8v-4l-3-3V3z"/><path d="M14 3v9l-3 3v6h8v-4l-3-2V3z" opacity=".55"/>',
  necklace: '<path d="M4 4c0 8 3 12 8 12s8-4 8-12"/><circle cx="12" cy="18" r="2.5"/>',
  ring: '<circle cx="12" cy="14" r="5"/><path d="M9 9l3-6 3 6"/><path d="M9 9h6"/>',
  whirlwind: '<path d="M20 12a8 8 0 11-2.3-5.6"/><path d="M20 4v4h-4"/><path d="M12 8c2 1 3 3 2 5s-4 2-5 0 0-4 3-5z"/>',
  shieldbash: '<path d="M12 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5z"/><path d="M12 7v6M9 10h6"/>',
  banner: '<path d="M6 21V3"/><path d="M6 4h12l-3 4 3 4H6"/>',
  frost: '<path d="M12 2v20M3 7l18 10M21 7L3 17"/><path d="M9 4l3 3 3-3M9 20l3-3 3 3"/>',
  meteor: '<path d="M4 20l8-8"/><path d="M10 18l-4-4"/><circle cx="16" cy="8" r="4"/><path d="M14 2v2M22 8h-2M20 3l-1.5 1.5"/>',
  blink: '<path d="M4 12h9"/><path d="M9 8l4 4-4 4"/><path d="M15 4v16M19 7v10" opacity=".6"/>',
  rain: '<path d="M4 8l3 13M10 5l3 16M16 7l3 14"/><path d="M3 4h10M14 2h7"/><path d="M6 17l3 4M12 18l3 4"/>',
  pierce: '<path d="M3 12h18"/><path d="M16 7l5 5-5 5"/><path d="M6 8l4 4-4 4"/>',
  roll: '<path d="M5 18c1-6 6-8 9-5s1 7-4 8"/><path d="M17 5l3 3-3 3"/><path d="M12 8h8"/>',
  gold: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9h5a2 2 0 010 4H9h5a2 2 0 010 4H9" opacity=".8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 00-1.7-1L14.5 3h-5l-.4 2.6a7 7 0 00-1.7 1l-2.3-1-2 3.4L5 11a7 7 0 000 2l-2 1.5 2 3.4 2.3-1a7 7 0 001.7 1l.4 2.6h5l.4-2.6a7 7 0 001.7-1l2.3 1 2-3.4-2-1.5a7 7 0 00.1-1z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  star: '<path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9z"/>',
  skull: '<path d="M5 10a7 7 0 1114 0c0 3-2 4-2 6H7c0-2-2-3-2-6z"/><circle cx="9" cy="10" r="1.3"/><circle cx="15" cy="10" r="1.3"/><path d="M9 19v2M12 19v3M15 19v2"/>',
  chest: '<path d="M3 9h18v10H3z"/><path d="M3 9l2-4h14l2 4M12 9v10M9 13h6"/><path d="M12 4v2"/>',
  chest2: '<path d="M3 8h18v11H3z"/><path d="M3 8l3-5h12l3 5"/><path d="M3 12h18M12 8v4M9 17h6"/><path d="M7 3v2M17 3v2"/>',
  flame: '<path d="M12 3c4 5 5 7 5 10a5 5 0 01-10 0c0-2 1-4 3-6 0 2 1 3 2 3 1-2 0-4 0-7z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
  check: '<path d="M5 12l4 4 10-10"/>',
  motion: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M3 8l2 2-2 2M21 8l-2 2 2 2M12 12v.01"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 010 6M19 6a8 8 0 010 12"/>',
  reset: '<path d="M4 12a8 8 0 108-8"/><path d="M4 4v5h5"/>',
  sparkle: '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  forge: '<path d="M4 20l4-4M14 4l6 6-9 9-4-4z"/><path d="M7 13l4 4M9 6l9 9"/>',
  shop: '<path d="M4 9h16v11H4z"/><path d="M3 9l2-5h14l2 5M9 13h6"/>',
  info2: '<path d="M12 8h.01M11 12h1v5h1"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  leader: '<path d="M8 21h8M12 17v4"/><path d="M6 4h12v5a6 6 0 01-12 0z"/><path d="M6 6H3a3 3 0 003 3M18 6h3a3 3 0 01-3 3"/>',
};

export function icon(name, cls = '') {
  const body = P[name] || P.info;
  return `<svg class="${cls}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export const ICONS = P;
