// Every sprite in Hollowbrook is painted here, pixel by pixel, so the game
// needs no external art files and stays crisp at any resolution.
import { mulberry32, pick } from "./rng.js";

const OUTLINE = "#1b2620";

export function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

export function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function pixelEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  const y0 = Math.round(cy - ry);
  const y1 = Math.round(cy + ry);
  for (let y = y0; y <= y1; y += 1) {
    const n = (y - cy) / Math.max(1, ry);
    if (Math.abs(n) > 1) continue;
    const half = Math.floor(rx * Math.sqrt(1 - n * n));
    if (half <= 0) continue;
    ctx.fillRect(Math.round(cx - half), y, Math.max(1, half * 2), 1);
  }
}

export function pixelTriangle(ctx, cx, top, bottom, halfTop, halfBottom, color) {
  ctx.fillStyle = color;
  for (let y = top; y <= bottom; y += 1) {
    const t = (y - top) / Math.max(1, bottom - top);
    const half = Math.round(halfTop + (halfBottom - halfTop) * t);
    ctx.fillRect(Math.round(cx - half), y, Math.max(1, half * 2 + 1), 1);
  }
}

export function drawShadow(ctx, x, y, rx, ry, alpha = 0.22) {
  pixelEllipse(ctx, x, y, rx, ry, `rgba(16, 30, 20, ${alpha})`);
  pixelEllipse(ctx, x, y, Math.max(2, rx * 0.62), Math.max(1, ry * 0.55), `rgba(10, 22, 14, ${alpha * 0.55})`);
}

/* ------------------------------------------------------------------ */
/* Ground textures                                                     */
/* ------------------------------------------------------------------ */

export function makeGrassTiles(seed = 1337) {
  const rng = mulberry32(seed);
  const bases = ["#5f9b47", "#5c9744", "#629f49", "#589341", "#65a14b", "#5e9a46"];
  return bases.map((base, index) => {
    const [canvas, ctx] = makeCanvas(16, 16);
    px(ctx, 0, 0, 16, 16, base);
    for (let i = 0; i < 13; i += 1) {
      const x = Math.floor(rng() * 16);
      const y = Math.floor(rng() * 16);
      const length = rng() > 0.6 ? 2 : 1;
      const color = rng() > 0.5 ? "rgba(130, 183, 94, 0.34)" : "rgba(61, 108, 48, 0.3)";
      px(ctx, x, y, 1, length, color);
    }
    if (index % 2 === 0) {
      px(ctx, 3 + Math.floor(rng() * 9), 4 + Math.floor(rng() * 8), 2, 1, "rgba(151, 196, 107, 0.22)");
    }
    return canvas;
  });
}

export function drawGrassBlade(ctx, x, y, rng, palette) {
  const height = 1 + Math.floor(rng() * 3);
  const lean = rng() > 0.5 ? 1 : -1;
  const color = pick(rng, palette);
  px(ctx, x, y - height, 1, height + 1, color);
  if (height > 1 && rng() > 0.45) px(ctx, x + lean, y - height - 1, 1, 1, color);
}

export function drawFlower(ctx, x, y, rng, palette) {
  const stem = rng() > 0.5 ? "#3f7136" : "#497d3c";
  px(ctx, x, y - 2, 1, 3, stem);
  const petal = pick(rng, palette);
  const size = rng() > 0.78 ? 2 : 1;
  if (size === 2) {
    px(ctx, x - 1, y - 4, 3, 2, petal);
    px(ctx, x, y - 5, 1, 1, petal);
  } else {
    px(ctx, x, y - 4, 1, 2, petal);
    px(ctx, x - 1, y - 3, 1, 1, petal);
    px(ctx, x + 1, y - 3, 1, 1, petal);
  }
  if (rng() > 0.5) px(ctx, x, y - 4, 1, 1, "#f7e7a1");
}

/* ------------------------------------------------------------------ */
/* Trees, bushes and rocks                                             */
/* ------------------------------------------------------------------ */

function paintCanopy(ctx, cx, blobs, palette, seed) {
  const rng = mulberry32(seed);
  for (const b of blobs) {
    pixelEllipse(ctx, cx + b.x, b.y, b.rx + 2, b.ry + 2, OUTLINE);
  }
  for (const b of blobs) {
    pixelEllipse(ctx, cx + b.x, b.y, b.rx, b.ry, palette.dark);
  }
  for (const b of blobs) {
    pixelEllipse(ctx, cx + b.x - 1, b.y - 2, b.rx - 2, b.ry - 2, palette.mid);
  }
  for (const b of blobs) {
    pixelEllipse(ctx, cx + b.x - Math.round(b.rx * 0.28), b.y - Math.round(b.ry * 0.34), Math.max(2, b.rx * 0.46), Math.max(2, b.ry * 0.42), palette.light);
  }
  for (let i = 0; i < 46; i += 1) {
    const b = blobs[Math.floor(rng() * blobs.length)];
    const angle = rng() * Math.PI * 2;
    const radius = Math.sqrt(rng());
    const x = cx + b.x + Math.cos(angle) * b.rx * radius * 0.9;
    const y = b.y + Math.sin(angle) * b.ry * radius * 0.9;
    const tone = rng();
    if (tone > 0.72) px(ctx, x, y, 1 + (rng() > 0.8 ? 1 : 0), 1, palette.highlight);
    else if (tone < 0.3) px(ctx, x, y, 1, 1, palette.deep);
  }
  // Dappled top-left rim light.
  for (const b of blobs) {
    for (let i = 0; i < 7; i += 1) {
      const angle = Math.PI * (1.05 + rng() * 0.42);
      const x = cx + b.x + Math.cos(angle) * b.rx * (0.7 + rng() * 0.22);
      const y = b.y + Math.sin(angle) * b.ry * (0.7 + rng() * 0.22);
      px(ctx, x, y, 1, 1, palette.rim);
    }
  }
}

export function makeOak(seed, variant = 0) {
  const rng = mulberry32(seed);
  const big = variant % 3 === 2;
  const w = big ? 70 : 56;
  const h = big ? 88 : 74;
  const [canvas, ctx] = makeCanvas(w, h);
  const cx = w / 2;
  const base = h - 3;

  // trunk and roots behind canopy
  px(ctx, cx - 5, base - 34, 11, 34, OUTLINE);
  px(ctx, cx - 3, base - 33, 7, 31, "#5d3c28");
  px(ctx, cx - 2, base - 31, 2, 25, "#7d5636");
  px(ctx, cx - 7, base - 4, 15, 3, OUTLINE);
  px(ctx, cx - 9, base - 3, 19, 2, "#5d3c28");
  px(ctx, cx - 5, base - 2, 4, 2, "#7d5636");

  const blobs = big
    ? [
        { x: -16, y: 46, rx: 18, ry: 14 },
        { x: 17, y: 48, rx: 17, ry: 13 },
        { x: 0, y: 31, rx: 19, ry: 16 },
        { x: -9, y: 55, rx: 20, ry: 13 },
        { x: 11, y: 57, rx: 16, ry: 12 },
        { x: -20, y: 31, rx: 13, ry: 11 },
        { x: 20, y: 33, rx: 12, ry: 10 },
      ]
    : [
        { x: -10, y: 40, rx: 14, ry: 11 },
        { x: 10, y: 42, rx: 13, ry: 10 },
        { x: 0, y: 27, rx: 15, ry: 13 },
        { x: -5, y: 48, rx: 15, ry: 10 },
        { x: 8, y: 49, rx: 12, ry: 9 },
      ];

  const palettes = [
    { dark: "#2d5e36", mid: "#397a41", light: "#4e9550", highlight: "#72b65d", deep: "#214a2b", rim: "#8bc56b" },
    { dark: "#285735", mid: "#34713e", light: "#498a4b", highlight: "#65a955", deep: "#1e4229", rim: "#82bd66" },
    { dark: "#33633a", mid: "#417f46", light: "#559a50", highlight: "#7abd60", deep: "#254c2d", rim: "#98cf74" },
  ];
  paintCanopy(ctx, cx, blobs, palettes[variant % palettes.length], seed);

  if (variant === 4) {
    // A few ripe berries peeking from the leaves.
    for (let i = 0; i < 10; i += 1) {
      px(ctx, cx - 18 + rng() * 36, 28 + rng() * 28, 1, 1, i % 2 ? "#d9584c" : "#f08a5d");
    }
  }

  return { canvas, width: w, height: h, base, shadow: { rx: big ? 25 : 20, ry: 7 } };
}

