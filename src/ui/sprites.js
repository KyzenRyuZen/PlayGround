/* ==========================================================================
   EBONSPIRE · hand-drawn vector art
   Heroes, monsters, regions, items and collection creatures are all original
   SVG built here so the game ships without image assets.
   ========================================================================== */

let seq = 0;
function gid(prefix) { seq += 1; return `${prefix}${seq}`; }
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

const CLASS_LOOK = {
  warrior: { metal: '#7b8496', deep: '#343a48', trim: '#d9aa61', cloth: '#4a332b', skin: '#d6a984', hair: '#43301f', glow: '#ffb06e', accent: '#e5a45d' },
  mage: { metal: '#5b4f8f', deep: '#2a2347', trim: '#b49bff', cloth: '#31294f', skin: '#d9b08c', hair: '#231d33', glow: '#a98bff', accent: '#a88bff' },
  archer: { metal: '#4b6b55', deep: '#24362b', trim: '#b6e8c6', cloth: '#2f4436', skin: '#d2a47c', hair: '#573c25', glow: '#79d6a2', accent: '#79d6a2' },
};

export function heroArt(classId = 'warrior', opts = {}) {
  const c = CLASS_LOOK[classId] || CLASS_LOOK.warrior;
  const glowId = gid('hg');
  const metalId = gid('hm');
  const clothId = gid('hc');
  const skinId = gid('hs');
  const extra = opts.size ? `width="${opts.size}" height="${opts.size * 1.57}"` : '';
  const common = `
    <defs>
      <radialGradient id="${glowId}" cx="50%" cy="42%" r="55%">
        <stop offset="0" stop-color="${c.glow}" stop-opacity=".28"/>
        <stop offset="1" stop-color="${c.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${metalId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c.metal}"/><stop offset=".52" stop-color="${c.deep}"/><stop offset="1" stop-color="${c.metal}"/>
      </linearGradient>
      <linearGradient id="${clothId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c.cloth}"/><stop offset="1" stop-color="${c.deep}"/>
      </linearGradient>
      <linearGradient id="${skinId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c.skin}"/><stop offset="1" stop-color="${c.skin}" stop-opacity=".72"/>
      </linearGradient>
    </defs>
    <ellipse cx="70" cy="207" rx="45" ry="9" fill="rgba(0,0,0,.42)"/>
    <ellipse cx="70" cy="118" rx="66" ry="96" fill="url(#${glowId})"/>`;

  if (classId === 'mage') {
    return `<svg ${extra} viewBox="0 0 140 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mage">${common}
      <path d="M50 82 C34 116 26 164 20 199 L102 203 C96 164 92 120 88 82Z" fill="url(#${clothId})" stroke="#16111f" stroke-width="2"/>
      <path d="M54 92 C46 130 38 166 32 196M78 96 C84 134 92 166 100 197" stroke="${c.trim}" stroke-opacity=".34" stroke-width="1.2" fill="none"/>
      <path d="M48 104 C55 116 84 116 91 104 L94 122 C82 133 58 133 46 122Z" fill="${c.deep}" opacity=".7"/>
      <path d="M46 122 Q70 134 94 122 L92 128 Q70 140 48 128Z" fill="${c.trim}" opacity=".75"/>
      <circle cx="70" cy="127" r="3.2" fill="${c.trim}"/>
      <path d="M53 76 Q70 66 87 76 L90 92 Q70 102 50 92Z" fill="url(#${metalId})" stroke="#17111f" stroke-width="1.6"/>
      <path d="M56 79 L58 62 L64 68 L70 56 L76 68 L82 62 L84 79Z" fill="${c.metal}" stroke="#17111f" stroke-width="1.3"/>
      <path d="M56 82 Q70 92 84 82 L83 96 Q70 103 57 96Z" fill="#191323"/>
      <path d="M60 84 Q70 87 80 84 L79 90 Q70 93 61 90Z" fill="#0b0810"/>
      <circle cx="64.5" cy="87" r="1.5" fill="${c.glow}"/><circle cx="75.5" cy="87" r="1.5" fill="${c.glow}"/>
      <path d="M83 84 C93 94 96 110 93 126" stroke="url(#${clothId})" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M57 84 C47 94 45 106 47 118" stroke="url(#${clothId})" stroke-width="11" stroke-linecap="round" fill="none"/>
      <path d="M47 118 C44 122 45 127 49 128 C53 128 55 124 53 120Z" fill="url(#${skinId})"/>
      <circle cx="47" cy="112" r="4" fill="none" stroke="${c.trim}" stroke-width="1.2" opacity=".8"/>
      <circle cx="47" cy="112" r="1.6" fill="${c.glow}"/>
      <path d="M93 126 L105 55" stroke="#6d5638" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M101 72 L109 70" stroke="${c.trim}" stroke-width="2" opacity=".7"/>
      <circle cx="107" cy="44" r="8.5" fill="${c.glow}" opacity=".2"/>
      <circle cx="107" cy="44" r="5" fill="${c.glow}" stroke="#f0e6ff" stroke-width="1"/>
      <path d="M107 34v-5M107 59v-5M97 44h-5M122 44h-5M100 37l-3-3M117 54l-3-3M114 37l3-3M100 54l-3-3" stroke="${c.trim}" stroke-width="1" opacity=".7"/>
      <path d="M38 198 Q70 206 105 197" stroke="#0b0810" stroke-width="7" stroke-linecap="round"/>
      <path d="M46 174 C56 181 84 181 96 173" stroke="${c.trim}" stroke-width="1" opacity=".25" fill="none"/>
      <circle cx="34" cy="150" r="1.2" fill="${c.glow}" opacity=".8"/><circle cx="108" cy="118" r="1" fill="${c.glow}" opacity=".7"/>
    </svg>`;
  }

  if (classId === 'archer') {
    return `<svg ${extra} viewBox="0 0 140 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Archer">${common}
      <path d="M52 70 C36 96 30 138 36 182 L52 190 L48 128 L58 86Z" fill="${c.deep}" stroke="#141d17" stroke-width="1.6"/>
      <path d="M55 150 L50 201 L66 201 L69 154Z" fill="url(#${metalId})" stroke="#131a15" stroke-width="1.3"/>
      <path d="M73 154 L78 201 L94 201 L89 149Z" fill="url(#${metalId})" stroke="#131a15" stroke-width="1.3"/>
      <path d="M47 196 L67 196 L67 202 L44 202Z" fill="#2a2119"/>
      <path d="M75 196 L95 196 L98 202 L75 202Z" fill="#2a2119"/>
      <path d="M52 80 Q70 70 88 80 L92 130 Q70 141 48 130Z" fill="url(#${clothId})" stroke="#131a15" stroke-width="1.6"/>
      <path d="M52 92 L88 92M51 102 L89 102" stroke="${c.metal}" stroke-width="3" opacity=".5"/>
      <path d="M58 78 L61 66 L69 70 L70 82ZM82 78 L79 66 L71 70 L70 82Z" fill="url(#${metalId})" stroke="#131a15" stroke-width="1"/>
      <path d="M45 82 Q55 88 57 98 L51 108 Q43 98 41 88Z" fill="${c.metal}" stroke="#131a15" stroke-width="1.2"/>
      <path d="M95 82 Q85 88 83 98 L89 108 Q97 98 99 88Z" fill="${c.metal}" stroke="#131a15" stroke-width="1.2"/>
      <path d="M58 88 C64 94 76 94 82 88 L83 98 Q70 104 57 98Z" fill="#6fa477" opacity=".5"/>
      <path d="M48 130 Q70 140 92 130 L90 138 Q70 147 50 138Z" fill="#3a2a1c"/>
      <rect x="65" y="132" width="10" height="7" rx="1.5" fill="${c.trim}"/>
      <circle cx="70" cy="135.5" r="2" fill="${c.deep}"/>
      <path d="M56 64 Q70 55 84 64 L82 82 Q70 88 58 82Z" fill="url(#${skinId})"/>
      <path d="M52 65 Q70 46 88 65 L86 74 Q78 63 70 64 Q62 63 54 74Z" fill="${c.deep}" stroke="#131a15" stroke-width="1.2"/>
      <path d="M55 64 Q70 54 85 64 L82 70 Q70 64 58 70Z" fill="${c.metal}" opacity=".7"/>
      <path d="M60 71 L63 72M77 72 L80 71" stroke="#241a12" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="63" cy="74" r="1.2" fill="${c.glow}"/><circle cx="77" cy="74" r="1.2" fill="${c.glow}"/>
      <path d="M74 78 Q70 79 68 78" stroke="#7b5746" stroke-width="1.2" fill="none"/>
      <path d="M96 92 C104 96 107 108 104 122" stroke="url(#${clothId})" stroke-width="10" stroke-linecap="round" fill="none"/>
      <path d="M104 122 C107 125 106 130 102 130 C98 129 97 124 100 121Z" fill="url(#${skinId})"/>
      <path d="M43 90 C35 104 32 128 35 154" stroke="url(#${clothId})" stroke-width="9" stroke-linecap="round" fill="none"/>
      <path d="M36 104 C22 112 18 142 28 162 C35 175 46 180 54 176" stroke="#87663c" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M36 104 C30 118 26 142 33 160" stroke="#d9c6a1" stroke-width="1" fill="none" opacity=".7"/>
      <path d="M54 176 C58 174 58 168 53 168 C48 169 48 175 54 176Z" fill="url(#${skinId})"/>
      <path d="M47 100 L70 108 L70 112 L47 104Z" fill="#c4a276" opacity=".9"/>
      <path d="M47 99 L54 95 L55 104Z" fill="${c.trim}"/>
      <path d="M72 108 L81 106" stroke="#d9c6a1" stroke-width="1.2"/>
      <path d="M68 86 C78 96 84 122 82 140" stroke="#4a3320" stroke-width="2" fill="none" opacity=".6"/>
      <path d="M98 120 L110 150 L104 152 L94 124Z" fill="#4a3320" stroke="#1b140e" stroke-width="1"/>
      <path d="M101 150 L110 150 L108 162 L99 160Z" fill="#6b4a2b"/>
      <path d="M72 138 C80 140 86 138 90 134" stroke="#b6e8c6" stroke-width="1" opacity=".4" fill="none"/>
    </svg>`;
  }

  /* warrior */
  return `<svg ${extra} viewBox="0 0 140 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Warrior">${common}
    <path d="M52 70 C36 96 28 142 32 186 L48 196 L46 130 L58 86Z" fill="#472d25" stroke="#1a1210" stroke-width="1.7"/>
    <path d="M55 152 L51 201 L68 201 L70 154Z" fill="url(#${metalId})" stroke="#141318" stroke-width="1.4"/>
    <path d="M73 154 L78 201 L95 201 L90 151Z" fill="url(#${metalId})" stroke="#141318" stroke-width="1.4"/>
    <path d="M47 196 L68 196 L68 203 L43 203Z" fill="#2a2019"/>
    <path d="M75 196 L96 196 L100 203 L76 203Z" fill="#2a2019"/>
    <path d="M50 80 Q70 68 90 80 L94 128 Q70 143 46 128Z" fill="url(#${metalId})" stroke="#141318" stroke-width="1.8"/>
    <path d="M56 84 Q70 78 84 84 L82 112 Q70 120 58 112Z" fill="${c.deep}" opacity=".55"/>
    <path d="M70 82 L70 132M52 96 Q70 106 88 96M52 112 Q70 121 88 111" stroke="${c.trim}" stroke-width="1.2" opacity=".55" fill="none"/>
    <circle cx="70" cy="102" r="4.2" fill="${c.deep}" stroke="${c.trim}" stroke-width="1.2"/>
    <circle cx="70" cy="102" r="1.4" fill="${c.glow}"/>
    <path d="M48 128 Q70 140 92 128 L91 139 L70 147 L49 139Z" fill="#3b271c" stroke="#171009" stroke-width="1.1"/>
    <rect x="64" y="131" width="12" height="10" rx="2" fill="${c.trim}"/>
    <path d="M67 134h6v4h-6z" fill="${c.deep}"/>
    <path d="M46 84 Q56 84 60 94 L57 117 Q46 114 42 100Z" fill="url(#${metalId})" stroke="#141318" stroke-width="1.3"/>
    <path d="M94 84 Q84 84 80 94 L83 117 Q94 114 98 100Z" fill="url(#${metalId})" stroke="#141318" stroke-width="1.3"/>
    <path d="M45 81 Q54 72 62 80 L60 91 Q52 94 44 91Z" fill="${c.metal}" stroke="#141318" stroke-width="1.2"/>
    <path d="M95 81 Q86 72 78 80 L80 91 Q88 94 96 91Z" fill="${c.metal}" stroke="#141318" stroke-width="1.2"/>
    <path d="M53 64 Q70 50 87 64 L89 84 Q70 94 51 84Z" fill="url(#${metalId})" stroke="#141318" stroke-width="1.8"/>
    <path d="M53 66 Q70 56 87 66 L86 76 Q70 84 54 76Z" fill="#1b1920"/>
    <path d="M56 70 Q70 64 84 70 L83 76 Q70 82 57 76Z" fill="#09080c"/>
    <path d="M59 73 L66 73M74 73 L81 73" stroke="${c.glow}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M55 64 L58 52 L64 60M85 64 L82 52 L76 60" fill="${c.trim}" stroke="#1a130b" stroke-width="1.2"/>
    <path d="M62 86 Q70 89 78 86 L77 91 Q70 94 63 91Z" fill="${c.deep}"/>
    <path d="M60 87 Q70 91 80 87" stroke="${c.trim}" stroke-width="1" opacity=".7" fill="none"/>
    <path d="M96 94 C105 100 108 112 104 126" stroke="url(#${metalId})" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M104 126 C108 128 107 134 103 134 C99 133 98 128 101 125Z" fill="url(#${skinId})"/>
    <path d="M42 92 C34 104 32 118 36 130" stroke="url(#${metalId})" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M36 122 C28 126 20 140 23 158 C26 176 40 188 52 184 C60 181 61 170 55 164 C47 156 44 144 48 134Z" fill="url(#${metalId})" stroke="#141318" stroke-width="1.6"/>
    <path d="M33 133 C40 136 45 145 43 156 C41 167 35 174 29 173" stroke="${c.trim}" stroke-width="1.3" opacity=".55" fill="none"/>
    <circle cx="39" cy="147" r="4" fill="${c.deep}" stroke="${c.trim}" stroke-width="1"/>
    <path d="M106 128 L118 47" stroke="#d5dbe6" stroke-width="5.2" stroke-linecap="round"/>
    <path d="M118 47 L121 28 L124 47 L121 52Z" fill="#eef2f8" stroke="#6f7d90" stroke-width=".8"/>
    <path d="M108 112 L118 106" stroke="${c.trim}" stroke-width="5" stroke-linecap="round"/>
    <path d="M106 128 L103 139" stroke="#6d5638" stroke-width="5" stroke-linecap="round"/>
    <path d="M101 137 L108 143" stroke="${c.trim}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M113 105 L116 49" stroke="#ffffff" stroke-opacity=".35" stroke-width="1"/>
    <circle cx="43" cy="182" r="1.4" fill="${c.glow}" opacity=".8"/>
    <path d="M28 202 Q70 212 113 201" stroke="#0b0810" stroke-width="6" stroke-linecap="round" opacity=".6"/>
  </svg>`;
}

