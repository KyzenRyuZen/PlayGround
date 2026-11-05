/* ============ AETHERIA — game state, simulation, systems ============ */
"use strict";
/* ------------------------------------------------------------------
   MULTIPLAYER NOTE (honest, by design):
   AETHERIA runs a deterministic local simulation. Everything below is
   single-player offline. `Net` is the seam where a real server adapter
   will be plugged in later (accounts, persistent data, shared world,
   live marketplace). No local code ever pretends to be real players.
-------------------------------------------------------------------*/
const Net = {
  online: false,
  adapter: null,                 // future: { login(), send(), onEvent(cb) }
  publish(ev, data){             // future server adapter reads these events
    if(this.adapter) this.adapter.publish(ev, data);
    else if(evbus.length < 200) evbus.push({ ev, data, t: Date.now() });  // offline: kept, capped
  },
  events(){ return evbus.splice(0); },
};
const evbus = [];

/* ---------------- item helpers ---------------- */
let UID = 1;
function uid(){ return UID++; }

function itemValue(it){
  const tpl = Data.ITEMS[it.tpl];
  if(!tpl) return 10;
  const base = 12 + tpl.ilvl * 7;
  return Math.round(base * CONFIG.rares[it.q].mult * CONFIG.tierMult[it.tier] * (1 + (it.bon?.length||0)*0.06));
}
function itemStats(it){
  const tpl = Data.ITEMS[it.tpl];
  const out = {};
  const m = CONFIG.rares[it.q].mult * CONFIG.tierMult[it.tier];
  for(const k in tpl.stats){ const v = tpl.stats[k]; if(v) out[k] = +((typeof v === "number" ? v : 0) * m).toFixed(1); }
  for(const b of (it.bon||[])) out[b.k] = +(((out[b.k]||0) + b.v)).toFixed(1);
  return out;
}
function itemScore(it){ // rough power for autotest & sort
  const s = itemStats(it);
  return (s.atk||0)*3 + (s.def||0)*2.5 + (s.hp||0)*0.5 + (s.mp||0)*0.3 + (s.crit||0)*4;
}
function itemLabel(it){
  const tpl = Data.ITEMS[it.tpl];
  const pre = CONFIG.tierMult[it.tier] > 1.2 ? "⁺" : "";
  return pre + tpl.name;
}
function bonusPool(){ return ["atk","def","hp","mp","crit"]; }
function rollBonuses(tpl, n, rng){
  const pool = bonusPool(), out = [];
  const scale = (tpl.ilvl||1);
  for(let i=0;i<n;i++){
    const k = pool[Math.floor(rng()*pool.length)];
    const v = k==="hp" ? 8+scale*1.2 : k==="mp" ? 6+scale*0.6 : k==="atk" ? 2+scale*0.5 : k==="def" ? 1.5+scale*0.35 : 1.5+scale*0.05;
    if(out.find(b=>b.k===k)){ out[out.indexOf(out.find(b=>b.k===k))].v = +(out.find(b=>b.k===k).v + v*0.6).toFixed(1); }
    else out.push({ k, v:+v.toFixed(1) });
  }
  return out;
}
// rarity roll for gear drops: only Common/Grey/Green/Blue — always T3 (Purple+ never drop directly)
function rollRarity(rng){
  let r = rng();
  if(r < CONFIG.drops.common) return "common";
  r -= CONFIG.drops.common;
  if(r < CONFIG.drops.grey) return "grey";
  r -= CONFIG.drops.grey;
  if(r < CONFIG.drops.green) return "green";
  return "blue";
}
function makeGearDrop(ilvl, rng){
  const cls = G.cls;
  const slots = ["head","chest","legs","boots","gloves","weapon","offhand","ring"];
  if(rng() < 0.3) slots.push("amulet","amulet"); // accessories occasionally
  const slot = slots[Math.floor(rng()*slots.length)];
  let tplId = `${slot}_${cls}_${ilvl}`;
  if(!Data.ITEMS[tplId]) tplId = `${slot}_${cls}_1`;
  const q = rollRarity(rng);
  const nBon = slot === "ring" || slot === "amulet" ? CONFIG.rares[q].bonus + (q === "blue" ? 1 : 0) : CONFIG.rares[q].bonus;
  return mkItem(tplId, q, 3, nBon, rng);
}
function mkItem(tplId, q, tier, nBon, rng){
  const tpl = Data.ITEMS[tplId];
  return { uid: uid(), tpl: tplId, q, tier, bon: nBon ? rollBonuses(tpl, nBon, rng) : [] };
}
function mkStone(stoneTplId, rng){
  const tpl = Data.ITEMS[stoneTplId];
  const n = 1 + Math.floor(rng()*3); // up to 3 bonuses
  return { uid: uid(), tpl: stoneTplId, q: "purple", tier: 3, bon: rollBonuses(tpl, n, rng), stone: true };
}

/* ---------------- game state ---------------- */
let G = null;
function newGame(o){
  G = {
    v: 1,
    name: o.name, cls: o.cls, faction: o.faction,
    look: { gender:o.gender, hs:o.hs, hc:o.hc, ec:o.ec, outfit:o.outfit, cust:null, wings:null },
    lv: 1, xp: 0,
    gold: CONFIG.prices ? 250 : 250, gems: 30,
    hp: 0, mp: 0,
    map: "greendale", pos: { x: 0, y: 0 },
    inv: new Array(40).fill(null),
    stash: new Array(36).fill(null),
    equip: { head:null, chest:null, legs:null, boots:null, gloves:null, weapon:null, offhand:null, amulet:null, ring:null, wings:null },
    unlocked: ["greendale"],
    quests: {},            // qid -> {step, done:false, claimed}
    kills: {}, bossKills: {}, gathers: {}, craftCount: 0, fuseCount: 0, dungeonClears: {},
    pets: [], mounts: [], costumes: [], wfx: [], wingsOwned: [], hairOwned: [0,1,2,3,4],
    activePet: null, activeMount: null, activeWfx: null,
    skillLv: 1, skillCd: 0,
    market: { listings: [], offers: [], seeded: false },
    stashRows: 3, premUntil: 0,
    playTimeS: 0, achievements: [],
  };
  if(Object.keys(CONFIG.prices).length) {} // prices constant
  G.gold = 250;
  // starter kit: weapon + chest, some potions
  const rng = Data.rngOf("start" + Date.now());
  const w = mkItem(`weapon_${o.cls}_1`, "common", 3, 0, rng);
  addToInv(w);
  addToInv(mkItem(`chest_${o.cls}_1`, "common", 3, 0, rng));
  addToInv({ stack:"hp1", n:5 });
  addToInv({ stack:"mp1", n:4 });
  G.hp = maxHp(); G.mp = maxMp();
  // faction default wings not owned yet (quest/shop only)
  Net.publish("char.created", { name:o.name, cls:o.cls, faction:o.faction });
  return G;
}
function lookOf(){ return Object.assign({ cls: G.cls, faction: G.faction }, G.look); }

