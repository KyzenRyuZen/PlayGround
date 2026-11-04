/**
 * Procedural pixel art. Every tile and sprite is drawn once into a small
 * offscreen canvas, then blitted with nearest-neighbour scaling at runtime.
 */
import { createCanvas, mulberry32 } from "./util.js";

const C = {
  outline: "#2b2634",
  outlineDeep: "#1f2d26",
  grass: "#5aa552",
  grassDark: "#4b9248",
  grassLight: "#6db95d",
  grassHi: "#84c66b",
  grassDeep: "#3e7f40",
  path: "#c6a169",
  pathDark: "#ae8954",
  pathLight: "#d8b77c",
  pathHi: "#e6cc93",
  dirt: "#b7935f",
  dirtDark: "#9c7b4e",
  water: "#3b7d8d",
  waterDark: "#2f6978",
  waterLight: "#4f95a2",
  waterHi: "#74b1b6",
  sand: "#cbb37d",
  sandDark: "#b39964",
  bark: "#6b4a32",
  barkDark: "#4c3425",
  barkLight: "#835d3d",
  leaf: "#2f7047",
  leafMid: "#3c8b4f",
  leafLight: "#57aa5c",
  leafHi: "#7cc36a",
  stone: "#9b9c91",
  stoneDark: "#6f7269",
  stoneLight: "#b9b9a8",
  cream: "#ecdaae",
  creamDark: "#d5bf8e",
  timber: "#7b5134",
  timberDark: "#583722",
  roof: "#b75c47",
  roofDark: "#884034",
  roofLight: "#d27a5c",
  slate: "#58718a",
  slateDark: "#3d5268",
  slateLight: "#7890a4",
  glow: "#ffd889",
  glowSoft: "#f7c264",
  cloak: "#b04a3d",
  cloakDark: "#84362f",
  cloakLight: "#ce6450",
  skin: "#f2c79a",
  skinDark: "#d7a172",
  hair: "#7e4035",
  hairLight: "#a95c48",
  tunic: "#f1dfb6",
  tunicDark: "#d8c18f",
  leather: "#6b4631",
  gold: "#e9bd68",
};

const rect = (ctx, x, y, w, h, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const outlineRect = (ctx, x, y, w, h, fill, line = C.outline) => {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, line);
  rect(ctx, x, y, w, h, fill);
};

function pixelEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    ctx.fillRect(Math.round(cx - span), Math.round(cy + y), Math.max(1, span * 2 + 1), 1);
  }
}

function pixelCircle(ctx, cx, cy, r, color) {
  pixelEllipse(ctx, cx, cy, r, r, color);
}

/* ------------------------------------------------------------------ */
/* Ground tiles                                                        */
/* ------------------------------------------------------------------ */

function grassTile(rng) {
  const { canvas, ctx } = createCanvas(16, 16);
  rect(ctx, 0, 0, 16, 16, C.grass);
  const patches = 9 + Math.floor(rng() * 5);
  for (let i = 0; i < patches; i++) {
    const x = Math.floor(rng() * 15);
    const y = Math.floor(rng() * 15);
    const w = 1 + Math.floor(rng() * 3);
    const h = 1 + Math.floor(rng() * 2);
    const tone = rng();
    rect(ctx, x, y, w, h, tone < 0.34 ? C.grassDark : tone < 0.7 ? C.grassLight : C.grassHi);
  }
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(rng() * 13);
    const y = 3 + Math.floor(rng() * 11);
    rect(ctx, x, y, 1, 2, C.grassDeep);
    rect(ctx, x + 1, y - 1, 1, 1, C.grassHi);
  }
  return canvas;
}

function pathTile(rng) {
  const { canvas, ctx } = createCanvas(16, 16);
  rect(ctx, 0, 0, 16, 16, C.path);
  for (let i = 0; i < 17; i++) {
    const x = Math.floor(rng() * 15);
    const y = Math.floor(rng() * 15);
    const w = 1 + Math.floor(rng() * 3);
    const h = 1 + Math.floor(rng() * 2);
    const tone = rng();
    rect(ctx, x, y, w, h, tone < 0.36 ? C.pathDark : tone < 0.72 ? C.pathLight : C.pathHi);
  }
  for (let i = 0; i < 3; i++) {
    const x = 2 + Math.floor(rng() * 11);
    const y = 2 + Math.floor(rng() * 11);
    rect(ctx, x, y, 2, 1, rng() > 0.5 ? "#9c7c4e" : "#e8cf9a");
  }
  return canvas;
}

function dirtTile(rng) {
  const { canvas, ctx } = createCanvas(16, 16);
  rect(ctx, 0, 0, 16, 16, C.dirt);
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rng() * 15);
    const y = Math.floor(rng() * 15);
    rect(ctx, x, y, 1 + Math.floor(rng() * 3), 1, rng() > 0.5 ? C.dirtDark : C.pathLight);
  }
  for (let i = 0; i < 2; i++) {
    const x = 3 + Math.floor(rng() * 10);
    const y = 3 + Math.floor(rng() * 10);
    rect(ctx, x, y, 2, 1, "#87693f");
    rect(ctx, x + 1, y - 1, 1, 1, C.pathHi);
  }
  return canvas;
}

function sandTile(rng) {
  const { canvas, ctx } = createCanvas(16, 16);
  rect(ctx, 0, 0, 16, 16, C.sand);
  for (let i = 0; i < 13; i++) {
    rect(
      ctx,
      Math.floor(rng() * 15),
      Math.floor(rng() * 15),
      1 + Math.floor(rng() * 2),
      1,
      rng() > 0.48 ? C.sandDark : "#dac58f"
    );
  }
  return canvas;
}

function waterTile(rng) {
  const { canvas, ctx } = createCanvas(16, 16);
  rect(ctx, 0, 0, 16, 16, C.water);
  for (let i = 0; i < 10; i++) {
    rect(
      ctx,
      Math.floor(rng() * 14),
      Math.floor(rng() * 15),
      2 + Math.floor(rng() * 4),
      1,
      rng() > 0.46 ? C.waterDark : C.waterLight
    );
  }
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(rng() * 11);
    const y = 2 + Math.floor(rng() * 12);
    rect(ctx, x, y, 3, 1, "rgba(190, 232, 226, 0.32)");
  }
  return canvas;
}