/* --------------------------------------------------------------------------
   Monsters and creatures
   -------------------------------------------------------------------------- */
export function monsterArt(visual = 'wolf', palette = {}, opts = {}) {
  const p = {
    primary: palette.primary || '#7b8496',
    secondary: palette.secondary || '#343a48',
    glow: palette.glow || '#ffb06e',
    accent: palette.accent || '#c3a45f',
    ...(opts.colors || {}),
  };
  const eye = p.glow;
  const body = p.primary;
  const dark = p.secondary;
  const head = (cx, cy, r, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${body}" stroke="${dark}" stroke-width="2"/>${extra}`;
  const eyes = (x1, x2, y, r = 2.2) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="${eye}"/><circle cx="${x2}" cy="${y}" r="${r}" fill="${eye}"/>`;
  let scene = '';

  switch (visual) {
    case 'wolf':
      scene = `
        <path d="M36 92 Q42 72 66 70 L104 72 Q126 76 132 92 Q136 108 118 114 L76 118 Q46 116 36 104Z" fill="${body}" stroke="${dark}" stroke-width="2.4"/>
        <path d="M54 110 L50 138 L61 138 L66 114ZM86 114 L86 139 L97 139 L101 112Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M46 136 L64 136M85 137 L102 136" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>
        <path d="M32 88 Q18 74 12 88 Q22 96 34 102Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M122 82 Q142 70 148 84 Q142 92 126 96" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M40 76 L34 54 L52 64Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M58 70 L64 48 L74 68Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M38 94 Q34 82 40 76" stroke="${dark}" stroke-width="2" fill="none" opacity=".6"/>
        ${eyes(42, 56, 82)}
        <path d="M30 96 Q26 100 30 102 Q38 103 40 99" fill="${dark}"/>
        <path d="M30 99 L15 99 L28 103Z" fill="#e8e2d0"/>
        <path d="M14 88 L22 82M16 94 L8 91" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M72 74 L80 62 L92 74" stroke="${p.accent}" stroke-width="1.4" fill="none" opacity=".5"/>
        <path d="M60 116 Q74 121 92 118" stroke="${dark}" stroke-width="1.4" fill="none" opacity=".5"/>`;
      break;
    case 'boar':
    case 'hound':
      if (visual === 'hound') {
        scene = `
          <path d="M36 96 Q40 82 58 80 L100 84 Q124 88 128 102 Q126 114 108 116 L70 118 Q44 114 36 106Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
          <path d="M52 114 L48 141 L58 141 L64 116ZM88 116 L88 142 L99 142 L101 114Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
          <path d="M38 104 Q24 98 18 106 Q28 110 36 110Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
          <path d="M126 92 Q146 88 150 100 Q144 104 130 102Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
          <path d="M42 82 L38 66 L52 75ZM60 81 L64 64 L74 80Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
          ${eyes(42, 56, 88)}
          <path d="M28 104 Q22 108 28 110 Q36 110 37 106" fill="${dark}"/>
          <path d="M30 108 L17 110 L28 112Z" fill="#e9e2d1"/>
          <path d="M66 84 Q78 76 92 84" stroke="${p.accent}" stroke-width="1.4" fill="none" opacity=".55"/>
          <path d="M58 117 Q76 122 94 118" stroke="${dark}" stroke-width="1.3" fill="none" opacity=".5"/>`;
      } else {
        scene = `
          <path d="M38 92 Q42 68 68 66 L106 70 Q130 76 134 94 Q130 112 108 114 L70 116 Q44 112 38 102Z" fill="${body}" stroke="${dark}" stroke-width="2.4"/>
          <path d="M52 110 L48 139 L60 139 L65 113ZM90 113 L90 140 L102 140 L103 112Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
          <path d="M34 88 Q20 80 14 92 Q24 100 38 102Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
          <path d="M38 74 L34 56 L48 66Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
          <path d="M126 84 Q142 74 148 88 Q142 98 128 98" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
          <ellipse cx="132" cy="94" rx="12" ry="9" fill="${p.accent}" opacity=".55"/>
          <circle cx="137" cy="91" r="1.6" fill="${dark}"/><circle cx="137" cy="97" r="1.4" fill="${dark}"/>
          ${eyes(43, 57, 86)}
          <path d="M30 100 L12 92 L28 96Z" fill="#e8e2d0"/>
          <path d="M31 104 L14 108 L30 108Z" fill="#e8e2d0"/>
          <path d="M64 74 Q80 66 96 74" stroke="${p.accent}" stroke-width="1.5" fill="none" opacity=".45"/>
          <path d="M58 116 Q78 120 98 116" stroke="${dark}" stroke-width="1.4" fill="none" opacity=".5"/>`;
      }
      break;
    case 'bear':
      scene = `
        <path d="M42 106 Q38 74 62 66 Q82 58 100 70 Q124 82 124 108 L116 132 L82 138 L54 132Z" fill="${body}" stroke="${dark}" stroke-width="2.5"/>
        <path d="M58 128 L52 148 L66 148 L72 130ZM94 130 L100 149 L114 149 L108 128Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M50 74 Q44 58 58 58 Q68 62 66 74Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M98 70 Q104 54 116 60 Q122 68 112 78Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M70 100 Q88 92 104 102 L102 124 Q88 134 72 124Z" fill="${p.accent}" opacity=".3"/>
        <path d="M58 96 Q62 84 76 82 Q88 84 90 96 Q88 110 76 114 Q62 110 58 96Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        ${eyes(68, 82, 94, 1.8)}
        <ellipse cx="75" cy="106" rx="7" ry="4.5" fill="${dark}"/>
        <path d="M75 110 Q72 115 68 113M75 110 Q78 115 82 113" stroke="${dark}" stroke-width="1.4" fill="none"/>
        <path d="M60 118 Q52 126 44 124M88 118 Q98 128 108 124" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M46 134 L40 142M104 134 L112 142" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>
        <path d="M42 84 Q34 92 32 104M116 82 Q124 94 124 108" stroke="${p.accent}" stroke-width="1.3" fill="none" opacity=".4"/>`;
      break;
    case 'wisp':
      scene = `
        <circle cx="80" cy="78" r="34" fill="${eye}" opacity=".09"/>
        <circle cx="80" cy="78" r="25" fill="${eye}" opacity=".18"/>
        <circle cx="80" cy="78" r="14" fill="${eye}" opacity=".8"/>
        <circle cx="80" cy="78" r="7" fill="#fff" opacity=".9"/>
        <path d="M80 92 C72 108 62 110 56 124M80 92 C86 112 98 114 106 128M80 92 C80 112 80 120 80 136" stroke="${body}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>
        <circle cx="56" cy="124" r="3" fill="${eye}" opacity=".7"/><circle cx="106" cy="128" r="2.4" fill="${eye}" opacity=".7"/><circle cx="80" cy="136" r="2" fill="${eye}" opacity=".6"/>
        <circle cx="54" cy="60" r="2" fill="${eye}" opacity=".8"/><circle cx="108" cy="68" r="1.5" fill="${eye}" opacity=".7"/>
        <path d="M62 74 Q68 70 72 74M88 74 Q92 70 98 74" stroke="${dark}" stroke-width="1.4" fill="none"/>
        <path d="M66 52 Q80 38 96 48" stroke="${p.accent}" stroke-width="1" fill="none" opacity=".5"/>`;
      break;
    case 'golemStone':
      scene = `
        <path d="M46 62 L68 48 L96 50 L116 66 L120 106 L108 132 L56 134 L36 108Z" fill="${body}" stroke="${dark}" stroke-width="2.5"/>
        <path d="M62 50 L56 28 L80 42 L96 26 L102 52Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M58 72 Q80 62 102 74 L100 102 Q80 114 58 102Z" fill="${dark}" opacity=".6"/>
        <path d="M68 82 L74 86 L69 92 L77 98M92 80 L86 88 L94 92 L88 100" stroke="${eye}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <circle cx="70" cy="82" r="1.6" fill="${eye}"/><circle cx="90" cy="82" r="1.6" fill="${eye}"/>
        <path d="M48 112 L42 140 L60 140 L62 116ZM96 116 L100 141 L118 141 L112 110Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M34 92 L18 110 L28 120 L44 104M116 92 L136 108 L128 120 L112 104" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M54 64 L62 90 L56 110M104 62 L96 88 L104 106" stroke="${eye}" stroke-width="1.2" fill="none" opacity=".55"/>
        <path d="M42 126 L66 136M100 126 L118 132" stroke="${eye}" stroke-width="1" opacity=".3"/>
        <path d="M78 44 L80 60" stroke="${eye}" stroke-width="1.4" opacity=".6"/>`;
      break;
    case 'imp':
      scene = `
        <path d="M62 74 Q44 56 34 68 Q44 82 58 90Z" fill="${dark}" stroke="${dark}" stroke-width="2"/>
        <path d="M98 74 Q116 56 126 68 Q116 82 102 90Z" fill="${dark}" stroke="${dark}" stroke-width="2"/>
        <ellipse cx="80" cy="98" rx="30" ry="33" fill="${body}" stroke="${dark}" stroke-width="2.4"/>
        <circle cx="80" cy="64" r="22" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M62 50 Q56 32 68 42 Q72 48 74 54M98 50 Q104 32 92 42 Q88 48 86 54" fill="${p.accent}" stroke="${dark}" stroke-width="1.8"/>
        ${eyes(71, 89, 63, 2.6)}
        <path d="M74 74 Q80 79 86 74" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M76 76 L75 82 L80 80 L85 82 L84 76Z" fill="#e9e2d0"/>
        <path d="M52 98 L36 112 L48 116M108 98 L124 112 L112 116" stroke="${body}" stroke-width="5" stroke-linecap="round"/>
        <path d="M72 128 L66 144 L78 144 L80 130M88 130 L94 144 L104 142 L96 126" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M86 128 Q104 140 98 152" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M98 152 L104 148 L100 158Z" fill="${p.accent}"/>
        <path d="M56 92 Q50 100 54 110M104 92 Q110 100 106 110" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".6"/>`;
      break;
    case 'orc':
      scene = `
        <path d="M48 86 Q46 56 70 50 L96 52 Q118 60 116 88 L112 132 L52 134Z" fill="${body}" stroke="${dark}" stroke-width="2.5"/>
        <path d="M58 56 Q60 34 80 32 Q100 32 104 54 L96 72 L64 72Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M48 70 Q34 74 32 92 L44 106 L56 88Z" fill="${dark}" stroke="${dark}" stroke-width="2"/>
        <path d="M112 70 Q126 74 128 92 L116 106 L104 88Z" fill="${dark}" stroke="${dark}" stroke-width="2"/>
        ${eyes(69, 91, 54, 2.2)}
        <path d="M62 66 L60 78 L70 72M98 66 L100 78 L90 72" stroke="#e7dfcc" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M70 78 Q80 82 90 78" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M54 92 L50 134 L70 134 L72 98M106 92 L112 134 L92 134 L88 98" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M54 94 Q80 104 106 94" stroke="${p.accent}" stroke-width="5" fill="none" opacity=".7"/>
        <circle cx="80" cy="100" r="6" fill="${dark}" stroke="${p.accent}" stroke-width="1.2"/>
        <path d="M30 108 L14 142" stroke="#5c4730" stroke-width="5" stroke-linecap="round"/>
        <path d="M10 130 L22 120 L26 146 L12 154Z" fill="${p.accent}" stroke="${dark}" stroke-width="1.8"/>
        <path d="M52 136 L52 150 L66 150 L68 136M92 136 L94 150 L108 150 L108 136" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M44 152 L68 154M92 154 L116 151" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>
        <path d="M66 44 Q80 36 94 44" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".5"/>`;
      break;
    case 'shaman':
      scene = `
        <path d="M54 82 C46 104 38 128 34 152 L124 154 C118 128 110 104 102 82Z" fill="${body}" stroke="${dark}" stroke-width="2.4"/>
        <path d="M56 84 Q80 72 104 84 L98 100 Q80 108 62 100Z" fill="${dark}" opacity=".6"/>
        <path d="M60 58 Q70 44 82 46 Q96 50 98 66 L94 82 L62 82Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M58 58 Q80 46 102 58 L98 68 Q80 58 62 68Z" fill="${dark}"/>
        ${eyes(70, 88, 66, 1.8)}
        <path d="M70 72 L66 80 L74 78 L80 80 L80 72Z" fill="#e9e2d0" opacity=".85"/>
        <path d="M62 100 C60 116 52 132 48 146M98 100 C102 118 108 132 112 146" stroke="${dark}" stroke-width="2.6" fill="none" opacity=".6"/>
        <path d="M52 86 L40 112 L46 118 L56 100M104 86 L118 110 L112 118 L100 100" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M108 116 L118 60" stroke="#5a442d" stroke-width="4" stroke-linecap="round"/>
        <path d="M118 60 C110 52 112 40 122 38 C132 40 134 52 126 60Z" fill="${eye}" opacity=".8"/>
        <path d="M118 52 Q122 44 126 52 Q124 58 118 58Z" fill="#fff" opacity=".7"/>
        <path d="M60 148 Q80 156 116 150" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>
        <path d="M38 76 Q32 86 34 96M122 76 Q128 86 126 96" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".5"/>`;
      break;
    case 'troll':
      scene = `
        <path d="M46 64 Q52 38 80 38 Q108 38 114 64 L118 110 L110 138 L52 138 L42 108Z" fill="${body}" stroke="${dark}" stroke-width="2.5"/>
        <path d="M58 40 Q62 22 80 22 Q98 22 102 40 L98 56 L62 56Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M52 48 Q40 54 36 70 Q44 78 56 74Z" fill="${dark}"/>
        <path d="M108 48 Q120 54 124 70 Q116 78 104 74Z" fill="${dark}"/>
        ${eyes(69, 91, 40, 2.4)}
        <path d="M68 50 Q80 56 92 50" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M73 52 L71 60 L78 57 L84 60 L82 52Z" fill="#e8dfc8" opacity=".8"/>
        <path d="M48 76 L30 96 L26 138 L44 144 L52 104M112 76 L130 96 L134 138 L116 144 L108 104" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M50 136 L48 152 L68 152 L70 136M92 136 L94 152 L114 152 L112 136" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M42 154 L70 156M92 156 L120 153" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>
        <path d="M58 100 Q80 110 102 100M60 116 Q80 124 100 116" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".4"/>
        <path d="M30 88 Q22 100 24 114M130 88 Q138 100 136 114" stroke="${p.accent}" stroke-width="1.4" fill="none" opacity=".4"/>`;
      break;
    case 'undead':
      scene = `
        <path d="M50 72 Q54 50 80 48 Q106 50 110 72 L104 88 L56 88Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M54 64 Q80 50 106 64 L102 76 Q80 68 58 76Z" fill="${dark}"/>
        ${eyes(68, 92, 66, 2.4)}
        <path d="M72 76 L70 84 L76 82 L80 85 L84 82 L90 84 L88 76Z" fill="#e7e0cf"/>
        <path d="M58 88 L54 126 L70 126 L72 94M102 88 L106 126 L90 126 L88 94" fill="${body}" stroke="${dark}" stroke-width="2.2" opacity=".9"/>
        <path d="M58 90 Q80 100 102 90M64 104 Q80 112 96 104" stroke="#d9d1bd" stroke-width="2.4" fill="none"/>
        <path d="M58 126 C56 138 50 144 44 152M102 126 C104 138 110 144 116 152" stroke="${dark}" stroke-width="3" fill="none"/>
        <path d="M64 132 Q80 140 96 132 L100 148 Q80 158 60 148Z" fill="${dark}" opacity=".45"/>
        <path d="M46 80 L32 96 L38 104 L52 92M114 80 L128 96 L122 104 L108 92" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M44 150 Q80 164 116 150" stroke="${p.accent}" stroke-width="1" fill="none" opacity=".4"/>
        <path d="M62 54 Q80 44 98 54" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".4"/>`;
      break;
    case 'wraith':
      scene = `
        <path d="M52 74 Q54 42 80 40 Q106 42 108 74 L112 120 C104 114 100 126 92 132 C86 120 78 132 72 132 C66 120 58 128 50 118Z" fill="${body}" stroke="${dark}" stroke-width="2.2" opacity=".94"/>
        <path d="M60 68 Q64 54 80 52 Q96 54 100 68 L98 82 Q80 90 62 82Z" fill="#0a0810"/>
        ${eyes(70, 90, 68, 2.4)}
        <path d="M66 60 Q80 52 94 60" stroke="${p.accent}" stroke-width="1" fill="none" opacity=".35"/>
        <path d="M56 84 Q42 92 38 110 L46 118 L60 102M104 84 Q118 92 122 112 L114 120 L100 102" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M70 132 Q74 144 68 154M80 134 Q86 146 82 158M90 130 Q96 140 94 150" stroke="${body}" stroke-width="2" fill="none" opacity=".55"/>
        <path d="M48 118 Q44 132 46 142M112 118 Q116 130 114 140" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".5"/>
        <circle cx="40" cy="82" r="1.4" fill="${eye}" opacity=".7"/><circle cx="122" cy="92" r="1.6" fill="${eye}" opacity=".7"/>
        <path d="M60 44 Q80 30 100 44" stroke="${p.accent}" stroke-width="1" fill="none" opacity=".3"/>`;
      break;
    case 'demon':
      scene = `
        <path d="M58 66 Q34 48 24 72 Q34 86 52 94Z" fill="${dark}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M102 66 Q126 48 136 72 Q126 86 108 94Z" fill="${dark}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M48 88 Q48 58 80 54 Q112 58 112 88 L108 132 L52 132Z" fill="${body}" stroke="${dark}" stroke-width="2.5"/>
        <path d="M58 54 Q58 32 80 30 Q102 32 102 54 L98 64 L62 64Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M62 36 Q52 16 66 26 Q72 32 74 42M98 36 Q108 16 94 26 Q88 32 86 42" fill="${p.accent}" stroke="${dark}" stroke-width="1.6"/>
        ${eyes(70, 90, 48, 2.6)}
        <path d="M70 62 Q80 68 90 62" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M72 62 L70 72 L77 69 L82 72 L82 62Z" fill="#eadfcd" opacity=".85"/>
        <path d="M50 74 Q36 84 34 106 L48 112 L58 94M110 74 Q124 84 126 106 L112 112 L102 94" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M54 132 L50 150 L66 150 L70 132M94 132 L98 150 L114 150 L110 132" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M58 96 Q80 108 102 96M60 112 Q80 122 100 112" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".45"/>
        <path d="M24 76 Q16 88 18 102M136 76 Q144 88 142 102" stroke="${p.accent}" stroke-width="1.4" fill="none" opacity=".5"/>`;
      break;
    case 'knight':
      scene = `
        <path d="M50 68 Q52 42 80 40 Q108 42 110 68 L108 90 L52 90Z" fill="${body}" stroke="${dark}" stroke-width="2.4"/>
        <path d="M56 62 Q80 48 104 62 L102 76 Q80 68 58 76Z" fill="#0a0810"/>
        <path d="M62 68 L70 68M90 68 L98 68" stroke="${eye}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M56 90 Q54 62 80 58 Q106 62 104 90 L110 130 L50 130Z" fill="${body}" stroke="${dark}" stroke-width="2.4"/>
        <path d="M58 92 Q80 82 102 92 L100 116 Q80 126 60 116Z" fill="${dark}" opacity=".55"/>
        <path d="M80 88 L80 126M64 102 Q80 110 96 102" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".6"/>
        <circle cx="80" cy="104" r="5" fill="${dark}" stroke="${p.accent}" stroke-width="1.2"/>
        <path d="M52 96 L38 118 L40 126 L54 112M108 96 L122 118 L120 126 L106 112" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M56 130 L54 152 L70 152 L72 130M92 130 L94 152 L110 152 L108 130" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M48 154 L72 156M92 156 L116 153" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>
        <path d="M122 128 L134 34" stroke="#cbd3df" stroke-width="5" stroke-linecap="round"/>
        <path d="M132 38 L136 18 L140 38 L136 44Z" fill="#eef2f8" stroke="#6f7d90" stroke-width=".8"/>
        <path d="M120 118 L132 112" stroke="${p.accent}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M50 62 Q80 48 110 62" stroke="${p.accent}" stroke-width="1" fill="none" opacity=".4"/>`;
      break;
    case 'drake':
    case 'dragon':
      scene = `
        <path d="M64 72 Q38 40 20 58 Q38 72 40 96Z" fill="${dark}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M96 72 Q122 40 140 58 Q122 72 120 96Z" fill="${dark}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M54 96 Q50 74 70 66 L98 68 Q124 78 120 102 L112 130 L62 132Z" fill="${body}" stroke="${dark}" stroke-width="2.5"/>
        <path d="M84 74 Q84 42 104 44 Q124 48 124 66 L118 82 L96 86Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        ${eyes(103, 117, 58, 2.2)}
        <path d="M120 72 Q134 74 138 82 Q130 84 122 80" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M88 52 Q92 36 102 42 Q106 48 104 56M70 78 Q62 58 74 56" stroke="${p.accent}" stroke-width="1.5" fill="none"/>
        <path d="M58 128 L54 146 L70 146 L74 130M96 130 L100 146 L116 146 L110 126" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M56 82 Q38 92 30 110 L40 114 L56 100" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M78 90 Q94 96 110 90M82 104 Q96 108 108 102" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".4"/>
        <path d="M118 106 Q140 110 144 124 Q136 128 126 120" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <circle cx="100" cy="54" r="1" fill="#fff" opacity=".8"/>`;
      break;
    case 'serpent':
      scene = `
        <path d="M40 128 C28 112 36 92 56 88 L104 78 C126 74 136 90 126 104 C118 114 100 112 94 102" fill="none" stroke="${body}" stroke-width="18" stroke-linecap="round"/>
        <path d="M42 128 C58 122 74 116 92 106" fill="none" stroke="${dark}" stroke-width="4" opacity=".45"/>
        <path d="M104 82 Q96 54 112 44 Q132 40 136 58 Q134 78 118 84Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        ${eyes(118, 128, 58, 2.2)}
        <path d="M132 68 Q142 72 140 78" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M112 44 Q110 30 118 26M124 42 Q128 30 136 32" stroke="${p.accent}" stroke-width="1.4" fill="none"/>
        <path d="M54 96 Q46 88 50 80" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".5"/>
        <circle cx="112" cy="56" r="1.2" fill="#fff" opacity=".7"/>`;
      break;
    case 'seraph':
      scene = `
        <path d="M64 66 Q36 36 18 56 Q34 68 38 94 Q48 82 58 94Z" fill="${body}" stroke="${dark}" stroke-width="2" opacity=".9"/>
        <path d="M96 66 Q124 36 142 56 Q126 68 122 94 Q112 82 102 94Z" fill="${body}" stroke="${dark}" stroke-width="2" opacity=".9"/>
        <path d="M64 72 Q66 50 80 48 Q94 50 96 72 L100 124 Q80 136 60 124Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <circle cx="80" cy="42" r="17" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M64 34 Q80 24 96 34" stroke="${p.accent}" stroke-width="2" fill="none"/>
        ${eyes(73, 87, 42, 1.8)}
        <path d="M58 78 Q44 90 40 110M102 78 Q116 90 120 110" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M60 124 Q68 140 80 138 Q92 140 100 124" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M72 54 L80 62 L88 54" stroke="${p.accent}" stroke-width="1.2" fill="none"/>
        <circle cx="80" cy="78" r="3" fill="${p.accent}" opacity=".8"/>
        <path d="M48 56 Q56 48 62 52M112 56 Q104 48 98 52" stroke="${p.accent}" stroke-width="1" fill="none" opacity=".6"/>
        <circle cx="80" cy="18" r="12" fill="none" stroke="${p.accent}" stroke-width="1.4" opacity=".6"/>`;
      break;
    case 'slime':
      scene = `
        <path d="M36 118 Q34 82 80 76 Q126 82 124 118 Q120 136 80 136 Q40 136 36 118Z" fill="${body}" stroke="${dark}" stroke-width="2.4"/>
        <path d="M56 92 Q60 76 80 74 Q100 76 104 92" fill="${p.accent}" opacity=".3"/>
        ${eyes(66, 94, 104, 3)}
        <path d="M72 118 Q80 124 88 118" stroke="${dark}" stroke-width="2" fill="none"/>
        <circle cx="52" cy="112" r="4" fill="#fff" opacity=".22"/>
        <circle cx="108" cy="98" r="2" fill="${p.accent}" opacity=".5"/>`;
      break;
    case 'raven':
      scene = `
        <path d="M64 84 Q46 58 26 64 Q42 84 50 106 Q30 116 22 134 Q52 132 72 112Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M96 84 Q114 58 134 64 Q118 84 110 106 Q130 116 138 134 Q108 132 88 112Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <ellipse cx="80" cy="96" rx="28" ry="34" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <circle cx="80" cy="64" r="19" fill="${body}" stroke="${dark}" stroke-width="2"/>
        ${eyes(73, 87, 61, 2)}
        <path d="M80 68 L72 74 L80 77 L88 74Z" fill="${p.accent}"/>
        <path d="M70 126 L64 144 L78 142 L80 128M90 128 L96 144 L108 140 L98 124" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M60 90 Q72 98 88 92" stroke="${p.accent}" stroke-width="1" fill="none" opacity=".5"/>`;
      break;
    case 'fox':
      scene = `
        <path d="M62 114 Q38 104 28 82 Q34 102 50 118 Q26 122 18 112 Q34 134 62 128Z" fill="${body}" stroke="${dark}" stroke-width="1.8" opacity=".9"/>
        <path d="M98 114 Q122 104 132 82 Q126 102 110 118 Q134 122 142 112 Q126 134 98 128Z" fill="${body}" stroke="${dark}" stroke-width="1.8" opacity=".9"/>
        <path d="M46 104 Q38 86 34 68 Q50 84 62 96Z" fill="${body}" stroke="${dark}" stroke-width="1.8" opacity=".8"/>
        <path d="M114 104 Q122 86 126 68 Q110 84 98 96Z" fill="${body}" stroke="${dark}" stroke-width="1.8" opacity=".8"/>
        <path d="M56 96 Q56 72 80 68 Q104 72 104 96 L98 124 Q80 134 62 124Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M60 78 Q58 56 72 64 L80 72 L88 64 Q102 56 100 78Z" fill="${body}" stroke="${dark}" stroke-width="2"/>
        ${eyes(71, 89, 84, 2.2)}
        <path d="M76 94 L72 100 L80 102 L88 100 L84 94Z" fill="${p.accent}"/>
        <path d="M56 118 L52 140 L66 140 L70 122M94 122 L98 140 L112 140 L106 118" fill="${body}" stroke="${dark}" stroke-width="2"/>
        <path d="M66 130 Q80 140 94 130" stroke="${dark}" stroke-width="1.4" fill="none" opacity=".5"/>`;
      break;
    case 'horse':
      scene = `
        <path d="M44 104 Q48 78 72 76 L104 80 Q126 88 126 108 L120 130 L54 132Z" fill="${body}" stroke="${dark}" stroke-width="2.5"/>
        <path d="M104 82 Q108 54 122 50 Q136 54 134 74 L128 94Z" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        ${eyes(123, 130, 62, 1.8)}
        <path d="M110 54 L106 40 L116 48M124 48 L132 36 L132 52" fill="${p.accent}" stroke="${dark}" stroke-width="1.6"/>
        <path d="M136 76 Q146 78 146 84" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M56 128 L52 150 L66 150 L72 128M94 128 L98 150 L114 150 L108 126" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        <path d="M36 90 Q26 76 22 84 Q30 94 44 100Z" fill="${dark}" stroke="${dark}" stroke-width="2"/>
        <path d="M56 92 Q80 84 106 92" stroke="${p.accent}" stroke-width="1" fill="none" opacity=".35"/>
        <path d="M118 50 Q122 36 130 34" stroke="${p.accent}" stroke-width="1.2" fill="none" opacity=".5"/>`;
      break;
    default:
      scene = `
        <path d="M42 100 Q44 70 80 68 Q116 70 118 100 L112 132 L48 132Z" fill="${body}" stroke="${dark}" stroke-width="2.4"/>
        <circle cx="80" cy="64" r="22" fill="${body}" stroke="${dark}" stroke-width="2.2"/>
        ${eyes(71, 89, 64, 2.4)}
        <path d="M74 74 Q80 79 86 74" stroke="${dark}" stroke-width="2" fill="none"/>
        <path d="M44 94 L30 118 L42 122 L54 104M116 94 L130 118 L118 122 L106 104" stroke="${body}" stroke-width="6" stroke-linecap="round"/>
        <path d="M58 132 L56 150 L70 150 L72 132M90 132 L92 150 L106 150 L104 132" fill="${body}" stroke="${dark}" stroke-width="2"/>`;
  }

  return `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(visual)}">
    <ellipse cx="80" cy="150" rx="46" ry="7" fill="rgba(0,0,0,.35)"/>
    <circle cx="80" cy="86" r="58" fill="${eye}" opacity=".045"/>
    ${scene}
  </svg>`;
}