export function makePine(seed, variant = 0) {
  const rng = mulberry32(seed);
  const w = 48 + (variant % 2) * 10;
  const h = 84 + (variant % 3) * 8;
  const [canvas, ctx] = makeCanvas(w, h);
  const cx = w / 2;
  const base = h - 3;

  px(ctx, cx - 4, base - 30, 9, 30, OUTLINE);
  px(ctx, cx - 2, base - 29, 5, 27, "#62402b");
  px(ctx, cx - 1, base - 27, 2, 22, "#81593a");
  px(ctx, cx - 8, base - 3, 17, 2, "#513523");

  const layers = 4 + (variant % 2);
  const dark = variant % 2 ? "#244f36" : "#27563b";
  const mid = variant % 2 ? "#2f6744" : "#33704a";
  const light = variant % 2 ? "#3d7c50" : "#43865a";
  const rim = "#68a86c";

  for (let i = 0; i < layers; i += 1) {
    const top = 8 + i * (h - 50) / layers;
    const bottom = top + (h - 38) / layers + 9;
    const half = 7 + i * (w - 20) / (layers * 2);
    pixelTriangle(ctx, cx, top - 1, bottom + 1, half * 0.25 + 1, half + 3, OUTLINE);
    pixelTriangle(ctx, cx, top, bottom, half * 0.22, half, dark);
    pixelTriangle(ctx, cx, top + 1, bottom - 2, half * 0.18, half - 2, mid);
    pixelTriangle(ctx, cx - 1, top + 2, bottom - 4, half * 0.1, half - 5, light);
    for (let j = 0; j < 5; j += 1) {
      const y = top + 3 + rng() * (bottom - top - 5);
      const t = (y - top) / (bottom - top);
      const x = cx - (half - 3) * t + rng() * 3;
      px(ctx, x, y, 1, 1, rim);
    }
  }
  px(ctx, cx - 2, 5, 4, 4, OUTLINE);
  px(ctx, cx - 1, 6, 2, 2, "#3a7a4d");

  return { canvas, width: w, height: h, base, shadow: { rx: 16, ry: 6 } };
}

export function makeBlossomTree(seed) {
  const tree = makeOak(seed, 2);
  const [canvas, ctx] = makeCanvas(tree.width, tree.height);
  ctx.drawImage(tree.canvas, 0, 0);
  const rng = mulberry32(seed + 44);
  for (let i = 0; i < 56; i += 1) {
    const x = 8 + rng() * (tree.width - 16);
    const y = 12 + rng() * (tree.height * 0.55);
    const color = rng() > 0.55 ? "#f2b6c5" : rng() > 0.4 ? "#e295b0" : "#f9d3d6";
    px(ctx, x, y, rng() > 0.7 ? 2 : 1, 1, color);
  }
  return { ...tree, canvas };
}

export function makeBush(seed) {
  const rng = mulberry32(seed);
  const w = 32;
  const h = 24;
  const [canvas, ctx] = makeCanvas(w, h);
  const cx = w / 2;
  const base = h - 2;
  const blobs = [
    { x: -6, y: base - 8, rx: 8, ry: 6 },
    { x: 6, y: base - 8, rx: 8, ry: 6 },
    { x: 0, y: base - 12, rx: 8, ry: 6 },
  ];
  paintCanopy(ctx, cx, blobs, { dark: "#2c6038", mid: "#3b7c44", light: "#519950", highlight: "#73b45c", deep: "#224b2c", rim: "#8ac36b" }, seed);
  if (seed % 3 === 0) {
    for (let i = 0; i < 6; i += 1) px(ctx, 6 + rng() * 20, base - 15 + rng() * 9, 1, 1, rng() > 0.5 ? "#e8d9ed" : "#f3b7cf");
  }
  if (seed % 4 === 0) {
    for (let i = 0; i < 5; i += 1) px(ctx, 6 + rng() * 20, base - 13 + rng() * 8, 1, 1, "#d65a54");
  }
  return { canvas, width: w, height: h, base, shadow: { rx: 12, ry: 4 } };
}

export function makeRock(seed, size = 0) {
  const rng = mulberry32(seed);
  const w = size > 0 ? 34 : 24;
  const h = size > 0 ? 24 : 17;
  const [canvas, ctx] = makeCanvas(w, h);
  const cx = w / 2;
  const base = h - 2;
  pixelEllipse(ctx, cx, base - 6, w * 0.42, h * 0.38, OUTLINE);
  pixelEllipse(ctx, cx - 1, base - 7, w * 0.38, h * 0.34, "#7f8577");
  pixelEllipse(ctx, cx - 3, base - 9, w * 0.3, h * 0.24, "#9ba08f");
  pixelEllipse(ctx, cx - 5, base - 11, w * 0.16, h * 0.11, "#b4b7a4");
  // facets
  px(ctx, cx + 2, base - 9, 5, 1, "#6c7267");
  px(ctx, cx + 6, base - 8, 2, 4, "#656b61");
  // moss
  const mossCount = 3 + Math.floor(rng() * 6);
  for (let i = 0; i < mossCount; i += 1) {
    px(ctx, cx - 10 + rng() * 20, base - 2 - rng() * 4, 1 + rng() * 2, 1, rng() > 0.5 ? "#5d8a4d" : "#76a75c");
  }
  return { canvas, width: w, height: h, base, shadow: { rx: w * 0.42, ry: 5 } };
}

/* ------------------------------------------------------------------ */
/* Buildings and village props                                         */
/* ------------------------------------------------------------------ */

