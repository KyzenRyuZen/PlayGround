// ============================================================
// AETHERIA — UI CONTROLLER
// ============================================================

import CONFIG from './config.js';
import {
  REGIONS, REGION_ORDER, DUNGEONS, QUESTS, CLASSES, FACTIONS, SLOTS,
  RARITIES, TIERS, SHOP, SHOP_CATEGORIES, MONSTERS, BONUS_STATS,
  HAIR_STYLES, HAIR_COLORS, EYE_COLORS, HOW_TO_PLAY
} from './data.js';
import { MATERIALS } from './state.js';
import { renderCharacterPreview } from './renderer.js';
import { fmt, pct, escapeHtml, timeAgo, fmtTime, Events } from './utils.js';

const PANEL_META = {
  inventory: ['Inventory', '🎒'],
  character: ['Character', '🛡'],
  quests: ['Quest Log', '❖'],
  map: ['World & Teleport', '🗺'],
  blacksmith: ['Blacksmith', '⚒'],
  enchanter: ['Enchanter', '◈'],
  potions: ['Potion Merchant', '⚗'],
  storage: ['Storage', '▤'],
  market: ['Market Stall', '⚖'],
  shop: ['Aetheria Shop', '🛒'],
  settings: ['Menu & Settings', '☰'],
  economy: ['Economy Ledger', '◉'],
  about: ['About & Backend Notes', 'ℹ'],
  howto: ['How to Play', '✦'],
  npc: ['Citizen of Aetheria', '❖']
};

const SLOT_NAME = Object.fromEntries(SLOTS.map(s => [s.id, s.name]));

export class UI {
  constructor(state, callbacks = {}) {
    this.state = state;
    this.callbacks = callbacks;
    this.game = null;
    this.panel = null;
    this.panelPayload = null;
    this.itemUid = null;
    this.invFilter = 'equip';
    this.shopCategory = 'gems';
    this.craftSlot = 'weapon';
    this.enchantItem = null;
    this.enchantStone = null;
    this.marketSelected = null;
    this.questFilter = 'active';
    this.settingsOpen = false;
    this._toastTimer = null;
    this._deathTimer = null;
    this.createDraft = {
      name: 'Wanderer', faction: 'angel', classId: 'warrior', gender: 'male',
      hair: HAIR_STYLES.male[0].id, hairColor: 'raven', eyes: 'blue'
    };
    this.cacheEls();
    this.bindGlobal();
    this.bindStatic();
    this.renderCreationChoices();
    this.renderStart();
  }

