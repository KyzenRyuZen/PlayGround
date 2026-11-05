// AETHERIA — interface layer. Owns character creation, the HUD, every panel,
// dialogue, prompts and touch controls. Everything stays on this device.
import {
  GAME, REGIONS, CLASSES, FACTIONS, WINGS, COSTUMES, MOUNTS, PETS, WEAPON_EFFECTS,
  SHOP, SLOTS, RARITIES, TIERS, PRICES, QUESTS, MONSTERS, HAIRSTYLES, HAIR_COLORS,
  EYE_COLORS, SKIN_TONES, MARKINGS, LOADING_TIPS, baseFor, makeItemKey, itemInfo,
  itemValue,
} from './config.js';
import {
  createDefaultState, computeStats, inventoryList, equipItem, unequipSlot,
  nextFusionFor, fuseItem, claimQuest, ensureQuest, claimBounty, upgradeSkill,
  toggleEquipOwned, removeItem, addItem, saveState, craftLegendary,
  syncVitals, xpForLevel,
} from './state.js';
import { drawHero, mulberry32, hashString, TAU } from './art.js';

const $ = (id) => document.getElementById(id);

const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const pct = (n, d) => `${Math.max(0, Math.min(100, d ? (n / d) * 100 : 0))}%`;
const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
const slotIcon = (slot) => SLOTS.find((s) => s.key === slot)?.icon || 'sword';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const SHOP_META = {
  gems: { label: 'Aether Gems', kicker: 'TEST CURRENCY', icon: 'gem', note: 'Test-only. No card, wallet or real payment is involved.' },
  costumes: { label: 'Costumes', kicker: 'COSMETIC ONLY', icon: 'user', note: 'Costumes change appearance, never stats.' },
  mounts: { label: 'Mounts', kicker: 'TRAVEL COSMETIC', icon: 'mount', note: 'Mounts grant a small travel-speed bonus and are purely convenience.' },
  pets: { label: 'Pets', kicker: 'COMPANIONS', icon: 'pet', note: 'Companions are cosmetic. They follow, glow and never fight.' },
  effects: { label: 'Weapon Effects', kicker: 'COSMETIC ONLY', icon: 'flame', note: 'A trail of light around your weapon. No damage change.' },
  wings: { label: 'Wings', kicker: 'FACTION COSMETIC', icon: 'wing', note: 'Your faction-unique wings. The first pair is earned through the Greendale trial.' },
  membership: { label: 'Skyward', kicker: 'MEMBERSHIP', icon: 'spark', note: 'Test-only status. Adds convenience bonuses, never power.' },
};

const PANELS = {
  inventory: { kicker: 'SATCHEL', title: 'Inventory', tabs: [{ id: 'items', label: 'Satchel' }, { id: 'materials', label: 'Materials' }] },
  character: { kicker: 'HERO', title: 'Character', tabs: [{ id: 'overview', label: 'Overview' }, { id: 'skill', label: 'Calling' }] },
  map: { kicker: 'WAYSTONES', title: 'World Map', tabs: [] },
  quests: { kicker: 'TRIAL LOG', title: 'Quests', tabs: [{ id: 'trials', label: 'Trials' }, { id: 'bounties', label: 'Bounties' }] },
  shop: {
    kicker: 'BOUTIQUE', title: 'Aether Boutique',
    tabs: Object.keys(SHOP_META).map((id) => ({ id, label: SHOP_META[id].label })),
  },
  forge: { kicker: 'THE FORGE', title: 'Fusion & Blacksmith', tabs: [{ id: 'fusion', label: 'Fusion' }, { id: 'smith', label: 'Blacksmith' }] },
  market: { kicker: 'MARKETPLACE', title: 'Wandering Market', tabs: [{ id: 'browse', label: 'Browse' }, { id: 'listings', label: 'My Listings' }] },
  vault: { kicker: 'VAULT', title: 'Vault', tabs: [{ id: 'deposit', label: 'Store' }, { id: 'withdraw', label: 'Withdraw' }] },
  merchant: { kicker: 'MERCHANT', title: "Mirael's Goods", tabs: [{ id: 'buy', label: 'Buy' }, { id: 'sell', label: 'Sell' }] },
  codex: {
    kicker: 'CODEX', title: 'Atlas & Settings',
    tabs: [{ id: 'realms', label: 'Realms' }, { id: 'bestiary', label: 'Bestiary' }, { id: 'rules', label: 'Rules' }, { id: 'settings', label: 'Settings' }],
  },
};

