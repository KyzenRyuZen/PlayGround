// AETHERIA application controller: boot, screens, world HUD, panels and persistence.
import { App, createGame, recalc, ensureStoryQuest, saveNow, zoneUnlocked } from './core/game.js';
import { loadSettings, saveSettings, loadGame, deleteGame } from './core/save.js';
import { AudioEngine } from './core/audio.js';
import { t } from './core/i18n.js';
import { getZone } from './data/zones.js';
import { renderMenu } from './ui/menu.js';
import { renderCreate } from './ui/create.js';
import { WorldHud } from './ui/world.js';
import { Panels } from './ui/panels.js';
import { toast as showToast, closeModal } from './ui/common.js';
import { TradeClient } from './net/tradeClient.js';

class AetheriaApp {
  constructor() {
    this.settings = loadSettings();
    this.screenEl = document.getElementById('screen');
    this.overlay = document.getElementById('overlay');
    this.audio = new AudioEngine(this.settings);
    this.tradeClient = new TradeClient();
    this.game = null;
    this.engine = null;
    this.hud = null;
    this.panels = null;
    this.menuCleanup = null;
    this.installPrompt = null;

    window.__AETHERIA_SETTINGS__ = this.settings;
    App.settings = this.settings;
    App.screen = this;
    document.body.classList.toggle('reduce-motion', Boolean(this.settings.reduceMotion));
    this.bindGlobal();
    this.registerServiceWorker();
  }

  // ── lifecycle ────────────────────────────────────────────────────────────
  start() {
    this.refreshMenu();
    const boot = document.getElementById('boot');
    if (boot) {
      setTimeout(() => {
        boot.classList.add('leaving');
        setTimeout(() => boot.remove(), 850);
      }, 520);
    }
  }

  bindGlobal() {
    const unlock = () => this.audio.unlock();
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      const prompt = event;
      this.installPrompt = async () => {
        try { await prompt.prompt(); await prompt.userChoice; } catch {}
        this.installPrompt = null;
      };
    });
    window.addEventListener('appinstalled', () => { this.installPrompt = null; });

    window.addEventListener('beforeunload', () => {
      if (this.game) saveNow(true);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.game) saveNow(true);
    });
  }

  registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // ── screens ──────────────────────────────────────────────────────────────
  refreshMenu() {
    this.destroyWorld();
    this.game = null;
    App.game = null;
    App.engine = null;
    App.ui = null;
    window.__AETHERIA_PLAYER__ = null;
    this.tradeClient.disconnect();
    this.menuCleanup?.();
    this.menuCleanup = null;
    closeModal();
    this.screenEl.innerHTML = '';
    this.overlay.innerHTML = '';
    this.menuCleanup = renderMenu(this);
  }

  goMenu() {
    if (this.game) saveNow(true);
    this.refreshMenu();
  }

  resetToMenu() {
    deleteGame();
    this.refreshMenu();
    showToast(t('common.deleted'), 'good');
  }

  gotoCreate() {
    this.destroyWorld();
    this.game = null;
    App.game = null;
    App.engine = null;
    App.ui = null;
    window.__AETHERIA_PLAYER__ = null;
    this.menuCleanup?.();
    this.menuCleanup = null;
    closeModal();
    this.screenEl.innerHTML = '';
    this.overlay.innerHTML = '';
    this.menuCleanup = renderCreate(this);
  }

  continueGame() {
    const saved = loadGame();
    if (!saved?.player) { this.gotoCreate(); return; }
    const player = saved.player;
    player.equipment = player.equipment ?? {};
    player.inventory = player.inventory ?? [];
    player.storage = player.storage ?? [];
    player.stones = player.stones ?? [];
    player.quests = player.quests ?? {};
    player.visited = player.visited ?? {};
    player.discoveredZones = player.discoveredZones ?? [player.zoneId ?? 'greendale'];
    player.mounts = player.mounts ?? ['none'];
    player.wings = player.wings ?? [];
    player.costumes = player.costumes ?? [];
    player.pets = player.pets ?? [];
    player.fxUnlocks = player.fxUnlocks ?? [];
    player.hairUnlocks = player.hairUnlocks ?? [];
    recalc(player);
    if (!Number.isFinite(player.hp) || player.hp <= 0) player.hp = player.stats.maxHp;
    this.startGame(player, saved);
  }

  startGame(player, saved = null) {
    if (!player) return;
    this.destroyWorld();
    recalc(player);
    if (!Number.isFinite(player.hp) || player.hp <= 0) player.hp = player.stats.maxHp;

    this.game = saved
      ? { ...saved, player, settings: this.settings }
      : createGame(player);
    this.game.player = player;
    this.game.settings = this.settings;

    App.settings = this.settings;
    App.game = this.game;
    App.screen = this;
    this.tradeClient.disconnect();

    this.menuCleanup?.();
    this.menuCleanup = null;
    closeModal();
    this.screenEl.innerHTML = '';
    this.overlay.innerHTML = '';

    this.panels = new Panels(this);
    this.hud = new WorldHud(this);
    this.hud.attach();
    this.engine = this.screen.engine;
    saveNow(true);
    this.audio.unlock();
  }

  destroyWorld() {
    this.panels?.dispose?.();
    this.panels = null;
    this.hud?.destroy?.();
    this.hud = null;
    this.engine = null;
    App.engine = null;
  }

  // ── hooks used by engine / panels / screens ───────────────────────────────
  applyLanguage() {
    this.settings.lang = document.documentElement.lang || this.settings.lang;
    saveSettings(this.settings);
    this.audio.setSettings(this.settings);
    window.__AETHERIA_SETTINGS__ = this.settings;
    if (this.game && this.engine) this.startGame(this.game.player, this.game);
    else this.refreshMenu();
  }

  travel(zoneId) {
    if (!this.game) return false;
    const p = this.game.player;
    const zone = getZone(zoneId);
    if (!zone || zone.id === p.zoneId) return false;
    if (!zoneUnlocked(p, zone)) { showToast(t('world.locked'), 'bad'); return false; }
    const cost = zone.travelCost ?? 0;
    if (p.gold < cost) { showToast(t('world.notEnough'), 'bad'); return false; }
    p.gold -= cost;
    p.zoneId = zone.id;
    if (!p.discoveredZones.includes(zone.id)) p.discoveredZones.push(zone.id);
    ensureStoryQuest(p, zone.id);
    this.engine?.loadZone(zone.id, { restore: false });
    saveNow();
    this.hud?.refresh();
    this.hud?.updateQuestTracker();
    showToast(t('world.travelToast', { zone: t(zone.key) }), 'good');
    return true;
  }

  toggleMenu() {
    if (!this.game || !this.panels) return;
    if (this.panels.current) this.panels.close();
    else this.panels.open('menu');
  }

  tick(dt) { this.hud?.tick(dt); }
  tutorialStep(step) { this.hud?.tutorialStep(step); }
  onDeath() { this.hud?.onDeath(); }
  openPanel(name) { this.panels?.open(name); }
  openDialogue(npc) { this.panels?.openDialogue(npc); }
  toast(text, type) { showToast(text, type); }
}

const app = new AetheriaApp();
window.AETHERIA = app;
app.start();

export { app };
