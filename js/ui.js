/* ============ AETHERIA — mobile UI: HUD, panels, creation ============ */
"use strict";
const $ = sel => document.querySelector(sel);
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };

const UI = {
  _dirty: true,
  hudBuilt: false,
  dirty(){ this._dirty = true; },
  /* ------------ toasts ------------- */
  toast(msg, cls){
    const t = el("div", "toast " + (cls||""), msg);
    $("#toasts").appendChild(t);
    setTimeout(()=>t.remove(), 2900);
    while($("#toasts").children.length > 4) $("#toasts").firstChild.remove();
  },

  /* ------------ HUD ------------- */
  buildHUD(){
    if(this.hudBuilt) return; this.hudBuilt = true;
    const hud = $("#hud"); hud.innerHTML = "";
    const top = el("div"); top.id = "topbar";
    top.innerHTML = `
      <div id="bars">
        <div class="bar hp"><div id="hpfill" style="width:100%"></div><span id="hptext"></span></div>
        <div class="bar mp"><div id="mpfill" style="width:100%"></div><span id="mptext"></span></div>
        <div class="bar xp"><div id="xpfill" style="width:0%"></div><span id="lvtext"></span></div>
      </div>
      <div id="curex"></div>
      <canvas id="minimap" width="120" height="120"></canvas>`;
    hud.appendChild(top);
    const menu = el("div"); menu.id = "menuRow";
    const mbs = [ ["bag","🎒","BAG"], ["equip","⚔️","GEAR"], ["quests","📜","QUEST"], ["craft","🔨","CRAFT"],
                  ["market","⚖️","MARKET"], ["map","🗺️","MAP"], ["shop","🛍️","SHOP"], ["char","🧙","CHAR"] ];
    mbs.forEach(([id, ico, lbl])=>{
      const b = el("button", "mbtn", `<i>${ico}</i>${lbl}`);
      b.dataset.p = id;
      b.style.position = "relative";
      if(id === "quests") { const d = el("span","dot"); d.id = "questDot"; d.style.display = "none"; b.appendChild(d); }
      b.onclick = () => { AudioS.tap(); this.openPanel(id); };
      menu.appendChild(b);
    });
    hud.appendChild(menu);
    const joy = el("div"); joy.id = "joy"; joy.innerHTML = `<div id="joyKnob"></div>`; hud.appendChild(joy);
    const btns = el("div"); btns.id = "btns";
    btns.innerHTML = `
      <button class="abtn" id="bAtk">⚔️<small>Attack</small></button>
      <button class="abtn" id="bSkill">✨<small id="skName">Skill</small></button>
      <button class="abtn" id="bAuto">AUTO<br><small>attack</small></button>
      <button class="abtn" id="bHpPot">🧪<small>HP</small><span class="badge" id="hpCnt">0</span></button>
      <button class="abtn" id="bMpPot">⚗️<small>MP</small><span class="badge" id="mpCnt">0</span></button>
      <button class="abtn" id="bInter">💬<small id="interLbl">Talk</small></button>`;
    hud.appendChild(btns);
    const zt = el("div"); zt.id = "zoneTag"; hud.appendChild(zt);

    $("#bAtk").addEventListener("touchstart", e => { e.preventDefault(); simAtkPress(); }, {passive:false});
    $("#bAtk").addEventListener("mousedown", e => { e.preventDefault(); simAtkPress(); });
    $("#bSkill").addEventListener("touchstart", e => { e.preventDefault(); simSkillPress(); }, {passive:false});
    $("#bSkill").addEventListener("mousedown", e => { e.preventDefault(); simSkillPress(); });
    $("#bAuto").onclick = () => { Sim.autoAttack = !Sim.autoAttack; $("#bAuto").classList.toggle("on", Sim.autoAttack); this.toast("Auto-attack " + (Sim.autoAttack?"ON":"OFF")); };
    $("#bHpPot").onclick = () => Sim.usePotion("hp");
    $("#bMpPot").onclick = () => Sim.usePotion("mp");
    $("#bInter").onclick = () => Sim.interact();
    this._joyInit();
  },
  _joyInit(){
    const joy = $("#joy"), knob = $("#joyKnob");
    let active = false, cx = 0, cy = 0;
    const R = 50;
    const upd = (x, y)=>{
      const dx = x - cx, dy = y - cy;
      const d = Math.min(R, Math.hypot(dx, dy)) || 0.001;
      const nx = dx/d, ny = dy/d;
      const mag = Math.min(1, Math.hypot(dx, dy)/R);
      knob.style.left = (41 + nx*mag*R) + "px";
      knob.style.top = (41 + ny*mag*R) + "px";
      Sim.input.dx = nx*mag; Sim.input.dy = ny*mag;
    };
    const start = e => {
      const t = e.touches ? e.touches[0] : e;
      const r = joy.getBoundingClientRect();
      cx = r.left + r.width/2; cy = r.top + r.height/2;
      active = true; upd(t.clientX, t.clientY);
      e.preventDefault();
    };
    const move = e => { if(!active) return; const t = e.touches ? e.touches[0] : e; upd(t.clientX, t.clientY); e.preventDefault(); };
    const end = e => { active = false; Sim.input.dx = 0; Sim.input.dy = 0; knob.style.left = "41px"; knob.style.top = "41px"; };
    joy.addEventListener("touchstart", start, {passive:false});
    joy.addEventListener("touchmove", move, {passive:false});
    joy.addEventListener("touchend", end); joy.addEventListener("touchcancel", end);
    joy.addEventListener("mousedown", start); window.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
  },

  refreshHUD(){
    if(!G) return;
    const mh = maxHp(), mm = maxMp();
    $("#hpfill").style.width = Math.max(0, G.hp/mh*100) + "%";
    $("#hptext").textContent = `${Math.ceil(G.hp)} / ${mh}`;
    $("#mpfill").style.width = Math.max(0, G.mp/mm*100) + "%";
    $("#mptext").textContent = `${Math.floor(G.mp)} / ${mm}`;
    $("#xpfill").style.width = Math.max(0, Math.min(100, G.xp/xpNeed(G.lv)*100)) + "%";
    $("#lvtext").textContent = `Lv ${G.lv}`;
    $("#curex").innerHTML = `<span class="g">◆ ${G.gold}</span> &nbsp;<span class="m">◈ ${G.gems}</span><br><span class="z">${Data.CLASSES[G.cls].name}</span>`;
    $("#zoneTag").textContent = (Sim.map ? Sim.map.name : "") + (Sim.map && Sim.map.isDungeon ? " (Dungeon)" : "");
    $("#hpCnt").textContent = countStack("hp1") + countStack("hp2");
    $("#mpCnt").textContent = countStack("mp1");
    $("#skName").textContent = Data.CLASSES[G.cls].skill.name.split(" ")[0];
    const ready = G.skillCd <= 0 && G.mp >= Data.CLASSES[G.cls].skill.mp;
    $("#bSkill").style.filter = ready ? "brightness(1.1)" : "grayscale(.7) brightness(.7)";
    const t = Sim.interactTarget;
    const bI = $("#bInter");
    if(t){
      bI.style.display = "flex";
      const lbl = t.type === "npc" ? "Talk" : t.type === "node" ? "Gather" : "Enter";
      $("#interLbl").textContent = lbl;
    } else bI.style.display = "none";
    // quest ready dot
    const dot = $("#questDot");
    if(dot) dot.style.display = Data.QUESTS.some(q => Quest.claimable(q)) ? "block" : "none";
  },

  /* ------------ generic panel ------------- */
  openPanel(kind){
    AudioS.tap();
    this.closePanel();
    const p = el("div", "panel");
    p.id = "panel_" + kind;
    const head = el("div", "phead");
    head.innerHTML = `<h3>${this.PANEL_TITLES[kind] || kind.toUpperCase()}</h3><span class="sp"></span>`;
    const x = el("button", "pclose", "✕");
    x.onclick = () => this.closePanel();
    head.appendChild(x);
    p.appendChild(head);
    const body = el("div", "pbody");
    const tabs = el("div", "tabs");
    p.appendChild(body); p.appendChild(tabs);
    $("#panels").appendChild(p);
    this.panel = p; this.panelBody = body; this.panelTabs = tabs; this.panelKind = kind;
    this.renderPanel(kind);
  },
  closePanel(){
    if(this.panel){ this.panel.remove(); this.panel = null; this.panelKind = null; }
    if(this.dialog){ this.dialog.remove(); this.dialog = null; }
  },
  switchTab(t){
    this.panelTab = t;
    this.renderPanel(this.panelKind);
  },
  setTabs(list, sel){
    const tabs = this.panelTabs;
    tabs.innerHTML = "";
    list.forEach(t=>{
      const b = el("button", "tab" + (t.id === sel ? " on" : ""), t.label);
      b.onclick = () => this.switchTab(t.id);
      tabs.appendChild(b);
    });
  },
  openDialog(contentEl){
    if(this.dialog) this.dialog.remove();
    const p = el("div", "panel", "");
    p.style.zIndex = 50;
    p.appendChild(contentEl);
    $("#panels").appendChild(p);
    this.dialog = p;
  },

  renderPanel(kind){
    const b = this.panelBody;
    b.innerHTML = "";
    switch(kind){
      case "bag": this.rBag(); break;
      case "equip": this.rEquip(); break;
      case "quests": this.rQuests(); break;
      case "craft": this.rCraft(); break;
      case "market": this.rMarket(); break;
      case "map": this.rMap(); break;
      case "shop": this.rShop(); break;
      case "char": this.rChar(); break;
    }
    this._dirty = false;
  },

  /* ------------ BAG ------------- */
  rBag(){
    const b = this.panelBody;
    this.setTabs([ {id:"bag",label:"Bag"}, {id:"fuse",label:"Fusion"} ], this.panelTab || "bag");
    if(this.panelTab === "fuse"){ this.rFuse(); return; }
    b.innerHTML = "";

    const sel = this.bagSel ||= { uids: [], mode: null };
    const bar = el("div");
    bar.innerHTML = `<div class="statline">Bag <b>${G.inv.filter(Boolean).length}/40</b> · gold <b>◆${G.gold}</b> · tap items to select</div>`;
    b.appendChild(bar);
    const grid = el("div", "grid");
    G.inv.forEach((it, i)=>{
      const c = cellFor(it, sel.uids.includes(it && it.uid));
      if(it){
        c.onclick = () => {
          if(sel.mode === "market") { listItemFromBag(it, c); this.renderPanel("market"); return; }
          if(sel.mode === "sell"){ sellItem(it.uid); sel.mode = null; this.renderPanel("bag"); return; }
          const ui = sel.uids.indexOf(it.uid);
          if(ui >= 0) sel.uids.splice(ui,1); else { sel.uids = [it.uid]; }
          this.rBag();
        };
        c.oncontextmenu = e => { e.preventDefault(); };
        if(!it.stack){
          c.onpointerdown = null;
          let hold;
          c.addEventListener("pointerdown", () => { hold = setTimeout(()=>{ showItemInfo(it); }, 500); });
          c.addEventListener("pointerup", () => clearTimeout(hold));
          c.addEventListener("pointerleave", () => clearTimeout(hold));
        }
      }
      grid.appendChild(c);
    });
    b.appendChild(grid);
    const act = el("div");
    act.style.marginTop = "10px"; act.style.display = "flex"; act.style.gap = "6px"; act.style.flexWrap = "wrap";
    const it0 = sel.uids.length ? G.inv.find(x=>x && x.uid === sel.uids[0]) : null;
    if(it0){
      if(it0.stack){
        if(Data.USES[it0.stack]) act.appendChild(btn("Use", "gold", ()=>{ Sim.pressingUse = it0; useStack(it0.stack, 1); this.rBag(); }));
        else act.appendChild(btn("Sell", "", ()=>{ sellStack(it0.stack, it0.n); this.rBag(); }));
        act.appendChild(btn("To Storage", "", ()=>{ stashMoveStack(it0.stack, it0.n, true); this.rBag(); }));
      } else {
        act.appendChild(btn("Equip", "gold", ()=>{ equipItem(it0.uid); this.rBag(); }));
        act.appendChild(btn("Details", "", ()=>showItemInfo(it0)));
        act.appendChild(btn("To Storage", "", ()=>{ stashMove(it0.uid, true); this.rBag(); }));
      }
      act.appendChild(btn("To Marketplace", "gem", ()=>{ UI.closePanel(); UI.openPanel("market"); UI.panelTab = "list"; UI.rMarket(); }));
    }
    act.appendChild(btn("Sell mode", "danger", ()=>{ sel.mode = sel.mode === "sell" ? null : "sell"; this.toast(sel.mode ? "Tap an item to sell it" : "Sell cancelled"); this.rBag(); }));
    b.appendChild(act);
  },
  /* fusion tab */
  rFuse(){
    const b = this.panelBody; b.innerHTML = "";
    const sel = this.fuseSel ||= [];
    b.innerHTML = `<div class="note"><b>Fusion (never destroys items — always upgrades):</b><br>
      4 × same item (same name, rarity & tier) → a <b>higher tier</b> item.<br>
      T3 → T2 → T1, then 4 × T1 → <b>next rarity</b>, T3.<br>
      Rarity ladder: Common → Grey → Green → Blue → Purple → Legendary → Mythic → Divine.<br>
      Mythic & Divine are only made this way — they never drop.<br>
      Fusion fee: ${Object.entries(CONFIG.prices.fusionFee).map(([k,v])=>`${CONFIG.rares[k].name} ${v}g`).slice(0,6).join(", ")}</div>`;
    const grid = el("div", "grid");
    G.inv.forEach((it, i)=>{
      const c = cellFor(it, sel.includes(it && it.uid));
      if(it && !it.stack){
        c.onclick = ()=>{
          const ui = sel.indexOf(it.uid);
          if(ui>=0) sel.splice(ui,1);
          else {
            const a = it;
            if(sel.length >= 4) return this.toast("Select exactly 4.", "bad");
            if(sel.length){
              const first = G.inv.find(x=>x && x.uid===sel[0]);
              if(first && (first.tpl!==it.tpl || first.q!==it.q || first.tier!==it.tier)) return this.toast("Must match the first selected item exactly.", "bad");
            }
            sel.push(it.uid);
          }
          this.rFuse();
        };
      }
      grid.appendChild(c);
    });
    b.appendChild(grid);
    const act = el("div");
    act.style.marginTop = "10px";
    if(sel.length){
      const first = G.inv.find(x=>x && x.uid===sel[0]);
      act.appendChild(el("div","statline",
        `<b>${itemLabel(first)}</b> ×${sel.length}/4 · fee <b>${CONFIG.prices.fusionFee[first.q]}g</b>` +
        (sel.length===4?`<br>→ ${first.tier>1?`T${first.tier-1} ${CONFIG.rares[first.q].name}`:`${CONFIG.rares[Data.nextRar(first.q)].name} T3`}`:"")));
    }
    const row = el("div"); row.style.display = "flex"; row.style.gap = "8px";
    if(sel.length === 4){
      row.appendChild(btn("⚡ FUSE!", "gold", ()=>{
        const items = G.inv.filter(x=>x && sel.includes(x.uid));
        fuseItems(items);
        this.fuseSel = [];
        this.rFuse();
      }));
      row.appendChild(btn("Clear", "", ()=>{ this.fuseSel = []; this.rFuse(); }));
    } else row.appendChild(el("span", "note", `Select ${4 - sel.length} more identical item${4-sel.length>1?"s":""}.`));
    act.appendChild(row);
    b.appendChild(act);
  },

  /* ------------ EQUIP ------------- */
  rEquip(){
    const b = this.panelBody; b.innerHTML = "";
    this.setTabs([ {id:"equip",label:"Equipment"} ], "equip");
    const st = playerSummaryHTML();
    b.insertAdjacentHTML("beforeend", st);
    const slots = [...Data.SLOTS, "wings"];
    const sl = el("div", "slotline");
    slots.forEach(s=>{
      const it = G.equip[s];
      const c = el("div", "eqcell" + (it ? " filled":""));
      c.innerHTML = `<span class="sn">${s === "wings" ? "WINGS" : Data.SLOTNAME[s]?.toUpperCase?.() || s.toUpperCase()}</span>`;
      if(it){
        const cv = el("canvas", ""); cv.width = 48; cv.height = 48;
        cv.getContext("2d").drawImage(iconFor(it), 0, 0);
        c.appendChild(cv);
        const q = CONFIG.rares[it.q];
        c.style.borderColor = q.col;
        c.onclick = () => showItemInfo(it, true);
      } else if(s === "wings"){
        c.onclick = ()=>{ UI.closePanel(); UI.openPanel("char"); UI.panelTab = "look"; UI.rChar(); };
        c.insertAdjacentHTML("beforeend", `<div style="font-size:16px">🪽</div><div>choose</div>`);
      } else c.onclick = ()=> this.toast("Empty");
      sl.appendChild(c);
    });
    b.appendChild(sl);
    // skill box
    const c = Data.CLASSES[G.cls];
    const skmLvl = G.skillLv;
    const cost = skmLvl >= 10 ? null : CONFIG.skillUpCost(G.skillLv);
    const sk = el("div", "note");
    sk.innerHTML = `<b>${c.skill.name} — Lv ${skmLvl}/10</b><br>${c.skill.desc}<br>
      Power: <b>${(c.skill.mult + c.skill.perLv*(skmLvl-1)).toFixed(2)}×</b> attack · MP ${c.skill.mp} · CD ${c.skill.cd}s<br>
      ${cost ? `<button class="btn gold" id="skUp">Upgrade — ${cost} gold</button>` : `<span style="color:#ffd75a">MAX LEVEL</span>`}`;
    b.appendChild(sk);
    if(cost) $("#skUp", b)?.addEventListener("click", ()=>{
      if(G.gold < cost) return this.toast("Not enough gold.", "bad");
      G.gold -= cost; G.skillLv++;
      this.toast(`${c.skill.name} upgraded to Lv ${G.skillLv}!`, "gold");
      this.rEquip();
    });
  },

  /* ------------ QUESTS ------------- */
  rQuests(){
    const b = this.panelBody; b.innerHTML = "";
    this.setTabs([ {id:"quests",label:"Quests"} ], "quests");
    const act = Data.QUESTS.filter(q => G.quests[q.id]?.started && !G.quests[q.id]?.claimed);
    const done = Data.QUESTS.filter(q => G.quests[q.id]?.claimed);
    const avail = Data.QUESTS.filter(q => !G.quests[q.id]?.started && G.lv >= (q.lv||1) && factionOk(q)
      && giverOf(q)?.split("_")[0] === (Sim.map && Sim.map.region && Sim.map.region.town ? Sim.map.region.town.id : null) );
    b.insertAdjacentHTML("beforeend", `<div class="statline">Active: <b>${act.length}</b> · Completed: <b>${done.length}</b> · Seek quest-givers in towns (❗ over their heads)</div>`);
    act.forEach(q=>{
      const s = G.quests[q.id];
      const obj = q.objs[s.step] || null;
      let prog = "";
      if(s.complete) prog = `<span class="qtf">Ready to turn in → visit ${npcName(giverOf(q))}</span>`;
      else if(obj){
        if(obj.k === "kill") prog = `${mobName(obj.m)} slain: ${b(s)} / ${obj.n}`;
        if(obj.k === "talk") prog = `Talk to <b>${npcName(obj.npc)}</b> in ${npcTown(obj.npc)}`;
        if(obj.k === "boss") prog = `Defeat <b>${bossName(obj.m)}</b>`;
        if(obj.k === "gather") prog = `${Data.MATS[obj.m].name}: ${s.sec||0} / ${obj.n}`;
        if(obj.k === "craft") prog = `Craft items: ${G.$crafted||0} / ${obj.n}`;
        if(obj.k === "fuse") prog = `Fuse items: ${G.$fused||0} / ${obj.n}`;
        if(obj.k === "dungeon") prog = `Clear <b>${Data.DG_BY_ID[obj.id].name}</b>`;
        if(obj.k === "lv") prog = `Reach level ${obj.n} (you: ${G.lv})`;
      }
      b.insertAdjacentHTML("beforeend", questRow(q, prog, s));
    });
    if(avail.length){
      b.insertAdjacentHTML("beforeend", `<div class="note">Nearby quest-givers:</div>`);
      avail.forEach(q=> b.insertAdjacentHTML("beforeend", questRow(q, "Visit " + npcName(giverOf(q)) + ` (Lv ${q.lv}+)`, null)));
    }
    if(!act.length && !avail.length) b.insertAdjacentHTML("beforeend", `<div class="note">No active quests — talk to NPCs in your current area.</div>`);
  },

  /* ------------ CRAFT & ECONOMY ------------- */
  rCraft(){
    const b = this.panelBody; b.innerHTML = "";
    this.setTabs([ {id:"pot",label:"Potions"}, {id:"legend",label:"Legendary Forge"} ], this.panelTab || "pot");
    b.insertAdjacentHTML("beforeend", `<div class="note">Craft fee: <b>${CONFIG.prices.craftFee}g</b> per potion · Merchant sale price = 80% of material value.</div>`);
    if(this.panelTab !== "legend"){
      const recipes = [
        { id:"hp1", out:"Healing Potion", mats:{ herb:2 } },
        { id:"mp1", out:"Mana Potion", mats:{ ore:2 } },
        { id:"hp2", out:"Greater Healing Potion", mats:{ herb:4, duneAmber:2 } },
      ];
      recipes.forEach(r=>{
        const mats = Object.entries(r.mats).map(([k,n])=>`${Data.MATS[k].name} ${countStack(k)}/${n}`).join(" · ");
        const can = Object.entries(r.mats).every(([k,n])=>countStack(k) >= n) && G.gold >= CONFIG.prices.craftFee;
        b.insertAdjacentHTML("beforeend", rowOf(
          `<div class="name">${r.out}</div><div class="sub">${mats}</div>`,
          `<button class="btn small ${can?"":"dis"}" data-craft="${r.id}">Craft x1</button>`));
      });
      b.querySelectorAll("[data-craft]").forEach(x=> x.onclick = ()=>{ craftPotions(x.dataset.craft, 1); this.rCraft(); });
      // gather help
      b.insertAdjacentHTML("beforeend", `<div class="note">Gather materials from bushes 🌿 (herbs), ore veins ⛏ and trees — walk up and tap <b>Gather</b>.</div>`);
    } else {
      const region = regionForMap(G.map);
      const ilvl = Data.ILVLS[Math.min(Data.ILVLS.length-1, region.idx)];
      b.insertAdjacentHTML("beforeend", `<div class="statline">Legendary forge — <b>${region.name}</b> tier (item level <b>${ilvl}</b>).<br>
        Cost: <b>${CONFIG.prices.legendaryGold}g</b> + <b>2 Legend Sigils</b> (dungeon bosses) + region materials.<br>
        Sigils owned: <b>${countStack("sigil")}</b></div>`);
      ["weapon","offhand","head","chest","legs","boots","gloves","ring"].forEach(slot=>{
        const can = countStack("sigil") >= 2 && G.gold >= CONFIG.prices.legendaryGold;
        b.insertAdjacentHTML("beforeend", rowOf(
          `<div class="name">${Data.SLOTNAME[slot]} — ${CONFIG.rares.legendary.name} T3</div><div class="sub">ilvl ${ilvl} · 3 random bonuses · +${(CONFIG.tierMult[1]-1)*100|0}% improved by later fusions</div>`,
          `<button class="btn small ${can?"":"dis"}" data-forge="${slot}">Forge</button>`));
      });
      b.querySelectorAll("[data-forge]").forEach(x=> x.onclick = ()=>{
        craftLegendary(x.dataset.forge);
        this.rCraft();
      });
      b.insertAdjacentHTML("beforeend", `<div class="note">Climb higher: 4 × Legendary T1 fuse into <b>Mythic T3</b>; 4 × Mythic T1 fuse into <b>Divine T3</b>.</div>`);
    }
  },

  /* ------------ MARKETPLACE ------------- */
  rMarket(){
    const b = this.panelBody; b.innerHTML = "";
    this.setTabs([ {id:"offers",label:"Offers"}, {id:"mine",label:"My Listings"}, {id:"list",label:"List Item"} ], this.panelTab || "offers");
    b.insertAdjacentHTML("beforeend", `<div class="note">⚖️ <b>Marketplace — offline preview.</b> Local NPC-style trading only; live player-to-player trading arrives with online accounts, and this page will never pretend otherwise. Listing fee: ${(CONFIG.prices.marketFeePct*100)|0}% on sale.</div>`);
    if(this.panelTab === "offers"){
      G.market.offers.forEach(o=>{
        const it = o.item;
        b.insertAdjacentHTML("beforeend", rowOf(
          `<canvas width="48" height="48" data-mk="${o.id}" style="width:40px;height:40px;image-rendering:pixelated"></canvas>
           <div class="grow"><div class="name" style="color:${CONFIG.rares[it.q].col}">${itemLabel(it)}</div>
           <div class="sub">${CONFIG.rares[it.q].name} T${it.tier} · ${statLine(it)} · seller: ${o.seller}</div></div>`,
          `<button class="btn small gold" data-buy="${o.id}">${o.price}g</button>`));
      });
      b.querySelectorAll("[data-buy]").forEach(x=> x.onclick = ()=>{ buyOffer(G.market.offers.find(o=>o.id===x.dataset.buy)); this.rMarket(); });
      b.querySelectorAll("[data-mk]").forEach(c=>{ const it = G.market.offers.find(o=>o.id===c.dataset.mk).item; c.getContext("2d").drawImage(iconFor(it),0,0); });
      if(!G.market.offers.length) b.insertAdjacentHTML("beforeend", `<div class="note">No offers right now — new deals appear periodically.</div>`);
    } else if(this.panelTab === "mine"){
      if(!G.market.listings.length) b.insertAdjacentHTML("beforeend", `<div class="note">You have no active listings.</div>`);
      G.market.listings.forEach((L, i)=>{
        const it = L.item;
        b.insertAdjacentHTML("beforeend", rowOf(
          `<div class="grow"><div class="name" style="color:${CONFIG.rares[it.q].col}">${itemLabel(it)}</div>
          <div class="sub">asking ${L.price}g · ${statLine(it)}</div></div>`,
          `<button class="btn small danger" data-cancel="${i}">Cancel</button>`));
      });
      b.querySelectorAll("[data-cancel]").forEach(x=> x.onclick = ()=>{ cancelListing(G.market.listings[+x.dataset.cancel]); this.rMarket(); });
    } else {
      const grid = el("div", "grid");
      let picked = this._listPick;
      G.inv.forEach((it, i)=>{
        const c = cellFor(it, picked && picked.uid === it?.uid);
        if(it && !it.stone){
          c.onclick = ()=>{ this._listPick = it; this.rMarket();
            this.querySelector?.(); };
        }
        grid.appendChild(c);
      });
      b.appendChild(grid);
      if(picked){
        b.insertAdjacentHTML("beforeend", `<div class="statline">Listing <b>${itemLabel(picked)}</b> · base value ≈ <b>${itemValue(picked)}g</b></div>
          <div class="proj"><input type="number" id="listPrice" value="${itemValue(picked)}" min="1" style="flex:1;padding:8px;background:#0e1018;border:1px solid #4a5078;border-radius:8px;color:#fff">
          <button class="btn gold" id="doList">List</button></div>`);
        $("#doList", b).onclick = ()=>{
          const price = parseInt($("#listPrice", b).value) || itemValue(picked);
          listItem(picked.uid, price);
          this._listPick = null;
          this.rMarket();
        };
      } else b.insertAdjacentHTML("beforeend", `<div class="note">Tap an equipment item from your bag to list it. Boss stones cannot be traded.</div>`);
    }
  },

  /* ------------ WORLD MAP / TELEPORT ------------- */
  rMap(){
    const b = this.panelBody; b.innerHTML = "";
    this.setTabs([ {id:"map",label:"World"} ], "map");
    b.insertAdjacentHTML("beforeend", `<div class="statline">Teleport fee: <b>${teleportCost()}g</b> — unlocked towns only.<br>Current: <b>${Sim.map?.name||""}</b></div>`);
    Data.REGIONS.forEach(r=>{
      const un = G.unlocked.includes(r.id);
      const lv = un ? "" : ` <span style="color:#8a90b8">— locked, follow the main quest</span>`;
      b.insertAdjacentHTML("beforeend", rowOf(
        `<div class="name" style="color:${un?"#ffdf8a":"#5a6078"}">${r.name} ${un?"":"🔒"}</div>
        <div class="sub">Levels ${r.lv[0]}–${r.lv[1]}${r.town ? " · Town: " + r.town.name : ""}${lv}</div>`,
        un ? `<button class="btn small gold" data-tr="${r.id}">Teleport ${teleportCost()}g</button>` : `` ));
    });
    b.querySelectorAll("[data-tr]").forEach(x=> x.onclick = ()=>{ travelTo(x.dataset.tr); this.closePanel(); });
    // dungeon access
    b.insertAdjacentHTML("beforeend", `<div class="note">Dungeons are entered through the stone portal near each town.</div>`);
  },

  /* ------------ SHOP ------------- */
  rShop(){
    const b = this.panelBody; b.innerHTML = "";
    const cats = [" Wings ","Costumes","Mounts","Pets","Weapon FX","Hairstyles","Gems & Premium"];
    this.setTabs([ ["wings","Wings"],["costume","Costumes"],["mount","Mounts"],["pet","Pets"],["wfx","Weapon FX"],["hairstyle","Hairstyles"],["gems","Gems & Premium"]
      ].map(([id,label])=>({id,label})), this.panelTab || "wings");
    b.insertAdjacentHTML("beforeend", `<div class="statline">Gold <b>◆ ${G.gold}</b> · Gems <b>◈ ${G.gems}</b></div>`);
    const tab = this.panelTab || "wings";
    if(tab === "gems"){
      Data.SHOP.gems.forEach(g=>{
        if(g.type === "info"){
          b.insertAdjacentHTML("beforeend", `<div class="note"><b>${g.name}</b><br>${g.desc}<br>
            — Quest rewards, dungeon first-clears (+25 ◈), first boss-kill (+15 ◈).</div>`);
        } else {
          b.insertAdjacentHTML("beforeend", rowOf(
            `<div class="grow"><div class="name">${g.name}</div><div class="sub">${g.desc}</div></div>`,
            G.premUntil > Date.now() ? `<span class="qtf">ACTIVE</span>` :
            `<button class="btn small gem" data-shop="prem_month">${g.priceM} ◈</button>`));
        }
      });
      if(G.premUntil > Date.now()) b.insertAdjacentHTML("beforeend", `<div class="note">Premium active until ${new Date(G.premUntil).toLocaleDateString()}.</div>`);
    } else {
      Data.SHOP[tab]?.forEach(e=>{
        const owned = (e.type==="mount" && G.mounts.includes(e.id)) || (e.type==="pet" && G.pets.includes(e.id)) ||
          (e.type==="wings" && G.wingsOwned.includes(e.id)) || (e.type==="wfx" && G.wfx.includes(e.id)) ||
          (e.type==="costume" && G.costumes.includes(e.id)) || (e.type==="hairstyle" && G.hairOwned.includes(e.i));
        const price = e.priceG ? `${e.priceG}◆` + (e.priceM?` + ${e.priceM}◈`:"") : `${e.priceM}◈`;
        b.insertAdjacentHTML("beforeend", rowOf(
          `<div class="grow"><div class="name" style="color:${e.type==="wings"?"#c8e8ff":"#ffdf8a"}">${e.name}</div><div class="sub">${e.desc||""}</div></div>`,
          owned ? `<span class="qtf">OWNED</span>` : `<button class="btn small ${e.priceM?"gem":"gold"}" data-shop="${e.id}">${price}</button>`));
      });
    }
    b.querySelectorAll("[data-shop]").forEach(x=> x.onclick = ()=>{ shopBuy(findShopEntry(x.dataset.shop)); this.rShop(); });
  },

  /* ------------ CHARACTER / PROFILE ------------- */
  rChar(){
    const b = this.panelBody; b.innerHTML = "";
    this.setTabs([ {id:"stats", label:"Profile"}, {id:"look", label:"Looks"}, {id:"companion", label:"Companions"}, {id:"sys", label:"System"} ],
      this.panelTab || "stats");
    if(this.panelTab === "look"){ this.rLook(); return; }
    if(this.panelTab === "companion"){ this.rCompanion(); return; }
    if(this.panelTab === "sys"){ this.rSystem(); return; }
    const c = Data.CLASSES[G.cls];
    b.insertAdjacentHTML("beforeend", `<div class="statline">
      <b style="font-size:14px">${G.name}</b> — Lv ${G.lv} ${c.name}<br>
      Faction: <b>${Data.FACTIONS[G.faction].name}</b><br>
      ${c.desc}<br><br>
      <b>ATK</b> ${atkPower().toFixed(1)} · <b>DEF</b> ${defPower().toFixed(1)}<br>
      <b>HP</b> ${Math.ceil(G.hp)}/${maxHp()} · <b>MP</b> ${Math.floor(G.mp)}/${maxMp()}<br>
      <b>CRIT</b> ${(critChance()*100).toFixed(1)}% (cap 50%) · <b>SPD</b> ${moveSpd().toFixed(2)}<br>
      Monsters slain: <b>${Object.values(G.kills).reduce((a,b)=>a+b,0)}</b> · Bosses: <b>${Object.keys(G.bossKills).length}</b><br>
      Play time: <b>${Math.floor(G.playTimeS/60)} min</b></div>`);
    b.insertAdjacentHTML("beforeend", `<div class="note"><b>Faction passive:</b> ${Data.FACTIONS[G.faction].bonus}</div>`);
    const sk = c.skill;
    b.insertAdjacentHTML("beforeend", `<div class="note"><b>Main skill:</b> ${sk.name} (Lv ${G.skillLv}) — upgrade in GEAR tab.</div>`);
  },
  rLook(){
    const b = this.panelBody; b.innerHTML = "";
    // outfits
    b.insertAdjacentHTML("beforeend", `<div class="statline"><b>Starting outfits & costumes</b> — cosmetic only</div>`);
    const rowO = el("div", "optRow");
    Data.OUTFITS[G.cls].forEach((o, i)=>{
      const chip = el("div", "chip" + (G.look.cust===null && G.look.outfit===i ? " on":""), `${o.name}`);
      chip.onclick = ()=>{ G.look.cust = null; G.look.outfit = i; this.rLook(); };
      rowO.appendChild(chip);
    });
    G.costumes.forEach(cid=>{
      const co = Data.COSTUMES.find(x=>x.id===cid);
      const chip = el("div", "chip" + (G.look.cust===cid?" on":""), co.name);
      chip.onclick = ()=>{ G.look.cust = cid; this.rLook(); };
      rowO.appendChild(chip);
    });
    b.appendChild(rowO);
    // hair style
    b.insertAdjacentHTML("beforeend", `<div class="statline"><b>Hairstyle</b> (locked styles: shop)</div>`);
    const rowH = el("div", "optRow");
    Data.HAIRSTYLES.forEach((h, i)=>{
      const owned = G.hairOwned.includes(i);
      const chip = el("div", "chip" + (G.look.hs===i?" on":""), h + (owned?"":" 🔒"));
      chip.style.opacity = owned ? 1 : .5;
      chip.onclick = ()=>{ if(!owned) return this.toast("Unlock in Shop → Hairstyles", "bad"); G.look.hs = i; this.rLook(); };
      rowH.appendChild(chip);
    });
    b.appendChild(rowH);
    // hair color & eyes
    b.insertAdjacentHTML("beforeend", `<div class="statline"><b>Hair color</b> · <b>Eye color</b></div>`);
    const rowC = el("div", "optRow");
    Data.HAIRCOLORS.forEach(h=>{
      const sw = el("div", "swatch" + (G.look.hc===h.id?" on":"")); sw.style.background = h.c;
      sw.title = h.name; sw.onclick = ()=>{ G.look.hc = h.id; this.rLook(); };
      rowC.appendChild(sw);
    });
    b.appendChild(rowC);
    const rowE = el("div", "optRow");
    Data.EYECOLORS.forEach(e=>{
      const sw = el("div", "swatch" + (G.look.ec===e.id?" on":"")); sw.style.background = e.c; sw.style.width = "22px"; sw.style.height = "22px";
      sw.onclick = ()=>{ G.look.ec = e.id; this.rLook(); };
      rowE.appendChild(sw);
    });
    b.appendChild(rowE);
    // wings
    b.insertAdjacentHTML("beforeend", `<div class="statline"><b>Wings</b> — quest & shop rewards only; never dropped, traded or fused</div>`);
    const rowW = el("div", "optRow");
    const noneChip = el("div", "chip" + (!G.equip.wings?" on":""), "No wings");
    noneChip.onclick = ()=>{ G.equip.wings = null; this.rLook(); };
    rowW.appendChild(noneChip);
    G.wingsOwned.forEach(w=>{
      const chip = el("div", "chip" + (G.equip.wings===w?" on":""), Data.WINGS[w].name);
      chip.onclick = ()=>{ G.equip.wings = w; this.rLook(); };
      rowW.appendChild(chip);
    });
    if(!G.wingsOwned.length) rowW.appendChild(el("span", "note", "Earn your faction wings via quests (Lv 12) or the Shop."));
    b.appendChild(rowW);
    // weapon fx
    if(G.wfx.length){
      b.insertAdjacentHTML("beforeend", `<div class="statline"><b>Weapon FX</b></div>`);
      const rowF = el("div", "optRow");
      [null, ...G.wfx].forEach(f=>{
        const chip = el("div", "chip" + (G.activeWfx===f?" on":""), f ? Data.WFX[f].name : "None");
        chip.onclick = ()=>{ G.activeWfx = f; this.rLook(); };
        rowF.appendChild(chip);
      });
      b.appendChild(rowF);
    }
  },
  rCompanion(){
    const b = this.panelBody; b.innerHTML = "";
    b.insertAdjacentHTML("beforeend", `<div class="statline"><b>Mount</b> — increases move speed</div>`);
    const rowM = el("div", "optRow");
    [null, ...G.mounts].forEach(m=>{
      const chip = el("div", "chip" + (G.activeMount===m?" on":""), m ? `${Data.MOUNTS[m].name} (+${Math.round((Data.MOUNTS[m].spd-1)*100)}%)` : "On foot");
      chip.onclick = ()=>{ G.activeMount = m; this.rCompanion(); };
      rowM.appendChild(chip);
    });
    if(!G.mounts.length) rowM.appendChild(el("span", "note", "Earn a mount via the Roads of Dawn quest (Lv 5) or the Shop."));
    b.appendChild(rowM);
    b.insertAdjacentHTML("beforeend", `<div class="statline"><b>Pet</b> — follows you & auto-picks loot</div>`);
    const rowP = el("div", "optRow");
    [null, ...G.pets].forEach(p=>{
      const chip = el("div", "chip" + (G.activePet===p?" on":""), p ? Data.PETS[p].name : "No pet");
      chip.onclick = ()=>{ G.activePet = p; this.rCompanion(); };
      rowP.appendChild(chip);
    });
    if(!G.pets.length) rowP.appendChild(el("span", "note", "Tame pets from the Shop."));
    b.appendChild(rowP);
  },
  rSystem(){
    const b = this.panelBody; b.innerHTML = "";
    b.insertAdjacentHTML("beforeend", `<div class="statline"><b>AETHERIA</b> — offline single-player preview (v1)<br>
      Progress autosaves to this device.</div>`);
    const row = el("div"); row.style.display = "flex"; row.style.gap = "8px"; row.style.flexWrap = "wrap";
    row.appendChild(btn("Save now", "gold", ()=>{ Save.save(); this.toast("Saved!", "good"); }));
    row.appendChild(btn("Delete save", "danger", ()=>{
      if(this._confirmDel){ Save.clear(); location.reload(); }
      else { this._confirmDel = true; this.toast("Tap again to confirm deletion", "bad"); setTimeout(()=>this._confirmDel=false, 3000); }
    }));
    b.appendChild(row);
    b.insertAdjacentHTML("beforeend", `<div class="note"><b>Multiplayer & accounts:</b> built-in module (Net) is switched OFF. Everything is honestly local: no fake other players, no fake chat.
      When real servers ship, this module connects for accounts, persistent characters, world chat and a live marketplace.</div>`);
    b.insertAdjacentHTML("beforeend", `<div class="note"><b>Controls:</b> left stick — move · ⚔️ Attack · ✨ Skill · AUTO — auto-attack · 🧪 potions · 💬 interact.<br>
      Long-press a bag item for details. Gather herbs/ore/wood by walking close and pressing Gather.</div>`);
  },

  /* ------------ NPC dialogs ------------- */
  openNpcMenu(npc){
    const p = el("div", "panel");
    p.appendChild(headBar(`${npc.name}`, true));
    const b = el("div", "pbody");
    const lines = { elder:"May the skies keep you, wanderer.", captain:"Keep your blade sharp. The wilds bite.",
      blacksmith:"Steel doesn't fail — people do. What do you need?", merchant:"Fresh wares, fair prices!",
      storage:"Your treasures, safe as stone.", teleporter:"The Waystones hum with old magic. Where to?" };
    b.insertAdjacentHTML("beforeend", `<div class="note">${lines[npc.type]||"..."}</div>`);
    const mkOpt = (label, fn, cls) => { const bt = btn(label, cls||"", fn); bt.style.width = "100%"; bt.style.marginBottom = "6px"; return bt; };
    if(npc.type === "blacksmith"){
      b.appendChild(mkOpt("🔨 Open Craft & Forge", ()=>{ this.closeDialog(); this.openPanel("craft"); }));
      b.appendChild(mkOpt("🛒 Buy Potions", ()=>{ this.closeDialog(); openMerchBuy(true); }));
      b.appendChild(mkOpt("💰 Sell gear & materials", ()=>{ this.closeDialog(); this.openPanel("bag"); }));
    } else if(npc.type === "merchant"){
      b.appendChild(mkOpt("🧪 Buy potions", ()=>{ this.closeDialog(); openMerchBuy(true); }));
      b.appendChild(mkOpt("💰 Sell materials", ()=>{ this.closeDialog(); openMerchSellMats(); }));
      b.appendChild(mkOpt("⚖️ Marketplace preview", ()=>{ this.closeDialog(); this.openPanel("market"); }));
    } else if(npc.type === "storage"){
      b.appendChild(mkOpt("📦 Open storage", ()=>{ this.closeDialog(); this.rStash(); }));
    } else if(npc.type === "teleporter"){
      b.appendChild(mkOpt(`🌀 Travel (${teleportCost()}g)`, ()=>{ this.closeDialog(); this.openPanel("map"); }));
    } else {
      b.insertAdjacentHTML("beforeend", `<div class="note">“${npc.type==="elder" ? "The old Warden of the Tower watches us still... grow strong, {NAME}." : "Reduction of bandit activity around Stonewatch is a priority."}”</div>`);
      b.appendChild(mkOpt("📜 View quests", ()=>{ this.closeDialog(); this.openPanel("quests"); }));
    }
    p.appendChild(b);
    this.openDialog(p);
    const save = ()=>{ Save.save(); };
  },
  rStash(){
    const p = el("div", "panel");
    p.appendChild(headBar("📦 Storage", true));
    const b = el("div", "pbody");
    const render = ()=>{
      b.innerHTML = "";
      b.insertAdjacentHTML("beforeend", `<div class="statline">Tap to move between bag and storage.</div>
        <div style="font-size:11px;color:#9aa3c8;margin-bottom:4px">BAG</div>`);
      const g1 = el("div", "grid"); g1.style.marginBottom = "8px";
      G.inv.forEach(it=>{ const c = cellForSmall(it); if(it) c.onclick = ()=>{ if(it.stack) stashMoveStack(it.stack, it.n, true); else stashMove(it.uid, true); render(); }; g1.appendChild(c); });
      b.appendChild(g1);
      b.insertAdjacentHTML("beforeend", `<div style="font-size:11px;color:#9aa3c8;margin-bottom:4px">STORAGE</div>`);
      const g2 = el("div", "grid");
      G.stash.forEach(it=>{ const c = cellForSmall(it); if(it) c.onclick = ()=>{ if(it.stack) stashMoveStack(it.stack, it.n, false); else stashMove(it.uid, false); render(); }; g2.appendChild(c); });
      b.appendChild(g2);
    };
    render();
    p.appendChild(b);
    this.openDialog(p);
  },
  openNpcOffer(npc, offers){
    const p = el("div", "panel");
    p.appendChild(headBar(`${npc.name}`, true));
    const b = el("div", "pbody");
    offers.forEach(q=>{
      const text = q.wake ? q.wake.replace("{NAME}", G.name) : q.main ? "The road ahead is dangerous. Will you help?" : "Need a hand, traveler?";
      b.insertAdjacentHTML("beforeend", `<div class="statline"><b style="color:#ffdf8a">${q.main?"★ ":""}${q.name}</b> <span style="color:#9aa3c8">(Lv ${q.lv}+)</span><br>${text}${rewardHTML(q)}</div>`);
      const bt = btn("Accept Quest", "gold", ()=>{ Quest.offer(q); this.closeDialog(); this.toast("Quest accepted: "+q.name, "gold"); });
      bt.style.width = "100%"; bt.style.marginBottom = "6px";
      b.appendChild(bt);
    });
    p.appendChild(b);
    this.openDialog(p);
  },
  openNpcTurnIn(npc, claims){
    const p = el("div", "panel");
    p.appendChild(headBar(`${npc.name}`, true));
    const b = el("div", "pbody");
    b.insertAdjacentHTML("beforeend", `<div class="note">Well done! I have something for you…</div>`);
    claims.forEach(q=>{
      b.insertAdjacentHTML("beforeend", `<div class="statline"><b style="color:#ffdf8a">${q.name}</b> complete!${rewardHTML(q)}</div>`);
      const bt = btn("Claim Reward", "gold", ()=>{ Quest.claim(q); this.closeDialog(); });
      bt.style.width = "100%"; bt.style.marginBottom = "6px";
      b.appendChild(bt);
    });
    p.appendChild(b);
    this.openDialog(p);
  },
  openDungeonPicker(dgs){
    const p = el("div", "panel");
    p.appendChild(headBar("🌀 Dungeon Portal", true));
    const b = el("div", "pbody");
    dgs.forEach(dg=>{
      const cleared = G.dungeonClears[dg.id] || 0;
      b.insertAdjacentHTML("beforeend", rowOf(
        `<div class="grow"><div class="name">${dg.name}</div><div class="sub">Lv ${dg.lv} dungeon · boss: ${Data.DBOSS[dg.boss].name}${cleared?" · cleared ×"+cleared:"+ first-clear +25 Gems"}</div></div>`,
        `<button class="btn small gold" data-dg="${dg.id}">Enter</button>`));
    });
    b.querySelectorAll("[data-dg]").forEach(x=> x.onclick = ()=>{ this.closeDialog(); GM_enterMap(x.dataset.dg); });
    p.appendChild(b);
    this.openDialog(p);
  },
};