export function makeTiles(rngSeed = 11) {
  const rng = mulberry32(rngSeed);
  const make = (fn, count = 5) => Array.from({ length: count }, () => fn(rng));
  return {
    grass: make(grassTile, 6),
    path: make(pathTile, 5),
    dirt: make(dirtTile, 5),
    sand: make(sandTile, 4),
    water: make(waterTile, 4),
  };
}

/* ------------------------------------------------------------------ */
/* Nature                                                              */
/* ------------------------------------------------------------------ */

const canopyBlobs = [
  [23, 20, 13],
  [12, 25, 9],
  [34, 25, 10],
  [18, 32, 9],
  [29, 32, 8],
  [23, 11, 9],
  [31, 16, 8],
  [14, 17, 8],
];

export function makeTree(variant = 0) {
  const rng = mulberry32(300 + variant * 97);
  const { canvas, ctx } = createCanvas(48, 58);
  const ax = 24;
  const ay = 54;
  const palettes = [
    { dark: "#2a5e3d", leaf: "#2f7047", mid: "#3c8b4f", light: "#57aa5c", hi: "#7cc36a" },
    { dark: "#2c5d38", leaf: "#356f42", mid: "#458f4d", light: "#62ae5d", hi: "#8bcc72" },
    { dark: "#25543a", leaf: "#2b623f", mid: "#377b47", light: "#4e9e53", hi: "#6db65e" },
  ];
  const L = palettes[variant % palettes.length];
  const scaleX = variant === 1 ? 1.05 : variant === 2 ? 0.9 : 1;
  const blobs = canopyBlobs.map(([bx, by, br]) => [
    Math.round(23 + (bx - 23) * scaleX),
    by,
    Math.round(br * (variant === 2 ? 0.94 : 1)),
  ]);

  // Soft ground shadow.
  ctx.globalAlpha = 0.24;
  pixelEllipse(ctx, 24, 52, 18, 4, "#173a29");
  ctx.globalAlpha = 1;

  // Trunk and roots.
  outlineRect(ctx, 20, 34, 8, 18, C.bark, C.barkDark);
  rect(ctx, 21, 36, 2, 14, C.barkLight);
  rect(ctx, 18, 50, 5, 3, C.bark, C.barkDark);
  rect(ctx, 26, 50, 5, 3, C.bark, C.barkDark);
  rect(ctx, 17, 48, 3, 2, C.barkLight);
  rect(ctx, 29, 48, 3, 2, C.barkLight);
  rect(ctx, 22, 31, 2, 6, C.barkDark);
  rect(ctx, 27, 28, 2, 7, C.barkDark);

  const shiftX = variant === 1 ? -1 : variant === 2 ? 1 : 0;
  const shiftY = variant === 2 ? -1 : 0;

  // Dark silhouette gives the canopy a crisp, hand-drawn rim.
  for (const [bx, by, br] of blobs) {
    pixelCircle(ctx, bx + shiftX, by + shiftY + 1, br + 2, L.dark);
  }
  for (const [bx, by, br] of blobs) {
    pixelCircle(ctx, bx + shiftX, by + shiftY, br, L.leaf);
  }

  // Mid-tone clumps, offset up-left toward the morning sun.
  for (const [bx, by, br] of blobs) {
    pixelCircle(ctx, bx + shiftX - 1, by + shiftY - 2, Math.max(4, br - 3), L.mid);
  }
  for (const [bx, by, br] of [
    [18, 18, 8],
    [28, 17, 7],
    [13, 24, 6],
    [23, 26, 8],
    [33, 25, 6],
    [19, 31, 5],
  ]) {
    pixelCircle(ctx, Math.round(23 + (bx - 23) * scaleX) + shiftX, by + shiftY, br, L.light);
  }

  // Leafy speckles and sunlit edges.
  for (let i = 0; i < 34; i++) {
    const blob = blobs[Math.floor(rng() * blobs.length)];
    const angle = rng() * Math.PI * 2;
    const radius = Math.sqrt(rng()) * (blob[2] - 2);
    const x = Math.round(blob[0] + shiftX + Math.cos(angle) * radius);
    const y = Math.round(blob[1] + shiftY + Math.sin(angle) * radius);
    const tone = rng();
    rect(ctx, x, y, tone > 0.8 ? 2 : 1, 1, tone > 0.58 ? L.hi : tone > 0.25 ? L.mid : L.dark);
  }
  for (let i = 0; i < 9; i++) {
    const x = 9 + Math.floor(rng() * 29) + shiftX;
    const y = 9 + Math.floor(rng() * 20) + shiftY;
    rect(ctx, x, y, 1, 1, L.hi);
  }

  // A hint of warm light on the crown.
  rect(ctx, 20 + shiftX, 6 + shiftY, 5, 1, "#95d17a");
  rect(ctx, 17 + shiftX, 8 + shiftY, 3, 1, "#88ca72");

  // The orchard tree carries a little fruit.
  if (variant === 1) {
    for (let i = 0; i < 7; i++) {
      const x = 10 + Math.floor(rng() * 28);
      const y = 12 + Math.floor(rng() * 21);
      rect(ctx, x, y, 2, 2, "#e2a747");
      rect(ctx, x, y, 1, 1, "#f6d27a");
    }
  }

  return { canvas, ax, ay };
}

export function makeBush(variant = 0) {
  const rng = mulberry32(800 + variant * 41);
  const { canvas, ctx } = createCanvas(30, 28);
  ctx.globalAlpha = 0.2;
  pixelEllipse(ctx, 15, 24, 11, 3, "#173a29");
  ctx.globalAlpha = 1;
  const blobs = [
    [9, 16, 7],
    [20, 16, 7],
    [14, 11, 8],
    [23, 20, 4],
  ];
  for (const [x, y, r] of blobs) pixelCircle(ctx, x, y + 1, r + 1, "#2a5e3d");
  for (const [x, y, r] of blobs) pixelCircle(ctx, x, y, r, C.leafMid);
  for (const [x, y, r] of blobs) pixelCircle(ctx, x - 1, y - 2, Math.max(2, r - 3), C.leafLight);
  for (let i = 0; i < 12; i++) {
    rect(ctx, 4 + Math.floor(rng() * 22), 7 + Math.floor(rng() * 15), 1, 1, rng() > 0.5 ? C.leafHi : "#25603e");
  }
  if (variant === 1) {
    rect(ctx, 8, 14, 2, 2, "#e9bd68");
    rect(ctx, 19, 10, 2, 2, "#e9bd68");
  }
  return { canvas, ax: 15, ay: 25 };
}

