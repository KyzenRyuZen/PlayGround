/* ==========================================================================
   EBONSPIRE · application entry point
   Boot, splash, hash router, chrome, battle mount, global delegation & audio.
   ========================================================================== */

import { Engine } from './core/engine.js';
import { GAME } from './config.js';
import { CLASSES } from './data/classes.js';
import { MATERIALS, RARITY_BY_ID } from './data/items.js';
import { findItem } from './core/items.js';
import { stageCoords } from './data/monsters.js';
import { SCREENS, DEFAULT_ROUTE } from './ui/screens/index.js';
import {
  renderSidebar, renderTopbar, renderBottomNav, updateTopbar, updateSidebar,
  updateNavBadges, setActiveRoute, openDrawer, closeDrawer, ROUTE_META,
} from './ui/shell.js';
import { mountBattle } from './ui/battle.js';
import { showItemModal, toast, openModal, closeModal, itemIcon, esc, fmt, chip, duration } from './ui/components.js';
import { icon } from './ui/icons.js';
import { showSplash, hideSplash } from './ui/splash.js';
import { playCue, unlockAudio } from './ui/audio.js';

const app = document.getElementById('app');
const sidebarEl = document.getElementById('sidebar');
const topbarEl = document.getElementById('topbar');
const bottomEl = document.getElementById('bottomnav');
const battleEl = document.getElementById('battle-panel');
const scrollEl = document.getElementById('screen-scroll');
const screenEl = document.getElementById('screen');

let battleHandle = null;
let screenCleanup = null;
let chromeTimer = null;
let gameStarted = false;
let currentRoute = DEFAULT_ROUTE;
let routeParams = {};
let lastProcessedImport = 0;

/* --------------------------------------------------------------------------
   Routing
   -------------------------------------------------------------------------- */
function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  if (!raw) return { route: DEFAULT_ROUTE, params: {} };
  const [path, query = ''] = raw.split('?');
  const route = SCREENS[path] ? path : DEFAULT_ROUTE;
  const params = {};
  for (const [key, value] of new URLSearchParams(query)) params[key] = value;
  return { route, params };
}

function hashFor(route, params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const q = query.toString();
  return `#/${route}${q ? `?${q}` : ''}`;
}

function replaceHash(route, params) {
  try { history.replaceState(null, '', hashFor(route, params)); } catch {}
}

function syncRouteFromHash({ initial = false } = {}) {
  const parsed = parseHash();
  const changed = parsed.route !== currentRoute;
  currentRoute = parsed.route;
  routeParams = parsed.params;
  if (changed && !initial) closeModal();
  renderRoute({ keepScroll: !changed && !initial });
}

function renderRoute({ keepScroll = false } = {}) {
  if (!Engine.state) return;
  const prevScroll = scrollEl.scrollTop;
  if (typeof screenCleanup === 'function') {
    try { screenCleanup(); } catch {}
  }
  screenCleanup = null;
  const screen = SCREENS[currentRoute] || SCREENS[DEFAULT_ROUTE];
  const ctx = buildContext();
  try {
    screenEl.innerHTML = screen.render(ctx);
    screenCleanup = screen.mount?.(screenEl, ctx) || null;
  } catch (err) {
    console.error('Screen render failed', currentRoute, err);
    screenEl.innerHTML = `<div class="panel pad"><span class="eyebrow">Something broke</span><h2>This page hit a snag.</h2><p class="muted">${esc(err.message || 'Unknown error')}</p><button class="btn" data-nav="home" type="button">Return to the hunt</button></div>`;
  }
  scrollEl.scrollTop = keepScroll ? prevScroll : 0;
  setActiveRoute(currentRoute);
  updateTopbar(Engine.state, Engine.getStats());
  updateNavBadges();
}

function buildContext() {
  return {
    get state() { return Engine.state; },
    get stats() { return Engine.getStats(); },
    route: currentRoute,
    get params() { return routeParams; },
    refresh(patch) {
      if (patch && typeof patch === 'object') {
        routeParams = { ...routeParams, ...patch };
        for (const [key, value] of Object.entries(routeParams)) {
          if (value === undefined || value === null || value === '') delete routeParams[key];
        }
        replaceHash(currentRoute, routeParams);
      }
      renderRoute({ keepScroll: true });
      refreshChrome();
    },
    navigate(route, params = {}) {
      navigate(route, params);
    },
    toast,
  };
}

