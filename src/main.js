// ============================================================
// AETHERIA — BOOTSTRAP
// Wires the persistent state, the renderer/game loop and the UI.
// ============================================================

import CONFIG from './config.js';
import State from './state.js';
import { Game } from './game.js';
import UI from './ui.js';
import { Events } from './utils.js';

const canvas = document.getElementById('gameCanvas');
const minimap = document.getElementById('minimap');

const game = new Game(State, canvas);
game.renderer.setMinimap(minimap);

const ui = new UI(State, {
  createGame(draft) {
    try {
      State.newGame(draft);
      launch();
    } catch (err) {
      console.error('Could not create character', err);
      ui.toast({ msg: 'Could not create your hero. Check the browser console.', type: 'danger', duration: 5000 });
    }
  },
  continueGame() {
    try {
      if (!State.load()) {
        ui.toast({ msg: 'No compatible save found. Start a new adventure.', type: 'warn', duration: 4000 });
        ui.showStart();
        return;
      }
      launch();
    } catch (err) {
      console.error('Could not load save', err);
      ui.toast({ msg: 'Save could not be loaded. Start a new adventure.', type: 'danger', duration: 5000 });
      ui.showStart();
    }
  }
});

ui.game = game;
game.ui = ui;
game.sfx.enabled = State.data?.settings?.sound !== false;

function launch() {
  // Keep the audio engine asleep until a gesture; the first tap resumes it.
  game.sfx.enabled = State.data?.settings?.sound !== false;

  ui.el.start.classList.add('hidden');
  ui.el.creation.classList.add('hidden');
  ui.el.modalRoot.classList.add('hidden');
  ui.panel = null;
  ui.el.deathOverlay.classList.add('hidden');
  game.start();
}

// ------------------------------------------------------------
// GLOBAL LIFECYCLE
// ------------------------------------------------------------
let lastVisibilitySave = 0;

function saveNow(reason) {
  if (!State.data) return;
  State.save();
  if (reason === 'manual') Events.emit('toast', { msg: 'Game saved locally.', type: 'success', small: true });
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && State.data) {
    const now = Date.now();
    // avoid hammering localStorage when switching tabs repeatedly
    if (now - lastVisibilitySave > 3000) {
      lastVisibilitySave = now;
      saveNow('visibility');
    }
  } else if (!document.hidden) {
    game.sfx.resume();
  }
});

window.addEventListener('pagehide', () => saveNow('pagehide'));
window.addEventListener('beforeunload', () => saveNow('beforeunload'));

window.addEventListener('resize', () => {
  game.renderer.resize();
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => game.renderer.resize(), 120);
});

// One-time audio unlock on the first user gesture.
const unlockAudio = () => {
  game.sfx.init();
  game.sfx.resume();
  if (State.data?.settings?.sound === false) game.sfx.enabled = false;
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('keydown', unlockAudio);

// ------------------------------------------------------------
// ERROR SURFACE
// ------------------------------------------------------------
window.addEventListener('error', (e) => {
  console.error('Aetheria runtime error', e.error || e.message);
});

// Expose a tiny debug handle to make local verification easier.
window.AETHERIA = {
  CONFIG, State, game, ui,
  save: () => saveNow('manual'),
  version: CONFIG.version
};

// If a save already exists, make the Continue button available immediately.
ui.renderStart();
