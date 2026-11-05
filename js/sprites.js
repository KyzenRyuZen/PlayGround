/* ============================================================
   AETHERIA — SPRITES: procedural 2.5D pixel-art sprite factory.
   All art is generated at runtime into cached offscreen canvases
   (no external assets). imageSmoothing stays OFF for crisp pixels.
   ============================================================ */
window.SPR = (function () {
  'use strict';
  const cache = new Map();
  const ck = (k, fn) => {
    if (!cache.has(k)) cache.set(k, fn());
    return cache.get(k);
  };

  function mk(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return [c, g];
  }
  const P = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  const skin = '#eab88a', skinD = '#c9925f';

  /* ---------------- helper: shade a hex color ---------------- */
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    r = Math.min(255, Math.max(0, Math.round(r * f)));
    gg = Math.min(255, Math.max(0, Math.round(gg * f)));
    b = Math.min(255, Math.max(0, Math.round(b * f)));
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
  }

  /* ---------------- player sprite ---------------- */
  // cfg: {gender, hair, hairCol, eye, outfit, cls, faction, wings, costume}
  function playerSprite(cfg, frame = 0, wingsOn = false) {
    return ck(`pl_${cfg.gender}${cfg.hair}${cfg.hairCol}${cfg.eye}${cfg.outfit}${cfg.cls}${cfg.costume || ''}_${frame}_${wingsOn}`, () => {
      const [c, g] = mk(34, 26); // wings need extra width; body sits at x=10..20
      const outfit = outfitPalette(cfg);
      const female = cfg.gender === 'female';

      /* --- wings behind (demon/angel) --- */
      if (wingsOn) drawWings(g, cfg.faction);

      const bx = 11; // body left
      /* hair by style */
      const hair = cfg.hairCol;
      drawHair(g, bx, cfg.hair, hair, female);

      /* head */
      P(g, bx + 2, 3, 8, 6, skin);
      P(g, bx + 2, 8, 8, 1, skinD);              // jaw shade
      P(g, bx + 9, 5, 2, 2, cfg.eye);            // eye
      P(g, bx + 9, 5, 1, 1, shade(cfg.eye, 1.4));
      if (female) P(g, bx + 2, 4, 1, 3, hair);   // side lock

      /* torso */
      P(g, bx + 1, 9, 9, 6, outfit.main);
      P(g, bx + 1, 9, 9, 1, outfit.accent);
      P(g, bx + 4, 10, 3, 4, outfit.accent);     // chest emblem
      if (cfg.cls === 'warrior') P(g, bx + 1, 9, 9, 1, '#c9d4e8');
      if (cfg.cls === 'mage') { P(g, bx + 3, 9, 5, 6, shade(outfit.main, .85)); }
      if (cfg.cls === 'assassin') P(g, bx + 2, 10, 2, 4, shade(outfit.main, .7));

      /* arms */
      P(g, bx, 10, 1, 4, outfit.main);           // back arm
      P(g, bx + 10, 10, 1, 4, outfit.main);      // front arm
      P(g, bx + 10, 13, 1, 1, skin);             // hand

      /* skirt (female) */
      if (female) { P(g, bx + 1, 15, 9, 3, outfit.accent); }
      else P(g, bx + 1, 15, 9, 2, shade(outfit.main, .8));

      /* legs + walk frames */
      const boot = '#3a2e24';
      if (frame === 0) {
        P(g, bx + 2, female ? 18 : 17, 2, 4, outfit.legs);
        P(g, bx + 6, female ? 18 : 17, 2, 4, outfit.legs);
        P(g, bx + 2, 21, 2, 1, boot); P(g, bx + 6, 21, 2, 2, boot);
      } else {
        P(g, bx + 1, female ? 18 : 17, 2, 3, outfit.legs);
        P(g, bx + 7, female ? 18 : 17, 2, 4, outfit.legs);
        P(g, bx, 21, 2, 1, boot); P(g, bx + 7, 21, 2, 2, boot);
      }

      /* class weapon in front hand */
      drawWeapon(g, bx, cfg.cls);
      return c;
    });
  }

  function outfitPalette(cfg) {
    // 3 outfits per class + costumes
    const pal = {
      warrior: [['#c98c3f', '#8a5a1e'], ['#c4303f', '#7a1e2a'], ['#9fb2c9', '#5a6a80']],
      mage: [['#7a5fc9', '#4a3590'], ['#3a2e52', '#221a3a'], ['#4f7fc9', '2f5290']],
      assassin: [['#3a4450', '#232a33'], ['#8a2333', '#4d1220'], ['#c46a2a', '#7a3d17']]
    }[cfg.cls][cfg.outfit % 3];
    let main = pal[0], accent = pal[1];
    if (cfg.costume === 'c_royal') { main = '#dcc24a'; accent = '#8a6a1c'; }
    if (cfg.costume === 'c_shade') { main = '#2b2f3d'; accent = '#12151d'; }
    if (cfg.costume === 'c_celes') { main = '#e8e4f5'; accent = '#b5a8d8'; }
    return { main, accent, legs: shade(main, .75) };
  }

  function drawHair(g, bx, style, col, female) {
    const dark = shade(col, .7);
    // top rows always
    P(g, bx + 1, 1, 10, 2, col);
    P(g, bx + 1, 3, 2, 2, col);           // back of head hair
    P(g, bx + 2, 2, 10, 1, dark);
    if (style === 0) { P(g, bx + 9, 3, 2, 1, col); }              // Short
    if (style === 1) { P(g, bx, 3, 3, 8, col); P(g, bx, 11, 3, 1, dark); } // Long (down back)
    if (style === 2) { for (let i = 0; i < 6; i++) P(g, bx - 1 - (i % 2), 3 + i, 2, 2, i % 2 ? dark : col); } // Ponytail
    if (style === 3) { for (let i = 0; i < 5; i++) P(g, bx + 1 + i * 2, i === 4 ? 1 : 0, 1, 2, col); }  // Spiky
    if (style === 4) { P(g, bx, 3, 3, 7, col); for (let i = 0; i < 4; i++) P(g, bx - 1, 4 + i * 2, 1, 2, dark); } // Braid
    if (female) P(g, bx + 2, 1, 10, 1, col);
  }

  function drawWeapon(g, bx, cls) {
    if (cls === 'warrior') {
      P(g, bx + 12, 4, 2, 10, '#c9d4e8'); P(g, bx + 12, 4, 1, 10, '#eef2fa');
      P(g, bx + 11, 13, 4, 2, '#8a6a1c'); P(g, bx + 12, 15, 2, 2, '#4a3524');
    } else if (cls === 'mage') {
      P(g, bx + 12, 2, 2, 14, '#6a4a2a'); P(g, bx + 11, 1, 4, 3, '#7fa2ff');
      P(g, bx + 12, 2, 2, 1, '#c6deff');
    } else {
      P(g, bx + 12, 9, 1, 5, '#c9d4e8'); P(g, bx + 13, 9, 1, 4, '#9aa4b0');
      P(g, bx + 13, 14, 2, 1, '#8a6a1c');
    }
  }

  function drawWings(g, faction) {
    if (faction === 'angel') {
      // large white seraph wing on the back (left of body)
      P(g, 0, 4, 11, 2, '#ffffff'); P(g, 0, 6, 9, 2, '#f2f6ff'); P(g, 0, 8, 7, 2, '#e4ecfa');
      P(g, 0, 10, 5, 2, '#d4e0f2'); P(g, 0, 12, 4, 2, '#eef2ff'); P(g, 0, 14, 6, 2, '#fff');
      P(g, 10, 4, 1, 2, '#c9d4e8'); P(g, 0, 16, 8, 1, '#ffd77a');
    } else {
      P(g, 0, 3, 10, 2, '#3a1e26'); P(g, 0, 5, 8, 2, '#5c2330'); P(g, 0, 7, 6, 2, '#7a2a3a');
      P(g, 0, 9, 5, 2, '#5c2330'); P(g, 0, 11, 7, 2, '#3a1e26'); P(g, 0, 13, 9, 2, '#2a141c');
      P(g, 0, 15, 4, 1, '#c4482f'); P(g, 2, 2, 1, 12, '#8a5a3f'); P(g, 5, 6, 1, 9, '#8a5a3f');
    }
  }

  /* big preview sprite (character creation) — scale x4 */
  function playerPreview(cfg, frame) {
    const base = playerSprite(cfg, frame || 0, true);
    const [c, g] = mk(base.width * 4, base.height * 4);
    g.imageSmoothingEnabled = false;
    g.drawImage(base, 0, 0, c.width, c.height);
    return c;
  }

  /* ---------------- monster sprite ---------------- */
  function monsterSprite(shape, tone, frame = 0, s = 1) {
    return ck(`mo_${shape}${tone}_${frame}`, () => {
      const W = 28, H = 24;
      const [c, g] = mk(W, H);
      const t = tone, d = shade(tone, .6), l = shade(tone, 1.4);
      const x0 = 10;
      if (shape === 'slime') {
        P(g, 6, 14, 12, 6, t); P(g, 4 + (frame ? 1 : 0), 10, 16, 5, t);
        P(g, 5, 8, 14, 3, l); P(g, 19, 14, 1, 6, d); P(g, 3, 18, 18, 2, d);
        P(g, 8, 11, 2, 2, '#101820'); P(g, 14, 11, 2, 2, '#101820');
      } else if (shape === 'wisp') {
        const fy = frame ? -1 : 0;
        P(g, 9, 3 + fy, 6, 6, t); P(g, 10, 2 + fy, 4, 2, l);
        P(g, 10, 5 + fy, 1, 1, '#fff'); P(g, 13, 5 + fy, 1, 1, '#fff');
        P(g, 11, 9 + fy, 2, 3, d); P(g, 9, 12 + fy, 5, 3, frame ? d : t);
        P(g, 8, 14 + fy, 7, 1, frame ? t : d);
      } else if (shape === 'beast') {
        P(g, 5, 6, 14, 6, t); P(g, 17, 4, 6, 5, t); P(g, 19, 3, 3, 1, l);
        P(g, 21, 5, 1, 1, '#ff3a3a');
        P(g, 4, 5, 3, 1, d); P(g, 5, 12, 2, 5 + frame, d); P(g, 16, 12, 2, 5 - frame, d);
        P(g, 1, 8, 4, 2, d); P(g, 19, 6, 1, 2, l);
      } else if (shape === 'human') {
        P(g, 9, 2, 7, 5, t); P(g, 11, 3, 3, 1, '#101820');
        P(g, 8, 7, 9, 8, t); P(g, 8, 7, 9, 2, d);
        P(g, 7, 8, 1, 6, d); P(g, 16, 8, 1, 5, l);
        P(g, 17, 4, 1, 10, '#aab4c0'); P(g, 16, 3, 3, 1, '#8a6a1c');
        P(g, 9, 15, 2, 4 + frame, d); P(g, 13, 15, 2, 4 - frame, d);
      } else if (shape === 'spider') {
        P(g, 8, 10, 10, 7, t); P(g, 10, 8, 6, 4, l);
        P(g, 9, 9, 1, 1, '#ff3a3a'); P(g, 14, 9, 1, 1, '#ff3a3a');
        P(g, 6, 8, 2, 2, d); P(g, 20, 8, 2, 2, d);
        for (let i = 0; i < 4; i++) { const yy = 12 + i * 2; P(g, 4, yy, 5, 1, d); P(g, 19, yy, 5, 1, d); }
        if (frame) { P(g, 3, 15, 3, 1, t); P(g, 22, 13, 3, 1, t); }
      } else if (shape === 'ghost') {
        const fy = frame ? 0 : -1;
        P(g, 8, 2 + fy, 9, 9, t); P(g, 9, 3 + fy, 7, 2, l);
        P(g, 10, 5 + fy, 2, 2, '#40e0ff'); P(g, 14, 5 + fy, 2, 2, '#40e0ff');
        P(g, 8, 11 + fy, 4, 4, frame ? d : t); P(g, 15, 11 + fy, 4, 4, frame ? t : d);
        P(g, 5, 9 + fy, 3, 1, l); P(g, 19, 9 + fy, 3, 1, l);
      } else if (shape === 'brute') {
        P(g, 6, 4, 13, 10, t); P(g, 6, 4, 13, 2, d);
        P(g, 9, 1, 6, 4, l); P(g, 10, 2, 1, 1, '#ff3a3a'); P(g, 13, 2, 1, 1, '#ff3a3a');
        P(g, 3, 5, 3, 8, d); P(g, 20, 5, 3, 8, d);
        P(g, 3, 13, 3, 3, frame ? l : d); P(g, 20, 13, 3, 3, frame ? d : l);
        P(g, 8, 14, 3, 6, d); P(g, 15, 14, 3, 6, d);
      }
      return c;
    });
  }

  /* small canvas scaled by size factor for rendering big bosses */
  function scaledSprite(src, f) {
    return ck(`sc_${src.width}x${src.height}_${f.toFixed(2)}_${src.dataset ? '' : ''}`, () => {
      const [c, g] = mk(Math.round(src.width * f), Math.round(src.height * f));
      g.imageSmoothingEnabled = false;
      g.drawImage(src, 0, 0, c.width, c.height);
      return c;
    });
  }

  // cache scaled variants keyed by source identity
  const scaleCache = new Map();
  function scaled(src, f) {
    const key = src.__id || (src.__id = Math.random().toString(36).slice(2));
    const k = key + f;
    if (!scaleCache.has(k)) {
      const [c, g] = mk(Math.max(1, Math.round(src.width * f)), Math.max(1, Math.round(src.height * f)));
      g.imageSmoothingEnabled = false;
      g.drawImage(src, 0, 0, c.width, c.height);
      scaleCache.set(k, c);
    }
    return scaleCache.get(k);
  }

  /* ---------------- mount sprites ---------------- */
  function mountSprite(id, frame = 0) {
    return ck(`mt_${id}${frame}`, () => {
      const [c, g] = mk(34, 26);
      const b = '#6a4a8a', d = shade(b, .6);
      const pal = {
        mo_courser: ['#c9c9d4', '#8a8a99'], mo_wolf: ['#6a7a8a', '#46525f'],
        mo_drake: ['#c45a2a', '#8a3a1a'], mo_stag: ['#9fc4e8', '#7a9fc4']
      }[id] || ['#c9a06a', '#8a6a4a'];
      if (id === 'mo_courser' || id === 'mo_wolf' || id === 'mo_stag') {
        P(g, 8, 8, 16, 6, pal[0]); P(g, 8, 8, 16, 1, pal[1]);
        P(g, 22, 5, 5, 5, pal[0]); P(g, 25, 7, 1, 1, '#101820');
        P(g, 26, 4, 3, 1, pal[1]);
        P(g, 9, 14, 2, 7 - frame, pal[1]); P(g, 13, 14, 2, 6 + frame, pal[1]);
        P(g, 18, 14, 2, 7 - frame, pal[1]); P(g, 21, 14, 2, 6 + frame, pal[1]);
        P(g, 5, 4, 3, 5, pal[1]);
        if (id === 'mo_stag') { P(g, 25, 1, 1, 4, '#d8c9a0'); P(g, 28, 1, 1, 4, '#d8c9a0'); }
      } else { // drake
        P(g, 8, 9, 15, 6, pal[0]); P(g, 21, 5, 6, 6, pal[0]);
        P(g, 25, 3, 2, 4, pal[1]);
        P(g, 12, 3, 8, 5, pal[1]); P(g, 6, 1, 5, 5, pal[0]);
        P(g, 10, 15, 2, 6 - frame, pal[1]); P(g, 18, 15, 2, 6 + frame, pal[1]);
      }
      return c;
    });
  }

  function petSprite(id, frame = 0) {
    return ck(`pe_${id}${frame}`, () => {
      const [c, g] = mk(14, 12);
      if (id === 'pe_wisp') { P(g, 5, 2 + frame, 5, 5, '#8fd4ff'); P(g, 6, 3 + frame, 2, 2, '#fff'); }
      if (id === 'pe_fox') { P(g, 3, 5, 7, 4, '#e07a3f'); P(g, 9, 3, 3, 3, '#e07a3f'); P(g, 2, 7, 2, 2 + frame, '#e07a3f'); }
      if (id === 'pe_dragonlet') { P(g, 3, 4, 7, 4, '#5fc45f'); P(g, 8, 3, 3, 3, '#5fc45f'); P(g, 5, 1 - frame, 3, 2, '#7fe07f'); }
      if (id === 'pe_moth') { P(g, 6, 5, 2, 3, '#333'); P(g, 3, 3 + frame, 3, 3, '#b58fd8'); P(g, 8, 3 + frame, 3, 3, '#b58fd8'); }
      return c;
    });
  }

  /* ---------------- world props (tiles/deco/buildings) ---------------- */
  function prop(kind, tone) {
    return ck(`pr_${kind}${tone || ''}`, () => {
      const [c, g] = mk(48, 64);
      const t = tone || '#2f6a34';
      if (kind === 'oak') {
        P(g, 21, 30, 6, 26, '#6a4a2a'); P(g, 21, 30, 2, 26, '#8a6a3f');
        P(g, 10, 8, 28, 20, t); P(g, 6, 14, 36, 12, t); P(g, 12, 4, 24, 12, shade(t, 1.15));
        P(g, 8, 16, 6, 4, shade(t, 1.3));
      } else if (kind === 'pine') {
        P(g, 21, 40, 6, 18, '#5a4630');
        for (let i = 0; i < 6; i++) { const w = 30 - i * 4; P(g, 24 - w / 2, 40 - i * 8, w, 9, shade(t, 1 - i * .06 + .1)); }
      } else if (kind === 'palm') {
        P(g, 22, 26, 4, 30, '#8a6a3f'); P(g, 8, 20, 32, 4, t); P(g, 12, 14, 26, 4, shade(t, 1.2)); P(g, 16, 10, 18, 4, t);
      } else if (kind === 'cactus') {
        P(g, 20, 26, 9, 32, t); P(g, 12, 30, 8, 7, t); P(g, 12, 22, 5, 12, t);
        P(g, 29, 36, 7, 7, shade(t, .85)); P(g, 32, 26, 5, 12, t);
      } else if (kind === 'deadtree') {
        P(g, 22, 28, 5, 30, '#4a3a30'); P(g, 10, 14, 14, 4, '#4a3a30'); P(g, 26, 18, 12, 4, '#4a3a30');
        P(g, 12, 6, 4, 10, '#4a3a30'); P(g, 34, 10, 4, 9, '#4a3a30');
      } else if (kind === 'mushroom') {
        P(g, 20, 38, 8, 20, '#c9c0a8'); P(g, 8, 30, 32, 12, tone || '#8fd45f'); P(g, 12, 34, 8, 4, '#fff');
      } else if (kind === 'rock') {
        P(g, 12, 30, 24, 22, t); P(g, 16, 22, 16, 12, shade(t, 1.2)); P(g, 14, 46, 20, 4, shade(t, .6));
      } else if (kind === 'rockbig') {
        P(g, 8, 20, 32, 34, t); P(g, 14, 12, 20, 12, shade(t, 1.18)); P(g, 10, 48, 28, 6, shade(t, .55));
      } else if (kind === 'crystal') {
        P(g, 20, 14, 8, 36, tone || '#8ff5ff'); P(g, 12, 28, 8, 20, shade(tone || '#8ff5ff', .8));
        P(g, 28, 32, 8, 16, shade(tone || '#8ff5ff', 1.2)); P(g, 22, 10, 4, 6, '#ffffff');
      } else if (kind === 'tomb') {
        P(g, 14, 34, 12, 22, '#7a7f8a'); P(g, 12, 26, 16, 10, '#7a7f8a'); P(g, 14, 28, 12, 4, '#9aa4b0');
      } else if (kind === 'lamp') {
        P(g, 22, 30, 4, 26, '#4a464f'); P(g, 18, 22, 12, 10, '#ffdf8f'); P(g, 20, 20, 8, 2, '#4a464f');
      } else if (kind === 'pillar') {
        P(g, 14, 12, 20, 44, '#9aa0c9'); P(g, 12, 10, 24, 6, '#b5bce0'); P(g, 12, 52, 24, 6, '#b5bce0');
        P(g, 22, 12, 4, 44, '#7a7fa8');
      } else if (kind === 'bush') {
        P(g, 12, 34, 24, 14, t); P(g, 16, 28, 16, 8, shade(t, 1.2)); P(g, 20, 40, 8, 4, '#ff6a8a');
      } else if (kind === 'flower') {
        P(g, 22, 44, 3, 10, '#4a8a4a'); P(g, 19, 38, 9, 6, tone || '#ffd77a'); P(g, 21, 40, 3, 2, '#fff');
      } else if (kind === 'house') {
        P(g, 4, 26, 40, 30, '#c9b58f'); P(g, 4, 26, 40, 3, '#8a7558');
        P(g, 0, 12, 48, 14, tone || '#a83a3a'); P(g, 0, 12, 48, 3, shade(tone || '#a83a3a', 1.3));
        P(g, 20, 36, 10, 20, '#5a3a24'); P(g, 9, 32, 8, 8, tone || '#ffdf8f');
      } else if (kind === 'bighouse') {
        P(g, 2, 20, 44, 36, '#b5a084'); P(g, 0, 6, 48, 14, tone || '#4a5f9f');
        P(g, 18, 34, 12, 22, '#4a3220'); P(g, 6, 26, 9, 9, tone || '#ffdf8f'); P(g, 32, 26, 9, 9, tone || '#ffdf8f');
        P(g, 16, 2, 6, 6, '#8a7558'); P(g, 26, 2, 6, 6, '#8a7558');
      } else if (kind === 'tavern') {
        P(g, 2, 18, 44, 38, '#a67c52'); P(g, 0, 8, 48, 12, '#6a4a7f');
        P(g, 20, 32, 12, 24, '#3f2a18'); P(g, 6, 24, 10, 8, '#ffdf8f'); P(g, 31, 24, 10, 8, '#ffdf8f');
        P(g, 14, 10, 20, 8, '#ffdf8f'); P(g, 20, 2, 8, 6, '#6a4a7f');
      } else if (kind === 'forge') {
        P(g, 6, 26, 36, 30, '#7a6a5f'); P(g, 4, 16, 40, 10, '#3a3a3a');
        P(g, 20, 36, 12, 20, '#ff8f3f'); P(g, 22, 40, 8, 12, '#ffc46a');
        P(g, 8, 20, 10, 6, '#5a5a5f');
      } else if (kind === 'stall') {
        P(g, 4, 28, 40, 22, '#8a6a4a'); P(g, 2, 16, 44, 12, '#b03a4a'); P(g, 2, 16, 44, 3, '#d85a6a');
        P(g, 8, 32, 8, 6, '#ffd77a'); P(g, 30, 32, 10, 6, '#5fd35f');
      } else if (kind === 'towerdeco') {
        P(g, 12, 6, 24, 52, '#6a6f9f'); P(g, 8, 2, 32, 8, '#8f95c9'); P(g, 18, 18, 8, 10, '#5fc4ff');
        P(g, 18, 36, 8, 10, '#5fc4ff');
      } else if (kind === 'gate') {
        P(g, 8, 14, 32, 44, '#4a4a5f'); P(g, 14, 24, 20, 34, '#101828'); P(g, 16, 26, 16, 30, '#7a4fc4');
        P(g, 12, 8, 24, 8, '#6a6f9f');
      } else if (kind === 'portal') {
        g.beginPath(); g.arc(24, 34, 16, 0, 7); g.fillStyle = '#7a4fc488'; g.fill();
        g.beginPath(); g.arc(24, 34, 12, 0, 7); g.fillStyle = '#b58fff'; g.fill();
        g.beginPath(); g.arc(24, 34, 6, 0, 7); g.fillStyle = '#fff'; g.fill();
      } else if (kind === 'well') {
        P(g, 14, 36, 20, 18, '#8a8f9f'); P(g, 16, 34, 16, 6, '#3a5570'); P(g, 20, 18, 4, 18, '#6a4a2a');
        P(g, 24, 18, 4, 18, '#6a4a2a'); P(g, 14, 14, 20, 5, '#a83a3a');
      } else if (kind === 'banner') {
        P(g, 22, 12, 3, 40, '#6a4a2a'); P(g, 6, 14, 17, 26, '#4a5f9f'); P(g, 6, 40, 17, 6, '#3a4f7f');
        P(g, 10, 18, 9, 9, '#ffd77a');
      }
      return c;
    });
  }

  /* hair style labels helper for creation */
  function flatIcons(list) { return list; }

  return { playerSprite, playerPreview, monsterSprite, scaled, mountSprite, petSprite, prop, shade };
})();