function navigate(route, params = {}) {
  const target = SCREENS[route] ? route : DEFAULT_ROUTE;
  closeDrawer();
  closeModal();
  const next = hashFor(target, params);
  if (location.hash === next) syncRouteFromHash();
  else location.hash = next;
}

/* --------------------------------------------------------------------------
   Chrome & battle
   -------------------------------------------------------------------------- */
function refreshChrome() {
  if (!Engine.state) return;
  const stats = Engine.getStats();
  updateTopbar(Engine.state, stats);
  updateSidebar(Engine.state, stats);
  updateNavBadges();
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  hideSplash();
  app.classList.remove('is-booting');
  const state = Engine.state;
  const stats = Engine.getStats();
  renderSidebar(sidebarEl, state, stats);
  renderTopbar(topbarEl, state, stats);
  renderBottomNav(bottomEl);
  if (!battleHandle) {
    battleHandle = mountBattle(battleEl, {
      toast,
      navigate: (route, params) => navigate(route, params),
    });
  }
  window.addEventListener('hashchange', () => syncRouteFromHash());
  Engine.startLoop();
  syncRouteFromHash({ initial: true });
  if (chromeTimer) clearInterval(chromeTimer);
  chromeTimer = setInterval(refreshChrome, 1200);
  if (Engine.offlineReport) {
    const report = Engine.offlineReport;
    Engine.offlineReport = null;
    setTimeout(() => showOfflineReport(report), 500);
  }
  if (!state.seen?.intro) {
    state.seen = { ...(state.seen || {}), intro: true };
    toast(`${state.hero.name} the ${CLASSES[state.hero.classId].name} enters the vale.`, 'success');
    Engine.save(true);
  }
}

/* --------------------------------------------------------------------------
   Offline report
   -------------------------------------------------------------------------- */
function showOfflineReport(report) {
  if (!report) return;
  const materials = Object.entries(report.materials || {}).filter(([, amount]) => amount > 0);
  openModal({
    title: 'While you were away',
    eyebrow: 'Offline progress',
    body: `<div class="offline-rewards">
      <div class="offline-head">
        <div class="moon">${icon('moon')}</div>
        <div class="offline-time">${duration(report.seconds * 1000)}</div>
        <div class="muted" style="font-size:9px">The vale kept fighting at ${Math.round((report.efficiency || 0) * 100)}% efficiency.</div>
      </div>
      <div class="offline-grid">
        <div class="offline-stat"><span>Monsters</span><b>${fmt(report.kills)}</b></div>
        <div class="offline-stat"><span>Gold</span><b class="gold">${fmt(report.gold)}</b></div>
        <div class="offline-stat"><span>Experience</span><b>${fmt(report.xp)}</b></div>
      </div>
      ${report.levels ? `<div class="panel pad" style="background:rgba(201,164,95,.06);border-color:rgba(201,164,95,.25)">${icon('level')} <b>+${report.levels} levels</b> · now level ${report.toLevel}</div>` : ''}
      ${report.items?.length ? `<div><div class="eyebrow" style="margin-bottom:5px">Relics recovered</div><div class="offline-loot">${report.items.slice(0, 6).map(item => {
        const rar = RARITY_BY_ID[item.rarity] || RARITY_BY_ID.common;
        return `<button class="item-card r-${rar.id}" data-item-open="${item.id}" type="button">${itemIcon(item, 'sm')}<div class="item-meta"><div class="name" style="color:${rar.color}">${esc(item.name)}</div><div class="sub">${rar.name} · iLvl ${item.ilvl}</div></div><div class="score">${fmt(item.ilvl)}</div></button>`;
      }).join('')}</div></div>` : ''}
      ${materials.length ? `<div><div class="eyebrow" style="margin-bottom:5px">Materials</div><div class="material-row">${materials.map(([key, amount]) => chip(`${MATERIALS[key]?.name || key} ×${fmt(amount)}`, '', MATERIALS[key]?.icon || 'gem')).join('')}</div></div>` : ''}
      ${report.autoSoldCount ? `<div class="offline-note">${fmt(report.autoSoldCount)} lesser relics were auto-sold for gold.</div>` : ''}
      <div class="offline-note">Offline progress is capped at ${GAME.offlineCapHours} hours. Come back often.</div>
    </div>`,
    footer: `<button class="btn" data-modal-close type="button">${icon('play')} Return to the hunt</button>`,
  });
}