/* ---------------- progression ---------------- */
function xpNeed(lv){ return Math.round(CONFIG.xpBase * Math.pow(CONFIG.xpGrowth, lv-1)); }
function gainXp(n){
  if(G.premUntil > Date.now()) n = Math.round(n*1.5);
  n = Math.round(n * (petXpMul()));
  G.xp += n;
  let ups = 0;
  while(G.xp >= xpNeed(G.lv)){ G.xp -= xpNeed(G.lv); G.lv++; ups++; }
  if(ups > 0){
    G.hp = maxHp(); G.mp = maxMp();
    UI.toast(`Level up! You are now level ${G.lv}.`, "gold");
    netPublishNoop();
  }
  UI.dirty();
  return n;
}
function netPublishNoop(){ Net.publish("xp.gained", { lv: G.lv }); }
function maxHp(){
  const c = Data.CLASSES[G.cls];
  let hp = c.base.hp + (G.lv-1)*CONFIG.statGrowth.hp;
  for(const s in G.equip){ const st = G.equip[s] && itemStats(G.equip[s]); if(st) hp += st.hp||0; }
  return Math.round(hp);
}
function maxMp(){
  const c = Data.CLASSES[G.cls];
  let mp = c.base.mp + (G.lv-1)*CONFIG.statGrowth.mp;
  for(const s in G.equip){ const st = G.equip[s] && itemStats(G.equip[s]); if(st) mp += st.mp||0; }
  return Math.round(mp);
}
function atkPower(){
  const c = Data.CLASSES[G.cls];
  let a = c.base.atk + (G.lv-1)*CONFIG.statGrowth.atk;
  for(const s in G.equip){ const st = G.equip[s] && itemStats(G.equip[s]); if(st) a += st.atk||0; }
  a *= Data.FACTIONS[G.faction].atkx || 1;
  return a;
}
function defPower(){
  let d = Data.CLASSES[G.cls].base.def + (G.lv-1)*CONFIG.statGrowth.def;
  for(const s in G.equip){ const st = G.equip[s] && itemStats(G.equip[s]); if(st) d += st.def||0; }
  d *= Data.FACTIONS[G.faction].defx || 1;
  return d;
}
function critChance(){
  let cr = Data.CLASSES[G.cls].base.crit;
  for(const s in G.equip){ const st = G.equip[s] && itemStats(G.equip[s]); if(st) cr += (st.crit||0)/100; }
  return Math.min(CRITCAP, cr); // hard cap 50%
}
function moveSpd(){
  let s = Data.CLASSES[G.cls].base.spd;
  for(const k in G.equip){ const st = G.equip[k]; if(G.equip[k]){ const it = itemStats(G.equip[k]); s += it.spd||0; } }
  if(G.activeMount) s *= Data.MOUNTS[G.activeMount].spd;
  return s;
}
function petXpMul(){ return G.activePet && Data.PETS[G.activePet].xp || 1; }
function petGoldMul(){ return G.activePet && Data.PETS[G.activePet].gold || 1; }
function petPickupR(){ const p = G.activePet && Data.PETS[G.activePet]; return p ? (p.big ? 3.4 : 2.2) : 1.25; }

/* ---------------- inventory ---------------- */
function invFree(){ return G.inv.filter(x=>!x).length; }
function addToInv(it){
  if(!it) return false;
  if(it.stack){
    let s = G.inv.find(x=>x && x.stack===it.stack);
    if(!s){ s = G.stash.find(x=>x && x.stack===it.stack); if(s){ s.n += it.n; return true; } }
    if(s){ s.n += it.n; UI.dirty(); return true; }
  }
  for(let i=0;i<G.inv.length;i++) if(!G.inv[i]){ G.inv[i] = it; UI.dirty(); return true; }
  // stash fallback
  for(let i=0;i<G.stash.length;i++) if(!G.stash[i]){ G.stash[i] = it; UI.toast("Bag full — item stored in Storage.", "bad"); return true; }
  UI.toast("Inventory full!", "bad");
  return false;
}
function countStack(id){
  let n = 0;
  for(const it of G.inv) if(it && it.stack===id) n += it.n;
  for(const it of G.stash) if(it && it.stack===id) n += it.n;
  return n;
}
function removeStack(id, n){
  let need = n;
  for(let i=0;i<G.inv.length && need>0;i++){ const it = G.inv[i]; if(it && it.stack===id){ const take = Math.min(need, it.n); it.n -= take; need -= take; if(it.n<=0) G.inv[i]=null; } }
  for(let i=0;i<G.stash.length && need>0;i++){ const it = G.stash[i]; if(it && it.stack===id){ const take = Math.min(need, it.n); it.n -= take; need -= take; if(it.n<=0) G.stash[i]=null; } }
  UI.dirty();
}
function removeByUid(u){ G.inv = G.inv.map(x => x && x.uid===u ? null : x); UI.dirty(); }
function countGearByTpl(tpl,q,tier){
  return G.inv.filter(it=>it && !it.stack && it.tpl===tpl && it.q===q && it.tier===tier);
}

/* ---------------- equipment ---------------- */
function equipItem(u){
  const idx = G.inv.findIndex(x=>x && x.uid===u); if(idx<0) return;
  const it = G.inv[idx]; const tpl = Data.ITEMS[it.tpl];
  if(it.stone && G.equip.amulet) return UI.toast("Amulet slot is occupied.", "bad");
  const cur = G.equip[tpl.slot];
  G.inv[idx] = cur || null;
  G.equip[tpl.slot] = it;
  G.hp = Math.min(maxHp(), G.hp + 20); clampVitals();
  UI.toast(`Equipped ${itemLabel(it)}.`, "good");
  questFlag("equipWeapon", true);
  UI.dirty();
}
function unequip(slot){
  const it = G.equip[slot]; if(!it) return;
  if(!invFree() && !G.stash.some(x=>!x)) return UI.toast("No space!", "bad");
  G.equip[slot] = null; addToInv(it); clampVitals(); UI.dirty();
}
function clampVitals(){ G.hp = Math.min(G.hp, maxHp()); G.mp = Math.min(G.mp, maxMp()); }

/* ---------------- combat sim ---------------- */
const Sim = {
  mobs: [], drops: [], projs: [], fx: [], text: [],
  time: 0, dead: false, deadT: 0, mapId: null, map: null,
  autoAttack: false, pressingAtk: 0, interactTarget: null, bossRef: null,
  input: { dx: 0, dy: 0 },
  bossTele: null,

  enterMap(id, pos){
    GM_enterMap(id, pos);
  },
  interact(){
    const t = this.interactTarget;
    if(!t) return;
    if(t.type === "npc") NPC._dialog(t.ref);
    else if(t.type === "node") harvestNode(t.ref);
    else if(t.type === "portal") enterPortal(t.ref);
  },
  usePotion(kind){
    if(kind === "hp"){
      const order = G.hp < maxHp()*0.35 ? ["hp2","hp1"] : ["hp1","hp2"];
      for(const id of order){ if(countStack(id) > 0){ removeStack(id,1); const u = Data.USES[id]; G.hp = Math.min(maxHp(), G.hp + u.heal); addText(G.pos.x, G.pos.y, "+"+u.heal, "#7aff8a"); UI.dirty(); return; } }
      UI.toast("No healing potions!", "bad");
    } else {
      for(const id of ["mp1"]){ if(countStack(id) > 0){ removeStack(id,1); const u = Data.USES[id]; G.mp = Math.min(maxMp(), G.mp + u.mana); addText(G.pos.x, G.pos.y, "+"+u.mana+" MP", "#7ab8ff"); UI.dirty(); return; } }
      UI.toast("No mana potions!", "bad");
    }
  },
};

function addText(x, y, txt, col, crit){
  Sim.text.push({ x, y, txt, col, t: 1.1, crit });
}

