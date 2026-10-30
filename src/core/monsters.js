import { MONSTERS, REGION_BY_ID, stageCoords, stageKind, monsterLevel } from '../data/monsters.js';
import { rand, chance, pick } from './rng.js';

export function stageScale(stage) {
  return 1 + (stage - 1) * 0.205;
}

export function baseMonsterFromStats(region, stage, template, opts = {}) {
  const scale = stageScale(stage);
  const kind = opts.kind || 'normal';
  const level = monsterLevel(region, stage);
  const isBoss = kind === 'boss';
  const isMini = kind === 'miniboss';
  const elite = !!opts.elite;
  const templateHp = opts.hpMult ?? template.hp ?? 1;
  const templateAtk = opts.atkMult ?? template.atk ?? 1;
  const templateDef = opts.defMult ?? template.def ?? 1;
  const templateExp = opts.expMult ?? template.exp ?? 1;
  const templateGold = opts.goldMult ?? template.gold ?? 1;
  const bossHp = isBoss ? (opts.bossHpMult ?? 1) : 1;
  const miniHp = isMini ? (opts.miniHpMult ?? 1) : 1;

  const hp = Math.round(region.base.hp * scale * templateHp * bossHp * miniHp * (elite ? 2.5 : 1) * (opts.stone ? 1 : 1));
  const attack = Math.round(region.base.atk * (1 + (stage - 1) * 0.118) * templateAtk * (elite ? 1.28 : 1) * (opts.atkScale || 1));
  const defense = Math.round(region.base.def * (1 + (stage - 1) * 0.16) * templateDef * (elite ? 1.18 : 1));
  const exp = Math.round(region.base.exp * scale * templateExp * (elite ? 2.2 : 1) * (opts.expScale || 1));
  const gold = Math.round(region.base.gold * scale * templateGold * (elite ? 2.4 : 1) * (opts.goldScale || 1));
  const speed = isBoss ? 0.66 : isMini ? 0.58 : elite ? 0.58 : 0.54;

  return {
    level, hp, maxHp: hp, attack, defense, exp, gold, speed,
    attackInterval: 1 / speed,
    isBoss, isMini, elite, isStone: !!opts.stone,
  };
}

export function createStageMonster(state, opts = {}) {
  const index = opts.index ?? state.progress.currentIndex ?? 1;
  const coords = stageCoords(index);
  const { region, stage } = coords;
  const kind = stageKind(stage);
  const r = opts.rng || Math.random;

  if (kind === 'boss' || kind === 'miniboss') {
    const boss = kind === 'boss' ? region.boss : region.miniboss;
    const base = baseMonsterFromStats(region, stage, {
      hp: 1, atk: 1, def: 1, exp: 1, gold: 1,
    }, {
      kind,
      hpMult: 1,
      atkMult: boss.atk,
      defMult: boss.def,
      expMult: boss.exp,
      goldMult: boss.gold,
      bossHpMult: boss.hp,
      miniHpMult: boss.hp,
      expScale: 1,
    });
    return {
      ...base,
      uid: `mob_${Date.now()}_${Math.floor(r() * 1e6)}`,
      id: boss.name,
      name: boss.name,
      title: kind === 'boss' ? 'Region Boss' : 'Elite Guardian',
      visual: boss.visual,
      element: boss.element,
      size: boss.size || 1.3,
      lore: boss.lore,
      kind,
      regionId: region.id,
      stage,
      level: monsterLevel(region, stage),
      palette: region.palette,
      guaranteedItems: kind === 'boss' ? 3 : 2,
      lootSource: kind === 'boss' ? 'boss' : 'miniboss',
      enrageAt: 48,
    };
  }

  const stoneChance = opts.forceStone ? 1 : 0.028;
  const isStone = chance(stoneChance, r);
  let pool = region.monsters.map(id => MONSTERS[id]).filter(m => !m.stone);
  if (isStone) pool = region.monsters.map(id => MONSTERS[id]).filter(m => m.stone);
  const template = pool[Math.floor(r() * pool.length)] || MONSTERS[region.monsters[0]];
  const elite = !isStone && (opts.forceElite || chance(0.115, r));
  const base = baseMonsterFromStats(region, stage, template, {
    kind: 'normal', elite, stone: isStone,
    hpMult: template.hp * (isStone ? 1.05 : 1),
    atkMult: template.atk,
    defMult: template.def,
    expMult: template.exp * (isStone ? 1.35 : 1),
    goldMult: template.gold * (isStone ? 1.3 : 1),
    expScale: isStone ? 1.3 : 1,
    goldScale: isStone ? 1.4 : 1,
  });
  return {
    ...base,
    uid: `mob_${Date.now()}_${Math.floor(r() * 1e6)}`,
    id: template.id,
    name: `${elite ? 'Elite ' : ''}${isStone ? 'Ancient ' : ''}${template.name}`,
    title: isStone ? 'Living Treasure' : elite ? 'Elite' : 'Monster',
    visual: template.visual,
    element: template.element,
    size: (template.size || 1) * (elite ? 1.16 : 1),
    lore: template.lore,
    kind: isStone ? 'stone' : elite ? 'elite' : 'normal',
    regionId: region.id,
    stage,
    level: monsterLevel(region, stage),
    palette: region.palette,
    guaranteedItems: elite ? 1 : 0,
    lootSource: isStone ? 'stone' : elite ? 'elite' : 'normal',
  };
}

export function createDungeonBoss(dungeon, state, rngFn = Math.random) {
  const region = REGION_BY_ID[dungeon.regionId];
  const stageApprox = Math.max(1, Math.min(20, dungeon.level - (region.index - 1) * 20));
  const scale = stageScale(stageApprox);
  const boss = dungeon.boss;
  const hp = Math.round(region.base.hp * scale * boss.hp * 2.1);
  const attack = Math.round(region.base.atk * (1 + (stageApprox - 1) * 0.118) * boss.atk * 1.15);
  const defense = Math.round(region.base.def * (1 + (stageApprox - 1) * 0.16) * boss.def);
  return {
    uid: `dungeon_${Date.now()}_${Math.floor(rngFn() * 1e6)}`,
    id: dungeon.id,
    name: boss.name,
    title: dungeon.name,
    visual: boss.visual,
    element: boss.element,
    hp, maxHp: hp, attack, defense,
    exp: Math.round(region.base.exp * scale * boss.exp * 2.5),
    gold: Math.round(region.base.gold * scale * boss.gold * 2.5),
    level: dungeon.level,
    speed: 0.7,
    attackInterval: 1 / 0.7,
    size: boss.size || 1.7,
    isBoss: true,
    isDungeon: true,
    kind: 'dungeon',
    dungeonId: dungeon.id,
    lore: boss.lore,
    palette: region.palette,
    guaranteedItems: dungeon.rewards.items,
    lootSource: 'dungeon',
    enrageAt: 45,
  };
}

export function monsterSummary(monster) {
  if (!monster) return { hp: 0, attack: 0, defense: 0 };
  return { hp: monster.maxHp, attack: monster.attack, defense: monster.defense, level: monster.level };
}

export function averageStageMonster(state, index) {
  const coords = stageCoords(index);
  const r = () => 0.5;
  const m = createStageMonster(state, { index, rng: r, forceElite: false });
  return m;
}

export function monsterPower(monster) {
  if (!monster) return 0;
  return Math.round(monster.maxHp * 0.4 + monster.attack * 12 + monster.defense * 8 + monster.level * 20);
}