export const collectionArt = (visual, palette) => monsterArt(visual, palette);

/* --------------------------------------------------------------------------
   Items
   -------------------------------------------------------------------------- */
const SLOT_GLYPH = {
  weapon: 'sword', armor: 'armor', helmet: 'helm', shield: 'shield', bracelet: 'bracelet',
  earring: 'earring', necklace: 'necklace', shoes: 'boots', belt: 'belt',
};

export function weaponGlyph(item) {
  if (item?.classReq === 'mage') return 'staff';
  if (item?.classReq === 'archer') return 'bow';
  return 'sword';
}

export function itemGlyphName(item) {
  if (!item) return 'sword';
  if (item.slot === 'weapon') return weaponGlyph(item);
  return SLOT_GLYPH[item.slot] || 'spark';
}

export function itemArt(item, size = 48, glyphColor = null) {
  const glyph = itemGlyphName(item);
  const color = glyphColor || item?.themeColor || (item?.rarity === 'divine' ? '#5cf0d1' : '#d9c292');
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="color:${esc(color)}">${glyphBody(glyph)}</svg>`;
}

function glyphBody(name) {
  const map = {
    sword: '<path d="M29 7l12 12-17 17-7-1-1-7L29 7Z"/><path d="m10 29 9 9"/><path d="m7 39 4-4"/><path d="m36 10 2 2"/>',
    staff: '<path d="M10 42 33 11"/><circle cx="36" cy="10" r="5"/><path d="m8 37 5 5"/>',
    bow: '<path d="M11 6c15 5 18 28 5 38"/><path d="M11 6c4 14 4 26 5 38"/><path d="M9 24h30M34 18l6 6-6 6"/>',
    armor: '<path d="M17 6 9 10v10l4 2v20h22V22l4-2V10l-8-4-3 4h-8l-3-4Z"/><path d="M24 10v32"/>',
    helm: '<path d="M10 25a14 14 0 0 1 28 0v15H10V25Z"/><path d="M10 27h28M17 40v-9M31 40v-9"/><path d="M24 6v5"/>',
    shield: '<path d="M24 5 9 11v12c0 10 7 16 15 19 8-3 15-9 15-19V11L24 5Z"/><path d="M18 24l4 5 9-10"/>',
    bracelet: '<circle cx="24" cy="24" r="13"/><circle cx="24" cy="24" r="7"/><path d="m24 5 3 5-3 5-3-5 3-5Z"/>',
    earring: '<path d="M24 6a10 10 0 0 0-10 10c0 6 10 10 10 15"/><path d="m24 30 6 6-6 6-6-6 6-6Z"/>',
    necklace: '<path d="M8 10c0 12 6 18 16 18s16-6 16-18"/><path d="m24 28 6 6-6 6-6-6 6-6Z"/>',
    boots: '<path d="M14 6h9v18l8 6v10H9V30l5-4V6Z"/><path d="M9 34h22M19 14h4"/>',
    belt: '<path d="M5 17h38v14H5V17Z"/><rect x="18" y="14" width="12" height="20" rx="2"/><path d="M22 22h4v4h-4z"/>',
  };
  return map[name] || '<path d="m24 5 5 14 14 5-14 5-5 14-5-14-14-5 14-5 5-14Z"/>';
}

export function slotArt(slot, size = 30) {
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${glyphBody(SLOT_GLYPH[slot] || 'spark')}</svg>`;
}

