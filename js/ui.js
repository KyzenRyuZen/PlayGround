/* ============================================================
   AETHERIA — UI: isometric renderer, HUD, panels, NPC dialogs,
   character creation. Touch-first DOM UI over a canvas world.
   ============================================================ */
window.UI = (function () {
  'use strict';
  const D = window.DATA;
  let canvas, ctx, zoom = 1.25, vw = 0, vh = 0;
  const $ = id => document.getElementById(id);
  const el = {};
  let ftexts = [], minimapT = 0, hudT = 0, saveT = 0;
  let openPanelName = null, selectedStoneUid = null;

  /* ============ boot ============ */
  function init() {
    el.canvas = $('gameCanvas'); ctx = el.canvas.getContext('2d');
    el.hpBar = $('barHP'); el.mpBar = $('barMP'); el.xpBar = $('barXP');
    el.hpText = $('hpText'); el.mpText = $('mpText'); el.xpText = $('xpText');
    el.gold = $('curGold'); el.gems = $('curGems');
    el.regionName = $('regionName'); el.minimap = $('minimap');
    el.miniCtx = el.minimap.getContext('2d');
    el.joyBase = $('joyBase'); el.joyStick = $('joyStick'); el.joyZone = $('joystickZone');
    el.toast = $('toastWrap'); el.pickup = $('pickupLog');
    el.tracker = $('questTracker');
    sidebarButtons();
    resize();
    window.addEventListener('resize', resize);
  }
  function sidebarButtons() {
    $('btnChar').onclick = () => togglePanel('char');
    $('btnInv').onclick = () => togglePanel('inv');
    $('btnEquip').onclick = () => togglePanel('equip');
    $('btnQuests').onclick = () => togglePanel('quests');
    $('btnShop').onclick = () => togglePanel('shop');
    $('btnMenu').onclick = () => togglePanel('menu');
    $('btnPotHP').onclick = () => Game.drinkPotion('hp');
    $('btnPotMP').onclick = () => Game.drinkPotion('mp');
    $('btnMount').onclick = onMountBtn;
    $('btnAuto').onclick = () => {
      const s = Game.state;
      Game.toggleAuto(!s.settings.autoAttack);
      $('btnAuto').classList.toggle('on', s.settings.autoAttack);
      toast(`Auto-attack ${s.settings.autoAttack ? 'ON' : 'OFF'}`, '');
    };
    $('btnAttack').onclick = () => Game.playerAttack();
    $('btnSkill').onclick = () => Game.useSkill();
    $('btnInteract').onclick = () => Game.doInteract();
  }
  function togglePanel(name) {
    if (openPanelName === name) { closePanel(); return; }
    openPanel(name);
  }
  function closePanel() { openPanelName = null; $('modal').classList.add('hidden'); }
  function openPanel(name, arg) {
    openPanelName = name;
    $('modal').classList.remove('hidden');
    const box = $('modalBox');
    box.innerHTML = '';
    ({ inv: panelInv, equip: panelEquip, char: panelChar, quests: panelQuests, shop: panelShop, craft: panelCraft, fusion: panelFusion, market: panelMarket, storage: panelStorage, menu: panelMenu, sell: panelSell, teleport: panelTeleport }[name] || (() => { }))(box, arg);
  }
  function refreshPanels() { if (openPanelName) openPanel(openPanelName); }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = window.innerWidth; vh = window.innerHeight;
    el.canvas.width = vw * dpr; el.canvas.height = vh * dpr;
    el.canvas.style.width = vw + 'px'; el.canvas.style.height = vh + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    zoom = clamp(vw / 380, 1.15, 2.0);
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ============ iso helpers ============ */
  const TW = () => World.TW, TH = () => World.TH;
  function isoOf(e) { return { x: (e.x - e.y) * TW() / 2, y: (e.x + e.y) * TH() / 2 }; }

  /* ============ main render ============ */
  function render(dt) {
    const wd = Game.region();
    if (!wd) return;
    const pre = World.ensurePrerender(wd);
    if (!pre) return;
    ctx.imageSmoothingEnabled = false;
    // camera
    const p = Game.player();
    if (!p) return;
    const camX = (p.x - p.y) * TW() / 2, camY = (p.x + p.y) * TH() / 2;
    const sX = isoX => (isoX - camX) * zoom + vw / 2;
    const sY = isoY => (isoY - camY) * zoom + vh / 2 + TH() * zoom / 2 - 36;
    const fade = Game.live.fade || 0;
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, vw, vh);
    const sx0 = sX(0 - wd.px0), sy0 = sY(0 - wd.py0);
    ctx.drawImage(pre, sx0, sy0, pre.width * zoom, pre.height * zoom);

    /* drops */
    for (const d of Game.drops()) {
      const iso = isoOf(d);
      const sx = sX(iso.x), sy = sY(iso.y);
      if (d.gold !== undefined) {
        drawCoin(sx, sy, d.gold);
      } else if (d.item) {
        const c = D.RARITY_COLOR[d.item.rarity];
        ctx.globalAlpha = .5 + Math.sin(performance.now() / 200 + d.t * 9) * .3;
        ctx.fillStyle = c + '44';
        ctx.beginPath(); ctx.ellipse(sx, sy, 16, 9, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        glintBox(sx, sy - 12, d.item.icon, c);
      } else if (d.matShow) {
        glintBox(sx, sy - 10, d.matShow.icon, '#8ff5a8');
      }
    }

    /* NPCs */
    const pd = isoOf(p);
    for (const npc of wd.npcs) {
      const iso = isoOf(npc);
      const sx = sX(iso.x), sy = sY(iso.y);
      const spr = SPR.playerSprite({ gender: 'male', hair: 0, hairCol: '#5a4633', eye: '#333', outfit: 0, cls: npc.icon === '🔧' ? 'warrior' : npc.icon === '🧙' ? 'mage' : 'assassin', costume: null }, 0, false);
      ctx.drawImage(spr, sx - spr.width * zoom / 2, sy - spr.height * zoom + 26 * zoom);
      label(sx, sy - 40 * zoom, npc.name, '#ffd77a', 10);
    }

    /* monsters */
    for (const m of Game.monsters()) {
      if (m.dead) continue;
      const iso = isoOf(m);
      const sx = sX(iso.x), sy = sY(iso.y);
      const f = Math.floor(m.anim) % 2;
      const base = SPR.monsterSprite(m.kind, m.tone, f);
      const sc = 1.4 * (m.size || 1) * zoom;
      const spr = SPR.scaled(base, sc);
      ctx.drawImage(spr, sx - spr.width / 2, sy - spr.height + 14 * zoom);
      // hp bar
      const w = Math.max(26, spr.width * .7);
      const hpy = sy - spr.height - 8 * zoom;
      if (m.hp < m.maxhp || m.boss || m.elite) {
        ctx.fillStyle = '#000a'; ctx.fillRect(sx - w / 2, hpy, w, 4);
        const frac = clamp(m.hp / m.maxhp, 0, 1);
        ctx.fillStyle = frac > .5 ? '#5fd35f' : frac > .25 ? '#ffd77a' : '#ff5a5a';
        ctx.fillRect(sx - w / 2, hpy, w * frac, 4);
      }
      if (m.boss || m.elite) label(sx, hpy - 12, `${m.name} (${m.lvl})`, m.boss ? '#ff8f8f' : '#c4a2ff', m.boss ? 11 : 9);
      // aggro marker
      if (m.aggro) { ctx.font = `${9 * zoom}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('❗', sx, hpy - 16); }
    }

    /* target ring */
    const tgt = findTargetVisual();
    if (tgt) {
      const iso = isoOf(tgt);
      ctx.strokeStyle = '#ffd77acc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sX(iso.x), sY(iso.y) + 6 * zoom, 17 * zoom, 8 * zoom, 0, 0, 7); ctx.stroke();
    }

    /* projectiles */
    for (const pr of Game.projs()) {
      const iso = isoOf(pr);
      ctx.fillStyle = pr.col;
      ctx.beginPath(); ctx.arc(sX(iso.x), sY(iso.y) - 16 * zoom, 4 * zoom, 0, 7);
      ctx.fill();
      ctx.globalAlpha = .4; ctx.beginPath(); ctx.arc(sX(iso.x), sY(iso.y) - 16 * zoom, 7 * zoom, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* pet */
    const pet = Game.pet();
    if (pet) {
      const iso = isoOf(pet);
      const spr = SPR.petSprite(pet.id, Math.floor(performance.now() / 160) % 2);
      ctx.drawImage(spr, (sX(iso.x)) - spr.width * zoom / 2, (sY(iso.y)) - spr.height * zoom + 8 * zoom);
    }

    /* player */
    if (!p.dead) {
      const f = p.moving ? Math.floor(performance.now() / 140) % 2 : 0;
      const bob = p.moving ? Math.sin(performance.now() / 120) * 1.4 : 0;
      let px = sX(pd.x), py = sY(pd.y) + bob * zoom;
      if (p.mountOn && Game.state.using.mount) {
        const ms = SPR.mountSprite(Game.state.using.mount, f);
        ctx.drawImage(ms, px - ms.width * zoom / 2, py - ms.height * zoom + 26 * zoom);
        const sprite = SPR.scaled(baseSprite(f, false), .85 * zoom);
        ctx.drawImage(sprite, px - sprite.width / 2, py - sprite.height * zoom - 26 * zoom);
      } else {
        const sprite = baseSprite(f, true);
        ctx.drawImage(sprite, px - sprite.width * zoom / 2, py - sprite.height * zoom + 26 * zoom);
      }
      // name
      label(px, py - 66 * zoom, `${Game.state.char.name} (Lv ${Game.state.char.lvl})`, '#cfe1ff', 10);
    } else {
      // tombstone respawn
      ctx.font = '26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('💀', sX(pd.x), sY(pd.y));
      label(sX(pd.x), sY(pd.y) - 30, 'Respawning…', '#ff8f8f', 11);
    }

    /* interact hint */
    const it = Game.interactTarget();
    if (it) {
      const target = it.type === 'npc' ? it.data : it.type === 'gather' ? it.data : it.data;
      const iso = isoOf(target);
      const yy = sY(iso.y) - 52 * zoom + Math.sin(performance.now() / 250) * 3;
      ctx.font = `${13 * zoom}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('💬', sX(iso.x), yy);
    }

    /* particles */
    for (const pa of Game.parts()) {
      const iso = isoOf(pa);
      const sx = sX(iso.x), sy = sY(iso.y) - 20 * zoom;
      const a = 1 - pa.t / pa.life;
      ctx.globalAlpha = Math.max(0, a);
      if (pa.icon) { ctx.font = `${10 * zoom}px sans-serif`; ctx.fillText(pa.icon, sx, sy); }
      else {
        ctx.fillStyle = pa.col;
        const s = pa.light ? 2.4 : 3.2;
        ctx.fillRect(sx, sy, s * zoom, s * zoom);
      }
      ctx.globalAlpha = 1;
    }

    /* floating texts */
    for (const ft of ftexts) {
      const iso = isoOf(ft.e);
      ctx.globalAlpha = Math.max(0, 1 - ft.t / .9);
      ctx.font = `800 ${(ft.big ? 13 : 10) * zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000a';
      ctx.fillText(ft.txt, sX(iso.x) + 1, sY(iso.y) - ft.t * 34 - 30);
      ctx.fillStyle = ft.col;
      ctx.fillText(ft.txt, sX(iso.x), sY(iso.y) - ft.t * 34 - 31);
      ctx.globalAlpha = 1;
    }

    if (fade > 0) { ctx.fillStyle = `rgba(4,6,12,${.85 * fade})`; ctx.fillRect(0, 0, vw, vh); }
  }

  function baseSprite(frame, wings) {
    const cfg = Game.charAppear();
    cfg.cls = Game.state.char.cls;
    return SPR.playerSprite(cfg, frame, wings && Game.wingsVisible());
  }
  function drawCoin(sx, sy, gold) {
    ctx.font = `${14 * zoom}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('💰', sx, sy + 6);
    label(sx, sy - 8, `${gold}`, '#ffd77a', 8);
  }
  function glintBox(sx, sy, icon, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.strokeRect(sx - 9, sy - 9, 18, 18);
    ctx.font = `${11 * zoom}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(icon, sx, sy + 4);
  }
  function label(x, y, txt, col, size) {
    ctx.font = `700 ${size * Math.max(1, zoom * .85)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000c'; ctx.fillText(txt, x + 1, y + 1);
    ctx.fillStyle = col; ctx.fillText(txt, x, y);
  }
  function findTargetVisual() {
    const C = D.CLASSES[Game.state.char.cls];
    let best = null, bd = C.range + .6;
    for (const m of Game.monsters()) {
      if (m.dead) continue;
      const gp = Game.player();
      const d = Math.hypot(gp.x - m.x, gp.y - m.y);
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  /* ============ HUD tick ============ */
  function tickHud(dt) {
    hudT -= dt;
    if (hudT > 0) return;
    hudT = .12;
    const s = Game.state; if (!s) return;
    const p = Game.player(); if (!p) return;
    const st = Game.playerStats();
    el.hpBar.style.width = clamp(p.hp / p.maxhp * 100, 0, 100) + '%';
    el.mpBar.style.width = clamp(p.mp / p.maxmp * 100, 0, 100) + '%';
    el.hpText.textContent = `${Math.ceil(p.hp)}/${Math.round(p.maxhp)}`;
    el.mpText.textContent = `${Math.ceil(p.mp)}/${Math.round(p.maxmp)}`;
    const need = Game.xpNeeded(s.char.lvl);
    el.xpBar.style.width = clamp(s.char.xp / need * 100, 0, 100) + '%';
    el.xpText.textContent = `Lv ${s.char.lvl}`;
    el.gold.textContent = Math.round(s.acct.gold).toLocaleString();
    el.gems.textContent = s.acct.gems;
    currency();
    // skill cooldown
    const C = D.CLASSES[s.char.cls], S = C.skill;
    const nowS = performance.now() / 1000;
    const remain = p.skillCd - nowS;
    $('skillName').textContent = S.name;
    $('skillIcon').textContent = S.icon;
    if (remain > .1) {
      $('btnSkill').classList.add('cd'); $('btnSkill').classList.remove('ready');
      $('skillCd').textContent = Math.ceil(remain);
    } else {
      $('btnSkill').classList.remove('cd'); $('btnSkill').classList.add('ready');
      $('skillCd').textContent = '';
    }
    $('btnAuto').classList.toggle('on', s.settings.autoAttack);
    $('btnMount').classList.toggle('summoned', p.mountOn);
    // minimap
    minimapT -= .12;
    if (minimapT <= 0) { minimapT = .5; drawMinimap(); }
    trackQuestCurrent();
    // autosave
    saveT -= .12; if (saveT <= 0) { saveT = 8; Game.save(); }
  }

  function currency() {
    const s = Game.state; if (s) {
      el.gold.textContent = Math.round(s.acct.gold).toLocaleString();
      el.gems.textContent = s.acct.gems;
    }
  }
  function potionCounts() {
    const s = Game.state; if (!s) return;
    const hp = $('potHPCount'), mp = $('potMPCount');
    hp.textContent = s.potions.hp === undefined ? 0 : s.potions.hp;
    mp.textContent = s.potions.mp === undefined ? 0 : s.potions.mp;
    hp.classList.toggle('zero', !s.potions.hp);
    mp.classList.toggle('zero', !s.potions.mp);
  }
  function onMountBtn() {
    const s = Game.state;
    if (s.using.mount) { Game.toggleCosmetic('mount', s.using.mount); return; }
    const owned = s.unlocked.mounts || [];
    if (owned.length) { Game.toggleCosmetic('mount', owned[0]); return; }
    toast('No mounts yet — visit the Gilded Boutique in town!', 'bad');
  }

  function drawMinimap() {
    const L = Game.live, wd = Game.region();
    if (!wd || !L.minimapCache) return;
    const c = L.minimapCache;
    const mc = el.miniCtx, cv = el.minimap;
    mc.clearRect(0, 0, cv.width, cv.height);
    mc.drawImage(c.cv, 0, 0, cv.width, cv.height);
    // dots (transform via closure funcs)
    const toXY = (x, y) => {
      const p = { x: (x - y) * World.TW / 2, y: (x + y) * World.TH / 2 };
      return [c.tx({ x: p.x, y: p.y }), c.ty({ x: p.x, y: p.y })];
    };
    const pl = Game.player();
    if (pl) {
      const [x, y] = toXY(pl.x, pl.y);
      mc.fillStyle = '#5cff5c'; mc.beginPath(); mc.arc(x, y, 3, 0, 7); mc.fill();
      // view cone
      mc.fillStyle = '#5cff5c33'; mc.beginPath(); mc.arc(x, y, 7, 0, 7); mc.fill();
    }
    for (const m of Game.monsters()) {
      if (m.dead) continue;
      if (Math.hypot(m.x - pl.x, m.y - pl.y) > 24) continue;
      const [x, y] = toXY(m.x, m.y);
      mc.fillStyle = m.boss ? '#ff2a2a' : m.elite ? '#c46aff' : '#ff6a6a';
      mc.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    for (const n of wd.npcs) {
      const [x, y] = toXY(n.x, n.y);
      mc.fillStyle = '#ffd77a'; mc.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    for (const d of Game.drops()) {
      if (d.item) {
        const [x, y] = toXY(d.x, d.y);
        mc.fillStyle = D.RARITY_COLOR[d.item.rarity]; mc.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }

  /* ============ toasts / floaters ============ */
  function toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = msg;
    el.toast.appendChild(t);
    setTimeout(() => t.remove(), 2400);
    while (el.toast.children.length > 4) el.toast.firstChild.remove();
  }
  function floatText(e, txt, col, big) {
    ftexts.push({ e: { x: e.x, y: e.y }, txt, col, t: 0, big });
    if (ftexts.length > 40) ftexts.shift();
  }
  function pickup(txt, col) {
    const t = document.createElement('div');
    t.className = 'pick'; t.style.color = col; t.textContent = txt;
    el.pickup.appendChild(t);
    setTimeout(() => t.remove(), 2300);
    while (el.pickup.children.length > 5) el.pickup.firstChild.remove();
    currency();
    potionCounts();
  }
  function interact(target) {
    const btn = $('btnInteract');
    if (!btn) return;
    if (target) {
      btn.classList.remove('hidden');
      $('interactLabel').textContent = target.label;
    } else btn.classList.add('hidden');
  }
  function flashSkill(name) {
    const b = $('btnSkill');
    b.classList.add('ready');
    toast(`${name}!`, '');
  }

  /* ============ quest tracker ============ */
  function trackQuest(q, qs) {
    el.tracker.innerHTML = '';
    const objs = q.objs.map((o, i) => {
      const n = qs.p[i] || 0;
      const done = n >= o.n;
      return `<div class="qobj ${done ? 'done' : ''}">${done ? '✔' : '•'} ${o.type === 'kill' ? 'Slay' : o.type === 'boss' ? 'Defeat' : o.type === 'collect' ? 'Gather' : o.type === 'reach' ? 'Reach' : o.type === 'talk' ? 'Speak to' : o.type === 'fuse' ? 'Fuse' : o.type === 'deposit' ? 'Deposit' : ''} ${o.target ? o.target : ''} ${o.n ? `${n}/${o.n}` : ''}</div>`;
    }).join('');
    el.tracker.innerHTML = `<b>${q.name}</b>${objs}`;
  }
  function trackQuestCurrent() {
    const s = Game.state; if (!s) return;
    const act = Game.activeQuests();
    const t = act.find(q => s.quests.active[q.id] && !s.quests.active[q.id].done);
    if (t) trackQuest(t, s.quests.active[t.id]);
    else if (act.length) { const q = act[0]; const qs = s.quests.active[q.id]; el.tracker.innerHTML = `<b>${q.name}</b><div class="qobj done">Complete — return to giver!</div>`; }
    else el.tracker.innerHTML = '';
  }
  function onRegionChanged(R) {
    el.regionName.textContent = R.name;
    const L = Game.live;
    L.fade = 1;
    toast(`📍 ${R.name}`, 'gold');
    potionCounts();
    $('skillName').textContent = D.CLASSES[Game.state.char.cls].skill.name;
  }

  /* ============================================================
     PANELS
     ============================================================ */
  function panelHead(box, title, onClose) {
    const head = document.createElement('div');
    head.className = 'panel-head';
    head.innerHTML = `<div class="panel-title">${title}</div><button class="panel-x">✕</button>`;
    head.querySelector('.panel-x').onclick = onClose || (() => { closePanel(); openPanelName = null; });
    box.appendChild(head);
    return head;
  }
  function bodyOf(box) {
    const b = document.createElement('div');
    b.className = 'panel-body';
    box.appendChild(b);
    return b;
  }

  /* ---------- INVENTORY ---------- */
  function panelInv(box) {
    panelHead(box, '🎒 Inventory');
    const b = bodyOf(box);
    const s = Game.state;
    const list = document.createElement('div');
    b.appendChild(list);
    const render = () => {
      list.innerHTML = '';
      if (!s.inv.length) list.innerHTML += `<div class="empty-phase">Empty bag. Defeat monsters to find loot!<br>Direct drops: Common 60% · Grey 25% · Green 10% · Blue 5% (always T3)</div>`;
      s.inv.forEach(it => {
        const row = document.createElement('div');
        row.className = 'item-row';
        if (it.kind === 'gear') {
          row.innerHTML = itemRowHTML(it, `<button class="min-btn gold" data-act="equip">Equip</button><button class="min-btn" data-act="sell">Sell ${it.value}g</button>`);
        } else if (it.kind === 'stone') {
          row.innerHTML = itemRowHTML(it, `<button class="min-btn green" data-act="view">Bonus</button>`);
        }
        row.querySelectorAll('[data-act]').forEach(btn => btn.onclick = () => {
          const act = btn.dataset.act;
          if (act === 'equip') Game.equipItem(it.uid);
          if (act === 'sell') Game.sellItem(it.uid);
          if (act === 'view') {
            const lines = it.bonuses.map(b2 => `+${formatBonus(b2)}`).join(' · ') || 'No bonus';
            toast(`${it.name}: ${lines}`, 'gold');
          }
          render();
        });
        list.appendChild(row);
      });
      const hint = document.createElement('div');
      hint.innerHTML = `<small class="hint">Tap EQUIP to wear gear. Sell junk for gold. Fusion at the Blacksmith: 4 identical → upgrade.</small>`;
      list.appendChild(hint);
      // materials & consumables bank
      const mats = Object.entries(s.materials).filter(([, n]) => n > 0);
      let html = `<div class="divider"></div><div class="sec-title">🧪 Consumables</div>
        <div class="item-row"><div class="item-ico">🧪</div><div class="item-main"><div class="item-name">Health Potion ×${s.potions.hp}</div></div></div>
        <div class="item-row"><div class="item-ico">💧</div><div class="item-main"><div class="item-name">Mana Potion ×${s.potions.mp}</div></div></div>
        <div class="sec-title">📦 Materials</div>`;
      html += mats.length
        ? mats.map(([id, n]) => `<div class="item-row"><div class="item-ico">${D.MATERIALS[id].icon}</div><div class="item-main"><div class="item-name">${D.MATERIALS[id].name}</div><div class="item-sub">Crafting material</div></div><b style="color:#ffd77a">×${n}</b></div>`).join('')
        : `<div class="empty-phase">None yet. Gather nodes & monsters provide materials.</div>`;
      const matBox = document.createElement('div');
      matBox.innerHTML = html;
      list.appendChild(matBox);
    };
    render();
  }
  function itemRowHTML(it, actions) {
    const c = D.RARITY_COLOR[it.rarity];
    const stats = it.stats ? Object.entries(it.stats).map(([k, v]) => `+${(k === 'crit' ? Math.round(v * 100) + '% Crit' : k === 'critDmg' ? v + '% Crit Dmg' : k === 'leech' ? Math.round(v * 100) + '% Life Steal' : '+' + v + ' ' + k.toUpperCase())}`).join(' · ') : '';
    const bon = (it.bonuses || []).map(b => `+${formatBonus(b)}`).join(' · ');
    const meta = `${['weapon','head','chest','hands','legs','feet','ring','amulet','cloak'].includes(it.slot) ? slotLabel(it.slot) : ''}${it.kind === 'gear' ? ` · T${it.tier} · ${it.rarity}` : it.kind === 'stone' ? ` · ${it.rarity} · ${it.bonuses.length} bonus` : ''} ${it.lvl ? '· Lv' + it.lvl : ''}`;
    return `<div class="item-ico" style="color:${c}">${it.icon}</div>
      <div class="item-main"><div class="item-name" style="color:${c}">${it.name}</div>
      <div class="item-sub">${meta}${stats ? `<div class="item-stats">${stats}</div>` : ''}${bon ? `<div class="item-stats" style="color:#ffd77a">${bon}</div>` : ''}</div></div>
      <div class="item-btns">${actions}</div>`;
  }
  const SLOT_LABELS = { weapon: 'Weapon', head: 'Head', chest: 'Chest', hands: 'Hands', legs: 'Legs', feet: 'Feet', ring: 'Ring', amulet: 'Amulet', cloak: 'Cloak' };
  const slotLabel = k => SLOT_LABELS[k] || k;
  function formatBonus(b) {
    if (b.stat === 'crit') return `${Math.round(b.v * 100)}% Crit`;
    if (b.stat === 'critDmg') return `${b.v}% Crit Dmg`;
    if (b.stat === 'leech') return `${Math.round(b.v * 100)}% Life Steal`;
    return `+${b.v} ${b.stat.toUpperCase().charAt(0) + b.stat.slice(1)}`;
  }

  /* ---------- EQUIPMENT ---------- */
  function panelEquip(box) {
    panelHead(box, '⚔️ Equipment');
    const b = bodyOf(box);
    const s = Game.state, st = Game.playerStats();
    let html = '<div class="slot-grid">';
    for (const slot of D.SLOTS) {
      const it = s.equip[slot];
      html += `<div class="slot-cell" data-slot="${slot}">
        ${it ? `<span class="s-ico">${it.icon}</span><div class="s-name" style="color:${D.RARITY_COLOR[it.rarity]}">${it.name.split(' ').slice(-2).join(' ')}</div><div class="s-sub">T${it.tier} ${it.rarity}</div>` : `<span class="s-ico" style="opacity:.25">${D.SLOT_ICON[slot]}</span><div class="s-sub" style="opacity:.4">${SLOT_LABELS[slot]}</div>`}
      </div>`;
    }
    html += '</div>';
    html += `<div class="stat-grid">
      <span>Attack</span><b>${Math.round(st.atk)}</b>
      <span>Defense</span><b>${Math.round(st.def)}</b>
      <span>Health</span><b>${Math.round(st.hp)}</b>
      <span>Mana</span><b>${Math.round(st.mp)}</b>
      <span>Crit Chance</span><b>${Math.round(st.crit * 100)}% (cap 50%)</b>
      <span>Crit Damage</span><b>${Math.round(st.critDmg * 100)}%</b>
      <span>Life Steal</span><b>${Math.round(st.leech * 100)}%</b>
      <span>Speed</span><b>${st.spdTotal.toFixed(1)}</b>
    </div>`;
    b.innerHTML += html;
    b.querySelectorAll('.slot-cell').forEach(cell => {
      const slot = cell.dataset.slot;
      cell.onclick = () => {
        const it = Game.state.equip[slot];
        if (!it) { toast('Empty slot.', ''); return; }
        if (confirm(`Unequip ${it.name}?`)) { Game.unequip(slot); panelEquip(box); }
      };
    });
  }

  /* ---------- CHARACTER ---------- */
  function panelChar(box) {
    panelHead(box, '👤 Character');
    const b = bodyOf(box), s = Game.state, c = s.char;
    b.innerHTML += `<div style="text-align:center;margin-bottom:8px">
      <canvas id="charMini" width="120" height="150" style="image-rendering:pixelated;background:#0b0f1c;border-radius:12px"></canvas>
    </div>
    <div class="hero-panel">
      <div class="center" style="font-weight:900">${c.name}</div>
      <div class="center" style="font-size:12px;color:#9db1d8">Level ${c.lvl} ${D.CLASSES[c.cls].name} of the ${D.FACTIONS[c.faction].name} <br>${D.FACTIONS[c.faction].icon} ${D.using && s.acct.premium > Date.now() ? '👑 Premium' : ''}</div>
    </div>
    <div class="divider"></div>
    <div class="sec-title">Main Skill</div>
    <div class="item-row"><div class="item-ico">${D.CLASSES[c.cls].skill.icon}</div>
      <div class="item-main"><div class="item-name">${D.CLASSES[c.cls].skill.name} — Lv ${c.skillLvl}/10</div><div class="item-sub">${D.CLASSES[c.cls].skill.desc}</div></div>
      <button class="min-btn gold" id="skUp">Train</button>
    </div><small class="hint">Cost: Gold + 1 Skill Point (each level grants one).</small>
    <div class="sec-title">Cosmetics</div><div id="cosList"></div>`;
    const s0 = Game.charAppear();
    const prevSpr = SPR.playerPreview({ ...s0, cls: c.cls }, 0);
    $('charMini').getContext('2d').drawImage(prevSpr, 0, 0, 120, 150);
    $('skUp').onclick = () => { Game.upgradeSkill(); panelChar(box); };
    const cos = $('cosList');
    const rows = [];
    // wings
    const fw = D.FACTIONS[c.faction].wingsName === 'Celestial Wings' ? 'wn_celestial' : 'wn_demonic';
    const ownedWings = (s.unlocked.wings || []).slice();
    ownedWings.forEach(id => {
      const names = { wn_celestial: '🕊️ Celestial Wings', wn_demonic: '🦇 Demonic Wings', wn_golden: '🕊️ Seraphic Wings', wn_black: '🦇 Nighthawk Wings' };
      rows.push(`<div class="item-row"><div class="item-ico">${names[id] ? names[id].split(' ')[0] : '🕊️'}</div><div class="item-main"><div class="item-name">${names[id] || id}</div></div><button class="min-btn" data-w="${id}">${s.using.wings === id ? 'Hide' : 'Wear'}</button></div>`);
    });
    if (!ownedWings.length) rows.push(`<small class="hint">Wings come from faction quests or the boutique only — never drops.</small>`);
    (s.unlocked.fx || []).forEach(id => {
      const it = D.SHOP.fx.find(f => f.id === id);
      rows.push(`<div class="item-row"><div class="item-ico">${it.icon}</div><div class="item-main"><div class="item-name">${it.name}</div></div><button class="min-btn" data-fx="${id}">${s.using.fx === id ? 'Remove' : 'Apply'}</button></div>`);
    });
    cos.innerHTML = rows.join('') || `<div class="empty-phase">No cosmetics yet. The Boutique awaits!</div>`;
    cos.querySelectorAll('[data-w]').forEach(bt => bt.onclick = () => { Game.toggleCosmetic('wings', bt.dataset.w); panelChar(box); });
    cos.querySelectorAll('[data-fx]').forEach(bt => bt.onclick = () => { Game.toggleCosmetic('fx', bt.dataset.fx); panelChar(box); });
  }

  /* ---------- QUESTS ---------- */
  function panelQuests(box) {
    panelHead(box, '📜 Quests');
    const b = bodyOf(box);
    const s = Game.state;
    const act = Game.activeQuests();
    let html = '<div class="sec-title">Active</div>';
    html += act.map(q => {
      const qs = s.quests.active[q.id];
      const objs = q.objs.map((o, i) => {
        const n = Math.min(qs.p[i] || 0, o.n), done = n >= o.n;
        const names = { kill: 'Slay', boss: 'Defeat', collect: 'Gather', reach: 'Reach', talk: 'Speak with', fuse: 'Fuse items', deposit: 'Deposit items' };
        return `<div class="qobj ${done ? 'done' : ''}">${done ? '✔' : '•'} ${names[o.type]} ${o.target || ''} ${o.n > 1 ? `${n}/${o.n}` : ''}</div>`;
      }).join('');
      const rew = [`+${q.rew.xp} XP`, `+${q.rew.gold} Gold`, q.rew.gems ? `+${q.rew.gems} 💎` : '', q.rew.wings ? '🕊️ Wings' : '', q.rew.key ? '🔑 Key' : '', q.rew.stones ? '🪨 Boss Stone' : ''].filter(Boolean).join(' · ');
      return `<div class="qcard"><div class="qname">${q.main ? '⭐ ' : ''}${q.name}</div><div class="qdesc">${q.desc}</div>${objs}<div class="qrew">${rew}</div></div>`;
    }).join('') || '<div class="empty-phase">No active quests. Talk to Elder Rowan or a Faction Herald!</div>';
    html += `<div class="sec-title">Completed (${s.quests.done.length})</div><div class="empty-phase">${s.quests.done.length ? D.QUESTS.filter(q => s.quests.done.includes(q.id)).map(q => '✔ ' + q.name).join(' · ') : 'None yet — adventure calls!'}</div>`;
    b.innerHTML += html;
  }

  /* ---------- SHOP ---------- */
  function panelShop(box, startTab) {
    panelHead(box, '🛍️ Gilded Boutique');
    const b = bodyOf(box);
    const tabs = ['Costumes', 'Hairstyles', 'Mounts', 'Pets', 'Weapon FX', 'Wings', '💎 Gems', 'Premium'];
    let cur = startTab || 0;
    const render = () => {
      b.innerHTML = '';
      const tb = document.createElement('div'); tb.className = 'tabs';
      tabs.forEach((t, i) => {
        const btn = document.createElement('button');
        btn.className = 'tab' + (i === cur ? ' on' : ''); btn.textContent = t;
        btn.onclick = () => { cur = i; render(); };
        tb.appendChild(btn);
      });
      b.appendChild(tb);
      const s = Game.state;
      const row = (entry, priceTxt, owned, onBuy, onUse) => {
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `<div class="item-ico">${entry.icon}</div>
          <div class="item-main"><div class="item-name">${entry.name}</div><div class="item-sub">${entry.desc || entry.perk || ''}</div></div>
          <div class="item-btns"><button class="min-btn ${owned ? 'green' : 'gold'}">${owned ? (onUse ? 'Use' : 'Owned') : (priceTxt)}</button></div>`;
        div.querySelector('button').onclick = () => { owned ? (onUse && onUse()) : onBuy(); render(); };
        return div;
      };
      const pluralOf = { costume: 'costumes', hair: 'hairstyles', mount: 'mounts', pet: 'pets', fx: 'fx', wings: 'wings' };
      const list = el => b.appendChild(el);
      const buy = entry => { Game.buyShop(entry); };
      if (cur === 0) D.SHOP.costumes.forEach(c => list(row(c, `${c.gems} 💎`, s.unlocked.costumes.includes(c.id), () => buy(c),
        () => Game.toggleCosmetic('costume', c.id))));
      if (cur === 1) D.SHOP.hairstyles.forEach(h => list(row(h, `${h.gems} 💎`, s.unlocked.hairstyles.includes(h.id), () => buy(h),
        () => Game.toggleCosmetic('hair', h.id))));
      if (cur === 2) D.SHOP.mounts.forEach(m => list(row({ ...m, desc: `Ride speed ${(m.spd / D.CLASSES[s.char.cls].spd).toFixed(1)}x faster` }, m.gems ? `${m.gems} 💎${m.gold ? ` + ${m.gold}g` : ''}` : `${m.gold}g`,
        s.unlocked.mounts.includes(m.id), () => buy(m), () => { Game.toggleCosmetic('mount', m.id); toast('Mount summoned! 🐎', 'gold'); })));
      if (cur === 3) D.SHOP.pets.forEach(p => list(row(p, p.gems ? `${p.gems} 💎${p.gold ? ` + ${p.gold}g` : ''}` : `${p.gold}g`,
        s.unlocked.pets.includes(p.id), () => buy(p), () => Game.toggleCosmetic('pet', p.id))));
      if (cur === 4) D.SHOP.fx.forEach(f => list(row(f, `${f.gems} 💎`, s.unlocked.fx.includes(f.id), () => buy(f), () => Game.toggleCosmetic('fx', f.id))));
      if (cur === 5) D.SHOP.wings.forEach(w => list(row({ ...w, desc: `${w.faction === 'angel' ? 'Radiant seraph wings' : 'Shadow-veiled wings'} — faction: ${D.FACTIONS[w.faction].name}` }, `${w.gems} 💎`,
        s.unlocked.wings.includes(w.id) || s.unlocked.wings.some(u => u.startsWith('wn_') && u !== w.id && ((w.faction === 'angel' && u === 'wn_celestial') || (w.faction === 'demon' && u === 'wn_demonic'))), () => buy(w), () => Game.toggleCosmetic('wings', w.id))));
      if (cur === 6) {
        list(row({ icon: '💎', name: 'Earn in the world', desc: 'Boss kills, quest rewards & every 5 levels grant Gems — free-to-play friendly.' }, '', true, () => { }, null));
        D.SHOP.gems.forEach(g => list(row(g, `+${g.qty} 💎`, false, () => { Game.buyShop({ ...g, type: 'gems' }); })));
      }
      if (cur === 7) list(row({ ...D.SHOP.premium, type: 'premium' }, `${D.SHOP.premium.gems} 💎`, s.acct.premium > Date.now(), () => Game.buyShop({ ...D.SHOP.premium, type: 'premium' }), () => toast('Premium already active 👑', 'gold')));
      const note = document.createElement('small');
      note.className = 'hint';
      note.textContent = 'Aetheria is free-to-play: gems are earnable in-game; purchases in this demo are simulated and cost nothing real.';
      b.appendChild(note);
    };
    render();
  }

  /* ---------- BLACKSMITH: craft & fusion ---------- */
  function panelCraft(box) {
    panelHead(box, '⚒️ Blacksmith Bram');
    const b = bodyOf(box), s = Game.state;
    b.innerHTML += `<div class="sec-title">Upgrade skill</div>
      <button class="btn primary" id="cSkill">Train ${D.CLASSES[s.char.cls].skill.name} (Lv ${s.char.skillLvl} → ${s.char.skillLvl + 1})</button>`;
    b.innerHTML += `<div class="sec-title">Forge Legendary (recipes)</div>`;
    const stones = s.inv.filter(i => i.kind === 'stone');
    D.RECIPES.filter(r => r.cls === s.char.cls || r.cls === 'any').forEach(r => {
      const okMats = Object.entries(r.mats).every(([id, n]) => (s.materials[id] || 0) >= n);
      const matsTxt = Object.entries(r.mats).map(([id, n]) => `${D.MATERIALS[id].icon} ${n}× <span style="color:${(s.materials[id] || 0) >= n ? '#8ff5a8' : '#ff8f8f'}">${D.MATERIALS[id].name} (${s.materials[id] || 0}/${n})</span>`).join(' · ');
      const needsStone = r.stone ? ` · 1 Boss Stone ${stones.length ? `(${stones.length} available)` : '<span style="color:#ff8f8f">(none in bag!)</span>'}` : '';
      const div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML = `<div class="item-ico">📜</div><div class="item-main"><div class="item-name">${r.name}</div>
        <div class="item-sub">${matsTxt}${needsStone} · Fee ${r.fee}g</div></div>
        <div class="item-btns"><button class="min-btn gold">${okMats && stones.length ? 'Forge' : 'Missing'}</button></div>`;
      div.querySelector('button').onclick = () => {
        if (!okMats || !stones.length) { toast('Gather the materials + a Boss Stone first.', 'bad'); return; }
        const stone = s.inv.find(i => i.uid === selectedStoneUid) || stones[0];
        Game.craftRecipe(r, stone);
        panelCraft(box);
      };
      b.appendChild(div);
    });
    if (!stones.length) b.appendChild(document.createElement('div')).innerHTML = `<small class="hint">Boss Stones drop from bosses (up to 3 bonus affixes each) and are consumed in Legendary crafting.</small>`;
    else {
      const sel = document.createElement('div');
      sel.className = 'sec-title'; sel.textContent = 'Select Boss Stone';
      b.appendChild(sel);
      stones.forEach(stx => {
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = itemRowHTML(stx, `<button class="min-btn ${selectedStoneUid === stx.uid ? 'green' : ''}">${selectedStoneUid === stx.uid ? '★ Selected' : 'Select'}</button>`);
        div.querySelector('button').onclick = () => { selectedStoneUid = stx.uid; panelCraft(box); };
        b.appendChild(div);
      });
    }
    $('cSkill').onclick = () => { Game.upgradeSkill(); panelCraft(box); };
    const fb = document.createElement('button');
    fb.className = 'btn primary'; fb.textContent = '✨ Fuse identical items (T3→T2→T1→next rarity)';
    fb.onclick = () => openPanel('fusion');
    b.appendChild(fb);
  }

  function panelFusion(box) {
    panelHead(box, '✨ Fusion — 4 identical → 1 upgraded');
    const b = bodyOf(box), s = Game.state;
    const groups = {};
    s.inv.filter(i => i.kind === 'gear').forEach(it => {
      const k = Game.keyOf(it);
      (groups[k] = groups[k] || []).push(it);
    });
    const keys = Object.keys(groups);
    if (!keys.length) b.innerHTML = `<div class="empty-phase">No gear to fuse yet.<br>Drop farming → 4 copies → next tier or rarity. No items are ever destroyed randomly.</div>`;
    keys.forEach(k => {
      const arr = groups[k], repr = arr[0], c = D.RARITY_COLOR[repr.rarity];
      const fee = D.ECON.fusionFee(repr.tier);
      const out = repr.tier > 1 ? `→ T${repr.tier - 1} ${repr.rarity}` : `→ T3 ${nextRarity(repr.rarity)}`;
      const div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML = `<div class="item-ico" style="color:${c}">${repr.icon}</div>
        <div class="item-main"><div class="item-name" style="color:${c}">${repr.name} ×${arr.length}</div>
        <div class="item-sub">T${repr.tier} ${repr.rarity} ${repr.rarity === 'Divine' ? '' : out}</div>
        <div class="item-stats">Fee: ${fee} Gold</div></div>
        <div class="item-btns"><button class="min-btn ${arr.length >= 4 ? 'gold' : ''}">${arr.length >= 4 ? 'Fuse!' : `${arr.length}/4`}</button></div>`;
      div.querySelector('button').onclick = () => {
        if (repr.rarity === 'Divine' && repr.tier === 3 && repr.rarity === 'Divine') { toast('Divine is the pinnacle — nothing higher.', 'bad'); return; }
        Game.fuseGroup(k);
        panelFusion(box);
      };
      b.appendChild(div);
    });
  }
  function nextRarity(r) {
    const i = D.RARITIES.indexOf(r);
    return D.RARITIES[Math.min(7, i + 1)];
  }

  /* ---------- MERCHANT sell / potions ---------- */
  function panelSell(box) {
    panelHead(box, '🧺 Merchant Tilda');
    const b = bodyOf(box), s = Game.state;
    let html = `<div class="sec-title">Stock</div>
      <div class="item-row"><div class="item-ico">🧪</div><div class="item-main"><div class="item-name">Health Potion</div><div class="item-sub">Restores ~45% HP</div></div>
        <div class="item-btns"><button class="min-btn" data-b="hp1">${D.ECON.potionBuy.hp}g</button><button class="min-btn" data-b="hp5">×5 ${D.ECON.potionBuy.hp * 5}g</button></div></div>
      <div class="item-row"><div class="item-ico">💧</div><div class="item-main"><div class="item-name">Mana Potion</div><div class="item-sub">Restores ~55% MP</div></div>
        <div class="item-btns"><button class="min-btn" data-b="mp1">${D.ECON.potionBuy.mp}g</button><button class="min-btn" data-b="mp5">×5 ${D.ECON.potionBuy.mp * 5}g</button></div></div>
      <div class="divider"></div><div class="sec-title">Sell loot</div>`;
    b.innerHTML += html;
    b.querySelectorAll('[data-b]').forEach(bt => bt.onclick = () => {
      const v = bt.dataset.b;
      if (v === 'hp1') Game.buyPotion('hp', 1);
      if (v === 'hp5') Game.buyPotion('hp', 5);
      if (v === 'mp1') Game.buyPotion('mp', 1);
      if (v === 'mp5') Game.buyPotion('mp', 5);
      panelSell(box);
    });
    s.inv.filter(i => i.kind === 'gear').forEach(it => {
      const div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML = itemRowHTML(it, `<button class="min-btn">Sell ${Math.round(it.value * .65)}g</button>`);
      div.querySelector('button').onclick = () => {
        Game.sellItem(it.uid);
        panelSell(box);
      };
      b.appendChild(div);
    });
  }

  /* ---------- STORAGE ---------- */
  function panelStorage(box) {
    panelHead(box, '📦 Storage Keeper Miri');
    const b = bodyOf(box), s = Game.state;
    b.innerHTML += `<div class="sec-title">Vault ${s.storage.length}/60 — tap to withdraw</div>`;
    s.storage.forEach(it => {
      const div = document.createElement('div'); div.className = 'item-row';
      div.innerHTML = itemRowHTML(it, `<button class="min-btn green">Withdraw</button>`);
      div.querySelector('button').onclick = () => { Game.withdraw(it.uid); panelStorage(box); };
      b.appendChild(div);
    });
    if (!s.storage.length) b.innerHTML += `<div class="empty-phase">Vault empty — deposit items from your bag.</div>`;
    b.innerHTML += `<div class="sec-title">Bag — tap to deposit</div>`;
    s.inv.filter(i => i.kind === 'gear' || i.kind === 'stone').forEach(it => {
      const div = document.createElement('div'); div.className = 'item-row';
      div.innerHTML = itemRowHTML(it, `<button class="min-btn">Deposit</button>`);
      div.querySelector('button').onclick = () => { Game.deposit(it.uid); panelStorage(box); };
      b.appendChild(div);
    });
  }

  /* ---------- MARKETPLACE ---------- */
  function panelMarket(box) {
    panelHead(box, '💰 Broker Silas — Aetheria Marketplace');
    const b = bodyOf(box), s = Game.state;
    Game.marketTick();
    let html = `<small class="hint">Player-driven marketplace (local simulation now; listings rotate every 10. The same market API is future multiplayer-ready). Buy & sell!</small>
      <div class="sec-title">Offers from other heroes</div>`;
    b.innerHTML += html;
    s.market.listings.forEach((l, i) => {
      const div = document.createElement('div'); div.className = 'item-row';
      div.innerHTML = itemRowHTML(l.item, `<button class="min-btn gold">Buy ${l.item.value}g</button>`);
      div.querySelector('button').onclick = () => { Game.marketBuy(i); panelMarket(box); };
      b.appendChild(div);
    });
    if (!s.market.listings.length) b.innerHTML += `<div class="empty-phase">Market swept clean. Check back soon!</div>`;
    b.innerHTML += `<div class="sec-title">Sell to the heroes</div>`;
    s.inv.filter(i => i.kind === 'gear').forEach(it => {
      const price = Math.round(it.value * 1.3);
      const div = document.createElement('div'); div.className = 'item-row';
      div.innerHTML = itemRowHTML(it, `<button class="min-btn" data-q="quick">Quick ${Math.round(it.value * .65)}g</button><button class="min-btn gold" data-q="list">List ${price}g</button>`);
      div.querySelectorAll('button').forEach(bt => bt.onclick = () => {
        if (bt.dataset.q === 'quick') Game.sellItem(it.uid);
        else Game.marketListItem(it.uid, price);
        panelMarket(box);
      });
      b.appendChild(div);
    });
    if (s.market.mine && s.market.mine.length) {
      b.innerHTML += `<div class="sec-title">Your pending auctions</div>`;
      s.market.mine.forEach(l => {
        const left = Math.max(0, Math.round((l.due - Date.now()) / 1000));
        b.innerHTML += `<div class="item-row"><div class="item-ico">${l.item.icon}</div><div class="item-main"><div class="item-name">${l.item.name}</div><div class="item-sub">Listed — settles in ${left}s</div></div><b style="color:#ffd77a">${l.price}g</b></div>`;
      });
    }
  }

  /* ---------- TELEPORTER ---------- */
  function panelTeleport(box) {
    panelHead(box, '🌀 Teleporter Orin');
    const b = bodyOf(box), s = Game.state;
    D.REGIONS.forEach(R => {
      const visited = s.world.visited.includes(R.id);
      const here = s.world.regionId === R.id;
      if (!visited) {
        b.innerHTML += `<div class="item-row"><div class="item-ico">🔒</div><div class="item-main"><div class="item-name">${R.name}</div><div class="item-sub">Unexplored — travel by road first</div></div></div>`;
        return;
      }
      const fee = here ? 0 : D.ECON.teleFee(D.regionById(s.world.regionId), R);
      const okLvl = s.char.lvl >= R.minLvl;
      const div = document.createElement('div'); div.className = 'item-row';
      div.innerHTML = `<div class="item-ico">${R.id === 'greendale' ? '🌿' : R.id === 'ironcrag' ? '⛰️' : R.id === 'venomwood' ? '🕷️' : R.id === 'mistgrave' ? '🕯️' : R.id === 'frostpeak' ? '❄️' : R.id === 'sunscorch' ? '🏜️' : R.id === 'ashen' ? '🔥' : '💠'}</div>
        <div class="item-main"><div class="item-name">${R.name}</div><div class="item-sub">Lv ${R.minLvl}+${here ? ' — you are here' : ''}${R.village ? ` · ${R.village}` : ''}</div></div>
        <div class="item-btns">${here ? '' : `<button class="min-btn ${okLvl ? 'gold' : ''}">${okLvl ? `${fee}g` : `🔒 Lv${R.minLvl}`}</button>`}</div>`;
      const bt = div.querySelector('button');
      if (bt) bt.onclick = () => {
        if (!okLvl || !Game.teleportTo(R.id)) { if (okLvl) toast('Teleport failed.', 'bad'); return; }
        closePanel(); openPanelName = null;
      };
      b.appendChild(div);
    });
    if (s.keyItems.towerKey) b.innerHTML += `<small class="hint">🔑 Eternity Gate Key detected — the Tower of Eternity awaits.</small>`;
    else b.innerHTML += `<small class="hint">The Tower of Eternity requires the Gate Key (slay Ashmaw the Tyrant in the Ashen Dominion).</small>`;
  }

  /* ---------- MENU / SETTINGS ---------- */
  function panelMenu(box) {
    panelHead(box, '☰ Menu');
    const b = bodyOf(box), s = Game.state;
    const mk = (txt, fn, cls) => {
      const bt = document.createElement('button');
      bt.className = 'btn ' + (cls || 'ghost'); bt.style = 'width:100%;margin-bottom:8px;padding:14px';
      bt.textContent = txt; bt.onclick = fn;
      b.appendChild(bt);
    };
    mk('🎒 Inventory', () => openPanel('inv'));
    mk('⚔️ Equipment', () => openPanel('equip'));
    mk('👤 Character', () => openPanel('char'));
    mk('📜 Quests', () => openPanel('quests'));
    mk('✨ Fusion', () => openPanel('fusion'));
    mk('⚙️ Auto-Attack: ' + (s.settings.autoAttack ? 'ON' : 'OFF'), () => { Game.toggleAuto(!s.settings.autoAttack); panelMenu(box); });
    mk('💾 Save now', () => { Game.save(); toast('Saved.', 'good'); });
    mk('🗑️ Delete character (fresh start)', () => {
      if (confirm('Delete this hero permanently?')) { Game.wipe(); location.reload(); }
    }, 'danger');
    b.innerHTML += `<div class="divider"></div><small class="hint">AETHERIA — Phase 1+2 build. Local demo on purpose: real multiplayer, accounts and persistent cloud saves arrive with the server phase. All data is already shaped like server documents.</small>`;
  }

  /* ============================================================
     NPC DIALOGS
     ============================================================ */
  function openDialog(npc) {
    const dlg = $('dialog'); dlg.classList.remove('hidden');
    const s = Game.state, L = Game.live;
    const N = D.NPCS[npc.keyId] || { name: npc.name, icon: '🙂' };
    $('dlgName').textContent = `${N.name} — ${N.role}`;
    $('dlgPortrait').textContent = N.icon;
    const opts = [];
    const html = (t, f, cls) => opts.push({ t, f, cls });
    const close = () => { dlg.classList.add('hidden'); Game.scanInteract(); };

    if (npc.keyId === 'faction') {
      $('dlgText').textContent = `Welcome, child of the ${D.FACTIONS[s.char.faction].name}. Prove your worth and earn your ${D.FACTIONS[s.char.faction].wingsName}.`;
    } else if (npc.keyId === 'rowan' || npc.keyId === 'captain') {
      $('dlgText').textContent = npc.keyId === 'rowan'
        ? 'The realms tremble, young one. Every road leads somewhere…'
        : 'Stonewatch holds the gate. Prove you can hold a blade.';
    } else if (npc.keyId === 'bram') {
      $('dlgText').textContent = 'My forge never sleeps. Bring me stones & materials and I will forge you legends.';
    } else if (npc.keyId === 'tilda') {
      $('dlgText').textContent = 'Fresh potions, fair prices. And I always buy loot!';
    } else if (npc.keyId === 'miri') {
      $('dlgText').textContent = 'The vault keeps your treasures safe. 60 slots, free of charge.';
    } else if (npc.keyId === 'orin') {
      $('dlgText').textContent = 'The waygates hum. Where to, traveler? Fees apply. (You can also walk into purple portals on roads.)';
    } else if (npc.keyId === 'silas') {
      $('dlgText').textContent = 'Swords, gems and gossip — the market trades in all three.';
    } else if (npc.keyId === 'aurora') {
      $('dlgText').textContent = 'Style is power, darling. Costumes, mounts, pets and wings — all sparkle here.';
    }

    /* quests */
    const turnable = Game.turnableQuestsFor(npc.keyId);
    turnable.forEach(q => html(`✅ Turn in: ${q.name}`, () => { Game.turnInQuest(q); close(); openDialog(npc); }, 'q'));
    // special quest triggers
    if (npc.keyId === 'captain') Game.questEvent('talk', 'captain');
    const avail = Game.availableQuestsFor(npc.keyId);
    avail.forEach(q => html(`📜 ${q.main ? '⭐ ' : ''}${q.name} (Lv ${q.minLvl}+)`, () => { Game.acceptQuest(q); close(); Game.save(); }, 'q'));

    /* services */
    const svc = [];
    if (npc.keyId === 'bram') { svc.push(['⚒️ Forge & recipes', () => openPanel('craft')]); svc.push(['✨ Fusion anvil', () => openPanel('fusion')]); }
    if (npc.keyId === 'tilda') svc.push(['🧺 Trade goods', () => openPanel('sell')]);
    if (npc.keyId === 'miri') svc.push(['📦 Open storage', () => openPanel('storage')]);
    if (npc.keyId === 'orin') svc.push(['🌀 Waygates', () => openPanel('teleport')]);
    if (npc.keyId === 'silas') svc.push(['💰 Marketplace', () => openPanel('market')]);
    if (npc.keyId === 'aurora') svc.push(['🛍️ Boutique', () => openPanel('shop')]);
    if (npc.keyId === 'bram') svc.push(['⭐ Train main skill', () => Game.upgradeSkill()]);
    svc.forEach(([t, f]) => html(t, () => { close(); f(); }));
    html('Farewell', close, 'exit');
    $('dlgOpts').innerHTML = '';
    opts.forEach(o => {
      const bt = document.createElement('button');
      bt.className = 'dlg-opt ' + (o.cls || '');
      bt.textContent = o.t;
      bt.onclick = o.f;
      $('dlgOpts').appendChild(bt);
    });
  }

  /* joystick visual */
  function joyVisual(dx, dy, active) {
    el.joyStick.style.transform = `translate(calc(-50% + ${dx * 28}px), calc(-50% + ${dy * 28}px))`;
    el.joyBase.style.opacity = active ? 1 : .55;
  }

  return {
    init, toast, floatText, pickup, currency, potionCounts, refreshPanels,
    interact, openDialog, onRegionChanged, flashSkill, trackQuest, trackQuestCurrent,
    render, tickHud, toast2: toast, closePanel, openPanel, joyVisual
  };
})();
