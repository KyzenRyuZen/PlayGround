/* ---------------------------------------------------------------
   EMBERBOUND — application entry point.
   Owns the save, screen flow, battle lifecycle, and the main loop.
   --------------------------------------------------------------- */
import {
  CLASSES, SLOTS, RARITIES, RARITY_INDEX, STAGES, SHOP, TUTORIAL_KEY,
  RIFT_UNLOCK_STAGE, makeRiftStage,
} from './data.js';
import {
  newSave, loadSave, writeSave, computeStats, mergeOne, equipBest,
  highestClearedStage, shopPrice, stageTier, starsFor, rollLoot, addLoot,
  grantXp, bestRarity, clamp,
} from './rules.js';
import { Battle } from './battle.js';
import { Renderer } from './render.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { UI } from './ui.js';

const DEFAULT_SETTINGS = {
  sound: true, volume: 0.65, shake: true, damageNumbers: true,
  tilt: false, reducedMotion: false,
};
const MAX_REVIVES = 2;

class Game {
  constructor() {
    this.storage = window.localStorage;
    this.canvas = document.getElementById('world');
    this.renderer = new Renderer(this.canvas);
    this.audio = new AudioEngine();
    this.input = new Input();
    this.ui = new UI(this);

    this.save = loadSave(this.storage);
    this.settings = { ...DEFAULT_SETTINGS, ...(this.save?.settings || {}) };

    this.screen = 'title';
    this.createClassId = 'warrior';
    this.createName = '';
    this.battle = null;
    this.lastStage = null;
    this.paused = false;
    this._settled = false;
    this._defeatShown = false;
    this._lastTs = 0;
    this._time = 0;

    this._bindWindow();
    this.input.attach();
    this.input.onSkill = index => this.castSkill(index);
    this.input.onPause = () => {
      if (this.screen === 'battle') {
        if (this.paused) this.resume();
        else this.pause();
      }
    };
    this.input.onAnyInput = () => this.audio.unlock();

    this.applySettings();
    this.showTitle();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  /* ---------------------------------------------------------- setup */
  _bindWindow() {
    window.addEventListener('resize', () => this.renderer.resize());
    window.addEventListener('pointerdown', () => this.audio.unlock(), { passive: true });
    window.addEventListener('pagehide', () => this.persist());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.persist();
        if (this.screen === 'battle' && this.battle?.state === 'combat' && !this.paused) this.pause();
      }
    });
  }

  persist() {
    if (!this.save) return;
    this.save.settings = this.settings;
    writeSave(this.storage, this.save);
  }

  applySettings() {
    this.audio.setEnabled(!!this.settings.sound);
    this.audio.setVolume(Number(this.settings.volume) || 0);
    document.body.classList.toggle('reduced-motion', !!this.settings.reducedMotion);
  }

  /* ---------------------------------------------------------- loop */
  _loop(ts) {
    const dt = this._lastTs ? Math.min(0.05, (ts - this._lastTs) / 1000) : 0.016;
    this._lastTs = ts;
    this._time += dt;

    if (this.battle && this.screen === 'battle') {
      const frozen = this.paused || this.ui.modalOpen;
      if (!frozen) {
        this.battle.update(dt, { move: this.input.getMove() });
      }
      if (!this.settings.shake) this.battle.shake = 0;
      this.ui.updateHUD(this.battle, this.input);
      this.renderer.drawBattle(this.battle, this._time);
    } else {
      this.renderer.drawMenu(this._time, this.screen);
    }
    requestAnimationFrame(this._loop);
  }

  /* ---------------------------------------------------------- navigation */
  _leaveBattle() {
    this.battle = null;
    this.paused = false;
    this.input.reset();
    this.ui.hideBattle();
  }

  _show(fn) {
    this.ui.closeModal();
    this.input.reset();
    fn.call(this.ui);
  }

  showTitle() {
    this._leaveBattle();
    this.ui.closeModal();
    this.ui.clearToasts();
    this.screen = 'title';
    this.ui.renderTitle();
    this.applySettings();
  }

  showCreate() {
    this._leaveBattle();
    this.ui.closeModal();
    this.screen = 'create';
    this.ui.renderCreate();
  }

  createClass(id) {
    if (!CLASSES[id]) return;
    this.createClassId = id;
  }

  beginJourney(classId, name) {
    if (!CLASSES[classId]) return;
    const clean = String(name || '').trim().slice(0, 16) || CLASSES[classId].name;
    const save = newSave(classId, clean);
    save.settings = { ...this.settings };
    this.save = save;
    this.settings = save.settings;
    this.persist();
    this.applySettings();
    this.goHub();
    if (!this.storage.getItem(TUTORIAL_KEY)) {
      setTimeout(() => this.ui.tutorial(), 260);
    }
  }

  continueJourney() {
    if (!this.save) return this.showCreate();
    this.settings = { ...DEFAULT_SETTINGS, ...(this.save.settings || {}) };
    this.applySettings();
    this.goHub();
  }

  goHub() {
    if (!this.save) return this.showTitle();
    this._leaveBattle();
    this.ui.closeModal();
    this.screen = 'hub';
    this.ui.renderHub();
  }

  goMap() {
    if (!this.save) return this.showTitle();
    this._leaveBattle();
    this.ui.closeModal();
    this.screen = 'map';
    this.ui.renderMap();
  }

  goForge() {
    if (!this.save) return this.showTitle();
    this._leaveBattle();
    this.ui.closeModal();
    this.screen = 'forge';
    this.ui.renderForge();
  }

  goShop() {
    if (!this.save) return this.showTitle();
    this._leaveBattle();
    this.ui.closeModal();
    this.screen = 'shop';
    this.ui.renderShop();
  }

  openStage(id) {
    if (!this.save) return;
    const stage = STAGES[id - 1];
    if (!stage) return;
    if (id > highestClearedStage(this.save.progress) + 1) {
      this.ui.toast({ text: 'Clear the previous stage first.', iconName: 'lock', rarity: 'common' });
      return;
    }
    this.ui.stageSheet(stage);
  }

  openRift(depth) {
    if (!this.save) return;
    if (highestClearedStage(this.save.progress) < RIFT_UNLOCK_STAGE) {
      this.ui.toast({ text: `The Rift opens after Stage ${RIFT_UNLOCK_STAGE}.`, iconName: 'lock', rarity: 'common' });
      return;
    }
    const d = Math.max(1, Math.floor(depth || 1));
    const best = this.save.progress.riftBest || 0;
    this.ui.stageSheet(makeRiftStage(Math.min(d, best + 1)));
  }

  /* ---------------------------------------------------------- battle lifecycle */
  enterStage(which) {
    if (!this.save) return this.showTitle();
    const stage = typeof which === 'number' ? STAGES[which - 1] : makeRiftStage(which.depth);
    if (!stage) return;
    if (!stage.rift && stage.id > highestClearedStage(this.save.progress) + 1) return;

    this.ui.closeModal();
    this.ui.hideBattle();
    this.audio.unlock();
    this.input.reset();
    this.paused = false;
    this._settled = false;
    this._defeatShown = false;
    this.lastStage = stage;

    const stats = computeStats(this.save.character);
    const events = [];
    const battle = new Battle({
      stage,
      classId: this.save.character.classId,
      stats,
      onEvent: event => events.push(event),
    });
    battle.save = this.save;
    this.battle = battle;

    this.screen = 'battle';
    this.ui.renderBattle(battle, this.save);
    // The constructor emits wave/banner events before the HUD exists; replay them
    // now, then route every later event straight into the app.
    for (const event of events) this.handleEvent(event);
    battle.emit = event => this.handleEvent(event);
  }

  handleEvent(event) {
    switch (event.type) {
      case 'banner':
        this.ui.showBanner(event.sub, event.main, !!event.boss);
        break;
      case 'boss':
        this.audio.play('boss');
        break;
      case 'bossDown':
        this.ui.showBanner('The Ninth answers', 'Boss Slain', true);
        break;
      case 'sfx':
        this.audio.play(event.name);
        break;
      case 'loot':
        if (RARITY_INDEX[event.item.rarity] >= 2) this.ui.toast({ item: event.item });
        break;
      case 'level':
        break;
      case 'defeat':
        this.onDefeat();
        break;
      case 'victory':
        this.finishRun(true);
        break;
      case 'revive':
        this.ui.toast({ text: 'Ember reignited.', iconName: 'flame', rarity: 'legendary' });
        break;
      case 'waveClear':
        break;
      case 'gold':
      case 'kill':
      case 'skill':
      case 'start':
      case 'wave':
      default:
        break;
    }
  }

  onDefeat() {
    if (this._defeatShown) return;
    this._defeatShown = true;
    this.input.reset();
    const battle = this.battle;
    if (!battle) return;
    const cost = this.reviveCost();
    this.ui.defeatModal({
      stage: battle.stage,
      cost,
      gold: this.save.gold,
      revives: battle.revives,
      maxRevives: MAX_REVIVES,
      canRevive: battle.revives < MAX_REVIVES && this.save.gold >= cost,
    });
  }

  reviveCost() {
    const battle = this.battle;
    if (!battle) return 0;
    const tier = stageTier(battle.stage);
    return Math.round(45 + tier * 14 + (battle.revives || 0) * 65);
  }

  revive() {
    const battle = this.battle;
    if (!battle || battle.state !== 'defeat') return;
    if (battle.revives >= MAX_REVIVES) return;
    const cost = this.reviveCost();
    if (this.save.gold < cost) {
      this.ui.toast({ text: 'Not enough gold to reignite.', iconName: 'gold', rarity: 'common' });
      return;
    }
    this.save.gold -= cost;
    this.persist();
    if (!battle.revive()) return;
    this._defeatShown = false;
    this.ui.closeModal();
    this.ui.showBanner('The ember answers', 'Rise Again');
  }

  giveUp() {
    if (!this.battle) return this.goHub();
    this.finishRun(false);
  }

  finishRun(win) {
    if (this._settled) return;
    this._settled = true;
    const battle = this.battle;
    if (!battle || !this.save) {
      this.goHub();
      return;
    }
    const result = battle.getResult();
    result.win = !!win;
    const save = this.save;
    const char = save.character;
    const stage = result.stage;

    const prevBest = {};
    for (const slot of SLOTS) {
      prevBest[slot.id] = RARITY_INDEX[bestRarity(char.inventory, slot.id)] ?? -1;
    }

    const meta = { stars: 0, levelUps: 0, firstClearGold: 0, nextId: null };
    let loot = Array.isArray(result.loot) ? [...result.loot] : [];
    let bonusGold = 0;

    if (win) {
      const firstClear = !stage.rift && !save.progress.cleared[stage.id];
      if (firstClear) {
        const bonus = rollLoot(stage, stage.boss ? 3 : 2, Math.random, { boost: 1.45 });
        loot.push(...bonus);
        bonusGold = 40 + stage.id * 22;
      }
      for (const item of loot) {
        const idx = RARITY_INDEX[item.rarity] ?? 0;
        item.isNew = idx > (prevBest[item.slot] ?? -1);
      }
      addLoot(char.inventory, loot);
      save.gold += (result.gold || 0) + bonusGold;
      const gained = grantXp(char, result.xp || 0);
      meta.levelUps = gained.levels || 0;
      meta.stars = 1;
      if (stage.rift) {
        save.progress.riftBest = Math.max(save.progress.riftBest || 0, stage.depth || 1);
        meta.stars = 0;
        meta.nextId = 'rift';
      } else {
        const clearStars = starsFor(stage, result);
        meta.stars = clearStars;
        const prev = save.progress.cleared[stage.id];
        save.progress.cleared[stage.id] = {
          stars: Math.max(prev?.stars || 0, clearStars),
          time: Math.min(prev?.time ?? Infinity, result.time || 0),
        };
        if (stage.id < STAGES.length) meta.nextId = stage.id + 1;
      }
      save.stats.bosses = (save.stats.bosses || 0) + (battle.bossDefeated ? 1 : 0);
    } else {
      const kept = Math.floor((result.gold || 0) * 0.25);
      save.gold += kept;
      save.stats.deaths = (save.stats.deaths || 0) + 1;
      result.gold = result.gold || 0;
    }

    save.stats.runs = (save.stats.runs || 0) + 1;
    save.stats.kills = (save.stats.kills || 0) + (result.kills || 0);
    save.stats.playtime = (save.stats.playtime || 0) + (result.time || 0);
    save.stats.bestRarity = this._bestOwnedRarity();
    char.blessing = false;

    result.loot = loot;
    meta.firstClearGold = bonusGold;
    this.lastStage = stage;
    this._leaveBattle();
    this.persist();

    if (meta.levelUps) this.audio.play('levelup');
    else if (win) this.audio.play('victory');
    else this.audio.play('death');

    this.ui.renderResult(result, meta);
  }

  _bestOwnedRarity() {
    let best = -1;
    for (const slot of SLOTS) {
      const id = bestRarity(this.save.character.inventory, slot.id);
      if (id) best = Math.max(best, RARITY_INDEX[id] ?? -1);
    }
    return best >= 0 ? RARITIES[best].id : 'common';
  }

  retryStage() {
    const stage = this.lastStage;
    if (!stage) return this.goMap();
    if (stage.rift) this.enterStage({ rift: true, depth: stage.depth });
    else this.enterStage(stage.id);
  }

  nextStage() {
    const stage = this.lastStage;
    if (!stage) return this.goMap();
    if (stage.rift) this.enterStage({ rift: true, depth: (stage.depth || 1) + 1 });
    else if (stage.id < STAGES.length) this.enterStage(stage.id + 1);
    else this.goMap();
  }

  returnToMap() {
    this.goMap();
  }

  /* ---------------------------------------------------------- pause & settings */
  pause() {
    if (this.screen !== 'battle' || !this.battle || this.battle.state !== 'combat' || this.paused) return;
    this.paused = true;
    this.input.reset();
    this.ui.pauseMenu(this.battle);
    this.audio.play('click');
  }

  pauseSettings() {
    if (this.screen === 'battle' && this.battle?.state === 'combat') {
      this.paused = true;
      this.input.reset();
    }
    this.ui.settings();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.ui.closeModal();
    this.audio.play('click');
  }

  abandon() {
    if (!this.battle) return this.goHub();
    this.ui.confirm(
      'Abandon this run?',
      'You will return to camp with the gold you have earned, but the run’s equipment is lost.',
      'Abandon Run',
      () => {
        if (this.save) {
          this.save.gold += Math.floor((this.battle?.gold || 0) * 0.25);
          this.save.character.blessing = false;
          if (this.battle) this.save.stats.playtime = (this.save.stats.playtime || 0) + this.battle.time;
          this.save.stats.runs = (this.save.stats.runs || 0) + 1;
        }
        this._settled = true;
        this._leaveBattle();
        this.persist();
        this.goHub();
      },
    );
  }

  onModalOpen() {
    if (this.screen === 'battle') this.input.reset();
  }

  onModalClose() {
    if (this.screen === 'battle' && this.paused && !this.ui.modalOpen && this.battle?.state === 'combat') {
      this.ui.pauseMenu(this.battle);
    }
  }

  /* ---------------------------------------------------------- skills */
  castSkill(index) {
    if (this.screen !== 'battle' || !this.battle || this.paused || this.ui.modalOpen) return;
    this.battle.castSkill(index, { move: this.input.getMove() });
  }

  /* ---------------------------------------------------------- equipment & forge */
  equip(slot, rarity) {
    if (!this.save) return;
    const char = this.save.character;
    if ((char.inventory[slot]?.[rarity] || 0) <= 0) return;
    char.equipped[slot] = rarity;
    this.persist();
    this.audio.play('click');
  }

  unequip(slot) {
    if (!this.save) return;
    delete this.save.character.equipped[slot];
    this.persist();
    this.audio.play('click');
  }

  equipBest() {
    if (!this.save) return;
    const changed = equipBest(this.save.character);
    this.persist();
    if (changed.length) this.ui.toast({ text: `Equipped ${changed.length} stronger piece${changed.length > 1 ? 's' : ''}.`, iconName: 'sparkle', rarity: 'rare' });
    else this.ui.toast({ text: 'You already wear your best gear.', iconName: 'check', rarity: 'common' });
  }

  merge(slot, rarity) {
    if (!this.save) return null;
    const item = mergeOne(this.save.character, slot, rarity);
    if (!item) return null;
    this.save.stats.merges = (this.save.stats.merges || 0) + 1;
    this.save.stats.bestRarity = this._bestOwnedRarity();
    this.persist();
    this.audio.play('merge');
    this.ui.toast({ item });
    return item;
  }

  mergeAll() {
    if (!this.save) return 0;
    let total = 0;
    for (let pass = 0; pass < 12; pass++) {
      let changed = false;
      for (const slot of SLOTS) {
        for (const r of RARITIES) {
          if (r.id === 'divine') continue;
          let guard = 0;
          while ((this.save.character.inventory[slot.id]?.[r.id] || 0) >= 4 && guard++ < 20) {
            if (mergeOne(this.save.character, slot.id, r.id)) { total++; changed = true; }
          }
        }
      }
      if (!changed) break;
    }
    if (total) {
      this.save.stats.merges = (this.save.stats.merges || 0) + total;
      this.save.stats.bestRarity = this._bestOwnedRarity();
      this.persist();
      this.audio.play('merge');
      this.ui.toast({ text: `Ascended ${total} piece${total > 1 ? 's' : ''}.`, iconName: 'forge', rarity: 'epic' });
    } else {
      this.ui.toast({ text: 'Nothing is ready to ascend yet.', iconName: 'info', rarity: 'common' });
    }
    return total;
  }

  mergeableCount() {
    if (!this.save) return 0;
    let n = 0;
    for (const slot of SLOTS) {
      for (const r of RARITIES) {
        if (r.id === 'divine') continue;
        if ((this.save.character.inventory[slot.id]?.[r.id] || 0) >= 4) n++;
      }
    }
    return n;
  }

  /* ---------------------------------------------------------- shop */
  shopTier() {
    if (!this.save) return 1;
    return Math.max(1, highestClearedStage(this.save.progress) + 1);
  }

  shopStage() {
    const tier = this.shopTier();
    if (tier > 12) return { rift: true, depth: tier - 12, id: 1000 + tier, lootSlots: SLOTS.map(s => s.id) };
    return STAGES[Math.max(0, Math.min(STAGES.length - 1, tier - 1))];
  }

  buyCache(entryId, slot) {
    if (!this.save) return;
    const entry = SHOP.find(e => e.id === entryId);
    if (!entry) return;
    if (entry.oneShot && this.save.character.blessing) {
      this.ui.toast({ text: 'An Ember Offering is already active.', iconName: 'flame', rarity: 'common' });
      return;
    }
    const stage = this.shopStage();
    const price = shopPrice(entry, stage);
    if (this.save.gold < price) {
      this.ui.toast({ text: 'Not enough gold.', iconName: 'gold', rarity: 'common' });
      return;
    }
    this.save.gold -= price;

    if (entry.oneShot) {
      this.save.character.blessing = true;
      this.persist();
      this.audio.play('merge');
      this.ui.renderShop();
      this.ui.toast({ text: 'The Ember Offering burns until your next run ends.', iconName: 'flame', rarity: 'legendary' });
      return;
    }

    const count = entry.count || 1;
    const items = rollLoot(stage, count, Math.random, {
      slot: slot || undefined,
      boost: entry.boost || 1,
    });
    addLoot(this.save.character.inventory, items);
    this.save.stats.bestRarity = this._bestOwnedRarity();
    this.persist();
    this.audio.play('loot');
    this.ui.renderShop();
    this.ui.cacheResult(items, entry);
  }

  /* ---------------------------------------------------------- settings */
  setVolume(value) {
    this.settings.volume = clamp(Number(value) || 0, 0, 1);
    if (this.save) this.save.settings = this.settings;
    this.audio.setVolume(this.settings.volume);
    this.persist();
    const label = document.querySelector('#volume')?.closest('.settings-row')?.querySelector('.sr-desc');
    if (label) label.textContent = `${Math.round(this.settings.volume * 100)}%`;
  }

  toggleSetting(key) {
    if (!(key in DEFAULT_SETTINGS)) return;
    this.settings[key] = !this.settings[key];
    if (this.save) this.save.settings = this.settings;
    this.applySettings();
    this.persist();
    this.audio.play('click');
  }

  async toggleTilt() {
    if (this.input.tilt.enabled) {
      this.input.disableTilt();
      this.settings.tilt = false;
      if (this.save) this.save.settings = this.settings;
      this.persist();
      return { ok: true, reason: 'Tilt movement disabled. The joystick remains available.' };
    }
    const res = await this.input.enableTilt();
    this.settings.tilt = !!res.ok;
    if (this.save) this.save.settings = this.settings;
    this.persist();
    return res;
  }

  calibrateTilt() {
    const ok = this.input.calibrateTilt();
    if (ok) this.audio.play('click');
    return ok;
  }

  dismissTutorial() {
    this.storage.setItem(TUTORIAL_KEY, '1');
  }

  resetSave() {
    try { this.storage.removeItem('emberbound.save.v3'); } catch { /* ignore */ }
    this.save = null;
    this._leaveBattle();
    this.settings = { ...DEFAULT_SETTINGS };
    this.applySettings();
    this.showTitle();
  }
}

/* The tiny bootstrap keeps all wiring in one place and makes failures visible. */
window.addEventListener('DOMContentLoaded', () => {
  try {
    window.emberbound = new Game();
  } catch (error) {
    console.error('Emberbound failed to start', error);
    const root = document.getElementById('ui');
    if (root) {
      root.innerHTML = `<div class="screen active center" style="padding:30px"><h2 class="display">The Rift is silent</h2>
        <p class="sub">The game could not start in this browser.</p>
        <p class="tiny">${String(error?.message || error)}</p></div>`;
    }
  }
});