function rarityClass(info) { return `rarity-${info?.rarity || 'common'}`; }

function itemCard(entry, opts = {}) {
  const info = entry.info || itemInfo(entry.key);
  const qty = entry.qty ?? 1;
  return `<button type="button" class="item-card ${rarityClass(info)} ${opts.selected ? 'selected' : ''}"
    data-action="${opts.action || 'item-select'}" data-key="${esc(entry.key)}"
    ${opts.slot ? `data-slot="${opts.slot}" data-context="equipped"` : ''}>
    <span class="item-ico">${icon(slotIcon(info.slot))}</span>
    <span class="item-copy"><strong>${esc(info.name)}</strong><small>${esc(info.rarityName)} · ${esc(info.tierName)}</small></span>
    ${qty > 1 ? `<span class="item-qty">×${qty}</span>` : ''}
    ${opts.badge ? `<span class="item-badge">${esc(opts.badge)}</span>` : ''}
  </button>`;
}

function statChips(info) {
  const s = info.stats;
  const bits = [];
  if (s.attack) bits.push(`<span class="stat-chip atk">ATK +${s.attack}</span>`);
  if (s.armor) bits.push(`<span class="stat-chip arm">ARM +${s.armor}</span>`);
  if (s.vitality) bits.push(`<span class="stat-chip vit">VIT +${s.vitality}</span>`);
  return bits.join('');
}

export class UI {
  constructor(game) {
    this.game = game;
    this.state = null;
    this.savedState = null;
    this.draft = null;
    this.currentPanel = null;
    this.panelTab = null;
    this.selectedKey = null;
    this.selectedContext = 'inventory';
    this.selectedSlot = null;
    this.dialogueNpc = null;
    this.previewRAF = 0;
    this.hudTimer = 0;
    this.minimapTimer = 0;
    this.saveTimer = 0;
    this.checkTimer = 0;
    this.audioCtx = null;
    this._promptResolve = null;
    this._promptOptions = null;
    this.boss = null;
    this.mountedHold = false;
    this.joystickPointer = null;
    this.attackTimer = null;
    this.tipIndex = Math.floor(Math.random() * LOADING_TIPS.length);
    this.bindStatic();
  }

  // -------------------------------------------------------------------------
  // Creation screen
  // -------------------------------------------------------------------------

  setupCreation(savedState) {
    this.savedState = savedState || null;
    if (savedState) $('continueBtn').classList.remove('hidden');
    this.draft = {
      faction: 'angel', classId: 'dawnblade', gender: 'female', hairstyle: 'flowing',
      hairColor: HAIR_COLORS[0], eyeColor: EYE_COLORS[0], skinTone: SKIN_TONES[0],
      marking: 'none', name: 'Aetherwyn',
    };
    this.buildAppearanceControls();
    this.syncCreationUI();
    this.startPreview();
  }

