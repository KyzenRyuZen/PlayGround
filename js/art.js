/* Ashen Oath — hand-built SVG bestiary.
   Each creature is a self-contained illustration using a 240×240 viewBox. */
(function () {
  'use strict';

  const shadow = '<ellipse cx="120" cy="222" rx="68" ry="11" fill="#000" opacity=".55"/>';

  function wraith(boss) {
    return `
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hooded wraith">
      <defs>
        <linearGradient id="wrBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#435459"/><stop offset=".55" stop-color="#202d31"/><stop offset="1" stop-color="#080c0d"/>
        </linearGradient>
        <linearGradient id="wrEdge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#7b9395"/><stop offset=".6" stop-color="#354548"/><stop offset="1" stop-color="#111718"/>
        </linearGradient>
        <radialGradient id="wrEye"><stop offset="0" stop-color="#fffbe4"/><stop offset=".35" stop-color="#b9e2dd"/><stop offset="1" stop-color="#7fcfbe" stop-opacity="0"/></radialGradient>
        <filter id="wrGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      ${shadow}
      <g opacity=".33" filter="url(#wrGlow)">
        <path d="M63 125C42 144 45 170 27 181M177 125c21 19 18 45 36 56" stroke="#79a5a2" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M87 190c-13 11-17 20-23 29M153 190c13 11 17 20 23 29" stroke="#5c8a87" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      <g>
        <path d="M120 31c-30 0-54 20-60 51-3 16 2 29 7 45 6 19-6 45-16 68 17-9 30-11 43-4 8 4 16 6 26 2 10 4 18 2 26-2 13-7 26-5 43 4-10-23-22-49-16-68 5-16 10-29 7-45-6-31-30-51-60-51Z" fill="url(#wrBody)" stroke="#44575a" stroke-width="1.2"/>
        <path d="M120 38c-23 0-42 17-47 42-2 12 1 22 5 33 6 15 2 35-5 54 11-5 21-6 31-1 9-7 21-7 32 0 10-5 20-4 31 1-7-19-11-39-5-54 4-11 7-21 5-33-5-25-24-42-47-42Z" fill="#11191b" stroke="#526567" stroke-width=".8"/>
        <path d="M78 91c9-21 25-34 42-34s33 13 42 34c-8-5-18-8-27-7l-15 8-15-8c-9-1-19 2-27 7Z" fill="#2c3b3e" opacity=".85"/>
        <path d="M96 62c8-11 16-16 24-16s16 5 24 16" fill="none" stroke="#6e8789" stroke-width="1.2" opacity=".55"/>
        <ellipse cx="103" cy="94" rx="14" ry="9" fill="#a5e5d7" opacity=".24" filter="url(#wrGlow)"/>
        <ellipse cx="137" cy="94" rx="14" ry="9" fill="#a5e5d7" opacity=".24" filter="url(#wrGlow)"/>
        <ellipse cx="103" cy="94" rx="4.2" ry="2.5" fill="#d8fff3"/>
        <ellipse cx="137" cy="94" rx="4.2" ry="2.5" fill="#d8fff3"/>
        <path d="M111 109c6 4 12 4 18 0M115 114c3 2 7 2 10 0" fill="none" stroke="#5e7f7d" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M82 119c-8 7-13 17-14 28M158 119c8 7 13 17 14 28" fill="none" stroke="url(#wrEdge)" stroke-width="6" stroke-linecap="round"/>
        <path d="M67 146c-3 5-4 9-1 12 2 2 5 1 7-2l3-6M173 146c3 5 4 9 1 12-2 2-5 1-7-2l-3-6" fill="none" stroke="#9bb4b2" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M72 166c4 20-3 35-10 46M168 166c-4 20 3 35 10 46M101 181c-3 16 2 27 0 39M139 181c3 16-2 27 0 39" fill="none" stroke="#506a6c" stroke-width="1" opacity=".55"/>
        <path d="M86 141c21 8 47 8 68 0" fill="none" stroke="#2a3b3d" stroke-width="3" opacity=".7"/>
        <circle cx="120" cy="133" r="2" fill="#d8b06c" opacity=".75"/>
      </g>
      ${boss ? `<g opacity=".9"><path d="M92 42 78 18l20 10 9-15M148 42l14-24-20 10-9-15" fill="none" stroke="#8fa9a7" stroke-width="3" stroke-linecap="round"/><circle cx="120" cy="52" r="3" fill="#d7b05f"/><path d="M60 103c-10 2-16 8-18 17M180 103c10 2 16 8 18 17" stroke="#9ec3bc" stroke-width="1" opacity=".5"/></g>` : ''}
    </svg>`;
  }

  function wolf(boss) {
    return `
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Great gloom wolf">
      <defs>
        <linearGradient id="wfMane" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#374835"/><stop offset=".55" stop-color="#1c281c"/><stop offset="1" stop-color="#090e09"/></linearGradient>
        <linearGradient id="wfFur" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#58694b"/><stop offset=".5" stop-color="#2f3e2c"/><stop offset="1" stop-color="#141d14"/></linearGradient>
        <radialGradient id="wfEye"><stop offset="0" stop-color="#f6ffca"/><stop offset=".3" stop-color="#c4e57b"/><stop offset="1" stop-color="#8cb34d" stop-opacity="0"/></radialGradient>
        <filter id="wfGlow"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      ${shadow}
      <g>
        <path d="M119 45 74 25l16 42-27 7 30 31-16 43 62 45 63-45-17-43 31-31-28-7 17-42-46 20Z" fill="url(#wfMane)" stroke="#4b5e3f" stroke-width="1"/>
        <path d="M120 48 83 37l14 35-23 11 25 25-11 38 32 28 33-28-11-38 25-25-23-11 14-35Z" fill="url(#wfFur)" stroke="#718268" stroke-width="1"/>
        <path d="M83 54 66 30l7 36-13 9 23 8" fill="#222f21" stroke="#57694f" stroke-width="1"/>
        <path d="M157 54 174 30l-7 36 13 9-23 8" fill="#222f21" stroke="#57694f" stroke-width="1"/>
        <path d="M95 82c9-10 17-14 25-14s16 4 25 14" fill="none" stroke="#839274" stroke-width="1.2" opacity=".5"/>
        <path d="M89 91c6-7 18-12 31-12s25 5 31 12" fill="#222e20" opacity=".8"/>
        <ellipse cx="100" cy="99" rx="14" ry="8" fill="#a7d96f" opacity=".2" filter="url(#wfGlow)"/>
        <ellipse cx="140" cy="99" rx="14" ry="8" fill="#a7d96f" opacity=".2" filter="url(#wfGlow)"/>
        <path d="M94 96c4-3 9-3 13 0-4 3-9 3-13 0ZM133 96c4-3 9-3 13 0-4 3-9 3-13 0Z" fill="#d9f59e"/>
        <path d="M111 103 95 125l13 9h24l13-9-16-22Z" fill="#303d2b" stroke="#5f6e55" stroke-width="1"/>
        <path d="M104 126h32l-5 10h-22l-5-10Z" fill="#151d15" stroke="#89947d" stroke-width=".8"/>
        <path d="m105 127 5 8 4-8 4 8 5-8M113 144v9M120 146v7M127 144v9" fill="none" stroke="#d5d3b4" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M120 119c4 2 7 4 8 7-4 2-8 2-8 2s-4 0-8-2c1-3 4-5 8-7Z" fill="#0c100c"/>
        <path d="M96 112c-5 4-7 9-7 14M144 112c5 4 7 9 7 14" fill="none" stroke="#66765a" stroke-width="1.5"/>
        <path d="M83 145c-12 5-20 14-23 28M157 145c12 5 20 14 23 28" fill="none" stroke="#293624" stroke-width="12" stroke-linecap="round"/>
        <path d="M68 160c-6 4-11 11-13 19M172 160c6 4 11 11 13 19" fill="none" stroke="#506046" stroke-width="2" stroke-linecap="round"/>
        <path d="M101 72c4 4 8 5 12 4M139 72c-4 4-8 5-12 4" fill="none" stroke="#849275" stroke-width="1" opacity=".55"/>
        <path d="M75 111c8 6 12 13 13 22M165 111c-8 6-12 13-13 22" fill="none" stroke="#4d5e43" stroke-width="1.2" opacity=".6"/>
      </g>
      ${boss ? `<g><path d="M92 48c-10-15-12-29-7-43M148 48c10-15 12-29 7-43" fill="none" stroke="#738467" stroke-width="4" stroke-linecap="round"/><path d="M87 67c-7 13-8 26-4 38M153 67c7 13 8 26 4 38" fill="none" stroke="#708461" stroke-width="1" opacity=".6"/><circle cx="120" cy="87" r="4.5" fill="none" stroke="#b2cf7f" stroke-width="1" opacity=".55"/></g>` : ''}
    </svg>`;
  }

  function leviathan(boss) {
    return `
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Leviathan eye">
      <defs>
        <radialGradient id="lvOrb" cx=".42" cy=".38"><stop offset="0" stop-color="#b7e5df"/><stop offset=".42" stop-color="#377d8c"/><stop offset=".78" stop-color="#123841"/><stop offset="1" stop-color="#06171b"/></radialGradient>
        <radialGradient id="lvIris" cx=".45" cy=".4"><stop offset="0" stop-color="#faffd6"/><stop offset=".42" stop-color="#d3c25e"/><stop offset="1" stop-color="#6a571c" stop-opacity="0"/></radialGradient>
        <linearGradient id="lvTen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fa3a6"/><stop offset="1" stop-color="#0d3035"/></linearGradient>
        <filter id="lvGlow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      ${shadow}
      <g opacity=".62">
        <path d="M93 168c-12 23-39 27-46 54M147 168c12 23 39 27 46 54M74 140c-23 7-38 0-59-9M166 140c23 7 38 0 59-9" fill="none" stroke="url(#lvTen)" stroke-width="9" stroke-linecap="round"/>
        <path d="M91 188c-3 14-11 23-24 29M149 188c3 14 11 23 24 29" fill="none" stroke="#6ca9a9" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
        <path d="M56 128c-18 5-31 0-44-10M184 128c18 5 31 0 44-10" fill="none" stroke="#437f85" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g>
        <circle cx="120" cy="120" r="67" fill="#07191c" stroke="#367079" stroke-width="1.5"/>
        <circle cx="120" cy="120" r="60" fill="url(#lvOrb)"/>
        <path d="M64 95c13-24 35-40 56-40s43 16 56 40c-15-13-35-20-56-20s-41 7-56 20Z" fill="#8ac8c6" opacity=".16"/>
        <circle cx="120" cy="120" r="31" fill="#162b2c" stroke="#a5b873" stroke-width="1"/>
        <circle cx="120" cy="120" r="25" fill="url(#lvIris)"/>
        <ellipse cx="120" cy="120" rx="6" ry="22" fill="#101b12"/>
        <ellipse cx="119" cy="111" rx="2" ry="5" fill="#f7f1cc" opacity=".8"/>
        <path d="M72 95c7 2 13 8 16 16M168 95c-7 2-13 8-16 16" fill="none" stroke="#96dbd2" stroke-width="1.2" opacity=".5"/>
        <path d="M68 151c14 13 30 20 52 20s38-7 52-20" fill="none" stroke="#62aeb0" stroke-width="1.2" opacity=".4"/>
        <path d="M84 56c-5-11-3-22 5-31 2 11 8 17 16 21M156 56c5-11 3-22-5-31-2 11-8 17-16 21" fill="none" stroke="#4e9698" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M38 107c-12 4-21 1-30-7 8 2 14 0 18-6M202 107c12 4 21 1 30-7-8 2-14 0-18-6" fill="none" stroke="#5e9c9b" stroke-width="2" stroke-linecap="round"/>
      </g>
      ${boss ? `<g opacity=".75"><ellipse cx="120" cy="120" rx="82" ry="31" fill="none" stroke="#94c9bd" stroke-width="1" stroke-dasharray="4 12"/><ellipse cx="120" cy="120" rx="31" ry="82" fill="none" stroke="#94c9bd" stroke-width=".8" stroke-dasharray="2 15"/><circle cx="54" cy="62" r="3" fill="#d6e5a4"/><circle cx="190" cy="174" r="2.5" fill="#d6e5a4"/></g>` : ''}
    </svg>`;
  }

  function golem(boss) {
    return `
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Magma forge golem">
      <defs>
        <linearGradient id="glRock" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#5b4b3c"/><stop offset=".46" stop-color="#2d2822"/><stop offset="1" stop-color="#11100e"/></linearGradient>
        <linearGradient id="glRock2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3d31"/><stop offset="1" stop-color="#1b1815"/></linearGradient>
        <radialGradient id="glLava"><stop offset="0" stop-color="#fff3a0"/><stop offset=".35" stop-color="#ff9a3c"/><stop offset="1" stop-color="#c63d18" stop-opacity="0"/></radialGradient>
        <filter id="glGlow"><feGaussianBlur stdDeviation="3.5"/></filter>
      </defs>
      ${shadow}
      <g>
        <path d="M88 190c-13 7-20 17-23 30h43l-4-30ZM152 190c13 7 20 17 23 30h-43l4-30Z" fill="#1b1815" stroke="#3e352d" stroke-width="1"/>
        <path d="M74 88c6-22 23-35 46-35s40 13 46 35l-3 56c-11 28-26 42-43 42s-32-14-43-42l-3-56Z" fill="url(#glRock)" stroke="#665646" stroke-width="1.2"/>
        <path d="M50 93c-14 1-24 10-28 26-3 13 1 26 7 35 5 8 13 12 22 10l16-7-3-39-14-25Z" fill="url(#glRock2)" stroke="#665646" stroke-width="1"/>
        <path d="M190 93c14 1 24 10 28 26 3 13-1 26-7 35-5 8-13 12-22 10l-16-7 3-39 14-25Z" fill="url(#glRock2)" stroke="#665646" stroke-width="1"/>
        <path d="M43 154c-9-4-16 3-17 15-1 11 5 19 14 20 8 1 12-4 12-12v-15l-9-8ZM197 154c9-4 16 3 17 15 1 11-5 19-14 20-8 1-12-4-12-12v-15l9-8Z" fill="#2b251f" stroke="#5a4a3b" stroke-width="1"/>
        <path d="M85 93c7-15 20-24 35-24s28 9 35 24l-5 19c-8-10-18-15-30-15s-22 5-30 15l-5-19Z" fill="#393128" stroke="#705d48" stroke-width="1"/>
        <path d="M99 87c5-6 12-9 21-9s16 3 21 9" fill="none" stroke="#9a7754" stroke-width="1.4" opacity=".6"/>
        <path d="M98 98c4 3 8 4 12 3M142 98c-4 3-8 4-12 3" fill="none" stroke="#120d09" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="104" cy="99" r="6" fill="#ff963e" opacity=".24" filter="url(#glGlow)"/>
        <circle cx="136" cy="99" r="6" fill="#ff963e" opacity=".24" filter="url(#glGlow)"/>
        <circle cx="104" cy="99" r="1.8" fill="#ffe4a1"/>
        <circle cx="136" cy="99" r="1.8" fill="#ffe4a1"/>
        <path d="M103 114h34l-5 13h-24l-5-13Z" fill="#17120e" stroke="#7a5f44" stroke-width="1"/>
        <path d="M105 116h30M113 127v-10M120 127v-10M127 127v-10" stroke="#d47735" stroke-width="1" opacity=".65"/>
        <path d="m88 122-9 12 7 6-10 12 8 5-5 10M152 122l9 12-7 6 10 12-8 5 5 10M116 130l-5 11 8 8-6 9M131 136l7 8-6 12" fill="none" stroke="#ff7f32" stroke-width="2.1" stroke-linecap="round" filter="url(#glGlow)"/>
        <path d="m88 122-9 12 7 6-10 12 8 5-5 10M152 122l9 12-7 6 10 12-8 5 5 10M116 130l-5 11 8 8-6 9M131 136l7 8-6 12" fill="none" stroke="#ffd280" stroke-width=".9" stroke-linecap="round"/>
        <path d="M75 175c8 10 17 18 27 22M165 175c-8 10-17 18-27 22" fill="none" stroke="#e06c32" stroke-width="1.5" opacity=".5"/>
        <path d="M61 38c5 5 11 7 18 5M179 45c5 0 9-3 12-7" fill="none" stroke="#e18c4f" stroke-width="2" opacity=".35"/>
      </g>
      ${boss ? `<g><path d="M73 57 53 25l31 17 7-26M167 57l20-32-31 17-7-26" fill="none" stroke="#8c6a4d" stroke-width="4" stroke-linecap="round"/><path d="M68 142c-11 3-18 11-20 23M172 142c11 3 18 11 20 23" fill="none" stroke="#ff9d4f" stroke-width="1.5" opacity=".5"/></g>` : ''}
    </svg>`;
  }

  function reaper(boss) {
    return `
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Frozen reaper">
      <defs>
        <linearGradient id="rpRobe" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#344a59"/><stop offset=".5" stop-color="#182832"/><stop offset="1" stop-color="#070d11"/></linearGradient>
        <linearGradient id="rpSteel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0f2f6"/><stop offset=".4" stop-color="#7792a2"/><stop offset="1" stop-color="#2b3d48"/></linearGradient>
        <radialGradient id="rpEye"><stop offset="0" stop-color="#efffff"/><stop offset=".4" stop-color="#7bd7ef"/><stop offset="1" stop-color="#2d9fc4" stop-opacity="0"/></radialGradient>
        <filter id="rpGlow"><feGaussianBlur stdDeviation="3.5"/></filter>
      </defs>
      ${shadow}
      <g>
        <path d="M190 17c-11 2-18 8-23 18l-16 29 15 8 17-31c5-9 11-15 20-19l10-4-9-4-14 3Z" fill="url(#rpSteel)" stroke="#8ba7b4" stroke-width="1"/>
        <path d="M168 77c-6-2-12 0-16 6M180 62c-3-6-2-11 2-16" fill="none" stroke="#b3ccd4" stroke-width="1" opacity=".5"/>
        <path d="M120 48c-29 0-50 21-54 48-2 14 2 24 7 36 6 16 0 38-9 59 14-7 26-8 37-2 9 5 19 5 28 0 11-6 23-5 37 2-9-21-15-43-9-59 5-12 9-22 7-36-4-27-25-48-54-48Z" fill="url(#rpRobe)" stroke="#4d6c7a" stroke-width="1.2"/>
        <path d="M120 55c-22 0-39 17-43 42-1 10 2 19 6 29 5 14 1 32-4 48 9-3 17-3 25 1 7-5 15-5 22 0 8-4 16-4 25-1-5-16-9-34-4-48 4-10 7-19 6-29-4-25-21-42-43-42Z" fill="#0b151a" stroke="#5d808e" stroke-width=".8"/>
        <path d="M91 84c9-12 19-18 29-18s20 6 29 18c-8-4-17-6-25-5l-4 7-4-7c-8-1-17 1-25 5Z" fill="#2c4550" opacity=".8"/>
        <path d="M101 103c3-4 7-6 11-5 4-1 8 1 11 5-2 8-6 12-11 12s-9-4-11-12Z" fill="#081013" stroke="#7695a2" stroke-width=".7"/>
        <circle cx="105" cy="104" r="6" fill="#77dbee" opacity=".22" filter="url(#rpGlow)"/>
        <circle cx="135" cy="104" r="6" fill="#77dbee" opacity=".22" filter="url(#rpGlow)"/>
        <circle cx="105" cy="104" r="2" fill="#d8ffff"/>
        <circle cx="135" cy="104" r="2" fill="#d8ffff"/>
        <path d="M112 124c5 2 11 2 16 0M116 128v5M120 129v6M124 128v5" fill="none" stroke="#6f8e9c" stroke-width="1" stroke-linecap="round"/>
        <path d="M91 145c-8 7-12 16-13 27M149 145c8 7 12 16 13 27" fill="none" stroke="#38525e" stroke-width="6" stroke-linecap="round"/>
        <path d="M78 172c-5 15-12 26-22 34M162 172c5 15 12 26 22 34M102 190c-2 11-6 20-13 27M138 190c2 11 6 20 13 27" fill="none" stroke="#668894" stroke-width="1" opacity=".35"/>
        <path d="M68 132c-4 10-5 18-2 26M172 132c4 10 5 18 2 26" fill="none" stroke="#9dbec9" stroke-width="1.2" opacity=".4"/>
        <path d="M184 93c5 6 12 9 20 9M164 113c6 1 11 5 14 10" fill="none" stroke="#8ba6b1" stroke-width="1" opacity=".4"/>
      </g>
      <g opacity=".72">
        <path d="M45 155 35 132l17 12-3-27 19 24M195 155l10-23-17 12 3-27-19 24" fill="#486a78" stroke="#8eb6c3" stroke-width="1"/>
        <path d="M48 92 58 73l4 19M189 99l-3-20-12 16" fill="none" stroke="#98c4cf" stroke-width="1.3"/>
      </g>
      ${boss ? `<g><path d="M74 57 51 36l26 5-2-26 20 30M166 57l23-21-26 5 2-26-20 30" fill="none" stroke="#a3c8d3" stroke-width="3" stroke-linecap="round"/><ellipse cx="120" cy="121" rx="76" ry="25" fill="none" stroke="#89bdcb" stroke-width=".8" stroke-dasharray="3 10" opacity=".6"/></g>` : ''}
    </svg>`;
  }

  function voidling(boss) {
    return `
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Void eye">
      <defs>
        <radialGradient id="vdOrb" cx=".42" cy=".38"><stop offset="0" stop-color="#e5d8ff"/><stop offset=".26" stop-color="#a982dc"/><stop offset=".65" stop-color="#47256f"/><stop offset="1" stop-color="#100619"/></radialGradient>
        <radialGradient id="vdIris" cx=".45" cy=".42"><stop offset="0" stop-color="#fff5d5"/><stop offset=".3" stop-color="#d6a6ff"/><stop offset="1" stop-color="#4c1e7d" stop-opacity="0"/></radialGradient>
        <linearGradient id="vdTen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bd8fff"/><stop offset="1" stop-color="#35104e"/></linearGradient>
        <filter id="vdGlow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      ${shadow}
      <g opacity=".7">
        <path d="M90 165c-16 20-41 21-52 49M150 165c16 20 41 21 52 49M72 130c-24 7-41 0-63-11M168 130c24 7 41 0 63-11" fill="none" stroke="url(#vdTen)" stroke-width="8" stroke-linecap="round"/>
        <path d="M91 185c-4 14-12 23-25 30M149 185c4 14 12 23 25 30" fill="none" stroke="#c59ef4" stroke-width="1" stroke-linecap="round" opacity=".45"/>
      </g>
      <g>
        <ellipse cx="120" cy="120" rx="82" ry="32" fill="none" stroke="#7950a0" stroke-width="1" stroke-dasharray="7 11" transform="rotate(-18 120 120)" opacity=".7"/>
        <ellipse cx="120" cy="120" rx="88" ry="26" fill="none" stroke="#5b3979" stroke-width=".8" stroke-dasharray="2 13" transform="rotate(23 120 120)" opacity=".6"/>
        <circle cx="120" cy="120" r="61" fill="#0b0411" stroke="#6e4293" stroke-width="1.4"/>
        <circle cx="120" cy="120" r="54" fill="url(#vdOrb)"/>
        <path d="M73 96c14-21 31-32 47-32s33 11 47 32c-14-11-30-17-47-17s-33 6-47 17Z" fill="#d3b6ff" opacity=".18"/>
        <circle cx="120" cy="120" r="27" fill="#150921" stroke="#8c5eb5" stroke-width=".8"/>
        <circle cx="120" cy="120" r="21" fill="url(#vdIris)"/>
        <ellipse cx="120" cy="120" rx="5" ry="19" fill="#100515"/>
        <ellipse cx="118" cy="111" rx="1.7" ry="4.5" fill="#f5eaff"/>
        <g fill="#d7b6ff">
          <circle cx="66" cy="83" r="1.8"/><circle cx="178" cy="90" r="1.3"/><circle cx="59" cy="154" r="1.2"/>
          <circle cx="185" cy="160" r="1.8"/><circle cx="120" cy="44" r="1.2"/><circle cx="146" cy="193" r="1.4"/>
        </g>
        <path d="M72 118c-3-12 0-24 9-34M168 118c3-12 0-24-9-34" fill="none" stroke="#a77be0" stroke-width="1.2" opacity=".45"/>
        <path d="M42 120c12 6 24 7 35 3M198 120c-12 6-24 7-35 3" fill="none" stroke="#7c50a4" stroke-width="2" stroke-linecap="round" opacity=".5"/>
      </g>
      ${boss ? `<g><ellipse cx="120" cy="120" rx="100" ry="48" fill="none" stroke="#a97de0" stroke-width=".8" stroke-dasharray="4 15" transform="rotate(48 120 120)" opacity=".55"/><path d="M81 80c-10-14-13-28-8-42M159 80c10-14 13-28 8-42" fill="none" stroke="#b68ced" stroke-width="2.5" stroke-linecap="round"/><circle cx="120" cy="120" r="37" fill="none" stroke="#d8b6ff" stroke-width=".7" opacity=".5"/></g>` : ''}
    </svg>`;
  }

  function dragon(boss) {
    return `
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dragon">
      <defs>
        <linearGradient id="drScale" x1=".15" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#9a5b3d"/><stop offset=".45" stop-color="#582b20"/><stop offset="1" stop-color="#1c0d0a"/></linearGradient>
        <linearGradient id="drHorn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0b98e"/><stop offset="1" stop-color="#5e3a28"/></linearGradient>
        <radialGradient id="drEye"><stop offset="0" stop-color="#fffbd4"/><stop offset=".3" stop-color="#ffd34d"/><stop offset="1" stop-color="#e56d27" stop-opacity="0"/></radialGradient>
        <radialGradient id="drFire"><stop offset="0" stop-color="#ffeeb1" stop-opacity=".9"/><stop offset=".5" stop-color="#ff7b2f" stop-opacity=".35"/><stop offset="1" stop-color="#a31f0a" stop-opacity="0"/></radialGradient>
        <filter id="drGlow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      ${shadow}
      <g opacity=".3" filter="url(#drGlow)"><ellipse cx="120" cy="204" rx="78" ry="24" fill="#ff7b2f"/></g>
      <g>
        <path d="M84 205c-6-17 2-34 16-43l40-1c14 9 22 26 16 44l-20 8H104l-20-8Z" fill="url(#drScale)" stroke="#7b4631" stroke-width="1"/>
        <path d="M112 70c-17 8-28 24-31 44-3 22 5 43 20 55 8 6 18 9 28 7 24-4 42-24 47-49 5-26-8-51-32-60-11-4-22-3-32 3Z" fill="url(#drScale)" stroke="#814a33" stroke-width="1.2"/>
        <path d="M136 61c16-6 29-17 37-33-18 7-34 7-49 2l12 31ZM92 65C78 51 66 43 49 42c14 10 21 23 23 40l20-17Z" fill="url(#drHorn)" stroke="#76513a" stroke-width="1"/>
        <path d="M168 65c13-12 22-26 24-44-12 12-25 19-41 21l17 23ZM70 82C53 77 38 76 21 82c16 3 28 11 38 24l11-24Z" fill="url(#drHorn)" stroke="#704832" stroke-width="1"/>
        <path d="M79 142c15 15 38 21 58 15 17-5 30-17 37-33-16 10-34 15-53 14-17-1-31-5-42 4Z" fill="#2a1510" stroke="#8c5139" stroke-width="1"/>
        <path d="M78 133c19 12 43 15 65 8 15-5 26-13 34-24-5 18-17 33-34 40-23 9-49 2-65-24Z" fill="#3d1e16" stroke="#8a4f37" stroke-width=".8"/>
        <path d="M89 142c7 3 14 4 21 3M121 145c8 0 16-2 23-5" fill="none" stroke="#b87550" stroke-width="1" opacity=".55"/>
        <path d="M94 124c9-4 19-5 28-2M130 121c10 1 19 5 26 11" fill="none" stroke="#9b6041" stroke-width="1" opacity=".5"/>
        <path d="M72 108c12-18 29-29 48-31M90 86c9-8 20-12 32-12" fill="none" stroke="#c7865e" stroke-width="1" opacity=".4"/>
        <path d="M103 99c10-5 20-4 28 1-5 9-13 14-22 13-6-2-8-6-6-14Z" fill="#f5c83b" opacity=".18" filter="url(#drGlow)"/>
        <path d="M109 99c5-2 10-1 14 2-3 4-7 5-11 3-3-1-4-3-3-5Z" fill="#f7d35f"/>
        <ellipse cx="116" cy="101" rx="1.4" ry="4" fill="#20110a"/>
        <path d="M142 94c8-3 15-2 21 2" fill="none" stroke="#d79769" stroke-width="1.3" opacity=".55"/>
        <path d="M92 151c-10 10-16 23-17 38M159 151c4 11 4 23-1 35" fill="none" stroke="#7a4631" stroke-width="1" opacity=".6"/>
        <g fill="#dbc7a2">
          <path d="m91 148 6 12 5-13M112 154l5 13 6-14M134 154l4 12 6-13M154 148l3 11 7-14"/>
        </g>
        <path d="M112 181c16 7 33 6 48-3" fill="none" stroke="#9d6648" stroke-width="1" opacity=".5"/>
        <path d="M39 199c-9-8-15-18-18-29 8 7 17 10 25 10M201 199c9-8 15-18 18-29-8 7-17 10-25 10" fill="none" stroke="#5e3224" stroke-width="3" stroke-linecap="round"/>
      </g>
      ${boss ? `<g><path d="M51 192c-4 13-13 23-25 31M189 192c4 13 13 23 25 31" fill="none" stroke="#874a30" stroke-width="1.4" opacity=".6"/><ellipse cx="120" cy="120" rx="98" ry="34" fill="none" stroke="#a56542" stroke-width=".8" stroke-dasharray="5 14" transform="rotate(-24 120 120)" opacity=".45"/><circle cx="55" cy="56" r="2" fill="#f0b06b"/><circle cx="186" cy="118" r="1.6" fill="#f0b06b"/></g>` : ''}
    </svg>`;
  }

  function ashKing(boss) {
    return `
    <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ashen King">
      <defs>
        <linearGradient id="akArmor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6e6150"/><stop offset=".4" stop-color="#39352f"/><stop offset="1" stop-color="#121212"/></linearGradient>
        <linearGradient id="akCrown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2d194"/><stop offset=".55" stop-color="#b17d3e"/><stop offset="1" stop-color="#5f3c1b"/></linearGradient>
        <linearGradient id="akCape" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#4a1f19"/><stop offset="1" stop-color="#160807"/></linearGradient>
        <radialGradient id="akEye"><stop offset="0" stop-color="#fff4c2"/><stop offset=".35" stop-color="#ffc24e"/><stop offset="1" stop-color="#d65c21" stop-opacity="0"/></radialGradient>
        <filter id="akGlow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      ${shadow}
      <g opacity=".4" filter="url(#akGlow)"><ellipse cx="120" cy="206" rx="82" ry="25" fill="#d48738"/></g>
      <g>
        <path d="M76 116c-26 6-37 26-40 53-2 21 2 37 9 51l41-12-10-92ZM164 116c26 6 37 26 40 53 2 21-2 37-9 51l-41-12 10-92Z" fill="url(#akCape)" stroke="#57271f" stroke-width="1"/>
        <path d="M78 112c9-25 24-38 42-38s33 13 42 38l-4 67c-10 19-22 29-38 29s-28-10-38-29l-4-67Z" fill="url(#akArmor)" stroke="#89765c" stroke-width="1.2"/>
        <path d="M62 111c-17-2-29 6-35 20-5 12-4 24 1 33 6 10 15 14 25 11l17-8-8-56ZM178 111c17-2 29 6 35 20 5 12 4 24-1 33-6 10-15 14-25 11l-17-8 8-56Z" fill="#302b25" stroke="#796952" stroke-width="1"/>
        <path d="M61 121c-9 0-16 7-19 18-2 9-1 17 3 23 3 5 8 6 12 4l10-6-6-39ZM179 121c9 0 16 7 19 18 2 9 1 17-3 23-3 5-8 6-12 4l-10-6 6-39Z" fill="#1c1a17" stroke="#5e5142" stroke-width=".8"/>
        <path d="M86 83c7-18 19-28 34-28s27 10 34 28l-3 19c-9-13-19-19-31-19s-22 6-31 19l-3-19Z" fill="#39332b" stroke="#7d6c55" stroke-width="1"/>
        <path d="M94 91c3-5 7-7 12-7 3-4 8-6 14-6s11 2 14 6c5 0 9 2 12 7l-2 13c-6-5-13-8-24-8s-18 3-24 8l-2-13Z" fill="#c4baa3" stroke="#766d5d" stroke-width=".7"/>
        <path d="M100 92c4 2 7 2 10 0M130 92c3 2 6 2 10 0" fill="none" stroke="#3c342a" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="105" cy="93" r="6" fill="#f7b746" opacity=".25" filter="url(#akGlow)"/>
        <circle cx="135" cy="93" r="6" fill="#f7b746" opacity=".25" filter="url(#akGlow)"/>
        <path d="M108 93h-4M132 93h4" stroke="#ffd176" stroke-width="1" opacity=".7"/>
        <path d="M110 108h20l-2 8h-16l-2-8Z" fill="#161412" stroke="#7a6e5d" stroke-width=".7"/>
        <path d="M106 120c9 3 19 3 28 0M113 127v5M120 128v6M127 127v5" fill="none" stroke="#8e8575" stroke-width="1" stroke-linecap="round"/>
        <path d="M93 134c9 8 18 12 27 12s18-4 27-12" fill="none" stroke="#5d5345" stroke-width="1" opacity=".6"/>
        <path d="M74 152c-1 17 1 31 6 42M166 152c1 17-1 31-6 42" fill="none" stroke="#8b7555" stroke-width="1" opacity=".5"/>
        <path d="m104 133-4 14 8 6-6 9M136 133l4 14-8 6 6 9" fill="none" stroke="#d58f46" stroke-width="1.3" opacity=".4"/>
        <path d="M84 112c9-4 17-4 25 0M156 112c-9-4-17-4-25 0" fill="none" stroke="#a38b68" stroke-width="1.1" opacity=".5"/>
        <path d="M175 152c11 6 15 18 12 36-2 12-7 20-13 26l9 6c11-8 17-22 17-39 0-17-7-28-17-34l-8 5Z" fill="#c8bda7" stroke="#766e60" stroke-width=".8"/>
        <path d="M177 153c3 3 5 8 5 15l-10 2-1-12 6-5Z" fill="#3e372e"/>
        <path d="M181 157v58" stroke="#d6c9ad" stroke-width="2"/>
        <path d="M181 211h-7l7 16 7-16h-7Z" fill="#c4b696"/>
      </g>
      <g>
        <path d="M82 57 74 22l18 15 9-25 11 23 8-23 9 25 18-15-8 35H82Z" fill="url(#akCrown)" stroke="#d3ae72" stroke-width="1"/>
        <path d="M85 58h51v11H85z" fill="#6c4c27" stroke="#c69d5e" stroke-width=".8"/>
        <circle cx="98" cy="40" r="2.2" fill="#efca80"/><circle cx="120" cy="35" r="2.2" fill="#efca80"/><circle cx="142" cy="40" r="2.2" fill="#efca80"/>
        <path d="M84 65c5 0 9 3 12 7M137 65c-5 0-9 3-12 7" fill="none" stroke="#b88d51" stroke-width="1"/>
      </g>
      ${boss ? `<g opacity=".6"><path d="M47 199c-8 8-14 17-18 29M193 199c8 8 14 17 18 29" fill="none" stroke="#e19a49" stroke-width="1.2" stroke-linecap="round"/><path d="M57 81c-13-2-23 3-30 13M183 81c13-2 23 3 30 13" fill="none" stroke="#d9a15a" stroke-width="1" opacity=".5"/></g>` : ''}
    </svg>`;
  }

  const ART = { wraith, wolf, leviathan, golem, reaper, void: voidling, dragon, king: ashKing };

  window.MonsterArt = {
    get(art, boss) {
      const fn = ART[art] || ART.wraith;
      return fn(!!boss);
    }
  };
})();
