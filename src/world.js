// Procedural valley construction: terrain is baked once into a large pixel
// canvas, while tall props are y-sorted every frame so the player can slip
// behind trees, roofs and stone arches.
import {
  WORLD, PATHS, PLAZA, POND, BUILDINGS, BLOOM_POSITIONS, PLAYER,
} from "./config.js";
import { mulberry32, pick, rand, randInt, clamp, hash2 } from "./rng.js";
import {
  makeCanvas, px, pixelEllipse, drawShadow, makeGrassTiles, drawGrassBlade,
  drawFlower, makeOak, makePine, makeBlossomTree, makeBush, makeRock,
  makeCottage, makeTavern, makeShrine, makeWell, makeLanternPost, makeFence,
  makeCrate, makeBarrel, makeSignpost, makeDock, makeReeds, makeLilypad,
  makeMonolith, makeBloomSprite, makeButterflySprite, makeBench, makePlanter, makeShop,
} from "./art.js";

const S = 4; // path mask scale

function catmullRom(points, steps = 12) {
  if (points.length < 2) return points.map(([x, y]) => ({ x, y }));
  const out = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let j = 0; j < steps; j += 1) {
      const t = j / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push({ x, y });
    }
  }
  out.push({ x: points[points.length - 1][0], y: points[points.length - 1][1] });
  return out;
}