function regionForMap(id){
  if(Data.DG_BY_ID[id]){ const dg = Data.DG_BY_ID[id]; return Data.REGION_BY_ID[dg.region]; }
  return Data.REGION_BY_ID[id];
}
function mapIlvlIdx(id){
  // scale index: region idx + dungeon bump
  const r = regionForMap(id);
  let idx = r ? r.idx : 0;
  if(Data.DG_BY_ID[id]) idx += (Data.DG_BY_ID[id].lv > 70 ? 7.6 : 0.55);
  return idx;
}

function spawnMob(mobId, x, y, opts){
  const mob = Data.MONS[mobId];
  const idx = mapIlvlIdx(Sim.mapId);
  const scale = 1 + idx*0.42;
  const boss = opts && opts.boss;
  const bdef = boss && (Data.BOSSES[mobId] || Data.DBOSS[mobId]);
  const m = {
    kind: boss ? bdef.mob : mobId,
    mobId: boss ? mobId : mobId,
    boss, bdef,
    x, y,
    hp: boss ? bdef.hp : Math.round(mob.hp * scale),
    maxhp: boss ? bdef.hp : Math.round(mob.hp * scale),
    atk: boss ? bdef.atk : +(mob.atk*scale).toFixed(1),
    def: boss ? bdef.def : +(mob.def*scale).toFixed(1),
    xp: boss ? bdef.xp : Math.round(mob.xp*(1+idx*0.5)),
    gold: boss ? bdef.gold : Math.round(mob.gold*(1+idx*0.6)),
    spd: boss ? 1.5 : mob.spd, aggro: mob.aggro * (boss?1.5:1),
    r: boss ? Data.MONS[bdef?bdef.mob:mobId].r*bdef.scale : mob.r,
    melee: boss ? !bdef.ranged : mob.melee, ranged: boss ? !!bdef.ranged : !!mob.ranged,
    state: "idle", cd: 0, t: 0, flash: 0,
    scale: boss ? bdef.scale : 1,
    range: (boss ? 1.3 : (mob.melee? 1.0 : 4.6)),
    atkCd: boss ? 1.6 : 1.15, aoeCd: boss ? 5 : 0,
    dashCd: 0, name: boss ? bdef.name : mob.name,
    lv: boss ? bdef.lv : Math.round(2 + idx*10),
    elite: !boss && Math.random() < 0.08,
  };
  if(m.elite){ m.hp = m.maxhp = Math.round(m.hp*1.6); m.atk*=1.3; m.xp = Math.round(m.xp*1.8); m.gold = Math.round(m.gold*1.8); m.name = "Elite " + m.name; m.scale *= 1.25; }
  Sim.mobs.push(m);
  return m;
}

/* damage helpers ---------------------------------------------------- */
function dmgToMob(m, base, isSkill, tag){
  let dmg = base * (1 - m.def/(m.def+90));
  const crit = Math.random() < critChance();
  if(crit) dmg *= 1.8;
  dmg *= 0.9 + Math.random()*0.2;
  dmg = Math.max(1, Math.round(dmg));
  m.hp -= dmg; m.flash = 0.12;
  m.state = "chase"; m.aggroNow = true;
  addText(m.x, m.y, String(dmg), crit ? "#ffdf5a" : "#ffffff", crit);
  Sim.fx.push({ kind:"hitSpark", x:m.x, y:m.y, t:0.25, col: wfxCol() });
  if(m.hp <= 0) killMob(m);
  UI.dirty();
}
function wfxCol(){
  const wfx = G.activeWfx && Data.WFX[G.activeWfx];
  return wfx ? wfx.col : G.cls === "mage" ? "#6fd8ff" : G.cls === "assassin" ? "#c85aff" : "#ffcf8a";
}
function dmgToPlayer(dmg, srcName){
  if(Sim.dead) return;
  dmg *= 1 - defPower()/(defPower()+110);
  dmg *= 0.9 + Math.random()*0.2;
  dmg = Math.max(1, Math.round(dmg));
  G.hp -= dmg;
  addText(G.pos.x, G.pos.y, "-"+dmg, "#ff7a7a");
  Sim.fx.push({ kind:"hitSpark", x:G.pos.x, y:G.pos.y, t:0.22, col:"#ff5a5a" });
  if(G.hp <= 0){ G.hp = 0; playerDie(srcName); }
  UI.dirty();
}
function playerDie(srcName){
  Sim.dead = true; Sim.deadT = 0; Sim.autoAttack = false;
  UI.toast(`${G.name} has fallen... (${srcName||"the wilds"})`, "bad");
  UI.dirty();
}
function respawn(){
  G.hp = maxHp(); G.mp = maxMp();
  G.gold = Math.max(0, G.gold - Math.round(G.gold*0.02));
  Sim.dead = false;
  GM_enterMap(Sim.mapId, null, true);
  UI.dirty();
}

function killMob(m){
  Sim.mobs = Sim.mobs.filter(x=>x!==m);
  const isBoss = m.boss;
  // rewards
  let gold = Math.round(m.gold * (petGoldMul()));
  if(G.premUntil > Date.now()) gold = Math.round(gold*1.5);
  G.gold += gold;
  addText(m.x, m.y, "+"+gold+"g", "#ffd75a");
  gainXp(m.xp);
  G.kills[m.mobId] = (G.kills[m.mobId]||0) + 1;
  Quest.onKill(m.mobId);
  if(isBoss){
    G.bossKills[m.mobId] = (G.bossKills[m.mobId]||0) + 1;
    // first boss-kill gems
    const first = G.bossKills[m.mobId] === 1;
    if(first){ G.gems += 15; UI.toast("First kill bonus: +15 Gems!", "gold"); }
    Quest.onBoss(m.mobId);
    Net.publish("boss.killed", { id: m.mobId });
  }
  // zone respawn bookkeeping
  if(m._zone) m._zone.cur--;
  if(m._bossZone) m._bossZone.cur = 0;
  // loot
  const rng = Math.random;
  const ilvlIdx = mapIlvlIdx(Sim.mapId);
  const region = regionForMap(Sim.mapId);
  const ilvl = Data.ILVLS[Math.min(Data.ILVLS.length-1, Math.max(0, Math.round(ilvlIdx*1 - 0)))];
  if(Math.random() < CONFIG.matDropChance){
    const matId = (Data.MONS[m.kind] && Data.MONS[m.kind].mat) || "herb";
    const n = 1 + (Math.random()<0.3?1:0);
    addToInv({ stack: matId, n });
    groundDrop(Sim.mapId, { stack: matId, n }, m.x, m.y);
  }
  if(Math.random() < (isBoss ? 1 : CONFIG.equipDropChance)){
    const it = makeGearDrop(ilvl, Math.random);
    groundDrop(Sim.mapId, it, m.x + (Math.random()-0.5), m.y + (Math.random()-0.5)*0.6);
    if(isBoss) UI.toast(`The ${m.name} dropped ${itemLabel(it)}!`, "gold");
  }
  if(isBoss && m.mobId !== "b_slimeking"){
    const dgId = Sim.mapId;
    const stoneTpl = Data.stoneFor(dgId);
    const worldStoneMap = { b_gorga:"stone_gorga", b_arachnia:"stone_vex", b_dreadseer:"stone_grave",
      b_frosttitan:"stone_rime", b_sandraj:"stone_neskar", b_cinderclaw:"stone_vharok" };
    const sid = stoneTpl || worldStoneMap[m.mobId];
    if(sid && !G._stoneGot?.[sid]){
      const st = mkStone(sid, Math.random);
      G._stoneGot = G._stoneGot || {}; G._stoneGot[sid] = true;
      addToInv(st);
      UI.toast(`${Data.ITEMS[sid].name} obtained — up to 3 bonuses!`, "gold");
    }
    // legend sigil from dungeon bosses
    if(Data.DG_BY_ID[dgId]){
      addToInv({ stack:"sigil", n: 1 + (Math.random()<0.5?1:0) });
      UI.toast("Legend Sigil obtained — used to craft Legendary gear!", "good");
    }
  }
  if(isBoss){ // guaranteed materials burst
    const m2 = (Data.MONS[m.kind] && Data.MONS[m.kind].mat) || "ore";
    addToInv({ stack: m2, n: 4 });
    if(Math.random() < 0.5) addToInv({ stack:"hp2", n:2 });
  }
  Sim.drops.push({ x:m.x, y:m.y, gold: isBoss?0:Math.round(m.gold*0.3), t: 0 });
  UI.dirty();
}
function groundDrop(mapId, it, x, y){ Sim.drops.push({ x, y, item: it, t: 0 }); }