export function makeRock(variant = 0) {
  const rng = mulberry32(1200 + variant * 33);
  const { canvas, ctx } = createCanvas(28, 22);
  ctx.globalAlpha = 0.2;
  pixelEllipse(ctx, 14, 19, 11, 2, "#173a29");
  ctx.globalAlpha = 1;
  const rows = variant === 1 ? [4, 7, 9, 10, 10, 9, 7] : [3, 6, 8, 10, 10, 8, 5];
  const baseY = 18 - rows.length;
  for (let i = 0; i < rows.length; i++) {
    const w = rows[i];
    const x = 14 - w;
    rect(ctx, x - 1, baseY + i, w * 2 + 2, 1, "#555a52");
    rect(ctx, x, baseY + i, w * 2, 1, C.stone);
  }
  for (let i = 0; i < 4; i++) {
    const w = Math.max(2, rows[i] - 2);
    rect(ctx, 14 - w - 1, baseY + i + 1, Math.floor(w * 0.8), 1, C.stoneLight);
  }
  rect(ctx, 8, 15, 5, 2, C.stoneDark);
  for (let i = 0; i < 6; i++) {
    rect(ctx, 7 + Math.floor(rng() * 14), baseY + 2 + Math.floor(rng() * 4), 1, 1, "#c6c5b4");
  }
  // Moss on the sunless edge.
  rect(ctx, 18, 17, 4, 1, "#5e8c4d");
  rect(ctx, 10, 13, 2, 1, "#6b9a55");
  return { canvas, ax: 14, ay: 19 };
}

export function makeStump() {
  const { canvas, ctx } = createCanvas(20, 18);
  ctx.globalAlpha = 0.2;
  pixelEllipse(ctx, 10, 16, 7, 2, "#173a29");
  ctx.globalAlpha = 1;
  outlineRect(ctx, 5, 7, 10, 8, C.bark, C.barkDark);
  rect(ctx, 6, 4, 8, 4, C.bark, C.barkDark);
  pixelEllipse(ctx, 10, 4, 5, 2, C.barkLight);
  pixelEllipse(ctx, 10, 4, 3, 1, "#8d6240");
  rect(ctx, 11, 4, 1, 1, "#5b3b28");
  rect(ctx, 7, 6, 1, 2, "#a77a4e");
  return { canvas, ax: 10, ay: 15 };
}

/* ------------------------------------------------------------------ */
/* Buildings                                                           */
/* ------------------------------------------------------------------ */

export function makeCottage() {
  const { canvas, ctx } = createCanvas(108, 102);
  const ax = 54;
  const ay = 96;

  ctx.globalAlpha = 0.26;
  pixelEllipse(ctx, 54, 91, 46, 7, "#163626");
  ctx.globalAlpha = 1;

  // Stone foundation.
  outlineRect(ctx, 17, 79, 74, 11, C.stone, "#5b5d55");
  for (let x = 20; x < 88; x += 9) rect(ctx, x, 81, 7, 3, C.stoneLight);
  for (let x = 24; x < 88; x += 11) rect(ctx, x, 86, 8, 3, C.stone);
  rect(ctx, 17, 89, 74, 2, "#4e514a");

  // Plaster wall and timber frame.
  outlineRect(ctx, 21, 48, 66, 38, C.cream, "#5d402b");
  rect(ctx, 23, 51, 62, 3, C.creamDark);
  for (const x of [25, 52, 80]) rect(ctx, x, 49, 3, 36, C.timber);
  rect(ctx, 23, 69, 62, 2, C.timber);
  rect(ctx, 21, 74, 66, 2, C.timberDark);
  rect(ctx, 24, 78, 60, 2, C.timberDark);
  // A couple of settling cracks.
  rect(ctx, 34, 56, 1, 5, "#cdb783");
  rect(ctx, 71, 62, 1, 4, "#cdb783");

  // Stepped shingle roof.
  const roofRows = 12;
  for (let i = 0; i < roofRows; i++) {
    const y = 45 - i * 3;
    const half = 47 - i * 2.9;
    rect(ctx, ax - half - 2, y - 2, half * 2 + 4, 3, C.roofDark);
    rect(ctx, ax - half, y, half * 2, 3, i % 2 === 0 ? C.roof : "#ae5440");
  }
  // Shingle curls.
  for (let i = 0; i < roofRows - 1; i++) {
    const y = 46 - i * 3;
    const half = 43 - i * 2.9;
    for (let x = -half + (i % 2 ? 2 : 0); x < half - 2; x += 6) {
      rect(ctx, ax + x, y, 3, 1, i % 2 ? C.roofLight : "#9c4a3a");
    }
  }
  // Eaves and ridge.
  rect(ctx, 5, 44, 98, 4, C.roofDark);
  rect(ctx, 6, 45, 96, 2, C.roofLight);
  rect(ctx, 30, 10, 48, 4, "#75392f");
  rect(ctx, 32, 9, 44, 2, "#a14b3b");

  // Chimney.
  outlineRect(ctx, 72, 5, 12, 29, C.stone, "#53564f");
  rect(ctx, 70, 4, 16, 4, C.stoneDark);
  rect(ctx, 73, 8, 4, 3, C.stoneLight);
  rect(ctx, 79, 13, 4, 3, C.stoneLight);
  rect(ctx, 73, 20, 4, 3, "#85877c");
  rect(ctx, 73, 27, 8, 2, "#85877c");

  // Roof moss.
  for (const [x, y, w] of [
    [17, 35, 8],
    [22, 32, 4],
    [82, 38, 5],
    [78, 20, 4],
  ]) {
    rect(ctx, x, y, w, 1, "#6f9653");
    rect(ctx, x + 2, y - 1, Math.max(1, w - 3), 1, "#83aa60");
  }

  // Door with arched top.
  rect(ctx, 47, 57, 15, 28, "#5b3a28");
  rect(ctx, 48, 56, 13, 2, "#5b3a28");
  rect(ctx, 49, 58, 11, 1, "#7c5236");
  rect(ctx, 50, 59, 9, 23, "#80543a");
  rect(ctx, 52, 60, 1, 21, "#6a422c");
  rect(ctx, 57, 60, 1, 21, "#6a422c");
  rect(ctx, 55, 68, 2, 2, C.gold);
  rect(ctx, 50, 81, 9, 2, "#4d3022");

  // Warm windows.
  for (const wx of [27, 63]) {
    rect(ctx, wx - 1, 57, 16, 15, "#5c3c28");
    rect(ctx, wx, 58, 14, 13, "#efc470");
    rect(ctx, wx + 1, 59, 12, 4, "#ffdf98");
    rect(ctx, wx + 6, 58, 2, 13, "#6b4530");
    rect(ctx, wx, 64, 14, 2, "#6b4530");
    rect(ctx, wx + 1, 67, 5, 3, "#e5a952");
    rect(ctx, wx + 8, 67, 5, 3, "#e5a952");
    // Flower box.
    rect(ctx, wx - 2, 73, 18, 4, "#6d4631");
    rect(ctx, wx - 1, 72, 16, 2, "#8a5a39");
    rect(ctx, wx, 70, 2, 2, "#5b9a4f");
    rect(ctx, wx + 4, 69, 2, 3, "#5b9a4f");
    rect(ctx, wx + 9, 70, 2, 2, "#5b9a4f");
    rect(ctx, wx + 13, 69, 1, 2, "#5b9a4f");
    rect(ctx, wx + 1, 68, 2, 2, "#e77f77");
    rect(ctx, wx + 6, 67, 2, 2, "#f4d36f");
    rect(ctx, wx + 11, 68, 2, 2, "#d68fd2");
  }

  // Door lantern and little stone step.
  rect(ctx, 64, 57, 3, 3, "#4b4d46");
  rect(ctx, 65, 60, 1, 11, "#4b4d46");
  rect(ctx, 63, 65, 5, 6, "#4b4d46");
  rect(ctx, 64, 66, 3, 4, C.glow);
  rect(ctx, 64, 66, 1, 1, "#fff2c0");
  ctx.globalAlpha = 0.18;
  pixelCircle(ctx, 65, 68, 12, C.glow);
  ctx.globalAlpha = 1;
  rect(ctx, 45, 86, 19, 4, "#a7a494");
  rect(ctx, 45, 89, 19, 1, "#777b71");

  // Ivy on the corner.
  for (const [x, y] of [
    [22, 67],
    [20, 72],
    [23, 75],
    [19, 78],
    [24, 79],
    [27, 77],
  ]) {
    rect(ctx, x, y, 3, 2, "#4f8c49");
    rect(ctx, x + 1, y, 1, 1, "#70aa5c");
  }

  return { canvas, ax, ay };
}