export function materialArt(iconName, size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${(MATERIAL_PATH[iconName] || MATERIAL_PATH.stone)}</svg>`;
}

const MATERIAL_PATH = {
  stone: '<path d="m8 3 8 1 4 6-3 8-9 3-5-6 1-8 4-4Z"/><path d="m8 3 2 6-4 4M16 4l-1 5 5 1M6 17l4-4 6 5"/>',
  ember: '<path d="M12 2c2 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3 .5 2 2 2 2 4 0-3 2-5 2-10Z"/>',
  scroll: '<path d="M6 4h12v14a2 2 0 0 1-2 2H6"/><path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2"/><path d="M10 8h5M10 12h5"/>',
  scrollRune: '<path d="M6 4h12v14a2 2 0 0 1-2 2H6"/><path d="m10 8 4 4-4 4M14 8l-4 4 4 4"/>',
  orb: '<circle cx="12" cy="12" r="8"/><path d="M12 4c3 3 3 13 0 16M4 12c3-2 13-2 16 0"/>',
  dust: '<path d="M12 3v4M12 17v4M5 12H3M21 12h-2M7 7 5.5 5.5M17 17l1.5 1.5M17 7l1.5-1.5M7 17l-1.5 1.5"/><circle cx="12" cy="12" r="2.5"/>',
  paw: '<ellipse cx="7" cy="7.5" rx="2" ry="2.6"/><ellipse cx="12" cy="5.8" rx="2" ry="2.7"/><ellipse cx="17" cy="7.5" rx="2" ry="2.6"/><path d="M12 10c3.4 0 6 2.1 6 4.7 0 2-2.1 3.3-6 3.3s-6-1.3-6-3.3C6 12.1 8.6 10 12 10Z"/>',
  horseshoe: '<path d="M6 21c-2-4-3-7-3-10a9 9 0 0 1 18 0c0 3-1 6-3 10l-3-1 1-4c1-2 1.5-3.5 1.5-5a4.5 4.5 0 0 0-9 0c0 1.5.5 3 1.5 5l1 4-3 1Z"/>',
  soul: '<path d="M12 3c-4 0-7 2.8-7 6.5 0 2.5 1.4 4.4 3 5.7V19h8v-3.8c1.6-1.3 3-3.2 3-5.7C19 5.8 16 3 12 3Z"/><circle cx="9.5" cy="9.5" r="1.1"/><circle cx="14.5" cy="9.5" r="1.1"/>',
  bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8"/>',
};

export function costumeArt(costume) {
  const col = costume.colors || {};
  const prim = col.primary || '#6d6252';
  const trim = col.trim || '#b59c6e';
  const cloth = col.cloth || '#3e3a32';
  const aura = col.aura || 'rgba(141,108,242,.16)';
  return `<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(costume.name)}">
    <ellipse cx="60" cy="139" rx="34" ry="6" fill="rgba(0,0,0,.4)"/>
    <circle cx="60" cy="68" r="48" fill="${aura}"/>
    <path d="M38 62 Q34 94 26 132 L94 132 Q86 94 82 62Z" fill="${cloth}" stroke="#17121e" stroke-width="1.8"/>
    <path d="M40 64 Q60 54 80 64 L84 92 Q60 102 36 92Z" fill="${prim}" stroke="#17121e" stroke-width="1.6"/>
    <path d="M44 66 Q60 78 76 66 L74 82 Q60 91 46 82Z" fill="${trim}" opacity=".35"/>
    <path d="M50 50 Q60 40 70 50 L72 62 Q60 68 48 62Z" fill="#d2a47c"/>
    <path d="M46 52 Q60 36 74 52 L72 60 Q60 50 48 60Z" fill="${prim}" stroke="#17121e" stroke-width="1.4"/>
    <path d="M38 64 Q26 74 24 90M82 64 Q94 74 96 90" stroke="${prim}" stroke-width="7" stroke-linecap="round"/>
    <path d="M32 92 Q60 102 88 92" stroke="${trim}" stroke-width="2" fill="none" opacity=".7"/>
    <path d="M60 66v30" stroke="${trim}" stroke-width="1" opacity=".4"/>
    <path d="M31 132 L29 140 L44 140 L46 132M74 132 L76 140 L91 140 L89 132" fill="#241b2f"/>
    <circle cx="60" cy="30" r="2" fill="${trim}" opacity=".8"/>
    <path d="M48 28 Q60 20 72 28" stroke="${trim}" stroke-width="1" fill="none" opacity=".45"/>
  </svg>`;
}

/* --------------------------------------------------------------------------
   Regions
   -------------------------------------------------------------------------- */
export function regionArt(region) {
  const pal = region?.palette || {};
  const skyTop = pal.skyTop || '#0c1420';
  const skyBottom = pal.skyBottom || '#1d2a25';
  const mountain = pal.mountain || '#16201f';
  const mountainFar = pal.mountainFar || '#243229';
  const ground = pal.ground || '#131a15';
  const groundFar = pal.groundFar || '#1c261c';
  const accent = pal.accent || '#c3e19a';
  const glow = pal.glow || '#9bdcae';
  const moon = pal.moon || '#e8f0cc';
  const motif = region?.motif || 'forest';
  const skyId = gid('sky');
  const glowId = gid('rg');
  let mid = '';
  if (motif === 'forest') {
    mid = `<g opacity=".9">
      ${[[70, 210, 36], [150, 200, 28], [220, 218, 44], [330, 205, 32], [420, 220, 48], [530, 198, 36], [620, 216, 42], [730, 204, 30], [820, 220, 47]].map(([x, y, h]) => `
        <path d="M${x} ${y - h * 1.8} L${x - h * 0.45} ${y - h} L${x - h * 0.2} ${y - h} L${x - h * 0.6} ${y - h * 0.5} L${x - h * 0.25} ${y - h * 0.5} L${x} ${y} L${x + h * 0.28} ${y - h * 0.5} L${x + h * 0.62} ${y - h * 0.55} L${x + h * 0.25} ${y - h} L${x + h * 0.48} ${y - h} Z" fill="${mountain}" opacity=".85"/>`).join('')}
      <ellipse cx="450" cy="250" rx="620" ry="90" fill="${ground}" opacity=".8"/>
    </g>`;
  } else if (motif === 'crags') {
    mid = `<g>
      <path d="M0 250 L60 150 L120 205 L190 130 L250 210 L320 160 L390 230 L470 140 L540 210 L620 155 L690 220 L770 145 L840 210 L900 170 L900 300 L0 300Z" fill="${mountain}"/>
      <path d="M0 270 L90 220 L180 250 L280 200 L360 255 L450 215 L540 260 L650 205 L740 250 L830 215 L900 245 L900 300 L0 300Z" fill="${ground}"/>
      <path d="M120 244 L190 216 L240 240M470 232 L560 208 L620 238" stroke="${glow}" stroke-width="1" opacity=".3"/>
      <path d="M735 300 Q760 250 790 240 L810 300Z" fill="${glow}" opacity=".12"/>
    </g>`;
  } else if (motif === 'peaks') {
    mid = `<g>
      <path d="M0 260 L100 110 L180 200 L260 80 L350 195 L430 130 L520 230 L620 100 L720 195 L800 140 L900 235 L900 300 L0 300Z" fill="${mountainFar}" opacity=".8"/>
      <path d="M0 280 L80 180 L170 250 L250 150 L340 245 L430 190 L520 260 L620 165 L710 245 L800 200 L900 265 L900 300 L0 300Z" fill="${mountain}"/>
      <path d="M230 166 L250 150 L268 168 L258 163 L250 174 L240 162Z" fill="#e8f6ff" opacity=".7"/>
      <path d="M600 180 L620 165 L640 183 L630 176 L620 190 L610 174Z" fill="#e8f6ff" opacity=".7"/>
      <path d="M70 300 Q160 260 280 300" stroke="${glow}" stroke-width="2" fill="none" opacity=".16"/>
    </g>`;
  } else if (motif === 'pillars') {
    mid = `<g>
      <path d="M0 260 L900 260 L900 300 L0 300Z" fill="${ground}"/>
      ${[80, 230, 390, 560, 730, 860].map((x, i) => `<g opacity="${i % 2 ? .75 : .95}">
        <rect x="${x}" y="${90 + (i % 3) * 22}" width="${36 + (i % 2) * 10}" height="${170 - (i % 3) * 22}" fill="${mountain}"/>
        <rect x="${x - 9}" y="${86 + (i % 3) * 22}" width="${56 + (i % 2) * 10}" height="12" fill="${mountainFar}"/>
        <path d="M${x + 8} ${130 + (i % 3) * 22} h20M${x + 8} ${155 + (i % 3) * 22} h20" stroke="${glow}" stroke-width="1" opacity=".25"/>
      </g>`).join('')}
      <path d="M0 268 Q450 240 900 268" stroke="${glow}" stroke-width="1" fill="none" opacity=".18"/>
    </g>`;
  } else if (motif === 'volcano') {
    mid = `<g>
      <path d="M0 280 L170 200 L260 160 L340 200 L450 120 L560 200 L650 165 L760 210 L900 180 L900 300 L0 300Z" fill="${mountain}"/>
      <path d="M450 120 L500 178 L560 200 L610 260 L700 300 L260 300 L330 245 L390 190Z" fill="${mountainFar}" opacity=".55"/>
      <path d="M430 126 Q450 100 470 124 Q480 140 450 148Z" fill="${glow}" opacity=".55"/>
      <path d="M440 148 Q460 190 430 240 Q470 220 480 180 Q500 220 520 245" stroke="${glow}" stroke-width="2" fill="none" opacity=".45"/>
      <path d="M0 288 Q450 258 900 288" stroke="${glow}" stroke-width="2" fill="none" opacity=".14"/>
    </g>`;
  } else {
    mid = `<g>
      <path d="M0 270 Q140 230 280 255 T560 240 T900 260 L900 300 L0 300Z" fill="${ground}"/>
      <path d="M180 220 Q200 180 250 170 Q290 190 290 230Z" fill="${mountain}" opacity=".8"/>
      <path d="M600 240 Q640 190 710 185 Q760 215 760 250Z" fill="${mountain}" opacity=".7"/>
      <circle cx="720" cy="150" r="38" fill="none" stroke="${accent}" stroke-width="1" opacity=".3"/>
      <circle cx="720" cy="150" r="24" fill="none" stroke="${accent}" stroke-width="1" opacity=".2"/>
      <path d="M0 260 Q450 235 900 260" stroke="${glow}" stroke-width="1" fill="none" opacity=".2"/>
    </g>`;
  }

  return `<svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(region?.name || 'Region')}">
    <defs>
      <linearGradient id="${skyId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/>
      </linearGradient>
      <radialGradient id="${glowId}" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="${glow}" stop-opacity=".26"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="900" height="300" fill="url(#${skyId})"/>
    <circle cx="690" cy="74" r="86" fill="url(#${glowId})"/>
    <circle cx="690" cy="74" r="38" fill="${moon}" opacity=".88"/>
    <circle cx="678" cy="64" r="9" fill="${skyTop}" opacity=".18"/>
    <circle cx="704" cy="86" r="6" fill="${skyTop}" opacity=".15"/>
    <circle cx="702" cy="54" r="3" fill="${skyTop}" opacity=".18"/>
    <path d="M0 205 L90 165 L200 200 L310 150 L430 205 L540 165 L660 205 L780 155 L900 200 L900 300 L0 300Z" fill="${mountainFar}" opacity=".5"/>
    ${mid}
    <g fill="${accent}">
      ${[[80, 60, 1.1], [150, 95, .8], [220, 45, .7], [330, 80, 1], [400, 35, .8], [510, 90, .6], [600, 55, 1.2], [790, 100, .7], [850, 40, .9], [110, 135, .6], [480, 120, .5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" opacity=".55"/>`).join('')}
    </g>
    <g fill="${glow}" opacity=".18">
      <circle cx="250" cy="70" r="2"/><circle cx="560" cy="40" r="2.4"/><circle cx="760" cy="60" r="1.6"/><circle cx="370" cy="130" r="1.4"/>
    </g>
    <rect width="900" height="300" fill="url(#${skyId})" opacity=".12"/>
    <path d="M0 300 L0 262 Q450 240 900 262 L900 300Z" fill="#050409" opacity=".45"/>
  </svg>`;
}

export function logoSigil(size = 44) {
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 3 40 22 61 32 40 42 32 61 24 42 3 32 24 22Z" stroke="#c9a45f" stroke-width="1.4" fill="rgba(201,164,95,.06)"/>
    <path d="M32 11 37 25 51 32 37 39 32 53 27 39 13 32 27 25Z" stroke="#f2d48d" stroke-width="1" opacity=".8"/>
    <circle cx="32" cy="32" r="6.5" fill="#14101c" stroke="#c9a45f" stroke-width="1.2"/>
    <circle cx="32" cy="32" r="2.8" fill="#ff8a4c"/>
    <path d="M32 5v7M32 52v7M5 32h7M52 32h7" stroke="#c9a45f" stroke-width="1" opacity=".55"/>
  </svg>`;
}
