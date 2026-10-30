/* ==========================================================================
   Title screen and hero creation.
   ========================================================================== */

import { Engine } from '../core/engine.js';
import { GAME } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { REGIONS, stageCoords, stageKind } from '../data/monsters.js';
import { xpToNext } from '../core/stats.js';
import { esc, fmt, duration, chip } from './components.js';
import { icon } from './icons.js';
import { heroArt, logoSigil, regionArt, collectionArt } from './sprites.js';

const NAME_SUGGESTIONS = { warrior: 'Kaelen', mage: 'Ysera', archer: 'Riven' };

export function showSplash(onEnter) {
  const root = document.getElementById('splash-root');
  if (!root) return;
  const saved = Engine.state;
  let mode = saved ? 'title' : 'create';
  let classId = saved?.hero?.classId || 'warrior';
  let name = saved?.hero?.name || '';

  function draw() {
    root.innerHTML = mode === 'title' && saved ? titleHTML(saved) : createHTML();
    bind();
    root.querySelector('.splash')?.scrollTo?.(0, 0);
  }

  function titleHTML(state) {
    const hero = state.hero;
    const cls = CLASSES[hero.classId] || CLASSES.warrior;
    const coords = stageCoords(state.progress?.currentIndex || 1);
    const kind = stageKind(coords.stage);
    const power = state.stats?.bestPower || 0;
    const next = xpToNext(hero.level);
    const play = duration((state.playSeconds || 0) * 1000);
    return `<div class="splash">
      <div class="splash-bg">${regionArt(REGIONS[0])}</div>
      <div class="splash-fog"></div>
      <div class="splash-inner">
        <div class="splash-crest">${logoSigil(74)}</div>
        <h1 class="splash-title">EBONSPIRE</h1>
        <div class="splash-sub">Riftbound Saga</div>
        <div class="splash-ornament"><span></span></div>
        <p class="splash-tag">The vale remembers every hero who walked into it. <em>It is still waiting for one to walk back out.</em></p>

        <div class="continue-card">
          <div class="continue-art">${heroArt(hero.classId)}</div>
          <div class="continue-info">
            <div class="c-name">${esc(hero.name)}</div>
            <div class="c-sub">${esc(cls.name)} · ${esc(cls.order)} · Level ${hero.level}</div>
            <div class="continue-meta">
              <div class="cm"><span>Battle power</span><b>${fmt(Math.max(power, 0))}</b></div>
              <div class="cm"><span>Gold</span><b class="gold">${fmt(hero.gold)}</b></div>
              <div class="cm"><span>Coins</span><b class="violet">${fmt(hero.premiumCoins)}</b></div>
            </div>
            <div class="flex wrap" style="gap:5px;margin-bottom:11px">
              ${chip(coords.region.name, 'gold', 'map')}
              ${chip(`Stage ${coords.stage}${kind === 'boss' ? ' · boss' : kind === 'miniboss' ? ' · elite' : ''}`, kind === 'boss' ? 'red' : '', kind === 'boss' ? 'skull' : 'target')}
              ${chip(`Played ${play}`, '', 'clock')}
            </div>
            <div class="bar xp thin" style="margin-bottom:12px"><span style="width:${Math.min(100, hero.xp / next * 100).toFixed(1)}%"></span></div>
            <div class="continue-actions">
              <button class="btn start-btn" data-splash="continue" type="button">${icon('play')} Continue the hunt</button>
              <button class="btn ghost" data-splash="new" type="button">${icon('plus')} New hero</button>
              <button class="btn ghost" data-splash="delete" type="button" title="Delete this save">${icon('trash')}</button>
            </div>
            <div class="muted" style="font-size:8.5px;margin-top:8px">Autosaves locally. Offline progress is credited up to ${GAME.offlineCapHours} hours.</div>
          </div>
        </div>

        <div class="gift-strip">
          ${icon('gift')}
          <span>Every new chronicle begins with <b>${GAME.startingPremiumCoins} premium coins</b>, <b>${GAME.startingGold} gold</b>, a Mossling companion and starter gear.</span>
        </div>

        <div class="splash-foot">Local-first save · no account required · <b>v${GAME.version}.0</b></div>
      </div>
    </div>`;
  }

  function createHTML() {
    const cls = CLASSES[classId] || CLASSES.warrior;
    return `<div class="splash">
      <div class="splash-bg">${regionArt(REGIONS[0])}</div>
      <div class="splash-fog"></div>
      <div class="splash-inner">
        <div class="splash-crest">${logoSigil(66)}</div>
        <h1 class="splash-title" style="font-size:clamp(32px,5.4vw,56px)">EBONSPIRE</h1>
        <div class="splash-sub">Riftbound Saga</div>
        <div class="splash-ornament"><span></span></div>
        <p class="splash-tag">Three roads into the dark. One hero to hold the line. <em>Choose the shape of your stubbornness.</em></p>

        <div class="class-grid">
          ${Object.values(CLASSES).map(c => {
            const stats = c.stats;
            return `<button class="class-card ${c.id === classId ? 'selected' : ''}" data-splash-class="${c.id}" type="button" style="--class-glow:${c.glow};--class-color:${c.color}">
              <div class="class-art">${heroArt(c.id)}</div>
              <div class="class-role">${esc(c.order)}</div>
              <div class="class-name" style="color:${c.color}">${esc(c.name)}</div>
              <div class="class-lore">${esc(c.tagline)}</div>
              <div class="class-stats">
                <div class="class-stat"><span>STR</span><b>${stats.strength}</b></div>
                <div class="class-stat"><span>INT</span><b>${stats.intelligence}</b></div>
                <div class="class-stat"><span>DEX</span><b>${stats.dexterity}</b></div>
                <div class="class-stat"><span>VIT</span><b>${stats.vitality}</b></div>
              </div>
              <div class="class-skills">${c.skills.map(s => `<span class="class-skill" title="${esc(s.name)}">${icon(s.icon)}</span>`).join('')}</div>
            </button>`;
          }).join('')}
        </div>

        <div class="splash-name-row">
          <input class="input" id="splash-name" maxlength="18" autocomplete="off" spellcheck="false" placeholder="${esc(NAME_SUGGESTIONS[classId] || 'Kaelen')}" value="${esc(name)}">
          <button class="btn start-btn" data-splash="start" type="button">${icon('play')} Enter the vale</button>
          ${saved ? `<button class="btn ghost" data-splash="back" type="button">Back</button>` : ''}
        </div>
        ${saved ? `<div class="splash-note" style="color:var(--blood)">Starting a new chronicle will replace ${esc(saved.hero?.name || 'the current hero')} on this device.</div>` : ''}

        <div class="gift-strip">
          ${icon('gift')}
          <span><b>${esc(cls.name)}</b> · ${esc(cls.growthText)} · starting gift: <b>${GAME.startingPremiumCoins} coins</b>, <b>${GAME.startingGold} gold</b>, Mossling pet & starter gear.</span>
        </div>

        <div class="splash-note">${esc(cls.lore)}</div>
        <div class="splash-foot">Hand-built SVG art · local-first save · <b>v${GAME.version}.0</b></div>
      </div>
    </div>`;
  }

  function bind() {
    root.querySelectorAll('[data-splash-class]').forEach(btn => {
      btn.addEventListener('click', () => {
        classId = btn.dataset.splashClass;
        draw();
      });
    });

    const nameInput = root.querySelector('#splash-name');
    if (nameInput) {
      nameInput.addEventListener('input', () => { name = nameInput.value; });
      nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') start();
      });
    }

    root.querySelector('[data-splash="continue"]')?.addEventListener('click', () => onEnter?.({ mode: 'continue' }));
    root.querySelector('[data-splash="new"]')?.addEventListener('click', () => {
      mode = 'create';
      name = '';
      draw();
    });
    root.querySelector('[data-splash="back"]')?.addEventListener('click', () => {
      mode = 'title';
      draw();
    });
    root.querySelector('[data-splash="start"]')?.addEventListener('click', start);
    root.querySelector('[data-splash="delete"]')?.addEventListener('click', () => {
      const ok = window.confirm('Delete this chronicle permanently? This erases the local save.');
      if (!ok) return;
      try { localStorage.removeItem(GAME.saveKey); } catch {}
      Engine.state = null;
      Engine.stopLoop();
      mode = 'create';
      classId = 'warrior';
      name = '';
      draw();
    });
  }

  function start() {
    const safeName = (name || '').trim() || NAME_SUGGESTIONS[classId] || 'Kaelen';
    Engine.createHero(classId, safeName);
    onEnter?.({ mode: 'new' });
  }

  if (Engine.started) Engine.stopLoop();
  draw();
}

export function hideSplash() {
  const root = document.getElementById('splash-root');
  if (root) root.innerHTML = '';
}
