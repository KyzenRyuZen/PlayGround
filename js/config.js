/** Shared tuning values for Mosswold Vale. */
export const TILE = 16;
export const COLS = 48;
export const ROWS = 36;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

export const PLAYER = {
  walkSpeed: 60,
  acceleration: 12.5,
  radius: 5,
  startX: 24 * TILE,
  startY: 28 * TILE,
  animDistance: 9,
};

export const CAMERA = {
  follow: 7.5,
  lookAhead: 9,
  deadzone: 0.6,
};

export const COLORS = {
  outline: "#2b2634",
  grass: "#5da653",
  path: "#c9a76d",
  water: "#3d7f8f",
  gold: "#e9bd68",
  parchment: "#f7e8bf",
};

/** Landmarks are discovered by walking near them. */
export const LANDMARKS = [
  {
    id: "well",
    title: "The Old Well",
    x: 24 * TILE,
    y: 21.7 * TILE,
    radius: 44,
  },
  {
    id: "cottage",
    title: "Hearthstone Cottage",
    x: 11.5 * TILE,
    y: 14.3 * TILE,
    radius: 62,
  },
  {
    id: "inn",
    title: "The Wayfarer's Inn",
    x: 36 * TILE,
    y: 23.5 * TILE,
    radius: 62,
  },
  {
    id: "tower",
    title: "Starfall Tower",
    x: 40 * TILE,
    y: 12.4 * TILE,
    radius: 60,
  },
];
