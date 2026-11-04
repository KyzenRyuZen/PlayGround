// World and gameplay constants. Everything is measured in art pixels so the
// pixel grid stays consistent at every screen size.
export const TILE = 16;

export const WORLD = Object.freeze({
  cols: 160,
  rows: 112,
  width: 160 * TILE,
  height: 112 * TILE,
});

export const PLAYER = Object.freeze({
  startX: 1246,
  startY: 992,
  speed: 62,
  acceleration: 470,
  friction: 12,
  radius: 5.5,
});

export const CAMERA = Object.freeze({
  damping: 7.2,
  lookAhead: 20,
  offsetY: -22,
});

export const BLOOM_POSITIONS = Object.freeze([
  { x: 988, y: 1046, name: "the cottage garden", hint: "A starbloom hums by the cottage gate." },
  { x: 1958, y: 1152, name: "the lily pond", hint: "A starbloom drifts at the old dock." },
  { x: 572, y: 928, name: "the west clearing", hint: "A starbloom glimmers between the pines." },
  { x: 1108, y: 1468, name: "the south meadow", hint: "A starbloom sways in the tall meadow grass." },
  { x: 2186, y: 712, name: "the standing stones", hint: "A starbloom burns among the standing stones." },
  { x: 1478, y: 410, name: "the hollow shrine", hint: "The last starbloom waits at the shrine." },
]);

export const PATHS = Object.freeze([
  // The old east road through the village.
  [[-40, 1188], [230, 1156], [510, 1084], [786, 1012], [1036, 968], [1248, 946], [1462, 908], [1712, 834], [2002, 774], [2284, 728], [2610, 706]],
  // South lane to the meadow.
  [[1248, 946], [1190, 1122], [1092, 1306], [988, 1514], [908, 1810]],
  // North lane to the shrine.
  [[1418, 900], [1478, 702], [1516, 512], [1488, 326], [1444, 130]],
  // Cottage lane.
  [[1040, 974], [1074, 950], [1086, 928]],
  // Pond path.
  [[1668, 856], [1788, 1012], [1880, 1174], [1962, 1250]],
]);

export const PLAZA = Object.freeze({ x: 1272, y: 930, rx: 154, ry: 88 });

export const POND = Object.freeze({ x: 2032, y: 1334, rx: 258, ry: 172 });

export const BUILDINGS = Object.freeze({
  cottage: { x: 1082, y: 924 },
  tavern: { x: 1462, y: 936 },
  shrine: { x: 1478, y: 372 },
});

export const COLORS = Object.freeze({
  grass: ["#5f9b47", "#5c9744", "#629f49", "#589341", "#65a14b"],
  grassLight: "#80b95d",
  grassDark: "#3f7437",
  path: ["#c8a66b", "#be9a5f", "#d1af73"],
  pathDark: "#9e7b48",
  waterDeep: "#2b6670",
  water: "#3b8492",
  waterLight: "#63b3b4",
  wood: "#6f4a31",
  woodDark: "#432b20",
  stone: "#918b7b",
  gold: "#f1c960",
});