export function makeCottage(seed = 21) {
  const rng = mulberry32(seed);
  const w = 100;
  const h = 90;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 85;

  // chimney
  px(ctx, 62, 7, 13, 30, OUTLINE);
  px(ctx, 63, 8, 11, 28, "#7b7768");
  for (let y = 10; y < 34; y += 4) px(ctx, 64, y, 9, 1, "#615d52");
  px(ctx, 63, 6, 11, 3, "#565347");
  px(ctx, 64, 5, 9, 1, "#3d3b34");

  // roof: wide trapezoid with shingled rows
  for (let y = 14; y <= 52; y += 1) {
    const t = (y - 14) / 38;
    const half = Math.round(18 + t * 25);
    const color = y % 4 === 0 ? "#7e372b" : y % 4 === 1 ? "#9b4532" : y % 4 === 2 ? "#aa5138" : "#94412f";
    px(ctx, 50 - half - 2, y, half * 2 + 5, 1, OUTLINE);
    px(ctx, 50 - half, y, half * 2 + 1, 1, color);
    if (y % 4 === 2) {
      for (let x = 50 - half + 3; x < 50 + half; x += 7) {
        px(ctx, x, y, 3, 1, "#bb5d40");
        px(ctx, x + 1, y - 1, 1, 1, "#c66c4d");
      }
    }
  }
  // ridge cap and gable edge
  px(ctx, 26, 12, 49, 3, "#3b2a22");
  px(ctx, 28, 15, 45, 1, "#c5724e");
  px(ctx, 18, 49, 65, 3, "#3b2a22");
  px(ctx, 19, 52, 63, 2, "#612d24");

  // walls
  px(ctx, 19, 50, 63, 33, OUTLINE);
  px(ctx, 21, 52, 59, 29, "#ead7ac");
  for (let i = 0; i < 34; i += 1) px(ctx, 23 + rng() * 55, 54 + rng() * 25, 1, 1, rng() > 0.5 ? "#dec896" : "#f3e1ba");
  // timber frame
  px(ctx, 21, 52, 3, 29, "#62422c");
  px(ctx, 75, 52, 4, 29, "#62422c");
  px(ctx, 21, 52, 59, 3, "#62422c");
  px(ctx, 24, 76, 55, 3, "#62422c");
  px(ctx, 25, 55, 3, 21, "#543823");
  px(ctx, 72, 55, 3, 21, "#543823");
  // diagonal brace
  for (let i = 0; i < 13; i += 1) px(ctx, 28 + i, 57 + i, 2, 2, "#6b4930");
  // stone footing
  for (let x = 20; x < 80; x += 8) {
    px(ctx, x, 80, 8, 4, "#9b9788");
    px(ctx, x + 1, 81, 6, 2, "#aaa797");
    px(ctx, x + 3, 81, 2, 1, "#b9b6a4");
  }

  // glowing windows
  const window = (x, y) => {
    px(ctx, x - 1, y - 1, 13, 12, "#4f3826");
    px(ctx, x, y, 11, 10, "#f7d783");
    px(ctx, x + 1, y + 1, 9, 8, "#ffe6a1");
    px(ctx, x + 5, y, 1, 10, "#6d4a2d");
    px(ctx, x, y + 4, 11, 1, "#6d4a2d");
    px(ctx, x + 1, y + 8, 3, 1, "#eabf66");
  };
  window(29, 58);
  window(61, 58);
  // flower boxes
  for (const x of [27, 59]) {
    px(ctx, x, 69, 15, 4, "#5a3d28");
    px(ctx, x + 1, 68, 13, 1, "#6f4c30");
    for (let i = 0; i < 6; i += 1) px(ctx, x + 2 + i * 2, 67 - (i % 2), 1, 1, i % 3 === 0 ? "#f19a96" : i % 3 === 1 ? "#f6d46e" : "#d56b91");
  }

  // door
  px(ctx, 44, 56, 18, 27, "#4a3222");
  px(ctx, 46, 58, 14, 25, "#7b5433");
  px(ctx, 47, 59, 3, 24, "#8e623c");
  px(ctx, 51, 59, 1, 24, "#664226");
  px(ctx, 56, 59, 1, 24, "#664226");
  px(ctx, 46, 70, 14, 1, "#5b3c24");
  px(ctx, 60, 71, 2, 2, "#e4bc61");
  px(ctx, 44, 56, 18, 2, "#3e2a1c");
  // doorstep
  px(ctx, 42, 81, 22, 3, "#8e8878");
  px(ctx, 43, 82, 20, 1, "#a8a18f");

  // lantern by the door
  px(ctx, 66, 57, 1, 5, "#4b3322");
  px(ctx, 64, 61, 5, 6, "#3c2b1d");
  px(ctx, 65, 62, 3, 4, "#f6cd68");
  px(ctx, 66, 63, 1, 2, "#fff0ac");

  // little sign above door
  px(ctx, 48, 47, 10, 4, "#4b3322");
  px(ctx, 49, 48, 8, 2, "#c09a5b");

  return {
    canvas,
    width: w,
    height: h,
    base,
    shadow: { rx: 42, ry: 8 },
    chimney: { x: 68, y: 9 },
    footprint: { x: 50, y: base - 6, halfW: 32, halfH: 16 },
  };
}

export function makeShop(seed = 27) {
  const rng = mulberry32(seed);
  const w = 92;
  const h = 84;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 79;

  // chimney
  px(ctx, 61, 5, 12, 26, OUTLINE);
  px(ctx, 62, 6, 10, 24, "#78766a");
  for (let y = 9; y < 30; y += 4) px(ctx, 63, y, 8, 1, "#605e55");
  px(ctx, 61, 4, 11, 3, "#514f45");

  // mossy teal roof
  for (let y = 13; y <= 49; y += 1) {
    const t = (y - 13) / 36;
    const half = Math.round(16 + t * 25);
    const colors = ["#2f5d58", "#3a6e66", "#33645e", "#417a70"];
    px(ctx, 46 - half - 2, y, half * 2 + 5, 1, OUTLINE);
    px(ctx, 46 - half, y, half * 2 + 1, 1, colors[y % 4]);
    if (y % 4 === 2) {
      for (let x = 46 - half + 3; x < 46 + half; x += 8) {
        px(ctx, x, y, 4, 1, "#4d8a7c");
        px(ctx, x + 1, y - 1, 2, 1, "#5b9889");
      }
    }
  }
  px(ctx, 24, 11, 45, 3, "#27312d");
  px(ctx, 26, 14, 41, 1, "#5d9a8b");
  px(ctx, 17, 46, 59, 4, "#232e29");
  px(ctx, 19, 49, 55, 2, "#2d4d45");

  // cream walls
  px(ctx, 18, 47, 57, 30, OUTLINE);
  px(ctx, 20, 49, 53, 26, "#e7d4a5");
  for (let i = 0; i < 30; i += 1) px(ctx, 22 + rng() * 49, 51 + rng() * 22, 1, 1, rng() > 0.5 ? "#d6bf8c" : "#f2e0b7");
  px(ctx, 20, 49, 53, 3, "#5a3e28");
  px(ctx, 20, 72, 53, 3, "#5a3e28");
  px(ctx, 20, 49, 3, 26, "#5a3e28");
  px(ctx, 70, 49, 3, 26, "#5a3e28");
  for (let i = 0; i < 9; i += 1) px(ctx, 24 + i, 52 + i, 2, 2, "#694830");

  // stone footing
  for (let x = 19; x < 75; x += 8) {
    px(ctx, x, 75, 8, 3, "#969283");
    px(ctx, x + 1, 76, 6, 1, "#aaa796");
  }

  // shop window with striped awning
  px(ctx, 26, 54, 20, 15, "#4e3826");
  px(ctx, 27, 55, 18, 13, "#f5d47f");
  px(ctx, 28, 56, 16, 11, "#ffe8a6");
  px(ctx, 35, 55, 1, 13, "#64452b");
  px(ctx, 27, 61, 18, 1, "#64452b");
  px(ctx, 29, 57, 4, 1, "#fff6ce");
  // awning
  for (let i = 0; i < 18; i += 1) {
    px(ctx, 25 + i, 50 + Math.floor(i / 9), 1, 4, i % 6 < 3 ? "#c15a47" : "#efe1bd");
  }
  px(ctx, 24, 49, 21, 2, "#8e4034");
  px(ctx, 24, 54, 21, 1, "#6f352b");
  // hanging herbs
  px(ctx, 49, 53, 1, 6, "#6c5638");
  px(ctx, 47, 59, 5, 4, "#7d9c5d");
  px(ctx, 48, 60, 1, 3, "#577944");
  px(ctx, 51, 59, 1, 3, "#9ab46e");
  // door
  px(ctx, 54, 56, 15, 22, "#4b3322");
  px(ctx, 56, 58, 11, 20, "#765235");
  px(ctx, 57, 59, 3, 19, "#8a633d");
  px(ctx, 61, 59, 1, 19, "#5c3e26");
  px(ctx, 56, 66, 11, 1, "#5c3e26");
  px(ctx, 64, 69, 2, 2, "#e6be63");
  px(ctx, 52, 76, 19, 2, "#8b8574");

  // round hanging sign
  px(ctx, 6, 55, 14, 2, "#3c2a1c");
  px(ctx, 7, 56, 2, 9, "#4c3421");
  pixelEllipse(ctx, 12, 68, 6, 5, OUTLINE);
  pixelEllipse(ctx, 12, 68, 5, 4, "#8a6238");
  px(ctx, 10, 66, 5, 1, "#e1b95d");
  px(ctx, 12, 65, 1, 5, "#e1b95d");
  px(ctx, 13, 68, 2, 1, "#e1b95d");

  return {
    canvas,
    width: w,
    height: h,
    base,
    shadow: { rx: 38, ry: 7 },
    chimney: { x: 66, y: 8 },
    footprint: { x: 46, y: base - 6, halfW: 30, halfH: 15 },
  };
}