/* potions crafting (blacksmith) */
function craftPotions(kind, n){
  const fee = CONFIG.prices.craftFee * n;
  const mats = kind === "hp1" ? ["herb","herb"] : kind === "hp2" ? ["herb","herb","duneAmber"] : ["ore","ore"];
  let cost = {};
  for(const k of mats) cost[k] = (cost[k]||0)+1;
  if(G.gold < fee) return UI.toast("Not enough gold.", "bad");
  for(const k in cost) if(countStack(k) < cost[k]) return UI.toast("Missing materials: " + Data.MATS[k].name, "bad");
  G.gold -= fee;
  for(const k in cost) removeStack(k, cost[k]);
  addToInv({ stack: kind, n });
  G.craftCount += n;
  Quest.onCraft(n);
  UI.toast(`Crafted ${Data.USES[kind].name} x${n}.`, "good");
  Net.publish("item.crafted", { id:kind, n });
}

/* legendary craft (blacksmith + rare materials + sigil) */
function craftLegendary(slot){
  const cls = G.cls;
  const region = regionForMap(Sim.mapId);
  const ilvl = Data.ILVLS[Math.min(Data.ILVLS.length-1, region.idx*1)];
  const tplId = `${slot}_${cls}_${ilvl}`;
  if(!Data.ITEMS[tplId]) return UI.toast("Blueprint unavailable here.", "bad");
  const gold = CONFIG.prices.legendaryGold;
  const need = { sigil: 2 };
  const regionMats = { greendale:"wolfPelt", ironcrag:"ironScrap", venomwood:"spiderSilk", mistgrave:"ghostWisp",
    frostpeak:"frostHide", sunscorch:"duneAmber", ashendom:"emberCore", tower:"voidShard" }[region.id] || "herb";
  need[regionMats] = 6; need.ore = 8;
  if(G.gold < gold) return UI.toast(`Need ${gold} gold.`, "bad");
  for(const k in need) if(countStack(k) < need[k]) return UI.toast("Missing: " + (Data.MATS[k]?Data.MATS[k].name:k) + " x" + (need[k]-countStack(k)), "bad");
  G.gold -= gold;
  for(const k in need) removeStack(k, need[k]);
  const rng = Data.rngOf("leg" + Date.now());
  const it = mkItem(tplId, "legendary", 3, CONFIG.rares.legendary.bonus, rng);
  addToInv(it);
  UI.toast(`Forged ${itemLabel(it)} — LEGENDARY!`, "gold");
  Net.publish("item.legendary", { tpl:tplId });
  UI.dirty();
}

/* fusion: 4 identical -> per spec. Never destroys randomly, consumes exactly by rule. */
function fuseItems(items){
  if(items.length !== 4) return UI.toast("Select exactly 4 items.", "bad");
  const a = items[0];
  if(items.some(x => x.tpl !== a.tpl || x.q !== a.q || x.tier !== a.tier)) return UI.toast("Items must be identical (same item, rarity & tier).", "bad");
  const fee = CONFIG.prices.fusionFee[a.q] || 0;
  if(G.gold < fee) return UI.toast("Not enough gold for fusion.", "bad");
  const tpl = Data.ITEMS[a.tpl];
  let result;
  if(a.tier > 1){
    result = { uid: uid(), tpl: a.tpl, q: a.q, tier: a.tier - 1, bon: keepBon(a) };
  } else {
    const nq = Data.nextRar(a.q);
    if(!nq) return UI.toast("This item cannot be fused further.", "bad");
    if(nq === "divine") UI.toast("DIVINE! Your item has reached the pinnacle of Aetheria.", "gold");
    const nBon = Math.max(a.bon.length, CONFIG.rares[nq].bonus);
    result = { uid: uid(), tpl: a.tpl, q: nq, tier: 3, bon: rollBonuses(tpl, nBon, Data.rngOf("fu"+Date.now())) };
  }
  for(const it of items) removeByUid(it.uid);
  G.gold -= fee;
  addToInv(result);
  G.fuseCount++;
  Quest.onFuse();
  UI.toast(`Fusion complete: ${itemLabel(result)} (${CONFIG.rares[result.q].name} T${result.tier})!`, "gold");
  Net.publish("item.fused", { q: result.q, tier: result.tier });
  UI.dirty();
  return result;
}
function keepBon(a){ return a.bon.map(b=>({k:b.k, v:b.v})); }

/* gathering --------------------------------------------------------- */
function harvestNode(node){
  if(node.cd > Sim.time) return UI.toast("Depleted — wait a moment.", "bad");
  node.cd = Sim.time + 18;
  const n = 1 + (Math.random()<0.4?1:0);
  const id = node.kind === "herb" ? "herb" : node.kind === "ore" ? "ore" : "wood";
  addToInv({ stack:id, n });
  addText(node.x, node.y, "+"+n+" "+Data.MATS[id].name, "#9adf9a");
  G.gathers[id] = (G.gathers[id]||0) + n;
  Quest.onGather(id, n);
  Sim.fx.push({ kind:"gather", x:node.x, y:node.y, t:0.6, col:"#a8e88a" });
  UI.dirty();
}

/* portals / travel -------------------------------------------------- */
function teleportCost(){ return CONFIG.prices.teleport; }
function travelTo(regionId){
  if(!G.unlocked.includes(regionId)) return UI.toast("Region not unlocked yet.", "bad");
  const cost = teleportCost();
  if(G.gold < cost) return UI.toast("Not enough gold.", "bad");
  G.gold -= cost;
  GM_enterMap(regionId, null, true);
  UI.dirty();
}
function enterPortal(p){
  if(p.dungeonOf !== undefined && p.entrance){
    const dgs = Data.DUNGEONS.filter(d=>d.region === p.dungeonOf);
    UI.openDungeonPicker(dgs);
  } else if(p.exitTo){
    if(p.towerRoot && !G.unlocked.includes("tower")) return UI.toast("The Waystone rejects you... (quest locked)", "bad");
    GM_enterMap(p.exitTo, null, true);
  } else if(p.towerRoot){
    if(!G.unlocked.includes("tower")) return;
    Sim.bossRef = null;
    if(!Sim.map.bossDefeated) UI.toast("The Warden's magic blocks the exit — defeat it!", "bad");
    else GM_enterMap("ashendom", null, true);
  }
}