export function makeInn() {
  const { canvas, ctx } = createCanvas(140, 124);
  const ax = 68;
  const ay = 118;

  ctx.globalAlpha = 0.27;
  pixelEllipse(ctx, 68, 112, 58, 8, "#163626");
  ctx.globalAlpha = 1;

  // Stone base.
  outlineRect(ctx, 18, 98, 100, 13, C.stone, "#55584f");
  for (let x = 21; x < 114; x += 11) rect(ctx, x, 100, 9, 4, C.stoneLight);
  for (let x = 26; x < 114; x += 13) rect(ctx, x, 106, 9, 3, C.stone);
  rect(ctx, 18, 109, 100, 2, "#4e514a");

  // Ground floor.
  outlineRect(ctx, 22, 57, 92, 45, C.cream, "#583b28");
  rect(ctx, 24, 60, 88, 4, C.creamDark);
  for (const x of [26, 48, 72, 94, 110]) rect(ctx, x, 58, 3, 43, C.timber);
  rect(ctx, 24, 80, 88, 3, C.timber);

  // Jettied upper floor.
  outlineRect(ctx, 16, 30, 105, 30, "#e3cea0", "#583b28");
  rect(ctx, 18, 33, 101, 3, C.creamDark);
  for (const x of [20, 42, 66, 90, 112]) rect(ctx, x, 31, 3, 28, C.timber);
  rect(ctx, 18, 50, 101, 3, C.timberDark);
  rect(ctx, 16, 56, 105, 3, C.timberDark);
  for (let x = 18; x < 120; x += 9) rect(ctx, x, 53, 6, 3, C.creamDark);

  // Roof.
  for (let i = 0; i < 11; i++) {
    const y = 27 - i * 3;
    const half = 61 - i * 4.1;
    rect(ctx, ax - half - 2, y - 2, half * 2 + 4, 3, C.roofDark);
    rect(ctx, ax - half, y, half * 2, 3, i % 2 ? C.roof : "#ad5140");
  }
  for (let i = 0; i < 10; i++) {
    const y = 28 - i * 3;
    const half = 57 - i * 4.1;
    for (let x = -half + (i % 2 ? 2 : 0); x < half - 2; x += 7) {
      rect(ctx, ax + x, y, 4, 1, i % 2 ? C.roofLight : "#974537");
    }
  }
  rect(ctx, 1, 26, 138, 4, C.roofDark);
  rect(ctx, 3, 27, 134, 2, C.roofLight);
  rect(ctx, 44, 2, 48, 4, "#71352b");
  rect(ctx, 46, 1, 44, 2, "#9a4738");

  // Chimney.
  outlineRect(ctx, 100, 0, 12, 24, "#8f8d81", "#51544d");
  rect(ctx, 98, 0, 16, 4, "#66685f");
  rect(ctx, 102, 5, 4, 3, C.stoneLight);
  rect(ctx, 107, 11, 3, 3, C.stoneLight);
  rect(ctx, 103, 17, 7, 2, "#777a70");

  // Door and warm windows.
  rect(ctx, 47, 68, 22, 36, "#503226");
  rect(ctx, 49, 67, 18, 2, "#503226");
  rect(ctx, 50, 70, 16, 32, "#7c4f34");
  rect(ctx, 53, 73, 1, 29, "#623d2a");
  rect(ctx, 60, 73, 1, 29, "#623d2a");
  rect(ctx, 56, 84, 4, 3, C.gold);
  rect(ctx, 58, 84, 1, 2, "#8a6a32");
  rect(ctx, 45, 103, 26, 4, "#a8a393");

  for (const wx of [30, 88]) {
    rect(ctx, wx - 1, 68, 18, 16, "#513525");
    rect(ctx, wx, 69, 16, 14, "#efc46f");
    rect(ctx, wx + 1, 70, 14, 4, "#ffe19a");
    rect(ctx, wx + 7, 69, 2, 14, "#6c4630");
    rect(ctx, wx, 75, 16, 2, "#6c4630");
    rect(ctx, wx + 1, 79, 6, 3, "#e2a34e");
    rect(ctx, wx + 9, 79, 6, 3, "#e2a34e");
    rect(ctx, wx - 1, 84, 18, 3, "#6d4631");
    rect(ctx, wx + 2, 82, 2, 2, "#e77f77");
    rect(ctx, wx + 9, 81, 2, 3, "#f4d36f");
  }

  // Upper windows.
  for (const wx of [27, 57, 94]) {
    rect(ctx, wx - 1, 36, 15, 12, "#533626");
    rect(ctx, wx, 37, 13, 10, "#eac06e");
    rect(ctx, wx + 1, 38, 11, 3, "#ffdf98");
    rect(ctx, wx + 6, 37, 2, 10, "#6b4530");
    rect(ctx, wx, 42, 13, 2, "#6b4530");
  }

  // Hanging tavern sign.
  rect(ctx, 116, 38, 2, 17, "#4f4a3d");
  rect(ctx, 113, 38, 20, 2, "#4f4a3d");
  rect(ctx, 118, 39, 10, 2, "#a48a54");
  rect(ctx, 117, 40, 14, 15, "#66452f");
  rect(ctx, 118, 41, 12, 12, "#d4b577");
  rect(ctx, 120, 43, 7, 6, "#8a5a37");
  rect(ctx, 121, 44, 5, 2, "#f2d394");
  rect(ctx, 124, 42, 2, 2, "#8a5a37");
  rect(ctx, 119, 48, 11, 2, "#a57f48");
  ctx.globalAlpha = 0.2;
  pixelCircle(ctx, 124, 48, 12, C.glowSoft);
  ctx.globalAlpha = 1;

  // Ivy and moss.
  for (const [x, y] of [
    [21, 74],
    [19, 80],
    [24, 86],
    [111, 65],
    [114, 72],
    [109, 78],
    [17, 55],
    [119, 57],
  ]) {
    rect(ctx, x, y, 3, 2, "#4f8c49");
    rect(ctx, x + 1, y, 1, 1, "#70aa5c");
  }
  rect(ctx, 29, 22, 9, 1, "#719755");
  rect(ctx, 89, 20, 7, 1, "#719755");

  return { canvas, ax, ay };
}