export function makeTavern(seed = 33) {
  const rng = mulberry32(seed);
  const w = 118;
  const h = 108;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 103;

  // chimney
  px(ctx, 82, 8, 14, 31, OUTLINE);
  px(ctx, 83, 9, 12, 29, "#7d7668");
  for (let y = 12; y < 36; y += 4) px(ctx, 84, y, 10, 1, "#635c50");
  px(ctx, 82, 5, 13, 4, "#545044");

  // steep roof
  for (let y = 12; y <= 52; y += 1) {
    const t = (y - 12) / 40;
    const half = Math.round(20 + t * 34);
    const colors = ["#2f5d58", "#3a726a", "#32665f", "#417b71"];
    px(ctx, 59 - half - 2, y, half * 2 + 5, 1, OUTLINE);
    px(ctx, 59 - half, y, half * 2 + 1, 1, colors[y % 4]);
    if (y % 5 === 1) {
      for (let x = 59 - half + 2; x < 59 + half; x += 9) {
        px(ctx, x, y, 5, 1, "#4d877b");
        px(ctx, x + 1, y - 1, 2, 1, "#599587");
      }
    }
  }
  px(ctx, 31, 10, 57, 3, "#26302c");
  px(ctx, 33, 13, 53, 1, "#5a9385");
  px(ctx, 22, 49, 75, 4, "#222b27");
  px(ctx, 24, 52, 71, 2, "#2e4e47");

  // upper storey, slightly overhanging
  px(ctx, 14, 50, 90, 30, OUTLINE);
  px(ctx, 16, 52, 86, 26, "#e6d2a4");
  for (let i = 0; i < 36; i += 1) px(ctx, 18 + rng() * 82, 54 + rng() * 22, 1, 1, rng() > 0.5 ? "#d6bf8c" : "#f2e0b7");
  px(ctx, 16, 52, 86, 3, "#4f3523");
  px(ctx, 16, 74, 86, 3, "#4f3523");
  px(ctx, 16, 52, 3, 26, "#4f3523");
  px(ctx, 99, 52, 3, 26, "#4f3523");
  for (let i = 0; i < 12; i += 1) px(ctx, 21 + i, 55 + i, 2, 2, "#5d3d28");
  for (let i = 0; i < 12; i += 1) px(ctx, 97 - i, 55 + i, 2, 2, "#5d3d28");
  // upper windows
  for (const x of [33, 72]) {
    px(ctx, x - 1, 57, 14, 13, "#4d3625");
    px(ctx, x, 58, 12, 11, "#f4d078");
    px(ctx, x + 1, 59, 10, 9, "#ffe7a3");
    px(ctx, x + 5, 58, 1, 11, "#61422a");
    px(ctx, x, 63, 12, 1, "#61422a");
    px(ctx, x + 1, 60, 3, 1, "#fff2c4");
  }

  // ground floor stone
  px(ctx, 20, 77, 79, 24, OUTLINE);
  px(ctx, 22, 79, 75, 21, "#8f8777");
  for (let y = 80; y < 100; y += 5) {
    for (let x = 23 + ((y / 5) % 2) * 4; x < 96; x += 10) {
      px(ctx, x, y, 9, 4, rng() > 0.5 ? "#999283" : "#898274");
      px(ctx, x + 1, y + 1, 7, 2, rng() > 0.5 ? "#a8a191" : "#969080");
    }
  }
  // door with warm light
  px(ctx, 51, 77, 19, 25, "#392819");
  px(ctx, 53, 80, 15, 22, "#62432a");
  px(ctx, 54, 81, 3, 21, "#755334");
  px(ctx, 58, 81, 1, 21, "#4d3420");
  px(ctx, 64, 81, 1, 21, "#4d3420");
  px(ctx, 53, 82, 15, 5, "#e8c267");
  px(ctx, 54, 83, 13, 3, "#ffe39a");
  px(ctx, 65, 94, 2, 2, "#e8c267");
  px(ctx, 49, 101, 23, 2, "#76705f");
  // barrels
  for (const x of [30, 88]) {
    px(ctx, x, 90, 11, 12, "#3c2a1d");
    px(ctx, x + 1, 91, 9, 10, "#75502f");
    px(ctx, x + 2, 93, 7, 1, "#513723");
    px(ctx, x + 2, 98, 7, 1, "#513723");
    px(ctx, x + 3, 92, 2, 8, "#8e633a");
  }
  // hanging sign
  px(ctx, 4, 58, 15, 2, "#3a2a1c");
  px(ctx, 4, 58, 2, 13, "#4d3521");
  px(ctx, 3, 70, 11, 10, "#3a2a1c");
  px(ctx, 4, 71, 9, 8, "#7a5833");
  px(ctx, 7, 73, 3, 4, "#e2b85e");
  px(ctx, 8, 72, 1, 1, "#f5d87d");
  // window gleam on ground floor
  px(ctx, 77, 83, 10, 8, "#49331f");
  px(ctx, 78, 84, 8, 6, "#f9d987");
  px(ctx, 79, 85, 6, 4, "#ffeaa7");
  px(ctx, 82, 84, 1, 6, "#5b3c24");

  return {
    canvas,
    width: w,
    height: h,
    base,
    shadow: { rx: 48, ry: 9 },
    chimney: { x: 88, y: 10 },
    footprint: { x: 59, y: base - 7, halfW: 40, halfH: 17 },
  };
}

