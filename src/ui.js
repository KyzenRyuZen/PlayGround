/* ---------------------------------------------------------------
   DOM UI: screens, sheets, HUD, toasts.
   --------------------------------------------------------------- */
import {
  CLASSES, SLOTS, SLOT_BY_ID, RARITIES, RARITY_BY_ID, RARITY_INDEX,
  BIOMES, STAGES, BOSSES, ENEMIES, SHOP, TIPS, SET_BONUSES, MAX_LEVEL,
  RIFT_UNLOCK_STAGE,
} from './data.js';
import {
  computeStats, itemDef, itemStats, statSummary, formatNum, xpToNext,
  highestClearedStage, nextStageId, countItem, bestRarity, equipBest,
  shopPrice, stageTier, starsFor,
} from './rules.js';
import { icon } from './icons.js';

const RCLS = { common: 'r-common', rare: 'r-rare', epic: 'r-epic', legendary: 'r-legendary', mythic: 'r-mythic', divine: 'r-divine' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const stars = n => `<span class="stars">${[1, 2, 3].map(i => `<span class="${i <= n ? 'on' : ''}">★</span>`).join('')}</span>`;
const pips = n => `<span class="pips">${[0, 1, 2, 3].map(i => `<i class="pip ${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
const rarity = id => RARITY_BY_ID[id] || RARITIES[0];
const pctBar = (v, max) => Math.max(4, Math.min(100, (v / max) * 100));

export class UI {
  constructor(app) {
    this.app = app;
    this.root = document.getElementById('ui');
    this.modalRoot = document.getElementById('modal-root');
    this.toastsEl = document.getElementById('toasts');
    this.bannerTimer = null;
    this.toastCount = 0;
    this.modalOpen = false;
    this._bind();
  }

  _bind() {
    const handler = (e) => {
      const backdrop = e.target.closest('.modal-backdrop');
      if (backdrop && e.target === backdrop && backdrop.dataset.dismiss !== 'false') {
        this.closeModal();
        return;
      }
      const el = e.target.closest('[data-action]');
      if (!el) return;
      e.preventDefault();
      this._action(el.dataset.action, el.dataset, el);
    };
    this.root.addEventListener('click', handler);
    this.modalRoot.addEventListener('click', handler);
    const nameInput = () => document.getElementById('char-name');
    this.root.addEventListener('input', e => {
      if (e.target.id === 'char-name') this.app.createName = e.target.value;
    });
    const vol = document.getElementById('volume');
    if (vol) vol.addEventListener('input', e => this.app.setVolume(Number(e.target.value)));
    this.root.addEventListener('input', e => {
      if (e.target.id === 'volume') this.app.setVolume(Number(e.target.value));
    });
    this.modalRoot.addEventListener('input', e => {
      if (e.target.id === 'volume') this.app.setVolume(Number(e.target.value));
    });
  }

  /* ---------------------------------------------------------- actions */
  async _action(action, data, el) {
    const app = this.app;
    switch (action) {
      case 'new': app.showCreate(); break;
      case 'continue': app.continueJourney(); break;
      case 'title': app.showTitle(); break;
      case 'settings': if (app.screen === 'battle') app.pauseSettings(); else this.settings(); break;
      case 'help': this.help(); break;
      case 'close': this.closeModal(); break;
      case 'confirm': { const fn = this._confirmFn; this._confirmFn = null; this.closeModal(); fn?.(); break; }
      case 'class': app.createClass(data.class); this.renderCreate(); break;
      case 'begin': {
        const name = document.getElementById('char-name')?.value || app.createName;
        app.beginJourney(app.createClassId, name);
        break;
      }
      case 'hub': app.goHub(); break;
      case 'map': app.goMap(); break;
      case 'forge': app.goForge(); break;
      case 'shop': app.goShop(); break;
      case 'stage': app.openStage(Number(data.id)); break;
      case 'rift': app.openRift(Number(data.depth)); break;
      case 'embark': this.closeModal(); app.enterStage(data.kind === 'rift' ? { rift: true, depth: Number(data.depth) } : Number(data.id)); break;
      case 'gear-slot': this.gearSheet(data.slot); break;
      case 'gear-equip': app.equip(data.slot, data.rarity); this.gearSheet(data.slot); break;
      case 'gear-unequip': app.unequip(data.slot); this.gearSheet(data.slot); break;
      case 'equip-best': app.equipBest(); this.closeModal(); app.goHub(); break;
      case 'merge': {
        app.merge(data.slot, data.rarity);
        if (this.modalOpen) this.gearSheet(data.slot);
        else if (app.screen === 'forge') this.renderForge();
        break;
      }
      case 'merge-all': app.mergeAll(); if (app.screen === 'forge') this.renderForge(); break;
      case 'shop-buy': {
        const entry = SHOP.find(s => s.id === data.id);
        if (entry?.oneShot) app.buyCache(data.id);
        else this.slotPicker(data.id);
        break;
      }
      case 'pick-slot': this.closeModal(); app.buyCache(data.id, data.slot); break;
      case 'pause': app.pause(); break;
      case 'resume': app.resume(); break;
      case 'abandon': app.abandon(); break;
      case 'revive': app.revive(); break;
      case 'give-up': app.giveUp(); break;
      case 'retry': app.retryStage(); break;
      case 'result-continue': app.returnToMap(); break;
      case 'result-camp': app.goHub(); break;
      case 'next-stage': app.nextStage(); break;
      case 'skill': app.castSkill(Number(data.index)); break;
      case 'toggle': app.toggleSetting(data.key); this.settings(); break;
      case 'tilt-toggle': {
        const res = await app.toggleTilt();
        this.toast({ text: res.reason, rarity: res.ok ? 'rare' : 'common', iconName: 'motion' });
        this.settings();
        break;
      }
      case 'tilt-calibrate': {
        const ok = app.calibrateTilt();
        this.toast({ text: ok ? 'Tilt neutral point calibrated.' : 'Tilt is not active yet.', iconName: 'motion', rarity: ok ? 'rare' : 'common' });
        this.settings();
        break;
      }
      case 'reset': this.confirm('Abandon this journey?', 'Your character, equipment, and progress will be permanently erased.', 'Erase everything', () => { app.resetSave(); this.closeModal(); app.showTitle(); }); break;
      case 'tutorial': this.tutorial(); break;
      case 'dismiss-tutorial': app.dismissTutorial(); this.closeModal(); break;
      case 'save-quit': app.abandon(); break;
    }
  }

  _setScreen(name) {
    for (const s of this.root.querySelectorAll('.screen')) s.classList.remove('active');
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
  }

  showScreen(name) {
    this._setScreen(name);
    if (name === 'create') requestAnimationFrame(() => this._drawCreatePortrait());
    if (name === 'hub') requestAnimationFrame(() => this._drawHubPortrait());
  }

  /* ---------------------------------------------------------- title */
  renderTitle() {
    const save = this.app.save;
    const cont = save ? `<button class="btn btn-primary" data-action="continue">Continue <span class="ico">${icon('arrow')}</span></button>
      <div class="continue-note">${esc(save.character.name)} · Level ${save.character.level} ${CLASSES[save.character.classId].name}</div>` : '';
    this.root.innerHTML = `
      <div id="screen-title" class="screen active">
        <div class="title-wrap">
          <div class="emblem">${icon('sparkle')}</div>
          <h1 class="logo">Emberbound</h1>
          <div class="logo-sub">Rift of the Nine</div>
          <div class="title-rule"><span>A pocket action RPG</span></div>
          <div class="title-menu">
            ${cont}
            <button class="btn ${save ? '' : 'btn-primary'}" data-action="new">New Journey</button>
            <button class="btn btn-ghost" data-action="help">How to Play</button>
            <button class="btn btn-ghost" data-action="settings">${icon('settings')} Settings</button>
          </div>
          <div class="title-foot"><b>${TIPS[Math.floor(Date.now() / 8000) % TIPS.length]}</b></div>
        </div>
      </div>`;
    this.app.screen = 'title';
  }

  /* ---------------------------------------------------------- create */
  renderCreate() {
    const app = this.app;
    const classId = CLASSES[app.createClassId] ? app.createClassId : 'warrior';
    const cls = CLASSES[classId];
    const names = ['Ash', 'Wren', 'Kael', 'Lyra', 'Sable', 'Orin', 'Vale', 'Nyx'];
    const suggested = app.createName || names[Math.floor(Math.random() * names.length)];
    app.createName = suggested;
    const maxVals = { hp: 265, atk: 22, def: 28, spd: 166 };
    const statLine = (label, key) => {
      const v = cls.base[key];
      return `<div class="stat-line"><span>${label}</span><span class="stat-track"><i class="stat-fill" style="width:${pctBar(v, maxVals[key])}%"></i></span><b>${v}</b></div>`;
    };
    this.root.innerHTML = `
      <div id="screen-create" class="screen">
        <div class="create-head">
          <div class="back-row">
            <button class="icon-btn" data-action="title" aria-label="Back">${icon('back')}</button>
            <div>
              <div class="eyebrow">Character Creation</div>
              <h2 class="display">Choose your path</h2>
            </div>
          </div>
          <div class="chip gold">${icon('sparkle')} Three paths · One balance</div>
        </div>
        <div class="create-body">
          <div class="class-tabs">
            ${Object.values(CLASSES).map(c => `
              <button class="class-tab ${c.id === classId ? 'selected' : ''}" data-action="class" data-class="${c.id}">
                <i class="t-mark"></i>
                <span class="t-name">${c.name}</span>
                <span class="t-role">${c.epithet}</span>
              </button>`).join('')}
          </div>
          <div class="class-stage">
            <div class="class-hero">
              <div class="portrait-frame"><canvas id="create-portrait"></canvas></div>
              <div class="class-copy">
                <h3>${cls.name}</h3>
                <div class="role">${cls.role}</div>
                <p class="desc">${cls.blurb}</p>
                <p class="passive"><b>${cls.passive.name}</b> — ${cls.passive.desc}</p>
              </div>
            </div>
            <div class="panel class-cols-a">
              <div class="stat-list">
                ${statLine('Health', 'hp')}
                ${statLine('Attack', 'atk')}
                ${statLine('Defense', 'def')}
                ${statLine('Speed', 'spd')}
                <div class="stat-line"><span>Crit</span><span class="stat-track"><i class="stat-fill" style="width:${pctBar(cls.base.crit, 18)}%"></i></span><b>${cls.base.crit}%</b></div>
              </div>
              <div class="divider"></div>
              <div style="padding:0 14px 12px;font-size:10px;color:var(--muted);line-height:1.55">
                <p><b style="color:var(--good)">Strength.</b> ${cls.strengths}</p>
                <p style="margin-top:6px"><b style="color:var(--danger)">Weakness.</b> ${cls.weakness}</p>
              </div>
            </div>
            <div class="panel">
              <div style="padding:11px 14px 4px" class="eyebrow">Three unique skills</div>
              <div class="skill-list">
                ${cls.skills.map(s => `
                  <div class="skill-row">
                    <div class="skill-glyph">${icon(s.icon)}</div>
                    <div><div class="s-name">${s.name}</div><div class="s-desc">${s.desc}</div></div>
                    <div class="s-cd">${s.cd}s</div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
          <div class="class-foot">
            <label class="name-field"><span>Name</span><input id="char-name" maxlength="16" autocomplete="off" spellcheck="false" value="${esc(suggested)}" aria-label="Character name"></label>
            <button class="btn btn-primary" data-action="begin">Begin Journey ${icon('arrow')}</button>
          </div>
        </div>
      </div>`;
    this.showScreen('create');
    this.app.screen = 'create';
  }

  _drawCreatePortrait() {
    const canvas = document.getElementById('create-portrait');
    if (canvas && this.app.renderer) this.app.renderer.drawPortrait(canvas, this.app.createClassId, { time: performance.now() / 1000 });
  }

  /* ---------------------------------------------------------- hub */
  renderHub() {
    const app = this.app;
    const save = app.save;
    if (!save) return this.renderTitle();
    const char = save.character;
    const cls = CLASSES[char.classId];
    const s = computeStats(char);
    const high = highestClearedStage(save.progress);
    const nextId = nextStageId(save.progress);
    const stage = STAGES[nextId - 1];
    const riftUnlocked = high >= RIFT_UNLOCK_STAGE;
    const inv = char.inventory;
    const xpNeed = xpToNext(char.level);
    const setLine = s.setCount >= 3 ? SET_BONUSES.filter(b => s.setCount >= b.count).pop() : null;
    const setRarity = s.setRarity ? rarity(s.setRarity).name : '';
    const gearCells = SLOTS.map(slot => {
      const r = char.equipped[slot.id];
      const def = r ? itemDef(slot.id, r) : null;
      const count = r ? countItem(inv, slot.id, r) : 0;
      return `<button class="gear-cell ${def ? '' : 'empty'}" ${def ? `data-rarity="${r}"` : ''} data-action="gear-slot" data-slot="${slot.id}">
        <span class="g-slot"><span>${slot.name}</span>${count > 1 ? `<span class="g-badge">${count}</span>` : ''}</span>
        <span class="g-name">${def ? esc(def.name) : 'Empty'}</span>
        <span class="g-rarity ${def ? RCLS[r] : ''}">${def ? rarity(r).name : 'Tap to view'}</span>
        <span class="g-icon">${icon(slot.icon)}</span>
      </button>`;
    }).join('');

    this.root.innerHTML = `
      <div id="screen-hub" class="screen">
        <div class="topbar">
          <div class="brand">${icon('sparkle')} Emberbound</div>
          <div class="top-right">
            <div class="gold-pill">${icon('gold')} ${formatNum(save.gold)}</div>
            <button class="icon-btn" data-action="settings" aria-label="Settings">${icon('settings')}</button>
          </div>
        </div>
        <div class="hub-scroll">
          <div class="hub-grid">
            <section class="panel hero-card">
              <div class="portrait-frame"><canvas id="hub-portrait"></canvas></div>
              <div class="hero-id">
                <h2>${esc(char.name)}</h2>
                <div class="hero-role">${cls.name} · ${cls.epithet}</div>
                <div class="hero-meta">
                  <span class="chip gold">Level ${char.level}</span>
                  <span class="chip">${icon('sparkle')} ${s.setCount >= 3 ? `${setRarity} set ${s.setCount}/9` : 'No set bonus'}</span>
                </div>
                <div class="xp-wrap">
                  <div class="xp-line"><span>XP</span><span>${char.level >= MAX_LEVEL ? 'MAX' : `${formatNum(char.xp)} / ${formatNum(xpNeed)}`}</span></div>
                  <div class="xp-track"><i class="xp-fill" style="width:${char.level >= MAX_LEVEL ? 100 : (char.xp / xpNeed) * 100}%"></i></div>
                </div>
                <div class="power-badge"><b>${formatNum(s.power)}</b><span>Power</span></div>
              </div>
              <div class="stat-grid" style="grid-column:1/-1">
                <div class="stat-cell"><span class="k">Health</span><span class="v">${formatNum(s.hp)}</span></div>
                <div class="stat-cell"><span class="k">Attack</span><span class="v">${formatNum(s.atk)}</span></div>
                <div class="stat-cell"><span class="k">Defense</span><span class="v">${formatNum(s.def)}</span></div>
                <div class="stat-cell"><span class="k">Crit</span><span class="v">${s.crit}<small>%</small></span></div>
                <div class="stat-cell"><span class="k">Crit Dmg</span><span class="v">${s.cdmg}<small>%</small></span></div>
                <div class="stat-cell"><span class="k">Speed</span><span class="v">${formatNum(s.spd)}</span></div>
              </div>
            </section>

            <section class="panel gear-panel">
              <div class="panel-head">
                <h3>Equipment</h3>
                <span class="hint">Tap a slot to equip or ascend</span>
              </div>
              <div class="gear-grid">${gearCells}</div>
              <div class="set-bonus">${setLine ? `<b>${setRarity} set ${s.setCount}/9:</b> ${setLine.label}` : 'Equip 3, 6, or 9 pieces of the same rarity for a set bonus.'}</div>
            </section>

            <div class="action-row">
              <button class="btn btn-primary" data-action="map">${icon('map')} Adventure<span class="sub-label">Stage ${nextId} · ${stage ? stage.name : 'The Rift'}</span></button>
              <button class="btn" data-action="forge">${icon('forge')} Forge${app.mergeableCount() ? `<span class="sub-label">${app.mergeableCount()} ready</span>` : ''}</button>
              <button class="btn" data-action="shop">${icon('shop')} Merchant</button>
            </div>

            ${riftUnlocked ? `<section class="panel next-stage-note"><span>${icon('leader')} The Rift is open. Deepest descent: <b>${save.progress.riftBest || 0}</b></span><button class="btn btn-sm" data-action="rift" data-depth="${(save.progress.riftBest || 0) + 1}">Descend</button></section>` : ''}
            <section class="panel next-stage-note"><span>Next objective: <b>${stage ? stage.name : 'Endless Rift'}</b>${stage ? ` · ${formatNum(stage.rec)} recommended power` : ''}</span><span class="chip ${s.power >= (stage?.rec || 0) ? 'gold' : ''}">${s.power >= (stage?.rec || 0) ? 'Ready' : 'Underpowered'}</span></section>
          </div>
        </div>
      </div>`;
    this.showScreen('hub');
    this.app.screen = 'hub';
  }

  _drawHubPortrait() {
    const canvas = document.getElementById('hub-portrait');
    if (!canvas || !this.app.renderer) return;
    const char = this.app.save.character;
    const gear = (slot) => {
      const r = char.equipped[slot];
      return r ? RARITY_BY_ID[r]?.color : null;
    };
    this.app.renderer.drawPortrait(canvas, char.classId, {
      time: performance.now() / 1000,
      armorColor: gear('armor') || CLASSES[char.classId].accent,
      weaponColor: gear('weapon') || CLASSES[char.classId].color,
    });
  }

  /* ---------------------------------------------------------- map */
  renderMap() {
    const app = this.app;
    const save = app.save;
    if (!save) return this.renderTitle();
    const high = highestClearedStage(save.progress);
    const next = nextStageId(save.progress);
    const s = computeStats(save.character);
    const byBiome = {};
    for (const stage of STAGES) (byBiome[stage.biome] ||= []).push(stage);
    let list = '';
    for (const [biomeId, stages] of Object.entries(byBiome)) {
      const biome = BIOMES[biomeId];
      list += `<div class="biome-head" style="--biome:${biome.accent}">${biome.name}<span style="font-size:8px;color:var(--faint);letter-spacing:.08em">${stages.length} stages</span></div>`;
      for (const stage of stages) {
        const cleared = save.progress.cleared[stage.id];
        const unlocked = stage.id <= high + 1;
        const current = stage.id === next;
        const st = cleared?.stars || 0;
        const low = s.power < stage.rec * 0.8;
        list += `<button class="stage-node ${unlocked ? '' : 'locked'} ${cleared ? 'cleared' : ''} ${current ? 'current' : ''}" data-action="stage" data-id="${stage.id}" ${unlocked ? '' : 'disabled'}>
          <span class="stage-num">${unlocked ? stage.id : icon('lock')}${stage.boss ? `<span class="boss-mark">${icon('skull')}</span>` : ''}</span>
          <span class="stage-info">
            <span class="s-name">${stage.name}</span>
            <span class="s-meta">
              <span class="chip">${biome.name}</span>
              ${stage.boss ? `<span class="chip" style="color:#ffb1a6">${BOSSES[stage.boss].name}</span>` : ''}
              ${cleared ? '<span class="chip" style="color:var(--good)">Cleared</span>' : ''}
            </span>
          </span>
          <span class="stage-right">
            ${stars(st)}
            <span class="power-tag ${low ? 'low' : s.power >= stage.rec ? 'good' : ''}">${formatNum(stage.rec)} pwr</span>
          </span>
        </button>`;
      }
    }
    const riftUnlocked = high >= RIFT_UNLOCK_STAGE;
    const riftDepth = (save.progress.riftBest || 0) + 1;
    const rift = riftUnlocked ? `
      <div class="biome-head" style="--biome:#c48bff">The Endless Rift</div>
      <button class="stage-node rift-node" data-action="rift" data-depth="${riftDepth}">
        <span class="stage-num">${icon('leader')}</span>
        <span class="stage-info"><span class="s-name">Rift ${riftDepth}</span><span class="s-meta"><span class="chip">Endless</span><span class="chip">Boss every descent</span><span class="chip">Best: ${save.progress.riftBest || 0}</span></span></span>
        <span class="stage-right"><span class="power-tag">${formatNum(Math.round(3000 * Math.pow(1.32, riftDepth)))} pwr</span></span>
      </button>` : '';
    this.root.innerHTML = `
      <div id="screen-map" class="screen">
        <div class="screen-head">
          <div class="back-row">
            <button class="icon-btn" data-action="hub" aria-label="Camp">${icon('back')}</button>
            <div class="titles"><h2 class="display">The Long Road</h2><p>${high} of ${STAGES.length} stages cleared · ${esc(save.character.name)} · Power ${formatNum(s.power)}</p></div>
          </div>
          <div class="gold-pill">${icon('gold')} ${formatNum(save.gold)}</div>
        </div>
        <div class="screen-scroll">
          <div class="map-list">${list}${rift}</div>
          <div class="shop-note">Stages can be replayed. Replays still drop equipment, gold, and experience. First clears grant bonus loot.</div>
        </div>
      </div>`;
    this.showScreen('map');
    this.app.screen = 'map';
  }

  /* ---------------------------------------------------------- forge */
  renderForge() {
    const app = this.app;
    const save = app.save;
    if (!save) return this.renderTitle();
    const inv = save.character.inventory;
    const rows = [];
    for (const slot of SLOTS) {
      for (const r of RARITIES) {
        if (r.id === 'divine') continue;
        const count = countItem(inv, slot.id, r.id);
        if (!count) continue;
        const next = RARITIES[RARITY_INDEX[r.id] + 1];
        const ready = count >= 4;
        rows.push({ slot, r, count, next, ready });
      }
    }
    rows.sort((a, b) => (b.ready - a.ready) || (RARITY_INDEX[b.r.id] - RARITY_INDEX[a.r.id]));
    const readyRows = rows.filter(r => r.ready);
    const progRows = rows.filter(r => !r.ready);
    const rowHtml = ({ slot, r, count, next, ready }) => {
      const def = itemDef(slot.id, r.id);
      return `<div class="merge-row ${ready ? 'ready' : ''}" style="--rarity:${r.color}">
        <span class="m-icon">${icon(slot.icon)}</span>
        <span>
          <span class="m-name">${esc(def.name)}</span>
          <span class="m-sub">${slot.name} · <span class="${RCLS[r.id]}">${r.name}</span> · ${count} / 4 ${pips(Math.min(4, count))}</span>
        </span>
        ${ready
          ? `<button class="btn btn-sm" data-action="merge" data-slot="${slot.id}" data-rarity="${r.id}">${icon('forge')} Ascend</button>`
          : `<span class="tiny">${next ? `${4 - count} more for ${next.name}` : 'Max'}</span>`}
      </div>`;
    };
    this.root.innerHTML = `
      <div id="screen-forge" class="screen">
        <div class="screen-head">
          <div class="back-row">
            <button class="icon-btn" data-action="hub" aria-label="Camp">${icon('back')}</button>
            <div class="titles"><h2 class="display">The Forge</h2><p>Four identical pieces become one of the next rarity.</p></div>
          </div>
          <div class="gold-pill">${icon('gold')} ${formatNum(save.gold)}</div>
        </div>
        <div class="screen-scroll">
          <div class="panel forge-intro">
            <div class="fi-icon">${icon('forge')}</div>
            <p>Fuse <b>4 identical</b> pieces into a single item of the next rarity. Equipped copies count. If the equipped piece is consumed, the ascended item is equipped automatically.</p>
          </div>
          ${rows.length === 0 ? '<div class="panel empty-note">Your vault is empty.<br><b>Defeat monsters and clear stages to find equipment.</b></div>' : ''}
          ${readyRows.length ? `<div class="forge-group-title">Ready to ascend <span>${readyRows.length}</span></div>${readyRows.map(rowHtml).join('')}` : ''}
          ${progRows.length ? `<div class="forge-group-title">In progress <span>${progRows.length}</span></div>${progRows.map(rowHtml).join('')}` : ''}
          ${readyRows.length > 1 ? `<div style="margin-top:12px"><button class="btn btn-wide" data-action="merge-all">${icon('sparkle')} Ascend every ready piece</button></div>` : ''}
        </div>
      </div>`;
    this.showScreen('forge');
    this.app.screen = 'forge';
  }

  /* ---------------------------------------------------------- shop */
  renderShop() {
    const app = this.app;
    const save = app.save;
    if (!save) return this.renderTitle();
    const tier = app.shopTier();
    const stage = tier > 12 ? { depth: tier - 12, rift: true, id: 1000 + tier } : STAGES[Math.min(11, tier - 1)];
    const blessing = save.character.blessing;
    this.root.innerHTML = `
      <div id="screen-shop" class="screen">
        <div class="screen-head">
          <div class="back-row">
            <button class="icon-btn" data-action="hub" aria-label="Camp">${icon('back')}</button>
            <div class="titles"><h2 class="display">The Wandering Merchant</h2><p>"Everything has a price. Some things have two."</p></div>
          </div>
          <div class="gold-pill">${icon('gold')} ${formatNum(save.gold)}</div>
        </div>
        <div class="screen-scroll">
          <div class="shop-grid">
            ${SHOP.map(entry => {
              const price = shopPrice(entry, stage);
              const active = entry.oneShot && blessing;
              const afford = save.gold >= price;
              return `<div class="panel shop-card">
                <div class="shop-ico">${icon(entry.icon)}</div>
                <div>
                  <div class="shop-name">${entry.name}</div>
                  <div class="shop-desc">${entry.desc}</div>
                </div>
                <div class="shop-side">
                  <div class="price">${icon('gold')} ${formatNum(price)}</div>
                  <button class="btn btn-primary btn-sm" data-action="shop-buy" data-id="${entry.id}" ${(!afford || active) ? 'disabled' : ''}>${active ? 'Active' : afford ? 'Buy' : 'Need gold'}</button>
                </div>
              </div>`;
            }).join('')}
          </div>
          <div class="shop-note">Caches draw from anywhere in the armory. Their rarity pool is based on your deepest cleared stage (tier ${tier}). The Ember Offering lasts one run and is consumed when that run ends.</div>
          <div class="panel empty-note" style="margin-top:12px">${icon('info')} Gold is earned from every kill, boss, and stage clear. Replaying stages is the fastest reliable income.</div>
        </div>
      </div>`;
    this.showScreen('shop');
    this.app.screen = 'shop';
  }

  slotPicker(entryId) {
    const entry = SHOP.find(s => s.id === entryId);
    this.openModal(`
      <div class="modal-head"><div><h3>${entry.name}</h3><p>Choose a slot to draw from.</p></div><button class="icon-btn modal-close" data-action="close">${icon('close')}</button></div>
      <div class="modal-body">
        <div class="slot-picker">
          ${SLOTS.map(slot => `<button class="slot-pick" data-action="pick-slot" data-id="${entryId}" data-slot="${slot.id}">${icon(slot.icon)}${slot.name}</button>`).join('')}
        </div>
      </div>`);
  }

  /* ---------------------------------------------------------- battle HUD */
  renderBattle(battle, save) {
    this.battle = battle;
    const cls = CLASSES[battle.classId];
    const char = save.character;
    this.root.innerHTML = `
      <div id="screen-battle" class="screen active">
        <div class="hud">
          <div class="hud-top">
            <div class="hud-left">
              <div class="hud-name"><b>${esc(char.name)}</b><span class="lvl-tag">Lv ${char.level}</span><span>${cls.name}</span></div>
              <div class="hp-wrap">
                <div class="hp-bar"><i class="hp-fill" id="hp-fill"></i><span class="hp-text" id="hp-text"></span></div>
              </div>
              <div class="status-row" id="status-row"></div>
            </div>
            <div class="hud-center"><div class="wave-pill" id="wave-pill">Wave 1</div></div>
            <div class="hud-right">
              <div class="gold-live">${icon('gold')} <span id="live-gold">0</span></div>
              <button class="icon-btn" data-action="pause" aria-label="Pause">${icon('pause')}</button>
            </div>
          </div>
          <div class="boss-wrap" id="boss-wrap">
            <div class="boss-title"><b id="boss-name">Boss</b><span id="boss-phase">Phase I</span></div>
            <div class="boss-bar" id="boss-bar"><i class="boss-fill" id="boss-fill"></i></div>
          </div>
          <div class="joystick" id="joystick"><div class="ring"></div><div class="knob" id="knob"></div></div>
          <div class="tilt-badge" id="tilt-badge" style="display:none">${icon('motion')} Tilt active</div>
          <div class="skills">
            ${cls.skills.map((s, i) => `
              <button class="skill-btn ready" data-action="skill" data-index="${i}" aria-label="${s.name}">
                <span class="s-key">${i + 1}</span>
                <span class="s-icon">${icon(s.icon)}</span>
                <span class="cd-shade" id="cd-${i}"></span>
                <span class="s-cdtext" id="cdtext-${i}"></span>
              </button>`).join('')}
          </div>
          <div class="battle-tip" id="battle-tip">Drag the left side to move · tap skills on the right · attacks fire automatically</div>
          <div class="banner" id="banner"><div class="b-sub" id="banner-sub"></div><div class="b-main" id="banner-main"></div><div class="b-line"></div></div>
        </div>
      </div>`;
    this.el = {
      hpFill: document.getElementById('hp-fill'),
      hpText: document.getElementById('hp-text'),
      status: document.getElementById('status-row'),
      wave: document.getElementById('wave-pill'),
      gold: document.getElementById('live-gold'),
      bossWrap: document.getElementById('boss-wrap'),
      bossName: document.getElementById('boss-name'),
      bossPhase: document.getElementById('boss-phase'),
      bossFill: document.getElementById('boss-fill'),
      bossBar: document.getElementById('boss-bar'),
      joy: document.getElementById('joystick'),
      knob: document.getElementById('knob'),
      tip: document.getElementById('battle-tip'),
      tilt: document.getElementById('tilt-badge'),
      banner: document.getElementById('banner'),
      bannerSub: document.getElementById('banner-sub'),
      bannerMain: document.getElementById('banner-main'),
      skills: [...document.querySelectorAll('.skill-btn')],
      cdShades: [0, 1, 2].map(i => document.getElementById(`cd-${i}`)),
      cdTexts: [0, 1, 2].map(i => document.getElementById(`cdtext-${i}`)),
    };
    this._statusCache = '';
    this.showScreen('battle');
    this.app.screen = 'battle';
    if (this.tipTimer) clearTimeout(this.tipTimer);
    this.tipTimer = setTimeout(() => this.el?.tip?.classList.add('hide'), 7000);
  }

  updateHUD(battle, input) {
    const el = this.el;
    if (!el || this.app.screen !== 'battle') return;
    const p = battle.player;
    const hp = Math.max(0, p.hp / p.maxHp);
    el.hpFill.style.width = (hp * 100) + '%';
    el.hpText.textContent = `${Math.ceil(p.hp)} / ${Math.ceil(p.maxHp)}`;
    el.gold.textContent = formatNum(battle.gold);
    el.wave.textContent = battle.boss ? 'Boss' : `Wave ${Math.min(battle.waveIndex + 1, battle.waves.length)} / ${battle.waves.length}`;

    const statuses = [];
    if (p.slow > 0) statuses.push(['slow', 'SLOW']);
    if (p.burn) statuses.push(['burn', 'BURN']);
    for (const b of p.buffs) if (b.id === 'banner') statuses.push(['buff', 'BANNER']);
    if (p.guaranteed > 0) statuses.push(['buff', `CRIT ×${p.guaranteed}`]);
    const cache = statuses.map(s => s[1]).join('|');
    if (cache !== this._statusCache) {
      this._statusCache = cache;
      el.status.innerHTML = statuses.map(([c, t]) => `<span class="status-icon ${c}">${t}</span>`).join('');
    }

    if (battle.boss) {
      el.bossWrap.classList.add('show');
      el.bossName.textContent = battle.boss.name;
      el.bossPhase.textContent = battle.boss.phase === 2 ? 'Phase II · Enraged' : 'Phase I';
      el.bossBar.classList.toggle('phase2', battle.boss.phase === 2);
      el.bossFill.style.width = Math.max(0, (battle.boss.hp / battle.boss.maxHp) * 100) + '%';
    } else {
      el.bossWrap.classList.remove('show');
    }

    for (let i = 0; i < 3; i++) {
      const cd = battle.cooldowns[i];
      const max = battle.skillDefs[i]?.cd || 1;
      el.cdShades[i].style.setProperty('--p', String(Math.max(0, Math.min(1, cd / max))));
      el.cdTexts[i].textContent = cd > 0 ? (cd >= 1 ? Math.ceil(cd) : cd.toFixed(1)) : '';
      el.skills[i].classList.toggle('ready', cd <= 0);
    }

    if (input) {
      if (input.joy.active) {
        el.joy.style.left = (input.joy.ox - 59) + 'px';
        el.joy.style.top = (input.joy.oy - 59) + 'px';
        el.joy.style.bottom = 'auto';
        el.joy.classList.add('active');
        el.knob.style.transform = `translate(${input.joy.dx * 34}px, ${input.joy.dy * 34}px)`;
      } else {
        el.joy.classList.remove('active');
        el.joy.style.left = '';
        el.joy.style.top = '';
        el.joy.style.bottom = '';
        el.knob.style.transform = '';
      }
      el.tilt.style.display = input.tilt.enabled ? 'flex' : 'none';
    }
  }

  showBanner(sub, main, boss = false) {
    const el = this.el;
    if (!el?.banner) return;
    el.bannerSub.textContent = sub;
    el.bannerMain.textContent = main;
    el.banner.classList.toggle('boss', !!boss);
    el.banner.classList.remove('show');
    void el.banner.offsetWidth;
    el.banner.classList.add('show');
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => el.banner?.classList.remove('show'), 2300);
  }

  /* ---------------------------------------------------------- result */
  renderResult(result, meta = {}) {
    const s = result.stage;
    const st = meta.stars ?? 0;
    const grouped = new Map();
    for (const it of result.loot || []) {
      const k = it.slot + ':' + it.rarity;
      if (!grouped.has(k)) grouped.set(k, { ...it, count: 0, isNew: false });
      const row = grouped.get(k);
      row.count++;
      row.isNew = row.isNew || !!it.isNew;
    }
    const loot = [...grouped.values()].sort((a, b) => RARITY_INDEX[b.rarity] - RARITY_INDEX[a.rarity]);
    const nextId = meta.nextId;
    this.root.innerHTML = `
      <div id="screen-result" class="screen">
        <div class="result-wrap">
          <div class="result-head">
            <div class="r-eyebrow">${result.win ? (s.rift ? `Rift ${s.depth}` : 'Stage cleared') : 'The ember gutters'}</div>
            <h2 class="${result.win ? '' : 'lost'}">${result.win ? (s.rift ? 'Descent Complete' : 'Victory') : 'Defeated'}</h2>
            <div class="result-stars">${[1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}" style="animation-delay:${i * 0.12}s">★</span>`).join('')}</div>
          </div>
          <div class="result-summary">
            <div class="rs"><span class="k">Time</span><span class="v">${Math.floor(result.time / 60)}:${String(Math.floor(result.time % 60)).padStart(2, '0')}</span></div>
            <div class="rs"><span class="k">Slain</span><span class="v">${result.kills}</span></div>
            <div class="rs"><span class="k">Gold</span><span class="v">${formatNum(result.win ? (result.gold || 0) + (meta.firstClearGold || 0) : Math.floor((result.gold || 0) * 0.25))}</span></div>
          </div>
          ${meta.levelUps ? `<div class="levelup-note">${icon('sparkle')} Level up ×${meta.levelUps} — your stats have grown.</div>` : ''}
          <div class="result-loot">
            ${loot.length ? `<div class="eyebrow" style="margin:0 2px 7px">${result.win ? 'Spoils' : 'Lost haul'}</div><div class="loot-grid">${loot.map(it => {
              const def = itemDef(it.slot, it.rarity);
              return `<div class="loot-card" style="--rarity:${rarity(it.rarity).color}">
                <span class="lc-icon">${icon(SLOT_BY_ID[it.slot].icon)}</span>
                <span><span class="lc-name">${esc(def.name)}${it.count > 1 ? ` ×${it.count}` : ''}</span><span class="lc-meta">${SLOT_BY_ID[it.slot].name} · ${rarity(it.rarity).name}</span></span>
                ${it.isNew ? '<span class="lc-new">New</span>' : ''}
              </div>`;
            }).join('')}</div>` : `<div class="empty-note">${result.win ? 'No equipment recovered this time.' : 'Your pack was lost in the dark.'}</div>`}
          </div>
          <div class="result-foot">
            ${result.win
              ? `<button class="btn btn-ghost" data-action="result-camp">Camp</button>${nextId ? `<button class="btn btn-primary" data-action="next-stage">${s.rift ? 'Descend Deeper' : 'Next Stage'} ${icon('arrow')}</button>` : `<button class="btn btn-primary" data-action="result-continue">Continue ${icon('arrow')}</button>`}`
              : `<button class="btn btn-ghost" data-action="result-camp">Camp</button><button class="btn btn-primary" data-action="retry">Try Again ${icon('arrow')}</button>`}
          </div>
        </div>
      </div>`;
    this.showScreen('result');
    this.app.screen = 'result';
  }

  /* ---------------------------------------------------------- sheets & modals */
  gearSheet(slotId) {
    const app = this.app;
    const save = app.save;
    const slot = SLOT_BY_ID[slotId];
    if (!slot) return;
    const inv = save.character.inventory[slotId] || {};
    const equipped = save.character.equipped[slotId];
    const rows = RARITIES.slice().reverse().map(r => ({ r, count: inv[r.id] || 0 })).filter(x => x.count > 0);
    const cur = equipped ? itemDef(slotId, equipped) : null;
    this.openModal(`
      <div class="modal-head">
        <div style="display:flex;gap:10px;align-items:center"><div class="skill-glyph">${icon(slot.icon)}</div><div><h3>${slot.name}</h3><p>${cur ? `${cur.name} · ${rarity(equipped).name}` : 'Nothing equipped'}</p></div></div>
        <button class="icon-btn modal-close" data-action="close">${icon('close')}</button>
      </div>
      <div class="modal-body">
        <div class="sheet-list">
          ${rows.length ? rows.map(({ r, count }) => {
            const def = itemDef(slotId, r.id);
            const isEq = equipped === r.id;
            const mergeable = count >= 4 && r.id !== 'divine';
            return `<div class="sheet-item ${isEq ? 'equipped' : ''}" style="--rarity:${r.color}">
              <span class="si-icon">${icon(slot.icon)}</span>
              <span>
                <span class="si-name">${esc(def.name)} ${isEq ? '<span class="chip gold" style="padding:1px 5px;font-size:7px">Equipped</span>' : ''}</span>
                <span class="si-meta"><span class="${RCLS[r.id]}">${r.name}</span> · ×${count}</span>
                <span class="si-stats">${statSummary(def.stats)}</span>
              </span>
              <span class="si-right">
                ${isEq ? `<button class="btn btn-sm" data-action="gear-unequip" data-slot="${slotId}">Remove</button>` : `<button class="btn btn-sm" data-action="gear-equip" data-slot="${slotId}" data-rarity="${r.id}">Equip</button>`}
                ${mergeable ? `<button class="btn btn-sm" data-action="merge" data-slot="${slotId}" data-rarity="${r.id}">${icon('forge')} Fuse 4</button>` : ''}
              </span>
            </div>`;
          }).join('') : '<div class="empty-note">No pieces for this slot yet.<br><b>Clear a stage or open a cache.</b></div>'}
        </div>
        <div class="item-compare">${cur ? `Equipped: <b>${esc(cur.name)}</b> — ${statSummary(cur.stats)}` : 'An empty slot contributes nothing. Equip the highest rarity you own, then work toward set bonuses.'}</div>
        <div class="modal-foot" style="padding:14px 0 0">
          <button class="btn" data-action="equip-best">${icon('sparkle')} Equip Best</button>
          <button class="btn btn-primary" data-action="close">Done</button>
        </div>
      </div>`, { dismiss: true });
  }

  stageSheet(stage) {
    if (!stage) return;
    const app = this.app;
    const save = app.save;
    const s = computeStats(save.character);
    const cleared = !stage.rift && save.progress.cleared[stage.id];
    const high = highestClearedStage(save.progress);
    const locked = !stage.rift && stage.id > high + 1;
    const enemies = new Set();
    for (const w of stage.waves) for (const [t] of (w.enemies || [])) enemies.add(t);
    const boss = stage.boss ? BOSSES[stage.boss] : null;
    const low = s.power < stage.rec * 0.8;
    const loot = stage.lootSlots.map(id => `<span class="chip">${icon(SLOT_BY_ID[id].icon)} ${SLOT_BY_ID[id].name}</span>`).join(' ');
    const biome = BIOMES[stage.biome];
    this.openModal(`
      <div class="modal-head">
        <div>
          <div class="eyebrow" style="color:${biome.accent}">${biome.name}${stage.rift ? ' · Endless' : ''}</div>
          <h3>${stage.name}</h3>
          <p>${stage.desc}</p>
        </div>
        <button class="icon-btn modal-close" data-action="close">${icon('close')}</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          <span class="chip ${s.power >= stage.rec ? 'gold' : ''}">${formatNum(s.power)} power</span>
          <span class="chip ${low ? 'danger' : ''}">Recommended ${formatNum(stage.rec)}</span>
          ${cleared ? `<span class="chip">${stars(cleared.stars)}</span>` : ''}
          ${stage.boss ? `<span class="chip" style="color:#ffb1a6">${icon('skull')} ${boss.name}</span>` : ''}
        </div>
        <div class="divider"></div>
        <div class="eyebrow" style="margin-bottom:7px">Enemies</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          ${[...enemies].map(t => `<span class="chip">${ENEMIES[t]?.name || t}</span>`).join('')}
          ${boss ? `<span class="chip" style="color:#ffb1a6">${boss.name}</span>` : ''}
        </div>
        <div class="eyebrow" style="margin-bottom:7px">Equipment drops</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px">${loot}</div>
        ${cleared ? '' : `<div class="item-compare">${icon('sparkle')} First clear grants bonus loot and gold.</div>`}
        ${low ? `<div class="item-compare" style="border-color:rgba(226,102,92,.3);color:#ffb0a8">This stage is tuned above your power. Improve your gear at the Forge or replay an earlier stage.</div>` : ''}
        <div class="modal-foot" style="padding:14px 0 0">
          <button class="btn btn-primary" data-action="embark" data-kind="${stage.rift ? 'rift' : 'stage'}" data-id="${stage.id}" data-depth="${stage.depth || ''}" ${locked ? 'disabled' : ''}>${locked ? icon('lock') + ' Locked' : `Embark ${icon('arrow')}`}</button>
        </div>
      </div>`);
  }

  pauseMenu(battle) {
    const stage = battle.stage;
    const mins = Math.floor(battle.time / 60);
    const secs = String(Math.floor(battle.time % 60)).padStart(2, '0');
    this.openModal(`
      <div class="modal-head">
        <div>
          <div class="eyebrow">${stage.rift ? `Rift ${stage.depth}` : `Stage ${stage.id}`}</div>
          <h3>Paused</h3>
          <p>${esc(stage.name)} · Wave ${Math.min(battle.waveIndex + 1, battle.waves.length)} / ${battle.waves.length}</p>
        </div>
        <button class="icon-btn modal-close" data-action="resume" aria-label="Resume">${icon('close')}</button>
      </div>
      <div class="modal-body">
        <div class="result-summary" style="margin-bottom:10px">
          <div class="rs"><span class="k">Time</span><span class="v">${mins}:${secs}</span></div>
          <div class="rs"><span class="k">Slain</span><span class="v">${battle.kills}</span></div>
          <div class="rs"><span class="k">Gold</span><span class="v">${formatNum(battle.gold)}</span></div>
        </div>
        <div class="item-compare">The Rift holds still while you rest. Equipment found in this run is only kept if you finish it.</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
          <button class="btn btn-primary btn-wide" data-action="resume">${icon('arrow')} Resume</button>
          <button class="btn btn-wide" data-action="settings">${icon('settings')} Settings</button>
          <button class="btn btn-danger btn-wide" data-action="abandon">Abandon Run</button>
        </div>
        <div class="shop-note" style="margin-top:12px">Touch: drag the left side to move, tap skills on the right. Keyboard: WASD, 1–3, Esc.</div>
      </div>`, { dismiss: false });
  }

  defeatModal({ stage, cost, gold, revives, maxRevives, canRevive }) {
    const left = Math.max(0, maxRevives - revives);
    this.openModal(`
      <div class="modal-head">
        <div>
          <div class="eyebrow" style="color:#e08c86">${stage.rift ? `Rift ${stage.depth}` : `Stage ${stage.id}`}</div>
          <h3>Your ember gutters</h3>
          <p>${esc(stage.name)}</p>
        </div>
      </div>
      <div class="modal-body">
        <p class="sub">The dark takes the equipment from this run. The gold you gathered can still be saved — or spend it to rise once more.</p>
        <div class="item-compare" style="border-color:rgba(226,102,92,.28);color:#ffb0a8">
          Gold carried: <b style="color:var(--gold-2)">${formatNum(gold)}</b> · Revives left: <b style="color:var(--gold-2)">${left} / ${maxRevives}</b>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
          <button class="btn btn-primary btn-wide" data-action="revive" ${canRevive ? '' : 'disabled'}>
            ${icon('flame')} Revive · ${icon('gold')} ${formatNum(cost)}
          </button>
          <button class="btn btn-ghost btn-wide" data-action="give-up">Return to Camp</button>
        </div>
        <div class="shop-note" style="margin-top:12px">${!canRevive && left > 0 ? 'You cannot afford this revive. Returning to camp keeps 25% of the run’s gold.' : left <= 0 ? 'No revives remain this run. Returning to camp keeps 25% of the run’s gold.' : 'Reviving restores all health and knocks nearby enemies back.'}</div>
      </div>`, { dismiss: false });
  }

  cacheResult(items, entry) {
    const sorted = [...items].sort((a, b) => (RARITY_INDEX[b.rarity] || 0) - (RARITY_INDEX[a.rarity] || 0));
    this.openModal(`
      <div class="modal-head">
        <div>
          <div class="eyebrow">${entry.name}</div>
          <h3>Cache Opened</h3>
          <p>${items.length} piece${items.length > 1 ? 's' : ''} recovered.</p>
        </div>
        <button class="icon-btn modal-close" data-action="close">${icon('close')}</button>
      </div>
      <div class="modal-body">
        <div class="loot-grid">
          ${sorted.map(it => {
            const def = itemDef(it.slot, it.rarity);
            return `<div class="loot-card" style="--rarity:${rarity(it.rarity).color}">
              <span class="lc-icon">${icon(SLOT_BY_ID[it.slot].icon)}</span>
              <span><span class="lc-name">${esc(def.name)}</span><span class="lc-meta">${SLOT_BY_ID[it.slot].name} · ${rarity(it.rarity).name}</span></span>
            </div>`;
          }).join('')}
        </div>
        <div class="modal-foot" style="padding:14px 0 0">
          <button class="btn btn-primary btn-wide" data-action="close">Done</button>
        </div>
      </div>`);
  }

  settings() {
    const app = this.app;
    const st = app.settings || app.save?.settings || { sound: true, volume: 0.65, shake: true, damageNumbers: true, tilt: false, reducedMotion: false };
    const tiltState = app.input.tilt;
    this.openModal(`
      <div class="modal-head"><div><h3>Settings</h3><p>Sound, motion, and comfort.</p></div><button class="icon-btn modal-close" data-action="close">${icon('close')}</button></div>
      <div class="modal-body">
        <div class="settings-row">
          <div><div class="sr-label">Sound</div><div class="sr-desc">Procedural music and effects.</div></div>
          <button class="switch ${st.sound ? 'on' : ''}" data-action="toggle" data-key="sound" aria-label="Toggle sound"></button>
        </div>
        <div class="settings-row">
          <div><div class="sr-label">Volume</div><div class="sr-desc">${Math.round(st.volume * 100)}%</div></div>
          <input id="volume" class="volume-slider" type="range" min="0" max="1" step="0.05" value="${st.volume}" aria-label="Volume">
        </div>
        <div class="settings-row">
          <div><div class="sr-label">Screen shake</div><div class="sr-desc">Impact feedback on hits and bosses.</div></div>
          <button class="switch ${st.shake ? 'on' : ''}" data-action="toggle" data-key="shake" aria-label="Toggle screen shake"></button>
        </div>
        <div class="settings-row">
          <div><div class="sr-label">Damage numbers</div><div class="sr-desc">Floating combat text.</div></div>
          <button class="switch ${st.damageNumbers ? 'on' : ''}" data-action="toggle" data-key="damageNumbers" aria-label="Toggle damage numbers"></button>
        </div>
        <div class="settings-row">
          <div><div class="sr-label">Reduced motion</div><div class="sr-desc">Tones down pulses and transitions.</div></div>
          <button class="switch ${st.reducedMotion ? 'on' : ''}" data-action="toggle" data-key="reducedMotion" aria-label="Toggle reduced motion"></button>
        </div>
        <div class="divider"></div>
        <div class="settings-row">
          <div><div class="sr-label">Tilt to move ${icon('motion')}</div><div class="sr-desc">Optional accelerometer movement. Uses motion permission on iOS. Joystick remains available when tilt is off.</div></div>
          <button class="switch ${tiltState.enabled ? 'on' : ''}" data-action="tilt-toggle" aria-label="Toggle tilt"></button>
        </div>
        ${tiltState.enabled ? `<div class="settings-row"><div><div class="sr-label">Calibrate tilt</div><div class="sr-desc">Hold your device in a comfortable neutral position, then tap.</div></div><button class="btn btn-sm" data-action="tilt-calibrate">Calibrate</button></div>` : ''}
        <div class="settings-actions">
          <button class="btn btn-danger" data-action="reset">${icon('reset')} Reset Journey</button>
        </div>
        <div class="shop-note" style="margin-top:12px">Emberbound v3 · Saved automatically on this device.</div>
      </div>`);
  }

  help() {
    const cls = Object.values(CLASSES);
    this.openModal(`
      <div class="modal-head"><div><h3>How to Play</h3><p>A pocket action RPG about loot, ascension, and bosses.</p></div><button class="icon-btn modal-close" data-action="close">${icon('close')}</button></div>
      <div class="modal-body">
        <div class="eyebrow" style="margin-bottom:6px">Controls</div>
        <div class="item-compare" style="margin-top:0">Drag the left side of the screen to move. Tap the three skill buttons on the right. Basic attacks fire automatically at the nearest enemy in range. Keyboard: WASD / arrows, 1-3 skills, Esc pause. Optional tilt movement lives in Settings.</div>
        <div class="eyebrow" style="margin:12px 0 6px">The loop</div>
        <div class="item-compare" style="margin-top:0">Clear stages → collect equipment → fuse 4 identical pieces into the next rarity → equip stronger gear → challenge the next boss. Death forfeits the run's loot; gold earned stays with you.</div>
        <div class="eyebrow" style="margin:12px 0 6px">Three paths</div>
        <div class="sheet-list">
          ${cls.map(c => `<div class="sheet-item"><span class="si-icon" style="color:${c.color}">${icon(c.glyph)}</span><span><span class="si-name">${c.name} — ${c.epithet}</span><span class="si-meta">${c.role}</span><span class="si-stats">${c.passive.name}: ${c.passive.desc}</span></span></div>`).join('')}
        </div>
        <div class="eyebrow" style="margin:12px 0 6px">Six rarities</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">${RARITIES.map(r => `<span class="chip ${RCLS[r.id]}">${r.name}</span>`).join('')}</div>
        <div class="shop-note">4 Commons → 1 Rare · 4 Rares → 1 Epic · 4 Epics → 1 Legendary · 4 Legendaries → 1 Mythic · 4 Mythics → 1 Divine. Divine is a long pursuit, by design.</div>
      </div>`, { dismiss: true });
  }

  tutorial() {
    this.openModal(`
      <div class="modal-head"><div><div class="eyebrow">First descent</div><h3>Welcome to the Rift</h3></div></div>
      <div class="modal-body">
        <p class="sub">You are a <b class="gold">${CLASSES[this.app.save.character.classId].name}</b>. Your basic attack is automatic — focus on spacing and skills.</p>
        <div class="sheet-list" style="margin-top:12px">
          <div class="sheet-item"><span class="si-icon">${icon('motion')}</span><span><span class="si-name">Move</span><span class="si-meta">Drag anywhere on the left side. Tilt is optional.</span></span></div>
          <div class="sheet-item"><span class="si-icon">${icon('whirlwind')}</span><span><span class="si-name">Three skills</span><span class="si-meta">Tap the buttons on the right. Cooldowns are visible on the ring.</span></span></div>
          <div class="sheet-item"><span class="si-icon">${icon('gold')}</span><span><span class="si-name">Loot everything</span><span class="si-meta">Rarer gear falls from later stages and bosses. Fuse duplicates at the Forge.</span></span></div>
        </div>
        <div class="modal-foot" style="padding:14px 0 0"><button class="btn btn-primary btn-wide" data-action="dismiss-tutorial">Enter the Rift</button></div>
      </div>`, { dismiss: false });
  }

  openModal(html, opts = {}) {
    this.modalOpen = true;
    this.modalRoot.innerHTML = `<div class="modal-backdrop" data-dismiss="${opts.dismiss === false ? 'false' : 'true'}"><div class="modal panel">${html}</div></div>`;
    this.app.onModalOpen?.();
  }

  closeModal() {
    this.modalRoot.innerHTML = '';
    this.modalOpen = false;
    this.app.onModalClose?.();
  }

  confirm(title, body, label, fn) {
    this._confirmFn = fn;
    this.openModal(`
      <div class="modal-head"><div><h3>${title}</h3><p>${body}</p></div><button class="icon-btn modal-close" data-action="close">${icon('close')}</button></div>
      <div class="modal-body">
        <div class="modal-foot" style="padding:0">
          <button class="btn" data-action="close">Cancel</button>
          <button class="btn btn-danger" data-action="confirm">${label}</button>
        </div>
      </div>`);
  }

  /* ---------------------------------------------------------- feedback */
  toast(opts) {
    const { item, text, rarity: rar, iconName } = opts || {};
    this.toastCount++;
    const el = document.createElement('div');
    el.className = 'toast';
    const r = item ? item.rarity : (rar || 'common');
    el.style.setProperty('--rarity', rarity(r).color);
    if (item) {
      const def = itemDef(item.slot, item.rarity);
      el.innerHTML = `${icon(SLOT_BY_ID[item.slot].icon)} <b>${esc(def.name)}</b> <span class="tcount">${rarity(r).name}</span>`;
    } else {
      el.innerHTML = `${iconName ? icon(iconName) : '<span class="tdot"></span>'} <span>${text}</span>`;
    }
    this.toastsEl.appendChild(el);
    while (this.toastsEl.children.length > 4) this.toastsEl.removeChild(this.toastsEl.firstChild);
    setTimeout(() => el.remove(), 2600);
  }

  clearToasts() { this.toastsEl.innerHTML = ''; }

  hideBattle() {
    this.el = null;
    this.clearToasts();
    if (this.tipTimer) clearTimeout(this.tipTimer);
  }
}