  buildAppearanceControls() {
    $('hairGrid').innerHTML = HAIRSTYLES.map((h) =>
      `<button type="button" class="hair-option" data-hair="${h.id}">${esc(h.name)}</button>`).join('');
    $('hairColorRow').innerHTML = HAIR_COLORS.map((c) =>
      `<button type="button" class="swatch" data-haircolor="${c}" style="background:${c}" aria-label="Hair color ${c}"></button>`).join('');
    $('eyeColorRow').innerHTML = EYE_COLORS.map((c) =>
      `<button type="button" class="swatch" data-eyecolor="${c}" style="background:${c}" aria-label="Eye color ${c}"></button>`).join('');
    $('skinColorRow').innerHTML = SKIN_TONES.map((c) =>
      `<button type="button" class="swatch" data-skintone="${c}" style="background:${c}" aria-label="Skin tone ${c}"></button>`).join('');
    $('markingSelect').innerHTML = MARKINGS.map((m) =>
      `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  }

  syncCreationUI() {
    const d = this.draft;
    const fac = FACTIONS[d.faction];
    const cls = CLASSES[d.classId];
    document.querySelectorAll('[data-faction]').forEach((b) => b.classList.toggle('active', b.dataset.faction === d.faction));
    document.querySelectorAll('[data-class]').forEach((b) => b.classList.toggle('active', b.dataset.class === d.classId));
    document.querySelectorAll('[data-gender]').forEach((b) => b.classList.toggle('active', b.dataset.gender === d.gender));
    document.querySelectorAll('[data-hair]').forEach((b) => b.classList.toggle('active', b.dataset.hair === d.hairstyle));
    document.querySelectorAll('[data-haircolor]').forEach((b) => b.classList.toggle('active', b.dataset.haircolor === d.hairColor));
    document.querySelectorAll('[data-eyecolor]').forEach((b) => b.classList.toggle('active', b.dataset.eyecolor === d.eyeColor));
    document.querySelectorAll('[data-skintone]').forEach((b) => b.classList.toggle('active', b.dataset.skintone === d.skinTone));
    $('factionLine').textContent = fac.tagline;
    $('factionBonus').textContent = fac.bonus;
    $('previewFaction').textContent = fac.title.toUpperCase();
    $('previewName').textContent = d.name || 'Unnamed';
    $('previewClass').textContent = `${cls.name} · ${cls.role}`;
    $('classBlurb').textContent = cls.tagline;
    $('wingNote').innerHTML = `${icon('wing')} Wings unbound · earn a faction pair in the Greendale trial or at the boutique`;
    if ($('characterName').value !== d.name) $('characterName').value = d.name;
    $('markingSelect').value = d.marking;
  }

  startPreview() {
    const canvas = $('creationPreview');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const draw = (now) => {
      if (!this.draft || $('creationScreen').classList.contains('hidden')) return;
      const d = this.draft, t = now / 1000;
      const cls = CLASSES[d.classId], fac = FACTIONS[d.faction];
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, d.faction === 'angel' ? '#1a2b36' : '#2a1820');
      sky.addColorStop(0.58, d.faction === 'angel' ? '#233137' : '#2b1c1e');
      sky.addColorStop(1, '#080e12');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w / 2, h * 0.55, 12, w / 2, h * 0.55, w * 0.55);
      glow.addColorStop(0, fac.id === 'angel' ? 'rgba(255,224,148,.22)' : 'rgba(255,103,71,.18)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const a = i * 2.399 + t * 0.08;
        const r = 22 + (i * 37) % 130;
        const x = w / 2 + Math.cos(a) * r;
        const y = h * 0.47 + Math.sin(a * 1.3) * (60 + (i % 5) * 16) + Math.sin(t + i) * 4;
        ctx.fillStyle = `rgba(${fac.id === 'angel' ? '255,236,185' : '255,153,110'},${0.12 + (i % 3) * 0.05})`;
        ctx.fillRect(x, y, 1.4, 1.4);
      }
      // dais
      ctx.save(); ctx.translate(w / 2, h * 0.785); ctx.scale(1, 0.28);
      const dais = ctx.createRadialGradient(0, 0, 5, 0, 0, 138);
      dais.addColorStop(0, 'rgba(244,214,146,.16)'); dais.addColorStop(0.55, 'rgba(210,176,105,.06)'); dais.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dais; ctx.beginPath(); ctx.arc(0, 0, 138, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(231,199,129,.24)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 94 + Math.sin(t) * 3, 0, TAU); ctx.stroke();
      ctx.restore();
      const appearance = {
        faction: d.faction, classId: d.classId, gender: d.gender, hairstyle: d.hairstyle,
        hairColor: d.hairColor, eyeColor: d.eyeColor, skinTone: d.skinTone, marking: d.marking,
        classColors: cls.colors, factionColors: fac.colors, costumeColors: null,
      };
      drawHero(ctx, w / 2, h * 0.785, 3.15, appearance, {
        time: t, moving: false, walkPhase: 0, facing: 1,
        wings: null, aura: true, gearAccent: fac.colors.accent,
      });
      // foreground haze
      const haze = ctx.createLinearGradient(0, h * 0.78, 0, h);
      haze.addColorStop(0, 'rgba(4,9,13,0)'); haze.addColorStop(1, 'rgba(4,9,13,.72)');
      ctx.fillStyle = haze; ctx.fillRect(0, h * 0.7, w, h * 0.3);
      this.previewRAF = requestAnimationFrame(draw);
    };
    this.previewRAF = requestAnimationFrame(draw);
  }

  randomize() {
    const d = this.draft;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    d.faction = pick(['angel', 'demon']);
    d.classId = pick(Object.keys(CLASSES));
    d.gender = pick(['female', 'male']);
    d.hairstyle = pick(HAIRSTYLES.map((h) => h.id));
    d.hairColor = pick(HAIR_COLORS);
    d.eyeColor = pick(EYE_COLORS);
    d.skinTone = pick(SKIN_TONES);
    d.marking = pick(MARKINGS.map((m) => m.id));
    const names = ['Aetherwyn', 'Seraphine', 'Kaelen', 'Nyra', 'Vaelor', 'Elowen', 'Drakar', 'Mirelle', 'Thorne', 'Isolde'];
    d.name = pick(names);
    this.syncCreationUI();
    this.sfx('soft');
  }

  async beginJourney(useSave) {
    if (useSave && this.savedState) {
      this.enterWorld(this.savedState);
      return;
    }
    if (this.savedState) {
      const ok = await this.ask({
        kicker: 'NEW JOURNEY', title: 'Replace your local save?',
        text: 'A local hero already exists on this device. Beginning a new journey will overwrite that save. This cannot be undone.',
        confirm: 'Begin a new journey', cancel: 'Keep my hero',
      });
      if (ok == null) return;
    }
    const state = createDefaultState({
      ...this.draft,
      name: ($('characterName').value || this.draft.name).trim().slice(0, 18),
    });
    saveState(state);
    this.enterWorld(state);
  }

  enterWorld(state) {
    this.state = state;
    this.savedState = null;
    cancelAnimationFrame(this.previewRAF);
    $('creationScreen').classList.add('hidden');
    $('gameUI').classList.remove('hidden');
    this.game.ui = this;
    this.game.state = state;
    this.setLoading(true, LOADING_TIPS[this.tipIndex]);
    this.game.begin(state).then(() => {
      this.refreshHud(true);
      this.setLoading(false);
      const region = REGIONS[state.location?.regionId || 'greendale'];
      setTimeout(() => this.regionToast(region), 550);
      if (!state.flags.welcomed) {
        state.flags.welcomed = true;
        saveState(state);
        setTimeout(() => this.toast('info', 'Your journey begins. Follow the gold trial marker to Warden Elowen.'), 1400);
      }
    }).catch((error) => {
      console.error('[Aetheria] Failed to start', error);
      this.setLoading(false);
      this.toast('danger', 'The realm failed to wake. Check the console for details.');
    });
  }

  // -------------------------------------------------------------------------
  // Static binds
  // -------------------------------------------------------------------------

  bindStatic() {
    document.addEventListener('click', (e) => {
      const panelBtn = e.target.closest('[data-panel]');
      if (panelBtn) {
        const name = panelBtn.dataset.panel;
        this.openPanel(name === 'settings' ? 'codex' : name, name === 'settings' ? { tab: 'settings' } : {});
        return;
      }
      const faction = e.target.closest('[data-faction]');
      if (faction && this.draft) { this.draft.faction = faction.dataset.faction; this.syncCreationUI(); this.sfx('click'); return; }
      const cls = e.target.closest('[data-class]');
      if (cls && this.draft) { this.draft.classId = cls.dataset.class; this.syncCreationUI(); this.sfx('click'); return; }
      const gender = e.target.closest('[data-gender]');
      if (gender && this.draft) { this.draft.gender = gender.dataset.gender; this.syncCreationUI(); return; }
      const hair = e.target.closest('[data-hair]');
      if (hair && this.draft) { this.draft.hairstyle = hair.dataset.hair; this.syncCreationUI(); return; }
      const hc = e.target.closest('[data-haircolor]');
      if (hc && this.draft) { this.draft.hairColor = hc.dataset.haircolor; this.syncCreationUI(); return; }
      const ec = e.target.closest('[data-eyecolor]');
      if (ec && this.draft) { this.draft.eyeColor = ec.dataset.eyecolor; this.syncCreationUI(); return; }
      const st = e.target.closest('[data-skintone]');
      if (st && this.draft) { this.draft.skinTone = st.dataset.skintone; this.syncCreationUI(); return; }
    });

    if ($('markingSelect')) $('markingSelect').addEventListener('change', (e) => { if (this.draft) { this.draft.marking = e.target.value; } });
    if ($('characterName')) $('characterName').addEventListener('input', (e) => {
      if (!this.draft) return;
      this.draft.name = e.target.value.slice(0, 18);
      $('previewName').textContent = this.draft.name || 'Unnamed';
    });
    if ($('randomizeBtn')) $('randomizeBtn').addEventListener('click', () => this.randomize());
    if ($('startGameBtn')) $('startGameBtn').addEventListener('click', () => this.beginJourney(false));
    if ($('continueBtn')) $('continueBtn').addEventListener('click', () => this.beginJourney(true));

    if ($('panelClose')) $('panelClose').addEventListener('click', () => this.closePanel());
    if ($('modalBackdrop')) $('modalBackdrop').addEventListener('click', (e) => {
      if (e.target === $('modalBackdrop')) this.closePanel();
    });
    if ($('panelTabs')) $('panelTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      this.panelTab = tab.dataset.tab;
      this.selectedKey = null;
      this.selectedContext = 'inventory';
      this.renderPanel();
      this.sfx('click');
    });
    for (const id of ['panelBody', 'panelFoot']) {
      const el = $(id);
      if (el) el.addEventListener('click', (e) => this.handlePanelAction(e));
    }

    if ($('dialogueClose')) $('dialogueClose').addEventListener('click', () => this.closeDialogue());
    if ($('dialogueActions')) $('dialogueActions').addEventListener('click', (e) => this.handleDialogueAction(e));
    if ($('dialogueBackdrop')) $('dialogueBackdrop').addEventListener('click', (e) => {
      if (e.target === $('dialogueBackdrop')) this.closeDialogue();
    });

    if ($('promptCancel')) $('promptCancel').addEventListener('click', () => this.finishPrompt(null));
    if ($('promptConfirm')) $('promptConfirm').addEventListener('click', () => this.confirmPrompt());
    if ($('promptInput')) $('promptInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.confirmPrompt(); }
      if (e.key === 'Escape') { e.preventDefault(); this.finishPrompt(null); }
    });
    if ($('promptBackdrop')) $('promptBackdrop').addEventListener('click', (e) => {
      if (e.target === $('promptBackdrop')) this.finishPrompt(null);
    });

    if ($('attackBtn')) {
      $('attackBtn').addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.game.tryAttack();
        clearInterval(this.attackTimer);
        this.attackTimer = setInterval(() => this.game.tryAttack(), 135);
      });
      const stop = () => { clearInterval(this.attackTimer); this.attackTimer = null; };
      $('attackBtn').addEventListener('pointerup', stop);
      $('attackBtn').addEventListener('pointercancel', stop);
      $('attackBtn').addEventListener('pointerleave', stop);
    }
    if ($('skillBtn')) $('skillBtn').addEventListener('click', (e) => { e.preventDefault(); this.game.trySkill(); });
    if ($('healthPotionBtn')) $('healthPotionBtn').addEventListener('click', () => this.game.usePotion('health'));
    if ($('manaPotionBtn')) $('manaPotionBtn').addEventListener('click', () => this.game.usePotion('mana'));
    if ($('mountBtn')) $('mountBtn').addEventListener('click', () => this.game.toggleMount());
    if ($('interactPrompt')) $('interactPrompt').addEventListener('click', () => this.game.interact());
    if ($('respawnBtn')) $('respawnBtn').addEventListener('click', () => this.game.respawn());
    if ($('quickVault')) $('quickVault').addEventListener('click', () => this.openPanel('vault'));

    this.bindJoystick();
  }

  bindJoystick() {
    const stick = $('joystickStick');
    const base = $('joystick');
    if (!stick || !base) return;
    let active = false;
    const move = (e) => {
      const r = base.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const max = r.width * 0.31;
      const d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.game.input.vector = { x: dx / max, y: dy / max };
    };
    const end = () => {
      active = false;
      this.joystickPointer = null;
      stick.style.transform = 'translate(0,0)';
      if (this.game) this.game.input.vector = { x: 0, y: 0 };
    };
    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      active = true;
      this.joystickPointer = e.pointerId;
      base.setPointerCapture?.(e.pointerId);
      move(e);
    });
    base.addEventListener('pointermove', (e) => { if (active && e.pointerId === this.joystickPointer) move(e); });
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
    base.addEventListener('lostpointercapture', end);
  }

  // -------------------------------------------------------------------------
  // HUD
  // -------------------------------------------------------------------------

  xpNeed() { return this.state ? xpForLevel(this.state.level) : 1; }

  appearanceForState(state = this.state) {
    if (!state) return {};
    const cls = CLASSES[state.profile.classId] || CLASSES.dawnblade;
    const fac = FACTIONS[state.profile.faction] || FACTIONS.angel;
    const costume = state.equipped?.costume ? COSTUMES.find((c) => c.id === state.equipped.costume) : null;
    const wing = state.equipped?.wings ? WINGS[state.equipped.wings] : null;
    const effect = state.equipped?.effect ? WEAPON_EFFECTS[state.equipped.effect] : null;
    return {
      faction: state.profile.faction, classId: state.profile.classId, gender: state.profile.gender,
      hairstyle: state.profile.hairstyle, hairColor: state.profile.hairColor,
      eyeColor: state.profile.eyeColor, skinTone: state.profile.skinTone, marking: state.profile.marking,
      classColors: cls.colors, factionColors: fac.colors,
      costumeColors: costume ? { ...costume.colors } : null,
      wingData: wing, effectColor: effect?.color || null,
    };
  }

  refreshHud(full = false) {
    if (!this.state) return;
    const st = this.state;
    const stats = computeStats(st);
    const cls = CLASSES[st.profile.classId] || CLASSES.dawnblade;
    const fac = FACTIONS[st.profile.faction] || FACTIONS.angel;
    const hpPct = pct(st.hp, stats.maxHp);
    const mpPct = pct(st.mana, stats.maxMana);
    $('hpFill').style.width = hpPct;
    $('manaFill').style.width = mpPct;
    $('hpText').textContent = `${Math.ceil(st.hp)} / ${stats.maxHp}`;
    $('manaText').textContent = `${Math.floor(st.mana)} / ${stats.maxMana}`;
    $('xpFill').style.width = pct(st.xp, this.xpNeed());
    $('xpText').textContent = st.level >= GAME.maxLevel ? 'MAX LEVEL' : `${fmt(st.xp)} / ${fmt(this.xpNeed())} XP`;
    $('hudName').textContent = st.profile.name;
    $('hudSub').textContent = `Lv ${st.level} ${cls.name} · ${fac.title}`;
    $('heroCrest').textContent = st.profile.faction === 'angel' ? '✦' : '◆';
    $('goldValue').textContent = fmt(st.gold);
    $('gemValue').textContent = fmt(st.gems);
    const premium = st.premiumUntil > Date.now();
    $('premiumPill').classList.toggle('visible', premium);
    $('premiumPill').title = premium
      ? `Skyward until ${new Date(st.premiumUntil).toLocaleDateString()}`
      : 'Skyward membership inactive';
    $('healthPotionCount').textContent = st.potions.health || 0;
    $('manaPotionCount').textContent = st.potions.mana || 0;
    $('skillBtnName').textContent = cls.skill.name;
    $('skillLevelBadge').textContent = roman(st.skillLevel);
    $('mountLabel').textContent = st.mounted ? 'Dismount' : 'Mount';
    $('mountBtn').classList.toggle('active', !!st.mounted);
    if (full) {
      this.updateQuestTracker();
      this.updateMinimap();
      const region = REGIONS[st.location?.regionId] || REGIONS.greendale;
      this.updateRegionBadge(region);
    }
  }

  updateVitals() {
    if (!this.state) return;
    const stats = computeStats(this.state);
    $('hpFill').style.width = pct(this.state.hp, stats.maxHp);
    $('manaFill').style.width = pct(this.state.mana, stats.maxMana);
    $('hpText').textContent = `${Math.ceil(this.state.hp)} / ${stats.maxHp}`;
    $('manaText').textContent = `${Math.floor(this.state.mana)} / ${stats.maxMana}`;
    $('xpFill').style.width = pct(this.state.xp, this.xpNeed());
    $('xpText').textContent = this.state.level >= GAME.maxLevel ? 'MAX LEVEL' : `${fmt(this.state.xp)} / ${fmt(this.xpNeed())} XP`;
  }

  tick(dt) {
    if (!this.state) return;
    this.hudTimer += dt;
    this.minimapTimer += dt;
    this.saveTimer += dt;
    const stats = computeStats(this.state);
    const cls = CLASSES[this.state.profile.classId];
    if (this.game) {
      this.updateCooldown($('attackCooldown'), Math.max(0, this.game.playerAttackCooldown || 0), cls.attackCooldown);
      this.updateCooldown($('skillCooldown'), Math.max(0, this.game.skillCooldown || 0), Math.max(2.4, cls.skill.cooldown - (this.state.skillLevel - 1) * 0.11));
      $('healthPotionBtn').classList.toggle('cooling', (this.game.potionCooldown || 0) > 0);
      $('manaPotionBtn').classList.toggle('cooling', (this.game.potionCooldown || 0) > 0);
      const it = this.game.interactable;
      const prompt = $('interactPrompt');
      if (it && !this.game.modalOpen && !this.game.player?.dead) {
        prompt.classList.remove('hidden');
        let text = 'Interact';
        if (it.kind === 'npc') text = it.npc?.service === 'questgiver' ? `Speak with ${it.npc.name}` : `Use ${it.npc.name}`;
        else if (it.kind === 'waystone') text = 'Attune with the waystone';
        else if (it.kind === 'dungeon') text = `Enter ${this.game.region?.dungeon?.name || 'the dungeon'}`;
        $('interactText').textContent = text;
      } else prompt.classList.add('hidden');
      this.game.selectedEnemy = this.game._nearestEnemy?.(9)?.enemy || null;
    }
    if (this.hudTimer > 0.24) {
      this.hudTimer = 0;
      this.updateVitals();
      if (this.state.premiumUntil && this.state.premiumUntil <= Date.now()) {
        this.state.premiumUntil = 0;
        $('premiumPill').classList.remove('visible');
      }
    }
    if (this.minimapTimer > 0.12) {
      this.minimapTimer = 0;
      this.updateMinimap();
    }
    if (this.saveTimer > 10) {
      this.saveTimer = 0;
      if (this.game?.saveSoon) this.game.saveSoon();
    }
  }

  updateCooldown(el, remaining, total) {
    if (!el) return;
    if (remaining > 0.02) {
      el.classList.add('active');
      el.style.setProperty('--cd', `${clamp(remaining / total, 0, 1) * 360}deg`);
      let span = el.querySelector('span');
      if (!span) { span = document.createElement('span'); el.appendChild(span); }
      span.textContent = remaining > 1 ? Math.ceil(remaining) : remaining.toFixed(1);
    } else {
      el.classList.remove('active');
      const span = el.querySelector('span');
      if (span) span.textContent = '';
    }
  }

  drawMinimap() {
    if (!this.state || !this.game?.world || !this.game?.player) return;
    const canvas = $('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.game.world.drawMinimap(ctx, this.game.player, this.game.enemies || [], this.game.time || 0);
  }

  updateMinimap() {
    if (!this.isActive()) return;
    this.drawMinimap();
    const region = this.game?.region || REGIONS[this.state?.location?.regionId] || REGIONS.greendale;
    $('minimapRegion').textContent = region.name;
    if (this.game?.player) {
      $('minimapCoords').textContent = `${Math.round(this.game.player.x)}, ${Math.round(this.game.player.y)}`;
    }
  }

  isActive() { return !!this.state && !$('gameUI').classList.contains('hidden'); }

  updateRegionBadge(region) {
    if (!region) return;
    $('regionName').textContent = region.name;
    $('regionEpithet').textContent = region.epithet;
    $('minimapRegion').textContent = region.name;
  }

  updateQuestTracker() {
    if (!this.state) return;
    const body = $('trackerBody');
    if (!body) return;
    let questId = this.state.trackedQuest;
    if (!questId || !QUESTS[Object.keys(QUESTS).find((r) => QUESTS[r].id === questId)]) {
      const regionId = this.state.location?.regionId || 'greendale';
      questId = QUESTS[regionId]?.id || 'trial_greendale';
    }
    const regionId = Object.keys(QUESTS).find((r) => QUESTS[r].id === questId);
    const quest = QUESTS[regionId];
    if (!quest) {
      body.innerHTML = `<div class="tracker-desc">No trial is currently tracked. Open the Quest Log to choose one.</div>`;
      return;
    }
    const saved = this.state.quests[quest.id] || ensureQuest(this.state, regionId);
    const status = saved?.status || 'active';
    const killObj = quest.objectives.find((o) => o.type === 'kill');
    const bossObj = quest.objectives.find((o) => o.type === 'boss');
    const killDone = !killObj || saved.kills >= killObj.count;
    const bossDone = !bossObj || saved.boss;
    const done = status === 'complete' || status === 'claimed';
    const total = (killObj ? 1 : 0) + (bossObj ? 1 : 0) || 1;
    const progress = ((killDone ? 1 : 0) + (bossDone ? 1 : 0)) / total;
    const objs = [];
    if (killObj) objs.push(`<div class="tracker-obj ${killDone ? 'done' : ''}"><span class="dot"></span>${esc(killObj.label)} ${saved.kills}/${killObj.count}</div>`);
    if (bossObj) objs.push(`<div class="tracker-obj ${bossDone ? 'done' : ''}"><span class="dot"></span>${esc(bossObj.label)}</div>`);
    body.innerHTML = `
      <div class="tracker-title">${esc(quest.title)}</div>
      <div class="tracker-desc">${esc(quest.giver)} · ${esc(REGIONS[regionId].name)}</div>
      ${objs.join('')}
      <div class="tracker-progress"><span style="width:${(done ? 1 : progress) * 100}%"></span></div>
      ${done ? `<div class="tracker-complete">${status === 'claimed' ? 'Trial complete · bounty available' : 'Trial complete — claim at the quest giver'}</div>` : ''}`;
  }

  setLoading(show, text) {
    const el = $('loadingOverlay');
    if (!el) return;
    if (show) {
      if (text) $('loadingText').textContent = text;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  onRegionChanged(region) {
    this.updateRegionBadge(region);
    this.updateQuestTracker();
    this.updateMinimap();
    this.setBoss(null);
    this.closeDialogue(true);
    if (this.state) {
      $('minimapRegion').textContent = region.name;
      this.refreshHud(true);
    }
  }

  regionToast(region) {
    if (!region) return;
    const el = $('regionBanner');
    $('regionBannerName').textContent = region.name;
    $('regionBannerSub').textContent = `${region.epithet} · ${region.recommended}`;
    $('regionBannerKicker').textContent = 'REALM ENTERED';
    el.classList.remove('hidden');
    clearTimeout(this._regionTimer);
    this._regionTimer = setTimeout(() => el.classList.add('hidden'), 3600);
    this.sfx('chime');
  }

  toast(kind = 'info', message = '', ms = 2800) {
    const layer = $('toastLayer');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = message;
    layer.appendChild(el);
    while (layer.children.length > 5) layer.firstElementChild.remove();
    setTimeout(() => {
      el.classList.add('fade');
      setTimeout(() => el.remove(), 380);
    }, ms);
  }

  levelUp(level) {
    if (!this.state) return;
    const pop = document.createElement('div');
    pop.className = 'level-pop';
    pop.innerHTML = `<span class="level-kicker">ASCENDANT</span><strong>Level ${level}</strong><p>Your legend grows. Vitals restored.</p>`;
    $('gameUI').appendChild(pop);
    setTimeout(() => pop.classList.add('fade'), 2200);
    setTimeout(() => pop.remove(), 2750);
    this.refreshHud(true);
    this.sfx('level');
  }

  flashSave() {
    const el = $('saveFlash');
    if (!el) return;
    el.classList.add('show');
    clearTimeout(this._saveFlashTimer);
    this._saveFlashTimer = setTimeout(() => el.classList.remove('show'), 1300);
  }

  flashDamage() {
    const el = $('damageFlash');
    if (!el) return;
    el.classList.add('show');
    clearTimeout(this._damageTimer);
    this._damageTimer = setTimeout(() => el.classList.remove('show'), 150);
  }

  showDeath() {
    $('deathOverlay').classList.remove('hidden');
    this.sfx('death');
  }

  hideDeath() { $('deathOverlay').classList.add('hidden'); }

  setBoss(boss) {
    this.boss = boss || null;
    const wrap = $('bossBar');
    if (!wrap) return;
    if (!boss) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');
    $('bossName').textContent = boss.def?.name || 'Ancient Threat';
    this.updateBossHp(boss);
  }

  updateBossHp(boss) {
    if (!boss) return;
    const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
    $('bossFill').style.width = `${ratio * 100}%`;
    $('bossHpText').textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`;
  }

  bossDefeated(boss) {
    this.toast('boss', `${boss.def?.name || 'The ancient threat'} has fallen. A relic remains.`, 3600);
    this.setBoss(null);
    this.refreshHud(true);
    this.sfx('victory');
  }

  persist() {
    if (!this.state) return;
    try { saveState(this.state); } catch (error) { console.warn('[Aetheria] Save failed', error); }
  }

  sfx(type) {
    if (!this.state?.settings?.sfx) return;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      this.audioCtx ||= new AudioCtor();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const tones = {
        click: [520, 0.045, 'triangle', 0.025], soft: [380, 0.08, 'sine', 0.02],
        loot: [720, 0.11, 'triangle', 0.035], chime: [440, 0.3, 'sine', 0.03],
        level: [660, 0.42, 'sine', 0.045], victory: [392, 0.5, 'triangle', 0.04],
        death: [130, 0.55, 'sawtooth', 0.025], error: [170, 0.14, 'square', 0.02],
        buy: [600, 0.16, 'triangle', 0.03],
      };
      const [freq, dur, kind, vol] = tones[type] || tones.click;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind; osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + dur * 2);
      if (type === 'level' || type === 'victory') {
        const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
        osc2.type = 'sine'; osc2.frequency.value = freq * 1.5;
        gain2.gain.setValueAtTime(vol * 0.6, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + dur * 2.2);
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.start(now + 0.08); osc2.stop(now + dur * 2.3);
      }
    } catch { /* Audio is optional; never break gameplay for it. */ }
  }

// __APPEND__
