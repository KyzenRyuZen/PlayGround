// In-game HUD, touch controls, quest tracker, onboarding and death screen.
import { t, tx, icon, esc, fmt, toast, bar, confirmDialog, closeModal, showModal, formatPlaytime } from './common.js';
import { WorldEngine } from '../game/engine.js';
import { CLASSES } from '../data/classes.js';
import { getZone } from '../data/zones.js';
import { xpForLevel, trackedQuest, questObjectiveText, currentZone, saveNow } from '../core/game.js';
import { saveSettings } from '../core/save.js';
import { renderHero } from './heroArt.js';

const SKILL_ICONS = ['whirl', 'shield', 'heart'];

export class WorldHud {
  constructor(screen) {
    this.screen = screen;
    this.engine = null;
    this.raf = 0;
    this.joyActive = false;
    this.joyId = null;
    this.deathVisible = false;
    this.uiTimer = 0;
  }

  attach() {
    const screenEl = document.getElementById('screen');
    const player = this.screen.game.player;
    const cls = CLASSES[player.classId];
    const zone = currentZone(player);
    screenEl.innerHTML = `<div class="game-screen" id="gameScreen">
      <canvas id="worldCanvas"></canvas>
      <div class="vignette"></div>
      <div class="hud${this.screen.settings.joystickSide === 'right' ? ' joy-right' : ''}" id="hud">
        <div class="hud-top">
          <div class="hero-hud">
            <button class="hero-avatar" data-act="character" aria-label="${esc(t('char.title'))}">${icon('user')}</button>
            <div class="hero-hud-info">
              <div class="hero-name-line"><b>${esc(player.name)}</b><span>${esc(t('common.lv'))} ${player.level} · ${esc(tx(cls.name))}</span></div>
              <div class="hero-bars">
                <div class="bar hp" id="hpBar"><i></i><div class="bar-label"><span>${esc(t('common.hp'))}</span><span id="hpText"></span></div></div>
                <div class="bar res" id="resBar"><i></i><div class="bar-label"><span>${esc(t(`common.${cls.resource}`))}</span><span id="resText"></span></div></div>
              </div>
              <div class="bar xp hero-xp" id="xpBar"><i></i></div>
            </div>
          </div>
          <div class="top-right">
            <div class="currency-row">
              <div class="currency gold">${icon('gold')}<b id="goldText">${fmt(player.gold)}</b></div>
              <div class="currency gems">${icon('gem')}<b id="gemsText">${fmt(player.gems)}</b></div>
            </div>
            <div class="currency-row">
              <button class="icon-btn" data-act="menu" aria-label="${esc(t('hud.menu'))}">${icon('menu')}</button>
            </div>
          </div>
        </div>

        <div class="zone-hud"><b>${esc(t(zone.key))}</b><span class="danger">${esc(t('common.level'))} ${zone.min}–${zone.max} · ${esc(t('hud.danger'))}</span></div>

        <div class="minimap-wrap"><canvas id="minimap"></canvas><div class="zone-mini">${esc(t(zone.key))}</div></div>

        <div class="quest-track" data-act="quests" id="questTrack"></div>

        <div class="target-chip hidden" id="targetChip">
          <div class="tc-name" id="targetName"></div>
          <div class="tc-bar"><i id="targetBar"></i></div>
        </div>

        <button class="interaction-btn hidden" id="interactBtn" data-act="interact">
          ${icon('talk')}<span class="ia-text" id="interactText"></span><small>${esc(t('hud.interact'))}</small>
        </button>

        <div class="status-strip" id="statusStrip"></div>

        <div class="hud-bottom">
          <div class="control-cluster joystick" id="joystick">
            <div class="joy-base"></div>
            <div class="joy-knob" id="joyKnob">${icon('compass')}</div>
          </div>
          <div class="attack-cluster">
            <div class="utility-row">
              <button class="utility-btn" data-act="potion" id="potionBtn" aria-label="${esc(t('hud.potion'))}">${icon('potionRed')}<span class="qty" id="potionQty">0</span></button>
              <button class="utility-btn" data-act="mount" id="mountBtn" aria-label="${esc(t('hud.mount'))}">${icon('mount')}</button>
            </div>
            <button class="attack-btn" data-act="attack" id="attackBtn" aria-label="${esc(t('combat.attack'))}">
              ${icon(player.classId === 'mage' ? 'staff' : player.classId === 'assassin' ? 'daggers' : 'axe')}
            </button>
            ${cls.skills.map((s, i) => `
              <button class="skill-btn s${i + 1}" data-skill="${i}" data-skill-id="${esc(s.id)}" style="--skill-color:${s.color}" aria-label="${esc(tx(s.name))}">
                ${icon(s.icon)}
                <span class="cd" data-cd></span>
                <span class="cd-num" data-cdnum></span>
                <span class="skey">${i + 1}</span>
              </button>`).join('')}
          </div>
        </div>

        <div class="death-veil hidden" id="deathVeil">
          <div style="font-size:32px;color:#b45b53;margin-bottom:8px">${icon('swordBroken')}</div>
          <h2>${esc(t('hud.deathTitle'))}</h2>
          <p>${esc(t('hud.deathText'))}</p>
          <div class="btns">
            <button class="btn primary" data-act="respawn">${esc(t('hud.respawn'))}</button>
            <button class="btn ghost" data-act="death-menu">${esc(t('menu.returnMenu'))}</button>
          </div>
        </div>
      </div>
    </div>`;

    const canvas = document.getElementById('worldCanvas');
    const minimap = document.getElementById('minimap');
    this.engine = new WorldEngine(this.screen.game, canvas, minimap, document.getElementById('hud'));
    this.screen.engine = this.engine;
    this.engine.attach();

    // report player to the shared panel helper
    window.__AETHERIA_PLAYER__ = player;
    window.__AETHERIA_SETTINGS__ = this.screen.settings;

    this.bindActions();
    this.bindJoystick();
    this.refresh();
    this.updateQuestTracker();

    if (!this.screen.settings.tutorialDone) this.showOnboarding();
    else if (!this.screen.game._zoneIntroShown) {
      this.screen.game._zoneIntroShown = true;
    }
  }