export function makeShrine(seed = 55) {
  const rng = mulberry32(seed);
  const w = 110;
  const h = 104;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 99;
  const stone = "#8c9183";
  const stoneDark = "#646b60";
  const stoneLight = "#b1b3a2";

  // steps
  px(ctx, 12, 91, 86, 7, OUTLINE);
  px(ctx, 14, 92, 82, 5, "#7b8073");
  px(ctx, 18, 89, 74, 4, "#8c9183");
  px(ctx, 20, 90, 70, 2, "#a1a494");

  // pillars
  const pillar = (x) => {
    px(ctx, x, 38, 16, 52, OUTLINE);
    px(ctx, x + 2, 40, 12, 48, stoneDark);
    px(ctx, x + 3, 41, 8, 46, stone);
    px(ctx, x + 4, 42, 3, 44, stoneLight);
    for (let y = 46; y < 88; y += 8) px(ctx, x + 2, y, 12, 1, "#596054");
    // moss
    for (let i = 0; i < 8; i += 1) px(ctx, x + 2 + rng() * 12, 66 + rng() * 22, 1, 1, rng() > 0.5 ? "#5e7f4d" : "#71965a");
  };
  pillar(21);
  pillar(73);

  // arch lintel
  px(ctx, 16, 26, 78, 18, OUTLINE);
  px(ctx, 18, 28, 74, 14, stoneDark);
  px(ctx, 20, 29, 70, 11, stone);
  px(ctx, 22, 30, 66, 4, stoneLight);
  // arch cut-out
  pixelEllipse(ctx, 55, 39, 24, 11, "#2c3a30");
  px(ctx, 31, 39, 48, 6, "#2c3a30");
  pixelEllipse(ctx, 55, 39, 25, 12, OUTLINE);
  pixelEllipse(ctx, 55, 39, 22, 9, "#26352c");
  px(ctx, 33, 39, 44, 5, "#26352c");
  // keystone
  px(ctx, 51, 23, 9, 9, "#a6a896");
  px(ctx, 53, 24, 5, 6, "#c1c0ac");
  // carvings
  for (let x = 21; x < 94; x += 9) px(ctx, x, 33, 4, 1, "#656b5f");
  // vines
  for (let i = 0; i < 30; i += 1) {
    const x = 18 + rng() * 76;
    const y = 27 + rng() * 55;
    if (y > 40 && (x < 38 || x > 72)) px(ctx, x, y, 1, 1 + rng() * 2, "#4c7144");
  }
  for (let i = 0; i < 10; i += 1) px(ctx, 30 + rng() * 50, 28 + rng() * 12, 1, 1, "#7ba361");

  // floating rune stone
  px(ctx, 48, 52, 15, 15, OUTLINE);
  px(ctx, 49, 53, 13, 13, "#5b6d61");
  px(ctx, 50, 54, 11, 11, "#73877a");
  px(ctx, 53, 56, 5, 1, "#a8c3a8");
  px(ctx, 53, 59, 1, 5, "#a8c3a8");
  px(ctx, 56, 59, 1, 3, "#a8c3a8");
  px(ctx, 51, 56, 2, 2, "#8fa897");
  // hanging bell / lantern
  px(ctx, 54, 44, 2, 8, "#4a4236");
  px(ctx, 51, 51, 8, 1, "#3d362d");

  return {
    canvas,
    width: w,
    height: h,
    base,
    shadow: { rx: 46, ry: 8 },
    footprint: { x: 55, y: base - 8, halfW: 40, halfH: 18 },
    rune: { x: 55, y: 59 },
  };
}

export function makeWell(seed = 77) {
  const rng = mulberry32(seed);
  const w = 48;
  const h = 52;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 49;
  const cx = 24;

  // posts
  for (const x of [10, 35]) {
    px(ctx, x, 8, 4, 32, OUTLINE);
    px(ctx, x + 1, 9, 2, 30, "#6b472e");
    px(ctx, x + 1, 10, 1, 24, "#8a603c");
  }
  // little roof
  pixelTriangle(ctx, cx, 1, 15, 4, 24, OUTLINE);
  pixelTriangle(ctx, cx, 3, 13, 2, 21, "#8d4231");
  pixelTriangle(ctx, cx, 4, 11, 1, 19, "#a9533a");
  px(ctx, 8, 12, 32, 2, "#5a2d23");
  px(ctx, 9, 13, 30, 1, "#c16746");
  // roof shingle lines
  for (let x = 10; x < 39; x += 5) px(ctx, x, 7, 2, 1, "#bb6344");
  // rope and bucket
  px(ctx, cx, 15, 1, 12, "#b99a61");
  px(ctx, cx - 3, 27, 7, 5, "#4a3621");
  px(ctx, cx - 2, 28, 5, 3, "#80613a");
  px(ctx, cx - 1, 28, 1, 3, "#a47a43");
  // stone ring
  pixelEllipse(ctx, cx, 39, 17, 9, OUTLINE);
  pixelEllipse(ctx, cx, 37, 16, 8, "#7e7e70");
  pixelEllipse(ctx, cx, 35, 14, 6, "#a3a291");
  pixelEllipse(ctx, cx, 36, 11, 5, "#3a5d61");
  pixelEllipse(ctx, cx, 36, 9, 4, "#4f8588");
  px(ctx, cx - 5, 35, 6, 1, "#8ec5b9");
  // stone blocks
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    px(ctx, cx + Math.cos(a) * 13, 35 + Math.sin(a) * 6, 3, 2, i % 2 ? "#8f8e80" : "#b3b19e");
  }
  // moss
  for (let i = 0; i < 9; i += 1) px(ctx, 9 + rng() * 30, 40 + rng() * 6, 1, 1, "#63864f");
  // base shadow stones
  px(ctx, 9, 46, 30, 2, "#6b6b5f");

  return { canvas, width: w, height: h, base, shadow: { rx: 18, ry: 5 }, chimney: null };
}

export function makeLanternPost(seed = 5) {
  const w = 14;
  const h = 40;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 38;
  px(ctx, 5, 13, 4, 24, OUTLINE);
  px(ctx, 6, 14, 2, 23, "#4c3524");
  px(ctx, 6, 15, 1, 20, "#735033");
  px(ctx, 3, 35, 8, 3, "#3d2b1d");
  px(ctx, 4, 36, 6, 1, "#68503a");
  // lamp housing
  px(ctx, 3, 5, 8, 10, "#3b2a1d");
  px(ctx, 4, 6, 6, 8, "#f2c864");
  px(ctx, 5, 7, 4, 6, "#ffe9a1");
  px(ctx, 6, 8, 2, 4, "#fff6cc");
  px(ctx, 3, 2, 8, 3, "#4a3725");
  px(ctx, 5, 0, 4, 2, "#3b2a1d");
  px(ctx, 3, 14, 8, 2, "#3b2a1d");
  return { canvas, width: w, height: h, base, shadow: { rx: 5, ry: 2 }, glow: { x: 7, y: 10 } };
}

export function makeFence(seed = 8, vertical = false) {
  const w = vertical ? 12 : 38;
  const h = vertical ? 38 : 22;
  const [canvas, ctx] = makeCanvas(w, h);
  if (vertical) {
    px(ctx, 4, 2, 4, 34, OUTLINE);
    px(ctx, 5, 3, 2, 32, "#715033");
    px(ctx, 5, 4, 1, 28, "#98724a");
    px(ctx, 1, 7, 10, 3, "#4a3322");
    px(ctx, 1, 8, 10, 1, "#8c6843");
    px(ctx, 2, 24, 8, 3, "#4a3322");
    px(ctx, 2, 25, 8, 1, "#8c6843");
  } else {
    px(ctx, 2, 4, 4, 16, OUTLINE);
    px(ctx, 3, 5, 2, 14, "#715033");
    px(ctx, 32, 4, 4, 16, OUTLINE);
    px(ctx, 33, 5, 2, 14, "#715033");
    px(ctx, 4, 7, 30, 3, "#4a3322");
    px(ctx, 4, 8, 30, 1, "#947048");
    px(ctx, 4, 14, 30, 3, "#4a3322");
    px(ctx, 4, 15, 30, 1, "#947048");
  }
  return { canvas, width: w, height: h, base: h - 2, shadow: { rx: vertical ? 4 : 18, ry: 2 } };
}

