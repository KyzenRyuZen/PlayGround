/* ============ AETHERIA — game data ============ */
"use strict";
var TW = CONFIG.TW, TH = CONFIG.TH;

const Data = (() => {
  /* ---------------- utility: seeded RNG ---------------- */
  function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function strSeed(s){let h=1779033703;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}return h>>>0}
  const rngOf = seed => mulberry32(strSeed(seed));
  const pick = (r, arr) => arr[Math.floor(r()*arr.length)];
  const ri = (r, a, b) => a + Math.floor(r()*(b-a+1));

  /* ---------------- rarity chain ---------------- */
  const RAR_ORDER = ["common","grey","green","blue","purple","legendary","mythic","divine"];
  const nextRar = q => { const i = RAR_ORDER.indexOf(q); return i >= RAR_ORDER.length-1 ? null : RAR_ORDER[i+1]; };

  /* ---------------- classes ---------------- */
  const CLASSES = {
    warrior: { id:"warrior", name:"Warrior", shortName:"Warrior",
      desc:"A strong melee fighter with heavy armor and sweeping steel.",
      weapon:"Great Sword", offhand:"War Shield",
      base:{ hp:260, mp:70, atk:15, def:11, crit:.05, spd:3.1, atkRange:1.1, atkCd:.85 },
      skill:{ name:"Whirlwind Slash", desc:"Spin in a wide arc, hitting all enemies around you.",
        mult:2.6, perLv:.22, mp:22, cd:6, kind:"aoeSelf", radius:2.3, fx:"slash" } },
    mage: { id:"mage", name:"Mage", shortName:"Mage",
      desc:"A powerful spellcaster firing arcane bolts and raining fire.",
      weapon:"Rune Staff", offhand:"Grimoire",
      base:{ hp:170, mp:150, atk:18, def:6, crit:.07, spd:3.1, atkRange:5.5, atkCd:.95 },
      skill:{ name:"Meteor Fall", desc:"Call a meteor on the nearest enemy group.",
        mult:3.2, perLv:.28, mp:38, cd:7, kind:"aoeBolt", radius:2.4, fx:"meteor" } },
    assassin: { id:"assassin", name:"Assassin", shortName:"Assassin",
      desc:"A blade in the dark — fast strikes and deadly critical hits.",
      weapon:"Fang Daggers", offhand:"Poison Vial",
      base:{ hp:200, mp:95, atk:13, def:7, crit:.18, spd:3.6, atkRange:0.95, atkCd:.55 },
      skill:{ name:"Shadow Flurry", desc:"Vanish and strike the nearest foe 5 times, each can crit.",
        mult:.9, hits:5, perLv:.12, mp:28, cd:5, kind:"flurry", fx:"shadow" } },
  };

  /* ---------------- factions ---------------- */
  const FACTIONS = {
    angel: { id:"angel", name:"Angels", tag:"Celestial host of the Dawn.", bonus:"Fallen-sky blessing: +8% DEF, and radiant wings.",
      defx:1.08, wingDefault:"wng_angel", col:"#e8f4ff" },
    demon: { id:"demon", name:"Demons", tag:"Devil-blooded legions of the Ash.", bonus:"Ashen fury: +8% ATK and leathern wings.",
      atkx:1.08, wingDefault:"wng_demon", col:"#ffd6e0" },
  };

  /* ---------------- appearance ---------------- */
  const HAIRSTYLES = ["Short","Bob","Long","Ponytail","Mohawk"];
  const HAIRCOLORS = [
    {id:0,name:"Soot Black", c:"#2a2630"},{id:1,name:"Chestnut", c:"#6b4226"},
    {id:2,name:"Golden", c:"#d8a833"},{id:3,name:"Silver", c:"#c9ccd6"},
    {id:4,name:"Crimson", c:"#a83030"},{id:5,name:"Forest Green", c:"#3f7a4f"},
    {id:6,name:"Sky Blue", c:"#4f86c8"},{id:7,name:"Snow White", c:"#e8e8f0"}];
  const EYECOLORS = [
    {id:0,name:"Brown", c:"#7a4a26"},{id:1,name:"Hazel", c:"#b8862a"},
    {id:2,name:"Green", c:"#3fa860"},{id:3,name:"Blue", c:"#4a86d8"},
    {id:4,name:"Violet", c:"#9a5ad0"},{id:5,name:"Crimson", c:"#d04a4a"},
    {id:6,name:"Gold", c:"#d8a833"},{id:7,name:"Grey", c:"#9aa0aa"}];
  // outfit palettes per class: 3 starting outfits
  const OUTFITS = {
    warrior:[ {name:"Recruit Kit",  a:"#8a3030", b:"#5a5f6e"},   // red tunic + steel
              {name:"Traveler Kit", a:"#3f6e3f", b:"#6e5a3f"},   // green + leather
              {name:"Guard Kit",    a:"#2f4a7a", b:"#8a8fa0"} ],
    mage:   [ {name:"Apprentice Robe", a:"#2f3f7a", b:"#c8b04f"},
              {name:"Wanderer Robe",   a:"#3f7a5f", b:"#d0784f"},
              {name:"Starweave Robe",  a:"#5a3f7a", b:"#6fc8d8"} ],
    assassin:[ {name:"Scout Wraps",    a:"#3a3f4a", b:"#7a6a4a"},
               {name:"Nightcloaks",    a:"#1f2230", b:"#5a2f3f"},
               {name:"Swampweave",     a:"#2f4a3a", b:"#6a7a4a"} ],
  };
  const COSTUMES = [ {id:"cust_sun", name:"Summer Breeze", unlock:"shop", pal:{a:"#e8a86a", b:"#f8e8c8"} },
                     {id:"cust_noble", name:"Noble Regalia", unlock:"shop", pal:{a:"#7a2f5a", b:"#ffd75a"} },
                     {id:"cust_void", name:"Void-touched", unlock:"shop", pal:{a:"#1a1428", b:"#7a4fc8"} } ];

  /* ---------------- world maps ---------------- */
  const SLOTS = ["head","chest","legs","boots","gloves","weapon","offhand","amulet","ring"];
  const SLOTNAME = { head:"Headgear", chest:"Chest", legs:"Legs", boots:"Boots", gloves:"Gloves",
                     weapon:"Weapon", offhand:"Off-hand", amulet:"Amulet", ring:"Ring" };
  const ILVLS = [1,10,20,30,40,50,60,70];
  const IPRE = ["Worn","Trainee's","Iron","Steel","Silver","Mithril","Draconic","Eternal"];

  const WEAPONS = { warrior:"Great Sword", mage:"Rune Staff", assassin:"Fang Daggers" };
  const OFFHANDS = { warrior:"War Shield", mage:"Grimoire", assassin:"Poison Vial" };
  const ARMOR = {
    warrior:{ head:"Helm", chest:"Cuirass", legs:"Greaves", boots:"Sabatons", gloves:"Gauntlets" },
    mage:   { head:"Circlet", chest:"Robe", legs:"Silk Wrap", boots:"Slippers", gloves:"Sleeves" },
    assassin:{ head:"Hood", chest:"Vest", legs:"Legwraps", boots:"Striders", gloves:"Bracers" } };

  const ITEMS = {};
  function addTpl(t){ ITEMS[t.id] = t; }
  function statsFor(slot, cls, ilvl){
    switch(slot){
      case "weapon": return { atk: +(7 + ilvl*2.5).toFixed(1), crit: cls==="assassin"? 4 : 2 };
      case "offhand":{ const s = { def: +(2 + ilvl*0.9).toFixed(1) };
        if(cls==="mage") s.mp = +(10 + ilvl*1.1).toFixed(1);
        if(cls==="assassin") s.atk = +(2 + ilvl*0.5).toFixed(1);
        return s; }
      case "head":  return { def: +(2 + ilvl*0.8).toFixed(1), mp: cls==="mage"?+(6+ilvl*0.5).toFixed(1):0 };
      case "chest": return { def: +(3 + ilvl*1.1).toFixed(1), hp: +(18 + ilvl*3.2).toFixed(1) };
      case "legs":  return { def: +(2 + ilvl*0.8).toFixed(1), hp: +(12 + ilvl*2.2).toFixed(1) };
      case "boots": return { def: +(2 + ilvl*0.6).toFixed(1), spd: .10 };
      case "gloves":return { atk: +(2 + ilvl*0.7).toFixed(1), def: +(1 + ilvl*0.4).toFixed(1) };
      case "amulet":return {};
      case "ring":  return { crit: +(1 + ilvl*0.06).toFixed(1) };
    }
  }
  for(const cls of ["warrior","mage","assassin"]) for(let i=0;i<ILVLS.length;i++){
    const ilvl=ILVLS[i], pre=IPRE[i];
    for(const slot of SLOTS){
      let name;
      if(slot==="weapon") name = pre+" "+WEAPONS[cls];
      else if(slot==="offhand") name = pre+" "+OFFHANDS[cls];
      else name = pre+" "+ARMOR[cls][slot];
      addTpl({ id:`${slot}_${cls}_${ilvl}`, slot, cls, ilvl, name, stats: statsFor(slot,cls,ilvl) });
    }
  }

  /* boos stones (amulet-slot accessories, up to 3 bonuses) */
  const STONES = {
    stone_gorga:   {name:"Gorga's Breaker Stone",   boss:"b_gorga",  ilvl:20},
    stone_vex:     {name:"Vex's Silk Stone",        boss:"b_vex",    ilvl:30},
    stone_grave:   {name:"Grave Warden Stone",      boss:"b_grave",  ilvl:40},
    stone_rime:    {name:"Rimeborn Stone",          boss:"b_rime",   ilvl:50},
    stone_neskar:  {name:"Neskar's Sun Stone",      boss:"b_neskar", ilvl:60},
    stone_vharok:  {name:"Vharok's Coal Stone",     boss:"b_vharok", ilvl:70},
    stone_gate:    {name:"Gate Sentinel Stone",     boss:"b_gate",   ilvl:70},
    stone_warden:  {name:"Eternal Warden Stone",    boss:"b_warden", ilvl:70},
  };
  for(const id in STONES){ const s=STONES[id]; addTpl({ id, slot:"amulet", cls:"any", ilvl:s.ilvl, name:s.name, stone:true, stats:{ hp:+(20+s.ilvl*1.5).toFixed(1) } }); }

  /* ---------------- materials & usable ---------------- */
  const MATS = {
    herb:{name:"Wild Herb", price:6}, wood:{name:"Oak Wood", price:6}, ore:{name:"Iron Ore", price:8},
    slimeGel:{name:"Slime Gel", price:4}, boarTusk:{name:"Boar Tusk", price:6}, wolfPelt:{name:"Grey Pelt", price:7},
    ironScrap:{name:"Iron Scrap", price:9}, spiderSilk:{name:"Spider Silk", price:11}, venomFang:{name:"Venom Fang", price:12},
    ghostWisp:{name:"Ghost Wisps", price:14}, frostHide:{name:"Frost Hide", price:16}, duneAmber:{name:"Dune Amber", price:18},
    emberCore:{name:"Ember Core", price:22}, voidShard:{name:"Void Shard", price:30},
    sigil:{name:"Legend Sigil", price:1000, boss:true},   // from dungeon bosses, for legendary crafts
  };
  const USES = {
    hp1:{name:"Healing Potion", kind:"use", heal:150, price:CONFIG.prices.potionHP, col:"#ff5a5a"},
    hp2:{name:"Greater Healing Potion", kind:"use", heal:420, price:CONFIG.prices.potionHPBig, col:"#ff2a6a"},
    mp1:{name:"Mana Potion", kind:"use", mana:90, price:CONFIG.prices.potionMP, col:"#5aa0ff"},
  };

  /* ---------------- cosmetics: wings / mounts / pets / fx ---------------- */
  const WINGS = {
    wng_angel:  {name:"Celestial Wings", how:"Quest: 'Trials of the Sky' or Shop", col:"#eef4ff", col2:"#9fc0e8"},
    wng_demon:  {name:"Demonic Wings", how:"Quest: 'Rite of Flame' or Shop", col:"#3a1f2f", col2:"#c04848"},
    wng_seraph: {name:"Seraph's Flame", how:"Premium shop", col:"#ffd75a", col2:"#ff8a3a", big:true},
    wng_void:   {name:"Voidtorn Wings", how:"Premium shop", col:"#241a3f", col2:"#8a5aff", big:true},
  };
  // wings are only obtainable via quests or shop: never dropped, never tradable/fusable
  const MOUNTS = {
    mnt_horse:{name:"Dawn Steed",     spd:1.18, priceG:2500, col:"#8a6a4a"},
    mnt_wolf: {name:"Shadowpelt",     spd:1.24, priceG:6000, col:"#3a3a4a"},
    mnt_drake:{name:"Ashwing Drake",  spd:1.32, priceG:300, priceM:300, col:"#7a2f2f"},
  };
  const PETS = {
    pet_fox:  {name:"Ember Fox",  bonus:"Pickup radius +1, +5% gold from kills", priceG:1500, gold:0.05, col:"#e08a3a"},
    pet_owl:  {name:"Moon Owl",   bonus:"Pickup radius +1, +5% XP from kills",   priceG:1500, xp:0.05, col:"#b8c8e8"},
    pet_slime:{name:"Royal Slime",bonus:"Big pickup radius, gathers loot instantly", priceM:200, col:"#6fd86f", big:true},
  };
  const WFX = { wfx_flame:{name:"Flame Trail", col:"#ff7a2a", priceM:150},
                wfx_frost:{name:"Frostburst", col:"#6fd8ff", priceM:150},
                wfx_shadow:{name:"Nightcutter", col:"#8a5aff", priceM:150} };

  /* ---------------- monsters ---------------- */
  // kind = sprite family; monsters scale with region level
  const MONS = {
    slime:   {name:"Slime",         kind:"slime",   hp:45, atk:7,  def:2,  xp:24, gold:6,  spd:1.0, aggro:3.2, r:.55, mat:"slimeGel",   melee:1},
    boar:    {name:"Wild Boar",     kind:"boar",    hp:65, atk:9,  def:3,  xp:30, gold:8,  spd:1.9, aggro:3.6, r:.6,  mat:"boarTusk",   melee:1, dash:1},
    wolf:    {name:"Grey Wolf",     kind:"wolf",    hp:60, atk:10, def:2,  xp:32, gold:9,  spd:2.4, aggro:4.4, r:.55, mat:"wolfPelt",   melee:1},
    bandit:  {name:"Crag Bandit",   kind:"bandit",  hp:90, atk:14, def:5,  xp:48, gold:16, spd:2.2, aggro:4.2, r:.55, mat:"ironScrap",  melee:1},
    golem:   {name:"Forge Golem",   kind:"golem",   hp:150,atk:13, def:9,  xp:55, gold:14, spd:1.1, aggro:3.0, r:.75, mat:"ironScrap",  melee:1},
    spider:  {name:"Venomwood Spider",kind:"spider",hp:85, atk:15, def:4,  xp:52, gold:15, spd:2.3, aggro:4.4, r:.6,  mat:"spiderSilk", melee:1, dash:1},
    serpent: {name:"Jade Serpent",  kind:"serpent", hp:80, atk:14, def:3,  xp:50, gold:14, spd:1.8, aggro:4.0, r:.5,  mat:"venomFang",  melee:1},
    ghoul:   {name:"Grave Ghoul",   kind:"ghoul",   hp:105,atk:18, def:6,  xp:70, gold:20, spd:1.7, aggro:4.2, r:.55, mat:"ghostWisp",  melee:1},
    wraith:  {name:"Mist Wraith",   kind:"wraith",  hp:95, atk:21, def:4,  xp:76, gold:22, spd:1.6, aggro:4.6, r:.55, mat:"ghostWisp",  melee:0, ranged:1},
    yeti:    {name:"Frostpeak Yeti",kind:"yeti",    hp:160,atk:24, def:9,  xp:95, gold:28, spd:1.5, aggro:3.6, r:.75, mat:"frostHide",  melee:1, dash:1},
    frostwolf:{name:"Frost Wolf",   kind:"wolf",    hp:120,atk:22, def:6,  xp:88, gold:24, spd:2.5, aggro:4.4, r:.55, mat:"frostHide",  melee:1, pal:1},
    scorpion:{name:"Sun Scorpion",  kind:"scorpion",hp:130,atk:26, def:8,  xp:100,gold:30, spd:2.0, aggro:4.0, r:.65, mat:"duneAmber",  melee:1},
    imp:     {name:"Ash Imp",       kind:"imp",     hp:140,atk:30, def:8,  xp:120,gold:36, spd:2.2, aggro:4.4, r:.55, mat:"emberCore",  melee:1},
    ashen_golem:{name:"Cinder Golem",kind:"golem",   hp:220,atk:32, def:14, xp:150,gold:44, spd:1.2, aggro:3.4, r:.8,  mat:"emberCore",  melee:1, pal:1},
    sentinel:{name:"Tower Sentinel",kind:"sentinel",hp:260,atk:38, def:16, xp:200,gold:60, spd:1.3, aggro:4.2, r:.7,  mat:"voidShard",  melee:0, ranged:1},
    dragonet:{name:"Void Dragonet", kind:"dragonet",hp:230,atk:42, def:12, xp:210,gold:64, spd:2.4, aggro:4.6, r:.65, mat:"voidShard",  melee:1, ranged:1},
  };
  // world (overworld) bosses — kind + scale info, per region
  const BOSSES = {
    b_slimeking:{name:"Gloop, Slime King",   mob:"slime",   hp:600, atk:16,def:6, xp:400, gold:150, scale:2.1, region:"greendale", lv:6},
    b_gorga:    {name:"Gorga the Breaker",   mob:"bandit",  hp:1400,atk:30,def:12,xp:900, gold:320, scale:2.3, region:"ironcrag", lv:16},
    b_arachnia: {name:"Arachnia, Widow-Mother",mob:"spider",hp:2600,atk:44,def:14,xp:1500,gold:520, scale:2.4, region:"venomwood",lv:26},
    b_dreadseer:{name:"The Dread Seer",      mob:"wraith",  hp:3800,atk:58,def:16,xp:2200,gold:720, scale:2.3, region:"mistgrave", lv:36, ranged:1},
    b_frosttitan:{name:"Kalrum, Frost Titan",mob:"yeti",    hp:5200,atk:70,def:20,xp:3000,gold:900, scale:2.4, region:"frostpeak", lv:46},
    b_sandraj:  {name:"Scorch Matriarch",    mob:"scorpion",hp:6800,atk:82,def:22,xp:4000,gold:1100,scale:2.3, region:"sunscorch", lv:56},
    b_cinderclaw:{name:"Cinderclaw",         mob:"dragonet",hp:8500,atk:95,def:24,xp:5200,gold:1400,scale:2.2, region:"ashendom",  lv:66},
    b_warden:   {name:"The Eternal Warden",  mob:"sentinel",hp:14000,atk:110,def:28,xp:9000,gold:3000,scale:2.6,region:"tower", lv:70, ranged:1},
  };
  // dungeon bosses
  const DBOSS = {
    b_boneherald:{name:"The Bone Herald",      mob:"ghoul",   hp:1100,atk:26,def:10,xp:850, gold:340, scale:2.2, lv:11},
    b_overseer:  {name:"Forge Overseer",       mob:"golem",   hp:2200,atk:36,def:14,xp:1300,gold:480, scale:2.3, lv:21},
    b_vex:       {name:"Broodmother Vex",      mob:"spider",  hp:3200,atk:50,def:16,xp:1900,gold:640, scale:2.4, lv:31},
    b_grave:     {name:"The Grave Warden",     mob:"ghoul",   hp:4400,atk:62,def:18,xp:2600,gold:820, scale:2.3, lv:41},
    b_rime:      {name:"Rimeborn Colossus",    mob:"yeti",    hp:6000,atk:74,def:22,xp:3400,gold:1000,scale:2.4, lv:51},
    b_neskar:    {name:"Pharaoh Neskar",       mob:"sentinel",hp:7600,atk:86,def:24,xp:4400,gold:1200,scale:2.2, lv:61, ranged:1},
    b_vharok:    {name:"Vharok the Coal Lord", mob:"golem",   hp:9200,atk:98,def:26,xp:5600,gold:1500,scale:2.5, lv:71},
    b_gate:      {name:"Gate Sentinel Prime",  mob:"sentinel",hp:10500,atk:104,def:27,xp:6600,gold:1900,scale:2.3, lv:71, ranged:1},
    b_stormwyrm: {name:"Storm Wyrm Zynth",     mob:"dragonet",hp:11800,atk:108,def:27,xp:7400,gold:2100,scale:2.4, lv:71, ranged:1},
    b_warden2:   {name:"Eternal Warden, Ascendant",mob:"sentinel",hp:15000,atk:118,def:30,xp:11000,gold:4000,scale:2.8, lv:72, ranged:1},
  };

  /* ---------------- regions ---------------- */
  // towns + NPC rosters; mobs list; spawn zones auto-placed in worldgen
  const REGIONS = [
    { id:"greendale", name:"Greendale", lv:[1,10],  theme:"grass",
      mobs:["slime","boar","wolf"], boss:"b_slimeking",
      town:{ id:"dawnshire", name:"Dawnshire", npcs:["elder","blacksmith","merchant","storage","teleporter"] } },
    { id:"ironcrag",  name:"Ironcrag",  lv:[10,20], theme:"iron",
      mobs:["bandit","golem"], boss:"b_gorga",
      town:{ id:"stonewatch", name:"Stonewatch", npcs:["blacksmith","merchant","storage","teleporter","captain"] } },
    { id:"venomwood", name:"Venomwood", lv:[20,30], theme:"swamp",
      mobs:["spider","serpent"], boss:"b_arachnia",
      town:{ id:"gorlok", name:"Venom Outpost", npcs:["blacksmith","merchant","storage","teleporter"] } },
    { id:"mistgrave", name:"Mistgrave", lv:[30,40], theme:"mist",
      mobs:["ghoul","wraith"], boss:"b_dreadseer",
      town:{ id:"grimhollow", name:"Grimhollow", npcs:["blacksmith","merchant","storage","teleporter"] } },
    { id:"frostpeak", name:"Frostpeak", lv:[40,50], theme:"snow",
      mobs:["yeti","frostwolf"], boss:"b_frosttitan",
      town:{ id:"frosthaven", name:"Frosthaven", npcs:["blacksmith","merchant","storage","teleporter"] } },
    { id:"sunscorch", name:"Sunscorch Desert", lv:[50,60], theme:"desert",
      mobs:["scorpion","wraith"], boss:"b_sandraj",
      town:{ id:"sunmarket", name:"Sunmarket", npcs:["blacksmith","merchant","storage","teleporter"] } },
    { id:"ashendom",  name:"Ashen Dominion", lv:[60,70], theme:"ash",
      mobs:["imp","ashen_golem"], boss:"b_cinderclaw",
      town:{ id:"emberhold", name:"Emberhold", npcs:["blacksmith","merchant","storage","teleporter"] } },
    { id:"tower",     name:"Tower of Eternity", lv:[70,72], theme:"tower", dungeonRegion:true,
      mobs:["sentinel","dragonet"], boss:"b_warden" },
  ];
  const REGION_BY_ID = {}; REGIONS.forEach((r,i)=>{ r.idx=i; REGION_BY_ID[r.id]=r; });

  /* ---------------- dungeons ---------------- */
  // one instanced dungeon per region (tower = 3 floors, each its own "dungeon")
  const DUNGEONS = [
    { id:"dg_greendale", name:"Crypt of Echoes",  region:"greendale", lv:8,  theme:"mistcave",   mobs:["ghoul","wolf"],       boss:"b_boneherald" },
    { id:"dg_ironcrag",  name:"Deep Iron Mine",  region:"ironcrag",  lv:18, theme:"cave",       mobs:["golem","bandit"],     boss:"b_overseer" },
    { id:"dg_venomwood", name:"Spider Nest",     region:"venomwood", lv:28, theme:"swampcave",  mobs:["spider","serpent"],   boss:"b_vex" },
    { id:"dg_mistgrave", name:"Forgotten Tomb",  region:"mistgrave", lv:38, theme:"mistcave",   mobs:["ghoul","wraith"],     boss:"b_grave" },
    { id:"dg_frostpeak", name:"Frozen Hollow",   region:"frostpeak", lv:48, theme:"icecave",    mobs:["yeti","frostwolf"],   boss:"b_rime" },
    { id:"dg_sunscorch", name:"Sunken Pyramid",  region:"sunscorch", lv:58, theme:"sandcave",   mobs:["scorpion","sentinel"],boss:"b_neskar" },
    { id:"dg_ashendom",  name:"Obsidian Gate",   region:"ashendom",  lv:68, theme:"lavacave",   mobs:["imp","ashen_golem"],  boss:"b_vharok" },
    { id:"dg_tower1",    name:"Tower — The Gate", region:"tower",    lv:70, theme:"towerfloor", mobs:["sentinel"],           boss:"b_gate" },
    { id:"dg_tower2",    name:"Tower — The Ascent",region:"tower",   lv:71, theme:"towerfloor", mobs:["dragonet"],           boss:"b_stormwyrm" },
    { id:"dg_tower3",    name:"Tower — The Crown", region:"tower",   lv:72, theme:"towerfloor", mobs:["sentinel","dragonet"],boss:"b_warden2" },
  ];
  const DG_BY_ID = {}; DUNGEONS.forEach(d=>DG_BY_ID[d.id]=d);

  /* dungeon rewards: each dungeon boss drops its stone (first-kill guaranteed) + legend sigil + legendary mats */
  function stoneFor(dgId){
    const map = { dg_ironcrag:"stone_gorga", dg_venomwood:"stone_vex", dg_mistgrave:"stone_grave",
      dg_frostpeak:"stone_rime", dg_sunscorch:"stone_neskar", dg_ashendom:"stone_vharok",
      dg_tower1:"stone_gate", dg_tower3:"stone_warden" };
    return map[dgId]||null;
  }

  /* ---------------- quests ---------------- */
  // obj kinds: talk, kill, boss, gather, reach, lv, fuse, craft, dungeon
  const QUESTS = [
    { id:"q1", main:true, name:"A New Beginning", giver:"dawnshire_elder", lv:1,
      objs:[{k:"talk",npc:"dawnshire_elder"}], rw:{gold:100,xp:60}, next:"q2",
      wake:"Welcome to Dawnshire, brave {name}. Greendale's wilds grow restless..." },
    { id:"q2", main:true, name:"Slime Trouble", giver:"dawnshire_elder", lv:1,
      objs:[{k:"kill",m:"slime",n:8}], rw:{gold:120,xp:120,itemGen:{slot:"gloves",ilvl:1,q:"grey"}}, next:"q3" },
    { id:"q3", main:true, name:"Arms of Dawn", giver:"dawnshire_blacksmith", lv:1,
      objs:[{k:"talk",npc:"dawnshire_blacksmith"},{k:"equipWeapon"}],
      rw:{gold:150,xp:140,itemGen:{slot:"weapon",ilvl:1,q:"green"}}, next:"q4" },
    { id:"q4", main:true, name:"Wolves at the Gate", giver:"dawnshire_captain", lv:4,
      objs:[{k:"kill",m:"wolf",n:6},{k:"kill",m:"boar",n:6}], rw:{gold:200,xp:220,items:[{id:"hp1",n:3}]}, next:"q5" },
    { id:"q5", main:true, name:"Gloop, the Slime King", giver:"dawnshire_captain", lv:6,
      objs:[{k:"boss",m:"b_slimeking"}], rw:{gold:300,xp:400,gems:20}, next:"q6" },
    { id:"q6", main:true, name:"Paths of the Teleporter", giver:"dawnshire_teleporter", lv:8,
      objs:[{k:"talk",npc:"dawnshire_teleporter"}], rw:{gold:150,xp:250}, next:"q7",
      wake:"The Waystone is attuned. Ironcrag lies west — see its captain at Stonewatch." },
    { id:"q7", main:true, name:"Stonewatch Stands", giver:"stonewatch_captain", lv:10,
      objs:[{k:"kill",m:"bandit",n:10}], rw:{gold:350,xp:600,items:[{id:"hp2",n:2}]}, next:"q8" },
    { id:"q8", main:true, name:"Deep Iron Mine", giver:"stonewatch_blacksmith", lv:14,
      objs:[{k:"dungeon",id:"dg_ironcrag"}], rw:{gold:500,xp:900,gems:20}, next:"q9" },
    { id:"q9", main:true, name:"Gorga Must Fall", giver:"stonewatch_captain", lv:15,
      objs:[{k:"boss",m:"b_gorga"}], rw:{gold:800,xp:1400,gems:30}, next:"q10" },
    { id:"q10", main:true, name:"Venom in the Wood", giver:"gorlok_captain", lv:20,
      objs:[{k:"kill",m:"spider",n:10},{k:"gather",m:"herb",n:5}], rw:{gold:600,xp:1500,itemGen:{slot:"boots",ilvl:20,q:"blue"}}, next:"q11" },
    { id:"q11", main:true, name:"The Spider Nest", giver:"gorlok_blacksmith", lv:24,
      objs:[{k:"dungeon",id:"dg_venomwood"}], rw:{gold:900,xp:2200,gems:30}, next:"q12" },
    { id:"q12", main:true, name:"Restless Dead", giver:"grimhollow_captain", lv:30,
      objs:[{k:"kill",m:"ghoul",n:12},{k:"kill",m:"wraith",n:6}], rw:{gold:1100,xp:3200,items:[{id:"hp2",n:3}]}, next:"q13" },
    { id:"q13", main:true, name:"The Forgotten Tomb", giver:"grimhollow_blacksmith", lv:34,
      objs:[{k:"dungeon",id:"dg_mistgrave"}], rw:{gold:1400,xp:4200,gems:40}, next:"q14" },
    { id:"q14", main:true, name:"Cold Hunt", giver:"frosthaven_captain", lv:40,
      objs:[{k:"kill",m:"yeti",n:10},{k:"kill",m:"frostwolf",n:8}], rw:{gold:1800,xp:5600}, next:"q15" },
    { id:"q15", main:true, name:"Frozen Hollow", giver:"frosthaven_blacksmith", lv:44,
      objs:[{k:"dungeon",id:"dg_frostpeak"}], rw:{gold:2200,xp:7600,gems:50}, next:"q16" },
    { id:"q16", main:true, name:"Sun and Sand", giver:"sunmarket_captain", lv:50,
      objs:[{k:"kill",m:"scorpion",n:12}], rw:{gold:2600,xp:10000,itemGen:{slot:"ring",ilvl:50,q:"blue"}}, next:"q17" },
    { id:"q17", main:true, name:"The Sunken Pyramid", giver:"sunmarket_blacksmith", lv:54,
      objs:[{k:"dungeon",id:"dg_sunscorch"}], rw:{gold:3200,xp:14000,gems:60}, next:"q18" },
    { id:"q18", main:true, name:"Ash Upon the Wind", giver:"emberhold_captain", lv:60,
      objs:[{k:"kill",m:"imp",n:12},{k:"kill",m:"ashen_golem",n:6}], rw:{gold:4000,xp:18000}, next:"q19" },
    { id:"q19", main:true, name:"The Obsidian Gate", giver:"emberhold_blacksmith", lv:64,
      objs:[{k:"dungeon",id:"dg_ashendom"}], rw:{gold:5000,xp:24000,gems:80}, next:"q20" },
    { id:"q20", main:true, name:"The Tower Calls", giver:"dawnshire_elder", lv:70,
      objs:[{k:"dungeon",id:"dg_tower1"},{k:"dungeon",id:"dg_tower2"},{k:"dungeon",id:"dg_tower3"}],
      rw:{gold:9000,xp:40000,gems:150}, next:"q21" },
    { id:"q21", main:true, name:"The Eternal Crown", giver:"dawnshire_elder", lv:72,
      objs:[{k:"boss",m:"b_warden"}], rw:{gold:15000,xp:60000,gems:300,itemGen:{slot:"amulet",ilvl:70,q:"legendary"}}, next:null },

    // ---- side quests ----
    { id:"s1", name:"Herbs for the Klohe", giver:"dawnshire_merchant", lv:2,
      objs:[{k:"gather",m:"herb",n:6}], rw:{gold:150,xp:150,items:[{id:"mp1",n:3}]}, next:"s2",
      wake:"The apothecary pays for wild herbs. Look for leafy bushes around the village." },
    { id:"s2", name:"Potion Run", giver:"dawnshire_merchant", lv:3,
      objs:[{k:"gather",m:"wood",n:5},{k:"kill",m:"boar",n:6}], rw:{gold:200,xp:200,gems:5}, next:"s3" },
    { id:"s3", name:"Roads of Dawn", giver:"dawnshire_blacksmith", lv:5,
      objs:[{k:"kill",m:"boar",n:10},{k:"kill",m:"wolf",n:10}],
      rw:{gold:300,xp:400,mount:"mnt_horse"}, next:"s4",
      wake:"Great news — the stablemaster left a Dawn Steed for the one who clears the roads!" },
    { id:"s4", name:"Trials of the Sky", giver:"dawnshire_elder", lv:12, faction:"angel",
      objs:[{k:"boss",m:"b_slimeking"},{k:"kill",m:"wolf",n:10}],
      rw:{xp:800,gold:500,wings:"wng_angel"}, next:null },
    { id:"s5", name:"Rite of Flame", giver:"dawnshire_elder", lv:12, faction:"demon",
      objs:[{k:"boss",m:"b_slimeking"},{k:"kill",m:"boar",n:10}],
      rw:{xp:800,gold:500,wings:"wng_demon"}, next:null },
    { id:"s6", name:"Forge Fundamentals", giver:"dawnshire_blacksmith", lv:9,
      objs:[{k:"craft",n:2}], rw:{gold:250,xp:300,gems:10}, next:"s7",
      wake:"Craft potions at my anvil (Craft tab), then show me you've learned." },
    { id:"s7", name:"Fusion Theory", giver:"dawnshire_blacksmith", lv:9,
      objs:[{k:"fuse",n:1}], rw:{gold:250,xp:300,gems:10}, next:null,
      wake:"Combine 4 identical items in your Bag (Fusion tab). Nothing is ever destroyed — it IMPROVES." },
    { id:"s8", name:"Stone and Storage", giver:"dawnshire_storage", lv:4,
      objs:[{k:"talk",npc:"dawnship?no"},{k:"gather",m:"ore",n:6}], rw:{gold:250,xp:300}, next:null,
      npcOverride:"dawnshire_storage" },
  ];
  // fix s8 obj (typo guard) — objective: talk to storage keeper then gather ore
  QUESTS.find(q=>q.id==="s8").objs = [{k:"talk",npc:"dawnshire_storage"},{k:"gather",m:"ore",n:6}];

  /* ---------------- shop ---------------- */
  const SHOP = {
    costume: COSTUMES.map(c=>({id:c.id, name:c.name, type:"costume", priceM:300, desc:"Full outfit skin (changes look, not stats)"})),
    hairstyle: [...Array(5).keys()].map(i=>({id:"hs_"+i, name:HAIRSTYLES[i]+" (unlock)", type:"hairstyle", priceG:800, i})),
    mount: Object.keys(MOUNTS).map(k=>({id:k, name:MOUNTS[k].name, type:"mount", priceG:MOUNTS[k].priceG, priceM:MOUNTS[k].priceM, desc:"+"+Math.round((MOUNTS[k].spd-1)*100)+"% move speed", i:k})),
    pet: Object.keys(PETS).map(k=>({id:k, name:PETS[k].name, type:"pet", priceG:PETS[k].priceG, priceM:PETS[k].priceM, desc:PETS[k].bonus, i:k})),
    wfx: Object.keys(WFX).map(k=>({id:k, name:WFX[k].name, type:"wfx", priceM:WFX[k].priceM, desc:"Colored attack trail", i:k})),
    wings: [
      {id:"wng_angel", type:"wings", priceM:200, desc:"Celestial wings (also a quest reward)"},
      {id:"wng_demon", type:"wings", priceM:200, desc:"Demonic wings (also a quest reward)"},
      {id:"wng_seraph", type:"wings", priceM:500, desc:"Premium Seraph's Flame wings"},
      {id:"wng_void", type:"wings", priceM:500, desc:"Premium Voidtorn wings"} ],
    gems: [ {id:"gem_free", type:"info", name:"Gems are earned!", desc:"Gems drop from bosses, quests, dungeons and achievements — no purchase needed."},
            {id:"prem_month", type:"prem", name:"Premium Membership (simulated)", priceM:300, desc:"+50% XP & Gold, +2 stash rows — 30 days. Fully optional; simulated, no real payment."} ],
  };

  /* NPC titles */
  const NPCTITLES = { elder:"Village Elder", captain:"Captain", blacksmith:"Blacksmith",
    merchant:"Merchant", storage:"Storage Keeper", teleporter:"Teleporter" };

  return { mulberry32, strSeed, rngOf, pick, ri,
    RAR_ORDER, nextRar, CLASSES, FACTIONS,
    HAIRSTYLES, HAIRCOLORS, EYECOLORS, OUTFITS, COSTUMES,
    SLOTS, SLOTNAME, ILVLS, ITEMS, STONES, MATS, USES,
    WINGS, MOUNTS, PETS, WFX,
    MONS, BOSSES, DBOSS, REGIONS, REGION_BY_ID, DUNGEONS, DG_BY_ID, stoneFor,
    QUESTS, SHOP, NPCTITLES };
})();