export function makeTower() {
  const { canvas, ctx } = createCanvas(100, 158);
  const ax = 50;
  const ay = 152;

  ctx.globalAlpha = 0.28;
  pixelEllipse(ctx, 50, 145, 40, 7, "#163626");
  ctx.globalAlpha = 1;

  // Stone body, wider at the base.
  outlineRect(ctx, 26, 62, 48, 82, C.stone, "#565a52");
  rect(ctx, 20, 132, 60, 11, C.stone, "#565a52");
  outlineRect(ctx, 18, 139, 64, 7, "#8d8e83", "#565a52");
  for (let y = 66; y < 136; y += 7) {
    rect(ctx, 27, y, 46, 1, "#7f8177");
  }
  for (let y = 69, row = 0; y < 134; y += 7, row++) {
    const offset = row % 2 ? 0 : 6;
    for (let x = 29 + offset; x < 71; x += 12) {
      rect(ctx, x, y, 1, 5, "#777a70");
      rect(ctx, x + 2, y, 5, 1, C.stoneLight);
    }
  }
  rect(ctx, 29, 64, 4, 74, "#85877c");
  rect(ctx, 70, 65, 2, 72, "#6f7269");
  // Sunlit side and moss.
  rect(ctx, 30, 68, 3, 62, "#b1b1a0");
  for (const [x, y, w] of [
    [27, 94, 6],
    [31, 101, 3],
    [64, 118, 8],
    [60, 124, 4],
    [26, 130, 5],
  ]) {
    rect(ctx, x, y, w, 2, "#688e51");
    rect(ctx, x + 1, y, Math.max(1, w - 2), 1, "#82a962");
  }

  // Round arch window, warm with starlight.
  rect(ctx, 42, 82, 18, 23, "#53564d");
  rect(ctx, 44, 80, 14, 3, "#53564d");
  rect(ctx, 46, 79, 10, 2, "#53564d");
  rect(ctx, 45, 84, 12, 19, "#f0c46c");
  rect(ctx, 46, 86, 10, 4, "#ffe4a1");
  rect(ctx, 50, 84, 2, 19, "#6b4731");
  rect(ctx, 45, 92, 12, 2, "#6b4731");
  rect(ctx, 47, 98, 4, 3, "#e2a34e");
  rect(ctx, 53, 98, 3, 3, "#e2a34e");
  ctx.globalAlpha = 0.2;
  pixelCircle(ctx, 51, 93, 17, C.glowSoft);
  ctx.globalAlpha = 1;

  // Upper loop window.
  rect(ctx, 46, 65, 10, 10, "#53564d");
  rect(ctx, 48, 66, 6, 7, "#efc16b");
  rect(ctx, 50, 66, 1, 7, "#6b4731");

  // Pointed slate roof.
  for (let i = 0; i < 14; i++) {
    const y = 59 - i * 3;
    const half = 32 - i * 2.05;
    rect(ctx, ax - half - 2, y - 2, half * 2 + 4, 3, C.slateDark);
    rect(ctx, ax - half, y, half * 2, 3, i % 2 ? C.slate : "#4f6881");
  }
  for (let i = 0; i < 13; i++) {
    const y = 60 - i * 3;
    const half = 29 - i * 2.05;
    for (let x = -half + (i % 2 ? 2 : 0); x < half - 2; x += 7) {
      rect(ctx, ax + x, y, 3, 1, i % 2 ? C.slateLight : "#445c74");
    }
  }
  rect(ctx, 14, 57, 72, 4, C.slateDark);
  rect(ctx, 16, 58, 68, 2, C.slateLight);
  rect(ctx, 47, 1, 6, 13, "#4b4e46");
  rect(ctx, 49, 0, 3, 3, C.gold);
  rect(ctx, 48, 4, 5, 2, "#815f35");
  // Little banner.
  rect(ctx, 53, 5, 1, 14, "#5d4430");
  rect(ctx, 54, 6, 9, 5, "#a54b3f");
  rect(ctx, 55, 7, 6, 1, "#d1775d");
  rect(ctx, 54, 11, 9, 1, "#853b32");

  // Door.
  rect(ctx, 39, 120, 22, 24, "#4f3226");
  rect(ctx, 41, 118, 18, 3, "#4f3226");
  rect(ctx, 42, 121, 16, 22, "#6e4831");
  rect(ctx, 45, 123, 1, 19, "#56392a");
  rect(ctx, 51, 123, 1, 19, "#56392a");
  rect(ctx, 56, 123, 1, 19, "#56392a");
  rect(ctx, 49, 132, 2, 2, C.gold);
  rect(ctx, 37, 143, 26, 4, "#a9a494");

  // Ivy creeping up one side.
  for (const [x, y, w] of [
    [24, 111, 4],
    [22, 116, 3],
    [26, 121, 4],
    [23, 126, 3],
    [27, 132, 4],
    [22, 137, 4],
  ]) {
    rect(ctx, x, y, w, 2, "#4f8c49");
    rect(ctx, x + 1, y, 1, 1, "#70aa5c");
  }

  return { canvas, ax, ay };
}

