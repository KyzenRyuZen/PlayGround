import { CLASS, SLOT, STAGE, STAGES, RARITY } from './data.js';
import {
  createHero, loadGame, saveGame, wipeGame, deriveStats, equipItem, unequipItem,
  autoEquip, autoReforge, reforgeItem, canReforge, groupByKey, getTemplate,
  isStageUnlocked, isStageCleared, nextStage, currentChapterIndex, formatNumber
} from './state.js';
import { GameUI } from './ui.js';
import { Battle } from './battle.js';
import { audio, haptic } from './audio.js';
import { tilt } from './motion.js';
import { uiIcon } from './icons.js';

class AetherfallApp {
  constructor() {
    this.state = loadGame();
    this.ui = new GameUI(this);
    this.battle = null;
    this.resetArmed = false;
    this.pendingStage = null;
  }

  init() {
    if (this.state) {
      audio.setEnabled(this.state.settings.sound !== false);
      this.ui.showGame();
    } else {
      this.ui.renderCreator();
      this.ui.selectClass('warrior');
    }
    this.bindGlobal();
    this.spawnCreatorEmbers();
    document.body.classList.add('ready');
    window.addEventListener('beforeunload', () => this.save());
  }

  bindGlobal() {
    document.addEventListener('click', (ev) => {
      const tab = ev.target.closest('button[data-tab]');
      if (tab) {
        this.ui.switchTab(tab.dataset.tab);
        return;
      }
      const modalClose = ev.target.closest('[data-close-modal]');
      if (modalClose) { this.ui.closeModal(); return; }
      const backdrop = ev.target.closest('[data-modal-backdrop]');
      if (backdrop && ev.target === backdrop) { this.ui.closeModal(); return; }

      const chapter = ev.target.closest('[data-chapter]');
      if (chapter) {
        const idx = Number(chapter.dataset.chapter);
        if (chapter.getAttribute('aria-disabled') === 'true') {
          this.toast('Chapter sealed', 'Clear the final trial of the previous chapter first.');
          audio.play('hit');
          return;
        }
        this.ui.chapterIndex = idx;
        const stages = STAGES.filter(s => s.chapter === idx);
        const unlocked = stages.filter(s => isStageUnlocked(this.state, s));
        this.ui.selectedStageId = (unlocked.find(s => !isStageCleared(this.state, s)) || unlocked[0] || stages[0]).id;
        this.ui.renderGame();
        return;
      }

      const stageBtn = ev.target.closest('[data-stage]');
      if (stageBtn) {
        if (stageBtn.getAttribute('aria-disabled') === 'true') {
          this.toast('Trial sealed', 'Complete the previous stage to open this path.');
          audio.play('hit');
          return;
        }
        this.ui.selectedStageId = stageBtn.dataset.stage;
        const stage = STAGE[stageBtn.dataset.stage];
        if (stage) this.ui.chapterIndex = stage.chapter;
        this.ui.renderGame();
        audio.play('click');
        return;
      }

      const enter = ev.target.closest('[data-enter-stage]');
      if (enter) {
        if (enter.disabled) return;
        this.launchBattle(enter.dataset.enterStage);
        return;
      }

      const slot = ev.target.closest('[data-slot]');
      if (slot) { this.ui.openSlotModal(slot.dataset.slot); audio.play('click'); return; }

      const item = ev.target.closest('[data-item]');
      if (item) { this.ui.openItemModal(item.dataset.item); audio.play('click'); return; }

      const equip = ev.target.closest('[data-equip]');
      if (equip) {
        const result = equipItem(this.state, equip.dataset.equip);
        if (result.ok) {
          audio.play('loot');
          haptic(12);
          this.save();
          this.ui.closeModal();
          this.ui.renderGame();
          this.toast('Relic equipped', `${getTemplate(result.equipped.templateId).name} · ${RARITY[result.equipped.rarity].name}`);
        } else {
          this.toast('Cannot equip', result.reason || 'The relic resists.');
        }
        return;
      }

      const unequip = ev.target.closest('[data-unequip]');
      if (unequip) {
        const entry = this.state.equipment[unequip.dataset.unequip];
        if (entry && unequipItem(this.state, unequip.dataset.unequip)) {
          this.save();
          this.ui.closeModal();
          this.ui.renderGame();
          this.toast('Relic returned to vault', getTemplate(entry.templateId).name);
          audio.play('click');
        }
        return;
      }

      const reforge = ev.target.closest('[data-reforge]');
      if (reforge) {
        const group = groupByKey(this.state, reforge.dataset.reforge);
        if (group && canReforge(this.state, group.key)) {
          const name = getTemplate(group.templateId).name;
          const result = reforgeItem(this.state, group.key);
          if (result.ok) {
            const r = RARITY[result.rarity];
            this.save();
            this.ui.closeModal();
            this.ui.renderGame();
            audio.play('merge');
            haptic([16, 25, 20]);
            this.toast('Ascension complete', `${name} reforged into ${r.name}.`, 'anvil', r.color);
          }
        }
        return;
      }

      const filter = ev.target.closest('[data-filter]');
      if (filter) {
        this.ui.inventoryFilter = filter.dataset.filter;
        this.ui.renderGame();
        audio.play('click');
        return;
      }

      const sort = ev.target.closest('[data-sort]');
      if (sort) {
        this.ui.inventorySort = sort.dataset.sort;
        this.ui.renderGame();
        audio.play('click');
        return;
      }

      const toggle = ev.target.closest('[data-toggle]');
      if (toggle) { this.toggleSetting(toggle.dataset.toggle); return; }

      const action = ev.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'auto-equip') {
        const count = autoEquip(this.state);
        this.save();
        this.ui.renderGame();
        audio.play(count ? 'loot' : 'click');
        this.toast(count ? 'Loadout optimized' : 'Already optimal', count ? `${count} relic${count === 1 ? '' : 's'} equipped.` : 'No stronger spare relics were found.');
      } else if (action === 'auto-reforge') {
        const results = autoReforge(this.state);
        if (results.length) {
          const best = results[results.length - 1];
          this.save();
          this.ui.renderGame();
          audio.play('merge');
          haptic([18, 30, 22]);
          this.toast('Mass reforge complete', `${results.length} ascension${results.length === 1 ? '' : 's'} · highest: ${RARITY[best.rarity].name}.`, 'anvil', RARITY[best.rarity].color);
        }
      } else if (action === 'settings') {
        this.ui.openSettings();
        audio.play('click');
      } else if (action === 'reset-game') {
        this.handleReset(ev.target.closest('[data-action="reset-game"]'));
      } else if (action === 'creator-sound') {
        if (!this.state) {
          this.creatorMuted = !this.creatorMuted;
          audio.setEnabled(!this.creatorMuted);
        }
      }
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        if (document.getElementById('modal-root').children.length) this.ui.closeModal();
        return;
      }
      if (ev.key === 'Enter' && !this.state) {
        const name = document.getElementById('heroName');
        if (document.activeElement === name) this.startFromCreator();
      }
    });

    document.getElementById('beginBtn').addEventListener('click', () => this.startFromCreator());
  }

  toggleSetting(key) {
    if (key === 'sound') {
      this.state.settings.sound = !this.state.settings.sound;
      audio.setEnabled(this.state.settings.sound);
      if (this.state.settings.sound) audio.play('select');
    } else if (key === 'haptics') {
      this.state.settings.haptics = !this.state.settings.haptics;
      if (this.state.settings.haptics) haptic(12);
    } else if (key === 'tilt') {
      this.toggleTilt();
      return;
    }
    this.save();
    this.ui.closeModal();
    this.ui.openSettings();
  }

  async toggleTilt() {
    if (this.state.settings.tilt) {
      tilt.disable();
      this.state.settings.tilt = false;
      this.save();
      this.ui.closeModal();
      this.ui.openSettings();
      this.toast('Tilt controls off', 'The touch joystick remains active.');
      return;
    }
    const result = await tilt.enable();
    this.state.settings.tilt = !!result.ok;
    this.state.settings.motionAsked = true;
    this.save();
    this.ui.closeModal();
    this.ui.openSettings();
    if (result.ok) {
      tilt.calibrate();
      this.toast('Tilt controls ready', 'Your device will steer movement in battle.');
      audio.play('select');
    } else {
      this.toast('Tilt unavailable', result.reason);
    }
  }

  handleReset(button) {
    if (!this.resetArmed) {
      this.resetArmed = true;
      button.classList.add('armed');
      button.textContent = 'Tap again to erase';
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => {
        this.resetArmed = false;
        if (button.isConnected) {
          button.classList.remove('armed');
          button.textContent = 'Erase save';
        }
      }, 3500);
      return;
    }
    wipeGame();
    this.resetArmed = false;
    audio.play('defeat');
    location.reload();
  }

  startFromCreator() {
    if (this.state) return;
    const input = document.getElementById('heroName');
    const name = input.value.trim() || 'The Nameless';
    this.state = createHero(this.ui.selectedClass, name);
    audio.setEnabled(true);
    audio.unlock();
    audio.play('level');
    this.save();
    document.getElementById('creator-screen').classList.add('leaving');
    setTimeout(() => {
      this.ui.showGame();
      document.getElementById('creator-screen').classList.add('hidden');
      this.toast('Chronicle begun', `${name}, ${CLASS[this.state.classId].name}. The road to the Hollow Crown awaits.`, 'spark');
    }, 500);
  }

  launchBattle(stageId) {
    const stage = STAGE[stageId];
    if (!stage || !isStageUnlocked(this.state, stage)) return;
    this.pendingStage = stage.id;
    this.save();
    audio.unlock();
    const game = document.getElementById('game-screen');
    const battle = document.getElementById('battle-screen');
    game.classList.add('hidden');
    battle.classList.remove('hidden');
    document.body.classList.add('battle-mode');
    this.ui.closeModal();
    const canvas = document.getElementById('battle-canvas');
    const hud = document.getElementById('battle-hud');
    this.battle?.destroy();
    this.battle = new Battle({
      canvas,
      hud,
      state: this.state,
      stage,
      onVictory: () => {
        this.save();
        haptic([20, 30, 30]);
      },
      onDefeat: () => {
        this.save();
      },
      onExit: () => this.exitBattle(),
      onRetry: () => {
        document.getElementById('battle-screen').classList.add('hidden');
        document.body.classList.remove('battle-mode');
        setTimeout(() => this.launchBattle(stage.id), 60);
      }
    });
    requestAnimationFrame(() => this.battle.start());
  }

  exitBattle() {
    if (this.battle) this.battle.destroy();
    this.battle = null;
    document.getElementById('battle-screen').classList.add('hidden');
    document.body.classList.remove('battle-mode');
    const game = document.getElementById('game-screen');
    game.classList.remove('hidden');
    this.state = loadGame() || this.state;
    this.ui.chapterIndex = currentChapterIndex(this.state);
    const stage = this.pendingStage ? STAGE[this.pendingStage] : null;
    this.ui.selectedStageId = stage?.id || nextStage(this.state).id;
    this.ui.renderGame();
    this.save();
  }

  save() {
    if (this.state) saveGame(this.state);
  }

  toast(title, message, icon = 'info', color = '') {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'game-toast';
    if (color) el.style.setProperty('--toast-color', color);
    el.innerHTML = `<span class="toast-icon">${uiIcon(icon)}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(message)}</small></span>`;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, 3400);
  }

  spawnCreatorEmbers() {
    const wrap = document.getElementById('ember-field');
    if (!wrap) return;
    for (let i = 0; i < 26; i++) {
      const e = document.createElement('i');
      e.style.setProperty('--x', `${Math.random() * 100}%`);
      e.style.setProperty('--d', `${8 + Math.random() * 16}s`);
      e.style.setProperty('--delay', `${-Math.random() * 24}s`);
      e.style.setProperty('--s', `${1 + Math.random() * 2.4}px`);
      e.style.setProperty('--drift', `${-40 + Math.random() * 80}px`);
      wrap.appendChild(e);
    }
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const app = new AetherfallApp();
app.init();

window.__AETHERFALL__ = app;