/* --------------------------------------------------------------------------
   Engine event wiring
   -------------------------------------------------------------------------- */
const TOAST_CUES = {
  success: 'level', loot: 'loot', gold: 'coin', danger: 'danger', forge: 'forge',
  boss: 'victory', clear: 'victory', level: 'level',
};

function wireEngine() {
  Engine.on('toast', payload => {
    if (!payload) return;
    toast(payload.message, payload.type || 'info');
    playCue(TOAST_CUES[payload.type] || 'ui');
  });

  Engine.on('levelup', () => { playCue('level'); refreshChrome(); });
  Engine.on('stageClear', () => { playCue('victory'); refreshChrome(); });
  Engine.on('dungeonClear', () => { playCue('victory'); refreshChrome(); });
  Engine.on('heroDown', () => playCue('danger'));
  Engine.on('coinsGranted', () => { playCue('coin'); refreshChrome(); });
  Engine.on('shopPurchase', () => refreshChrome());
  Engine.on('equipmentChanged', () => {
    refreshChrome();
    if (currentRoute === 'equipment' || currentRoute === 'inventory' || currentRoute === 'character') renderRoute({ keepScroll: true });
  });
  Engine.on('freeChest', () => refreshChrome());
  Engine.on('dailyClaimed', () => refreshChrome());
  Engine.on('milestoneClaimed', () => refreshChrome());
  Engine.on('imported', state => {
    lastProcessedImport = state?.createdAt || Date.now();
    renderSidebar(sidebarEl, state, Engine.getStats());
    renderTopbar(topbarEl, state, Engine.getStats());
    renderBottomNav(bottomEl);
    renderRoute({ keepScroll: false });
  });
  Engine.on('newHero', state => {
    renderSidebar(sidebarEl, state, Engine.getStats());
    renderTopbar(topbarEl, state, Engine.getStats());
  });
  Engine.on('heartbeat', () => {
    if (!gameStarted) return;
    refreshChrome();
    if (currentRoute === 'home') {
      // Home has its own fast poll; nothing else needed here.
    }
  });
}

/* --------------------------------------------------------------------------
   Global delegation
   -------------------------------------------------------------------------- */
function wireDelegation() {
  document.addEventListener('click', e => {
    unlockAudio();
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      e.preventDefault();
      navigate(nav.dataset.nav);
      return;
    }
    if (e.target.closest('[data-open-drawer]')) {
      openDrawer(Engine.state, Engine.getStats());
      return;
    }
    if (e.target.closest('[data-close-drawer]')) {
      closeDrawer();
      return;
    }
    const itemBtn = e.target.closest('[data-item-open]');
    if (itemBtn) {
      const id = itemBtn.dataset.itemOpen;
      const item = findItem(Engine.state, id)?.item || Engine.recentDrops.find(i => i.id === id);
      if (!item) return;
      showItemModal(item, {
        onChange: () => { refreshChrome(); renderRoute({ keepScroll: true }); },
        onNavigate: (route, params) => navigate(route, params),
      });
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });

  document.addEventListener('pointerdown', unlockAudio, { once: true });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
function boot() {
  wireEngine();
  wireDelegation();

  let result = { loaded: false, state: null };
  try {
    result = Engine.boot();
  } catch (err) {
    console.error('Boot failed', err);
    toast('Could not read the local save. Starting fresh.', 'danger');
  }

  if (result.loaded) {
    Engine.stopLoop();
    app.classList.add('is-booting');
    showSplash(enterFromSplash);
  } else {
    app.classList.add('is-booting');
    showSplash(enterFromSplash);
  }
}

function enterFromSplash(info) {
  if (!Engine.state) return;
  if (Engine.state.hero) {
    Engine.state.seen = { ...(Engine.state.seen || {}), intro: true };
  }
  startGame();
}

/* Warm the module graph, then boot. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();

/* Expose a small debugging surface without leaking internals into gameplay. */
if (typeof window !== 'undefined') {
  window.__ebonspire = {
    Engine,
    route: () => ({ route: currentRoute, params: routeParams }),
    navigate,
    version: GAME.version,
  };
}