/* quest system ------------------------------------------------------ */
const Quest = {
  data(){ return Data.QUESTS; },
  state(id){ return G.quests[id] || (G.quests[id] = { step:0, claimed:false }); },
  active(){ return Data.QUESTS.filter(q=>{ const s = G.quests[q.id]; return s && !s.claimed; }); },
  offer(q){ // auto-accept quest by talking to giver
    const s = this.state(q.id);
    if(!s.started){ s.started = true; UI.toast(`New ${q.main?"main":"side"} quest: ${q.name}`, "gold"); Net.publish("quest.started",{id:q.id}); }
  },
  progressObj(q, s){
    const o = q.objs[s.step];
    return o;
  },
  onKill(mobId){ this.bump({k:"kill", m:mobId}); },
  onBoss(bossId){ this.bump({k:"boss", m:bossId}); }
    ,
  onGather(mat, n){ this.bumpN({k:"gather", m:mat}, n); },
  onCraft(n){ this.bumpN({k:"craft"}, n); G.$crafted = (G.$crafted||0)+n; },
  onFuse(){ this.bumpN({k:"fuse"}, 1); G.$fused = (G.$fused||0)+1; },
  bumpN(obj, n){
    if(!obj) return;
    for(const q of this.active()){
      const s = G.quests[q.id];
      const o = q.objs[s.step];
      if(!o) continue;
      if(o.k === obj.k && (o.m === obj.m || !o.m)){
        s.sec = (s.sec||0) + n;
        if(s.sec >= o.n){ s.sec = o.n; this.tryAdvance(q, s); }
      }
    }
  },
  bump(obj){
    for(const q of this.active()){
      const s = G.quests[q.id];
      const o = q.objs[s.step];
      if(!o || o.k !== obj.k || o.m !== obj.m) continue;
      if(o.k === "kill"){ s.sec = (s.sec||0)+1; if(s.sec >= o.n) this.tryAdvance(q, s); }
      else if(o.k === "boss"){ this.tryAdvance(q, s); }
    }
  },
  questFlag(k, v){
    for(const q of this.active()){ const s = G.quests[q.id]; const o = q.objs[s.step]; if(o && o.k === k) this.tryAdvance(q, s); }
  },
  checkTalk(npcId){
    let acted = false;
    for(const q of this.active()){
      const s = G.quests[q.id];
      const o = q.objs[s.step];
      if(o && o.k === "talk" && o.npc === npcId){ this.tryAdvance(q, s); acted = true; }
    }
    return acted;
  },
  checkLv(){
    for(const q of G){} // no-op
    for(const q of this.active()){ const s = G.quests[q.id]; const o = q.objs[s.step]; if(o && o.k === "lv" && G.lv >= o.n){ s.sec = o.n; this.tryAdvance(q, s); } }
  },
  checkDungeon(dgId){
    for(const q of this.active()){ const s = G.quests[q.id]; const o = q.objs[s.step];
      if(o && o.k === "dungeon" && o.id === dgId){ this.tryAdvance(q, s); return true; } }
    return false;
  },
  tryAdvance(q, s){
    s.step++;
    s.sec = 0;
    if(s.step >= q.objs.length){
      s.claimed = false; s.complete = true;
      // auto claim on next talk to giver; else ready marker
      UI.toast(`Quest ready to turn in: ${q.name}`, "good");
    } else {
      UI.toast(`${q.name}: objective ${s.step}/${q.objs.length} complete`, "good");
    }
    UI.dirty();
  },
  claimable(q){
    const s = G.quests[q.id];
    return s && s.complete && !s.claimed;
  },
  claim(q){
    const s = G.quests[q.id];
    s.claimed = true; s.complete = false;
    const rw = q.rw || {};
    if(rw.gold){ let g = rw.gold; if(G.premUntil > Date.now()) g = Math.round(g*1.5); G.gold += g; }
    if(rw.xp) gainXp(rw.xp);
    if(rw.gems) G.gems += rw.gems;
    if(rw.items) rw.items.forEach(x=>addToInv({ stack:x.id, n:x.n }));
    if(rw.itemGen){
      const rng = Data.rngOf("rw"+Date.now());
      addToInv(mkItem(`${rw.itemGen.slot}_${G.cls}_${rw.itemGen.ilvl}`, rw.itemGen.q, 3, CONFIG.rares[rw.itemGen.q].bonus||0, rng));
    }
    if(rw.mount && !G.mounts.includes(rw.mount)){ G.mounts.push(rw.mount); UI.toast(`Mount acquired: ${Data.MOUNTS[rw.mount].name}!`, "gold"); }
    if(rw.wings && !G.wingsOwned.includes(rw.wings)){
      G.wingsOwned.push(rw.wings); G.look.wings = G.look.wings || rw.wings;
      G.equip.wings = rw.wings; // auto-equip wings
      UI.toast(`Wings acquired: ${Data.WINGS[rw.wings].name}! (Equip in Character)`, "gold");
    }
    if(rw.pets) rw.pets.forEach(p=>{ if(!G.pets.includes(p)){ G.pets.push(p); } });
    // unlock next region hint
    if(q.next){
      const nq = Data.QUESTS.find(x=>x.id===q.next);
      const reg = regionForMapAny(nq);
      if(reg && !G.unlocked.includes(reg.id)){ G.unlocked.push(reg.id); UI.toast(`Region unlocked: ${reg.name}!`, "gold"); }
    }
    UI.toast(`Quest complete: ${q.name}!`, "gold");
    Net.publish("quest.claimed", { id:q.id });
    UI.dirty();
  },
  availableAt(npcId){ // quests this giver can start
    return Data.QUESTS.filter(q => giverOf(q) === npcId && !G.quests[q.id]?.started && G.lv >= (q.lv||1) && factionOk(q));
  },
};
function giverOf(q){ return q.npcOverride || q.giver; }
function factionOk(q){ return !q.faction || q.faction === G.faction; }
function regionForMapAny(q){
  if(!q) return null;
  const tid = giverOf(q)?.split("_")[0];
  const rg = Data.REGIONS.find(r=>r.town && r.town.id === tid);
  return rg || null;
}

/* NPC interaction ---------------------------------------------------- */
const NPC = {
  _dialog(npc){
    Sim.interactTarget = null;
    NPC.cur = npc;
    const claims = Data.QUESTS.filter(q => Quest.claimable(q) && giverOf(q) === npc.id);
    const offers = Quest.availableAt(npc.id);
    if(claims.length) { Quest.checkTalk(npc.id); }
    const hadTalkObj = Quest.checkTalk(npc.id);
    if(claims.length || hadTalkObj){
      // turn in / progress
      if(claims.length){ UI.openNpcTurnIn(npc, claims); return; }
    }
    if(offers.length){ UI.openNpcOffer(npc, offers); return; }
    UI.openNpcMenu(npc);
  },
};