  cacheEls() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      canvas: $('gameCanvas'), hud: $('hud'), start: $('startScreen'), creation: $('creationScreen'),
      loading: $('loadingScreen'), modalRoot: $('modalRoot'), modalBody: $('modalBody'),
      modalTitle: $('modalTitle'), modalIcon: $('modalIcon'), toastHost: $('toastHost'),
      hudName: $('hudName'), hudClass: $('hudClass'), hudLevel: $('hudLevel'),
      hpFill: $('hpFill'), hpText: $('hpText'), manaFill: $('manaFill'), manaText: $('manaText'),
      xpFill: $('xpFill'), xpText: $('xpText'), hudGold: $('hudGold'), hudGems: $('hudGems'),
      hudRegion: $('hudRegion'), minimapRegion: $('minimapRegion'), minimapCoords: $('minimapCoords'),
      minimap: $('minimap'), questTracker: $('questTracker'), qtTitle: $('qtTitle'), qtDesc: $('qtDesc'),
      qtFill: $('qtFill'), qtCount: $('qtCount'), bossBar: $('bossBar'), bossName: $('bossName'),
      bossLevel: $('bossLevel'), bossFill: $('bossFill'), interactPrompt: $('interactPrompt'),
      interactText: $('interactText'), btnInteract: $('btnInteract'), btnPotion: $('btnPotion'),
      btnSkill: $('btnSkill'), btnAttack: $('btnAttack'), btnMount: $('btnMount'), btnAuto: $('btnAuto'),
      potionCount: $('potionCount'), skillIcon: $('skillIcon'), skillName: $('skillName'),
      skillCdMask: $('skillCdMask'), skillCdText: $('skillCdText'), eventFeed: $('eventFeed'),
      loadingRegion: $('loadingRegion'), loadingEpithet: $('loadingEpithet'), loadingLore: $('loadingLore'),
      loadingHint: $('loadingHint'), deathOverlay: $('deathOverlay'), deathFlash: $('deathFlash'),
      titlePreview: $('titlePreview'), createPreview: $('createPreview'), createName: $('createName'),
      previewName: $('previewName'), previewSub: $('previewSub'), previewStats: $('previewStats'),
      factionChoices: $('factionChoices'), classChoices: $('classChoices'), genderChoices: $('genderChoices'),
      eyeChoices: $('eyeChoices'), hairChoices: $('hairChoices'), hairColorChoices: $('hairColorChoices'),
      btnContinue: $('btnContinue'), joystick: $('joystick'), joyKnob: $('joyKnob'),
      portraitIcon: $('portraitIcon')
    };
  }

  // ------------------------------------------------------------
  // events & static UI
  // ------------------------------------------------------------
  bindGlobal() {
    document.addEventListener('click', (e) => {
      const close = e.target.closest('[data-close]');
      if (close && !e.target.closest('[data-act]')) { this.closeModal(); return; }
      const uiAction = e.target.closest('[data-ui]');
      if (uiAction) { this.handleUi(uiAction.dataset.ui); return; }
      const action = e.target.closest('[data-act]');
      if (action) { e.preventDefault(); this.handleAction(action.dataset, action); }
    });

    Events.on('loading:start', ({ region, dungeon }) => this.showLoading(region, dungeon));
    Events.on('loading:end', () => this.hideLoading());
    Events.on('region', ({ region, dungeon }) => this.onRegion(region, dungeon));
    Events.on('hud', ({ game }) => this.updateHUD(game));
    Events.on('toast', (t) => this.toast(t));
    Events.on('npc', (npc) => this.openPanel('npc', npc));
    Events.on('boss', (b) => this.updateBossBar(b));
    Events.on('playerHit', ({ damage }) => this.flashDamage(damage));
    Events.on('levelup', (level) => {
      this.toast({ msg: `Level ${level}! Your power grows.`, type: 'success', duration: 4200 });
      this.game?.sfx.play('level');
    });
    Events.on('death', () => this.onDeath());
    Events.on('dungeonCleared', (d) => {
      if (this.panel === 'map') this.refreshPanel();
    });
    Events.on('saved', () => {});
    Events.on('openMap', () => this.handleUi('openMap'));
    Events.on('openBag', () => this.handleUi('openBag'));
    Events.on('openCharacter', () => this.handleUi('openCharacter'));
    Events.on('inventory', () => { if (['inventory', 'storage', 'enchanter', 'market', 'blacksmith', 'character'].includes(this.panel) && !this.isTyping()) this.refreshPanel(); });
    Events.on('equipment', () => { if (['inventory', 'character', 'enchanter'].includes(this.panel) && !this.isTyping()) this.refreshPanel(); });
    Events.on('stones', () => { if (['inventory', 'enchanter'].includes(this.panel)) this.refreshPanel(); });
    Events.on('quests', () => { if (this.panel === 'quests') this.refreshPanel(); });
    Events.on('market', () => { if (this.panel === 'market') this.refreshPanel(); });
    Events.on('shop', () => { if (this.panel === 'shop') this.refreshPanel(); });
    Events.on('character', () => { if (this.panel === 'character') this.refreshPanel(); });
    Events.on('skill', () => { if (this.panel === 'character') this.refreshPanel(); });
    Events.on('gold', () => { if (['economy', 'shop', 'blacksmith', 'market'].includes(this.panel)) this.refreshPanel(); });
    Events.on('gems', () => { if (this.panel === 'shop') this.refreshPanel(); });

    window.addEventListener('resize', () => {
      if (this.panel === 'character') this.renderPanelPreviews();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panel) this.closeModal();
    });
  }

  isTyping() {
    const a = document.activeElement;
    return a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName);
  }

  bindStatic() {
    document.getElementById('btnNewGame').addEventListener('click', () => {
      this.showCreation();
    });
    const cont = document.getElementById('btnContinue');
    cont.addEventListener('click', () => {
      this.callbacks.continueGame?.();
    });
    document.getElementById('btnHowTo').addEventListener('click', () => {
      this.showHowTo();
    });
    document.getElementById('creationBack').addEventListener('click', () => {
      this.showStart();
    });
    document.getElementById('btnCreate').addEventListener('click', () => {
      const name = (this.el.createName.value || '').trim() || 'Wanderer';
      this.createDraft.name = name.slice(0, 16);
      this.callbacks.createGame?.(this.createDraft);
    });
    this.el.createName.addEventListener('input', () => {
      this.createDraft.name = this.el.createName.value || 'Wanderer';
      this.el.previewName.textContent = this.createDraft.name || 'Wanderer';
    });

    this.el.createPreview.parentElement?.addEventListener('click', () => {});

    // creation choices (delegated)
    for (const container of [this.el.factionChoices, this.el.classChoices, this.el.genderChoices, this.el.hairChoices, this.el.hairColorChoices, this.el.eyeChoices]) {
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-choice]');
        if (!btn) return;
        const kind = btn.dataset.choice;
        const value = btn.dataset.value;
        if (kind === 'gender') {
          this.createDraft.gender = value;
          this.createDraft.hair = HAIR_STYLES[value][0].id;
        } else {
          this.createDraft[kind] = value;
        }
        this.renderCreationChoices();
        this.renderCreatePreview();
        this.state.sfx?.play?.('ui');
      });
    }

    // game controls
    this.el.btnAttack.addEventListener('click', () => this.game?.attackPressed());
    this.el.btnSkill.addEventListener('click', () => this.game?.skillPressed());
    this.el.btnInteract.addEventListener('click', () => this.game?.interactPressed());
    this.el.btnPotion.addEventListener('click', () => this.game?.useHealthPotion());
    this.el.btnMount.addEventListener('click', () => this.game?.toggleMount());
    this.el.btnAuto.addEventListener('click', () => this.game?.toggleAutoAttack());
    this.el.questTracker.addEventListener('click', () => this.handleUi('openQuests'));
    this.el.portraitCard?.addEventListener('click', () => this.handleUi('openCharacter'));

    // quick buttons
    document.querySelectorAll('[data-ui]').forEach(btn => {
      if (btn.closest('#creationScreen')) return;
    });

    // joystick
    this.bindJoystick();
  }

  bindJoystick() {
    const joy = this.el.joystick;
    let active = false;
    let pointerId = null;
    let cx = 0, cy = 0, radius = 40;
    const start = (e) => {
      if (this.game?.transitioning) return;
      const rect = joy.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
      radius = rect.width * 0.32;
      active = true;
      pointerId = e.pointerId;
      joy.setPointerCapture(pointerId);
      move(e);
      e.preventDefault();
    };
    const move = (e) => {
      if (!active) return;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > radius) { dx = dx / len * radius; dy = dy / len * radius; }
      const nx = dx / radius;
      const ny = dy / radius;
      this.game?.setJoystick(nx, ny);
      this.el.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      e.preventDefault();
    };
    const end = (e) => {
      if (!active) return;
      active = false;
      pointerId = null;
      this.game?.setJoystick(0, 0);
      this.el.joyKnob.style.transform = 'translate(0px, 0px)';
    };
    joy.addEventListener('pointerdown', start);
    joy.addEventListener('pointermove', move);
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
    joy.addEventListener('pointerleave', (e) => { if (!active) return; end(e); });
  }

  // ------------------------------------------------------------
  // start / creation
  // ------------------------------------------------------------
  renderStart() {
    this.el.btnContinue.classList.toggle('hidden', !this.state.constructor.hasSave());
    if (this.el.titlePreview) {
      requestAnimationFrame(() => {
        renderCharacterPreview(this.el.titlePreview, {
          faction: 'angel', classId: 'warrior', gender: 'female', hair: 'long', hairColor: '#d8b05c', eyeColor: '#3f8cff',
          wings: { style: 'seraph', palette: ['#fffbe8', '#ffe08a', '#ffb23e'] },
          bg1: 'rgba(120,100,190,0.22)'
        });
      });
    }
  }

  showStart() {
    this.el.start.classList.remove('hidden');
    this.el.creation.classList.add('hidden');
    this.el.hud.classList.add('hidden');
    this.renderStart();
  }

  showCreation() {
    this.el.start.classList.add('hidden');
    this.el.creation.classList.remove('hidden');
    this.el.createName.value = this.createDraft.name === 'Wanderer' ? '' : this.createDraft.name;
    this.el.createName.placeholder = 'Enter a name';
    this.renderCreationChoices();
    requestAnimationFrame(() => this.renderCreatePreview());
  }

  showHowTo() {
    if (this.state.data) {
      this.openPanel('howto');
    } else {
      // pre-game how-to in a lightweight modal
      this.setModal('How to Play', '✦');
      this.el.modalBody.innerHTML = this.howToHtml();
      this.el.modalRoot.classList.remove('hidden');
      this.panel = 'howto';
    }
  }

  renderCreationChoices() {
    const d = this.createDraft;
    this.el.factionChoices.innerHTML = Object.values(FACTIONS).map(f => `
      <button class="choice faction-choice ${d.faction === f.id ? 'selected' : ''}" data-choice="faction" data-value="${f.id}">
        <b>${f.name}</b><small>${f.id === 'angel' ? 'Radiant wings · gold trim' : 'Ember wings · crimson trim'}</small>
      </button>`).join('');
    this.el.classChoices.innerHTML = Object.values(CLASSES).map(c => `
      <button class="choice class-choice ${d.classId === c.id ? 'selected' : ''}" data-choice="classId" data-value="${c.id}">
        <b>${c.name}</b><small>${c.archetype} · ${c.weapon}</small>
      </button>`).join('');
    this.el.genderChoices.innerHTML = ['male', 'female'].map(g => `
      <button class="choice ${d.gender === g ? 'selected' : ''}" data-choice="gender" data-value="${g}">${g === 'male' ? 'Male' : 'Female'}</button>`).join('');
    this.el.eyeChoices.innerHTML = EYE_COLORS.map(e => `
      <button class="swatch eye ${d.eyes === e.id ? 'selected' : ''}" style="background:${e.color}" title="${e.name}" data-choice="eyes" data-value="${e.id}"></button>`).join('');
    this.el.hairChoices.innerHTML = HAIR_STYLES[d.gender].map(h => `
      <button class="choice ${d.hair === h.id ? 'selected' : ''}" data-choice="hair" data-value="${h.id}">${h.name}</button>`).join('');
    this.el.hairColorChoices.innerHTML = HAIR_COLORS.map(h => `
      <button class="swatch ${d.hairColor === h.id ? 'selected' : ''}" style="background:${h.color}" title="${h.name}" data-choice="hairColor" data-value="${h.id}"></button>`).join('');

    const cls = CLASSES[d.classId];
    this.el.previewName.textContent = d.name || 'Wanderer';
    this.el.previewSub.textContent = `${FACTIONS[d.faction].name.replace(/s$/, '')} · ${cls.name}`;
    this.el.previewStats.innerHTML = `
      <div><b>${cls.base.str}</b>STR</div><div><b>${cls.base.int}</b>INT</div><div><b>${cls.base.dex}</b>DEX</div><div><b>${cls.base.vit}</b>VIT</div>`;
  }

  renderCreatePreview() {
    if (this.el.creation.classList.contains('hidden')) return;
    const d = this.createDraft;
    const hair = HAIR_COLORS.find(h => h.id === d.hairColor)?.color || '#5b3a25';
    const eye = EYE_COLORS.find(e => e.id === d.eyes)?.color || '#3f8cff';
    const wings = d.faction === 'angel'
      ? { style: 'seraph', palette: ['#fffbe8', '#ffe08a', '#ffb23e'] }
      : { style: 'abyss', palette: ['#1c0f1c', '#7a1e33', '#ff4d6d'] };
    renderCharacterPreview(this.el.createPreview, {
      faction: d.faction, classId: d.classId, gender: d.gender,
      hair: d.hair, hairColor: hair, eyeColor: eye, wings,
      equipment: { weapon: this.fakeWeapon(d.classId, d.faction) },
      bg1: d.faction === 'angel' ? 'rgba(230,196,106,0.22)' : 'rgba(180,50,70,0.22)'
    });
  }

  fakeWeapon(classId, faction) {
    const rar = faction === 'angel' ? 'blue' : 'epic';
    return { slot: 'weapon', rarity: rar, tier: 2, kind: 'equip', stats: {}, bonuses: [] };
  }

  // ------------------------------------------------------------
  // loading / region / HUD
  // ------------------------------------------------------------
  showLoading(region, dungeon) {
    this.el.start.classList.add('hidden');
    this.el.creation.classList.add('hidden');
    this.el.loading.classList.remove('hidden');
    this.el.loadingRegion.textContent = dungeon ? dungeon.name : region.name;
    this.el.loadingEpithet.textContent = dungeon ? `Dungeon · ${REGIONS[dungeon.region].name}` : region.epithet;
    this.el.loadingLore.textContent = dungeon ? dungeon.desc : region.lore;
    const hints = ['Threading the leylines…', 'The world folds around you…', 'Old wards recognize your name…', 'Dust settles on distant roads…'];
    this.el.loadingHint.textContent = hints[Math.floor(Math.random() * hints.length)];
    this.el.deathOverlay.classList.add('hidden');
  }

  hideLoading() {
    this.el.loading.classList.add('hidden');
    this.el.hud.classList.remove('hidden');
  }

  onRegion(region, dungeon) {
    this.el.hudRegion.textContent = dungeon ? dungeon.name : region.name;
    this.el.minimapRegion.textContent = dungeon ? 'Dungeon' : region.name;
    this.el.portraitIcon.textContent = this.classIcon();
    this.updateHUD(this.game);
    if (this.panel === 'map') this.refreshPanel();
    this.addFeed(`Entered ${dungeon ? dungeon.name : region.name}`, 'gold');
  }

  classIcon() {
    if (!this.state.char) return '⚔';
    return { warrior: '⚔', mage: '✦', archer: '➶' }[this.state.char.classId] || '⚔';
  }

  updateHUD(game) {
    const state = this.state;
    if (!state?.data || !state.char) return;
    this.game = game || this.game;
    const c = state.char;
    const st = state.stats();
    this.el.hudName.textContent = c.name;
    this.el.hudClass.textContent = `${FACTIONS[c.faction].name.replace(/s$/, '')} ${CLASSES[c.classId].name}`;
    this.el.hudLevel.textContent = c.level;
    this.el.hudGold.textContent = fmt(c.gold);
    this.el.hudGems.textContent = fmt(c.gems);
    const hp = Math.max(0, Math.round(c.hp));
    const mp = Math.max(0, Math.round(c.mana));
    this.el.hpFill.style.width = `${Math.min(100, hp / st.maxHp * 100)}%`;
    this.el.hpText.textContent = `${hp} / ${st.maxHp}`;
    this.el.manaFill.style.width = `${Math.min(100, mp / st.maxMana * 100)}%`;
    this.el.manaText.textContent = `${mp} / ${st.maxMana}`;
    const xpNeed = state.xpToNext();
    this.el.xpFill.style.width = `${Math.min(100, c.xp / xpNeed * 100)}%`;
    this.el.xpText.textContent = `${Math.floor(c.xp)} / ${xpNeed}`;
    this.el.hudRegion.textContent = this.game?.currentDungeon ? this.game.currentDungeon.name : state.region().name;
    this.el.minimapRegion.textContent = this.game?.currentDungeon ? 'Dungeon' : state.region().name;
    this.el.minimapCoords.textContent = `${Math.round(c.x)}, ${Math.round(c.y)}`;
    this.el.portraitIcon.textContent = this.classIcon();
    this.el.potionCount.textContent = String(
      (c.consumables.health_large || 0) + (c.consumables.health_medium || 0) + (c.consumables.health_small || 0)
    );

    // skill
    const skill = CLASSES[c.classId].skill;
    this.el.skillIcon.textContent = skill.icon;
    this.el.skillName.textContent = `${skill.name} · ${c.skillLevel}`;
    const cd = this.game?.skillCd || 0;
    const cdPct = cd > 0 ? cd / skill.cooldown : 0;
    this.el.skillCdMask.style.setProperty('--cd', `${cdPct * 360}deg`);
    this.el.skillCdText.textContent = cd > 0 ? cd.toFixed(1) : '';
    this.el.btnSkill.style.opacity = c.mana < skill.mana ? '0.55' : '1';

    // interact
    const target = this.game?.interactTarget;
    this.el.interactPrompt.classList.toggle('hidden', !target);
    this.el.btnInteract.classList.toggle('interact-ready', !!target);
    if (target) {
      this.el.interactText.textContent = this.game.interactLabel;
    }
    // mount / auto
    this.el.btnMount.classList.toggle('active', !!c.mountActive);
    const mountKind = state.mountDef()?.kind;
    this.el.btnMount.querySelector('span').textContent = ({ horse: '🐎', wolf: '🐺', drake: '🐉' })[mountKind] || '🐎';
    this.el.btnAuto.classList.toggle('active', !!state.data.settings.autoAttack);

    // quest tracker
    const tracked = state.trackQuest();
    if (!tracked) {
      this.el.questTracker.classList.add('hidden');
    } else {
      this.el.questTracker.classList.remove('hidden');
      const q = tracked.def;
      const progress = state.questProgress(q);
      const complete = progress >= q.required;
      this.el.qtTitle.textContent = q.title;
      this.el.qtDesc.textContent = q.desc;
      this.el.qtFill.style.width = `${Math.min(100, progress / q.required * 100)}%`;
      this.el.qtCount.textContent = complete ? 'Ready to claim — tap here' : `${progress} / ${q.required}`;
      this.el.qtFill.style.background = complete ? 'linear-gradient(90deg,#3a9f57,#7dffc1)' : '';
    }
    this.updateMinimap();
  }

  updateMinimap() {
    if (this.el.minimap && this.game?.renderer) {
      this.game.renderer.drawMinimap(this.el.minimap, this.game);
    }
  }

  updateBossBar(boss) {
    if (!boss) {
      this.el.bossBar.classList.add('hidden');
      this.el.bossBar.style.borderColor = '';
      return;
    }
    this.el.bossBar.classList.remove('hidden');
    this.el.bossName.textContent = boss.name;
    this.el.bossLevel.textContent = `Lv ${boss.level}`;
    this.el.bossFill.style.width = `${Math.max(0, boss.hp / boss.maxHp * 100)}%`;
    this.el.bossBar.style.borderColor = 'rgba(255,90,60,0.35)';
  }

  flashDamage(dmg) {
    this.el.deathFlash.classList.add('on');
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => this.el.deathFlash.classList.remove('on'), 130);
    if (dmg > 0) this.addFeed(`-${fmt(dmg)} HP`, 'red');
  }

  onDeath() {
    this.el.deathOverlay.classList.remove('hidden');
    clearTimeout(this._deathTimer);
    this._deathTimer = setTimeout(() => this.el.deathOverlay.classList.add('hidden'), 3600);
  }

  // ------------------------------------------------------------
  // toast / feed
  // ------------------------------------------------------------
  toast({ msg, type = 'info', duration = 3000, small = false, color }) {
    if (!msg) return;
    // suppress duplicate consecutive toasts
    const last = this.el.toastHost.lastElementChild;
    if (last && last.dataset.msg === msg) return;
    const div = document.createElement('div');
    div.className = `toast ${type}${small ? ' small' : ''}`;
    div.dataset.msg = msg;
    div.textContent = msg;
    if (color) div.style.borderColor = color;
    this.el.toastHost.appendChild(div);
    while (this.el.toastHost.children.length > 5) this.el.toastHost.firstElementChild.remove();
    if (type === 'combat' || type === 'loot' || type === 'danger') this.addFeed(msg, type);
    setTimeout(() => {
      div.classList.add('out');
      setTimeout(() => div.remove(), 260);
    }, duration);
  }

  addFeed(msg, type = '') {
    if (this.el.eventFeed.children.length > 7) this.el.eventFeed.firstElementChild.remove();
    const line = document.createElement('div');
    line.className = `feed-line ${type === 'gold' ? 'gold' : ''}`;
    line.textContent = msg;
    this.el.eventFeed.appendChild(line);
    setTimeout(() => line.remove(), 9000);
  }

  // ------------------------------------------------------------
  // modal plumbing
  // ------------------------------------------------------------
  setModal(title, icon) {
    this.el.modalTitle.textContent = title;
    this.el.modalIcon.textContent = icon;
  }

  openPanel(name, payload = null) {
    if (!this.state.data && name !== 'howto') return;
    this.panel = name;
    this.panelPayload = payload;
    this.itemUid = null;
    const meta = PANEL_META[name] || ['Panel', '✦'];
    this.setModal(meta[0], meta[1]);
    this.el.modalBody.innerHTML = this.renderPanel();
    this.el.modalRoot.classList.remove('hidden');
    this.el.modalBody.scrollTop = 0;
    requestAnimationFrame(() => this.afterPanelRender());
  }

  refreshPanel() {
    if (!this.panel) return;
    const scroll = this.el.modalBody.scrollTop;
    const meta = PANEL_META[this.panel] || ['Panel', '✦'];
    this.setModal(meta[0], meta[1]);
    this.el.modalBody.innerHTML = this.renderPanel();
    this.el.modalBody.scrollTop = scroll;
    this.afterPanelRender();
  }

  afterPanelRender() {
    this.renderPanelPreviews();
  }

  renderPanelPreviews() {
    if (this.panel !== 'character') return;
    const canvas = document.getElementById('charPreview');
    if (!canvas || !this.state.data) return;
    const c = this.state.char;
    const wings = this.state.wingsDef();
    renderCharacterPreview(canvas, {
      faction: c.faction, classId: c.classId, gender: c.gender,
      hair: c.hair, hairColor: this.state.hairColorHex(), eyeColor: this.state.eyeColorHex(),
      equipment: this.state.data.equipped,
      wings,
      cosmetic: this.state.costumePalette(),
      mount: null,
      aura: this.equipmentAura(),
      bg1: c.faction === 'angel' ? 'rgba(230,196,106,0.18)' : 'rgba(200,60,80,0.2)'
    });
  }

  equipmentAura() {
    let best = null;
    for (const s of SLOTS) {
      const it = this.state.data.equipped[s.id];
      if (!it) continue;
      const score = (8 - it.tier) * 10 + (RARITIES[it.rarity]?.order || 0) * 4;
      if (!best || score > best.score) best = { score, tier: it.tier, rarity: it.rarity };
    }
    if (!best) return null;
    if (best.tier === 3 && (RARITIES[best.rarity]?.order || 0) < 4) return null;
    return { color: RARITIES[best.rarity].color, strength: best.tier === 1 ? 3 : best.tier === 2 ? 2 : 1 };
  }

  closeModal() {
    this.panel = null;
    this.panelPayload = null;
    this.itemUid = null;
    this.el.modalRoot.classList.add('hidden');
  }

  handleUi(action) {
    switch (action) {
      case 'openBag': this.openPanel('inventory'); break;
      case 'openCharacter': this.openPanel('character'); break;
      case 'openMap': this.openPanel('map'); break;
      case 'openShop': this.openPanel('shop'); this.shopCategory = 'gems'; break;
      case 'openMenu': this.openPanel('settings'); break;
      case 'openQuests': this.openPanel('quests'); break;
    }
  }

  // ------------------------------------------------------------
  // RENDER PANELS
  // ------------------------------------------------------------
  renderPanel() {
    switch (this.panel) {
      case 'inventory': return this.panelInventory();
      case 'character': return this.panelCharacter();
      case 'quests': return this.panelQuests();
      case 'map': return this.panelMap();
      case 'blacksmith': return this.panelBlacksmith();
      case 'enchanter': return this.panelEnchanter();
      case 'potions': return this.panelPotions();
      case 'storage': return this.panelStorage();
      case 'market': return this.panelMarket();
      case 'shop': return this.panelShop();
      case 'settings': return this.panelSettings();
      case 'economy': return this.panelEconomy();
      case 'about': return this.panelAbout();
      case 'howto': return this.howToHtml(true);
      case 'npc': return this.panelNpc(this.panelPayload);
      default: return '<div class="empty">Nothing here.</div>';
    }
  }

  // ---------- items helpers ----------
  rarityColor(item) { return RARITIES[item.rarity]?.color || 'var(--text)'; }
  itemIcon(item) {
    if (item.kind === 'material') return item.icon || MATERIALS[item.materialId]?.icon || '📦';
    if (item.kind === 'stone') return item.icon || '◈';
    return SLOTS.find(s => s.id === item.slot)?.icon || '🗡';
  }
  itemRestriction(item) {
    if (!item || item.kind !== 'equip') return '';
    return `${CLASSES[item.classId].name} · ${FACTIONS[item.faction].name}`;
  }
  statName(k) {
    return { str: 'Strength', int: 'Intelligence', dex: 'Dexterity', vit: 'Vitality', atk: 'Attack', def: 'Defense', crit: 'Crit' }[k] || k;
  }
  itemStatsHtml(item) {
    if (!item?.stats) return '';
    const rows = [];
    for (const k of ['atk', 'def', 'str', 'int', 'dex', 'vit']) {
      if (item.stats[k]) rows.push(`<div class="stat-line"><span>${this.statName(k)}</span><b class="pos">+${item.stats[k]}</b></div>`);
    }
    if (item.stats.crit) rows.push(`<div class="stat-line"><span>Critical Chance</span><b class="pos">+${pct(item.stats.crit, 2)}</b></div>`);
    for (const b of item.bonuses || []) {
      const stat = BONUS_STATS[b.stat];
      rows.push(`<div class="stat-line"><span>${stat.icon} ${stat.name} (bonus)</span><b class="pos">+${b.value}${b.stat === 'crit' ? '%' : ''}</b></div>`);
    }
    return rows.join('');
  }
  itemCard(item, actions = '') {
    const color = this.rarityColor(item);
    const meta = item.kind === 'material'
      ? `Material ×${item.count}`
      : item.kind === 'stone'
        ? `${CLASSES[item.classId].name} · ${BONUS_STATS[item.stat].name} +${item.value}${item.stat === 'crit' ? '%' : ''}`
        : `${SLOT_NAME[item.slot]} · ${RARITIES[item.rarity].name} · T${item.tier}`;
    return `
      <button class="item-card" style="--rar:${color}" data-act="item-detail" data-uid="${item.uid}">
        <div class="itop"><span class="iicon">${this.itemIcon(item)}</span>${item.kind === 'equip' ? `<span class="tier-badge">T${item.tier}</span>` : ''}</div>
        <span class="iname">${escapeHtml(item.name)}</span>
        <span class="imeta">${meta}</span>
        ${item.kind === 'equip' && this.itemRestriction(item) !== `${CLASSES[this.state.char.classId].name} · ${FACTIONS[this.state.char.faction].name}` ? `<span class="restrict">${this.itemRestriction(item)}</span>` : ''}
        ${actions}
      </button>`;
  }

  itemDetailHtml(uid, opts = {}) {
    const item = this.state.findItem(uid);
    if (!item) return '<div class="empty"><span>?</span>That item is no longer here.</div>';
    const color = item.kind === 'equip' ? this.rarityColor(item) : item.kind === 'stone' ? '#ffd166' : '#a8e07a';
    const equippedSlot = Object.entries(this.state.data.equipped).find(([, it]) => it?.uid === uid)?.[0];
    const can = item.kind === 'equip' ? this.state.canEquip(item) : { ok: false };
    const insideInventory = this.state.data.inventory.some(i => i.uid === uid);
    const insideStorage = this.state.data.storage.some(i => i.uid === uid);

    let body = '';
    if (item.kind === 'equip') {
      body = `
        <div class="stat-grid mt8">${this.itemStatsHtml(item)}</div>
        <div class="row wrap mt8">
          <span class="tag">${SLOT_NAME[item.slot]}</span>
          <span class="tag">${RARITIES[item.rarity].name}</span>
          <span class="tag gold">Tier ${item.tier}</span>
          <span class="tag">Item level ${item.level}</span>
          <span class="tag ${can.ok ? 'green' : 'red'}">${this.itemRestriction(item)} only</span>
        </div>
        ${item.bonuses?.length ? `<div class="row wrap mt8">${item.bonuses.map(b => `<span class="tag green">${BONUS_STATS[b.stat].icon} +${b.value}${b.stat === 'crit' ? '%' : ''}</span>`).join('')}</div>` : ''}
        <div class="row wrap mt12">
          ${equippedSlot
            ? `<button class="btn btn-sm" data-act="unequip" data-slot="${equippedSlot}">Unequip</button>`
            : insideInventory && can.ok
              ? `<button class="btn btn-sm btn-primary" data-act="equip" data-uid="${uid}">Equip</button>`
              : insideInventory
                ? `<button class="btn btn-sm" disabled>Cannot equip</button>` : ''}
          ${insideInventory ? `<button class="btn btn-sm" data-act="sell" data-uid="${uid}">Sell · ${fmt(Math.round((item.value || 100) * CONFIG.economy.npcSellRate))}g</button>` : ''}
          ${insideInventory ? `<button class="btn btn-sm" data-act="deposit" data-uid="${uid}">Store</button>` : ''}
          ${insideStorage ? `<button class="btn btn-sm btn-primary" data-act="withdraw" data-uid="${uid}">Withdraw</button>` : ''}
          <button class="btn btn-sm btn-ghost" data-act="item-back">← Back</button>
        </div>
        ${!equippedSlot && insideInventory && !can.ok ? `<div class="note warn mt8">Class and faction restrictions are strict. Everyone can farm, craft, buy and sell this item — only a matching ${CLASSES[item.classId].name} of the ${FACTIONS[item.faction].name} can wear it.</div>` : ''}
        <div class="note mt8">Rarity visuals: Common/Grey are understated, Green/Blue improve, Epic and above grow increasingly spectacular. Tier glow: T3 none, T2 small, T1 strong. Effects show on your character.</div>`;
    } else if (item.kind === 'stone') {
      body = `
        <div class="stat-grid mt8">
          <div class="stat-line"><span>${BONUS_STATS[item.stat].name}</span><b class="pos">+${item.value}${item.stat === 'crit' ? '%' : ''}</b></div>
          <div class="stat-line"><span>Class</span><b>${CLASSES[item.classId].name}</b></div>
          <div class="stat-line"><span>Stone tier</span><b>${item.tier === 3 ? 'Sovereign' : item.tier === 2 ? 'Greater' : 'Lesser'}</b></div>
        </div>
        <p class="panel-lead mt8">Boss stones are tradeable. Apply up to 3 per equipment piece at the Enchanter. Replacing a bonus returns the old stone — nothing is destroyed.</p>
        <div class="row wrap mt8">
          <button class="btn btn-sm" data-act="enchant-from-stone" data-uid="${uid}">Use at Enchanter</button>
          <button class="btn btn-sm btn-ghost" data-act="item-back">← Back</button>
        </div>`;
    } else if (item.kind === 'material') {
      body = `
        <p class="panel-lead">${escapeHtml(item.desc || MATERIALS[item.materialId]?.desc || 'A crafting material.')}</p>
        <div class="row wrap mt8">
          <span class="tag green">×${item.count} in bag</span>
          <span class="tag">Used for quests, Legendary crafting and trading.</span>
        </div>
        <div class="row wrap mt12">
          <button class="btn btn-sm" data-act="sell" data-uid="${uid}">Sell stack</button>
          <button class="btn btn-sm" data-act="deposit" data-uid="${uid}">Store</button>
          <button class="btn btn-sm btn-ghost" data-act="item-back">← Back</button>
        </div>`;
    }

    return `
      <button class="btn btn-sm btn-ghost mb8" data-act="item-back">← Back</button>
      <div class="item-detail-head">
        <div class="item-icon-lg" style="border-color:${color}66">${this.itemIcon(item)}</div>
        <div style="min-width:0">
          <h4 class="item-name-lg" style="color:${color}">${escapeHtml(item.name)}</h4>
          <div class="row wrap">
            ${item.kind === 'equip' ? `<span class="tag gold">${TIERS[item.tier].name}</span>` : ''}
            <span class="tag">${item.kind === 'equip' ? RARITIES[item.rarity].name : item.kind === 'stone' ? 'Boss Stone' : 'Material'}</span>
            ${item.kind === 'equip' ? `<span class="tag">${SLOT_NAME[item.slot]}</span>` : ''}
            ${equippedSlot ? '<span class="tag green">Equipped</span>' : ''}
          </div>
          ${item.kind === 'equip' ? `<div class="item-restrict">Restricted: ${this.itemRestriction(item)}</div>` : ''}
        </div>
      </div>
      ${body}`;
  }

  // ---------- inventory ----------
  panelInventory() {
    if (this.itemUid) return this.itemDetailHtml(this.itemUid);
    const inv = this.state.data.inventory;
    const stones = this.state.data.stones;
    const tab = this.invFilter;
    let list = [];
    if (tab === 'equip') list = inv.filter(i => i.kind === 'equip');
    if (tab === 'material') list = inv.filter(i => i.kind === 'material');
    if (tab === 'stone') list = stones;
    return `
      <div class="row between mb8">
        <div class="panel-lead" style="margin:0">Bag capacity <b>${this.state.inventoryCount()} / ${this.state.inventoryCap()}</b> · ${fmt(this.state.char.gold)} gold</div>
        <button class="btn btn-sm" data-act="open-shop">Get more space</button>
      </div>
      <div class="tabs">
        <button class="${tab === 'equip' ? 'active' : ''}" data-act="inv-filter" data-filter="equip">Equipment (${inv.filter(i => i.kind === 'equip').length})</button>
        <button class="${tab === 'material' ? 'active' : ''}" data-act="inv-filter" data-filter="material">Materials (${inv.filter(i => i.kind === 'material').length})</button>
        <button class="${tab === 'stone' ? 'active' : ''}" data-act="inv-filter" data-filter="stone">Stones (${stones.length})</button>
      </div>
      ${list.length ? `<div class="item-grid">${list.map(i => this.itemCard(i)).join('')}</div>` : `<div class="empty"><span>${tab === 'stone' ? '◈' : '🎒'}</span>${tab === 'stone' ? 'Defeat bosses to find tradeable bonus stones.' : tab === 'material' ? 'Gather herbs, ore and boss materials out in the world.' : 'No equipment yet. Monsters drop T3 gear.'}</div>`}
      <div class="note mt12">All equipment drops are Tier 3. Drop rates: Common 60% · Grey 25% · Green 10% · Blue 5%. Epic and above never drop directly — fuse or craft them.</div>
    `;
  }

  // ---------- character ----------
  panelCharacter() {
    const state = this.state;
    const c = state.char;
    const st = state.stats();
    const equipped = state.data.equipped;
    const cls = CLASSES[c.classId];
    const wings = SHOP.wings.filter(w => c.wingsUnlocked.includes(w.id));
    const mounts = SHOP.mounts.filter(m => c.mountsOwned.includes(m.id));
    const pets = SHOP.pets.filter(p => c.petsOwned.includes(p.id));
    const costumes = SHOP.costumes.filter(x => c.costumesOwned.includes(x.id));
    const skill = cls.skill;
    const upgradeCost = state.skillUpgradeCost();
    const reqLevel = state.skillUpgradeLevelReq();

    return `
      <div class="player-summary">
        <div class="avatar">${this.classIcon()}</div>
        <div>
          <h4>${escapeHtml(c.name)} <span class="tag gold">${state.title()}</span></h4>
          <div class="sub">Lv ${c.level} ${FACTIONS[c.faction].name.replace(/s$/, '')} ${cls.name} · ${fmt(st.power)} power · ${c.kills} kills · ${c.bosses} bosses</div>
        </div>
      </div>
      <div class="panel-grid grid-2">
        <div>
          <div class="preview-box"><canvas id="charPreview" width="280" height="340"></canvas></div>
          <div class="row between mt8 tiny muted"><span>${c.wingsActive ? 'Wings visible' : 'Wings hidden'}</span><span>${c.mountActive ? 'Mounted' : 'On foot'}</span></div>
        </div>
        <div>
          <div class="stat-grid">
            <div class="stat-line"><span>Health</span><b>${Math.round(c.hp)} / ${st.maxHp}</b></div>
            <div class="stat-line"><span>Mana</span><b>${Math.round(c.mana)} / ${st.maxMana}</b></div>
            <div class="stat-line"><span>Attack</span><b>${st.attack}</b></div>
            <div class="stat-line"><span>Defense</span><b>${st.defense}</b></div>
            <div class="stat-line"><span>Critical</span><b>${pct(st.crit)} <span class="tiny muted">/ cap 50%</span></b></div>
            <div class="stat-line"><span>Attack speed</span><b>${st.attackSpeedPct.toFixed(2)}/s</b></div>
            <div class="stat-line"><span>Movement</span><b>${st.moveSpeed.toFixed(1)} tiles/s</b></div>
            <div class="stat-line"><span>Gold / hour</span><b>${fmt(state.economySummary().goldPerHour)}</b></div>
          </div>
          <div class="mt8 row wrap"><span class="tag green">STR ${Math.round(st.str)}</span><span class="tag blue">INT ${Math.round(st.int)}</span><span class="tag green">DEX ${Math.round(st.dex)}</span><span class="tag red">VIT ${Math.round(st.vit)}</span></div>
          <div class="section-title">Equipment</div>
          <div class="slot-grid">
            ${SLOTS.map(slot => {
              const item = equipped[slot.id];
              return `<button class="slot ${item ? 'filled' : ''}" style="${item ? `--rar:${this.rarityColor(item)}` : ''}" data-act="${item ? 'item-detail' : 'noop'}" data-uid="${item?.uid || ''}">
                <span class="si">${item ? this.itemIcon(item) : slot.icon}</span>
                <span class="sn">${item ? escapeHtml(item.name) : slot.name}</span>
                <span class="sl">${item ? `T${item.tier}` : 'empty'}</span>
              </button>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="section-title">Signature Skill — ${skill.name}</div>
      <div class="card">
        <div class="row between">
          <div><h4 style="margin:0">${skill.icon} ${skill.name} <span class="tag gold">Lv ${c.skillLevel} / 10</span></h4>
          <div class="sub mt8">${skill.desc} Base ${Math.round(skill.multiplier * 100)}% attack · radius ${skill.radius.toFixed(1)} · ${skill.mana} mana · ${skill.cooldown}s cooldown.</div></div>
        </div>
        <div class="fuse-progress mt8">${Array.from({ length: 10 }).map((_, i) => `<span class="fuse-pip ${i < c.skillLevel ? 'on' : ''}"></span>`).join('')}</div>
        <div class="row between mt8">
          <span class="tiny muted">${c.skillLevel >= 10 ? 'Maximum level reached.' : `Next: +16% skill damage · requires level ${reqLevel} · ${fmt(upgradeCost)} gold`}</span>
          ${c.skillLevel >= 10 ? '<span class="tag gold">MAX</span>' : `<button class="btn btn-sm ${c.level >= reqLevel && c.gold >= upgradeCost ? 'btn-primary' : ''}" data-act="upgrade-skill" ${c.level >= reqLevel && c.gold >= upgradeCost ? '' : 'disabled'}>Upgrade · ${fmt(upgradeCost)}g</button>`}
        </div>
      </div>

      <div class="section-title">Wings</div>
      <div class="card tight">
        ${wings.length ? `<div class="row wrap">${wings.map(w => `<button class="btn btn-sm ${c.wingsActive === w.id ? 'btn-primary' : ''}" data-act="wings" data-id="${w.id}">${w.name}${c.wingsActive === w.id ? ' · visible' : ''}</button>`).join('')}</div>` : `<div class="sub">No wings unlocked. Complete the main questline (Chapter 4) or purchase cosmetic wings in the shop. Wings are never dropped or traded.</div>`}
        <div class="row wrap mt8"><button class="btn btn-sm btn-ghost" data-act="open-shop-wings">Wing shop</button><span class="tiny muted">Cosmetic only · faction-specific</span></div>
      </div>

      <div class="section-title">Mounts & Companions</div>
      <div class="card tight">
        <div class="row wrap">
          ${mounts.length ? mounts.map(m => `<button class="btn btn-sm ${c.mountActive === m.id ? 'btn-primary' : ''}" data-act="mount-set" data-id="${m.id}">${m.name} · +${Math.round((m.speed - 1) * 100)}%</button>`).join('') : '<span class="sub">No mounts yet. A main side quest grants one at level 5; others are in the shop.</span>'}
          ${mounts.length ? `<button class="btn btn-sm" data-act="mount-toggle">${c.mountActive ? 'Dismount' : 'Ride'}</button>` : ''}
        </div>
        <div class="row wrap mt8">
          ${pets.length ? pets.map(p => `<button class="btn btn-sm ${c.petActive === p.id ? 'btn-primary' : ''}" data-act="pet-set" data-id="${p.id}">${p.name}</button>`).join('') : '<span class="sub">No pets yet. Cosmetic companions are available in the shop.</span>'}
        </div>
        ${costumes.length ? `<div class="row wrap mt8">${costumes.map(x => `<button class="btn btn-sm ${c.costume === x.id ? 'btn-primary' : ''}" data-act="costume-set" data-id="${x.id}">${x.name}</button>`).join('')}<button class="btn btn-sm" data-act="costume-set" data-id="">Remove costume</button></div>` : ''}
      </div>

      <div class="section-title">Progress</div>
      <div class="stat-grid">
        <div class="stat-line"><span>Regions visited</span><b>${new Set(['greendale', c.region]).size}/8</b></div>
        <div class="stat-line"><span>Quests completed</span><b>${state.data.quests.completed.length}</b></div>
        <div class="stat-line"><span>Dungeons cleared</span><b>${c.dungeons || 0}</b></div>
        <div class="stat-line"><span>Deaths</span><b>${c.deaths || 0}</b></div>
        <div class="stat-line"><span>Playtime</span><b>${fmtTime(state.data.playtime)}</b></div>
        <div class="stat-line"><span>Lifetime gold earned</span><b>${fmt(state.data.economy.lifetimeEarned)}</b></div>
      </div>
    `;
  }

  // ---------- quests ----------
  panelQuests() {
    const state = this.state;
    const active = state.data.quests.active.map(a => ({ ...a, def: QUESTS.find(q => q.id === a.id) })).filter(a => a.def);
    const available = state.availableQuests().filter(q => q.region === state.char.region);
    const completed = QUESTS.filter(q => state.data.quests.completed.includes(q.id));
    return `
      <p class="panel-lead">Quests come from the <b>Quest Keeper</b> in each hub. Turn-ins are instant from this log. Main quest chapters unlock wings at Chapter 4.</p>
      <div class="section-title">Active (${active.length})</div>
      ${active.length ? `<div class="panel-grid">${active.map(({ def: q, progress }) => {
        const p = state.questProgress(q);
        const complete = p >= q.required;
        return `<div class="quest-card ${complete ? 'complete' : 'active'}">
          <div class="row between"><h4>${q.title}</h4><span class="tag ${q.chain === 'main' ? 'gold' : ''}">${q.chain === 'main' ? 'MAIN' : 'SIDE'} · Lv ${q.level}</span></div>
          <p>${q.desc}</p>
          <div class="quest-meta"><span class="tag">${REGIONS[q.region].name}</span><span class="tag">${this.objectiveText(q)}</span><span class="quest-reward">${fmt(q.rewards.gold || 0)}g · ${fmt(q.rewards.xp || 0)} XP${q.rewards.unlock === 'wings_quest' ? ' · Wings' : ''}${q.rewards.unlock === 'mount_gift' ? ' · Mount' : ''}</span></div>
          <div class="progress"><div style="width:${Math.min(100, p / q.required * 100)}%"></div></div>
          <div class="row between mt8">
            <span class="tiny muted">${p} / ${q.required}${complete ? ' · complete' : ''}</span>
            <div class="row">
              ${complete ? `<button class="btn btn-sm btn-primary" data-act="quest-claim" data-id="${q.id}">Claim reward</button>` : ''}
              <button class="btn btn-sm btn-ghost" data-act="quest-abandon" data-id="${q.id}">Abandon</button>
            </div>
          </div>
        </div>`;
      }).join('')}</div>` : '<div class="empty"><span>❖</span>No active quests. Visit a Quest Keeper.</div>'}

      <div class="section-title">Available (${available.length})</div>
      ${available.length ? `<div class="panel-grid">${available.map(q => `
        <div class="quest-card">
          <div class="row between"><h4>${q.title}</h4><span class="tag ${q.chain === 'main' ? 'gold' : ''}">${q.chain === 'main' ? 'MAIN' : 'SIDE'} · Lv ${q.level}</span></div>
          <p>${q.desc}</p>
          <div class="quest-meta"><span class="tag">${REGIONS[q.region].name}</span><span class="tag">${this.objectiveText(q)}</span><span class="quest-reward">${fmt(q.rewards.gold || 0)}g · ${fmt(q.rewards.xp || 0)} XP</span></div>
          <div class="row between mt8"><span class="tiny muted">Rewards: ${q.rewards.unlock === 'wings_quest' ? 'Wings unlock' : q.rewards.unlock === 'mount_gift' ? 'Mount unlock' : 'Gold & XP'}</span><button class="btn btn-sm" data-act="quest-accept" data-id="${q.id}">Accept</button></div>
        </div>`).join('')}</div>` : '<div class="empty"><span>✓</span>No new quests available at your level. Level up or finish prerequisites.</div>'}

      <div class="section-title">Completed (${completed.length})</div>
      <div class="row wrap">${completed.length ? completed.map(q => `<span class="tag green">${q.title}</span>`).join('') : '<span class="tiny muted">None yet.</span>'}</div>
    `;
  }

  objectiveText(q) {
    if (q.type === 'kill') return `Kill ${q.required} × ${MONSTERS[q.target]?.name || q.target}`;
    if (q.type === 'collect') return `Collect ${q.required} × ${MATERIALS[q.target]?.name || q.target}`;
    if (q.type === 'level') return `Reach level ${q.required}`;
    return `${q.required} × ${q.target}`;
  }

  // ---------- map ----------
  panelMap() {
    const game = this.game;
    const state = this.state;
    const current = state.region();
    const inDungeon = game?.currentDungeon;
    return `
      <p class="panel-lead">Teleport through the ley network. Costs scale with distance: <b>same region 500</b> · nearby 2,000 · medium 5,000 · far 10,000 · endgame 20,000. Dungeons cost <b>25,000–50,000</b>.</p>
      ${inDungeon ? `<div class="card mb8"><div class="row between"><div><h4 style="margin:0">Dungeon: ${inDungeon.name}</h4><div class="sub">${inDungeon.desc}</div></div><button class="btn btn-sm" data-act="return-hub">Return to hub · 500g</button></div></div>` : ''}
      <div class="section-title">Regions</div>
      <div class="panel-grid grid-2">
        ${REGION_ORDER.map((id, i) => {
          const r = REGIONS[id];
          const isCurrent = id === state.char.region && !inDungeon;
          const cost = isCurrent ? 0 : (game ? game.teleportCostTo(id) : state.teleportCost(state.char.region, id));
          return `<div class="region-card ${isCurrent ? 'current' : ''}">
            <div class="row between"><h4>${r.name}</h4><span class="tag ${isCurrent ? 'green' : ''}">${isCurrent ? 'HERE' : `#${i + 1}`}</span></div>
            <div class="epi">${r.epithet}</div>
            <div class="lvl">Recommended Lv ${r.levelRange[0]}–${r.levelRange[1]} · ${r.teleportTier} route</div>
            <div class="desc">${r.lore}</div>
            <div class="row between mt8"><span class="price">${isCurrent ? '500g to reopen' : cost ? fmt(cost) + 'g' : 'Free'}</span><button class="btn btn-sm ${isCurrent ? '' : 'btn-primary'}" data-act="travel" data-region="${id}">${isCurrent ? 'Fast travel' : 'Teleport'}</button></div>
          </div>`;
        }).join('')}
      </div>
      <div class="section-title">Dungeons</div>
      <div class="panel-grid grid-2">
        ${DUNGEONS.map(d => {
          const boss = MONSTERS[d.boss];
          return `<div class="dungeon-card">
            <div class="row between"><h4 style="margin:0;color:#ffb08a">${d.name}</h4><span class="tag red">Lv ${d.level}</span></div>
            <div class="sub mt8">${d.desc}</div>
            <div class="row between mt8"><span class="tiny muted">Boss: ${boss?.name || d.boss} · ${REGIONS[d.region].name}</span><span class="price">${fmt(d.cost)}g</span></div>
            <button class="btn btn-sm btn-primary mt8" data-act="dungeon" data-id="${d.id}">Enter dungeon</button>
          </div>`;
        }).join('')}
      </div>
      <div class="note mt12">Dungeons and bosses respawn over time. Travel between regions uses the ley network (the Teleporter). Free walking covers the roads, villages and wilds inside each region.</div>
    `;
  }

  // ---------- blacksmith ----------
  panelBlacksmith() {
    const state = this.state;
    const groups = state.fusionGroups();
    const cores = state.countMaterial('mat_primordial_core');
    const rareMats = REGION_ORDER.reduce((s, r) => s + state.countMaterial(REGIONS[r].material.id), 0);
    return `
      <p class="panel-lead">Fuse <b>4 identical items</b> — same class, faction, type, rarity and tier — into the next tier. T3 → T2 → T1 → next rarity T3. Fusion never destroys the result or randomly fails.</p>
      <div class="section-title">Fusion (${groups.length} ready)</div>
      ${groups.length ? `<div class="panel-grid grid-2">${groups.map(g => {
        const s = g.sample;
        const cost = state.fusionCost(s);
        const next = state.fusionNext(s);
        const nextRarity = next ? RARITIES[next.rarity] : null;
        return `<div class="fuse-card" style="--rar:${this.rarityColor(s)}">
          <div class="fuse-head">
            <div class="fuse-icon">${this.itemIcon(s)}</div>
            <div style="min-width:0"><h4>${escapeHtml(s.name)}</h4><div class="tiny muted">${CLASSES[s.classId].name} · ${FACTIONS[s.faction].name} · ${SLOT_NAME[s.slot]} · ${RARITIES[s.rarity].name} T${s.tier}</div></div>
          </div>
          <div class="row between"><span class="tiny muted">${g.items.length} identical</span><span class="fuse-progress">${Array.from({ length: 4 }).map((_, i) => `<span class="fuse-pip ${i < Math.min(4, g.items.length) ? 'on' : ''}"></span>`).join('')}</span></div>
          <div class="row between"><span class="tiny">Next: <b style="color:${nextRarity?.color || 'inherit'}">${nextRarity ? `${nextRarity.name} T${next.tier}` : '—'}</b></span><span class="price">${cost == null ? 'MAX' : fmt(cost) + 'g'}</span></div>
          <button class="btn btn-sm ${cost != null && state.char.gold >= cost ? 'btn-primary' : ''}" data-act="fuse" data-key="${escapeHtml(g.key)}" ${cost == null || state.char.gold < cost ? 'disabled' : ''}>Fuse 4 items</button>
        </div>`;
      }).join('')}</div>` : `<div class="empty"><span>⚒</span>No group of 4 identical items yet. Keep farming — every equipment drop is T3.</div>`}

      <div class="section-title">Legendary Crafting</div>
      <div class="card">
        <p class="panel-lead">Legendary gear is <b>crafted</b>, not dropped. Bring Primordial Cores from bosses and rare region materials to the forge.</p>
        <div class="stat-grid">
          <div class="stat-line"><span>Primordial Cores</span><b class="${cores >= CONFIG.fusion.legendaryCores ? 'green-text' : 'red-text'}">${cores} / ${CONFIG.fusion.legendaryCores}</b></div>
          <div class="stat-line"><span>Rare region materials</span><b class="${rareMats >= CONFIG.fusion.legendaryMaterials ? 'green-text' : 'red-text'}">${rareMats} / ${CONFIG.fusion.legendaryMaterials}</b></div>
          <div class="stat-line"><span>Crafting cost</span><b>${fmt(CONFIG.fusion.special.legendaryCraft)}g</b></div>
          <div class="stat-line"><span>Result</span><b>Legendary T3 · your class/faction</b></div>
        </div>
        <div class="row wrap mt8">${SLOTS.map(s => `<button class="btn btn-sm ${this.craftSlot === s.id ? 'btn-primary' : ''}" data-act="craft-slot" data-slot="${s.id}">${s.icon} ${s.name}</button>`).join('')}</div>
        <button class="btn btn-primary mt8" data-act="craft-legendary" ${cores >= CONFIG.fusion.legendaryCores && rareMats >= CONFIG.fusion.legendaryMaterials && state.char.gold >= CONFIG.fusion.special.legendaryCraft ? '' : 'disabled'}>Forge Legendary ${SLOT_NAME[this.craftSlot]} · ${fmt(CONFIG.fusion.special.legendaryCraft)}g</button>
      </div>
      <div class="note mt12">Mythic requires 4 matching Legendary items (30,000,000g). Divine requires 4 matching Mythic items (120,000,000g). Divine T3 → T2 → T1 is possible. All prices live in <b>src/config.js</b>.</div>
    `;
  }

  // ---------- enchanter ----------
  panelEnchanter() {
    const state = this.state;
    const equips = [...Object.values(state.data.equipped).filter(Boolean), ...state.data.inventory.filter(i => i.kind === 'equip')];
    const stones = state.data.stones;
    const item = this.enchantItem ? state.findItem(this.enchantItem) : null;
    const stone = this.enchantStone ? stones.find(s => s.uid === this.enchantStone) : null;
    const cost = stone ? state.enchantCost(stone) : 0;
    return `
      <p class="panel-lead">Boss stones add <b>Strength / Intelligence / Dexterity / Life / Crit</b> bonuses. Max <b>3 bonuses per item</b>. Replacing a bonus returns the old stone — no random destruction. Total Critical Chance is capped at <b>50%</b>.</p>
      <div class="panel-grid grid-2">
        <div>
          <div class="section-title">1 · Choose equipment</div>
          <div class="select-list">
            ${equips.length ? equips.map(i => `<button class="select-item ${this.enchantItem === i.uid ? 'selected' : ''}" style="--rar:${this.rarityColor(i)}" data-act="enchant-item" data-uid="${i.uid}">
              <span><span style="color:${this.rarityColor(i)}">${escapeHtml(i.name)}</span><span class="sm">T${i.tier} · ${(i.bonuses || []).length}/3 bonuses</span></span><span>${this.itemIcon(i)}</span>
            </button>`).join('') : '<div class="empty">No equipment.</div>'}
          </div>
        </div>
        <div>
          <div class="section-title">2 · Choose boss stone</div>
          <div class="select-list">
            ${stones.length ? stones.map(s => {
              const compatible = item ? s.classId === item.classId : true;
              return `<button class="select-item ${this.enchantStone === s.uid ? 'selected' : ''}" style="--rar:${s.tier === 3 ? '#ffb23e' : s.tier === 2 ? '#5aa9ff' : '#9aa0a6'}; opacity:${compatible ? 1 : .45}" data-act="enchant-stone" data-uid="${s.uid}" ${compatible ? '' : 'title="Class mismatch"'}>
                <span><span>${s.name}</span><span class="sm">${CLASSES[s.classId].name} · ${s.tier === 3 ? 'Sovereign' : s.tier === 2 ? 'Greater' : 'Lesser'}</span></span><span>${s.icon}</span>
              </button>`;
            }).join('') : '<div class="empty"><span>◈</span>No boss stones. Bosses drop tradeable stones; stronger bosses drop better tiers.</div>'}
          </div>
        </div>
      </div>
      ${item ? `
        <div class="section-title">Selected item</div>
        <div class="card">
          <div class="row between"><div><h4 style="margin:0;color:${this.rarityColor(item)}">${escapeHtml(item.name)}</h4><div class="sub">${SLOT_NAME[item.slot]} · ${item.bonuses.length}/3 bonuses</div></div><span class="tag">${CLASSES[item.classId].name}</span></div>
          <div class="row wrap mt8">${item.bonuses.length ? item.bonuses.map((b, i) => `<span class="tag green">${BONUS_STATS[b.stat].icon} +${b.value}${b.stat === 'crit' ? '%' : ''} ${BONUS_STATS[b.stat].name}</span>`).join('') : '<span class="tiny muted">No bonuses yet.</span>'}</div>
          ${stone ? `<div class="note mt8">Applying <b>${stone.name}</b> costs <b>${fmt(cost)} gold</b>.${item.bonuses.length >= 3 ? ' All 3 slots are full — choose a bonus to replace below.' : ''}</div>` : '<div class="note mt8">Choose a matching stone to apply.</div>'}
          ${stone && item.bonuses.length >= 3 ? `<div class="row wrap mt8">${item.bonuses.map((b, i) => `<button class="btn btn-sm btn-danger" data-act="enchant-replace" data-index="${i}">Replace ${BONUS_STATS[b.stat].short} +${b.value}</button>`).join('')}</div>` : ''}
          ${stone && item.bonuses.length < 3 ? `<button class="btn btn-primary mt8" data-act="enchant-apply" ${state.char.gold >= cost ? '' : 'disabled'}>Apply stone · ${fmt(cost)}g</button>` : ''}
        </div>` : '<div class="note mt12">Select an item to see its bonuses.</div>'}
    `;
  }

  // ---------- potions ----------
  panelPotions() {
    const state = this.state;
    const c = state.char;
    const groups = [
      ['Health', ['health_small', 'health_medium', 'health_large']],
      ['Mana', ['mana_small', 'mana_medium', 'mana_large']],
      ['Attack Speed', ['attack_small', 'attack_medium', 'attack_large']],
      ['Movement Speed', ['move_small', 'move_medium', 'move_large']]
    ];
    return `
      <p class="panel-lead">Every purchase is a <b>package of ${CONFIG.potionPackageSize} potions</b>. Tonics grant timed buffs. No durability or repair costs exist in Aetheria.</p>
      ${groups.map(([label, ids]) => `
        <div class="section-title">${label}</div>
        <div class="panel-grid">
          ${ids.map(id => {
            const p = CONFIG.potions[id];
            if (!p) return '';
            const count = c.consumables[id] || 0;
            return `<div class="card tight">
              <div class="row between">
                <div class="row"><span style="font-size:20px">${id.startsWith('health') ? '🧪' : id.startsWith('mana') ? '🔷' : id.startsWith('attack') ? '⚡' : '💨'}</span>
                <div><div style="font-size:11px">${p.name}</div><div class="tiny muted">${p.heal ? `Restores ${p.heal} HP` : p.mana ? `Restores ${p.mana} mana` : p.buff === 'attackSpeed' ? `+${Math.round((p.mult - 1) * 100)}% attack speed · ${p.seconds / 60} min` : `+${Math.round((p.mult - 1) * 100)}% move speed · ${p.seconds / 60} min`} · 100 per pack</div></div></div>
                <div style="text-align:right"><div class="price">${fmt(p.price)}g</div><div class="tiny muted">Owned: ${count}</div></div>
              </div>
              <button class="btn btn-sm mt8" data-act="buy-potion" data-id="${id}" ${c.gold < p.price ? 'disabled' : ''}>Buy ${CONFIG.potionPackageSize} · ${fmt(p.price)}g</button>
            </div>`;
          }).join('')}
        </div>`).join('')}
      <div class="section-title">Sell Loot</div>
      <div class="panel-grid">
        ${state.data.inventory.filter(i => i.kind === 'equip').slice(0, 8).map(i => `<div class="list-row">
          <span>${this.itemIcon(i)}</span>
          <div class="lr-main"><div class="lr-name" style="color:${this.rarityColor(i)}">${escapeHtml(i.name)}</div><div class="lr-sub">T${i.tier} · ${SLOT_NAME[i.slot]}</div></div>
          <button class="btn btn-sm" data-act="sell" data-uid="${i.uid}">Sell ${fmt(Math.round((i.value || 100) * CONFIG.economy.npcSellRate))}g</button>
        </div>`).join('') || '<div class="empty">No equipment to sell.</div>'}
      </div>
    `;
  }

  // ---------- storage ----------
  panelStorage() {
    const state = this.state;
    return `
      <div class="row between mb8"><p class="panel-lead" style="margin:0">Storage holds gear, materials and stones. Capacity <b>${state.data.storage.length} / ${CONFIG.storageSize}</b>.</p></div>
      <div class="section-title">Stored Items</div>
      ${state.data.storage.length ? `<div class="item-grid">${state.data.storage.map(i => `<button class="item-card" style="--rar:${i.kind === 'equip' ? this.rarityColor(i) : '#a8e07a'}" data-act="withdraw" data-uid="${i.uid}">
        <div class="itop"><span class="iicon">${this.itemIcon(i)}</span></div>
        <span class="iname">${escapeHtml(i.name)}</span>
        <span class="imeta">${i.kind === 'equip' ? `${SLOT_NAME[i.slot]} · T${i.tier}` : i.kind === 'material' ? `×${i.count}` : 'Stone'} · tap to withdraw</span>
      </button>`).join('')}</div>` : '<div class="empty"><span>▤</span>Storage is empty.</div>'}
      <div class="section-title">Bag</div>
      ${state.data.inventory.length ? `<div class="item-grid">${state.data.inventory.map(i => `<button class="item-card" style="--rar:${i.kind === 'equip' ? this.rarityColor(i) : '#a8e07a'}" data-act="deposit" data-uid="${i.uid}">
        <div class="itop"><span class="iicon">${this.itemIcon(i)}</span></div>
        <span class="iname">${escapeHtml(i.name)}</span>
        <span class="imeta">${i.kind === 'material' ? `×${i.count}` : i.kind === 'equip' ? `T${i.tier} · ${SLOT_NAME[i.slot]}` : 'Stone'} · tap to store</span>
      </button>`).join('')}</div>` : '<div class="empty">Bag is empty.</div>'}
    `;
  }

  // ---------- market ----------
  panelMarket() {
    const state = this.state;
    const active = state.stallActive();
    const remaining = (state.data.market.stallUntil - Date.now()) / 1000;
    const sellable = state.data.inventory.filter(i => i.kind === 'equip');
    const selected = this.marketSelected ? state.data.inventory.find(i => i.uid === this.marketSelected) : null;
    return `
      <div class="note warn">LOCAL SIMULATION: market buyers are simulated travelers, not real players. Gold paid by simulated buyers is created by the local simulation and recorded in the economy ledger. There is no real multiplayer in this build.</div>
      ${active ? `
        <div class="card mt8">
          <div class="row between"><div><h4 style="margin:0">Stall active</h4><div class="sub">Expires in ${fmtTime(remaining)} · ${state.data.market.listings.length}/${CONFIG.market.listingSlots} listing slots · no market tax</div></div><span class="tag green">24H</span></div>
        </div>
        <div class="section-title">List an item</div>
        ${sellable.length ? `
          <div class="panel-lead">Choose an item, set your price, list it. Buyers arrive within a few minutes (simulated).</div>
          <div class="select-list">${sellable.slice(0, 20).map(i => `<button class="select-item ${this.marketSelected === i.uid ? 'selected' : ''}" style="--rar:${this.rarityColor(i)}" data-act="market-select" data-uid="${i.uid}"><span><span style="color:${this.rarityColor(i)}">${escapeHtml(i.name)}</span><span class="sm">T${i.tier} · nominal ${fmt(i.value || 0)}g</span></span><span>${this.itemIcon(i)}</span></button>`).join('')}</div>
          <div class="row mt8"><input class="price-input" id="marketPrice" type="number" min="1" placeholder="Price" value="${selected ? Math.max(1, Math.round((selected.value || 100) * 1.4)) : ''}" /><button class="btn btn-sm btn-primary" data-act="market-list" ${selected ? '' : 'disabled'}>List for sale</button></div>
        ` : '<div class="empty">No equipment to list.</div>'}
        <div class="section-title">Your listings (${state.data.market.listings.length})</div>
        ${state.data.market.listings.length ? `<div class="list-plain">${state.data.market.listings.map(l => `<div class="list-row">
          <span>${this.itemIcon(l.item)}</span>
          <div class="lr-main"><div class="lr-name" style="color:${this.rarityColor(l.item)}">${escapeHtml(l.item.name)}</div><div class="lr-sub">Listed ${timeAgo(l.listedAt)} · ${fmt(l.price)}g · buyer incoming</div></div>
          <button class="btn btn-sm btn-ghost" data-act="market-cancel" data-id="${l.id}">Cancel</button>
        </div>`).join('')}</div>` : '<div class="empty">No listings yet.</div>'}
      ` : `
        <div class="card mt8">
          <h4>Rent your market stall</h4>
          <p class="sub">5,000 gold for 24 hours. ${CONFIG.market.listingSlots} listing slots. No mandatory market tax. Player-set prices.</p>
          <button class="btn btn-primary mt8" data-act="rent-stall" ${state.char.gold < CONFIG.market.stallCost ? 'disabled' : ''}>Rent stall · ${fmt(CONFIG.market.stallCost)}g / 24h</button>
        </div>
        <div class="note mt8">Player-to-player trading is not implemented because it requires an authoritative online backend. Here, sales are simulated locally and added to the economy ledger.</div>
      `}
      <div class="section-title">Sold history</div>
      ${state.data.market.sold.length ? `<div class="list-plain">${state.data.market.sold.slice(0, 8).map(s => `<div class="list-row"><span>${this.itemIcon(s.item)}</span><div class="lr-main"><div class="lr-name">${escapeHtml(s.item.name)}</div><div class="lr-sub">${fmt(s.price)}g · ${timeAgo(s.soldAt)} · ${s.buyer}</div></div><span class="tag green">SOLD</span></div>`).join('')}</div>` : '<div class="empty">Nothing sold yet.</div>'}
    `;
  }

  // ---------- shop ----------
  panelShop() {
    const state = this.state;
    const cat = this.shopCategory;
    const c = state.char;
    const tabs = SHOP_CATEGORIES.map(x => `<button class="${cat === x.id ? 'active' : ''}" data-act="shop-tab" data-cat="${x.id}">${x.icon} ${x.name}</button>`).join('');
    return `
      <div class="test-banner"><b>TEST PURCHASES ONLY.</b> No real money is charged. This build prepares the exact product IDs for future Google Play Billing (<code>${CONFIG.shop.playBillingSkuPrefix}&lt;id&gt;</code>). Server-side purchase verification is not implemented.</div>
      <div class="row between mb8"><div class="panel-lead" style="margin:0">Your gems: <b>◆ ${fmt(c.gems)}</b></div><span class="tag">Cosmetic only</span></div>
      <div class="tabs">${tabs}</div>
      ${cat === 'gems' ? this.shopGems() : this.shopCategoryItems(cat)}
      <div class="note mt12">Wings are cosmetic and faction-specific. They unlock through the main quest or shop, never through drops or trading.</div>
    `;
  }

  shopGems() {
    return `
      <div class="shop-grid">
        ${CONFIG.shop.gemPacks.map(p => `<div class="shop-card">
          <div class="sc-top"><div class="sc-icon">◆</div><div><h4>${fmt(p.gems)} Gems</h4><div class="tiny muted">${p.tag || 'Gem pack'} · TEST</div></div></div>
          <div class="price-row"><span class="price">${p.price} <small>test price</small></span><button class="btn btn-sm btn-primary" data-act="buy-shop" data-cat="gems" data-id="${p.id}">Test purchase</button></div>
        </div>`).join('')}
      </div>`;
  }

  shopCategoryItems(cat) {
    const state = this.state;
    const c = state.char;
    if (cat === 'offers') {
      return `<div class="shop-grid">${SHOP.offers.map(o => {
        const owned = state.ownsShopItem(o.id);
        return `<div class="shop-card">
          <div class="sc-top"><div class="sc-icon">✦</div><div><h4>${o.name}</h4><div class="tiny gold-text">${o.tag || ''}</div></div></div>
          <p>${o.desc}</p>
          <div class="price-row"><span class="price">◆ ${fmt(o.price)}</span>${owned ? '<span class="owned">OWNED</span>' : `<button class="btn btn-sm btn-primary" data-act="buy-shop" data-cat="offers" data-id="${o.id}">Test purchase</button>`}</div>
        </div>`;
      }).join('')}</div>`;
    }
    const list = SHOP[cat] || [];
    const icons = { wings: '🪽', mounts: '🐎', costumes: '🥋', hairstyles: '✂', pets: '🐾', effects: '✨', premium: '👑' };
    return `<div class="shop-grid">${list.map(item => {
      const owned = state.ownsShopItem(item.id);
      const factionBlocked = item.faction && item.faction !== c.faction;
      let note = '';
      if (cat === 'wings') note = `${FACTIONS[item.faction]?.name || ''} only`;
      if (cat === 'hairstyles') note = `${item.style} · ${item.color}`;
      return `<div class="shop-card">
        <div class="sc-top"><div class="sc-icon">${icons[cat] || '✦'}</div><div><h4>${item.name}</h4><div class="tiny muted">${note}</div></div></div>
        <p>${item.desc}</p>
        <div class="price-row"><span class="price">◆ ${fmt(item.price)}</span>
          ${owned ? '<span class="owned">OWNED</span>' : factionBlocked ? '<span class="tag red">Wrong faction</span>' : `<button class="btn btn-sm btn-primary" data-act="buy-shop" data-cat="${cat}" data-id="${item.id}">Test purchase</button>`}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  // ---------- settings / economy / about ----------
  panelSettings() {
    const s = this.state.data.settings;
    return `
      <div class="player-summary">
        <div class="avatar">${this.classIcon()}</div>
        <div><h4>${escapeHtml(this.state.char.name)}</h4><div class="sub">${FACTIONS[this.state.char.faction].name} · ${CLASSES[this.state.char.classId].name} · Lv ${this.state.char.level} · ${this.state.title()}</div></div>
      </div>
      <div class="section-title">Preferences</div>
      <div class="card tight">
        <div class="toggle-row"><span>Sound effects</span><button class="switch ${s.sound ? 'on' : ''}" data-act="toggle-sound"></button></div>
        <div class="toggle-row"><span>Show names in world</span><button class="switch ${s.showNames ? 'on' : ''}" data-act="toggle-names"></button></div>
        <div class="toggle-row"><span>Auto-attack nearby enemies</span><button class="switch ${s.autoAttack ? 'on' : ''}" data-act="toggle-auto"></button></div>
      </div>
      <div class="section-title">Journey</div>
      <div class="row wrap">
        <button class="btn" data-act="open-economy">Economy ledger</button>
        <button class="btn" data-act="open-about">About & backend</button>
        <button class="btn" data-act="open-howto">How to play</button>
      </div>
      <div class="section-title">Save</div>
      <div class="row wrap">
        <button class="btn" data-act="save-now">Save now</button>
        <button class="btn" data-act="export-save">Export save</button>
        <button class="btn btn-danger" data-act="reset-save">Delete save</button>
      </div>
      <div class="note mt8">Saved automatically every ${CONFIG.autosaveSeconds}s to this browser's localStorage. There is no cloud account yet; clearing browser data deletes the save.</div>
      <div class="section-title">Build</div>
      <div class="kv"><span>Version</span><b>1.0.0 local</b></div>
      <div class="kv"><span>Mode</span><b>Single-player simulation</b></div>
      <div class="kv"><span>Multiplayer</span><b class="red-text">Not implemented</b></div>
      <div class="kv"><span>Billing</span><b>Test purchases only</b></div>
    `;
  }

  panelEconomy() {
    const eco = this.state.economySummary();
    const sourceTotal = Math.max(1, eco.totalIn);
    const sinkTotal = Math.max(1, eco.totalOut);
    const sources = Object.entries(eco.sources).sort((a, b) => b[1] - a[1]);
    const sinks = Object.entries(eco.sinks).sort((a, b) => b[1] - a[1]);
    return `
      <div class="panel-grid grid-3">
        <div class="big-stat"><b>${fmt(eco.goldPerHour)}</b><span>Gold / hour</span></div>
        <div class="big-stat"><b>${fmt(eco.lifetimeEarned)}</b><span>Lifetime in</span></div>
        <div class="big-stat"><b>${fmt(eco.lifetimeSpent)}</b><span>Lifetime out</span></div>
      </div>
      <div class="row between mt8"><span class="tiny muted">Target endgame income: <b>${fmt(eco.target)} gold/hour</b></span><span class="tiny muted">Net: ${fmt(eco.net)}</span></div>
      <div class="section-title">Gold sources (in)</div>
      <div class="eco-bars">${sources.length ? sources.map(([k, v]) => `<div class="eco-bar"><span>${this.labelize(k)}</span><div class="track"><div style="width:${v / sourceTotal * 100}%"></div></div><b>${fmt(v)}</b></div>`).join('') : '<div class="tiny muted">No income yet.</div>'}</div>
      <div class="section-title">Gold sinks (out)</div>
      <div class="eco-bars">${sinks.length ? sinks.map(([k, v]) => `<div class="eco-bar out"><span>${this.labelize(k)}</span><div class="track"><div style="width:${v / sinkTotal * 100}%"></div></div><b>${fmt(v)}</b></div>`).join('') : '<div class="tiny muted">No spending yet.</div>'}</div>
      <div class="section-title">Recent ledger</div>
      <div class="ledger">${eco.history.length ? eco.history.map(h => `<div class="ledger-line"><span>${timeAgo(h.ts)} · ${this.labelize(h.category)}</span><span class="${h.type === 'in' ? 'in' : 'out'}">${h.type === 'in' ? '+' : '−'}${fmt(h.amount)}g</span></div>`).join('') : '<div class="tiny muted">No transactions.</div>'}</div>
      <div class="note mt8">Playtime: ${fmtTime(this.state.data.playtime)}. All gold changes flow through a single ledger. Player trades only transfer existing gold. NPC sales are a gold source; fusion, teleports, potions, stalls and enchants are sinks.</div>
    `;
  }

  labelize(k) {
    return String(k).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  panelAbout() {
    return `
      <p class="panel-lead">Aetheria is a fully playable browser build of the requested fantasy MMORPG systems. It is deliberately honest about what is simulated and what needs an online backend.</p>
      <div class="section-title">Implemented locally</div>
      <div class="row wrap">
        ${['8 regions & loading transitions', 'Isometric pixel-art world', 'Angels & demons with wings', '3 classes, 5 hairstyles, 3 eye colors', 'One upgradeable class skill (10 levels)', '9 equipment slots & restrictions', '8 rarities · 3 tiers · scarcity glow', 'T3-only drops with exact rates', '4-item fusion & Legendary crafting', 'Boss stones & 3-bonus enchanting', 'Critical cap 50%', 'Quests, bosses, dungeons, respawns', 'Walking, mounts & teleportation', 'Potion packages of 100', 'Market stall & simulated buyers', 'Economy ledger & gold/hour tracking', 'Shop with test gem purchases', 'Local save / continue'].map(x => `<span class="tag green">${x}</span>`).join('')}
      </div>
      <div class="section-title">Not real multiplayer</div>
      <div class="note danger">This is a local single-player simulation. Market buyers, other players, chat, guilds, real-time trading and leaderboards are <b>not</b> online. They must not be presented as live multiplayer.</div>
      <div class="section-title">Online backend still required</div>
      <div class="list-plain">
        ${[
          'Account authentication and cloud save (OAuth / email, secure sessions)',
          'Authoritative server for combat, movement, loot and respawns (anti-cheat)',
          'Database for characters, inventories, equipment, quests and currency',
          'Real player-to-player trading with escrow and audit logs',
          'Auction house with server-side listings, taxes and settlement',
          'Chat, friends, guilds, parties and presence',
          'Leaderboards and seasonal rankings',
          'Google Play Billing server-side purchase verification and receipt reconciliation',
          'Push notifications, moderation, GDPR/data deletion tooling',
          'Crash reporting and telemetry'
        ].map(x => `<div class="kv"><span>${x}</span><b class="red-text">Backend</b></div>`).join('')}
      </div>
      <div class="section-title">Billing note</div>
      <div class="note warn">All shop actions are test purchases. Product IDs are prepared in <b>src/config.js</b> under <b>shop.playBillingSkuPrefix</b>. No payment SDK is connected and no real money is charged.</div>
      <div class="section-title">Design assumptions</div>
      <div class="note">Fusion prices, drop weights, teleport tiers, potion prices and economy targets are centralized in <b>src/config.js</b>. The market simulates buyers so the economy loop is playable offline. Dungeons are instanced runs of their host region with a dedicated boss and elite population.</div>
    `;
  }

  howToHtml(withData = false) {
    return `
      <p class="panel-lead">Aetheria is played with one thumb or a keyboard. Everything is local and saves automatically.</p>
      <div class="list-plain">
        ${HOW_TO_PLAY.map(([k, v]) => `<div class="card tight"><div class="row between"><b class="gold-text">${k}</b><span class="tiny muted">${k === 'Move' ? 'Joystick / WASD / tap' : k === 'Fight' ? 'Attack / Space' : k === 'Grow' ? 'Character panel' : ''}</span></div><div class="sub mt8">${v}</div></div>`).join('')}
      </div>
      <div class="section-title">Hotkeys</div>
      <div class="row wrap"><span class="tag">WASD / Arrows — move</span><span class="tag">Space — attack</span><span class="tag">Q — skill</span><span class="tag">E — interact</span><span class="tag">H — health potion</span><span class="tag">J — mana potion</span><span class="tag">B — bag</span><span class="tag">C — character</span><span class="tag">M — map</span><span class="tag">R — mount</span><span class="tag">F — auto attack</span></div>
      <div class="section-title">The loop</div>
      <div class="note">Kill monsters → collect T3 gear and boss stones → fuse 4 identical items → equip matching class/faction → complete quests → unlock wings and mounts → push into higher regions and dungeons. Gold/hour is tracked in the economy ledger.</div>
      ${!withData ? '<button class="btn btn-primary btn-wide mt12" data-act="close-howto">Back</button>' : '<button class="btn btn-wide mt12" data-act="close-modal">Close</button>'}
    `;
  }

  // ---------- NPC dialogue ----------
  panelNpc(npc) {
    if (!npc) return '<div class="empty">They have nothing to say.</div>';
    const roleActions = {
      'Quest Keeper': ['Open Quest Log', 'quests', '❖'],
      'Blacksmith': ['Open the Forge', 'blacksmith', '⚒'],
      'Potion Merchant': ['Browse Potions', 'potions', '⚗'],
      'Teleporter': ['Open World Map', 'map', '✧'],
      'Storage': ['Open Storage', 'storage', '▤'],
      'Enchanter': ['Open Enchanting', 'enchanter', '◈'],
      'Market Stall': ['Open Market Stall', 'market', '⚖']
    };
    const act = roleActions[npc.role] || ['Talk', null, '❖'];
    return `
      <div class="player-summary">
        <div class="avatar" style="color:${npc.color}">${npc.icon || '❖'}</div>
        <div><h4>${escapeHtml(npc.name)}</h4><div class="sub">${npc.role} · ${REGIONS[npc.region]?.hubName || ''}</div></div>
      </div>
      <div class="card"><p class="sub" style="font-family:var(--serif);font-size:13px;line-height:1.7;color:#ded5c4">“${escapeHtml(npc.greeting || 'Well met, traveler.')}”</p></div>
      <div class="row wrap mt12">
        ${act[1] ? `<button class="btn btn-primary" data-act="npc-open" data-panel="${act[1]}">${act[2]} ${act[0]}</button>` : ''}
        <button class="btn btn-ghost" data-act="close-modal">Leave</button>
      </div>
      ${npc.role === 'Quest Keeper' ? `<div class="note mt12">Main quest chapters lead through all eight regions. Chapter 4 unlocks wings for your faction.</div>` : ''}
      ${npc.role === 'Blacksmith' ? `<div class="note mt12">Bring 4 identical items. The forge does the rest. Legendary gear is crafted, never dropped.</div>` : ''}
      ${npc.role === 'Enchanter' ? `<div class="note mt12">Boss stones only. Up to 3 bonuses. Replacing one returns the old stone.</div>` : ''}
      ${npc.role === 'Market Stall' ? `<div class="note mt12">Buyers are simulated in this offline build. No real multiplayer trading.</div>` : ''}
    `;
  }

  // ------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------
  handleAction(d, el) {
    const state = this.state;
    const game = this.game;
    switch (d.act) {
      case 'noop': break;
      case 'close-modal': case 'close-howto': this.closeModal(); break;
      case 'item-back': this.itemUid = null; this.refreshPanel(); break;
      case 'item-detail': this.itemUid = d.uid; this.refreshPanel(); break;
      case 'inv-filter': this.invFilter = d.filter; this.itemUid = null; this.refreshPanel(); break;
      case 'open-shop': case 'open-shop-wings': this.closeModal(); this.shopCategory = d.act === 'open-shop-wings' ? 'wings' : 'gems'; this.openPanel('shop'); break;
      case 'equip': {
        const res = state.equip(d.uid);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'unequip': {
        const res = state.unequip(d.slot);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'sell': {
        const res = state.sellItem(d.uid);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'deposit': {
        const res = state.depositItem(d.uid);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'withdraw': {
        const res = state.withdrawItem(d.uid);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'quest-accept': {
        const res = state.acceptQuest(d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'quest-claim': {
        const res = state.claimQuest(d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'quest-abandon': {
        const res = state.abandonQuest(d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'travel': {
        if (!game) break;
        if (game.travelTo(d.region)) this.closeModal();
        break;
      }
      case 'dungeon': {
        if (!game) break;
        if (game.enterDungeon(d.id)) this.closeModal();
        break;
      }
      case 'return-hub': {
        game?.returnToHub();
        this.closeModal();
        break;
      }
      case 'fuse': {
        const res = state.fuseGroup(d.key);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'craft-slot': this.craftSlot = d.slot; this.refreshPanel(); break;
      case 'craft-legendary': {
        const res = state.craftLegendary(this.craftSlot);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'enchant-item': this.enchantItem = d.uid; this.refreshPanel(); break;
      case 'enchant-stone': this.enchantStone = d.uid; this.refreshPanel(); break;
      case 'enchant-apply': {
        const res = state.applyStone(this.enchantItem, this.enchantStone, -1);
        this.afterAction(res);
        this.enchantStone = null;
        this.refreshPanel();
        break;
      }
      case 'enchant-replace': {
        const res = state.applyStone(this.enchantItem, this.enchantStone, Number(d.index));
        this.afterAction(res);
        this.enchantStone = null;
        this.refreshPanel();
        break;
      }
      case 'enchant-from-stone': {
        this.enchantStone = d.uid;
        this.enchantItem = null;
        this.openPanel('enchanter');
        break;
      }
      case 'buy-potion': {
        const res = state.buyPotion(d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'rent-stall': {
        const res = state.rentStall();
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'market-select': this.marketSelected = d.uid; this.refreshPanel(); break;
      case 'market-list': {
        const price = Number(document.getElementById('marketPrice')?.value || 0);
        const res = state.listItem(this.marketSelected, price);
        if (res.ok) this.marketSelected = null;
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'market-cancel': {
        const res = state.cancelListing(d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'buy-shop': {
        const res = state.buyShopItem(d.cat, d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'shop-tab': this.shopCategory = d.cat; this.refreshPanel(); break;
      case 'wings': {
        const res = state.equipWings(d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'mount-set': {
        const res = state.setMount(d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'mount-toggle': {
        const res = state.toggleMount();
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'pet-set': {
        const res = state.setPet(d.id);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'costume-set': {
        const res = state.setCostume(d.id || null);
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'upgrade-skill': {
        const res = state.upgradeSkill();
        this.afterAction(res);
        this.refreshPanel();
        break;
      }
      case 'toggle-sound': {
        state.data.settings.sound = !state.data.settings.sound;
        if (game) game.sfx.enabled = state.data.settings.sound;
        state.save();
        this.refreshPanel();
        break;
      }
      case 'toggle-names': {
        state.data.settings.showNames = !state.data.settings.showNames;
        state.save();
        this.refreshPanel();
        break;
      }
      case 'toggle-auto': {
        state.data.settings.autoAttack = !state.data.settings.autoAttack;
        state.save();
        this.refreshPanel();
        break;
      }
      case 'open-economy': this.openPanel('economy'); break;
      case 'open-about': this.openPanel('about'); break;
      case 'open-howto': this.openPanel('howto'); break;
      case 'save-now': {
        const ok = state.save();
        this.toast({ msg: ok ? 'Game saved locally.' : 'Save failed.', type: ok ? 'success' : 'warn' });
        break;
      }
      case 'export-save': {
        const json = JSON.stringify(state.data);
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(json).then(() => this.toast({ msg: 'Save JSON copied to clipboard.', type: 'success' }))
            .catch(() => this.toast({ msg: 'Could not copy. Save remains in localStorage.', type: 'warn' }));
        } else {
          this.toast({ msg: 'Save is stored in localStorage under aetheria_save_v1.', type: 'info' });
        }
        break;
      }
      case 'reset-save': {
        if (window.confirm('Delete this save permanently? This cannot be undone.')) {
          state.resetSave();
          location.reload();
        }
        break;
      }
      case 'npc-open': {
        const panel = d.panel;
        this.closeModal();
        this.openPanel(panel);
        break;
      }
      default: break;
    }
  }

  afterAction(res) {
    if (!res) return;
    if (res.msg) this.toast({ msg: res.msg, type: res.ok ? 'success' : 'warn', small: !!res.ok, duration: res.ok ? 2600 : 3200 });
    if (res.ok) this.game?.sfx.play('ui');
  }
}

export default UI;