export function makeCrate(seed = 9) {
  const w = 19;
  const h = 19;
  const [canvas, ctx] = makeCanvas(w, h);
  px(ctx, 0, 0, 19, 19, OUTLINE);
  px(ctx, 1, 2, 17, 16, "#7a5430");
  px(ctx, 2, 3, 15, 14, "#a37745");
  px(ctx, 2, 4, 15, 2, "#b88a53");
  px(ctx, 3, 8, 13, 2, "#624426");
  px(ctx, 3, 13, 13, 2, "#624426");
  for (let i = 0; i < 8; i += 1) px(ctx, 3 + i * 2, 10 + i, 2, 1, "#87603a");
  return { canvas, width: w, height: h, base: 18, shadow: { rx: 8, ry: 3 } };
}

export function makeBarrel(seed = 10) {
  const w = 16;
  const h = 21;
  const [canvas, ctx] = makeCanvas(w, h);
  px(ctx, 1, 1, 14, 19, OUTLINE);
  px(ctx, 2, 2, 12, 17, "#704b2c");
  px(ctx, 3, 3, 10, 15, "#96693a");
  px(ctx, 4, 4, 2, 13, "#b17f46");
  px(ctx, 2, 6, 12, 2, "#4a3220");
  px(ctx, 2, 15, 12, 2, "#4a3220");
  px(ctx, 2, 10, 12, 1, "#7e5732");
  px(ctx, 5, 2, 1, 17, "#7e5732");
  return { canvas, width: w, height: h, base: 19, shadow: { rx: 6, ry: 3 } };
}

export function makeBench(seed = 16) {
  const w = 34;
  const h = 22;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 19;
  // legs
  px(ctx, 4, 11, 4, 8, "#3c2a1c");
  px(ctx, 5, 12, 2, 6, "#6b4a2c");
  px(ctx, 26, 11, 4, 8, "#3c2a1c");
  px(ctx, 27, 12, 2, 6, "#6b4a2c");
  // seat
  px(ctx, 2, 10, 30, 4, "#3c2a1c");
  px(ctx, 3, 11, 28, 2, "#9a7144");
  px(ctx, 4, 11, 26, 1, "#bb8d55");
  // back
  px(ctx, 4, 2, 4, 9, "#3c2a1c");
  px(ctx, 5, 3, 2, 8, "#6b4a2c");
  px(ctx, 26, 2, 4, 9, "#3c2a1c");
  px(ctx, 27, 3, 2, 8, "#6b4a2c");
  px(ctx, 4, 4, 26, 3, "#4a3220");
  px(ctx, 5, 5, 24, 1, "#9a7144");
  px(ctx, 4, 8, 26, 2, "#4a3220");
  px(ctx, 5, 9, 24, 1, "#8b633c");
  return { canvas, width: w, height: h, base, shadow: { rx: 14, ry: 3 } };
}

export function makePlanter(seed = 17) {
  const rng = mulberry32(seed);
  const w = 22;
  const h = 20;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 18;
  px(ctx, 2, 8, 18, 10, "#3c2a1c");
  px(ctx, 3, 9, 16, 8, "#7a5430");
  px(ctx, 4, 10, 14, 2, "#956b3c");
  px(ctx, 4, 14, 14, 1, "#5b3e27");
  for (let i = 0; i < 6; i += 1) {
    const x = 5 + rng() * 12;
    const y = 3 + rng() * 6;
    px(ctx, x, y, 1, 2, "#4f7d3f");
    px(ctx, x - 1, y, 1, 1, rng() > 0.5 ? "#e9a0b2" : "#f4d26d");
    px(ctx, x + 1, y, 1, 1, rng() > 0.5 ? "#f5eac9" : "#eba6bc");
  }
  return { canvas, width: w, height: h, base, shadow: { rx: 8, ry: 2 } };
}

export function makeSignpost(seed = 11) {
  const w = 25;
  const h = 38;
  const [canvas, ctx] = makeCanvas(w, h);
  px(ctx, 10, 6, 4, 30, OUTLINE);
  px(ctx, 11, 7, 2, 28, "#6a4a2e");
  px(ctx, 11, 8, 1, 24, "#8b6640");
  px(ctx, 2, 8, 20, 8, OUTLINE);
  px(ctx, 3, 9, 18, 6, "#8a633c");
  px(ctx, 4, 10, 16, 1, "#ae8351");
  px(ctx, 4, 14, 16, 1, "#5f4228");
  px(ctx, 5, 11, 9, 2, "#d7b478");
  px(ctx, 15, 11, 4, 2, "#d7b478");
  px(ctx, 6, 21, 16, 7, OUTLINE);
  px(ctx, 7, 22, 14, 5, "#82603b");
  px(ctx, 7, 26, 14, 1, "#5b3f26");
  px(ctx, 8, 23, 8, 2, "#d4b078");
  px(ctx, 3, 35, 18, 2, "#4e3723");
  return { canvas, width: w, height: h, base: 36, shadow: { rx: 9, ry: 3 } };
}

export function makeDock(seed = 12) {
  const w = 96;
  const h = 30;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 27;
  px(ctx, 2, 5, 92, 20, OUTLINE);
  for (let x = 4; x < 92; x += 12) {
    px(ctx, x, 6, 11, 18, "#6d4a2e");
    px(ctx, x + 1, 7, 9, 16, x % 24 === 4 ? "#a47b4d" : "#966f45");
    px(ctx, x + 2, 8, 7, 1, "#c19660");
    px(ctx, x + 5, 12, 1, 1, "#5b3f28");
    px(ctx, x + 2, 19, 2, 1, "#5b3f28");
  }
  px(ctx, 2, 24, 92, 2, "#4a3220");
  for (const x of [6, 86]) {
    px(ctx, x, 0, 4, 27, "#3f2c1d");
    px(ctx, x + 1, 1, 2, 25, "#6f4c2e");
    px(ctx, x + 1, 2, 1, 20, "#8f6740");
  }
  return { canvas, width: w, height: h, base, shadow: { rx: 45, ry: 4 } };
}

export function makeReeds(seed = 13) {
  const rng = mulberry32(seed);
  const w = 26;
  const h = 30;
  const [canvas, ctx] = makeCanvas(w, h);
  for (let i = 0; i < 9; i += 1) {
    const x = 4 + rng() * 18;
    const top = 4 + rng() * 12;
    const lean = rng() > 0.5 ? 1 : -1;
    px(ctx, x, top, 1, h - top - 2, rng() > 0.5 ? "#4e7d45" : "#67954e");
    px(ctx, x + lean, top - 2, 1, 2, "#3d6a39");
    if (rng() > 0.55) px(ctx, x + lean, top - 4, 2, 2, "#8b6a3e");
  }
  return { canvas, width: w, height: h, base: h - 2, shadow: { rx: 8, ry: 2 } };
}

export function makeLilypad(seed = 14) {
  const w = 16;
  const h = 11;
  const [canvas, ctx] = makeCanvas(w, h);
  pixelEllipse(ctx, 8, 6, 7, 4, "#2d6b53");
  pixelEllipse(ctx, 8, 5, 6, 3, "#4b8a5d");
  px(ctx, 8, 5, 1, 2, "#2d6b53");
  px(ctx, 4, 4, 3, 1, "#77aa69");
  if (seed % 2) px(ctx, 10, 3, 2, 2, "#f1c1d0");
  return { canvas, width: w, height: h, base: h - 2, shadow: null };
}

