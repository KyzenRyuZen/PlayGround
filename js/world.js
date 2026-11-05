/* ============ AETHERIA — world generation (regions, towns, dungeons) ============ */
"use strict";
const World = (() => {
  const maps = {};
  const GRASSISH = ["grass","swamp","iron"]; // deco sets by theme below
  const DECO_SET = {
    grass:   [["tree",.05],["bush",.02],["rock",.012],["pine",.02]],
    iron:    [["rock",.06],["tree",.02],["ore",.008],["deadtree",.015]],
    swamp:   [["tree",.055],["bush",.03],["deadtree",.02]],
    mist:    [["deadtree",.05],["rock",.03],["flame",.008]],
    snow:    [["pine",.05],["rock",.025]],
    desert:  [["cactus",.03],["rock",.03],["crystal",.006]],
    ash:     [["deadtree",.04],["rock",.05],["flame",.02]],
    tower:   [["pillar",.035],["crystal",.02],["flame",.015]],
    cave:    [["rock",.10],["ore",.03],["crystal",.02]],
    lava:    [["rock",.10],["flame",.05],["crystal",.02]],
    sandcave:[["rock",.10],["crystal",.02]],
    icecave: [["crystal",.05],["rock",.05]],
    mistcave:[["rock",.09],["flame",.02],["deadtree",.02]],
    swampcave:[["rock",.08],["bush",.03],["deadtree",.03]],
    towerfloor:[["pillar",.06],["crystal",.03],["flame",.02]],
  };

  const NPC_LOOKS = {
    elder:      { cls:"mage", gender:"male", hs:3, hc:3, ec:0, outfit:0 },
    captain:    { cls:"warrior", gender:"male", hs:0, hc:1, ec:0, outfit:2 },
    blacksmith: { cls:"warrior", gender:"male", hs:4, hc:1, ec:5, outfit:1 },
    merchant:   { cls:"mage", gender:"female", hs:2, hc:2, ec:3, outfit:1 },
    storage:    { cls:"warrior", gender:"female", hs:1, hc:3, ec:2, outfit:1 },
    teleporter: { cls:"mage", gender:"female", hs:3, hc:6, ec:6, outfit:2 },
  };

  function blank(W, H, theme){
    const rng = Data.rngOf("g_" + theme + W + H);
    const tiles = new Uint8Array(W*H), blocked = new Uint8Array(W*H);
    for(let i=0;i<W*H;i++) tiles[i] = rng() < .75 ? 0 : (1 + Math.floor(rng()*5));
    return { W, H, tiles, blocked, deco:[], npcs:[], houses:[], zones:[], nodes:[], grindMid: null };
  }
  function setBlk(m, x, y, v){ if(x>=0&&y>=0&&x<m.W&&y<m.H) m.blocked[y*m.W+x] = v; }
  function inTown(m, x, y){ const t = m.townRect; return t && x>=t.x && x<t.x+t.w && y>=t.y && y<t.y+t.h; }

  function addDeco(m, x, y, kind){
    m.deco.push({ x, y, kind });
    if(kind !== "bush" && kind !== "ore" && kind !== "flame") setBlk(m, x, y, 2);
  }

  function placeTown(m, town, region){
    const cx = Math.floor(m.W/2), cy = Math.floor(m.H/2) + 2;
    const w = 17, h = 13;
    const x0 = cx - Math.floor(w/2), y0 = cy - Math.floor(h/2);
    m.townRect = { x:x0, y:y0, w, h, cx, cy };
    // plaza roads
    for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++){ m.tiles[y*m.W+x] = 6; setBlk(m, x, y, 0); }
    // roads out of town
    for(let x=1;x<m.W-1;x++){ m.tiles[cy*m.W+x] = 6; setBlk(m, x, cy, 0); }
    for(let y=1;y<m.H-1;y++){ m.tiles[y*m.W+cx] = 6; setBlk(m, cx, y, 0); }
    // houses along top
    const hs = ["bs","bs","shop","storage","tele"];
    const kinds = deckFor(town.npcs);
    let hx = x0 + 1;
    const houseX = {};
    kinds.forEach((k, i)=>{
      m.houses.push({ x: hx, y: y0-3, kind: k.kind, npc: k.npc });
      houseX[k.npc] = hx;
      hx += 3;
    });
    m.houseX = houseX;
    // NPC entities right below their house
    m.npcs = town.npcs.map(ty => {
      const dx = houseX[ty] ?? (x0 + 8);
      return { id: town.id + "_" + ty, type: ty, name: Data.NPCTITLES[ty], x: dx + 1.2, y: y0 + 2.4, look: NPC_LOOKS[ty], town: town };
    });
    if(town.npcs.includes("teleporter")){
      m.deco.push({ x: cx, y: y0 + 4.6, kind: "flag" });
      m.deco.push({ x: cx - 5, y: y0 + 4.6, kind: "flag" });
    }
  }
  // map NPC type -> house kind
  function deckFor(npcs){
    const map = { blacksmith:"forge", merchant:"shop", storage:"storage", elder:"bs", captain:"bs", teleporter:"tele" };
    return npcs.map(n => ({ npc:n, kind: map[n] || "bs" }));
  }

  function genRegion(region){
    const W = region.dungeonRegion ? 44 : 78, H = region.dungeonRegion ? 44 : 58;
    const m = blank(W, H, region.theme);
    m.id = region.id; m.name = region.name; m.region = region; m.isDungeon = !!region.dungeonRegion;
    m.theme = region.theme;
    const rng = Data.rngOf("r_" + region.id);
    const set = DECO_SET[region.theme] || DECO_SET.grass;

    if(region.town) placeTown(m, region.town, region);

    // scatter decorations
    for(let y=2;y<H-2;y++) for(let x=2;x<W-2;x++){
      if(inTown(m, x, y) || m.blocked[y*m.W+x]===2 || m.tiles[y*m.W+x]===6) continue;
      for(const [kind, p] of set){
        if(rng() < p){ addDeco(m, x, y, kind); break; }
      }
    }
    // border wall
    for(let x=0;x<W;x++){ addBorderDeco(m, rng, set, x, 0); addBorderDeco(m, rng, set, x, H-1); }
    for(let y=0;y<H;y++){ addBorderDeco(m, rng, set, 0, y); addBorderDeco(m, rng, set, W-1, y); }

    // keep roads clear
    for(let i=0;i<m.deco.length;i++){
      const d = m.deco[i];
      if((Math.abs(d.y - m.townRect?.cy) < 1) || (m.townRect && Math.abs(d.x - m.townRect.cx) < 1 && d.kind!=="flag")){
        if(d.kind !== "flag") { d.__drop = true; setBlk(m, d.x, d.y, 0); }
      }
    }
    m.deco = m.deco.filter(d=>!d.__drop);

    // resource nodes
    const nodeKinds = { grass:["herb","wood"], iron:["ore","wood"], swamp:["herb","wood"], mist:["herb","ore"],
      snow:["wood","herb"], desert:["herb","ore"], ash:["ore","herb"], tower:["ore","herb"] }[region.theme] || ["herb","ore"];
    for(let i=0;i<16;i++){
      let x, y, tries = 0;
      do { x = 3 + Math.floor(rng()*(W-6)); y = 3 + Math.floor(rng()*(H-6)); tries++; }
      while((inTown(m,x,y) || m.blocked[y*m.W+x]) && tries < 40);
      if(tries >= 40) continue;
      for(const [k,p] of set) if(m.blocked[y*m.W+x]===2){ setBlk(m,x,y,0); m.deco = m.deco.filter(d=>!(d.x===x&&d.y===y)); }
      m.nodes.push({ x, y, kind: nodeKinds[i%nodeKinds.length], cd: 0 });
    }
    // spawn zones
    const zones = [];
    const NX = 3, NY = 3;
    for(let zy=0;zy<NY;zy++) for(let zx=0;zx<NX;zx++){
      if(region.town && zx===1 && zy===1) continue; // town center safe
      const zx0 = Math.floor(zx*W/NX)+2, zy0 = Math.floor(zy*H/NY)+2;
      zones.push({ x:zx0, y:zy0, w:Math.floor(W/NX)-4, h:Math.floor(H/NY)-4,
        mob: region.mobs[(zx+zy*NX) % region.mobs.length], max: 6, cur: 0 });
    }
    m.zones = zones.filter(z=>z.w>2 && z.h>2);
    // world boss location (below town, left side)
    if(region.boss){
      m.bossSpawn = { x: 6, y: H-8 };
      for(let dy=-1;dy<=1;dy++) for(let dx=-2;dx<=2;dx++) setBlk(m, m.bossSpawn.x+dx, m.bossSpawn.y+dy, 0);
      m.deco = m.deco.filter(d=>!(Math.abs(d.y-m.bossSpawn.y)<2 && Math.abs(d.x-m.bossSpawn.x)<3) || d.kind==="flame");
    }
    // dungeon portal near town / center
    if(!region.dungeonRegion)
      m.portal = { x: m.townRect.cx+7, y: m.townRect.cy+7, dungeonOf: region.id, entrance:true };
    else {
      // tower region: entry stone (exit only after final warden dies)
      m.portal = { x: Math.floor(W/2), y: H-6, towerRoot:true };
      m.bossSpawn = { x: Math.floor(W/2), y: 7 };
      m.needsBossKill = true; // portal out opens after warden dies
    }
    // player spawn
    m.spawn = { x: m.townRect.cx + 0.5, y: m.townRect.cy + 4.5 };
    // clear spawn area
    for(let dy=-1;dy<=1;dy++) for(let dx=-2;dx<=2;dx++) setBlk(m, Math.floor(m.spawn.x)+dx, Math.floor(m.spawn.y)+dy, 0);
    return m;
  }

  function addBorderDeco(m, rng, set, x, y){
    const kind = set[0][0] === "rock" ? "rock" : "rock";
    addDeco(m, x, y, kind);
  }

  function genDungeon(dg){
    const W = 34, H = 34;
    const m = blank(W, H, dg.theme);
    m.id = dg.id; m.name = dg.name; m.dungeon = dg; m.isDungeon = true; m.theme = dg.theme;
    const rng = Data.rngOf("d_" + dg.id);
    const set = DECO_SET[dg.theme] || DECO_SET.cave;
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){
      const edge = x<2||y<2||x>=W-2||y>=H-2;
      if(edge || (x>W-9 && y>H-9)){ addDeco(m, x, y, "rock"); continue; }
      for(const [kind, p] of set) if(rng()<p){ addDeco(m, x, y, kind); break; }
    }
    // entry at bottom-left
    m.spawn = { x: 4.5, y: H-4.5 };
    for(let dy=-2;dy<=2;dy++) for(let dx=-3;dx<=5;dx++) if(m.blocked[(H-4+dy)*W+(4+dx)]) setBlk(m, 4+dx, H-4+dy, 0);
    m.deco = m.deco.filter(d=> !(Math.abs(d.y-(H-4.5))<3 && d.x < 12) || d.kind==="rock" && (d.x<1||d.y<1||d.x>=W-1||d.y>=H-1));
    // boss lair top-right
    m.bossSpawn = { x: W-5, y: 5 };
    for(let dy=-2;dy<=2;dy++) for(let dx=-3;dx<=3;dx++) if(m.blocked[(5+dy)*W+(W-5+dx)]) setBlk(m, W-5+dx, 5+dy, 0);
    m.deco = m.deco.filter(d=>!(Math.abs(d.x-(W-5))<4 && Math.abs(d.y-5)<3));
    // exit portal next to entry
    m.portal = { x: 8.5, y: H-4.5, exitTo: dg.region, dungeonId: dg.id };
    // zones
    const zones = [];
    const spots = [[8,6],[16,25],[22,10],[6,18],[15,14],[24,22]];
    spots.forEach((s, i)=> zones.push({ x:s[0], y:s[1], w:6, h:6, mob: dg.mobs[i % dg.mobs.length], max: 4, cur: 0 }));
    m.zones = zones;
    // a couple of nodes
    m.nodes = [{ x: 14, y: 7, kind: "ore", cd: 0 }, { x: 20, y: 26, kind: "herb", cd: 0 }];
    // winding corridor carve: simple L path
    for(let x=4;x<W-4;x++) for(let dy=-1;dy<=1;dy++){ const y = 16+dy; if(m.blocked[y*W+x]===2){ setBlk(m,x,y,0); m.deco = m.deco.filter(d=>!(d.x===x&&Math.abs(d.y-y)<1)); } }
    for(let y=5;y<H-4;y++) for(let dx=-1;dx<=1;dx++){ const x = W-8+dx; if(m.blocked[y*W+x]===2){ setBlk(m,x,y,0); m.deco = m.deco.filter(d=>!(d.y===y&&Math.abs(d.x-x)<1)); } }
    m.needsBossKill = true;
    return m;
  }

  function ensure(id){
    if(maps[id]) return maps[id];
    let m;
    if(Data.DG_BY_ID[id]) m = genDungeon(Data.DG_BY_ID[id]);
    else m = genRegion(Data.REGION_BY_ID[id]);
    maps[id] = m; return m;
  }
  function blockedAt(m, x, y){
    const tx = Math.floor(x), ty = Math.floor(y);
    if(tx<0||ty<0||tx>=m.W||ty>=m.H) return true;
    return !!m.blocked[ty*m.W+tx];
  }
  const inMap = (m, x, y) => x>=0 && y>=0 && x<m.W && y<m.H;
  return { ensure, blockedAt, inMap, NPC_LOOKS, _maps: maps };
})();