/* map/dungeon enter ------------------------------------------------- */
function GM_enterMap(mapId, pos, toSpawn){
  const map = World.ensure(mapId);
  Sim.map = map; Sim.mapId = mapId;
  Sim.mobs = []; Sim.drops = []; Sim.projs = []; Sim.fx = []; Sim.text = [];
  Sim.bossRef = null; Sim.bossTele = null;
  G.map = mapId;
  const zoneStart = pos || map.spawn;
  marketSeed();
  G.pos = { x: zoneStart.x, y: zoneStart.y };
  Sim.autoAttack = Sim.autoAttack;
  // seed mobs in zones
  for(const z of map.zones){
    z.cur = 0;
    for(let i=0;i<z.max;i++) spawnZoneMob(z);
  }
  // world boss
  if(map.bossSpawn && map.region && map.region.boss && !map.isDungeon){
    const b = spawnMob(map.region.boss, map.bossSpawn.x, map.bossSpawn.y, { boss:true });
    Sim.bossSpawned = b;
  }
  if(map.isDungeon && map.bossSpawn){
    const b = spawnMob(map.dungeon.boss, map.bossSpawn.x, map.bossSpawn.y, { boss:true });
    Sim.bossRef = b;
    map.bossDefeated = false;
  }
  UI.toast(map.name + (map.isDungeon ? " — Dungeon" : ""), "gold");
  UI.dirty();
}
function spawnZoneMob(z){
  const m = Sim.map;
  for(let t=0;t<20;t++){
    const x = z.x + Math.random()*z.w, y = z.y + Math.random()*z.h;
    if(!World.blockedAt(m, x, y)){
      const mob = spawnMob(z.mob, x, y);
      mob._zone = z; z.cur++;
      return mob;
    }
  }
}

