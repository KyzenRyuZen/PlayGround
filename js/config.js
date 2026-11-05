/* ============ AETHERIA — config & constants ============ */
"use strict";
var CONFIG = {
  // ---- economy: all prices configurable here ----
  prices: {
    potionHP:     60,     // Gold, minor healing potion
    potionHPBig:  180,    // Gold, greater healing potion
    potionMP:     50,     // Gold, mana potion
    teleport:     80,     // Gold per teleport to an unlocked town/region
    craftFee:     50,     // Gold, blacksmith general craft fee
    fusionFee:    {common:20, grey:40, green:80, blue:160, purple:320, legendary:640, mythic:1280, divine:9999},
    legendaryGold:5000,   // Gold for a legendary craft
    storageUpg:   400,    // Gold, expand stash by 12 slots
    marketFeePct: 0.05,   // 5% cut on sold listings
  },
  // ---- direct drop rarities (only these ever drop; always T3) ----
  drops: { common: 0.60, grey: 0.25, green: 0.10, blue: 0.05 },
  equipDropChance: 0.16,   // chance a normal mob drops a piece of gear
  matDropChance:   0.35,
  critCap: 0.50,           // critical chance hard cap (50%)
  mobRespawnSec: 14,
  bossRespawnSec: 90,
  // ---- progression ----
  xpBase: 90, xpGrowth: 1.30,
  statGrowth: { hp: 16, mp: 7, atk: 2.2, def: 1.4 },
  skillUpCost: lv => Math.round(200 * Math.pow(1.7, lv - 1)), // gold, skill lv 1->10
  // ---- tier/rarity multipliers ----
  tierMult: { 3: 1.00, 2: 1.20, 1: 1.45 }, // fusion improves stats
  rares: {
    common:    { name: "Common",    col: "#e8e8e8", mult: 1.00, bonus: 0 },
    grey:      { name: "Grey",      col: "#b0b4bd", mult: 1.10, bonus: 0 },
    green:     { name: "Green",     col: "#66d866", mult: 1.22, bonus: 1 },
    blue:      { name: "Blue",      col: "#58a8ff", mult: 1.38, bonus: 2 },
    purple:    { name: "Purple",    col: "#c05cff", mult: 1.65, bonus: 2 },
    legendary: { name: "Legendary", col: "#ffa02e", mult: 2.10, bonus: 3 },
    mythic:    { name: "Mythic",    col: "#ff4fd8", mult: 2.75, bonus: 3 },
    divine:    { name: "Divine",    col: "#ffe680", mult: 3.50, bonus: 4 },
  },
  // ---- rendering ----
  TW: 64, TH: 32,          // isometric tile size
  MAXDPR: 1.5,
};
var CRITCAP = CONFIG.critCap;
