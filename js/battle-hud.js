import { RARITY, CLASS } from './data.js';
import { getTemplate, formatNumber } from './state.js';
import { skillIcon, uiIcon, miniPortrait, itemIcon, bossEmblem } from './icons.js';
import { audio, haptic } from './audio.js';
import { tilt } from './motion.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const hudMethods = {
  buildHud() {
    const stage = this.stage;
    const cls = this.cls;
    const boss = this.stage.type === 'boss';
    const pipHtml = Array.from({ length: this.waveTotal }, (_, i) => {
      const isBoss = boss && i === this.waveTotal - 1;
      return `<span class="wave-pip ${isBoss ? 'boss' : ''}" data-pip="${i}">${isBoss ? uiIcon('crown') : ''}<i></i></span>`;
    }).join('');
    const skillHtml = cls.skills.map((s, i) => `
      <button class="skill-orb skill-${i + 1}" data-skill="${i}" aria-label="${s.name}" title="${s.name}" style="--accent:${i === 2 ? cls.accent : cls.color}">
        <span class="skill-glyph">${skillIcon(s.icon)}</span>
        <span class="cd-sweep"></span>
        <span class="cd-text"></span>
        <span class="skill-key">${i + 1}</span>
      </button>`).join('');

    this.hud.classList.remove('result-open', 'is-paused', 'boss-active');
    this.hud.innerHTML = `
      <div class="battle-top">
        <button class="round-btn battle-pause" data-action="pause" aria-label="Pause battle">${uiIcon('pause')}</button>
        <div class="battle-stage">
          <span class="battle-eyebrow">STAGE ${stage.id} · ${this.chapter.short}</span>
          <strong>${escapeHtml(stage.name)}</strong>
          <div class="wave-pips" aria-label="Wave progress">${pipHtml}</div>
        </div>
        <div class="battle-actions">
          <button class="auto-btn" data-action="auto" aria-label="Toggle auto combat" aria-pressed="false">
            ${uiIcon('auto')}<span>AUTO</span>
          </button>
        </div>
      </div>

      <div class="player-vitals">
        <div class="vitals-head">
          <span class="vitals-crest">${miniPortrait(this.state.classId)}</span>
          <span class="vitals-name">${escapeHtml(this.state.name)}</span>
          <span class="vitals-level">LV ${this.state.level}</span>
        </div>
        <div class="hp-track">
          <span class="hp-fill"></span>
          <span class="hp-text"></span>
        </div>
        <div class="buff-row"></div>
      </div>

      <div class="boss-bar" data-boss hidden>
        <div class="boss-meta">
          <span class="boss-label">${uiIcon('skull')} BOSS</span>
          <strong class="boss-name"></strong>
          <span class="boss-phase"></span>
        </div>
        <div class="boss-track"><span class="boss-fill"></span></div>
      </div>

      <div class="battle-announcement" data-announcement>
        <span class="ann-kicker"></span>
        <strong class="ann-title"></strong>
        <small class="ann-sub"></small>
      </div>

      <div class="loot-toasts" aria-live="polite"></div>

      <div class="joystick-zone">
        <button class="tilt-chip" data-action="tilt" hidden>${uiIcon('tilt')}<span>TILT</span></button>
        <div class="joystick" data-joystick aria-label="Movement joystick">
          <span class="joystick-cross"></span>
          <span class="joystick-knob"></span>
        </div>
      </div>

      <div class="skill-panel">
        <div class="skill-arc">${skillHtml}</div>
        <button class="dash-btn" data-action="dash" aria-label="Dash">
          ${uiIcon('dash')}
          <span class="dash-key">SPACE</span>
          <span class="dash-cd"></span>
        </button>
      </div>

      <div class="battle-tip">Auto-attack targets the nearest enemy · Drag to move</div>

      <div class="battle-overlay pause-overlay" data-pause>
        <div class="overlay-panel pause-panel">
          <span class="eyebrow">PAUSED</span>
          <h2>The ash holds its breath.</h2>
          <p>${escapeHtml(this.chapter.name)} · ${escapeHtml(this.stage.name)}</p>
          <div class="overlay-actions">
            <button class="btn btn-primary" data-action="resume">Resume battle</button>
            <button class="btn btn-ghost" data-action="toggle-sound">${uiIcon('volume')} <span>Sound on</span></button>
            <button class="btn btn-ghost" data-action="tilt-calibrate" ${this.state.settings.tilt ? '' : 'hidden'}>${uiIcon('tilt')} Recalibrate tilt</button>
            <button class="btn btn-danger" data-action="quit">Abandon expedition</button>
          </div>
        </div>
      </div>

      <div class="battle-overlay result-overlay" data-result></div>
    `;

    this.el = {
      hpFill: this.hud.querySelector('.hp-fill'),
      hpText: this.hud.querySelector('.hp-text'),
      buffRow: this.hud.querySelector('.buff-row'),
      bossBar: this.hud.querySelector('[data-boss]'),
      bossFill: this.hud.querySelector('.boss-fill'),
      bossName: this.hud.querySelector('.boss-name'),
      bossPhase: this.hud.querySelector('.boss-phase'),
      announcement: this.hud.querySelector('[data-announcement]'),
      annKicker: this.hud.querySelector('.ann-kicker'),
      annTitle: this.hud.querySelector('.ann-title'),
      annSub: this.hud.querySelector('.ann-sub'),
      joystick: this.hud.querySelector('[data-joystick]'),
      knob: this.hud.querySelector('.joystick-knob'),
      autoBtn: this.hud.querySelector('[data-action="auto"]'),
      skillBtns: [...this.hud.querySelectorAll('[data-skill]')],
      dashBtn: this.hud.querySelector('[data-action="dash"]'),
      dashCd: this.hud.querySelector('.dash-cd'),
      pauseOverlay: this.hud.querySelector('[data-pause]'),
      resultOverlay: this.hud.querySelector('[data-result]'),
      wavePips: this.hud.querySelector('.wave-pips'),
      lootToasts: this.hud.querySelector('.loot-toasts'),
      tiltChip: this.hud.querySelector('[data-action="tilt"]'),
      vitalsLevel: this.hud.querySelector('.vitals-level')
    };
    if (this.state.settings.tilt) this.el.tiltChip.hidden = false;
    this.el.tiltChip.classList.toggle('active', tilt.enabled);
    this.syncHud();
    this.updateWavePips();
  },

  bindInput() {
    const onKeyDown = (ev) => {
      if (ev.repeat) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.code)) ev.preventDefault();
      this.keys.add(ev.code);
      if (ev.code === 'Space') this.dash();
      if (ev.code === 'Digit1') this.castSkill(0);
      if (ev.code === 'Digit2') this.castSkill(1);
      if (ev.code === 'Digit3') this.castSkill(2);
      if (ev.code === 'Escape') this.togglePause();
    };
    const onKeyUp = (ev) => this.keys.delete(ev.code);
    const onResize = () => this.resize();
    const onVisibility = () => { if (document.hidden && !this.paused && !this.finished) this.togglePause(true); };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    this.bindings.push(
      () => window.removeEventListener('keydown', onKeyDown),
      () => window.removeEventListener('keyup', onKeyUp),
      () => window.removeEventListener('resize', onResize),
      () => document.removeEventListener('visibilitychange', onVisibility)
    );

    this.hud.addEventListener('click', (ev) => {
      const action = ev.target.closest('[data-action]')?.dataset.action;
      const skill = ev.target.closest('[data-skill]')?.dataset.skill;
      const result = ev.target.closest('[data-result]')?.dataset.result;
      if (skill != null) { this.castSkill(Number(skill)); return; }
      if (action === 'pause') this.togglePause();
      else if (action === 'auto') this.setAuto(!this.auto);
      else if (action === 'dash') this.dash();
      else if (action === 'resume') this.togglePause(false);
      else if (action === 'quit') this.exitBattle();
      else if (action === 'tilt-calibrate') this.calibrateTilt();
      else if (action === 'toggle-sound') this.toggleSound();
      else if (action === 'tilt') this.enableTilt();
      else if (action === 'pause-settings') this.togglePause(true);
      if (result) this.handleResult(result);
    });

    const joy = this.el.joystick;
    const down = (ev) => {
      ev.preventDefault();
      this.joystickPointer = ev.pointerId;
      joy.setPointerCapture?.(ev.pointerId);
      this.updateJoystick(ev);
      joy.classList.add('active');
    };
    const move = (ev) => {
      if (this.joystickPointer !== ev.pointerId) return;
      ev.preventDefault();
      this.updateJoystick(ev);
    };
    const up = (ev) => {
      if (this.joystickPointer !== ev.pointerId) return;
      this.joystickPointer = null;
      this.input.x = 0; this.input.y = 0; this.input.joystick = false;
      this.el.knob.style.transform = '';
      joy.classList.remove('active');
    };
    joy.addEventListener('pointerdown', down);
    joy.addEventListener('pointermove', move);
    joy.addEventListener('pointerup', up);
    joy.addEventListener('pointercancel', up);
    joy.addEventListener('lostpointercapture', up);
    this.bindings.push(
      () => { joy.removeEventListener('pointerdown', down); joy.removeEventListener('pointermove', move); joy.removeEventListener('pointerup', up); joy.removeEventListener('pointercancel', up); joy.removeEventListener('lostpointercapture', up); }
    );
  },

  updateJoystick(ev) {
    const rect = this.el.joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = ev.clientX - cx;
    let dy = ev.clientY - cy;
    const max = rect.width * .34;
    const l = Math.hypot(dx, dy);
    if (l > max) { dx = dx / l * max; dy = dy / l * max; }
    this.el.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.input.x = clamp(dx / max, -1, 1);
    this.input.y = clamp(dy / max, -1, 1);
    this.input.joystick = true;
  },

  setAuto(value) {
    if (this.finished) return;
    this.auto = value;
    this.el.autoBtn.classList.toggle('active', value);
    this.el.autoBtn.setAttribute('aria-pressed', String(value));
    this.showToast(value ? 'Auto-combat engaged' : 'Auto-combat disengaged', value ? 'The hero fights on instinct.' : 'Manual control restored.');
    audio.play('select');
  },

  togglePause(force) {
    if (this.finished && force !== false) return;
    this.paused = typeof force === 'boolean' ? force : !this.paused;
    this.el.pauseOverlay.classList.toggle('open', this.paused);
    this.hud.classList.toggle('is-paused', this.paused);
    if (this.paused) this.updateSoundButton();
  },

  updateSoundButton() {
    const btn = this.hud.querySelector('[data-action="toggle-sound"]');
    if (!btn) return;
    btn.innerHTML = `${uiIcon(this.state.settings.sound ? 'volume' : 'mute')} <span>Sound ${this.state.settings.sound ? 'on' : 'off'}</span>`;
  },

  toggleSound() {
    this.state.settings.sound = !this.state.settings.sound;
    audio.setEnabled(this.state.settings.sound);
    if (this.state.settings.sound) audio.play('click');
    this.updateSoundButton();
  },

  async enableTilt() {
    const res = await tilt.enable();
    if (res.ok) {
      this.state.settings.tilt = true;
      this.el.tiltChip.classList.add('active');
      this.showToast('Tilt controls active', 'Tilt your device to move. The joystick still works.');
    } else {
      this.state.settings.tilt = false;
      this.el.tiltChip.hidden = true;
      this.showToast('Tilt unavailable', res.reason);
    }
  },

  calibrateTilt() {
    tilt.calibrate();
    this.showToast('Tilt recalibrated', 'Hold your device comfortably, then move.');
    this.togglePause(false);
  },

  showAnnouncement(kicker, title, sub, boss = false) {
    const a = this.el?.announcement;
    if (!a) return;
    this.el.annKicker.textContent = kicker || '';
    this.el.annTitle.textContent = title || '';
    this.el.annSub.textContent = sub || '';
    a.classList.toggle('boss', !!boss);
    a.classList.remove('active');
    void a.offsetWidth;
    a.classList.add('active');
    clearTimeout(this.annTimer);
    this.annTimer = setTimeout(() => a.classList.remove('active'), 2300);
  },

  showToast(title, sub = '') {
    const a = this.el?.announcement;
    if (!a) return;
    this.el.annKicker.textContent = '';
    this.el.annTitle.textContent = title;
    this.el.annSub.textContent = sub;
    a.classList.remove('boss');
    a.classList.remove('active');
    void a.offsetWidth;
    a.classList.add('active', 'toast');
    clearTimeout(this.annTimer);
    this.annTimer = setTimeout(() => a.classList.remove('active', 'toast'), 1700);
  },

  updateWavePips() {
    if (!this.el?.wavePips) return;
    const pips = [...this.el.wavePips.children];
    pips.forEach((pip, i) => {
      const cleared = i < this.waveIndex || (i === this.waveIndex && this.waveDelay > 0 && this.enemies.length === 0);
      pip.classList.toggle('cleared', cleared);
      pip.classList.toggle('active', i === this.waveIndex && !cleared);
    });
  },

  setBossBar(e) {
    if (!this.el?.bossBar) return;
    this.el.bossBar.hidden = false;
    this.el.bossName.textContent = e.cfg.name;
    this.el.bossPhase.textContent = 'PHASE I';
    this.el.bossFill.style.width = '100%';
    this.hud.classList.add('boss-active');
    this.syncHud();
  },

  hideBossBar() {
    if (!this.el?.bossBar) return;
    this.el.bossBar.hidden = true;
    this.hud.classList.remove('boss-active');
  },

  syncHud() {
    if (!this.el) return;
    const p = this.player;
    if (!p) return;
    const hpPct = clamp(p.hp / p.maxHp, 0, 1) * 100;
    this.el.hpFill.style.width = `${hpPct}%`;
    this.el.hpFill.classList.toggle('low', hpPct < 30);
    this.el.hpText.textContent = `${Math.ceil(p.hp)} / ${Math.ceil(p.maxHp)}`;
    this.el.vitalsLevel.textContent = `LV ${this.state.level}`;
    if (this.el.buffRow) {
      const buffs = [];
      if (p.shield > 0) buffs.push(`<span class="buff shield">${uiIcon('shield')} ${Math.ceil(p.shield)}</span>`);
      if (p.haste > 0) buffs.push(`<span class="buff haste">${uiIcon('bolt')} Haste</span>`);
      if (p.defBuff > 0) buffs.push(`<span class="buff guard">${uiIcon('shield')} Guard</span>`);
      if (p.guaranteedCrit > 0) buffs.push(`<span class="buff crit">${uiIcon('spark')} ${p.guaranteedCrit} Crit</span>`);
      this.el.buffRow.innerHTML = buffs.join('');
    }
    if (this.el.bossBar && !this.el.bossBar.hidden && this.boss) {
      const b = this.boss;
      this.el.bossFill.style.width = `${clamp(b.hp / b.maxHp, 0, 1) * 100}%`;
      this.el.bossPhase.textContent = b.phase === 2 ? 'PHASE II · ENRAGED' : 'PHASE I';
    }
    this.el.skillBtns.forEach((btn, i) => {
      const cd = p.cooldowns[i] || 0;
      const total = this.cls.skills[i].cd;
      btn.classList.toggle('cooling', cd > .03);
      btn.style.setProperty('--cd', `${clamp(cd / total, 0, 1) * 360}deg`);
      const text = btn.querySelector('.cd-text');
      if (text) text.textContent = cd > .1 ? Math.ceil(cd) : '';
      btn.classList.toggle('ready-pulse', cd <= 0 && i === 2);
    });
    this.el.dashBtn.classList.toggle('cooling', p.dashCd > .03);
    this.el.dashCd.textContent = p.dashCd > .1 ? Math.ceil(p.dashCd) : '';
    this.el.autoBtn.classList.toggle('active', this.auto);
    this.el.autoBtn.setAttribute('aria-pressed', String(this.auto));
    this.el.tiltChip?.classList.toggle('active', tilt.enabled);
  },

  pushLootToast(drop) {
    if (!this.el?.lootToasts) return;
    const template = getTemplate(drop.templateId);
    const rarity = RARITY[drop.rarity];
    if (!template || !rarity) return;
    const toast = document.createElement('div');
    toast.className = 'loot-toast';
    toast.style.setProperty('--rarity', rarity.color);
    toast.style.setProperty('--rarity-glow', rarity.glow);
    toast.innerHTML = `
      <span class="loot-icon">${itemIcon(template.slot)}</span>
      <span class="loot-copy">
        <small>${rarity.name.toUpperCase()} RELIC</small>
        <strong>${escapeHtml(template.name)}</strong>
      </span>
      <span class="loot-qty">+1</span>`;
    this.el.lootToasts.appendChild(toast);
    audio.play(['rare', 'epic', 'legendary', 'mythic', 'divine'].includes(drop.rarity) ? 'epic' : 'loot');
    while (this.el.lootToasts.children.length > 3) this.el.lootToasts.firstElementChild.remove();
    setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => toast.remove(), 400);
    }, 2600);
  },

  showResult(kind, rewards) {
    if (!this.el?.resultOverlay) return;
    this.hud.classList.add('result-open');
    const stage = this.stage;
    const victory = kind === 'victory';
    const loot = rewards?.items || [];
    const levels = rewards?.levels || 0;
    const lootHtml = victory ? loot.slice(0, 6).map(drop => {
      const t = getTemplate(drop.templateId);
      const r = RARITY[drop.rarity];
      if (!t || !r) return '';
      return `<div class="reward-item" style="--rarity:${r.color};--rarity-glow:${r.glow}">
        <span class="reward-icon">${itemIcon(t.slot)}</span>
        <span class="reward-name">${escapeHtml(t.name)}</span>
        <span class="reward-rarity">${r.name}${t.unique ? ' · UNIQUE' : ''}</span>
      </div>`;
    }).join('') : '';
    const boss = stage.type === 'boss';
    this.el.resultOverlay.classList.add('open');
    this.el.resultOverlay.innerHTML = `
      <div class="result-panel ${victory ? 'victory' : 'defeat'}">
        <div class="result-sigil">${boss && victory ? bossEmblem(stage.boss) : uiIcon(victory ? 'trophy' : 'skull')}</div>
        <span class="eyebrow">${victory ? (boss ? 'BOSS VANQUISHED' : 'EXPEDITION COMPLETE') : 'THE ASH REMEMBERS'}</span>
        <h2>${victory ? 'STAGE CLEARED' : 'YOU HAVE FALLEN'}</h2>
        <p class="result-stage">${escapeHtml(this.chapter.name)} · ${escapeHtml(stage.name)}</p>
        ${victory ? `
          <div class="reward-summary">
            <div><span>${uiIcon('gold')}</span><strong>+${formatNumber(rewards?.gold || 0)}</strong><small>GOLD</small></div>
            <div><span>${uiIcon('star')}</span><strong>+${formatNumber(rewards?.xp || 0)}</strong><small>EXPERIENCE</small></div>
            <div><span>${uiIcon('anvil')}</span><strong>${loot.length}</strong><small>RELICS</small></div>
          </div>
          ${levels > 0 ? `<div class="level-up-line">${uiIcon('spark')} LEVEL UP · now level ${this.state.level}</div>` : ''}
          <div class="reward-loot">${lootHtml}</div>
        ` : `
          <p class="defeat-copy">Your gear is intact. Reforge what you have, then return stronger.</p>
          <div class="defeat-tip">${uiIcon('info')} Tip: four identical relics can become one of the next rarity.</div>
        `}
        <div class="overlay-actions result-actions">
          ${victory
            ? `<button class="btn btn-primary" data-result="return">Return to campaign</button><button class="btn btn-ghost" data-result="retry">Battle again</button>`
            : `<button class="btn btn-primary" data-result="retry">Rise again</button><button class="btn btn-ghost" data-result="return">Return to campaign</button>`}
        </div>
      </div>`;
    audio.play(victory ? 'victory' : 'defeat');
  },

  handleResult(result) {
    if (result === 'return') this.exitBattle();
    else if (result === 'retry') {
      this.destroy();
      this.onRetry(this.stage);
    }
  },

  exitBattle() {
    this.destroy();
    this.onExit('campaign');
  },

  destroy() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    clearTimeout(this.annTimer);
    for (const unbind of this.bindings) {
      try { unbind(); } catch { /* no-op */ }
    }
    this.bindings = [];
    if (this.hud) this.hud.innerHTML = '';
    tilt.disable();
  }
};

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
