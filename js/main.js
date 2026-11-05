/* ============================================================
   AETHERIA — MAIN: boot, character creation wizard, input
   (touch joystick + keyboard), game loop.
   ============================================================ */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const D = window.DATA;

  /* ---------------- boot ---------------- */
  UI.init();
  const fill = $('loadFill'), loadText = $('loadText');
  let prog = 0;
  const loadIv = setInterval(() => {
    prog += 8 + Math.random() * 14;
    fill.style.width = Math.min(100, prog) + '%';
    if (prog > 45) loadText.textContent = 'Growing the wilds of Greendale…';
    if (prog > 75) loadText.textContent = 'Kindling forge fires…';
    if (prog >= 100) {
      clearInterval(loadIv);
      setTimeout(showMenu, 250);
    }
  }, 90);

  function showMenu() {
    $('loadingScreen').classList.add('hidden');
    const saved = Game.load();
    $('menuScreen').classList.remove('hidden');
    if (saved) {
      $('btnContinue').classList.remove('hidden');
      $('btnContinue').textContent = `Continue — ${saved.char.name} (Lv ${saved.char.lvl})`;
      $('btnWipe').classList.remove('hidden');
    }
  }
  $('btnContinue').onclick = () => {
    const saved = Game.load();
    if (!saved) return;
    startGame(() => Game.bootLoad(saved));
  };
  $('btnWipe').onclick = () => {
    if (confirm('Delete this character forever?')) { Game.wipe(); location.reload(); }
  };
  $('btnNewGame').onclick = openCreation;

  /* ---------------- character creation ---------------- */
  const sel = { name: '', gender: 'female', hair: 1, hairCol: '#7a4a1e', eye: '#4a6fc0', outfit: 0, cls: 'warrior', faction: 'angel' };
  let step = 1;
  let previewT = 0;
  let createOpen = false;

  function openCreation() {
    $('menuScreen').classList.add('hidden');
    $('createScreen').classList.remove('hidden');
    createOpen = true;
    step = 1;
    renderCreate();
  }
  $('btnCreateBack').onclick = () => {
    if (step > 1) { step--; renderCreate(); }
    else { $('createScreen').classList.add('hidden'); $('menuScreen').classList.remove('hidden'); createOpen = false; }
  };
  $('btnCreateNext').onclick = () => {
    if (step === 1) {
      const name = ($('ccName') ? $('ccName').value.trim() : sel.name);
      if (!name || name.length < 3 || name.length > 14) { UI.toast('Enter a unique name (3–14 characters).', 'bad'); return; }
      sel.name = name;
      if (Game.load() && Game.load().char.name.toLowerCase() === name.toLowerCase()) { UI.toast('Name taken by your saved hero!', 'bad'); return; }
    }
    if (step < 4) { step++; renderCreate(); }
    else startGame(() => Game.bootNew(sel.name, sel));
  };

  function renderCreate() {
    $('createStep').textContent = `Step ${step} / 4`;
    const body = $('createBody');
    // keep name across nav
    if ($('ccName') && !sel.name) sel.name = $('ccName').value;
    const titles = { 1: 'Name your hero', 2: 'Angels or Demons?', 3: 'Choose your class', 4: 'Appearance & preview' };
    $('createTitle').textContent = titles[step];
    $('btnCreateNext').textContent = step === 4 ? 'BEGIN YOUR LEGEND ⚔️' : 'Next';
    $('btnCreateBack').classList.toggle('ghost', true);

    if (step === 1) {
      body.innerHTML = `
        <div class="cc-preview"><canvas id="ccPrev" width="180" height="205"></canvas></div>
        <div class="cc-grid">
          <div>
            <div class="sec-title">Gender</div>
            <div class="row" id="ccGender">
              <button class="opt-chip" data-v="female">♀ Female</button>
              <button class="opt-chip" data-v="male">♂ Male</button>
            </div>
          </div>
          <div>
            <div class="sec-title">Hero Name</div>
            <input id="ccName" class="field" maxlength="14" placeholder="e.g. Aeolian" value="${sel.name}">
            <small class="hint">Must be unique — a name shared with saved heroes is rejected.</small>
          </div>
        </div>`;
      bindChips('ccGender', 'gender');
    } else if (step === 2) {
      body.innerHTML = `
        <div class="cc-preview"><canvas id="ccPrev" width="180" height="205"></canvas></div>
        <div class="cc-grid">
          ${Object.values(D.FACTIONS).map(f => `
          <div class="cc-card ${sel.faction === f.key ? 'sel' : ''}" data-fc="${f.key}">
            <div class="cc-ico">${f.icon}</div><div class="cc-name">${f.name}</div>
            <div class="cc-desc">${f.desc}<br><b style="color:${f.color}">${f.wingsName}</b></div>
          </div>`).join('')}
        </div>
        <small class="hint">Faction grants unique demonic/celestial wings (quest or boutique only — wings never drop).</small>`;
      body.querySelectorAll('[data-fc]').forEach(c => c.onclick = () => { sel.faction = c.dataset.fc; renderCreate(); });
    } else if (step === 3) {
      body.innerHTML = `
        <div class="cc-preview"><canvas id="ccPrev" width="180" height="205"></canvas></div>
        <div class="cc-grid">
          ${Object.values(D.CLASSES).map(c => `
          <div class="cc-card ${sel.cls === c.key ? 'sel' : ''}" data-cl="${c.key}">
            <div class="cc-ico">${c.icon}</div><div class="cc-name">${c.name}</div>
            <div class="cc-desc">${c.desc}</div>
            <div class="cc-desc" style="color:#ffd77a">${c.skill.icon} ${c.skill.name}</div>
          </div>`).join('')}
        </div>
        <div class="qcard"><b class="stat-line" style="color:#ffd77a; font-size:13px">${D.CLASSES[sel.cls].name} — ${sel.outfit + 1}/3 outfits selectable next step.</b>
        <div class="stat-line">Base: HP ${D.CLASSES[sel.cls].baseHp} · MP ${D.CLASSES[sel.cls].baseMp} · ATK ${D.CLASSES[sel.cls].baseAtk} · DEF ${D.CLASSES[sel.cls].baseDef}<br>
        ${D.CLASSES[sel.cls].skill.desc} — upgradable to level 10.</div></div>
        <div class="row" id="ccOutfit">
          ${D.CLASSES[sel.cls].outfit.map((o, i) => `<button class="opt-chip ${sel.outfit === i ? 'sel' : ''}" data-o="${i}">${o}</button>`).join('')}
        </div>
        <small class="hint">Each class has unique weapons, armor sets and their main skill.</small>`;
      body.querySelectorAll('[data-cl]').forEach(c => c.onclick = () => { sel.cls = c.dataset.cl; renderCreate(); });
      body.querySelectorAll('[data-o]').forEach(c => c.onclick = () => { sel.outfit = +c.dataset.o; renderCreate(); });
    } else {
      body.innerHTML = `
        <div class="cc-preview"><canvas id="ccPrev" width="200" height="220"></canvas></div>
        <div class="sec-title">Hairstyle</div>
        <div class="row" id="ccHair">${D.HAIR_STYLES.map((h, i) => `<button class="opt-chip ${sel.hair === i ? 'sel' : ''}" data-h="${i}">${h}</button>`).join('')}</div>
        <div class="sec-title">Hair Color</div>
        <div class="row" id="ccHairCol">${D.HAIR_COLORS.map((c, i) => `<button class="swatch ${sel.hairCol === c ? 'sel' : ''}" data-hc="${c}" style="background:${c}"></button>`).join('')}</div>
        <div class="sec-title">Eye Color</div>
        <div class="row" id="ccEyeCol">${D.EYE_COLORS.map((c, i) => `<button class="swatch ${sel.eye === c ? 'sel' : ''}" data-ec="${c}" style="background:${c}"></button>`).join('')}</div>
        <div class="sec-title">Starting Outfit</div>
        <div class="row" id="ccOutf">${D.CLASSES[sel.cls].outfit.map((o, i) => `<button class="opt-chip ${sel.outfit === i ? 'sel' : ''}" data-of="${i}">${o}</button>`).join('')}</div>
        <div class="qcard"><div class="stat-line"><b>${sel.name || 'Hero'}</b> — ${sel.gender === 'female' ? 'Female' : 'Male'} ${D.CLASSES[sel.cls].name} of the ${D.FACTIONS[sel.faction].name}<br>
        Faction: <b style="color:${D.FACTIONS[sel.faction].color}">${D.FACTIONS[sel.faction].icon} ${D.FACTIONS[sel.faction].name}</b> · Starts in Dawnshire, Greendale</div></div>`;
      bindChips('ccHair', 'hair', v => +v);
      bindSwatches('ccHairCol', 'hairCol');
      bindSwatches('ccEyeCol', 'eye');
      body.querySelectorAll('[data-of]').forEach(b2 => b2.onclick = () => { sel.outfit = +b2.dataset.of; renderCreate(); });
    }
    bindChips('ccGender', 'gender');
    if (step === 1) {
      const inp = $('ccName');
      inp.oninput = () => $('btnCreateNext').textContent = inp.value.trim().length >= 3 ? 'Next' : 'Next';
    }
    // preview loop
    const prevCv = $('ccPrev');
    if (prevCv) {
      const g = prevCv.getContext('2d');
      const cfg = genCfg();
      const draw = () => {
        if (!createOpen) return;
        const f = Math.floor(previewT / .35) % 2;
        previewT += .1;
        const spr = SPR.playerPreview({ ...cfg, cls: sel.cls }, f);
        g.clearRect(0, 0, prevCv.width, prevCv.height);
        g.imageSmoothingEnabled = false;
        g.drawImage(spr, (prevCv.width - spr.width * 1.9) / 2, prevCv.height - spr.height * 1.9 - 6, spr.width * 1.9, spr.height * 1.9);
        requestAnimationFrame(draw);
      };
      draw();
    }
  }
  function genCfg() {
    return { gender: sel.gender, hair: sel.hair, hairCol: sel.hairCol, eye: sel.eye, outfit: sel.outfit, cls: sel.cls, costume: null };
  }
  function bindChips(id, key, map) {
    const wrap = $(id); if (!wrap) return;
    wrap.querySelectorAll('.opt-chip,[data-h]').forEach(b2 => {
      if (b2.dataset[key.slice(0, 1)] !== undefined) return;
      b2.onclick = () => {
        sel[key] = map ? map(b2.dataset[`h${key === 'hair' ? '' : ''}`] || b2.dataset.v || b2.dataset.c || b2.dataset.e || b2.dataset.o || b2.dataset.f || b2.dataset.h) : (b2.dataset.v || b2.dataset.c || b2.dataset.e || b2.dataset.o || b2.dataset.f || b2.dataset.h || b2.textContent);
        wrap.querySelectorAll('.opt-chip').forEach(x => x.classList.remove('sel'));
        b2.classList.add('sel');
        renderCreate();
      };
    });
  }
  function bindSwatches(id, key) {
    const wrap = $(id); if (!wrap) return;
    wrap.querySelectorAll('.swatch').forEach(sw => sw.onclick = () => {
      sel[key] = sw.dataset[key === 'eye' ? 'ec' : 'hc'];
      wrap.querySelectorAll('.swatch').forEach(x => x.classList.remove('sel'));
      sw.classList.add('sel');
      renderCreate();
    });
  }
  bindChips('ccGender', 'gender');

  /* ---------------- start game ---------------- */
  function startGame(bootFn) {
    createOpen = false;
    $('createScreen').classList.add('hidden');
    $('menuScreen').classList.add('hidden');
    $('gameScreen').classList.remove('hidden');
    bootFn();
    const s = Game.state;
    UI.currency(); UI.potionCounts();
    $('btnAuto').classList.toggle('on', s.settings.autoAttack);
    UI.toast(`⚔️ Welcome to Aetheria, ${s.char.name}!`, 'gold');
    setTimeout(() => UI.toast('The village plaza has: Blacksmith · Merchant · Quest Elder · Storage · Teleporter · Broker · Boutique', ''), 2500);
  }

  /* ---------------- input: joystick + keyboard ---------------- */
  const joy = { active: false, dx: 0, dy: 0 };
  const zone = $('joystickZone');
  function joyStart(e) {
    joy.active = true; joyMove(e);
  }
  function joyMove(e) {
    if (!joy.active) return;
    const r = $('joyBase').getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const t = e.touches ? e.touches[0] : e;
    let dx = (t.clientX - cx) / (r.width / 2), dy = (t.clientY - cy) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    joy.dx = dx; joy.dy = dy;
    UI.joyVisual(dx, dy, true);
  }
  function joyEnd() {
    joy.active = false; joy.dx = 0; joy.dy = 0;
    UI.joyVisual(0, 0, false);
  }
  zone.addEventListener('touchstart', e => { e.preventDefault(); joy.active = true; joyMove(e); }, { passive: false });
  zone.addEventListener('touchmove', e => { e.preventDefault(); joyMove(e); }, { passive: false });
  zone.addEventListener('touchend', joyEnd);
  zone.addEventListener('touchcancel', joyEnd);
  zone.addEventListener('pointerdown', joyStart);
  zone.addEventListener('pointermove', e => { if (joy.active && e.pointerType === 'mouse') joyMove(e); });
  window.addEventListener('pointerup', joyEnd);

  // keyboard fallback (desktop testing)
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') { e.preventDefault(); Game.playerAttack(); }
    if (e.key.toLowerCase() === 'q') Game.useSkill();
    if (e.key.toLowerCase() === 'e') Game.doInteract();
    if (e.key.toLowerCase() === 'a' && e.shiftKey) Game.toggleAuto(!Game.state.settings.autoAttack);
  });
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  /* ---------------- main loop ---------------- */
  let last = performance.now();
  function frame(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    if (Game.isLoaded() && Game.state && !$('gameScreen').classList.contains('hidden')) {
      const L = Game.live;
      Game.live.dts = dt;
      // input movement
      const p = Game.player();
      if (p && !p.dead) {
        let mx = joy.dx, my = joy.dy;
        if (keys['w']) my -= 1; if (keys['s']) my += 1;
        if (keys['a'] && !keys['shift']) mx -= 1; if (keys['d']) mx += 1;
        const mm = Math.hypot(mx, my);
        if (mm > .15) {
          const sp = Game.moveSpeed() * dt;
          const nx = mx / mm, ny = my / mm;
          Game.tryMove(nx * sp, ny * sp);
          p.moving = true;
          p.dir = nx < 0 ? -1 : 1;
        } else if (!Game.state.settings.autoAttack) p.moving = false;
        else if (!p.moving) { /* auto handles */ }
      }
      Game.tickPlayer(dt);
      Game.tickMonsters(dt);
      UI.render(dt);
      UI.tickHud(dt);
      if (L.fade > 0) L.fade = Math.max(0, L.fade - dt * 2);
      // potion buttons cooldown visuals
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('visibilitychange', () => { if (document.hidden) Game.save(); });
  window.addEventListener('beforeunload', () => Game.save());
})();