export function makeWell() {
  const { canvas, ctx } = createCanvas(46, 50);
  const ax = 23;
  const ay = 46;

  ctx.globalAlpha = 0.25;
  pixelEllipse(ctx, 23, 43, 18, 4, "#163626");
  ctx.globalAlpha = 1;

  // Stone rim.
  pixelEllipse(ctx, 23, 38, 17, 7, "#5a5e56");
  pixelEllipse(ctx, 23, 37, 15, 6, C.stone);
  pixelEllipse(ctx, 23, 36, 11, 4, "#444b45");
  pixelEllipse(ctx, 23, 36, 9, 3, "#2e696f");
  pixelEllipse(ctx, 21, 35, 5, 1, "#52919a");
  for (let x = 10; x < 37; x += 6) rect(ctx, x, 39, 5, 2, C.stoneLight);
  rect(ctx, 13, 37, 2, 2, "#6f7269");
  rect(ctx, 32, 37, 2, 2, "#6f7269");

  // Posts and little roof.
  rect(ctx, 12, 12, 3, 27, "#6a4832");
  rect(ctx, 32, 12, 3, 27, "#6a4832");
  rect(ctx, 11, 13, 4, 2, "#8a603e");
  rect(ctx, 31, 13, 4, 2, "#8a603e");
  rect(ctx, 10, 8, 27, 4, C.roofDark);
  rect(ctx, 12, 7, 23, 2, C.roof);
  rect(ctx, 14, 5, 19, 2, C.roofLight);
  rect(ctx, 17, 3, 13, 2, "#6f352b");
  rect(ctx, 21, 1, 6, 2, "#874135");

  // Crossbeam and hanging bucket.
  rect(ctx, 14, 23, 20, 2, "#7a5436");
  rect(ctx, 23, 25, 1, 9, "#5d4330");
  rect(ctx, 20, 33, 7, 5, "#5a3b28");
  rect(ctx, 21, 34, 5, 3, "#8a603e");
  rect(ctx, 21, 37, 5, 1, "#4d3222");

  return { canvas, ax, ay };
}

/* ------------------------------------------------------------------ */
/* Small props                                                         */
/* ------------------------------------------------------------------ */

export function makeFence(vertical = false) {
  const { canvas, ctx } = createCanvas(vertical ? 18 : 20, vertical ? 22 : 20);
  if (vertical) {
    rect(ctx, 8, 2, 8, 18, "#6b4a32");
    rect(ctx, 9, 3, 2, 16, "#8a603e");
    rect(ctx, 7, 2, 4, 3, "#a1764c");
    rect(ctx, 7, 17, 4, 3, "#543a28");
    rect(ctx, 4, 6, 3, 9, "#5b3e2b");
    rect(ctx, 3, 7, 2, 7, "#7a5436");
    rect(ctx, 12, 8, 3, 9, "#5b3e2b");
    rect(ctx, 13, 9, 2, 7, "#7a5436");
    return { canvas, ax: 9, ay: 19 };
  }
  rect(ctx, 6, 2, 8, 18, "#6b4a32");
  rect(ctx, 7, 3, 2, 16, "#8a603e");
  rect(ctx, 5, 1, 5, 3, "#a1764c");
  rect(ctx, 5, 17, 5, 3, "#543a28");
  rect(ctx, 0, 5, 20, 3, "#5b3e2b");
  rect(ctx, 0, 6, 20, 1, "#7a5436");
  rect(ctx, 0, 11, 20, 3, "#5b3e2b");
  rect(ctx, 0, 12, 20, 1, "#7a5436");
  return { canvas, ax: 10, ay: 19 };
}

export function makeLantern() {
  const { canvas, ctx } = createCanvas(18, 42);
  const ax = 9;
  const ay = 39;
  ctx.globalAlpha = 0.2;
  pixelEllipse(ctx, 9, 38, 6, 2, "#163626");
  ctx.globalAlpha = 1;
  rect(ctx, 8, 14, 3, 25, "#4d3a2c");
  rect(ctx, 9, 16, 1, 21, "#75563c");
  rect(ctx, 5, 35, 9, 3, "#5b4936");
  rect(ctx, 6, 10, 7, 5, "#4d3a2c");
  rect(ctx, 4, 12, 11, 3, "#6b5136");
  rect(ctx, 5, 15, 9, 9, "#4a3a2b");
  rect(ctx, 6, 16, 7, 7, C.glow);
  rect(ctx, 7, 17, 4, 3, "#fff0bb");
  rect(ctx, 6, 22, 7, 1, "#b07a3c");
  ctx.globalAlpha = 0.22;
  pixelCircle(ctx, 9, 19, 11, C.glowSoft);
  ctx.globalAlpha = 1;
  rect(ctx, 8, 6, 3, 5, "#4d3a2c");
  rect(ctx, 5, 4, 9, 3, "#75563c");
  return { canvas, ax, ay };
}

export function makeSignpost() {
  const { canvas, ctx } = createCanvas(40, 44);
  const ax = 20;
  const ay = 41;
  ctx.globalAlpha = 0.2;
  pixelEllipse(ctx, 20, 40, 8, 2, "#163626");
  ctx.globalAlpha = 1;
  rect(ctx, 18, 12, 4, 27, "#5f422e");
  rect(ctx, 19, 14, 2, 23, "#87613f");
  rect(ctx, 17, 37, 6, 3, "#4b3324");
  // Upper board, pointing right.
  rect(ctx, 12, 10, 22, 9, "#4c3425");
  rect(ctx, 13, 11, 20, 7, "#b68d58");
  rect(ctx, 14, 12, 17, 1, "#d2ae76");
  rect(ctx, 29, 13, 3, 3, "#7a5436");
  rect(ctx, 30, 14, 2, 1, "#7a5436");
  // Lower board, pointing left.
  rect(ctx, 7, 23, 21, 8, "#4c3425");
  rect(ctx, 8, 24, 19, 6, "#a87f4d");
  rect(ctx, 9, 25, 16, 1, "#c9a36c");
  // Sketchy glyphs instead of tiny text.
  for (const [x, y] of [
    [17, 13],
    [20, 13],
    [23, 13],
    [12, 26],
    [15, 26],
    [18, 26],
  ]) {
    rect(ctx, x, y, 2, 2, "#6d4a2f");
  }
  // Nail heads and a moss tuft.
  rect(ctx, 19, 11, 1, 1, "#3f3d35");
  rect(ctx, 19, 25, 1, 1, "#3f3d35");
  rect(ctx, 20, 39, 3, 1, "#5e8c4d");
  return { canvas, ax, ay };
}

