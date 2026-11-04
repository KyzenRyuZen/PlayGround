/** The village: terrain painting, prop placement, collision, and baked ground. */
import { TILE, COLS, ROWS, WORLD_W, WORLD_H, LANDMARKS } from "./config.js";
import {
  makeTiles,
  makeTree,
  makeBush,
  makeRock,
  makeStump,
  makeCottage,
  makeInn,
  makeTower,
  makeWell,
  makeFence,
  makeLantern,
  makeSignpost,
  makeLily,
} from "./art.js";
import { createCanvas, hash2, mulberry32, clamp } from "./util.js";

const GRASS = 0;
const PATH = 1;
const DIRT = 2;
const WATER = 3;
const SAND = 4;

const ROADS = [
  {
    width: 1.35,
    points: [
      [24.2, 37],
      [24.1, 31],
      [23.8, 26],
      [23.7, 22.2],
      [23.2, 18.5],
      [22.8, 14],
    ],
  },
  {
    width: 1.08,
    points: [
      [23.2, 18.3],
      [20.2, 17.4],
      [17.2, 17],
      [14.2, 16.1],
      [11.9, 15.2],
      [11.5, 14.35],
    ],
  },
  {
    width: 1.05,
    points: [
      [23.5, 21.6],
      [27, 22.1],
      [30.5, 22.1],
      [33.5, 22.6],
      [36, 23.2],
    ],
  },
  {
    width: 0.98,
    points: [
      [23.4, 19.4],
      [26.7, 17.6],
      [30.5, 15.3],
      [34.5, 13.4],
      [38, 12.2],
      [40, 12.2],
    ],
  },
];

function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function pointHitsRect(px, py, rect, pad = 0) {
  return px >= rect.x - pad && px <= rect.x + rect.w + pad && py >= rect.y - pad && py <= rect.y + rect.h + pad;
}

function drawFlower(ctx, x, y, palette) {
  ctx.fillStyle = "#3f7f42";
  ctx.fillRect(x, y - 3, 1, 4);
  ctx.fillRect(x - 1, y - 1, 1, 1);
  const petals = palette || ["#f2d16f", "#e98286", "#e7e4d0", "#b58de0"];
  const color = petals[Math.floor(hash2(x, y, 31) * petals.length)];
  ctx.fillStyle = color;
  ctx.fillRect(x - 1, y - 5, 1, 2);
  ctx.fillRect(x + 1, y - 5, 1, 2);
  ctx.fillRect(x, y - 6, 1, 1);
  ctx.fillRect(x, y - 4, 1, 1);
  ctx.fillStyle = "#f8dd8d";
  ctx.fillRect(x, y - 5, 1, 1);
}

function drawTuft(ctx, x, y) {
  ctx.fillStyle = "#3d7d40";
  ctx.fillRect(x, y - 3, 1, 4);
  ctx.fillRect(x - 2, y - 2, 1, 3);
  ctx.fillRect(x + 2, y - 1, 1, 2);
  ctx.fillStyle = "#79bd63";
  ctx.fillRect(x - 1, y - 4, 1, 3);
  ctx.fillRect(x + 1, y - 3, 1, 2);
}

function drawClover(ctx, x, y) {
  ctx.fillStyle = "#4b9148";
  ctx.fillRect(x, y - 1, 1, 2);
  ctx.fillStyle = "#6fb75f";
  ctx.fillRect(x - 1, y - 3, 2, 2);
  ctx.fillRect(x + 1, y - 2, 2, 2);
}

function drawMushroom(ctx, x, y, red = true) {
  ctx.fillStyle = "#e4d4ae";
  ctx.fillRect(x, y - 2, 1, 3);
  ctx.fillStyle = red ? "#c15449" : "#b58c5c";
  ctx.fillRect(x - 2, y - 4, 5, 2);
  ctx.fillRect(x - 1, y - 5, 3, 1);
  ctx.fillStyle = "#f3e8cb";
  ctx.fillRect(x - 1, y - 4, 1, 1);
  ctx.fillRect(x + 1, y - 3, 1, 1);
}

export class World {
  constructor() {
    this.tiles = makeTiles(29);
    this.terrain = Array.from({ length: ROWS }, () => Array(COLS).fill(GRASS));
    this.props = [];
    this.solidRects = [];
    this.solidCircles = [];
    this.waterTiles = [];
    this.smokeSources = [];
    this.landmarks = LANDMARKS.map((landmark) => ({ ...landmark, found: false }));
    this.spawn = { x: 11.5 * TILE, y: 17.6 * TILE };
    this.pond = { x: 39.5 * TILE, y: 29.2 * TILE, rx: 4.7 * TILE * 0.9, ry: 3.5 * TILE * 0.9 };

    this.paintTerrain();
    this.placeBuildings();
    this.placeFences();
    this.placeTrees();
    this.placeScenery();
    this.placeLilies();
    this.addWaterCollision();
    this.ground = this.bakeGround();
  }