/* -------- helpers -------- */
function headBar(title, closable){
  const h = el("div", "phead");
  h.innerHTML = `<h3>${title}</h3><span class="sp"></span>`;
  if(closable){
    const x = el("button", "pclose", "✕");
    x.onclick = ()=> UI.closeDialog();
    h.appendChild(x);
  }
  return h;
}
function btn(label, cls, fn){
  const b = el("button", "btn " + (cls||""), label);
  b.onclick = e => { AudioS.tap(); fn(e); };
  return b;
}
function rowOf(leftHTML, rightHTML){
  return `<div class="row">${leftHTML}<span class="sp" style="flex:1"></span>${rightHTML||""}</div>`;
}
function iconFor(it){
  if(it.stack) return Sprites.iconMat(it.stack);
  const tpl = Data.ITEMS[it.tpl];
  return Sprites.icon(tpl.slot, tpl.cls === "any" ? G.cls : tpl.cls, CONFIG.rares[it.q].col);
}
function cellFor(it, sel){
  const c = el("div", "cell" + (sel ? " sel" : ""));
  if(it){
    const cv = el("canvas"); cv.width = 48; cv.height = 48;
    cv.getContext("2d").drawImage(iconFor(it), 0, 0);
    c.appendChild(cv);
    if(!it.stack){
      c.style.borderColor = CONFIG.rares[it.q].col;
      const tierMark = it.tier === 2 ? "⁺" : it.tier === 1 ? "⁺⁺" : "";
      c.appendChild(el("span", "n", tierMark || ""));
    } else c.appendChild(el("span", "n", "×" + it.n));
  }
  return c;
}
function cellForSmall(it){
  const c = el("div", "cell");
  if(it){
    const cv = el("canvas"); cv.width = 48; cv.height = 48;
    cv.getContext("2d").drawImage(iconFor(it), 0, 0);
    c.appendChild(cv);
    if(it.stack) c.appendChild(el("span", "n", "×" + it.n));
  }
  return c;
}
function showItemInfo(it, equipped){
  const tpl = Data.ITEMS[it.tpl];
  const q = CONFIG.rares[it.q];
  const p = el("div", "panel");
  p.style.width = "min(88vw,420px)";
  p.appendChild(headBar(q.name + " " + (tpl.stone ? "Stone" : "") + " · Tier T" + it.tier, true));
  const b = el("div", "pbody");
  b.insertAdjacentHTML("beforeend", `<div class="statline">
    <b style="color:${q.col}">${itemLabel(it)}</b> — ${Data.SLOTNAME[tpl.slot]||tpl.slot}<br>
    Class: ${tpl.cls === "any" ? "Any" : Data.CLASSES[tpl.cls].name} · Item level ${tpl.ilvl}<br>
    <b>${statLine(it)}</b><br>
    Value: <b>~${itemValue(it)} gold</b> · fusion fee ${CONFIG.prices.fusionFee[it.q]}g</div>
    ${tpl.stone ? `<div class="note">Boss stone — cannot be traded or fused.</div>` : ""}`);
  if(equipped){
    const bt = btn("Unequip", "danger", ()=>{ unequip(tpl.slot); UI.closeDialog(); });
    bt.style.width = "100%"; b.appendChild(bt);
  }
  p.appendChild(b);
  UI.openDialog(p);
}
function statLine(it){
  const s = itemStats(it);
  const names = { atk:"ATK", def:"DEF", hp:"HP", mp:"MP", crit:"CRIT%", spd:"SPD" };
  return Object.entries(s).filter(([k,v])=>v).map(([k,v])=>`${names[k]||k} +${v}${k==="spd"?"":k==="crit"?"":""}`).join(" · ") || "—";
}
function playerSummaryHTML(){
  return `<div class="statline">
    <b>${G.name}</b> · Lv ${G.lv} ${Data.CLASSES[G.cls].name} · ${Data.FACTIONS[G.faction].name}<br>
    ATK <b>${atkPower().toFixed(1)}</b> · DEF <b>${defPower().toFixed(1)}</b> · CRIT <b>${(critChance()*100).toFixed(0)}%</b><br>
    HP <b>${maxHp()}</b> · MP <b>${maxMp()}</b> · Move <b>${(moveSpd()).toFixed(1)}</b></div>`;
}
function questRow(q, prog){
  const s = G.quests[q.id];
  return rowOf(
    `<div class="grow"><div class="name" style="color:${q.main?"#ffdf8a":"#a8e0ff"}">${q.main?"★ ":""}${q.name}</div>
     <div class="sub">${prog || "In progress..."}</div></div>`);
}
function rewardHTML(q){
  const rw = q.rw || {};
  const bits = [];
  if(rw.gold) bits.push(`${rw.gold}g`); if(rw.xp) bits.push(`${rw.xp} XP`);
  if(rw.gems) bits.push(`${rw.gems}◈`); if(rw.items) bits.push(rw.items.map(i=>i.n+"× "+(Data.USES[i.id]?Data.USES[i.id].name:"item")).join(", "));
  if(rw.itemGen) bits.push(`${CONFIG.rares[rw.itemGen.q].name} ${Data.SLOTNAME[rw.itemGen.slot]}`);
  if(rw.mount) bits.push("Mount: "+Data.MOUNTS[rw.mount].name);
  if(rw.wings) bits.push("Wings: "+Data.WINGS[rw.wings].name);
  return bits.length ? `<div class="sub" style="color:#c8e8a8">Rewards: ${bits.join(" · ")}</div>` : "";
}
function mobName(id){ return Data.MONS[id]?.name || id; }
function bossName(id){ return (Data.BOSSES[id] || Data.DBOSS[id])?.name || id; }
function npcName(npcId){
  const [town, type] = npcId.split("_");
  return (Data.NPCTITLES[type] || type) + " (" + townName(town) + ")";
}
function npcTown(npcId){
  const [town] = npcId.split("_");
  return townName(town);
}
function townName(tid){
  for(const r of Data.REGIONS){ if(r.town && r.town.id === tid) return r.town.name; }
  return tid;
}
function findShopEntry(id){
  for(const cat in Data.SHOP){ const e = Data.SHOP[cat].find(x=>x.id===id); if(e) return e; }
  return null;
}
/* merchant popups */
function openMerchBuy(potionsOnly){
  const p = el("div", "panel");
  p.appendChild(headBar("🛒 Buy — Merchant", true));
  const b = el("div", "pbody");
  Object.entries(Data.USES).forEach(([id, u])=>{
    b.insertAdjacentHTML("beforeend", rowOf(
      `<div class="grow"><div class="name">${u.name}</div><div class="sub">${u.heal?"Restores "+u.heal+" HP":"Restores "+u.mana+" MP"} · owned ${countStack(id)}</div></div>`,
      `<button class="btn small gold" data-bu="${id}">${u.price}g</button>`));
  });
  b.querySelectorAll("[data-bu]").forEach(x=> x.onclick = ()=>{ merchantBuy(x.dataset.bu); UI.closeDialog(); openMerchBuy(true); });
  p.appendChild(b);
  UI.openDialog(p);
}
function openMerchSellMats(){
  const p = el("div", "panel");
  p.appendChild(headBar("💰 Sell materials", true));
  const b = el("div", "pbody");
  Object.entries(Data.MATS).filter(([id,m])=>!m.boss && countStack(id) > 0).forEach(([id, m])=>{
    b.insertAdjacentHTML("beforeend", rowOf(
      `<div class="grow"><div class="name">${m.name}</div><div class="sub">${m.price}g each · owned ${countStack(id)}</div></div>`,
      `<button class="btn small gold" data-sell="${id}">Sell all</button>`));
  });
  if(!b.innerHTML.includes("data-sell")) b.insertAdjacentHTML("beforeend", `<div class="note">No materials to sell.</div>`);
  b.querySelectorAll("[data-sell]").forEach(x=> x.onclick = ()=>{ sellStack(x.dataset.sell, 999); UI.closeDialog(); openMerchSellMats(); });
  p.appendChild(b);
  UI.openDialog(p);
}

/* tiny sound feedback (WebAudio, no assets) */
const AudioS = (()=>{
  let ctx;
  return {
    tap(){ try{ ctx ||= new (window.AudioContext||window.webkitAudioContext)(); const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 620; g.gain.value = 0.03; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.04); }catch(e){} },
  };
})();