function stampPath(ctx, samples, radius, color, seed = 0) {
  ctx.fillStyle = color;
  for (let i = 0; i < samples.length; i += 1) {
    const p = samples[i];
    const wobble = Math.sin(i * 0.61 + seed) * 1.7 + Math.sin(i * 0.17 + seed * 2) * 1.1;
    pixelEllipse(ctx, p.x, p.y, radius + wobble, radius + wobble, color);
  }
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export class World {
  constructor() {
    this.width = WORLD.width;
    this.height = WORLD.height;
    this.props = [];
    this.solids = [];
    this.blooms = [];
    this.butterflies = [];
    this.ripples = [];
    this.smokeSources = [];
    this.lanterns = [];
    this.buildings = {};
    this.titleTrees = [];
    this.rng = mulberry32(20240617);

    this.pathSamples = PATHS.map((path, index) => catmullRom(path, 9));
    this.buildMasks();
    this.bakeGround();
    this.buildVillage();
    this.scatterNature();
    this.buildBlooms();
    this.buildAmbient();
  }

  /* ---------------------------------------------------------------- */
  /* Terrain                                                          */
  /* ---------------------------------------------------------------- */

  buildMasks() {
    this.pathMask = makeCanvas(this.width / S, this.height / S);
    const pctx = this.pathMask[1];
    pctx.scale(1 / S, 1 / S);
    for (let i = 0; i < this.pathSamples.length; i += 1) {
      stampPath(pctx, this.pathSamples[i], 30, "#ffffff", i * 7);
    }
    pixelEllipse(pctx, PLAZA.x, PLAZA.y, PLAZA.rx + 10, PLAZA.ry + 10, "#ffffff");
    this.pathPixels = pctx.getImageData(0, 0, this.pathMask[0].width, this.pathMask[0].height).data;
    this.maskW = this.pathMask[0].width;
  }

  pathAlpha(x, y) {
    const ix = Math.floor(x / S);
    const iy = Math.floor(y / S);
    if (ix < 0 || iy < 0 || ix >= this.maskW || iy >= this.pathMask[0].height) return 0;
    return this.pathPixels[(iy * this.maskW + ix) * 4 + 3];
  }

  onPath(x, y) {
    return this.pathAlpha(x, y) > 24;
  }

  nearPath(x, y, radius = 26) {
    const offsets = [[0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius], [radius * 0.7, radius * 0.7], [-radius * 0.7, radius * 0.7], [radius * 0.7, -radius * 0.7], [-radius * 0.7, -radius * 0.7]];
    return offsets.some(([ox, oy]) => this.onPath(x + ox, y + oy));
  }

  inPlaza(x, y) {
    const dx = (x - PLAZA.x) / (PLAZA.rx + 16);
    const dy = (y - PLAZA.y) / (PLAZA.ry + 14);
    return dx * dx + dy * dy < 1;
  }

  inPond(x, y, margin = 16) {
    const dx = (x - POND.x) / (POND.rx + margin);
    const dy = (y - POND.y) / (POND.ry + margin);
    return dx * dx + dy * dy < 1;
  }

  inBuildingClearing(x, y, margin = 14) {
    for (const key of Object.keys(this.buildingFootprints || {})) {
      const f = this.buildingFootprints[key];
      if (Math.abs(x - f.x) < f.halfW + margin && Math.abs(y - f.y) < f.halfH + margin) return true;
    }
    return false;
  }

  bakeGround() {
    const rng = mulberry32(9801);
    const [canvas, ctx] = makeCanvas(this.width, this.height);
    this.ground = canvas;
    this.groundCtx = ctx;

    // A soft mossy base, then a patchwork of closely related grass tiles.
    ctx.fillStyle = "#5f9b47";
    ctx.fillRect(0, 0, this.width, this.height);

    const tiles = makeGrassTiles(4411);
    for (let y = 0; y < this.height; y += 16) {
      for (let x = 0; x < this.width; x += 16) {
        const index = Math.floor(hash2(x / 16, y / 16, 17) * tiles.length);
        ctx.drawImage(tiles[index], x, y);
      }
    }

    // Broad, subtle tonal patches keep large lawns from looking flat.
    for (let i = 0; i < 170; i += 1) {
      const x = rand(rng, 0, this.width);
      const y = rand(rng, 0, this.height);
      const rx = rand(rng, 18, 80);
      const ry = rand(rng, 12, 46);
      const light = rng() > 0.46;
      pixelEllipse(ctx, x, y, rx, ry, light ? "rgba(145, 195, 102, 0.075)" : "rgba(40, 83, 39, 0.065)");
    }

    // Warm sunlight dapples.
    for (let i = 0; i < 85; i += 1) {
      const x = rand(rng, 0, this.width);
      const y = rand(rng, 0, this.height);
      pixelEllipse(ctx, x, y, rand(rng, 7, 24), rand(rng, 3, 10), "rgba(248, 224, 145, 0.04)");
    }

    // Grass tufts and blades, thicker at the verges.
    for (let i = 0; i < 900; i += 1) {
      const x = rand(rng, 6, this.width - 6);
      const y = rand(rng, 8, this.height - 4);
      if (this.inPond(x, y, 8)) continue;
      drawGrassBlade(ctx, x, y, rng, ["#4b853c", "#5c9744", "#74ad52", "#3e7735"]);
    }

    // Paths are painted as overlapping earthy ellipses for a hand-trodden edge.
    for (let i = 0; i < this.pathSamples.length; i += 1) {
      const samples = this.pathSamples[i];
      stampPath(ctx, samples, 28, "#927044", i * 11);
      stampPath(ctx, samples, 24, "#c19b60", i * 11 + 3);
      stampPath(ctx, samples, 18, "#cca96e", i * 11 + 6);
      // A lighter, dustier crown down the centre.
      stampPath(ctx, samples, 8, "rgba(225, 195, 133, 0.34)", i * 11 + 9);
    }

    // Path grain: pebbles, cracks and pressed leaves.
    for (const samples of this.pathSamples) {
      for (let i = 2; i < samples.length - 2; i += 2) {
        const p = samples[i];
        if (rng() > 0.45) {
          const ox = rand(rng, -17, 17);
          const oy = rand(rng, -17, 17);
          if (ox * ox + oy * oy < 300) {
            const tone = rng();
            px(ctx, p.x + ox, p.y + oy, rng() > 0.8 ? 2 : 1, 1, tone > 0.62 ? "#d8bc83" : tone > 0.3 ? "#ae8a52" : "#8b6a3e");
          }
        }
        if (rng() > 0.94) {
          px(ctx, p.x + rand(rng, -12, 12), p.y + rand(rng, -12, 12), 4, 1, "#9b7647");
        }
      }
    }

    // Grass spilling over the path edges.
    for (const samples of this.pathSamples) {
      for (let i = 0; i < samples.length; i += 3) {
        const p = samples[i];
        for (let k = 0; k < 2; k += 1) {
          const angle = rng() * Math.PI * 2;
          const radius = rand(rng, 24, 31);
          const x = p.x + Math.cos(angle) * radius;
          const y = p.y + Math.sin(angle) * radius;
          if (!this.inPond(x, y, 4)) drawGrassBlade(ctx, x, y, rng, ["#4b853c", "#639c45", "#75ad53"]);
        }
      }
    }

    this.paintPlaza(ctx, rng);
    this.paintPond(ctx, rng);

    // Ground cover: flower clusters, mushrooms and scattered stones.
    const flowerPalettes = [
      ["#f5ecc9", "#f7dfa0", "#f8e8ba"],
      ["#f1d06c", "#f6df91", "#e9be54"],
      ["#e8a4b3", "#f2c5ce", "#d986a3"],
      ["#a9c5e2", "#c2d8ee", "#8fb2d5"],
      ["#c1a9dc", "#d9c5ea", "#ab8fcd"],
    ];
    for (let c = 0; c < 150; c += 1) {
      let x = rand(rng, 30, this.width - 30);
      let y = rand(rng, 40, this.height - 24);
      if (this.onPath(x, y) || this.inPlaza(x, y) || this.inPond(x, y, 14) || this.inBuildingClearing(x, y, 20)) continue;
      if (rng() > 0.52) {
        x += rand(rng, -35, 35);
        y += rand(rng, -24, 24);
      }
      const palette = pick(rng, flowerPalettes);
      const count = randInt(rng, 2, 7);
      for (let i = 0; i < count; i += 1) {
        drawFlower(ctx, x + rand(rng, -13, 13), y + rand(rng, -8, 8), rng, palette);
      }
    }

    for (let i = 0; i < 190; i += 1) {
      const x = rand(rng, 10, this.width - 10);
      const y = rand(rng, 14, this.height - 8);
      if (this.inPond(x, y, 4) || this.inPlaza(x, y)) continue;
      const onPath = this.onPath(x, y);
      if (!onPath && rng() > 0.42) continue;
      px(ctx, x, y, 1, 1, rng() > 0.5 ? "#8b7e69" : "#a99a7d");
      if (rng() > 0.72) px(ctx, x + 1, y, 1, 1, "#716656");
    }

    // Clover and tiny mushrooms in the shade.
    for (let i = 0; i < 45; i += 1) {
      const x = rand(rng, 20, this.width - 20);
      const y = rand(rng, 30, this.height - 20);
      if (this.onPath(x, y) || this.inPlaza(x, y) || this.inPond(x, y, 10)) continue;
      if (rng() > 0.5) {
        px(ctx, x, y, 1, 1, "#f0d7c1");
        px(ctx, x - 1, y - 1, 3, 1, "#c97054");
        px(ctx, x, y - 2, 1, 1, "#f5e3cc");
      } else {
        for (let k = 0; k < 3; k += 1) px(ctx, x + k, y - (k % 2), 1, 2, "#73a856");
      }
    }
  }

  paintPlaza(ctx, rng) {
    const { x, y, rx, ry } = PLAZA;
    // The crossing is a little chewed at the edges; a few overlapping ellipses
    // keep it from reading as a perfect stamped circle.
    pixelEllipse(ctx, x - 3, y + 2, rx + 12, ry + 10, "#7a6a4f");
    pixelEllipse(ctx, x + 5, y - 1, rx + 8, ry + 7, "#a08a61");
    pixelEllipse(ctx, x, y, rx + 4, ry + 3, "#a99469");
    pixelEllipse(ctx, x, y, rx, ry, "#84765c");

    const stoneColors = ["#9a8c6e", "#908265", "#a69878", "#87795f", "#a29473", "#8d7f62"];
    for (let row = -ry; row < ry; row += 7) {
      const offset = ((row / 7) % 2) * 5;
      for (let col = -rx - 6; col < rx + 6; col += 10) {
        const sx = x + col + offset;
        const sy = y + row;
        const nx = (sx - x) / (rx - 5);
        const ny = (sy - y) / (ry - 5);
        if (nx * nx + ny * ny > 1) continue;
        if (rng() > 0.91) continue; // a missing cobble or two
        const color = pick(rng, stoneColors);
        px(ctx, sx, sy, 8, 5, "#6d6250");
        px(ctx, sx + 1, sy + 1, 6, 3, color);
        px(ctx, sx + 1, sy + 1, 4, 1, "rgba(222, 209, 175, 0.2)");
        if (rng() > 0.82) px(ctx, sx + 2, sy + 3, 3, 1, "#6d8a58");
        if (rng() > 0.93) px(ctx, sx + 5, sy + 2, 1, 1, "#5f7750");
      }
    }
    // A ring of larger flagstones frames the well.
    for (let i = 0; i < 20; i += 1) {
      const angle = (i / 20) * Math.PI * 2;
      const sx = x + Math.cos(angle) * 70;
      const sy = y + Math.sin(angle) * 40;
      px(ctx, sx - 5, sy - 3, 10, 6, "#6f6451");
      px(ctx, sx - 4, sy - 2, 8, 4, i % 2 ? "#a69878" : "#97896b");
      px(ctx, sx - 3, sy - 2, 4, 1, "#c0af86");
    }
    // Moss and weeds reclaiming the old stones.
    for (let i = 0; i < 120; i += 1) {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng());
      const sx = x + Math.cos(angle) * rx * radius;
      const sy = y + Math.sin(angle) * ry * radius;
      const tone = rng();
      if (tone > 0.55) px(ctx, sx, sy, 1, 1, tone > 0.8 ? "#7e9d62" : "#688a53");
      if (tone > 0.92) drawGrassBlade(ctx, sx, sy, rng, ["#558541", "#6b9c4c"]);
    }
    // A few windblown petals.
    for (let i = 0; i < 16; i += 1) {
      const sx = x + rand(rng, -rx + 12, rx - 12);
      const sy = y + rand(rng, -ry + 8, ry - 8);
      px(ctx, sx, sy, 1, 1, rng() > 0.5 ? "#e4b7be" : "#f3e1ae");
    }
  }

  paintPond(ctx, rng) {
    const { x, y, rx, ry } = POND;
    // Reedy shore and a damp dark rim.
    pixelEllipse(ctx, x, y, rx + 15, ry + 12, "#bda86f");
    pixelEllipse(ctx, x, y, rx + 8, ry + 8, "#d0bc83");
    pixelEllipse(ctx, x, y, rx + 2, ry + 2, "#7f7651");
    pixelEllipse(ctx, x, y, rx, ry, "#2b5c65");
    pixelEllipse(ctx, x - 2, y - 2, rx - 6, ry - 6, "#336f79");
    pixelEllipse(ctx, x - 4, y - 3, rx - 15, ry - 13, "#3b8492");
    pixelEllipse(ctx, x - 9, y - 8, rx - 42, ry - 34, "rgba(99, 179, 180, 0.18)");

    // Water shimmer and dark depth patches.
    for (let i = 0; i < 65; i += 1) {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * 0.92;
      const wx = x + Math.cos(angle) * (rx - 18) * radius;
      const wy = y + Math.sin(angle) * (ry - 18) * radius;
      const len = randInt(rng, 2, 8);
      px(ctx, wx, wy, len, 1, rng() > 0.45 ? "rgba(130, 195, 188, 0.28)" : "rgba(31, 87, 97, 0.4)");
      if (rng() > 0.82) px(ctx, wx + 1, wy - 1, 1, 1, "#9ed0c5");
    }
    // Stones at the waterline.
    for (let i = 0; i < 26; i += 1) {
      const angle = rng() * Math.PI * 2;
      const sx = x + Math.cos(angle) * (rx + rand(rng, 2, 10));
      const sy = y + Math.sin(angle) * (ry + rand(rng, 2, 8));
      px(ctx, sx - 2, sy - 1, 5, 3, "#7d7c6c");
      px(ctx, sx - 1, sy - 1, 3, 1, "#a7a693");
    }
    // Sandy path meets the shore.
    pixelEllipse(ctx, 1964, 1252, 44, 18, "rgba(205, 184, 123, 0.5)");
  }

  /* ---------------------------------------------------------------- */
  /* Props                                                            */
  /* ---------------------------------------------------------------- */

  addProp(sprite, x, y, options = {}) {
    const prop = {
      x, y, sprite,
      sortY: y,
      kind: options.kind || "prop",
      glow: options.glow || null,
      phase: options.phase ?? Math.random() * Math.PI * 2,
      solid: options.solid || null,
      ...options,
    };
    this.props.push(prop);
    if (prop.solid) this.addSolid(prop.solid);
    return prop;
  }

  addSolid(solid) {
    this.solids.push(solid);
  }

  addTree(sprite, x, y, kind = "tree") {
    this.addProp(sprite, x, y, {
      kind,
      solid: { type: "circle", x, y: y - 2, r: sprite.solidRadius || 7 },
    });
  }

  buildVillage() {
    this.buildingFootprints = {};

    const cottage = makeCottage();
    this.addProp(cottage, BUILDINGS.cottage.x, BUILDINGS.cottage.y, {
      kind: "building",
      solid: { type: "rect", x: BUILDINGS.cottage.x + 1, y: BUILDINGS.cottage.y - 17, halfW: 32, halfH: 17 },
    });
    this.buildingFootprints.cottage = { x: BUILDINGS.cottage.x, y: BUILDINGS.cottage.y - 10, halfW: 36, halfH: 20 };
    this.smokeSources.push({ x: BUILDINGS.cottage.x - 50 + cottage.chimney.x, y: BUILDINGS.cottage.y - cottage.base + cottage.chimney.y - 3, rate: 0.5 });
    this.buildings.cottage = { x: BUILDINGS.cottage.x, y: BUILDINGS.cottage.y, sprite: cottage };

    const shop = makeShop();
    this.addProp(shop, 1188, 902, {
      kind: "building",
      solid: { type: "rect", x: 1188, y: 887, halfW: 30, halfH: 15 },
    });
    this.buildingFootprints.shop = { x: 1188, y: 892, halfW: 35, halfH: 18 };
    this.smokeSources.push({ x: 1188 - 46 + shop.chimney.x, y: 902 - shop.base + shop.chimney.y - 3, rate: 0.58 });
    this.buildings.shop = { x: 1188, y: 902, sprite: shop };

    const tavern = makeTavern();
    this.addProp(tavern, BUILDINGS.tavern.x, BUILDINGS.tavern.y, {
      kind: "building",
      solid: { type: "rect", x: BUILDINGS.tavern.x + 1, y: BUILDINGS.tavern.y - 18, halfW: 40, halfH: 18 },
    });
    this.buildingFootprints.tavern = { x: BUILDINGS.tavern.x, y: BUILDINGS.tavern.y - 10, halfW: 45, halfH: 21 };
    this.smokeSources.push({ x: BUILDINGS.tavern.x - 59 + tavern.chimney.x, y: BUILDINGS.tavern.y - tavern.base + tavern.chimney.y - 3, rate: 0.68 });
    this.buildings.tavern = { x: BUILDINGS.tavern.x, y: BUILDINGS.tavern.y, sprite: tavern };

    const shrine = makeShrine();
    this.addProp(shrine, BUILDINGS.shrine.x, BUILDINGS.shrine.y, {
      kind: "shrine",
      solid: { type: "rect", x: BUILDINGS.shrine.x, y: BUILDINGS.shrine.y - 16, halfW: 39, halfH: 16 },
    });
    this.buildingFootprints.shrine = { x: BUILDINGS.shrine.x, y: BUILDINGS.shrine.y - 10, halfW: 44, halfH: 22 };
    this.buildings.shrine = { x: BUILDINGS.shrine.x, y: BUILDINGS.shrine.y, sprite: shrine };
    this.shrineProp = this.props[this.props.length - 1];

    const well = makeWell();
    this.addProp(well, PLAZA.x, PLAZA.y + 2, {
      kind: "well",
      solid: { type: "circle", x: PLAZA.x, y: PLAZA.y + 2, r: 17 },
    });
    this.buildingFootprints.well = { x: PLAZA.x, y: PLAZA.y + 2, halfW: 22, halfH: 18 };

    // Lantern posts around the square.
    for (const [x, y] of [[1168, 984], [1370, 978], [1056, 950], [1440, 1002], [1508, 760], [1704, 890]]) {
      const lantern = makeLanternPost();
      this.addProp(lantern, x, y, {
        kind: "lantern",
        glow: { x, y: y - lantern.base + lantern.glow.y },
        solid: { type: "circle", x, y, r: 3 },
      });
      this.lanterns.push({ x, y: y - lantern.base + lantern.glow.y, phase: x * 0.01 + y * 0.003 });
    }

    // Signpost where the lanes meet.
    this.addProp(makeSignpost(), 1178, 1060, {
      kind: "sign", solid: { type: "circle", x: 1178, y: 1058, r: 3 },
    });

    // A bench and flower planters keep the crossing lived-in.
    this.addProp(makeBench(), 1162, 1014, {
      kind: "bench", solid: { type: "rect", x: 1162, y: 1010, halfW: 16, halfH: 5 },
    });
    this.addProp(makePlanter(31), 1136, 960, { kind: "planter", solid: { type: "circle", x: 1136, y: 956, r: 7 } });
    this.addProp(makePlanter(32), 1398, 952, { kind: "planter", solid: { type: "circle", x: 1398, y: 948, r: 7 } });
    this.addProp(makePlanter(33), 1380, 1024, { kind: "planter" });

    // Cottage garden: a crooked fence with a gate, flower beds and a bench.
    for (const [x, y] of [[960, 1008], [996, 1008], [1032, 1008]]) {
      this.addProp(makeFence(), x, y, { kind: "fence" });
    }
    for (const [x, y] of [[936, 1010], [936, 1046], [936, 1082]]) {
      this.addProp(makeFence(8, true), x, y, { kind: "fence" });
    }
    for (const [x, y] of [[960, 1116], [996, 1116], [1032, 1116]]) {
      this.addProp(makeFence(), x, y, { kind: "fence" });
    }
    // flowering planters inside the garden
    for (let i = 0; i < 9; i += 1) {
      const gx = 948 + (i % 3) * 18;
      const gy = 1032 + Math.floor(i / 3) * 20;
      const rng = mulberry32(300 + i);
      drawFlower(this.groundCtx, gx, gy, rng, ["#f1a4b4", "#f5d073", "#f6eed3"]);
      drawFlower(this.groundCtx, gx + 4, gy - 2, rng, ["#e9a0b2", "#f6dd91", "#f4eac9"]);
    }

    // Hand-placed flower drifts around the square, where the eye lands first.
    const drifts = [
      [1084, 1038, 7], [1418, 1022, 8], [1360, 1094, 7], [1090, 1108, 6],
      [1054, 1002, 5], [1436, 934, 6], [1080, 888, 5], [1352, 874, 5],
      [1210, 1084, 5], [1320, 862, 4], [1420, 1096, 5], [1118, 1044, 4],
    ];
    for (let p = 0; p < drifts.length; p += 1) {
      const [dx, dy, count] = drifts[p];
      const rng = mulberry32(1200 + p);
      const palettes = [
        ["#f6eecf", "#f7de9d"], ["#efd072", "#f6e090"], ["#e8a4b3", "#f2c5ce"], ["#b6cce6", "#d3e1f0"],
      ];
      const palette = palettes[p % palettes.length];
      for (let i = 0; i < count; i += 1) {
        drawFlower(this.groundCtx, dx + rand(rng, -12, 12), dy + rand(rng, -7, 7), rng, palette);
      }
    }

    // Market clutter by the tavern.
    for (const [x, y, bar] of [[1528, 990, false], [1552, 986, true], [1540, 1014, false], [1568, 1008, true]]) {
      this.addProp(bar ? makeBarrel() : makeCrate(), x, y, {
        kind: "clutter", solid: { type: "circle", x, y: y - 4, r: 7 },
      });
    }
    this.addProp(makeBarrel(11), 1032, 968, { kind: "clutter", solid: { type: "circle", x: 1032, y: 964, r: 7 } });
    this.addProp(makeCrate(12), 1232, 916, { kind: "clutter", solid: { type: "circle", x: 1232, y: 912, r: 6 } });
    this.addProp(makeBarrel(13), 1248, 922, { kind: "clutter", solid: { type: "circle", x: 1248, y: 918, r: 6 } });

    // Cottage blossom tree and a few deliberate framing trees.
    this.addTree(makeBlossomTree(211), 930, 968, "blossom");
    this.addTree(makeOak(311, 2), 1128, 1112);
    this.addTree(makeOak(312, 0), 1420, 1088);
    this.addTree(makeOak(314, 1), 1318, 1116);
    this.addTree(makeOak(313, 1), 1572, 1016);
    this.addTree(makePine(401, 0), 1680, 640);
    this.addTree(makePine(402, 1), 1620, 720);

    // Stone circle on the north-east rise.
    const monolithSpots = [[2130, 756], [2242, 758], [2186, 676]];
    for (let i = 0; i < monolithSpots.length; i += 1) {
      const [mx, my] = monolithSpots[i];
      this.addProp(makeMonolith(91 + i), mx, my, {
        kind: "monolith", solid: { type: "circle", x: mx, y: my - 3, r: 9 },
      });
    }
    const stoneRng = mulberry32(555);
    for (let i = 0; i < 7; i += 1) {
      const rx = 2160 + rand(stoneRng, -65, 65);
      const ry = 720 + rand(stoneRng, -44, 44);
      if (Math.hypot(rx - 2186, ry - 712) < 26) continue;
      this.addProp(makeRock(700 + i, i % 3 === 0 ? 1 : 0), rx, ry, {
        kind: "rock", solid: { type: "circle", x: rx, y: ry - 2, r: 8 },
      });
    }

    // Pond dressing.
    this.addProp(makeDock(), 1964, 1188, { kind: "dock" });
    const pondRng = mulberry32(812);
    for (let i = 0; i < 12; i += 1) {
      const angle = -2.3 + (i / 11) * 2.6;
      const rx = POND.x + Math.cos(angle) * (POND.rx - 4);
      const ry = POND.y + Math.sin(angle) * (POND.ry - 4);
      this.addProp(makeReeds(80 + i), rx, ry, { kind: "reeds" });
    }
    for (let i = 0; i < 9; i += 1) {
      const angle = pondRng() * Math.PI * 2;
      const radius = Math.sqrt(pondRng()) * 0.7;
      const lx = POND.x + Math.cos(angle) * POND.rx * radius;
      const ly = POND.y + Math.sin(angle) * POND.ry * radius;
      this.addProp(makeLilypad(i), lx, ly, { kind: "lily" });
      this.ripples.push({ x: lx + 6, y: ly + 3, phase: pondRng() * Math.PI * 2, len: 3 + Math.floor(pondRng() * 6) });
    }

    // Shrine approach lanterns and mossy stones.
    for (const [x, y] of [[1410, 478], [1542, 478], [1434, 566]]) {
      this.addProp(makeLanternPost(), x, y, {
        kind: "lantern",
        glow: { x, y: y - 30 },
        solid: { type: "circle", x, y, r: 3 },
      });
      this.lanterns.push({ x, y: y - 30, phase: x * 0.02 });
    }
    this.addProp(makeRock(402, 1), 1396, 430, { kind: "rock", solid: { type: "circle", x: 1396, y: 428, r: 9 } });
    this.addProp(makeRock(403, 0), 1552, 438, { kind: "rock", solid: { type: "circle", x: 1552, y: 436, r: 7 } });

    // A small jetty path of stones at the pond's west bank.
    for (let i = 0; i < 5; i += 1) {
      this.addProp(makeRock(410 + i), 1860 + i * 18, 1178 + Math.sin(i) * 7, { kind: "rock" });
    }
  }

  scatterNature() {
    const rng = mulberry32(7731);
    const clusters = [
      { x: 260, y: 420, rx: 260, ry: 320, count: 36 },
      { x: 680, y: 180, rx: 300, ry: 150, count: 26 },
      { x: 2340, y: 330, rx: 230, ry: 220, count: 20 },
      { x: 2390, y: 1080, rx: 190, ry: 360, count: 24 },
      { x: 2320, y: 1620, rx: 250, ry: 180, count: 18 },
      { x: 380, y: 1540, rx: 300, ry: 230, count: 28 },
      { x: 820, y: 760, rx: 190, ry: 170, count: 16 },
      { x: 1770, y: 430, rx: 150, ry: 170, count: 12 },
      { x: 1750, y: 1540, rx: 230, ry: 160, count: 15 },
      { x: 850, y: 1310, rx: 140, ry: 120, count: 9 },
      { x: 2060, y: 980, rx: 110, ry: 120, count: 7 },
      { x: 560, y: 920, rx: 130, ry: 110, count: 6 },
      { x: 2180, y: 720, rx: 80, ry: 80, count: 3 },
    ];

    const placed = [];
    const tryTree = (x, y, force = false) => {
      x = clamp(x, 36, this.width - 36);
      y = clamp(y, 48, this.height - 24);
      if (!force) {
        if (this.nearPath(x, y, 34)) return false;
        if (this.inPlaza(x, y)) return false;
        if (this.inPond(x, y, 20)) return false;
        if (this.inBuildingClearing(x, y, 20)) return false;
        if (Math.hypot(x - PLAYER.startX, y - PLAYER.startY) < 54) return false;
        for (const b of BLOOM_POSITIONS) if (Math.hypot(x - b.x, y - b.y) < 42) return false;
      }
      for (const p of placed) if ((p.x - x) ** 2 + (p.y - y) ** 2 < 30 * 30) return false;
      placed.push({ x, y });
      const roll = rng();
      let sprite;
      let kind = "tree";
      if (roll > 0.78) {
        sprite = makePine(1200 + placed.length, placed.length % 2);
        kind = "pine";
      } else if (roll > 0.72) {
        sprite = makeOak(2200 + placed.length, 2);
      } else {
        sprite = makeOak(3200 + placed.length, placed.length % 3);
      }
      sprite.solidRadius = 6 + (sprite.width > 60 ? 2 : 0);
      this.addTree(sprite, x, y, kind);
      return true;
    };

    for (const cluster of clusters) {
      for (let i = 0; i < cluster.count; i += 1) {
        const angle = rng() * Math.PI * 2;
        const radius = Math.sqrt(rng());
        tryTree(cluster.x + Math.cos(angle) * cluster.rx * radius, cluster.y + Math.sin(angle) * cluster.ry * radius);
      }
    }
    for (let i = 0; i < 42; i += 1) {
      tryTree(rand(rng, 60, this.width - 60), rand(rng, 70, this.height - 40));
    }

    // Bushes love the forest edge.
    for (let i = 0; i < 80; i += 1) {
      const x = rand(rng, 40, this.width - 40);
      const y = rand(rng, 48, this.height - 24);
      if (this.nearPath(x, y, 25) || this.inPlaza(x, y) || this.inPond(x, y, 16) || this.inBuildingClearing(x, y, 12)) continue;
      if (Math.hypot(x - PLAYER.startX, y - PLAYER.startY) < 46) continue;
      let nearBloom = false;
      for (const b of BLOOM_POSITIONS) if (Math.hypot(x - b.x, y - b.y) < 30) nearBloom = true;
      if (nearBloom) continue;
      this.addProp(makeBush(900 + i), x, y, { kind: "bush" });
    }

    // Rocks, including a handful of larger boulders.
    for (let i = 0; i < 56; i += 1) {
      const x = rand(rng, 36, this.width - 36);
      const y = rand(rng, 48, this.height - 24);
      if (this.onPath(x, y) || this.inPlaza(x, y) || this.inPond(x, y, 12) || this.inBuildingClearing(x, y, 8)) continue;
      if (Math.hypot(x - PLAYER.startX, y - PLAYER.startY) < 40) continue;
      const big = rng() > 0.78;
      const sprite = makeRock(1500 + i, big ? 1 : 0);
      this.addProp(sprite, x, y, {
        kind: "rock", solid: { type: "circle", x, y: y - 2, r: big ? 10 : 7 },
      });
    }

    // Mossy boulders along the shrine walk.
    for (let i = 0; i < 6; i += 1) {
      const x = 1390 + i * 30 + rand(rng, -8, 8);
      const y = 700 + (i % 2) * 28 + rand(rng, -5, 5);
      this.addProp(makeRock(1600 + i, i % 2), x, y, {
        kind: "rock", solid: { type: "circle", x, y: y - 2, r: 7 },
      });
    }
  }

  buildBlooms() {
    const sprite = makeBloomSprite(88);
    BLOOM_POSITIONS.forEach((spot, index) => {
      this.blooms.push({
        ...spot,
        index,
        x: spot.x,
        y: spot.y,
        base: spot.y,
        collected: false,
        phase: index * 1.7,
        sprite,
      });
    });
  }

  buildAmbient() {
    const rng = mulberry32(1010);
    const colors = ["#f4dc8a", "#f0b9c4", "#d8e3f4", "#f4e5b5"];
    for (let i = 0; i < 14; i += 1) {
      this.butterflies.push({
        x: rand(rng, 180, this.width - 180),
        y: rand(rng, 220, this.height - 120),
        phase: rng() * Math.PI * 2,
        speed: rand(rng, 0.35, 0.8),
        radius: rand(rng, 10, 38),
        sprite: makeButterflySprite(pick(rng, colors)),
      });
    }
    const rippleRng = mulberry32(303);
    for (let i = 0; i < 13; i += 1) {
      const angle = rippleRng() * Math.PI * 2;
      const radius = Math.sqrt(rippleRng()) * 0.75;
      this.ripples.push({
        x: POND.x + Math.cos(angle) * POND.rx * radius,
        y: POND.y + Math.sin(angle) * POND.ry * radius,
        phase: rippleRng() * Math.PI * 2,
        len: 3 + Math.floor(rippleRng() * 7),
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Physics                                                          */
  /* ---------------------------------------------------------------- */

  isBlocked(x, y, radius) {
    if (x < radius + 8 || y < radius + 8 || x > this.width - radius - 8 || y > this.height - radius - 8) return true;
    // Pond water is too deep to wade.
    const px = (x - POND.x) / (POND.rx - 4);
    const py = (y - POND.y) / (POND.ry - 4);
    if (px * px + py * py < 1) return true;
    for (const s of this.solids) {
      if (s.type === "circle") {
        const dx = x - s.x;
        const dy = y - s.y;
        const rr = radius + s.r;
        if (dx * dx + dy * dy < rr * rr) return true;
      } else {
        const cx = clamp(x, s.x - s.halfW, s.x + s.halfW);
        const cy = clamp(y, s.y - s.halfH, s.y + s.halfH);
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy < radius * radius) return true;
      }
    }
    return false;
  }

  /* ---------------------------------------------------------------- */
  /* Drawing                                                          */
  /* ---------------------------------------------------------------- */

  drawGround(ctx, cam) {
    const w = Math.ceil(cam.viewW);
    const h = Math.ceil(cam.viewH);
    const sx = clamp(Math.floor(cam.x - cam.viewW / 2), 0, Math.max(0, this.width - w));
    const sy = clamp(Math.floor(cam.y - cam.viewH / 2), 0, Math.max(0, this.height - h));
    // If the viewport is wider than the world, centre the baked canvas.
    const dx = Math.floor((cam.viewW - Math.min(w, this.width)) / 2);
    const dy = Math.floor((cam.viewH - Math.min(h, this.height)) / 2);
    ctx.fillStyle = "#27452f";
    ctx.fillRect(0, 0, cam.viewW, cam.viewH);
    ctx.drawImage(this.ground, sx, sy, Math.min(w, this.width), Math.min(h, this.height), Math.max(0, dx), Math.max(0, dy), Math.min(w, this.width), Math.min(h, this.height));
    return { sx, sy, dx: Math.max(0, dx), dy: Math.max(0, dy) };
  }

  drawWater(ctx, cam, time) {
    const left = cam.x - cam.viewW / 2;
    const top = cam.y - cam.viewH / 2;
    ctx.save();
    for (const r of this.ripples) {
      const x = r.x - left;
      const y = r.y - top;
      if (x < -20 || y < -20 || x > cam.viewW + 20 || y > cam.viewH + 20) continue;
      const wave = Math.sin(time * 1.4 + r.phase);
      if (wave < 0.1) continue;
      ctx.fillStyle = `rgba(185, 223, 207, ${0.08 + wave * 0.16})`;
      ctx.fillRect(Math.round(x), Math.round(y), r.len + Math.round(wave * 3), 1);
      if (wave > 0.75) ctx.fillRect(Math.round(x + 2), Math.round(y + 2), Math.max(1, r.len - 2), 1);
    }
    // A few drifting leaf shadows across the pond's north edge.
    ctx.restore();
  }

  getVisibleProps(cam, margin = 60) {
    const left = cam.x - cam.viewW / 2 - margin;
    const right = cam.x + cam.viewW / 2 + margin;
    const top = cam.y - cam.viewH / 2 - margin;
    const bottom = cam.y + cam.viewH / 2 + margin;
    const out = [];
    for (const p of this.props) {
      if (p.x < left || p.x > right) continue;
      if (p.y < top || p.y > bottom + 90) continue;
      out.push(p);
    }
    return out;
  }

  drawProp(ctx, prop, cam) {
    const s = prop.sprite;
    const x = Math.round(prop.x - cam.x + cam.viewW / 2);
    const y = Math.round(prop.y - cam.y + cam.viewH / 2);
    if (y < -s.height - 20 || y > cam.viewH + 40) return;
    if (s.shadow) drawShadow(ctx, x, y - 1, s.shadow.rx, s.shadow.ry, prop.kind === "building" ? 0.27 : 0.22);
    ctx.drawImage(s.canvas, x - Math.floor(s.width / 2), y - s.base);
    if (prop.kind === "shrine") {
      // A quiet, dormant crystal socket; the finale lights it up.
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const t = performance.now() / 1000;
      const glow = ctx.createRadialGradient(x, y - 58, 1, x, y - 58, 22);
      glow.addColorStop(0, `rgba(168, 211, 255, ${0.18 + Math.sin(t * 1.2) * 0.04})`);
      glow.addColorStop(1, "rgba(130, 184, 210, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 24, y - 82, 48, 48);
      ctx.restore();
    }
  }

  drawBloom(ctx, bloom, cam, time) {
    if (bloom.collected) return;
    const bob = Math.sin(time * 1.6 + bloom.phase) * 2.2;
    const x = Math.round(bloom.x - cam.x + cam.viewW / 2);
    const y = Math.round(bloom.y + bob - cam.y + cam.viewH / 2);
    const s = bloom.sprite;
    const pulse = 0.65 + Math.sin(time * 2.1 + bloom.phase) * 0.18;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(x, y - 13, 1, x, y - 13, 28);
    glow.addColorStop(0, `rgba(255, 228, 131, ${0.3 * pulse})`);
    glow.addColorStop(0.45, `rgba(255, 206, 92, ${0.12 * pulse})`);
    glow.addColorStop(1, "rgba(255, 203, 86, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 30, y - 43, 60, 60);
    ctx.restore();
    ctx.drawImage(s.canvas, x - Math.floor(s.width / 2), y + bob * 0.2 - s.base);
    // twinkle
    ctx.fillStyle = `rgba(255, 246, 196, ${0.45 + Math.sin(time * 3 + bloom.phase) * 0.35})`;
    ctx.fillRect(x + 7, y - 21, 1, 1);
    ctx.fillRect(x - 8, y - 15, 1, 1);
  }

  drawAmbient(ctx, cam, time) {
    const left = cam.x - cam.viewW / 2;
    const top = cam.y - cam.viewH / 2;
    // Butterflies weave over the meadows.
    for (const b of this.butterflies) {
      if (b.x < left - 20 || b.x > left + cam.viewW + 20 || b.y < top - 20 || b.y > top + cam.viewH + 20) continue;
      const x = b.x + Math.cos(time * b.speed + b.phase) * b.radius - left;
      const y = b.y + Math.sin(time * b.speed * 1.6 + b.phase) * b.radius * 0.55 - top;
      const flap = Math.sin(time * 10 + b.phase) > 0 ? 1 : 0;
      ctx.drawImage(b.sprite, Math.round(x) - 3, Math.round(y) - 2 + flap);
    }
    // Lantern haloes.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const l of this.lanterns) {
      const x = l.x - left;
      const y = l.y - top;
      if (x < -40 || y < -40 || x > cam.viewW + 40 || y > cam.viewH + 40) continue;
      const flicker = 0.84 + Math.sin(time * 4.7 + l.phase) * 0.1 + Math.sin(time * 11 + l.phase) * 0.04;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 34);
      glow.addColorStop(0, `rgba(255, 218, 120, ${0.22 * flicker})`);
      glow.addColorStop(0.4, `rgba(255, 194, 83, ${0.08 * flicker})`);
      glow.addColorStop(1, "rgba(255, 185, 72, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 36, y - 36, 72, 72);
    }
    ctx.restore();
  }

  drawShrineBeam(ctx, cam, time, intensity) {
    if (intensity <= 0) return;
    const x = this.buildings.shrine.x - cam.x + cam.viewW / 2;
    const base = this.buildings.shrine.y - 56 - cam.y + cam.viewH / 2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const flicker = 0.82 + Math.sin(time * 2.3) * 0.1 + Math.sin(time * 5.1) * 0.04;
    const grad = ctx.createLinearGradient(0, base - 260, 0, base + 18);
    grad.addColorStop(0, "rgba(255, 236, 164, 0)");
    grad.addColorStop(0.32, `rgba(255, 224, 128, ${0.08 * intensity * flicker})`);
    grad.addColorStop(0.7, `rgba(255, 213, 105, ${0.2 * intensity * flicker})`);
    grad.addColorStop(1, `rgba(255, 235, 166, ${0.32 * intensity * flicker})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - 18, base);
    ctx.lineTo(x - 4, base - 270);
    ctx.lineTo(x + 4, base - 270);
    ctx.lineTo(x + 18, base);
    ctx.closePath();
    ctx.fill();
    const glow = ctx.createRadialGradient(x, base, 1, x, base, 60);
    glow.addColorStop(0, `rgba(255, 241, 185, ${0.4 * intensity})`);
    glow.addColorStop(0.45, `rgba(255, 208, 101, ${0.12 * intensity})`);
    glow.addColorStop(1, "rgba(255, 205, 100, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 64, base - 64, 128, 128);
    ctx.restore();
  }
}