  /* ---------------------------------------------------------------- */
  /* Terrain                                                           */
  /* ---------------------------------------------------------------- */

  paintTerrain() {
    // The pond first: shore ring, then the dark water.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const nx = (x + 0.5 - 39.5) / 4.7;
        const ny = (y + 0.5 - 29.2) / 3.5;
        const d = nx * nx + ny * ny;
        if (d < 0.82) this.terrain[y][x] = WATER;
        else if (d < 1.18) this.terrain[y][x] = SAND;
      }
    }

    // Winding village roads, with a soft organic edge.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        let distance = Infinity;
        for (const road of ROADS) {
          let best = Infinity;
          for (let i = 0; i < road.points.length - 1; i++) {
            const [ax, ay] = road.points[i];
            const [bx, by] = road.points[i + 1];
            best = Math.min(best, segmentDistance(px, py, ax, ay, bx, by) / road.width);
          }
          distance = Math.min(distance, best);
        }
        const wobble = (hash2(x, y, 7) - 0.5) * 0.32;
        if (distance < 1 + wobble) {
          this.terrain[y][x] = PATH;
        }
      }
    }

    // The green in the middle of the village becomes packed earth.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const nx = (x + 0.5 - 24) / 4.5;
        const ny = (y + 0.5 - 21) / 3.5;
        const d = nx * nx + ny * ny;
        const wobble = (hash2(x, y, 13) - 0.5) * 0.22;
        if (d < 1 + wobble) this.terrain[y][x] = DIRT;
      }
    }
  }

  terrainAtTile(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return WATER;
    return this.terrain[y][x];
  }

  terrainAtWorld(x, y) {
    return this.terrainAtTile(Math.floor(x / TILE), Math.floor(y / TILE));
  }

  /* ---------------------------------------------------------------- */
  /* Buildings and props                                               */
  /* ---------------------------------------------------------------- */

  addProp(prop) {
    this.props.push(prop);
    return prop;
  }

  addBuilding({ id, x, y, w, h, sprite, inset = 5 }) {
    const centerX = (x + w / 2) * TILE;
    const bottom = (y + h) * TILE;
    const prop = this.addProp({
      kind: "building",
      id,
      sprite,
      x: centerX,
      y: bottom + 5,
      sortY: bottom + 4,
    });
    this.solidRects.push({
      x: x * TILE + inset,
      y: y * TILE + 9,
      w: w * TILE - inset * 2,
      h: h * TILE - 9,
    });

    // Clear a little apron in front of each door so the village breathes.
    const clearX0 = Math.max(0, Math.floor(x) - 1);
    const clearX1 = Math.min(COLS - 1, Math.floor(x + w) + 1);
    const clearY0 = Math.max(0, Math.floor(y) - 1);
    const clearY1 = Math.min(ROWS - 1, Math.floor(y + h) + 1);
    for (let ty = clearY0; ty <= clearY1; ty++) {
      for (let tx = clearX0; tx <= clearX1; tx++) {
        if (this.terrain[ty][tx] === WATER) continue;
        if (tx >= x && tx < x + w && ty >= y && ty < y + h) this.terrain[ty][tx] = GRASS;
      }
    }
    return prop;
  }

  placeBuildings() {
    this.cottage = this.addBuilding({
      id: "cottage",
      x: 9,
      y: 9,
      w: 5,
      h: 4,
      sprite: makeCottage(),
    });
    this.inn = this.addBuilding({
      id: "inn",
      x: 33,
      y: 19,
      w: 6,
      h: 4,
      sprite: makeInn(),
    });
    this.tower = this.addBuilding({
      id: "tower",
      x: 38,
      y: 7,
      w: 4,
      h: 4,
      sprite: makeTower(),
    });

    // Chimney locations, used by the drifting smoke particles.
    this.smokeSources.push({
      x: this.cottage.x - this.cottage.sprite.ax + 78,
      y: this.cottage.y - this.cottage.sprite.ay + 4,
    });
    this.smokeSources.push({
      x: this.inn.x - this.inn.sprite.ax + 106,
      y: this.inn.y - this.inn.sprite.ay + 0,
    });

    // The well sits at the heart of the green.
    const well = this.addProp({
      kind: "well",
      sprite: makeWell(),
      x: 24 * TILE,
      y: 22 * TILE + 2,
      sortY: 22 * TILE,
    });
    this.solidCircles.push({ x: well.x, y: well.y - 7, r: 13 });

    // A signpost by the south road.
    this.addProp({
      kind: "sign",
      sprite: makeSignpost(),
      x: 27 * TILE + 4,
      y: 28.2 * TILE,
      sortY: 28.2 * TILE,
    });
    this.solidCircles.push({ x: 27 * TILE + 4, y: 28 * TILE, r: 4 });

    // Lanterns line the evening walk.
    for (const [x, y] of [
      [25.5, 25],
      [20.3, 20.3],
      [29.4, 20.9],
      [37, 17.4],
      [32.6, 14],
    ]) {
      this.addProp({
        kind: "lantern",
        sprite: makeLantern(),
        x: x * TILE,
        y: y * TILE,
        sortY: y * TILE,
      });
    }
  }

  placeFences() {
    const fenceH = makeFence(false);
    const fenceV = makeFence(true);
    const x0 = 4.6;
    const x1 = 9.4;
    const y0 = 15.4;
    const y1 = 20.4;
    const step = 1.05;
    const gateY = 18;

    const addFence = (x, y, vertical, solid = true) => {
      const prop = this.addProp({
        kind: "fence",
        sprite: vertical ? fenceV : fenceH,
        x: x * TILE,
        y: y * TILE,
        sortY: y * TILE,
      });
      if (solid) {
        this.solidRects.push({
          x: prop.x - (vertical ? 3 : 8),
          y: prop.y - (vertical ? 4 : 7),
          w: vertical ? 6 : 16,
          h: vertical ? 16 : 6,
        });
      }
    };

    for (let x = x0; x <= x1; x += step) {
      addFence(x, y0, false);
      addFence(x, y1, false);
    }
    for (let y = y0 + 1.1; y < y1; y += step) {
      addFence(x0, y, true);
      if (Math.abs(y - gateY) > 0.9) addFence(x1, y, true);
    }
  }

  placeTrees() {
    const rng = mulberry32(4172);
    const trees = [];
    const buildingRects = this.solidRects.filter((rect) => rect.w > 40 || rect.h > 40);

    const isClear = (x, y) => {
      const terrain = this.terrainAtWorld(x, y);
      if (terrain !== GRASS) return false;
      if (Math.hypot(x - this.spawn.x, y - this.spawn.y) < 74) return false;
      if (Math.hypot(x - 24 * TILE, y - 21 * TILE) < 74) return false;
      if (x < 5 * TILE && y > 14 * TILE && y < 21 * TILE) return false; // garden
      for (const rect of buildingRects) {
        if (pointHitsRect(x, y, rect, 19)) return false;
      }
      for (const tree of trees) {
        if (Math.hypot(x - tree.x, y - tree.y) < 20) return false;
      }
      return true;
    };

    const placeTree = (x, y) => {
      if (!isClear(x, y)) return false;
      const variant = Math.floor(rng() * 3);
      const sprite = makeTree(variant);
      const tree = this.addProp({
        kind: "tree",
        sprite,
        x: Math.round(x),
        y: Math.round(y),
        sortY: Math.round(y),
        variant,
      });
      this.solidCircles.push({ x: tree.x, y: tree.y - 5, r: 5.5 });
      trees.push(tree);
      return true;
    };

    // Scenic groves, including a dense forest frame around the village.
    const groves = [
      [4, 4, 78, 12],
      [12, 3, 65, 9],
      [27, 3, 74, 11],
      [43, 6, 66, 10],
      [44, 20, 62, 10],
      [43, 31, 70, 11],
      [28, 33.5, 70, 10],
      [14, 33, 74, 11],
      [3, 31, 64, 10],
      [3, 21, 56, 7],
      [18, 6, 44, 5],
      [32, 7, 42, 4],
      [12, 25, 40, 4],
      [18, 30, 36, 4],
    ];

    for (const [tx, ty, radius, count] of groves) {
      let remaining = count;
      for (let i = 0; i < count * 3; i++) {
        if (remaining <= 0) break;
        const angle = rng() * Math.PI * 2;
        const distance = Math.sqrt(rng()) * radius;
        const x = tx * TILE + Math.cos(angle) * distance;
        const y = ty * TILE + Math.sin(angle) * distance;
        if (placeTree(x, y)) remaining--;
      }
    }

    // A few solitary characters in the meadow.
    for (let i = 0; i < 120; i++) {
      const x = 30 + rng() * (WORLD_W - 60);
      const y = 30 + rng() * (WORLD_H - 60);
      if (rng() > 0.68) placeTree(x, y);
    }

    // Reinforce the outermost frame so the world feels held in a wood.
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const edge = Math.min(tx, ty, COLS - 1 - tx, ROWS - 1 - ty);
        if (edge > 1) continue;
        if (hash2(tx, ty, 51) > 0.46) {
          placeTree(tx * TILE + 8 + (rng() - 0.5) * 8, ty * TILE + 10 + (rng() - 0.5) * 6);
        }
      }
    }
  }

  placeScenery() {
    const rng = mulberry32(991);

    const canPlace = (x, y, pad = 14) => {
      if (this.terrainAtWorld(x, y) !== GRASS) return false;
      if (Math.hypot(x - this.spawn.x, y - this.spawn.y) < 46) return false;
      if (x < 5 * TILE && y > 14 * TILE && y < 21 * TILE) return false;
      for (const circle of this.solidCircles) {
        if (Math.hypot(x - circle.x, y - circle.y) < circle.r + pad) return false;
      }
      for (const rect of this.solidRects) {
        if (pointHitsRect(x, y, rect, pad)) return false;
      }
      return true;
    };

    // Rocks, mostly skirting the pond and the roads.
    const rockSpots = [
      [34.5, 27.3],
      [35.6, 26],
      [34, 32.3],
      [32.8, 30.8],
      [19.2, 23.2],
      [16.4, 13.9],
      [6.8, 12.2],
      [28.9, 11.6],
      [42.8, 16.4],
      [11.8, 27.7],
    ];
    let variant = 0;
    for (const [tx, ty] of rockSpots) {
      const x = tx * TILE;
      const y = ty * TILE;
      if (this.terrainAtWorld(x, y) === WATER) continue;
      const rock = this.addProp({
        kind: "rock",
        sprite: makeRock(variant++ % 2),
        x,
        y,
        sortY: y,
      });
      this.solidCircles.push({ x, y: y - 4, r: 6 });
    }
    for (let i = 0; i < 180; i++) {
      const x = 24 + rng() * (WORLD_W - 48);
      const y = 24 + rng() * (WORLD_H - 48);
      if (rng() > 0.72 && canPlace(x, y, 13)) {
        const rock = this.addProp({
          kind: "rock",
          sprite: makeRock(Math.floor(rng() * 2)),
          x,
          y,
          sortY: y,
        });
        this.solidCircles.push({ x, y: y - 4, r: 6 });
      }
    }

    // Bushes and stumps soften the tree line.
    for (let i = 0; i < 150; i++) {
      const x = 24 + rng() * (WORLD_W - 48);
      const y = 24 + rng() * (WORLD_H - 48);
      if (rng() > 0.78 && canPlace(x, y, 11)) {
        this.addProp({
          kind: "bush",
          sprite: makeBush(Math.floor(rng() * 2)),
          x,
          y,
          sortY: y,
        });
      }
    }
    for (const [tx, ty] of [
      [7.2, 8.2],
      [30.2, 8.4],
      [41.2, 25.4],
      [14.6, 22.4],
    ]) {
      const x = tx * TILE;
      const y = ty * TILE;
      const stump = this.addProp({
        kind: "stump",
        sprite: makeStump(),
        x,
        y,
        sortY: y,
      });
      this.solidCircles.push({ x, y: y - 3, r: 5 });
    }
  }

  placeLilies() {
    const rng = mulberry32(732);
    const water = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.terrain[y][x] === WATER) water.push({ x, y });
      }
    }
    let placed = 0;
    let attempts = 0;
    while (placed < 9 && attempts < 120 && water.length) {
      attempts++;
      const tile = water[Math.floor(rng() * water.length)];
      const px = tile.x * TILE + 4 + rng() * 8;
      const py = tile.y * TILE + 4 + rng() * 8;
      if (!this.isPondWater(px, py)) continue;
      this.addProp({
        kind: "lily",
        sprite: makeLily(),
        x: px,
        y: py,
        sortY: tile.y * TILE + 14,
      });
      placed++;
    }
  }

  addWaterCollision() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.terrain[y][x] === WATER) {
          this.waterTiles.push({ x, y });
        }
      }
    }
  }

  /* ---------------------------------------------------------------- */
  /* Ground bake                                                       */
  /* ---------------------------------------------------------------- */

  bakeRoads(ctx) {
    const { canvas, ctx: roadCtx } = createCanvas(WORLD_W, WORLD_H);
    const image = roadCtx.createImageData(WORLD_W, WORLD_H);
    const data = image.data;
    const mask = new Uint8Array(WORLD_W * WORLD_H);
    const roads = ROADS.map((road) => {
      const segments = [];
      for (let i = 0; i < road.points.length - 1; i++) {
        const [ax, ay] = road.points[i];
        const [bx, by] = road.points[i + 1];
        segments.push([ax * TILE, ay * TILE, bx * TILE, by * TILE]);
      }
      return { radius: road.width * TILE, segments };
    });
    const plaza = { x: 24 * TILE, y: 21 * TILE, rx: 4.5 * TILE, ry: 3.5 * TILE };

    const pathColors = ["#c7a268", "#ae8954", "#d6b57a", "#e6cc93"];
    const dirtColors = ["#b99360", "#9b784c", "#cca870", "#ddc18b"];

    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        const px = x + 0.5;
        const py = y + 0.5;

        let best = Infinity;
        for (const road of roads) {
          for (const [ax, ay, bx, by] of road.segments) {
            best = Math.min(best, segmentDistance(px, py, ax, ay, bx, by) / road.radius);
          }
        }

        const plazaD = Math.hypot((px - plaza.x) / plaza.rx, (py - plaza.y) / plaza.ry);
        const edgeNoise = (hash2(x, y, 201) - 0.5) * 0.16 + (hash2(x >> 1, y >> 1, 202) - 0.5) * 0.055;
        const plazaNoise = (hash2(x, y, 211) - 0.5) * 0.12;
        const roadThreshold = 1 + edgeNoise;
        const plazaThreshold = 1 + plazaNoise;
        const inRoad = best < roadThreshold;
        const inPlaza = plazaD < plazaThreshold;

        let write = false;
        let dirt = false;
        let edge = 0;

        if (inRoad || inPlaza) {
          const terrain = this.terrainAtTile(Math.floor(x / TILE), Math.floor(y / TILE));
          if (terrain === WATER) continue;
          dirt = inPlaza;
          edge = inPlaza ? 1 - plazaD / plazaThreshold : 1 - best / roadThreshold;
          write = true;
          // Break the outline with little grassy bites.
          if (edge < 0.055 && hash2(x, y, 215) > 0.48) write = false;
        } else if (best < roadThreshold + 0.075 || plazaD < plazaThreshold + 0.07) {
          // Scattered crumbs soften the outer edge.
          if (hash2(x, y, 207) > 0.86) {
            write = true;
            dirt = plazaD < 1.06;
            edge = 0.02;
          }
        }

        if (!write) continue;

        const palette = dirt ? dirtColors : pathColors;
        const block = hash2(x >> 1, y >> 1, 203);
        const grain = hash2(x, y, 204);
        let color = palette[0];
        if (edge < 0.07 || block < 0.075) color = palette[1];
        else if (block > 0.92) color = palette[2];
        if (grain > 0.972) color = palette[3];

        const index = (y * WORLD_W + x) * 4;
        data[index] = parseInt(color.slice(1, 3), 16);
        data[index + 1] = parseInt(color.slice(3, 5), 16);
        data[index + 2] = parseInt(color.slice(5, 7), 16);
        data[index + 3] = 255;
        mask[y * WORLD_W + x] = 1;
      }
    }

    roadCtx.putImageData(image, 0, 0);
    ctx.drawImage(canvas, 0, 0);

    // Pebbles and worn patches catch the light.
    const rng = mulberry32(505);
    for (let i = 0; i < 760; i++) {
      const x = Math.floor(rng() * WORLD_W);
      const y = Math.floor(rng() * WORLD_H);
      if (!mask[y * WORLD_W + x]) continue;
      if (hash2(x, y, 221) > 0.56) continue;
      const wide = hash2(x, y, 222) > 0.7;
      ctx.fillStyle = hash2(x, y, 223) > 0.5 ? "#9b7b4d" : "#e0c48c";
      ctx.fillRect(x, y, wide ? 2 : 1, 1);
      if (wide) {
        ctx.fillStyle = "#c7a168";
        ctx.fillRect(x + 1, y, 1, 1);
      }
    }

    // A few blades of grass push back into the road.
    for (let i = 0; i < 520; i++) {
      const x = Math.floor(rng() * (WORLD_W - 4)) + 2;
      const y = Math.floor(rng() * (WORLD_H - 4)) + 2;
      if (!mask[y * WORLD_W + x]) continue;
      if (mask[y * WORLD_W + x - 3] && mask[y * WORLD_W + x + 3] && mask[(y - 3) * WORLD_W + x] && mask[(y + 3) * WORLD_W + x]) {
        continue;
      }
      if (hash2(x, y, 224) > 0.42) continue;
      ctx.fillStyle = hash2(x, y, 225) > 0.5 ? "#4c8e46" : "#66ad58";
      ctx.fillRect(x, y - 2, 1, 3);
      ctx.fillRect(x - 1, y - 1, 1, 1);
      ctx.fillStyle = "#82c36a";
      ctx.fillRect(x + 1, y - 2, 1, 1);
    }
  }

  bakePond(ctx) {
    const cx = 39.5 * TILE;
    const cy = 29.2 * TILE;
    const rx = 4.7 * TILE;
    const ry = 3.5 * TILE;
    const minX = Math.max(0, Math.floor(cx - rx * 1.35));
    const maxX = Math.min(WORLD_W - 1, Math.ceil(cx + rx * 1.35));
    const minY = Math.max(0, Math.floor(cy - ry * 1.45));
    const maxY = Math.min(WORLD_H - 1, Math.ceil(cy + ry * 1.45));

    const { canvas, ctx: pondCtx } = createCanvas(WORLD_W, WORLD_H);
    const image = pondCtx.createImageData(WORLD_W, WORLD_H);
    const data = image.data;
    const water = ["#3b7d8d", "#2f6978", "#4f95a2", "#74b1b6"];
    const sand = ["#cbb37d", "#b39964", "#dac58f", "#a98f5d"];
    const waterMask = new Uint8Array(WORLD_W * WORLD_H);
    const sandMask = new Uint8Array(WORLD_W * WORLD_H);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const wobble = (hash2(x, y, 301) - 0.5) * 0.055 + (hash2(x >> 1, y >> 1, 302) - 0.5) * 0.04;
        const d = Math.sqrt(nx * nx + ny * ny) + wobble;
        const waterEdge = 0.905 + (hash2(x, y, 303) - 0.5) * 0.025;
        const sandEdge = 1.1 + (hash2(x, y, 304) - 0.5) * 0.04;
        let color = null;
        let waterPixel = false;
        let sandPixel = false;

        if (d < waterEdge) {
          waterPixel = true;
          const block = hash2(x >> 1, y >> 1, 305);
          const grain = hash2(x, y, 306);
          if (d > waterEdge - 0.028) color = water[1];
          else if (block < 0.1) color = water[1];
          else if (block > 0.92) color = water[2];
          else color = water[0];
          if (grain > 0.977) color = water[3];
          if (d > waterEdge - 0.018 && hash2(x, y, 307) > 0.28) color = "#2b6270";
        } else if (d < sandEdge) {
          sandPixel = true;
          const block = hash2(x >> 1, y >> 1, 308);
          if (d < waterEdge + 0.03) color = sand[1];
          else if (block < 0.09) color = sand[1];
          else if (block > 0.91) color = sand[2];
          else color = sand[0];
          if (hash2(x, y, 309) > 0.972) color = "#dac58f";
          // Let the outer shore dissolve into the meadow.
          if (d > sandEdge - 0.035 && hash2(x, y, 310) > 0.52) color = null;
        } else if (d < sandEdge + 0.025 && hash2(x, y, 311) > 0.8) {
          sandPixel = true;
          color = sand[0];
        }

        if (!color) continue;
        const index = (y * WORLD_W + x) * 4;
        data[index] = parseInt(color.slice(1, 3), 16);
        data[index + 1] = parseInt(color.slice(3, 5), 16);
        data[index + 2] = parseInt(color.slice(5, 7), 16);
        data[index + 3] = 255;
        if (waterPixel) waterMask[y * WORLD_W + x] = 1;
        if (sandPixel) sandMask[y * WORLD_W + x] = 1;
      }
    }

    pondCtx.putImageData(image, 0, 0);
    ctx.drawImage(canvas, 0, 0);

    const rng = mulberry32(611);
    // Still ripples and glints on the water.
    for (let i = 0; i < 180; i++) {
      const x = minX + Math.floor(rng() * (maxX - minX));
      const y = minY + Math.floor(rng() * (maxY - minY));
      if (!waterMask[y * WORLD_W + x]) continue;
      const long = rng() > 0.45;
      ctx.fillStyle = rng() > 0.5 ? "#77b4b7" : "#94c9c6";
      ctx.globalAlpha = 0.45 + rng() * 0.3;
      ctx.fillRect(x, y, long ? 3 + Math.floor(rng() * 3) : 2, 1);
      ctx.globalAlpha = 1;
    }
    // Pale pebbles and damp sand speckles.
    for (let i = 0; i < 130; i++) {
      const x = minX + Math.floor(rng() * (maxX - minX));
      const y = minY + Math.floor(rng() * (maxY - minY));
      if (!sandMask[y * WORLD_W + x]) continue;
      ctx.fillStyle = rng() > 0.5 ? "#b7a06c" : "#e0cb98";
      ctx.fillRect(x, y, rng() > 0.8 ? 2 : 1, 1);
    }
    // Reeds and rushes leaning over the shore.
    for (let i = 0; i < 120; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 1.0 + rng() * 0.24;
      const x = Math.round(cx + Math.cos(angle) * rx * radius);
      const y = Math.round(cy + Math.sin(angle) * ry * radius);
      if (x < 0 || y < 0 || x >= WORLD_W || y >= WORLD_H) continue;
      if (!sandMask[y * WORLD_W + x]) continue;
      if (hash2(x, y, 312) > 0.72) continue;
      const height = 2 + Math.floor(rng() * 4);
      ctx.fillStyle = rng() > 0.5 ? "#4f8a45" : "#6aa455";
      ctx.fillRect(x, y - height, 1, height);
      ctx.fillRect(x + 1, y - height + 1, 1, height - 1);
      if (rng() > 0.55) {
        ctx.fillStyle = "#3f7439";
        ctx.fillRect(x - 1, y - height + 1, 1, height - 2);
      }
    }
    // A few stones at the waterline.
    for (let i = 0; i < 26; i++) {
      const angle = rng() * Math.PI * 2;
      const x = Math.round(cx + Math.cos(angle) * rx * (1.01 + rng() * 0.08));
      const y = Math.round(cy + Math.sin(angle) * ry * (1.01 + rng() * 0.08));
      if (!sandMask[y * WORLD_W + x]) continue;
      ctx.fillStyle = "#8f9186";
      ctx.fillRect(x, y, 2, 1);
      ctx.fillStyle = "#b9b9a8";
      ctx.fillRect(x, y, 1, 1);
    }

    this.pond = {
      x: cx,
      y: cy,
      rx: rx * 0.9,
      ry: ry * 0.9,
    };
  }

  isPondWater(x, y) {
    if (!this.pond) return false;
    const nx = (x - this.pond.x) / this.pond.rx;
    const ny = (y - this.pond.y) / this.pond.ry;
    return nx * nx + ny * ny < 0.92;
  }

  bakeGround() {
    const { canvas, ctx } = createCanvas(WORLD_W, WORLD_H);
    const rng = mulberry32(2048);

    // Base terrain tiles. The pond, roads, and village green are painted at
    // pixel resolution afterwards so their silhouettes can wander off the grid.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const set = this.tiles.grass;
        const index = Math.floor(hash2(x, y, 3) * set.length);
        ctx.drawImage(set[index], x * TILE, y * TILE);
      }
    }

    this.bakePond(ctx);
    this.bakeRoads(ctx);

    // Ground decoration: flowers, clover, tufts, pebbles.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.terrain[y][x] !== GRASS) continue;
        const wx = x * TILE;
        const wy = y * TILE;
        const nearGarden = x >= 5 && x <= 9 && y >= 16 && y <= 20;
        if (nearGarden) continue;

        const tuftRoll = hash2(x, y, 81);
        if (tuftRoll > 0.58) {
          drawTuft(ctx, wx + 3 + Math.floor(hash2(x, y, 82) * 11), wy + 6 + Math.floor(hash2(x, y, 83) * 9));
        }
        if (tuftRoll > 0.88) {
          drawTuft(ctx, wx + 3 + Math.floor(hash2(x, y, 84) * 10), wy + 4 + Math.floor(hash2(x, y, 85) * 9));
        }
        if (hash2(x, y, 86) > 0.87) {
          drawClover(ctx, wx + 4 + Math.floor(hash2(x, y, 87) * 9), wy + 5 + Math.floor(hash2(x, y, 88) * 8));
        }
        if (hash2(x, y, 89) > 0.915) {
          drawFlower(
            ctx,
            wx + 4 + Math.floor(hash2(x, y, 90) * 9),
            wy + 5 + Math.floor(hash2(x, y, 91) * 8)
          );
        }
        if (hash2(x, y, 92) > 0.55 && hash2(x, y, 93) > 0.8) {
          ctx.fillStyle = "#8b8c7c";
          ctx.fillRect(wx + 3 + Math.floor(hash2(x, y, 94) * 10), wy + 4 + Math.floor(hash2(x, y, 95) * 9), 1, 1);
        }
      }
    }

    // Wildflower drifts by the cottage and around the well.
    for (let i = 0; i < 90; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 15 + rng() * 70;
      const cx = 11.5 * TILE;
      const cy = 14.2 * TILE;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (this.terrainAtWorld(x, y) === GRASS) drawFlower(ctx, Math.round(x), Math.round(y));
    }
    for (let i = 0; i < 38; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 28 + rng() * 48;
      const x = 24 * TILE + Math.cos(angle) * radius;
      const y = 21.3 * TILE + Math.sin(angle) * radius * 0.7;
      if (this.terrainAtWorld(x, y) === GRASS) drawFlower(ctx, Math.round(x), Math.round(y));
    }

    // Mushrooms and leaf litter beneath the trees.
    for (const prop of this.props) {
      if (prop.kind !== "tree") continue;
      const roll = hash2(prop.x, prop.y, 101);
      if (roll > 0.62) {
        const ox = (hash2(prop.x, prop.y, 102) - 0.5) * 24;
        const oy = 3 + hash2(prop.x, prop.y, 103) * 7;
        drawMushroom(ctx, Math.round(prop.x + ox), Math.round(prop.y + oy), roll > 0.82);
      }
      for (let i = 0; i < 3; i++) {
        const ox = (hash2(prop.x, prop.y, 110 + i) - 0.5) * 30;
        const oy = (hash2(prop.x, prop.y, 120 + i) - 0.5) * 14 + 3;
        ctx.fillStyle = i % 2 ? "#b58b4b" : "#caa35d";
        ctx.fillRect(Math.round(prop.x + ox), Math.round(prop.y + oy), 1, 1);
      }
    }

    // Kitchen garden: dark soil, neat rows, leafy cabbages.
    const gx = 5.15 * TILE;
    const gy = 15.95 * TILE;
    const gw = 4.1 * TILE;
    const gh = 4.2 * TILE;
    ctx.fillStyle = "#8a6a43";
    ctx.fillRect(gx, gy, gw, gh);
    for (let y = gy + 4; y < gy + gh - 2; y += 10) {
      ctx.fillStyle = "#6d5235";
      ctx.fillRect(gx + 3, Math.round(y), gw - 6, 2);
      for (let x = gx + 7; x < gx + gw - 4; x += 11) {
        ctx.fillStyle = "#4e8f48";
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 4, 5, 4);
        ctx.fillStyle = "#6ab45c";
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 5, 3, 3);
        ctx.fillStyle = "#84c96e";
        ctx.fillRect(Math.round(x), Math.round(y) - 4, 1, 1);
      }
    }
    ctx.strokeStyle = "rgba(80, 52, 31, 0.32)";
    ctx.lineWidth = 1;
    ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);

    // A ring of worn cobbles around the well.
    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2;
      const radius = 28 + (hash2(i, 1, 131) - 0.5) * 6;
      const x = 24 * TILE + Math.cos(angle) * radius;
      const y = 21.7 * TILE + Math.sin(angle) * radius * 0.62;
      ctx.fillStyle = i % 3 === 0 ? "#a8987a" : "#94866b";
      ctx.fillRect(Math.round(x), Math.round(y), 3, 2);
      ctx.fillStyle = "#c0b08c";
      ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
    }

    // Soft dappled light to break up the grass.
    ctx.globalAlpha = 0.045;
    for (let i = 0; i < 34; i++) {
      const x = rng() * WORLD_W;
      const y = rng() * WORLD_H;
      const r = 14 + rng() * 28;
      ctx.fillStyle = "#ffe29b";
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.55, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    return canvas;
  }

  /* ---------------------------------------------------------------- */
  /* Collision and queries                                             */
  /* ---------------------------------------------------------------- */

  collides(x, y, radius) {
    if (x < radius + 4 || y < radius + 4 || x > WORLD_W - radius - 4 || y > WORLD_H - radius - 4) return true;

    // Smooth pond collision instead of a staircase of tile-sized walls.
    if (this.pond) {
      const nx = (x - this.pond.x) / (this.pond.rx + radius);
      const ny = (y - this.pond.y) / (this.pond.ry + radius);
      if (nx * nx + ny * ny < 1) return true;
    }

    for (const circle of this.solidCircles) {
      const dx = x - circle.x;
      const dy = y - circle.y;
      const min = radius + circle.r;
      if (dx * dx + dy * dy < min * min) return true;
    }
    for (const rect of this.solidRects) {
      const closestX = clamp(x, rect.x, rect.x + rect.w);
      const closestY = clamp(y, rect.y, rect.y + rect.h);
      const dx = x - closestX;
      const dy = y - closestY;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
    return false;
  }
}