export function makeMonolith(seed = 15) {
  const rng = mulberry32(seed);
  const w = 30;
  const h = 58;
  const [canvas, ctx] = makeCanvas(w, h);
  const base = 55;
  const cx = 15;
  px(ctx, cx - 8, 8, 17, 47, OUTLINE);
  px(ctx, cx - 6, 10, 13, 44, "#6f7567");
  px(ctx, cx - 4, 11, 5, 42, "#8d9180");
  px(ctx, cx + 2, 15, 4, 37, "#60665b");
  px(ctx, cx - 5, 0, 11, 11, OUTLINE);
  px(ctx, cx - 3, 2, 7, 8, "#7a8071");
  px(ctx, cx - 2, 3, 2, 5, "#a1a38e");
  // rune
  px(ctx, cx - 1, 24, 3, 9, "#5d8f82");
  px(ctx, cx - 4, 27, 9, 2, "#5d8f82");
  px(ctx, cx + 1, 20, 2, 2, "#8cc5ad");
  // moss and cracks
  for (let i = 0; i < 12; i += 1) px(ctx, cx - 7 + rng() * 14, 20 + rng() * 32, 1, 1, rng() > 0.5 ? "#607e4f" : "#77965a");
  for (let i = 0; i < 5; i += 1) px(ctx, cx - 2 + i, 36 + i, 1, 1, "#4b5248");
  return { canvas, width: w, height: h, base, shadow: { rx: 12, ry: 4 } };
}

/* ------------------------------------------------------------------ */
/* Player                                                              */
/* ------------------------------------------------------------------ */

const SKIN = "#f0c79b";
const SKIN_SHADE = "#d7a476";
const HAIR = "#e8c46a";
const HAIR_SHADE = "#c49a43";
const HOOD_DARK = "#1e4c40";
const HOOD = "#2e6b57";
const HOOD_LIGHT = "#4b9674";
const CLOAK_DARK = "#244f43";
const CLOAK = "#357a61";
const CLOAK_LIGHT = "#59a37c";
const TUNIC = "#e3d5ad";
const TUNIC_SHADE = "#c2b183";
const BELT = "#6d432b";
const BOOT = "#3a2c27";
const BOOT_LIGHT = "#5b463a";
const LANTERN_GLOW = "#ffd875";
const LANTERN_HI = "#fff3bb";
const METAL = "#8c6238";

function drawPlayerFrame(direction, frame) {
  const w = 28;
  const h = 36;
  const [canvas, ctx] = makeCanvas(w, h);
  const cx = 13;
  const base = 33;
  const cycle = [1, 0, -1, 0][frame];
  const bob = [0, 1, 0, 1][frame];
  const side = direction === "right";
  const up = direction === "up";
  const down = direction === "down";
  const bodyY = 13 + bob;

  // shadow-free character, base at y=33.
  if (side) {
    // trailing cloak
    pixelEllipse(ctx, cx - 4, bodyY + 10, 8, 9, OUTLINE);
    pixelEllipse(ctx, cx - 5, bodyY + 9, 6, 7, CLOAK_DARK);
    pixelEllipse(ctx, cx - 6, bodyY + 8, 4, 5, CLOAK);
    px(ctx, cx - 9, bodyY + 12 + cycle, 4, 5, CLOAK_DARK);
    px(ctx, cx - 8, bodyY + 13 + cycle, 2, 3, CLOAK_LIGHT);
    // legs
    const front = 1 + Math.max(0, cycle);
    const back = 1 + Math.max(0, -cycle);
    px(ctx, cx - 4, base - 7 - front, 4, 7 + front, OUTLINE);
    px(ctx, cx - 3, base - 6 - front, 2, 5 + front, BOOT);
    px(ctx, cx - 3, base - 1, 5, 2, "#241d1a");
    px(ctx, cx + 2, base - 7 - back, 4, 7 + back, OUTLINE);
    px(ctx, cx + 3, base - 6 - back, 2, 5 + back, BOOT_LIGHT);
    px(ctx, cx + 2, base - 1, 5, 2, "#241d1a");
    // torso
    px(ctx, cx - 4, bodyY + 1, 9, 11, OUTLINE);
    px(ctx, cx - 3, bodyY + 2, 7, 9, TUNIC);
    px(ctx, cx - 3, bodyY + 2, 2, 9, "#f0e4c2");
    px(ctx, cx + 2, bodyY + 2, 2, 9, TUNIC_SHADE);
    px(ctx, cx - 3, bodyY + 8, 8, 2, BELT);
    px(ctx, cx + 1, bodyY + 8, 2, 2, "#e5bd5e");
    // shoulder cloak
    px(ctx, cx - 5, bodyY, 8, 4, OUTLINE);
    px(ctx, cx - 4, bodyY + 1, 6, 2, CLOAK);
    px(ctx, cx - 4, bodyY + 1, 3, 1, CLOAK_LIGHT);
    // arm forward
    px(ctx, cx + 3, bodyY + 3, 4, 2, OUTLINE);
    px(ctx, cx + 4, bodyY + 3, 3, 1, CLOAK);
    // head / hood
    pixelEllipse(ctx, cx + 1, bodyY - 3, 7, 7, OUTLINE);
    pixelEllipse(ctx, cx + 1, bodyY - 3, 6, 6, HOOD);
    pixelEllipse(ctx, cx + 1, bodyY - 4, 4, 4, HOOD_LIGHT);
    // face in profile
    pixelEllipse(ctx, cx + 4, bodyY - 2, 3, 4, SKIN);
    px(ctx, cx + 5, bodyY - 2, 1, 1, "#3a2c2a");
    px(ctx, cx + 5, bodyY + 1, 1, 1, SKIN_SHADE);
    px(ctx, cx + 2, bodyY - 7, 4, 3, HAIR);
    px(ctx, cx + 5, bodyY - 6, 2, 2, HAIR_SHADE);
    // hood rim
    px(ctx, cx + 2, bodyY - 9, 4, 1, HOOD_LIGHT);
    px(ctx, cx - 5, bodyY + 1, 1, 3, CLOAK_LIGHT);
    // hand + lantern
    px(ctx, cx + 6, bodyY + 5, 3, 3, OUTLINE);
    px(ctx, cx + 6, bodyY + 5, 2, 2, SKIN);
    const lx = cx + 7;
    const ly = bodyY + 8 + (cycle > 0 ? 1 : 0);
    px(ctx, lx + 1, ly - 1, 1, 3, "#5b4229");
    px(ctx, lx, ly + 2, 5, 6, OUTLINE);
    px(ctx, lx + 1, ly + 3, 3, 4, METAL);
    px(ctx, lx + 1, ly + 3, 3, 3, LANTERN_GLOW);
    px(ctx, lx + 2, ly + 4, 1, 1, LANTERN_HI);
    px(ctx, lx, ly + 1, 5, 1, "#4e3622");
  } else {
    // cloak / cape behind body
    pixelEllipse(ctx, cx, bodyY + 10, 9, 9, OUTLINE);
    pixelEllipse(ctx, cx, bodyY + 9, 8, 8, CLOAK_DARK);
    pixelEllipse(ctx, cx - 1, bodyY + 9, 6, 6, CLOAK);
    px(ctx, cx - 8, bodyY + 12, 3, 5 + Math.abs(cycle), CLOAK_DARK);
    px(ctx, cx + 6, bodyY + 12, 3, 5 + Math.abs(cycle), CLOAK_DARK);
    px(ctx, cx - 7, bodyY + 13, 1, 3, CLOAK_LIGHT);
    px(ctx, cx + 7, bodyY + 13, 1, 3, CLOAK_LIGHT);
    // legs
    const leftLift = cycle > 0 ? 2 : 0;
    const rightLift = cycle < 0 ? 2 : 0;
    px(ctx, cx - 5, base - 7 - leftLift, 4, 7 + leftLift, OUTLINE);
    px(ctx, cx - 4, base - 6 - leftLift, 2, 5 + leftLift, BOOT);
    px(ctx, cx - 4, base - 1, 4, 2, "#241d1a");
    px(ctx, cx + 1, base - 7 - rightLift, 4, 7 + rightLift, OUTLINE);
    px(ctx, cx + 2, base - 6 - rightLift, 2, 5 + rightLift, BOOT_LIGHT);
    px(ctx, cx + 2, base - 1, 4, 2, "#241d1a");
    // torso
    px(ctx, cx - 5, bodyY + 1, 11, 11, OUTLINE);
    px(ctx, cx - 4, bodyY + 2, 9, 9, TUNIC);
    px(ctx, cx - 4, bodyY + 2, 2, 9, "#f0e4c2");
    px(ctx, cx + 3, bodyY + 2, 2, 9, TUNIC_SHADE);
    px(ctx, cx - 4, bodyY + 8, 9, 2, BELT);
    px(ctx, cx - 1, bodyY + 8, 2, 2, "#e5bd5e");
    // sleeves
    px(ctx, cx - 7, bodyY + 2, 3, 6, OUTLINE);
    px(ctx, cx - 6, bodyY + 3, 2, 4, CLOAK_DARK);
    px(ctx, cx + 5, bodyY + 2, 3, 6, OUTLINE);
    px(ctx, cx + 5, bodyY + 3, 2, 4, CLOAK);
    px(ctx, cx + 5, bodyY + 3, 1, 3, CLOAK_LIGHT);
    // hands
    px(ctx, cx - 7, bodyY + 7, 3, 3, SKIN);
    px(ctx, cx + 5, bodyY + 7, 3, 3, SKIN);
    px(ctx, cx - 7, bodyY + 8, 1, 1, SKIN_SHADE);
    px(ctx, cx + 7, bodyY + 8, 1, 1, SKIN_SHADE);
    // head / hood
    pixelEllipse(ctx, cx, bodyY - 4, 7, 7, OUTLINE);
    pixelEllipse(ctx, cx, bodyY - 4, 6, 6, HOOD);
    pixelEllipse(ctx, cx, bodyY - 4, 6, 5, HOOD_DARK);
    pixelEllipse(ctx, cx, bodyY - 5, 5, 4, HOOD);
    px(ctx, cx - 3, bodyY - 8, 6, 1, HOOD_LIGHT);
    px(ctx, cx - 4, bodyY - 7, 2, 1, HOOD_LIGHT);

    if (up) {
      // back of the hood, clasp and hair peeking out
      pixelEllipse(ctx, cx, bodyY - 4, 5, 5, HOOD_DARK);
      px(ctx, cx - 3, bodyY - 5, 6, 2, "#295e4c");
      px(ctx, cx - 1, bodyY + 1, 2, 2, "#d6ad56");
      px(ctx, cx - 3, bodyY + 4, 6, 1, CLOAK_LIGHT);
      px(ctx, cx - 1, bodyY + 5, 2, 2, "#c99f43");
    } else if (down) {
      // face and fringe
      pixelEllipse(ctx, cx, bodyY - 3, 4, 4, SKIN);
      px(ctx, cx - 3, bodyY - 6, 6, 2, HAIR);
      px(ctx, cx - 3, bodyY - 4, 1, 2, HAIR_SHADE);
      px(ctx, cx + 2, bodyY - 4, 1, 2, HAIR_SHADE);
      px(ctx, cx - 2, bodyY - 2, 1, 1, "#3a2c2a");
      px(ctx, cx + 1, bodyY - 2, 1, 1, "#3a2c2a");
      px(ctx, cx - 1, bodyY + 1, 2, 1, "#c98f73");
      px(ctx, cx - 3, bodyY + 2, 1, 1, "#e7b98f");
      px(ctx, cx + 3, bodyY + 2, 1, 1, "#e7b98f");
    }
    // lantern in right hand (screen right)
    const sway = cycle > 0 ? 1 : 0;
    const lx = cx + 6;
    const ly = bodyY + 9 + sway;
    px(ctx, lx + 2, ly - 2, 1, 4, "#5b4229");
    px(ctx, lx, ly + 2, 6, 7, OUTLINE);
    px(ctx, lx + 1, ly + 3, 4, 5, METAL);
    px(ctx, lx + 1, ly + 3, 4, 4, LANTERN_GLOW);
    px(ctx, lx + 2, ly + 4, 1, 1, LANTERN_HI);
    px(ctx, lx, ly + 1, 6, 1, "#4e3622");
    // satchel
    px(ctx, cx - 8, bodyY + 7, 3, 5, "#5b3d27");
    px(ctx, cx - 7, bodyY + 8, 1, 3, "#7d5838");
  }

  return canvas;
}

