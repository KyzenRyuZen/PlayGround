/* ============================================================
   AETHERIA — GAME: state, combat, loot, quests, economy, save.
   Single-device simulation today; every persistent structure is
   shaped like a server document to make the future multiplayer
   migration straightforward (accounts, characters, inventory).
   ============================================================ */
window.Game = (function () {
  'use strict';
  const D = window.DATA;

  // ------------------------------------------------------------------
  // persistent document (saved to localStorage; mirrors future DB)
  // ------------------------------------------------------------------
  const SAVE_KEY = 'aetheria_save_v1';
  let G = null;
  // live session
  let L = {
    player: null, monsters: [], drops: [], projs: [], ftexts: [], parts: [],
    solid: new Set(), phase: 'menu', region: null, minimapCache: null,
    interactTarget: null, lastDamageAt: 0, pet: null, tick: 0
  };
  const now = () => performance.now() / 1000;

  /* ---------------- helpers ---------------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const dist2d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const toast = (msg, kind) => window.UI && UI.toast(msg, kind);

  /* ---------------- stats ---------------- */
  function playerStats() {
    const c = G.char, C = D.CLASSES[c.cls];
    const st = {
      atk: C.baseAtk + C.gAtk * (c.lvl - 1),
      def: C.baseDef + C.gDef * (c.lvl - 1),
      hp: C.baseHp + C.gHp * (c.lvl - 1),
      mp: C.baseMp + C.gMp * (c.lvl - 1),
      crit: (C.baseCrit || 5) / 100, critDmg: 1.5, spd: 0, leech: 0
    };
    for (const slot in G.equip) {
      const it = G.equip[slot]; if (!it) continue;
      applyItemStats(st, it);
    }
    st.crit = clamp(st.crit, 0, 0.5);   // CRITICAL CHANCE CAPPED AT 50%
    if (L.player) {
      L.player.maxhp = Math.round(st.hp); L.player.maxmp = Math.round(st.mp);
      L.player.crit = st.crit; L.player.critDmg = st.critDmg;
    }
    st.spdTotal = C.spd + st.spd;
    return st;
  }
  function applyItemStats(st, it) {
    for (const k in it.stats) {
      if (k === 'spd') st.spd += it.stats[k];
      else if (k === 'crit') st.crit += it.stats[k];
      else if (k === 'critDmg') st.critDmg += it.stats[k] / 100;
      else if (k === 'leech') st.leech += it.stats[k];
      else st[k] = (st[k] || 0) + it.stats[k];
    }
    for (const b of it.bonuses || []) {
      if (b.stat === 'crit') st.crit += b.v;
      else if (b.stat === 'critDmg') st.critDmg += b.v / 100;
      else if (b.stat === 'leech') st.leech += b.v;
      else if (b.stat === 'spd') st.spd += b.v;
      else st[b.stat] = (st[b.stat] || 0) + b.v;
    }
  }
  const xpNeeded = lvl => Math.round(55 * Math.pow(lvl, 1.62));

  /* ---------------- world access ---------------- */
  function charAppear() {
    const c = G.char;
    return {
      gender: c.gender, hair: c.hair, hairCol: c.hairCol, eye: c.eye,
      outfit: c.outfit, cls: c.cls, costume: (G.using.cosEnabled && G.using.costume) || null
    };
  }
  function wingsVisible() { return !!G.using.wings; }

  function enterRegion(regionId, entry) {
    const R = D.regionById(regionId);
    const wd = World.build(regionId);
    const stats = playerStats();
    const first = !G.world.visited.includes(regionId);
    L.region = wd;
    L.monsters = []; L.drops = []; L.projs = []; L.parts = [];
    L.solid = new Set(); L.townEntered = false; L.floorKills = {};
    for (const p of wd.props) if (p.solid) L.solid.add(p.x + ',' + p.y);
    // player position
    let px, py;
    if (entry) { px = entry.x + .5; py = entry.y + .5; }
    else if (wd.town) { px = wd.town.x + .5; py = wd.town.y + 2.5; }
    else { px = Math.floor(wd.w / 2) + .5; py = Math.floor(wd.h / 2) + .5; }
    ensurePlayer(px, py, stats);
    // spawn monsters from spawn points
    for (const sp of wd.spawns) {
      if (sp.type === 'mob' || sp.type === 'elite') {
        L.monsters.push(makeMonster(sp, wd));
      }
    }
    G.world.regionId = regionId;
    if (first) {
      G.world.visited.push(regionId);
      toast(`Entered ${R.name}!`, 'gold');
      questEvent('reach', R.name);
      if (R.village) questEvent('reach', R.village);
    }
    L.minimapCache = World.minimap(wd);
    UI.onRegionChanged(R);
  }

  function ensurePlayer(px, py, stats) {
    if (!L.player) L.player = { x: px, y: py, hp: 1, mp: 1, maxhp: 1, maxmp: 1, atkCd: 0, skillCd: 0, potCd: 0, dir: 1, moving: false, dead: false, anim: 0, mountOn: false, respawnAt: 0 };
    L.player.x = px; L.player.y = py;
    L.player.maxhp = Math.round(stats.hp); L.player.maxmp = Math.round(stats.mp);
    if (L.player.hp <= 1 && !L.player.dead) L.player.hp = L.player.maxhp;
    if (L.player.mp <= 1) L.player.mp = L.player.maxmp;
    L.player.hp = clamp(L.player.hp, 1, L.player.maxhp);
    L.player.mp = clamp(L.player.mp, 1, L.player.maxmp);
  }

  function makeMonster(sp, wd) {
    const R = wd.def;
    const m = { sp, x: sp.x + .5, y: sp.y + .5, hx: sp.x + .5, hy: sp.y + .5, dead: false, respawnT: 0, anim: Math.random() * 2 };
    specMonster(m, sp.cfg, R, sp.type === 'elite', null);
    return m;
  }
  function specMonster(m, cfg, R, elite, boss) {
    const k = D.MONSTER_KINDS[boss ? boss.kind : cfg.kind] || D.MONSTER_KINDS.golem;
    const lvl = boss ? boss.lvl : cfg.lvl;
    m.lvl = lvl; m.name = elite ? `⭐ ${cfg.name}` : (boss ? boss.label : cfg.name);
    if (boss) m.name = boss.label;
    m.kind = boss ? boss.kind : cfg.kind; m.tone = boss ? boss.tone : toneFor(R, m.kind, elite);
    m.boss = boss; m.elite = elite;
    const mul = k.hp * (elite ? 1.9 : 1) * (boss ? 9 : 1);
    m.maxhp = Math.round((46 + lvl * 17) * mul);
    m.hp = m.maxhp;
    m.atk = Math.round((7 + lvl * 2.4) * k.atk * (elite ? 1.4 : 1) * (boss ? 1.7 : 1));
    m.def = Math.round(2 + lvl * 1.1);
    m.spd = k.spd * .85; m.range = (k.shape === 'brute' ? 1.9 : 1.5) * (boss ? 1.35 : 1);
    m.atkCd = 0; m.size = k.size * (elite ? 1.25 : 1) * (boss ? 2.1 : 1);
    m.aggroR = 6 * (boss ? 1.4 : 1); m.xp = Math.round((16 + Math.pow(lvl, 1.42) * 13) * (elite ? 2.2 : 1) * (boss ? 8 : 1));
    m.gold = Math.round(8 + lvl * 3.2) * (elite ? 2 : 1) * (boss ? 6 : 1);
    return m;
  }
  const toneFor = (R, kind, elite) => {
    const base = { grass: '#5fae5f', mountain: '#8a7a66', swamp: '#6a8a4f', grave: '#7a85a3', snow: '#9fc4e8', desert: '#d9a95f', lava: '#c4572f', void: '#8f6fff' }[R.biome];
    return elite ? '#c4a2ff' : base;
  };

  /* ---------------- combat ---------------- */
  function findTarget(maxR) {
    let best = null, bd = maxR;
    for (const m of L.monsters) {
      if (m.dead || m.spawningT > 0) continue;
      const d = dist2d(L.player, m);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  function playerAttack() {
    if (!L.player || L.player.dead) return;
    const C = D.CLASSES[G.char.cls], st = playerStats();
    const t = findTarget(C.range + .3);
    if (!t) return;
    const n = now();
    if (n < L.player.atkCd) return;
    L.player.atkCd = n + C.atkInterval;
    L.player.dir = t.x < L.player.x ? -1 : 1;
    const fxCol = fxColor();
    if (C.proj) {
      L.projs.push({ x: L.player.x, y: L.player.y - .4, target: t, speed: C.proj.speed, col: C.proj.color, dmg: 1, kind: 'basic', fxCol });
      swingFx(fxCol);
    } else {
      dealHit(t, 1, fxCol);
      swingFx(fxCol);
    }
  }

  function useSkill() {
    const C = D.CLASSES[G.char.cls], S = C.skill;
    const n = now(), p = L.player;
    if (!p || p.dead) return;
    const sl = G.char.skillLvl;
    if (n < p.skillCd) { return; }
    if (p.mp < S.mana) { toast('Not enough mana!', 'bad'); return; }
    p.mp -= S.mana;
    p.skillCd = n + S.cd;
    const dmg = S.mult * (1 + .12 * (sl - 1));
    const fxCol = fxColor();
    if (G.char.cls === 'mage') {
      // meteors around player
      for (let i = 0; i < 3; i++) setTimeout(() => { if (L.phase === 'play') skillBlast(2.6, dmg * .5, '☄️', fxCol); }, i * 160);
    } else {
      skillBlast(S.aoe, dmg, S.icon, fxCol);
    }
    UI.flashSkill(S.name);
  }
  function skillBlast(radius, mult, icon, col) {
    const p = L.player;
    let hits = 0;
    for (const m of L.monsters) {
      if (m.dead) continue;
      if (dist2d(p, m) <= radius) {
        const crit = G.char.cls === 'assassin' || Math.random() < p.crit + .25;
        dealHit(m, mult, col, { crit });
        hits++;
      }
    }
    burstFx(p.x, p.y - .5, col, 14 * Math.max(1, hits / 3), icon);
    if (hits) UI.floatText(p, `${icon}`, '#fff');
  }

  function dealHit(m, mult, fxCol, opts = {}) {
    const st = playerStats();
    const critChance = opts.crit || Math.random() < st.crit;
    let dmg = st.atk * mult * rnd(.92, 1.08);
    let def = m.def * .45;
    dmg = Math.max(1, dmg - def);
    let crit = critChance;
    if (crit) dmg *= st.critDmg;
    dmg = Math.max(1, Math.round(dmg));
    m.hp -= dmg;
    UI.floatText(m, `${crit ? '💥' : ''}${dmg}`, crit ? '#ffd77a' : '#fff');
    m.lastHitAt = now();
    m.aggro = true;
    if (st.leech > 0) healPlayer(dmg * st.leech, true);
    burstFx(m.x, m.y - .6, crit ? '#ffd77a' : (fxCol || '#fff'), 5);
    if (m.hp <= 0) monsterDeath(m);
  }

  function healPlayer(v, silent) {
    const p = L.player;
    p.hp = Math.min(p.maxhp, p.hp + v);
    if (!silent) UI.floatText({ x: p.x, y: p.y - 1 }, `+${Math.round(v)}`, '#5fd35f');
  }

  function fxColor() {
    const map = { fx_ember: '#ff8f3f', fx_frost: '#8fd4ff', fx_void: '#b58fff', fx_holy: '#ffdf8f' };
    return map[G.using.fx] || null;
  }
  function swingFx(col) {
    if (col) burstFx(L.player.x + L.player.dir, L.player.y - .6, col, 4);
  }

  function burstFx(x, y, col, n, icon) {
    for (let i = 0; i < n; i++) L.parts.push({ x, y, vx: rnd(-1.6, 1.6), vy: rnd(-2.4, -.4), life: rnd(.25, .6), t: 0, col, icon });
  }

  /* ---------------- monsters AI ---------------- */
  function tickMonsters(dt) {
    const p = L.player;
    const wd = L.region;
    for (const m of L.monsters) {
      if (m.dead) {
        if (m.respawnT > 0) {
          m.respawnT -= dt;
          if (m.respawnT <= 0) {
            m.x = m.hx; m.y = m.hy; m.dead = false; m.hp = m.maxhp; m.aggro = false;
          }
        }
        continue;
      }
      m.anim += dt * 3;
      const d = dist2d(m, p);
      const inTownSafe = wd.town && Math.max(Math.abs(p.x - (wd.town.x + .5)), Math.abs(p.y - (wd.town.y + .5))) < 7;
      // player aggro (villages are safe zones)
      if (!p.dead && d < m.aggroR && !inTownSafe) m.aggro = true;
      if (p.dead || inTownSafe) m.aggro = false;
      if (m.aggro) {
        if (d > 13) { m.aggro = false; m.hp = Math.min(m.maxhp, m.hp + m.maxhp * .2); m.chasing = false; }
        else {
          const spd = m.spd * dt;
          if (d > m.range) {
            const nx = (p.x - m.x) / d, ny = (p.y - m.y) / d;
            tryMoveMonster(m, nx * spd, ny * spd);
          } else if (now() > (m.atkCd || 0) && !p.dead) {
            m.atkCd = now() + 1.6;
            monsterHit(m);
          }
        }
      } else {
        // idle wander
        if (Math.random() < dt * .4) { m.wander = { x: m.hx + rnd(-2, 2), y: m.hy + rnd(-2, 2) }; }
        else if (m.wander && dist2d(m, m.wander) > .2) {
          const ddx = m.wander.x - m.x, ddy = m.wander.y - m.y, dd = Math.hypot(ddx, ddy) || 1;
          tryMoveMonster(m, (ddx / dd) * m.spd * .45 * dt, (ddy / dd) * m.spd * .45 * dt);
        } else m.wander = null;
      }
    }
  }
  function tryMoveMonster(m, dx, dy) {
    const nx = m.x + dx, ny = m.y + dy;
    if (World.walkable(L.region, nx, ny) && !L.solid.has(`${Math.floor(nx)},${Math.floor(ny)}`)) m.x = nx;
    if (World.walkable(L.region, m.x, ny) && !L.solid.has(`${Math.floor(m.x)},${Math.floor(ny)}`)) m.y = ny;
  }
  function monsterHit(m) {
    const p = L.player; if (p.dead) return;
    let dmg = m.atk * rnd(.85, 1.1);
    const st = playerStats();
    dmg = Math.max(1, dmg - st.def * .55);
    dmg = Math.round(dmg);
    p.hp -= dmg;
    UI.floatText(p, `-${dmg}`, '#ff5a5a');
    L.lastDamageAt = now();
    if (Math.random() < .5) burstFx(p.x, p.y - .8, '#ff5a5a', 4);
    if (p.hp <= 0) playerDeath();
  }

  function playerDeath() {
    const p = L.player;
    p.hp = 0; p.dead = true; p.respawnAt = now() + 3;
    toast('You have fallen… respawning at the village.', 'bad');
  }
  function respawnPlayer() {
    const wd = L.region;
    const home = wd.town ? wd.town : { x: Math.floor(wd.w / 2), y: Math.floor(wd.h / 2) };
    L.player.x = home.x + .5; L.player.y = home.y + 2.5;
    L.player.dead = false; L.player.hp = Math.round(L.player.maxhp * .6); L.player.mp = Math.round(L.player.maxmp * .6);
    // resurrect town travel if died far from town region? keep same region
  }

  /* ---------------- rewards / loot ---------------- */
  function monsterDeath(m) {
    m.dead = true;
    m.respawnT = m.boss ? D.ECON.bossRespawnSecs : (m.elite ? 30 : rnd(D.ECON.respawnSecs - 3, D.ECON.respawnSecs + 6));
    // rewards
    const p = L.player;
    let gold = Math.round(m.gold * rnd(.8, 1.3));
    if (G.char.pet && G.char.pet === 'pe_dragonlet') gold = Math.round(gold * 1.02);
    let xp = m.xp;
    if (G.char.pet === 'pe_moth') xp = Math.round(xp * 1.05);
    if (G.acct.premium > Date.now()) { gold = Math.round(gold * 1.5); xp = Math.round(xp * 1.5); }
    gainGold(gold); gainXp(xp);
    L.drops.push({ x: m.x, y: m.y, gold, t: 0 });
    // potions
    if (Math.random() < .14) addPotion(Math.random() < .55 ? 'hp' : 'mp', 1, m.x, m.y);
    // materials
    const R = L.region.def, gm = R.gather;
    if (Math.random() < .3) giveMat(gm.id, 1, true, m);
    if (m.boss && R.id === 'venomwood') questEvent('killBossZone');
    // gear drops — direct drops: Common 60 / Grey 25 / Green 10 / Blue 5, always T3
    const dropRolls = m.boss ? 3 : m.elite ? 2 : Math.random() < .21 ? 1 : 0;
    for (let i = 0; i < dropRolls; i++) {
      const rar = m.boss ? 'Blue' : D.rollDropRarity();  // bosses guarantee Blue
      const slot = m.boss ? ((i === 0 && 'weapon') || D.SLOTS[Math.floor(Math.random() * 9)]) : D.SLOTS[Math.floor(Math.random() * 9)];
      dropItem(D.makeItem({ slot, cls: itemCls(slot), lvl: Math.max(1, m.lvl), tier: 3, rarity: rar }), m.x, m.y);
    }
    // boss bonuses
    if (m.boss) {
      onBossKill(m);
    }
    // quest kill event
    const cleanName = m.name.replace('⭐ ', '');
    G.kills[cleanName] = (G.kills[cleanName] || 0) + 1;
    questEvent('kill', cleanName);
    if (m.boss) questEvent('boss', m.boss.label);
  }

  function itemCls(slot) {
    if (slot === 'weapon') return G.char.cls;
    if (['head', 'chest', 'hands', 'legs', 'feet'].includes(slot)) return G.char.cls;
    return 'any';
  }

  function onBossKill(m) {
    const bossDef = m.boss;
    // stones
    const stones = Math.random() < .65 ? 2 : 1;
    for (let i = 0; i < stones; i++) dropItem(D.bossStone(bossDef), m.x, m.y);
    // gems
    const gems = 1 + Math.floor(Math.random() * 3);
    gainGems(gems); toast(`💎 +${gems} Gems from the boss!`, 'good');
    // tower key
    if (bossDef.id === 'ashenboss' && !G.keyItems.towerKey) {
      G.keyItems.towerKey = true; toast('🔑 You obtained the Eternity Gate Key!', 'gold');
    }
    // bosses also drop material showers
    const R = L.region.def;
    for (let i = 0; i < 3; i++) giveMat(R.gather.id, 1, true, m);
    // achievements…
    G.bossKills[bossDef.id] = (G.bossKills[bossDef.id] || 0) + 1;
    // tower mini / boss floors
    if (L.region.def.id === 'tower') {
      L.floorKills = L.floorKills || {};
      const mini = L.region.def.miniBosses.find(mb => mb.label === m.name || mb.name === bossDef.name);
      if (mini) L.floorKills[mini.id] = true;
      if (bossDef.id === 'towerboss') L.floorKills['main'] = true;
    }
  }

  function dropItem(item, x, y) {
    L.drops.push({ x: x + rnd(-.5, .5), y: y + rnd(-.5, .5), item, t: 0 });
    L.parts.push({ x, y, vx: 0, vy: -3, life: .8, t: 0, col: D.RARITY_COLOR[item.rarity], light: true });
  }

  function addPotion(kind, n, x, y, silent) {
    G.potions[kind] = (G.potions[kind] || 0) + n;
    UI.potionCounts();
    if (x !== undefined && !silent) {
      UI.pickup(`${kind === 'hp' ? '🧪' : '💧'} ${n}× ${kind === 'hp' ? 'Health Potion' : 'Mana Potion'}`, '#e8ecf5');
    }
  }

  function giveMat(id, n, drop, from) {
    const it = D.mat(id);
    it.n = n;
    // stack materials in a virtual counter
    G.materials[id] = (G.materials[id] || 0) + n;
    if (drop && from) {
      L.drops.push({ x: from.x + rnd(-.4, .4), y: from.y + rnd(-.4, .4), matShow: it, t: 0 });
    }
    UI.pickup(`${it.icon} ${it.name} ×${n}`, '#8ff5a8');
    questEvent('collect', it.name);
    return it;
  }

  function pickupDrop(d) {
    if (d.gold !== undefined && !d.item) {
      gainGold(d.gold);
      UI.pickup(`💰 +${d.gold} Gold`, d.gold > 100 ? '#ffd77a' : '#d8dee9');
      return true;
    }
    if (d.matShow) { d.matShow = null; return true; }
    if (d.item) {
      const added = addItem(d.item);
      if (added) {
        const c = D.RARITY_COLOR[d.item.rarity];
        UI.pickup(`${d.item.icon} ${d.item.name}`, c);
        questEvent('get', d.item.rarity);
        burstFx(d.item.x !== undefined ? d.x : L.player.x, L.player.y - 1, c, 8);
        return true;
      } else toast('Inventory full!', 'bad');
    }
    return false;
  }

  function addItem(item) {
    if (G.inv.length >= 40) return false;
    G.inv.push(item); return true;
  }
  function removeItemByUid(uid) {
    const i = G.inv.findIndex(x => x.uid === uid);
    if (i >= 0) { return G.inv.splice(i, 1)[0]; }
    // from storage
    const j = G.storage.findIndex(x => x.uid === uid);
    if (j >= 0) return G.storage.splice(j, 1)[0];
    return null;
  }

  /* ---------------- growth ---------------- */
  function gainXp(v) {
    const c = G.char;
    c.xp += v;
    let ups = 0;
    while (c.xp >= xpNeeded(c.lvl)) {
      c.xp -= xpNeeded(c.lvl); c.lvl++; ups++;
      c.skillPts = (c.skillPts || 0) + 1;
      if (c.lvl % 5 === 0) { gainGems(5); toast(`💎 +5 Gems — level milestone!`, 'good'); }
    }
    if (ups > 0) {
      playerStats();
      L.player.hp = L.player.maxhp; L.player.mp = L.player.maxmp;
      toast(`LEVEL UP! You are now level ${c.lvl}. +1 Skill Point`, 'gold');
      burstFx(L.player.x, L.player.y - 1, '#ffd77a', 22, '⬆️');
      questsRefresh();
    }
  }
  function gainGold(v) { G.acct.gold += v; }
  function gainGems(v) { G.acct.gems += v; UI.currency(); }

  /* ---------------- potions ---------------- */
  function drinkPotion(kind) {
    const n = now(), p = L.player;
    if (!p || p.dead) return null;
    if (!G.potions[kind] || G.potions[kind] <= 0) { toast(`No ${kind === 'hp' ? 'Health' : 'Mana'} Potion! Buy some at the merchant.`, 'bad'); return 'none'; }
    if (n < p.potCd) return null;
    p.potCd = n + 5;
    if (kind === 'hp') {
      healPlayer(Math.min(p.maxhp * .45 + 60, 999));
    } else {
      p.mp = Math.min(p.maxmp, p.mp + p.maxmp * .55);
      UI.floatText(p, '+MP', '#4d9bff');
    }
    G.potions[kind]--;
    UI.potionCounts();
    return 'ok';
  }

  /* ---------------- quests ---------------- */
  function activeQuests() {
    const arr = [];
    for (const qid in G.quests.active) arr.push(D.questById(qid));
    return arr.filter(Boolean);
  }
  function acceptQuest(q) {
    if (G.quests.active[q.id]) return;
    // pre-req
    if (q.pre && G.quests.done.indexOf(q.pre) < 0) return;
    G.quests.active[q.id] = { p: q.objs.map(() => 0), done: false, total: q.objs.length };
    if (q.objs[0] && (q.objs[0].type === 'kill' || q.objs[0].type === 'collect')) countExistingProgress(q);
    toast(`📜 Quest accepted: ${q.name}`, 'good');
    questsRefresh();
  }
  function countExistingProgress(q) {
    q.objs.forEach((o, i) => {
      if (o.type === 'kill') G.quests.active[q.id].p[i] = Math.min(o.n, G.kills[o.target] || 0);
      if (o.type === 'collect') G.quests.active[q.id].p[i] = Math.min(o.n, G.materials[o.target.toLowerCase().replace(/ /g, '_')] || 0);
    });
  }
  function completeProgress(q) {
    const qs = G.quests.active[q.id];
    qs.done = q.objs.every((o, i) => qs.p[i] >= o.n);
  }
  function questEvent(type, target) {
    let anyDone = false;
    for (const q of activeQuests()) {
      if (G.quests.active[q.id].done) continue;
      q.objs.forEach((o, i) => {
        const qs = G.quests.active[q.id];
        if (qs.p[i] >= o.n) return;
        let bump = false;
        if (o.type === 'kill' && type === 'kill') {
          // recomputed from the kill ledger
          qs.p[i] = Math.min(o.n, G.kills[o.target] || 0);
          if (qs.p[i] >= o.n) anyDone = true;
          return;
        }
        if (o.type === type && (o.target === undefined || o.target === target)) bump = true;
        if (bump) { qs.p[i]++; anyDone = true; }
      });
      completeProgress(q);
      if (G.quests.active[q.id].done && !G.quests.active[q.id].notified) {
        G.quests.active[q.id].notified = true;
        toast(`✅ Quest complete: ${q.name} — return to the quest giver!`, 'good');
      }
    }
    UI.trackQuestCurrent();
  }
  function turnInQuest(q) {
    const qs = G.quests.active[q.id];
    if (!qs || !qs.done) return null;
    delete G.quests.active[q.id];
    G.quests.done.push(q.id);
    const r = q.rew;
    if (r.xp) gainXp(r.xp);
    if (r.gold) gainGold(r.gold);
    if (r.gems) gainGems(r.gems);
    if (r.items) r.items.forEach(it => {
      if (it.pot) { addPotion(it.pot, it.n || 1, undefined, true); UI.pickup(`🧪 +${it.n || 1} ${it.pot === 'hp' ? 'Health' : 'Mana'} Potion`, '#e8ecf5'); }
      if (it.gear) {
        const slotName = (it.gear.slot || 'weapon');
        const item = D.makeItem({ slot: slotName, cls: itemCls(slotName), lvl: Math.max(1, G.char.lvl), tier: 3, rarity: it.gear.rarity || 'Green' });
        addItem(item); UI.pickup(`${item.icon} ${item.name}`, D.RARITY_COLOR[item.rarity]);
      }
      if (it.chestRarity) {
        ['weapon', 'chest'].forEach(sl => {
          const item = D.makeItem({ slot: sl, cls: itemCls(sl), lvl: G.char.lvl, tier: 3, rarity: it.chestRarity });
          addItem(item); UI.pickup(`${item.icon} ${item.name}`, D.RARITY_COLOR[item.rarity]);
        });
      }
    });
    if (r.wings) {
      const w = D.FACTIONS[G.char.faction].wingsName;
      G.unlocked.wings.push(w === 'Celestial Wings' ? 'wn_celestial' : 'wn_demonic');
      toast(`🕊️ Faction wings unlocked! Equip them in Character → Wings.`, 'gold');
    }
    if (r.stones) {
      const st = D.bossStone({ name: 'Quest Sigil', label: 'Quest Sigil', lvl: G.char.lvl });
      addItem(st); UI.pickup(`🪨 ${st.name}`, D.RARITY_COLOR[st.rarity]);
    }
    if (r.key) { G.keyItems.towerKey = true; toast('🔑 Eternity Gate Key obtained!', 'gold'); }
    if (r.itemCraft) gainGems(60);
    questsRefresh();
    toast(`Quest rewards: ${r.xp || 0} XP, ${r.gold || 0} Gold${r.gems ? `, ${r.gems} 💎` : ''}`, 'gold');
    return true;
  }
  function availableQuestsFor(npcId) {
    return D.QUESTS.filter(q => (q.giver === npcId) && !G.quests.done.includes(q.id) && !G.quests.active[q.id] && G.char.lvl >= (q.minLvl || 1) && questPreOk(q) && npcHasRegionAccess(q));
  }
  function turnableQuestsFor(npcId) {
    return activeQuests().filter(q => (q.giver === npcId) && G.quests.active[q.id].done);
  }
  function questPreOk(q) {
    return !q.pre || G.quests.done.includes(q.pre);
  }
  function npcHasRegionAccess(q) {
    if (!q.region || q.region === 'universal' || q.region === G.world.regionId) return true;
    return false;
  }
  function questsRefresh() { /* hook for UI */ }

  /* ---------------- movement ---------------- */
  const SOLID = (x, y) => !World.walkable(L.region, x, y) || L.solid.has(`${Math.floor(x)},${Math.floor(y)}`);
  function tryMove(dx, dy) {
    const p = L.player;
    const nx = p.x + dx, ny = p.y + dy;
    // Tower of Eternity: sealed gates between floors require clearing the floor boss
    if (L.region.def.arenaGates) {
      for (const gateObj of L.region.def.arenaGates) {
        const mini = L.region.def.miniBosses[gateObj.floor];
        const cleared = L.floorKills && L.floorKills[mini.id];
        if (!cleared && p.y >= gateObj.y - 2 && ny < gateObj.y) {
          if (ny < gateObj.y) { toast(`🚪 Gate sealed — defeat ${gateObj.need} to ascend!`, 'bad'); return; }
        }
      }
    }
    if (!SOLID(nx, p.y)) p.x = nx;
    if (!SOLID(p.x, ny)) p.y = ny;
  }

  /* ---------------- portals & teleport ---------------- */
  function portalAt(x, y) {
    for (const po of L.region.portals) {
      if (Math.abs(po.x - Math.floor(x)) <= 0 && Math.abs(po.y - Math.floor(y)) <= 0) return po;
    }
    return null;
  }
  function doTeleport(to, entry) {
    const R = D.regionById(to);
    if (G.char.lvl < R.minLvl) { toast(`🔒 Requires level ${R.minLvl}+ to enter ${R.name}.`, 'bad'); return false; }
    if (R.id === 'tower' && !G.keyItems.towerKey) { toast('🔒 The Eternity Gate is sealed. Slay the Ashen Tyrant first.', 'bad'); return false; }
    L.fade = 1;
    enterRegion(to, entry);
    save();
    return true;
  }

  /* ---------------- auto-attack loop ---------------- */
  function tickAuto() {
    if (!G.settings.autoAttack) return;
    const p = L.player;
    if (p.dead) return;
    const C = D.CLASSES[G.char.cls];
    const t = findTarget(C.range + 3.2);
    if (!t) return;
    const d = dist2d(p, t);
    if (d > C.range + .2) {
      const sp = moveSpeed() * 1;
      const dx = (t.x - p.x) / d, dy = (t.y - p.y) / d;
      tryMove(dx * sp, dy * sp);
      p.moving = true;
      p.dir = t.x < p.x ? -1 : 1;
    } else {
      p.moving = false;
      playerAttack();
    }
  }

  function moveSpeed() {
    const st = playerStats();
    let s = st.spdTotal;
    if (L.player.mountOn && G.using.mount) {
      const mo = D.SHOP.mounts.find(m => m.id === G.using.mount);
      if (mo && mo.spd) s = Math.max(s, mo.spd);
    }
    return s;
  }

  /* ---------------- inventory / equipment ---------------- */
  function equipItem(uid) {
    const it = removeItemByUid(uid); if (!it) return;
    if (it.kind !== 'gear') { addItem(it); toast('Only equipment can be worn.', 'bad'); return; }
    if (it.cls !== 'any' && it.cls !== G.char.cls) {
      addItem(it); toast(`Class-restricted: ${D.CLASSES[it.cls].name} only.`, 'bad'); return;
    }
    const prev = G.equip[it.slot];
    if (prev) G.inv.push(prev);
    G.equip[it.slot] = it;
    const st = playerStats();
    L.player.hp = Math.min(L.player.hp, L.player.maxhp);
    toast(`Equipped ${it.icon} ${it.name}`, 'good');
    UI.refreshPanels();
  }
  function unequip(slot) {
    const it = G.equip[slot]; if (!it) return;
    if (G.inv.length >= 40) { toast('Inventory full!', 'bad'); return; }
    delete G.equip[slot];
    G.inv.push(it); playerStats();
    L.player.hp = Math.min(L.player.hp, L.player.maxhp);
    L.player.mp = Math.min(L.player.mp, L.player.maxmp);
    UI.refreshPanels();
  }
  function sellItem(uid) {
    const it = removeItemByUid(uid); if (!it) return;
    const v = it.value || 10;
    gainGold(v);
    toast(`Sold ${it.name} for ${v} Gold.`, 'gold');
    UI.refreshPanels();
  }
  function useBone(uid) { /* unused */ }

  /* ---------------- fusion: 4 identical → upgrade ---------------- */
  function fuseGroup(baseKey) {
    // baseKey: `${slot}|${cls}|${tier}|${rarity}|${name}`
    const matches = G.inv.filter(it => it.kind === 'gear' && keyOf(it) === baseKey);
    if (matches.length < 4) { toast('Need 4 identical items.', 'bad'); return null; }
    const repr = matches[0];
    const fee = D.ECON.fusionFee(repr.tier);
    if (G.acct.gold < fee) { toast(`Need ${fee} Gold fusion fee.`, 'bad'); return null; }
    G.acct.gold -= fee;
    for (let i = 0; i < 4; i++) {
      const j = G.inv.findIndex(x => x.uid === matches[i].uid);
      G.inv.splice(j, 1);
    }
    let nt = repr.tier, nr = repr.rarity;
    if (nt > 1) nt--;
    else { nt = 3; nr = D.RARITIES[Math.min(7, D.RARITIES.indexOf(nr) + 1)]; }
    const out = D.makeItem({ slot: repr.slot, cls: repr.cls, lvl: Math.max(1, repr.lvl || G.char.lvl), tier: nt, rarity: nr, stone: repr.clan ? { bonuses: [], src: repr.clan } : null, name: null });
    // carry bonuses forward if fused from boss-crafted item
    if (repr.bonuses && repr.bonuses.length) out.bonuses = repr.bonuses.map(b => ({ ...b }));
    addItem(out);
    G.counters.fuses++;
    questEvent('fuse');
    toast(`✨ Fusion success: ${out.name}!`, 'gold');
    UI.refreshPanels();
    save();
    return out;
  }
  const keyOf = it => `${it.slot}|${it.cls}|${it.tier}|${it.rarity}|${it.name}`;

  /* ---------------- legendary crafting ---------------- */
  function craftRecipe(recipe, stoneItem) {
    // materials check
    if (G.acct.gold < recipe.fee) { toast('Not enough gold for the crafting fee.', 'bad'); return null; }
    for (const mid in recipe.mats) {
      if ((G.materials[mid] || 0) < recipe.mats[mid]) { toast(`Need ${recipe.mats[mid]}× ${D.MATERIALS[mid].name}.`, 'bad'); return null; }
    }
    if (!stoneItem) { toast('Select a Boss Stone for this recipe.', 'bad'); return null; }
    const si = G.inv.findIndex(x => x.uid === stoneItem.uid);
    if (si < 0) return null;
    G.acct.gold -= recipe.fee;
    for (const mid in recipe.mats) G.materials[mid] -= recipe.mats[mid];
    G.inv.splice(si, 1);
    const out = D.makeItem({ slot: recipe.slot, cls: recipe.cls, lvl: Math.max(22, G.char.lvl), tier: 3, rarity: 'Legendary', stone: stoneItem, name: null });
    // no accidental creation of items beyond legendary here; bonuses came from stone
    addItem(out);
    toast(`⚒️ Forged ${out.name} — its stone grants ${out.bonuses.length} bonus(es).`, 'gold');
    UI.refreshPanels(); save();
    return out;
  }

  /* ---------------- storage ---------------- */
  function deposit(uid) {
    const i = G.inv.findIndex(x => x.uid === uid);
    if (i < 0) return;
    if (G.storage.length >= 60) { toast('Storage full (60).', 'bad'); return; }
    const [it] = G.inv.splice(i, 1);
    G.storage.push(it);
    G.counters.deposits++;
    questEvent('deposit');
    UI.refreshPanels();
  }
  function withdraw(uid) {
    const i = G.storage.findIndex(x => x.uid === uid);
    if (i < 0) return;
    if (G.inv.length >= 40) { toast('Inventory full!', 'bad'); return; }
    const [it] = G.storage.splice(i, 1);
    G.inv.push(it); UI.refreshPanels();
  }

  /* ---------------- marketplace (local simulation) ---------------- */
  function marketTick() {
    const bucket = Math.floor(Date.now() / 6e5);
    if (G.market.bucket !== bucket) {
      G.market.bucket = bucket;
      let seed = bucket;
      const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      G.market.listings = [];
      for (let i = 0; i < 9; i++) {
        const R = D.REGIONS[Math.floor(rand() * 6)];
        const rar = rand() < .5 ? 'Green' : rand() < .8 ? 'Blue' : 'Purple';
        const slot = D.SLOTS[Math.floor(rand() * 9)];
        const it = D.makeItem({ slot, cls: G.char.cls, lvl: R.minLvl, tier: 3, rarity: rar });
        it.value = Math.round(it.value * 1.25);
        G.market.listings.push({ item: it, seller: 'Wandering Merchant' });
      }
    }
    // settle auctions
    const n = Date.now();
    G.market.mine = (G.market.mine || []).filter(l => {
      if (n >= l.due) { gainGold(Math.round(l.price * .95)); toast(`Sold ${l.item.name} at market for ${Math.round(l.price * .95)} Gold.`, 'gold'); return false; }
      return true;
    });
  }
  function marketBuy(idx) {
    marketTick();
    const l = G.market.listings[idx]; if (!l) return false;
    if (G.acct.gold < l.item.value) { toast('Not enough gold.', 'bad'); return false; }
    if (G.inv.length >= 40) { toast('Inventory full!', 'bad'); return false; }
    G.acct.gold -= l.item.value;
    G.market.listings.splice(idx, 1);
    addItem(l.item);
    toast(`Bought ${l.item.name} from ${l.seller}.`, 'good');
    save(); return true;
  }
  function marketListItem(uid, price) {
    const it = removeItemByUid(uid); if (!it) return false;
    G.market.mine.push({ item: it, price, due: Date.now() + 18e4 });
    toast(`Listed ${it.name} for ${price} Gold (settles in ~3 min).`, 'gold');
    return true;
  }

  /* ---------------- gem shop / cosmetics ---------------- */
  function buyShop(entry) {
    const type = entry.type || (entry.perk ? 'pet' : entry.spd ? 'mount' : entry.faction ? 'wings' : entry.icon === '🪄' || ['fx_ember','fx_frost','fx_void','fx_holy'].includes(entry.id) ? 'fx' : entry.id !== 'prem' && D.SHOP.hairstyles.some(h => h.id === entry.id) ? 'hair' : 'costume');
    const plural = { costume: 'costumes', hair: 'hairstyles', mount: 'mounts', pet: 'pets', fx: 'fx', wings: 'wings' }[type];
    const priceGem = entry.gems || 0, priceGold = entry.gold || 0;
    if (type === 'gems') {
      gainGems(entry.qty);
      toast(`💎 +${entry.qty} Gems (${entry.desc})`, 'good'); save(); return true;
    }
    if (entry.type === 'premium') {
      if (G.acct.gems < entry.gems) { toast('Not enough gems.', 'bad'); return false; }
      G.acct.gems -= entry.gems;
      G.acct.premium = Date.now() + entry.days * 864e5;
      toast('👑 Premium active: +50% Gold & XP!', 'gold'); save(); return true;
    }
    const already = G.unlocked[plural] && G.unlocked[plural].includes(entry.id);
    if (already) { toast('Already owned.', 'bad'); return false; }
    if (priceGem > G.acct.gems) { toast('Not enough gems.', 'bad'); return false; }
    if (G.acct.gold < priceGold) { toast('Not enough gold.', 'bad'); return false; }
    G.acct.gems -= priceGem; G.acct.gold -= priceGold;
    if (!G.unlocked[plural]) G.unlocked[plural] = [];
    G.unlocked[plural].push(entry.id);
    if (type === 'wings') { G.using.wings = entry.id; }
    if (type === 'mount') G.using.mount = entry.id;
    toast(`${entry.icon} Unlocked ${entry.name}!`, 'gold');
    save(); UI.currency();
    return true;
  }

  /* ---------------- cosmetics using ---------------- */
  function toggleCosmetic(type, id) {
    if (type === 'mount') {
      if (G.using.mount === id && L.player.mountOn) { L.player.mountOn = false; toast('Mount dismissed.', ''); return; }
      if (!G.unlocked.mounts.includes(id)) return;
      G.using.mount = id; L.player.mountOn = true; toast('Mount summoned! 🐎', 'gold');
    } else if (type === 'pet') {
      if (G.using.pet === id) { G.using.pet = null; toast('Pet recalled.', ''); }
      else { G.using.pet = id; toast('Pet joins you! 🐾', 'gold'); }
    } else if (type === 'wings') {
      G.using.wings = G.using.wings === id ? null : id;
    } else if (type === 'fx') {
      G.using.fx = G.using.fx === id ? null : id;
    } else if (type === 'costume') {
      if (G.using.costume === id && G.using.cosEnabled) { G.using.cosEnabled = false; }
      else { G.using.costume = id; G.using.cosEnabled = true; }
    } else if (type === 'hair') {
      G.char.hair = id === 'h_silver' ? 1 : 4; // cosmetic hairstyles map to base styles
      toast('Hairstyle changed!', 'good');
    }
    UI.refreshPanels(); save();
  }

  /* ---------------- pets ---------------- */
  function petFollow() {
    const pet = G.using.pet; if (!pet) return;
    if (!L.pet || L.pet.id !== pet) {
      L.pet = { id: pet, x: L.player.x - .8, y: L.player.y + .4, t: 0 };
    }
    const d = dist2d(L.pet, L.player);
    if (d > 1.4) {
      const sp = Math.min(6, d) * dtfn();
      L.pet.x += (L.player.x - L.pet.x) / d * sp;
      L.pet.y += (L.player.y - L.pet.y) / d * sp;
    }
    // vacuum drops
    for (const dr of L.drops) {
      if (dr.gold !== undefined && !dr.item && dist2d(L.pet, dr) < 2.4 && dr.t > .5) {
        dr.x = L.player.x; dr.y = L.player.y;
      }
    }
  }
  const dtfn = () => L.dts || .016;

  /* ---------------- player tick ---------------- */
  function tickPlayer(dt) {
    const p = L.player;
    const st = playerStats();
    // regen
    if (!p.dead) {
      if (now() - L.lastDamageAt > 5) p.hp = Math.min(p.maxhp, p.hp + (1.2 + p.maxhp * .004) * dt);
      p.mp = Math.min(p.maxmp, p.mp + (2 + p.maxmp * .01) * dt);
    }
    // pickups
    for (let i = L.drops.length - 1; i >= 0; i--) {
      const d = L.drops[i];
      d.t += dt;
      if (d.t > 240) { L.drops.splice(i, 1); continue; }
      const dd = dist2d(p, d);
      if (dd < 2.2 && d.gold !== undefined && d.t > .45) { if (pickupDrop(d)) L.drops.splice(i, 1); }
      else if (dd < .75 && d.item && d.t > .25) { if (pickupDrop(d)) { L.drops.splice(i, 1); } }
      else if (d.matShow && dd < .75 && d.t > .25) { L.drops.splice(i, 1); }
    }
    petFollow();
    // projectiles
    for (let i = L.projs.length - 1; i >= 0; i--) {
      const pr = L.projs[i];
      const t = pr.target;
      if (!t || t.dead) { L.projs.splice(i, 1); continue; }
      const d = dist2d(pr, t);
      if (d < .5) { dealHit(t, pr.dmg, pr.fxCol); L.projs.splice(i, 1); continue; }
      const sp = pr.speed * dt * 3;
      pr.x += (t.x - pr.x) / d * sp; pr.y += (t.y - pr.y) / d * sp;
      if (Math.random() < dt * 12) L.parts.push({ x: pr.x, y: pr.y, vx: 0, vy: 0, life: .3, t: 0, col: pr.col, light: true });
    }
    // particles
    for (let i = L.parts.length - 1; i >= 0; i--) {
      const pa = L.parts[i];
      pa.t += dt;
      if (pa.t >= pa.life) { L.parts.splice(i, 1); continue; }
      pa.x += pa.vx * dt; pa.y += pa.vy * dt; pa.vy += 4 * dt;
    }
    // boss/miniboss spawning near arena markers
    for (const pr of L.region.props.filter(x => x.marker)) {
      const dd = dist2d(p, { x: pr.x, y: pr.y });
      const existing = L.monsters.some(m => m.markerRef === pr && (!m.dead || m.respawnT > 0));
      if (dd < 4 && !existing) {
        if (pr.marker === 'boss') spawnBoss(pr);
        if (pr.marker === 'mini') spawnMini(pr);
      }
    }
    // interact scan
    scanInteract();
    tickAuto();
    // dead respawn
    if (p.dead && now() >= p.respawnAt) respawnPlayer();
    // reach events
    if (L.region.town && dist2d(p, L.region.town) < 6 && !L.townEntered) {
      L.townEntered = true; questEvent('reach', L.region.town.name);
    }
  }

  function spawnBoss(markerProp) {
    const wd = L.region, R = wd.def;
    const m = { x: markerProp.x + rnd(-1, 1), y: markerProp.y + rnd(-1, 1), hx: markerProp.x, hy: markerProp.y, dead: false, sp: { type: 'arena' }, markerRef: markerProp, anim: 0, aggro: false };
    specMonster(m, { kind: R.boss.kind, name: R.boss.label, lvl: R.boss.lvl }, R, false, { ...R.boss, kind: R.boss.kind, label: R.boss.label });
    L.monsters.push(m);
    toast(`⚔️ ${m.name} awakens!`, 'bad');
  }
  function spawnMini(markerProp) {
    const wd = L.region, R = wd.def;
    const mb = R.miniBosses[markerProp.mb];
    const m = { x: markerProp.x + rnd(-1, 1), y: markerProp.y + rnd(-1, 1), hx: markerProp.x, hy: markerProp.y, dead: false, sp: { type: 'arena' }, markerRef: markerProp, anim: 0, aggro: false };
    specMonster(m, { kind: mb.kind, name: mb.name, lvl: mb.lvl }, R, false, { ...mb, label: mb.name });
    L.monsters.push(m);
    toast(`⚔️ ${m.name} blocks the stair!`, 'bad');
  }

  /* ---------------- interactions ---------------- */
  function scanInteract() {
    const p = L.player;
    if (p.dead) { L.interactTarget = null; UI.interact(null); return; }
    let best = null, bd = 1.6;
    for (const npc of L.region.npcs) {
      const d = dist2d(p, npc);
      if (d < bd) { bd = d; best = { type: 'npc', data: npc, label: 'Talk' }; }
    }
    for (const sp of L.region.spawns) {
      if (sp.type !== 'gather') continue;
      if (sp.cooldown > now()) continue;
      const d = dist2d(p, sp);
      if (d < bd) { bd = d; best = { type: 'gather', data: sp, label: 'Gather' }; }
    }
    const po = portalAt(p.x, p.y);
    if (po) { best = { type: 'portal', data: po, label: 'Travel' }; }
    L.interactTarget = best;
    UI.interact(best);
  }

  function doInteract() {
    const t = L.interactTarget;
    if (!t) return;
    if (t.type === 'npc') UI.openDialog(t.data);
    if (t.type === 'gather') gather(t.data);
    if (t.type === 'portal') {
      const po = t.data;
      doTeleport(po.to, po.entry);
    }
  }

  function gather(sp) {
    const R = L.region.def;
    sp.cooldown = Date.now() / 1000 + D.ECON.gatherSecs;
    const it = D.mat(R.gather.id);
    G.materials[it.id] = (G.materials[it.id] || 0) + 1;
    UI.pickup(`${it.icon} Gathered ${it.name}`, '#8ff5a8');
    questEvent('collect', it.name);
    burstFx(sp.x, sp.y - .5, '#8ff5a8', 8);
    if (Math.random() < .18) {
      gainGold(20); UI.pickup('💰 Found 20 Gold', '#ffd77a');
    }
  }

  /* ---------------- skill upgrade ---------------- */
  function upgradeSkill() {
    const c = G.char;
    const costMult = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 4, 6: 4, 7: 8, 8: 8, 9: 16 }[c.skillLvl] || 1;
    const cost = 100 * costMult * c.skillLvl;
    if (c.skillLvl >= 10) { toast('Skill already at maximum (10).', 'bad'); return; }
    if (c.skillPts < 1) { toast('Need a Skill Point (gain levels!).', 'bad'); return; }
    if (G.acct.gold < cost) { toast(`Need ${cost} Gold to train.`, 'bad'); return; }
    G.acct.gold -= cost; c.skillPts--;
    c.skillLvl++;
    toast(`⭐ ${D.CLASSES[c.cls].skill.name} is now level ${c.skillLvl}!`, 'gold');
    save();
  }

  /* ---------------- merchant buy/sell ---------------- */
  function buyPotion(kind, n = 1) {
    const price = D.ECON.potionBuy[kind] * n;
    if (G.acct.gold < price) { toast('Not enough gold.', 'bad'); return; }
    G.acct.gold -= price;
    addPotion(kind, n, undefined, true);
    toast(`Bought ${n}× ${kind === 'hp' ? 'Health' : 'Mana'} Potion.`, 'good');
    save();
  }

  /* ---------------- teleporter ---------------- */
  function teleportTo(regionId) {
    const R = D.regionById(regionId);
    if (G.char.lvl < R.minLvl) { toast(`🔒 Requires level ${R.minLvl}+ to enter ${R.name}.`, 'bad'); return false; }
    if (R.id === 'tower' && !G.keyItems.towerKey) { toast('🔒 The Eternity Gate is sealed. Slay the Ashen Tyrant first.', 'bad'); return false; }
    const wd = World.build(regionId);
    if (regionId !== G.world.regionId) {
      const fee = D.ECON.teleFee(D.regionById(G.world.regionId), R);
      if (G.acct.gold < fee) { toast(`Teleport costs ${fee} Gold.`, 'bad'); return false; }
      G.acct.gold -= fee;
      enterRegion(regionId, wd.town ? { x: wd.town.x + .5, y: wd.town.y + 2.5 } : { x: Math.floor(wd.w / 2) + .5, y: Math.floor(wd.h / 2) + .5 });
      save();
    }
    return true;
  }

  /* ---------------- save / load ---------------- */
  function defaultNew(name, opts) {
    const obj = {
      ver: 1,
      char: {
        name, gender: opts.gender || 'female', hair: opts.hair ?? 1, hairCol: opts.hairCol || '#7a4a1e',
        eye: opts.eye || '#4a6fc0', outfit: opts.outfit || 0, cls: opts.cls || 'warrior',
        faction: opts.faction || 'angel', lvl: 1, xp: 0, skillPts: 1, skillLvl: 1
      },
      acct: { gold: 150, gems: 25, premium: 0, createdAt: Date.now() },
      inv: [], storage: [],
      equip: { weapon: null, head: null, chest: null, hands: null, legs: null, feet: null, ring: null, amulet: null, cloak: null },
      potions: { hp: 3, mp: 2 },
      materials: {},
      potionsPost: {},
      quests: { active: {}, done: [] },
      kills: {}, bossKills: {},
      using: { mount: null, pet: null, fx: null, wings: null, costume: null, cosEnabled: false },
      unlocked: { costumes: [], hairstyles: [], mounts: [], pets: [], fx: [], wings: [] },
      world: { regionId: 'greendale', visited: ['greendale'] },
      market: { bucket: 0, listings: [], mine: [] },
      counters: { fuses: 0, deposits: 0, gathers: 0 },
      settings: { autoAttack: true },
      keyItems: { towerKey: false },
      playtimeSecs: 0
    };
    // starter gear by class
    const cls = obj.char.cls;
    const clsFor = slot => slot === 'weapon' || ['head', 'chest', 'hands', 'legs', 'feet'].includes(slot) ? cls : 'any';
    ['weapon', 'head', 'chest', 'legs', 'feet'].forEach(sl => {
      obj.equip[sl] = D.makeItem({ slot: sl, cls: clsFor(sl), lvl: 1, tier: 3, rarity: 'Common' });
    });
    return obj;
  }

  function save() {
    if (!G) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(G));
    } catch (e) { /* storage may be unavailable */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj && obj.ver === 1) return obj;
      return null;
    } catch (e) { return null; }
  }
  function wipe() { localStorage.removeItem(SAVE_KEY); G = null; }

  function bootNew(name, opts) {
    G = defaultNew(name, opts);
    G.quests.active['m1'] = { p: [0], done: false, total: 1 };
    enterRegion('greendale');
    save();
    L.phase = 'play';
    return G;
  }
  function bootLoad(data) {
    G = data;
    enterRegion(G.world.regionId);
    L.phase = 'play';
    UI.trackQuestCurrent();
    return G;
  }
  function bootMenu() { L.phase = 'menu'; }

  function isLoaded() { return !!G; }
  function player() { return L.player; }
  function char() { return G ? G.char : null; }
  function region() { return L.region; }
  function monsters() { return L.monsters; }
  function drops() { return L.drops; }
  function projs() { return L.projs; }
  function parts() { return L.parts; }
  function pet() { return (G && G.using.pet) ? L.pet : null; }
  function interactTarget() { return L.interactTarget; }

  // Device-safe export of internals used by UI + renderer
  return {
    SAVE_KEY,
    get state() { return G; },
    live: L,
    playerStats, xpNeeded,
    charAppear, wingsVisible,
    enterRegion, tickPlayer, tickMonsters, tickAuto, tryMove, moveSpeed, moveSpeedMul: moveSpeed,
    playerAttack, useSkill, drinkPotion, toggleAuto: v => { G.settings.autoAttack = v; save(); },
    equipItem, unequip, sellItem, fuseGroup, keyOf, craftRecipe,
    deposit, withdraw, marketTick, marketBuy, marketListItem,
    buyShop, toggleCosmetic, upgradeSkill, buyPotion, teleportTo, gainGems,
    activeQuests, acceptQuest, turnInQuest, availableQuestsFor, turnableQuestsFor, questEvent,
    doInteract, interactTarget,
    save, load, wipe, bootNew, bootLoad, bootMenu, isLoaded, player, char, region,
    monsters, drops, projs, parts, pet, scanInteract, giveMat, gainGold,
    defaultNew
  };
})();