  bindActions() {
    const root = document.getElementById('hud');
    document.querySelectorAll('[data-act]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        this.screen.audio?.play('ui');
        if (act === 'menu') this.screen.panels.open('menu');
        else if (act === 'character') this.screen.panels.open('character');
        else if (act === 'quests') this.screen.panels.open('quests');
        else if (act === 'interact') this.engine.interact();
        else if (act === 'potion') this.usePotion();
        else if (act === 'mount') this.useMount();
        else if (act === 'respawn') this.respawn();
        else if (act === 'death-menu') this.returnToMenu();
      });
    });

    // attack hold
    const attack = document.getElementById('attackBtn');
    const start = (e) => {
      e.preventDefault();
      this.engine.attackHeld = true;
      this.haptic(8);
      attack.setPointerCapture?.(e.pointerId);
    };
    const end = () => { this.engine.attackHeld = false; };
    attack.addEventListener('pointerdown', start);
    attack.addEventListener('pointerup', end);
    attack.addEventListener('pointercancel', end);
    attack.addEventListener('pointerleave', end);

    root.querySelectorAll('[data-skill]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.skill);
        this.engine.useSkill(i);
        this.haptic(6);
      });
    });
  }

  bindJoystick() {
    const base = document.getElementById('joystick');
    const knob = document.getElementById('joyKnob');
    if (!base || !knob) return;
    const radius = 42;
    const move = (e) => {
      const r = base.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const mag = Math.hypot(dx, dy);
      if (mag > radius) { dx = (dx / mag) * radius; dy = (dy / mag) * radius; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      this.engine.setJoystick(dx / radius, dy / radius, true);
    };
    const reset = () => {
      this.joyActive = false;
      this.joyId = null;
      knob.style.transform = 'translate(0,0)';
      this.engine.setJoystick(0, 0, false);
    };
    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.joyActive = true;
      this.joyId = e.pointerId;
      base.setPointerCapture?.(e.pointerId);
      move(e);
      this.haptic(4);
    });
    base.addEventListener('pointermove', (e) => { if (this.joyActive && e.pointerId === this.joyId) move(e); });
    base.addEventListener('pointerup', reset);
    base.addEventListener('pointercancel', reset);
    base.addEventListener('pointerleave', (e) => { if (this.joyActive && e.pointerId === this.joyId) reset(); });
  }

  haptic(ms = 5) {
    if (!this.screen.settings.haptics) return;
    try { navigator.vibrate?.(ms); } catch {}
  }

  usePotion() {
    if (this.engine.usePotion()) this.refresh();
  }

  useMount() {
    this.engine.toggleMount();
    this.refresh();
  }

  respawn() {
    this.engine.respawn();
    this.deathVisible = false;
    document.getElementById('deathVeil')?.classList.add('hidden');
    toast(t('combat.respawned'), 'good');
  }

  returnToMenu() {
    confirmDialog(t('menu.returnMenu'), t('menu.returnMenuHint'), () => this.screen.goMenu());
  }

  onDeath() {
    this.deathVisible = true;
    document.getElementById('deathVeil')?.classList.remove('hidden');
    this.haptic(40);
  }

  tutorialStep(step) {
    const map = { 1: t('onboarding.step2'), 2: t('onboarding.step3'), 3: t('onboarding.step4') };
    if (map[step]) toast(map[step]);
  }

  refresh() {
    const p = this.screen.game.player;
    const stats = p.stats;
    const cls = CLASSES[p.classId];
    const hp = Math.max(0, Math.round(p.hp));
    const res = Math.max(0, Math.round(p.resource));
    const hpBar = document.getElementById('hpBar');
    if (hpBar) {
      hpBar.querySelector('i').style.width = `${Math.max(0, Math.min(100, (p.hp / stats.maxHp) * 100))}%`;
      const txt = document.getElementById('hpText');
      if (txt) txt.textContent = `${hp}/${Math.round(stats.maxHp)}`;
    }
    const resBar = document.getElementById('resBar');
    if (resBar) {
      resBar.querySelector('i').style.width = `${Math.max(0, Math.min(100, (p.resource / stats.maxResource) * 100))}%`;
      const txt = document.getElementById('resText');
      if (txt) txt.textContent = `${res}/${Math.round(stats.maxResource)}`;
    }
    const next = xpForLevel(p.level);
    const xpBar = document.getElementById('xpBar');
    if (xpBar) xpBar.querySelector('i').style.width = `${p.level >= 60 ? 100 : Math.max(0, Math.min(100, (p.xp / next) * 100))}%`;
    const gold = document.getElementById('goldText');
    if (gold) gold.textContent = fmt(p.gold);
    const gems = document.getElementById('gemsText');
    if (gems) gems.textContent = fmt(p.gems);
    const lvl = document.querySelector('.hero-name-line span');
    if (lvl) lvl.textContent = `${t('common.lv')} ${p.level} · ${tx(cls.name)}`;
    const potion = p.inventory.find((i) => i.id === 'healPotion');
    const qty = document.getElementById('potionQty');
    if (qty) qty.textContent = potion?.qty ?? 0;
    const mountBtn = document.getElementById('mountBtn');
    if (mountBtn) mountBtn.classList.toggle('mount-on', Boolean(p.mount));
    this.updateTarget();
    this.updateInteraction();
    this.updateStatus();
  }

  updateTarget() {
    const chip = document.getElementById('targetChip');
    const target = this.engine?.target;
    if (!chip) return;
    if (!target) { chip.classList.add('hidden'); return; }
    chip.classList.remove('hidden');
    const name = document.getElementById('targetName');
    if (name) name.textContent = `${tx(target.name)} · ${t('common.lv')} ${target.level}`;
    const barEl = document.getElementById('targetBar');
    if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, (target.hp / target.maxHp) * 100))}%`;
  }

  updateInteraction() {
    const btn = document.getElementById('interactBtn');
    const label = this.engine?.interaction;
    if (!btn) return;
    if (!label || this.engine.dead) { btn.classList.add('hidden'); return; }
    btn.classList.remove('hidden');
    const txt = document.getElementById('interactText');
    if (txt) txt.textContent = label.label;
    const ico = btn.querySelector('svg');
    if (ico) {
      const name = label.kind === 'npc' ? 'talk' : label.kind === 'portal' ? 'portal' : 'herb';
      const tmp = document.createElement('span');
      tmp.innerHTML = icon(name);
      ico.replaceWith(tmp.firstElementChild);
    }
  }

  updateStatus() {
    const strip = document.getElementById('statusStrip');
    if (!strip) return;
    const e = this.engine;
    const pills = [];
    if (e?.inCombat()) pills.push(`<span class="status-pill">${icon('sword')}${esc(t('combat.inCombat'))}</span>`);
    if (this.screen.game.player.mount) pills.push(`<span class="status-pill">${icon('mount')}${esc(t('hud.mount'))}</span>`);
    if (e?.armorBuffUntil > Date.now()) pills.push(`<span class="status-pill">${icon('shield')}${esc(t('skill.warrior3'))}</span>`);
    if (e?.xpBuffUntil > Date.now()) pills.push(`<span class="status-pill">${icon('spark')}XP</span>`);
    if (e?.gatherBuffUntil > Date.now()) pills.push(`<span class="status-pill">${icon('herb')}${esc(t('gather.title'))}</span>`);
    strip.innerHTML = pills.join('');
  }

  updateCooldowns() {
    if (!this.engine) return;
    for (const btn of document.querySelectorAll('[data-skill]')) {
      const id = btn.dataset.skillId;
      const skill = CLASSES[this.screen.game.player.classId].skills.find((s) => s.id === id);
      const left = this.engine.cooldowns[id] ?? 0;
      const cd = btn.querySelector('[data-cd]');
      const num = btn.querySelector('[data-cdnum]');
      if (cd) cd.style.setProperty('--cd', `${skill?.cd ? Math.min(100, (left / skill.cd) * 100) : 0}%`);
      if (num) num.textContent = left > 0 ? (left >= 1 ? Math.ceil(left) : left.toFixed(1)) : '';
      if (skill) btn.classList.toggle('locked', this.screen.game.player.level < skill.unlock);
    }
  }

  updateQuestTracker() {
    const box = document.getElementById('questTrack');
    if (!box) return;
    const tracked = trackedQuest(this.screen.game.player);
    if (!tracked) {
      box.innerHTML = `<div class="qt-eyebrow">${esc(t('hud.quests'))}</div><div class="qt-name">${esc(t('hud.noQuest'))}</div>`;
      return;
    }
    const objs = questObjectiveText(tracked.quest, tracked.entry).slice(0, 3);
    box.innerHTML = `<div class="qt-eyebrow">${esc(t('hud.tracked'))}${tracked.entry.state === 'done' ? ` · <span class="qt-ready">${esc(t('quest.ready'))}</span>` : ''}</div>
      <div class="qt-name">${esc(tx(tracked.quest.name))}</div>
      ${objs.map((o) => `<div class="qt-obj${o.done >= o.count ? ' done' : ''}"><i></i><span>${esc(o.text)}</span><span>${esc(o.progressText)}</span></div>`).join('')}`;
  }

  tick(dt) {
    this.uiTimer += dt;
    if (this.uiTimer < 0.12) return;
    this.uiTimer = 0;
    const p = this.screen.game.player;
    const stats = p.stats;
    const hpBar = document.getElementById('hpBar');
    if (hpBar) {
      hpBar.querySelector('i').style.width = `${Math.max(0, Math.min(100, (p.hp / stats.maxHp) * 100))}%`;
      document.getElementById('hpText').textContent = `${Math.max(0, Math.round(p.hp))}/${Math.round(stats.maxHp)}`;
    }
    const resBar = document.getElementById('resBar');
    if (resBar) {
      resBar.querySelector('i').style.width = `${Math.max(0, Math.min(100, (p.resource / stats.maxResource) * 100))}%`;
      document.getElementById('resText').textContent = `${Math.max(0, Math.round(p.resource))}/${Math.round(stats.maxResource)}`;
    }
    const next = xpForLevel(p.level);
    const xpBar = document.getElementById('xpBar');
    if (xpBar) xpBar.querySelector('i').style.width = `${p.level >= 60 ? 100 : Math.max(0, Math.min(100, (p.xp / next) * 100))}%`;
    document.getElementById('goldText').textContent = fmt(p.gold);
    document.getElementById('gemsText').textContent = fmt(p.gems);
    this.updateCooldowns();
    this.updateTarget();
    this.updateInteraction();
    if (this.engine?.interaction) this.updateQuestTracker();
  }

  showOnboarding() {
    let step = 0;
    const steps = ['onboarding.step1', 'onboarding.step2', 'onboarding.step3', 'onboarding.step4'];
    const render = () => {
      closeModal();
      const wrap = showModal({
        title: t('onboarding.title'),
        className: 'onboarding-modal',
        body: `<div class="onboarding-icon">${icon(['compass', 'axe', 'spark', 'menu'][step])}</div>
          <p class="confirm-text" style="text-align:center">${esc(t(steps[step]))}</p>
          <div class="onboarding-dots">${steps.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>`,
        foot: `<button class="btn ghost" data-skip>${esc(t('onboarding.skip'))}</button>
               <button class="btn primary" data-next>${esc(step === steps.length - 1 ? t('onboarding.done') : t('onboarding.next'))}</button>`,
      });
      wrap?.querySelector('[data-skip]')?.addEventListener('click', finish);
      wrap?.querySelector('[data-next]')?.addEventListener('click', () => {
        step++;
        if (step >= steps.length) finish();
        else render();
      });
    };
    const finish = () => {
      closeModal();
      this.screen.settings.tutorialDone = true;
      saveSettings(this.screen.settings);
      this.screen.game.settings.tutorialDone = true;
      saveNow();
    };
    render();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.engine?.detach();
    this.engine = null;
  }
}