export function makePlayerSprites() {
  const directions = ["down", "up", "left", "right"];
  const sprites = {};
  for (const dir of directions) {
    sprites[dir] = [];
    for (let frame = 0; frame < 4; frame += 1) {
      if (dir === "left") {
        const right = drawPlayerFrame("right", frame);
        const [canvas, ctx] = makeCanvas(right.width, right.height);
        ctx.translate(right.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(right, 0, 0);
        sprites[dir].push(canvas);
      } else {
        sprites[dir].push(drawPlayerFrame(dir, frame));
      }
    }
  }
  return { sprites, width: 28, height: 36, base: 33 };
}

export function makeBloomSprite(seed = 31) {
  const rng = mulberry32(seed);
  const w = 20;
  const h = 28;
  const [canvas, ctx] = makeCanvas(w, h);
  const cx = 10;
  const base = 25;
  // stem
  px(ctx, cx, base - 9, 1, 10, "#4f7d3f");
  px(ctx, cx - 3, base - 6, 3, 1, "#619549");
  px(ctx, cx - 3, base - 8, 1, 2, "#619549");
  px(ctx, cx + 2, base - 3, 3, 1, "#619549");
  px(ctx, cx + 4, base - 5, 1, 2, "#619549");
  // leaves with glow
  px(ctx, cx - 5, base - 11, 4, 2, "#78ad58");
  px(ctx, cx + 3, base - 8, 4, 2, "#78ad58");
  // petals
  const petals = [
    [cx, 8], [cx - 3, 9], [cx + 3, 9], [cx - 2, 6], [cx + 2, 6],
    [cx - 4, 11], [cx + 4, 11], [cx - 1, 12], [cx + 1, 12],
  ];
  for (const [x, y] of petals) px(ctx, x, y, 2, 2, "#f8d978");
  for (const [x, y] of petals) px(ctx, x, y, 1, 1, "#fff1b1");
  px(ctx, cx - 1, 9, 3, 3, "#fff8d9");
  px(ctx, cx, 10, 1, 1, "#e8b848");
  // sparkle bits
  for (let i = 0; i < 6; i += 1) px(ctx, 2 + rng() * 16, 2 + rng() * 12, 1, 1, rng() > 0.5 ? "#fff6ce" : "#f4c65d");
  return { canvas, width: w, height: h, base };
}

export function makeButterflySprite(color = "#f4dc8a") {
  const [canvas, ctx] = makeCanvas(7, 5);
  px(ctx, 3, 2, 1, 1, "#3b3227");
  px(ctx, 1, 1, 2, 2, color);
  px(ctx, 4, 1, 2, 2, color);
  px(ctx, 0, 2, 2, 1, color);
  px(ctx, 5, 2, 2, 1, color);
  return canvas;
}