/* =================== main simulation step ==================== */
function simStep(dt){
  Sim.time += dt;
  G.playTimeS += dt;
  const map = Sim.map;
  if(Sim.dead){
    Sim.deadT += dt;
    return;
  }
  /* --- player movement --- */
  const c = Data.CLASSES[G.cls];
  const inMove = Sim.input;
  const mag = Math.hypot(inMove.dx, inMove.dy);
  if(mag > 0.15){
    const sp = moveSpd() * dt * Math.min(1.15, mag);
    const nx = G.pos.x + (inMove.dx + inMove.dy)*0.7071*sp;
    const ny = G.pos.y + (inMove.dy - inMove.dx)*0.7071*sp;
    tryMove(nx, ny);
    G.face = (inMove.dy - inMove.dx) < -0.05 ? "W" : ((inMove.dx + inMove.dy) < -0.05 ? "N" : "S");
    if(Math.abs(inMove.dx) > Math.abs(inMove.dy)) G.face = inMove.dx > 0 ? "S" : "W";
  }
  // regen
  G.hp = Math.min(maxHp(), G.hp + (1.6 + G.lv*0.12)*dt);
  G.mp = Math.min(maxMp(), G.mp + (2.2 + G.lv*0.2)*dt);
  // timers
  G.skillCd = Math.max(0, G.skillCd - dt);
  if(Sim.pressingAtk) Sim.pressingAtk -= dt;

  /* --- auto & normal attacks --- */
  const nearest = nearestMob(6);
  const autoOn = Sim.autoAttack && !Sim.dead;
  if(nearest && (autoOn || Sim.pressingAtk > 0)){
    const dist = distTo(G.pos, nearest);
    if(dist <= c.base.atkRange + nearest.r + 0.15){
      if(G._atkCd === undefined) G._atkCd = 0;
      if(Sim.time >= (G._atkNext||0)){
        G._atkNext = Sim.time + c.base.atkCd;
        Sim.pressingAtk = 0;
        basicAttack(nearest);
      }
    }
  }
  /* --- skill auto? just button-driven (btn press handled by UI) --- */

  /* --- mobs AI --- */
  for(const m of Sim.mobs){
    m.t += dt; if(m.flash>0) m.flash -= dt;
    const d = distTo(G.pos, m);
    // aggro
    if(m.state === "idle" && d < m.aggro) m.state = "chase";
    if(m.state === "chase"){
      // leash
      const home = m._zone ? { x:m._zone.x + m._zone.w/2, y:m._zone.y + m._zone.h/2 } : (m.bossSpawnHome || {x:m.x0, y:m.y0});
      if(m._zone){
        const hd = distTo({x:m.homeX ?? (m.homeX = m._zone.x + Math.random()*m._zone.w), y:m.homeY ?? (m.homeY = m._zone.y + Math.random()*m._zone.h)}, m);
        if(d > m.aggro + 7){ m.state = "back"; }
      }
      if(m.melee && !m.ranged){
        if(d > m.range + m.r*0.5){
          const step = (m.spd*(m.boss?0.85:1))*dt;
          const ux = (G.pos.x - m.x)/d, uy = (G.pos.y - m.y)/d;
          mobMove(m, m.x + ux*step, m.y + uy*step);
        } else {
          if(Sim.time >= (m.nextAtk||0)){ m.nextAtk = Sim.time + m.atkCd; dmgToPlayer(m.atk, m.name); }
        }
      } else {
        // ranged
        if(d > m.range){ const step = m.spd*dt*0.9; const ux = (G.pos.x-m.x)/d, uy=(G.pos.y-m.y)/d; mobMove(m, m.x+ux*step, m.y+uy*step); }
        else if(Sim.time >= (m.nextAtk||0)){
          m.nextAtk = Sim.time + 2.2;
          Sim.projs.push({ x:m.x, y:m.y-0.5, vx:(G.pos.x-m.x)/d, vy:(G.pos.y-m.y)/d, spd:6.5, dmg:m.atk, kind:"male", owner:m, t:0 });
        }
      }
      // boss AoE telegraph
      if(m.boss){
        m.aoeCd -= dt;
        if(m.aoeCd <= 2 && !m.tele){ m.tele = 1.15; addText(m.x, m.y, "!", "#ff5a5a", true); }
        if(m.tele){
          m.tele -= dt;
          if(m.tele <= 0){
            m.tele = null; m.aoeCd = 5.5;
            Sim.bossTele = { x:m.x, y:m.y, r:2.6, t:0 };
            if(distTo(G.pos, m) < 2.6) dmgToPlayer(m.atk*1.8, m.name+" (slam)");
            Sim.fx.push({ kind:"slam", x:m.x, y:m.y, t:0.5 });
          }
        }
      }
      if(m.dashCd > 0) m.dashCd -= dt;
    } else if(m.state === "back"){
      const zx = m.homeX ?? m._zone.x, zy = m.homeY ?? m._zone.y;
      const d2 = Math.hypot(zx-m.x, zy-m.y);
      if(d2 > 0.4){ const st = m.spd*1.2*dt; mobMove(m, m.x + (zx-m.x)/d2*st, m.y + (zy-m.y)/d2*st); }
      else { m.state = "idle"; }
    }
  }
  /* --- projectiles --- */
  for(const p of [...Sim.projs]){
    p.x += p.vx*p.spd*dt; p.y += p.vy*p.spd*dt; p.t += dt;
    if(p.t > 2.4){ Sim.projs.splice(Sim.projs.indexOf(p),1); continue; }
    if(p.owner){ // mob projectile
      if(distTo(G.pos, p) < 0.5){ dmgToPlayer(p.dmg, "magic"); Sim.projs.splice(Sim.projs.indexOf(p),1); }
    } else { // player projectile: check mobs
      for(const m of Sim.mobs){ if(distTo(m, p) < m.r + 0.3){ dmgToMob(m, p.dmg, false, "proj"); Sim.projs.splice(Sim.projs.indexOf(p),1); break; } }
    }
  }
  /* --- fx/text --- */
  for(const f of Sim.fx){ f.t -= dt; }
  Sim.fx = Sim.fx.filter(f=>f.t>0);
  for(const f of Sim.text){ f.t -= dt; f.y -= dt*0.7; }
  Sim.text = Sim.text.filter(f=>f.t>0);
  if(Sim.bossTele){ Sim.bossTele.t -= dt; if(Sim.bossTele.t<=0) Sim.bossTele = null; }

  /* --- loot pickup --- */
  const pr = petPickupR();
  for(const d of [...Sim.drops]){
    d.t += dt;
    const dd = distTo(G.pos, d);
    if(d.gold && dd < pr){ G.gold += d.gold; addText(G.pos.x, G.pos.y, "+"+d.gold+"g", "#ffd75a"); Sim.drops.splice(Sim.drops.indexOf(d),1); }
    else if(d.item && dd < pr){
      if(addToInv(d.item)){ Sim.drops.splice(Sim.drops.indexOf(d),1); UI.toast(`Found ${itemLabel(d.item)} (${CONFIG.rares[d.item.q].name} T${d.item.tier})`, d.item.q==="blue"||d.item.q==="green"?"good":""); }
    }
    if(d.t > 60) Sim.drops.splice(Sim.drops.indexOf(d),1);
  }
  /* --- zone respawn --- */
  for(const z of map.zones){
    if(z.cur < z.max && Math.random() < dt*0.5) spawnZoneMob(z);
  }
  /* --- boss respawn in overworld --- */
  if(!map.isDungeon && map.region && map.region.boss && !(Sim.bossRef && Sim.bossRef.hp>0) && !Sim.mobs.some(m=>m.boss)){
    if(!Sim._bossT) Sim._bossT = CONFIG.bossRespawnSec;
    Sim._bossT -= dt;
    if(Sim._bossT <= 0){ Sim._bossT = CONFIG.bossRespawnSec;
      const b = spawnMob(map.region.boss, map.bossSpawn.x, map.bossSpawn.y, { boss:true });
    }
  }
  /* --- dungeon boss killed → clear --- */
  if(map.isDungeon && map.bossSpawn && Sim.bossRef && Sim.bossRef.hp <= 0 && !map.bossDefeated){
    map.bossDefeated = true;
    Quest.checkDungeon(mapId);
    G.dungeonClears[mapId] = (G.dungeonClears[mapId]||0)+1;
    const first = G.dungeonClears[mapId] === 1;
    if(first){ G.gems += 25; UI.toast("Dungeon first-clear: +25 Gems!", "gold"); }
    UI.toast(`${map.name} cleared! The exit portal is open.`, "gold");
  }
  /* ---- market sim (offline preview; real player-to-player later) ---- */
  marketTick(dt);
  /* quest lv checks */
  if(Math.floor(Sim.time*2) % 4 === 0) Quest.checkLv();
}
function tryMove(nx, ny){
  const r = 0.3;
  if(!World.blockedAt(Sim.map, nx + Math.sign(nx-G.pos.x)*r, G.pos.y)) G.pos.x = nx;
  if(!World.blockedAt(Sim.map, G.pos.x, ny + Math.sign(ny-G.pos.y)*r)) G.pos.y = ny;
}
function mobMove(m, nx, ny){
  if(!World.blockedAt(Sim.map, nx, m.y)) m.x = nx;
  if(!World.blockedAt(Sim.map, m.x, ny)) m.y = ny;
  if(!m.homeX && m._zone){ m.homeX = m._zone.x + Math.random()*m._zone.w; m.homeY = m._zone.y + Math.random()*m._zone.h; }
}
function distTo(a, b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function nearestMob(d){
  let best = null, bd = d;
  for(const m of Sim.mobs){ const dd = distTo(G.pos, m); if(dd < bd){ bd = dd; best = m; } }
  return best;
}
function basicAttack(m){
  const c = Data.CLASSES[G.cls];
  if(G.cls === "mage"){
    Sim.projs.push({ x:G.pos.x, y:G.pos.y-0.5, vx:(m.x-G.pos.x)/distTo(G.pos,m), vy:(m.y-G.pos.y)/distTo(G.pos,m), spd:9, dmg:atkPower(), kind:"bolt", col:wfxCol(), t:0 });
    G.mp = Math.max(0, G.mp - 2);
  } else if(G.cls === "warrior"){
    // cleave: primary + anything adjacent to it
    dmgToMob(m, atkPower(), false, "wfx");
    for(const o of Sim.mobs) if(o !== m && distTo(o, m) < 1.2) dmgToMob(o, atkPower()*0.5, false);
  } else {
    dmgToMob(m, atkPower(), false); // assassin fast
  }
  G.atkAnim = 0.35;
}
function useSkill(nearest){
  const c = Data.CLASSES[G.cls];
  const sk = c.skill;
  if(G.skillCd > 0) return UI.toast("Skill on cooldown!", "bad");
  if(G.mp < sk.mp) return UI.toast("Not enough MP!", "bad");
  G.skillCd = sk.cd; G.mp -= sk.mp;
  const mult = sk.mult + sk.perLv*(G.skillLv-1);
  if(sk.kind === "aoeSelf"){
    Sim.fx.push({ kind:"slash", x:G.pos.x, y:G.pos.y, t:0.4, col:"#ffe8b0" });
    for(const m of [...Sim.mobs]) if(distTo(G.pos, m) < sk.radius + m.r) dmgToMob(m, atkPower()*mult, true);
  } else if(sk.kind === "aoeBolt"){
    const tgt = nearest || nearestMob(8);
    if(tgt){ Sim.projs.push({ x:G.pos.x, y:G.pos.y-0.5, vx:(tgt.x-G.pos.x)/distTo(G.pos,tgt), vy:(tgt.y-G.pos.y)/distTo(G.pos,tgt), spd:7, skill:true, mult, kind:"meteor", col:"#ff7a2a", t:0 }); }
    else UI.toast("No target in range.", "bad");
  } else { // flurry
    const tgt = nearest || nearestMob(4);
    if(tgt){
      G.atkAnim = 0.4;
      let n = 0;
      for(let i=0;i<sk.hits;i++){
        const m = nearestMob(4);
        if(m) { dmgToMob(m, atkPower()*mult, true); n++; }
      }
      Sim.fx.push({ kind:"shadow", x:G.pos.x, y:G.pos.y, t:0.4, col:"#8a5aff" });
      addText(G.pos.x, G.pos.y, `${sk.name}!`, "#c8a8ff", true);
    } else UI.toast("No target in range.", "bad");
  }
  UI.dirty();
}

/* ---------------- marketplace simulation ---------------- */
function marketSeed(){
  if(G.market.seeded) return;
  G.market.seeded = true;
  refreshOffers();
}
function refreshOffers(){
  const idx = Math.round(mapIlvlIdx(G.map || "greendale"));
  const ilvl = Data.ILVLS[Math.min(Data.ILVLS.length-1, Math.max(0, idx))];
  const rng = Data.rngOf("mk" + Date.now());
  G.market.offers = [];
  const n = 6;
  for(let i=0;i<n;i++){
    const it = makeGearDrop(ilvl, rng);
    const val = itemValue(it);
    G.market.offers.push({ id:"o"+i, item: it, price: Math.round(val * (0.85 + rng()*0.5)), seller: "Wandering Trader" });
  }
  UI.dirty();
}
function marketTick(dt){
  // NPC offers cycle
  if(!G._mkT) G._mkT = 60;
  G._mkT -= dt;
  if(G._mkT <= 0){ G._mkT = 90; refreshOffers(); }
  // player listings may sell to simulated buyers
  for(const L of [...G.market.listings]){
    L.t += dt;
    const val = itemValue(L.item);
    if(L.t > 25 && L.price <= val*1.4 && Math.random() < dt*0.25){
      const gain = Math.round(L.price * (1 - CONFIG.prices.marketFeePct));
      G.gold += gain;
      G.market.listings = G.market.listings.filter(x=>x!==L);
      UI.toast(`Marketplace: ${itemLabel(L.item)} sold for ${gain} gold (5% fee).`, "gold");
      UI.dirty();
    }
  }
}
function listItem(u, price){
  const idx = G.inv.findIndex(x=>x && x.uid===u); if(idx<0) return;
  const it = G.inv[idx];
  if(it.stone) return UI.toast("Wings & boss stones cannot be traded.", "bad");
  G.inv[idx] = null;
  G.market.listings.push({ item: it, price, t: 0 });
  UI.toast(`Listed ${itemLabel(it)} for ${price} gold.`, "good");
}
function buyOffer(o){
  if(G.gold < o.price) return UI.toast("Not enough gold.", "bad");
  if(G.inv.every(x=>x)) return UI.toast("Bag full!", "bad");
  G.gold -= o.price;
  G.market.offers = G.market.offers.filter(x=>x!==o);
  addToInv(o.item);
  UI.toast(`Bought ${itemLabel(o.item)}.`, "good");
}
function cancelListing(L){
  if(!addToInv(L.item)) return;
  G.market.listings = G.market.listings.filter(x=>x!==L);
}

/* ---------------- shop ---------------- */
function shopBuy(entry){
  const gp = entry.priceG || 0, gm = entry.priceM || 0;
  if(G.gold < gp) return UI.toast("Not enough gold.", "bad");
  if(G.gems < gm) return UI.toast("Not enough gems — earn gems in quests, bosses & dungeons!", "bad");
  G.gold -= gp; G.gems -= gm;
  const t = entry.type;
  if(t === "mount" && !G.mounts.includes(entry.id)){ G.mounts.push(entry.id); UI.toast(`Mount: ${Data.MOUNTS[entry.id].name} unlocked!`, "gold"); }
  if(t === "pet" && !G.pets.includes(entry.id)){ G.pets.push(entry.id); UI.toast(`Pet: ${Data.PETS[entry.id].name} tamed!`, "gold"); }
  if(t === "wings" && !G.wingsOwned.includes(entry.id)){ G.wingsOwned.push(entry.id); UI.toast(`Wings: ${Data.WINGS[entry.id].name} unlocked!`, "gold"); }
  if(t === "wfx" && !G.wfx.includes(entry.id)){ G.wfx.push(entry.id); UI.toast(`Weapon FX: ${Data.WFX[entry.id].name}!`, "gold"); }
  if(t === "costume" && !G.costumes.includes(entry.id)){ G.costumes.push(entry.id); UI.toast(`Costume: ${entry.name}!`, "gold"); }
  if(t === "hairstyle" && !G.hairOwned.includes(entry.i)){ G.hairOwned.push(entry.i); }
  if(t === "prem"){ G.premUntil = Date.now() + 30*86400000; G.stashRows += 2; UI.toast("Premium active for 30 days (simulated): +50% XP & Gold.", "gold"); }
  Net.publish("shop.buy", { id:entry.id });
  UI.dirty();
}

/* ---------------- potions/purchases via merchant ---------------- */
function merchantBuy(id){
  const u = Data.USES[id];
  const price = typeof u.price === "function" ? u.price() : u.price;
  if(G.gold < price) return UI.toast("Not enough gold.", "bad");
  G.gold -= price; addToInv({ stack:id, n:1 });
  UI.dirty();
}
function sellItem(u, priceOverride){
  const idx = G.inv.findIndex(x=>x && x.uid===u);
  const it = idx>=0 ? G.inv[idx] : null;
  if(it){ G.inv[idx] = null; }
  else return;
  const val = priceOverride ?? itemValue(it);
  G.gold += Math.round(val * 0.6); // merchant pays 60%
  UI.toast(`Sold ${itemLabel(it)} for ${Math.round(val*0.6)} gold.`, "good");
  UI.dirty();
}
function sellStack(id, n){
  const m = Data.MATS[id];
  let total = 0;
  for(let i=0;i<G.inv.length && n>0;i++){
    const it = G.inv[i];
    if(it && it.stack === id){ const take = Math.min(n, it.n); total += m.price*take*0.8; it.n -= take; n -= take; if(it.n<=0) G.inv[i]=null; }
  }
  if(total > 0){ G.gold += Math.round(total); UI.toast(`Sold materials for ${Math.round(total)} gold.`, "good"); }
  UI.dirty();
}

/* ---------------- storage ---------------- */
function stashSlots(){ return G.stashRows * 12 > G.stash.length ? G.stash.length : G.stashRows*12; }
function stashMove(uid, toStash){
  const arr = toStash ? G.stash : G.inv;
  const src = toStash ? G.inv : G.stash;
  const i = src.findIndex(x=>x && x.uid===uid);
  if(i<0) return;
  const openIdx = arr.findIndex(x=>!x);
  if(openIdx < 0) return UI.toast(toStash?"Storage full!":"Bag full!");
  arr[openIdx] = src[i]; src[i] = null; UI.dirty();
}
function stashMoveStack(id, n, toStash){
  const src = toStash ? G.inv : G.stash;
  const arr = toStash ? G.stash : G.inv;
  const has = src.reduce((a,x)=>a+(x&&x.stack===id?Math.min(x.n,n):0),0);
  if(has <= 0) return;
  const openIdx = arr.findIndex(x=>!x);
  if(openIdx<0) return UI.toast(toStash?"Storage full!":"Bag full!");
  let moved = 0;
  for(let i=0;i<src.length && moved<has;i++){
    const it = src[i];
    if(it && it.stack===id){ const take = Math.min(n - moved, it.n); it.n -= take; moved += take; if(it.n<=0) src[i]=null; }
  }
  const ex = arr.find(x=>x && x.stack===id);
  if(ex) ex.n += moved; else arr[openIdx] = { stack:id, n: moved };
  UI.dirty();
}

/* ---------------- premium expiry nuance ---------------- */
function trimPrem(){ if(G.premUntil && G.premUntil < Date.now()) G.premUntil = 0; }

/* ---------------- save / load ---------------- */
const Save = {
  KEY: "aetheria_save_v1",
  save(){
    try{
      localStorage.setItem(this.KEY, JSON.stringify(G));
      return true;
    }catch(e){ console.warn("save fail", e); return false; }
  },
  load(){
    try{
      const raw = localStorage.getItem(this.KEY);
      if(!raw) return null;
      const g = JSON.parse(raw);
      if(!g || g.v !== 1) return null;
      UID = 100000; UID = Math.max(100000, ...g.inv.filter(Boolean).map(x=>x.uid||0)) + 1;
      return g;
    }catch(e){ return null; }
  },
  clear(){ localStorage.removeItem(this.KEY); },
};

/* helper used by UI dirty */
let dirtyCount = 0;
function requestDirty(){ UI.dirty(); }