export function makeLily() {
  const { canvas, ctx } = createCanvas(12, 8);
  pixelEllipse(ctx, 6, 4, 5, 3, "#4f8f5a");
  rect(ctx, 6, 2, 2, 3, C.water);
  rect(ctx, 4, 3, 2, 1, "#74b06b");
  if (Math.random() > 0.5) {
    rect(ctx, 7, 2, 2, 2, "#f1c1d4");
    rect(ctx, 8, 2, 1, 1, "#ffe6ef");
  }
  return { canvas, ax: 6, ay: 4 };
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const HERO_W = 26;
const HERO_H = 36;

function heroBase(ctx, dir, phase) {
  const swing = [0, 1, 0, -1][phase] || 0;
  const bob = phase === 1 || phase === 3 ? -1 : 0;
  const moving = phase !== 0;
  const step = moving ? swing : 0;

  if (dir === "up") {
    // Cloak and pack seen from behind.
    outlineRect(ctx, 7, 13, 12, 16, C.cloakDark);
    rect(ctx, 8, 14, 10, 14, C.cloak);
    rect(ctx, 12, 16, 1, 11, C.cloakDark);
    rect(ctx, 9, 20, 2, 1, C.cloakLight);
    outlineRect(ctx, 15, 17, 5, 7, C.leather);
    rect(ctx, 16, 18, 2, 1, "#8a603e");
    rect(ctx, 18, 21, 1, 1, C.gold);

    // Legs.
    for (const [lx, ly] of [
      [9, step > 0 ? -1 : 0],
      [14, step < 0 ? -1 : 0],
    ]) {
      outlineRect(ctx, lx, 24 + ly + bob, 3, 7, "#6d5a86");
      rect(ctx, lx + 1, 25 + ly + bob, 1, 5, "#7e6b99");
      outlineRect(ctx, lx - 1, 30 + ly + bob, 5, 3, C.leather);
      rect(ctx, lx, 31 + ly + bob, 3, 1, "#8a603e");
    }

    // Arms.
    outlineRect(ctx, 4, 17 + (step > 0 ? 1 : 0), 4, 9, C.cloak);
    outlineRect(ctx, 18, 17 + (step < 0 ? 1 : 0), 4, 9, C.cloak);
    rect(ctx, 5, 23 + (step > 0 ? 1 : 0), 2, 3, C.skin);
    rect(ctx, 19, 23 + (step < 0 ? 1 : 0), 2, 3, C.skin);

    // Head, hair and hood.
    outlineRect(ctx, 7, 4 + bob, 12, 13, "#5a2c27");
    rect(ctx, 8, 5 + bob, 10, 11, C.hair);
    rect(ctx, 9, 6 + bob, 8, 3, C.hairLight);
    rect(ctx, 8, 11 + bob, 10, 4, C.hair);
    rect(ctx, 10, 8 + bob, 2, 2, "#643229");
    rect(ctx, 14, 10 + bob, 2, 2, "#643229");
    rect(ctx, 7, 12 + bob, 12, 2, C.cloakDark);
    rect(ctx, 9, 16 + bob, 8, 2, C.scarf);
    return;
  }

  if (dir === "right") {
    // Cloak trailing behind.
    outlineRect(ctx, 1, 14, 10, 15, C.cloakDark);
    rect(ctx, 2, 15, 8, 12, C.cloak);
    rect(ctx, 2, 18, 2, 7, C.cloakLight);
    rect(ctx, 2, 25, 3, 2, C.cloakDark);
    rect(ctx, 5, 27, 3, 1, C.cloakDark);
    // Back arm.
    outlineRect(ctx, 7, 17 + (step < 0 ? 1 : 0), 4, 8, C.cloak);
    // Legs.
    outlineRect(ctx, 9 + step, 24 + bob, 4, 7, "#6d5a86");
    rect(ctx, 10 + step, 25 + bob, 2, 5, "#7e6b99");
    outlineRect(ctx, 13 - step, 24 + bob, 4, 7, "#57466c");
    rect(ctx, 14 - step, 25 + bob, 1, 5, "#6b5a85");
    outlineRect(ctx, 8 + step, 30 + bob, 6, 3, C.leather);
    rect(ctx, 9 + step, 31 + bob, 4, 1, "#8a603e");
    outlineRect(ctx, 13 - step, 30 + bob, 5, 3, "#5e4331");
    // Torso.
    outlineRect(ctx, 7, 14, 9, 11, C.tunic);
    rect(ctx, 8, 15, 7, 9, C.tunic);
    rect(ctx, 8, 21, 8, 3, C.leather);
    rect(ctx, 10, 21, 2, 2, C.gold);
    rect(ctx, 10, 15, 1, 6, "#b89f70");
    // Diagonal satchel strap.
    rect(ctx, 13, 16, 1, 2, C.gold);
    rect(ctx, 12, 18, 1, 2, "#b98d4d");
    rect(ctx, 11, 20, 1, 1, "#b98d4d");
    // Front arm swings.
    outlineRect(ctx, 14, 16 + (step > 0 ? 1 : 0), 4, 8, C.tunicDark);
    rect(ctx, 15, 17 + (step > 0 ? 1 : 0), 2, 5, C.tunic);
    rect(ctx, 16, 22 + (step > 0 ? 1 : 0), 2, 2, C.skin);
    // Head in profile.
    outlineRect(ctx, 8, 5 + bob, 10, 11, C.skinDark);
    rect(ctx, 9, 6 + bob, 8, 9, C.skin);
    // Hair, with a little wind-swept fringe.
    rect(ctx, 6, 4 + bob, 10, 5, C.hair);
    rect(ctx, 7, 5 + bob, 7, 2, C.hairLight);
    rect(ctx, 6, 8 + bob, 4, 7, C.hair);
    rect(ctx, 7, 13 + bob, 3, 2, C.hair);
    rect(ctx, 13, 6 + bob, 3, 2, C.hair);
    rect(ctx, 16, 7 + bob, 1, 3, C.hair);
    // Face.
    rect(ctx, 15, 10 + bob, 2, 2, "#3a2a2d");
    rect(ctx, 18, 10 + bob, 1, 2, C.skinDark);
    rect(ctx, 16, 13 + bob, 2, 1, C.skinDark);
    // Scarf.
    rect(ctx, 8, 14 + bob, 9, 2, C.scarf);
    rect(ctx, 6, 15 + bob, 3, 2, "#c98b40");
    // Ear.
    rect(ctx, 12, 10 + bob, 1, 2, C.skinDark);
    return;
  }

  // Front view.
  // Cloak peeking out at the sides.
  outlineRect(ctx, 2, 14, 22, 14, C.cloakDark);
  rect(ctx, 3, 15, 20, 11, C.cloak);
  rect(ctx, 4, 16, 2, 7, C.cloakLight);
  rect(ctx, 20, 16, 2, 7, C.cloakLight);
  rect(ctx, 3, 24, 3, 2, C.cloakDark);
  rect(ctx, 7, 26, 4, 1, C.cloakDark);
  rect(ctx, 12, 25, 3, 1, C.cloakDark);
  rect(ctx, 16, 26, 4, 1, C.cloakDark);
  rect(ctx, 20, 24, 3, 2, C.cloakDark);
  // Soft hood collar.
  rect(ctx, 6, 12, 14, 3, C.cloakDark);
  rect(ctx, 7, 13, 12, 1, C.cloak);
  rect(ctx, 8, 13, 4, 1, C.cloakLight);

  // Legs.
  const leftLift = step > 0 ? -1 : 0;
  const rightLift = step < 0 ? -1 : 0;
  outlineRect(ctx, 8, 24 + leftLift + bob, 4, 7, "#6d5a86");
  rect(ctx, 9, 25 + leftLift + bob, 2, 5, "#7e6b99");
  outlineRect(ctx, 14, 24 + rightLift + bob, 4, 7, "#57466c");
  rect(ctx, 15, 25 + rightLift + bob, 2, 5, "#6b5a85");
  outlineRect(ctx, 7, 30 + leftLift + bob, 6, 3, C.leather);
  rect(ctx, 8, 31 + leftLift + bob, 4, 1, "#8a603e");
  outlineRect(ctx, 13, 30 + rightLift + bob, 6, 3, "#5e4331");
  rect(ctx, 14, 31 + rightLift + bob, 4, 1, "#8a603e");

  // Torso.
  outlineRect(ctx, 8, 14, 10, 11, C.tunic);
  rect(ctx, 9, 15, 8, 9, C.tunic);
  rect(ctx, 10, 16, 1, 7, "#b89f70");
  rect(ctx, 15, 16, 1, 7, "#b89f70");
  rect(ctx, 9, 21, 8, 3, C.leather);
  rect(ctx, 12, 21, 2, 2, C.gold);
  // Satchel strap.
  rect(ctx, 9, 15, 1, 2, C.gold);
  rect(ctx, 10, 17, 1, 2, "#b98d4d");
  rect(ctx, 11, 19, 1, 2, "#b98d4d");

  // Arms.
  outlineRect(ctx, 4, 16 + (step < 0 ? 1 : 0), 4, 9, C.tunicDark);
  outlineRect(ctx, 18, 16 + (step > 0 ? 1 : 0), 4, 9, C.tunicDark);
  rect(ctx, 5, 17 + (step < 0 ? 1 : 0), 2, 5, C.tunic);
  rect(ctx, 19, 17 + (step > 0 ? 1 : 0), 2, 5, C.tunic);
  rect(ctx, 5, 22 + (step < 0 ? 1 : 0), 2, 2, C.skin);
  rect(ctx, 19, 22 + (step > 0 ? 1 : 0), 2, 2, C.skin);

  // Head.
  outlineRect(ctx, 7, 4 + bob, 12, 12, "#5a2c27");
  rect(ctx, 8, 5 + bob, 10, 10, C.skin);
  rect(ctx, 8, 5 + bob, 3, 3, C.skinDark);
  // Hair.
  rect(ctx, 6, 3 + bob, 14, 5, C.hair);
  rect(ctx, 7, 4 + bob, 12, 2, C.hairLight);
  rect(ctx, 6, 7 + bob, 3, 7, C.hair);
  rect(ctx, 17, 7 + bob, 3, 7, C.hair);
  rect(ctx, 8, 7 + bob, 3, 2, C.hair);
  rect(ctx, 15, 7 + bob, 2, 2, C.hair);
  rect(ctx, 17, 9 + bob, 2, 3, C.hair);
  // Face.
  rect(ctx, 10, 10 + bob, 2, 2, "#3a2a2d");
  rect(ctx, 15, 10 + bob, 2, 2, "#3a2a2d");
  rect(ctx, 10, 11 + bob, 1, 1, "#e8dfca");
  rect(ctx, 15, 11 + bob, 1, 1, "#e8dfca");
  rect(ctx, 11, 13 + bob, 4, 1, C.skinDark);
  rect(ctx, 12, 14 + bob, 2, 1, "#c87d70");
  // Scarf and neck.
  rect(ctx, 8, 14 + bob, 10, 2, C.scarf);
  rect(ctx, 7, 15 + bob, 3, 1, "#c98b40");
  // A small clasp keeps the mantle closed.
  rect(ctx, 12, 16 + bob, 2, 2, C.gold);
  rect(ctx, 12, 16 + bob, 1, 1, "#fff0b4");
}

export function makeHeroSprites() {
  const frames = { down: [], up: [], left: [], right: [] };

  for (const dir of ["down", "up", "right"]) {
    for (let phase = 0; phase < 4; phase++) {
      const { canvas, ctx } = createCanvas(HERO_W, HERO_H);
      if (dir === "right") heroBase(ctx, "right", phase);
      else heroBase(ctx, dir, phase);
      frames[dir].push(canvas);
    }
  }

  // Mirror the side-facing frames for the left side.
  for (const frame of frames.right) {
    const { canvas, ctx } = createCanvas(HERO_W, HERO_H);
    ctx.translate(HERO_W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, 0, 0);
    frames.left.push(canvas);
  }

  return { frames, ax: 13, ay: 33 };
}

export { C as PALETTE };
