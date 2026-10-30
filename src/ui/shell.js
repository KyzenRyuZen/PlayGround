/* ==========================================================================
   EBONSPIRE · app shell
   Sidebar, topbar, mobile drawer, bottom navigation and hash routing metadata.
   ========================================================================== */

import { CLASSES } from '../data/classes.js';
import { xpToNext } from '../core/stats.js';
import { Engine } from '../core/engine.js';
import { GAME } from '../config.js';
import { esc, fmt, duration } from './components.js';
import { icon, NAV_ICONS } from './icons.js';
import { heroArt, logoSigil } from './sprites.js';

export const NAV_GROUPS = [
  {
    label: 'Hunt',
    items: [
      { id: 'home', label: 'Adventure' },
      { id: 'stages', label: 'World Map' },
      { id: 'dungeons', label: 'Dungeons' },
    ],
  },
  {
    label: 'Hero',
    items: [
      { id: 'character', label: 'Character' },
      { id: 'inventory', label: 'Satchel' },
      { id: 'equipment', label: 'Equipment' },
      { id: 'skills', label: 'Skills' },
      { id: 'companions', label: 'Companions' },
    ],
  },
  {
    label: 'Craft',
    items: [
      { id: 'forge', label: 'Blacksmith' },
      { id: 'fusion', label: 'Fusion' },
      { id: 'stones', label: 'Runestones' },
    ],
  },
  {
    label: 'Wardrobe',
    items: [
      { id: 'costumes', label: 'Costumes' },
      { id: 'shop', label: 'Premium Shop' },
    ],
  },
  {
    label: 'Chronicle',
    items: [
      { id: 'quests', label: 'Quests' },
      { id: 'settings', label: 'Settings' },
    ],
  },
];

export const ROUTE_META = {
  home: { eyebrow: 'The hunt', title: 'Adventure', crumb: 'Live hunt' },
  character: { eyebrow: 'Hero', title: 'Character', crumb: 'Attributes & power' },
  inventory: { eyebrow: 'Satchel', title: 'Inventory', crumb: 'Spoils of the hunt' },
  equipment: { eyebrow: 'Hero', title: 'Equipment', crumb: 'Nine relics of war' },
  skills: { eyebrow: 'Discipline', title: 'Skills', crumb: 'Class techniques' },
  companions: { eyebrow: 'Bonds', title: 'Companions', crumb: 'Pets, mounts & spirits' },
  stages: { eyebrow: 'World map', title: 'Stages', crumb: 'Six realms, one road' },
  dungeons: { eyebrow: 'Expeditions', title: 'Dungeons', crumb: 'Three attempts a day' },
  forge: { eyebrow: 'Craft', title: 'Blacksmith', crumb: 'Forge, enchant, temper' },
  fusion: { eyebrow: 'Craft', title: 'Fusion', crumb: 'Four become one' },
  stones: { eyebrow: 'Craft', title: 'Runestones', crumb: 'Sockets & ascension' },
  costumes: { eyebrow: 'Wardrobe', title: 'Costumes', crumb: 'Wear the legend' },
  shop: { eyebrow: 'Market', title: 'Premium Shop', crumb: 'Coins & conveniences' },
  quests: { eyebrow: 'Chronicle', title: 'Quests', crumb: 'Contracts & milestones' },
  settings: { eyebrow: 'Chronicle', title: 'Settings', crumb: 'Save & preferences' },
};

export const BOTTOM_NAV = ['home', 'stages', 'dungeons', 'forge', 'shop'];

export function navHTML() {
  return NAV_GROUPS.map(group => `<div class="nav-group">
    <div class="nav-group-label">${esc(group.label)}</div>
    ${group.items.map(item => `<button class="nav-item" data-nav="${item.id}" type="button">
      ${icon(NAV_ICONS[item.id] || 'spark')}
      <span>${esc(item.label)}</span>
      ${item.id === 'quests' ? '<span class="nav-badge hidden" data-badge="quests">0</span>' : ''}
    </button>`).join('')}
  </div>`).join('');
}

export function profileHTML(state, stats) {
  const cls = CLASSES[state.hero.classId] || CLASSES.warrior;
  const next = xpToNext(state.hero.level);
  const xpPct = state.hero.level >= GAME.maxHeroLevel ? 100 : Math.min(100, state.hero.xp / next * 100);
  return `<div class="profile-card">
    <div class="profile-top">
      <div class="avatar-ring"><div>${heroArt(state.hero.classId)}</div></div>
      <div style="min-width:0">
        <div class="profile-name">${esc(state.hero.name)}</div>
        <div class="profile-class" style="color:${cls.color}">${esc(cls.name)} · ${esc(cls.order)}</div>
      </div>
    </div>
    <div class="profile-level"><span>Level <b id="sidebar-level" style="color:var(--ivory)">${state.hero.level}</b></span><span id="sidebar-xp-text">${state.hero.level >= GAME.maxHeroLevel ? 'MAX' : `${fmt(state.hero.xp)} / ${fmt(next)}`}</span></div>
    <div class="bar xp thin" style="margin-top:6px"><span id="sidebar-xp" style="width:${xpPct.toFixed(1)}%"></span></div>
    <div class="profile-power">${icon('power')} <span id="sidebar-power">${fmt(stats?.power || 0)}</span> power</div>
  </div>`;
}

export function shellFrameHTML(state, stats) {
  return `<div class="brand">
    <div class="brand-mark">${logoSigil(42)}</div>
    <div>
      <div class="brand-name">EBONSPIRE</div>
      <div class="brand-sub">Riftbound Saga</div>
    </div>
  </div>
  ${profileHTML(state, stats)}
  <nav class="sidebar-nav" aria-label="Sections">${navHTML()}</nav>
  <div class="sidebar-footer">
    <div class="sidebar-foot-line"><span><span class="dot"></span>Autosaving</span><span>v${GAME.version}.0</span></div>
    <div class="sidebar-foot-line" style="margin-bottom:0"><span>Local-first save</span><span>${esc(stats?.className || '')}</span></div>
  </div>`;
}

export function renderSidebar(el, state, stats) {
  el.innerHTML = shellFrameHTML(state, stats);
}

export function topbarHTML() {
  return `<button class="icon-btn mobile-menu-btn" data-open-drawer type="button" aria-label="Open menu">${icon('menu')}</button>
    <div class="crumb">
      <span class="eyebrow" id="crumb-eyebrow">The hunt</span>
      <strong id="crumb-title">Adventure</strong>
    </div>
    <div class="resource-row">
      <div class="buff-row" id="topbar-buffs"></div>
      <span id="topbar-gold"></span>
      <span id="topbar-coins"></span>
      <button class="icon-btn" data-nav="settings" type="button" aria-label="Settings">${icon('settings')}</button>
    </div>`;
}

export function renderTopbar(el, state, stats) {
  el.innerHTML = topbarHTML();
  updateTopbar(state, stats);
}

export function renderBottomNav(el) {
  el.innerHTML = BOTTOM_NAV.map(id => {
    const meta = ROUTE_META[id];
    return `<button data-nav="${id}" type="button">
      ${icon(NAV_ICONS[id])}
      <span>${esc(meta?.title || id)}</span>
    </button>`;
  }).join('');
}

export function openDrawer(state, stats) {
  const root = document.getElementById('drawer-root');
  if (!root) return;
  root.innerHTML = `<div class="drawer-backdrop" data-close-drawer></div>
    <aside class="drawer" aria-label="Menu">
      <div class="drawer-head">
        <div class="brand" style="padding:0">
          <div class="brand-mark">${logoSigil(38)}</div>
          <div><div class="brand-name" style="font-size:15px">EBONSPIRE</div><div class="brand-sub">Riftbound Saga</div></div>
        </div>
        <button class="icon-btn" data-close-drawer type="button" aria-label="Close menu">${icon('close')}</button>
      </div>
      ${profileHTML(state, stats)}
      <nav class="sidebar-nav" aria-label="Mobile sections">${navHTML()}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-foot-line"><span><span class="dot"></span>Autosaving</span><span>v${GAME.version}.0</span></div>
      </div>
    </aside>`;
}

export function closeDrawer() {
  const root = document.getElementById('drawer-root');
  if (root) root.innerHTML = '';
}

export function setActiveRoute(route) {
  const meta = ROUTE_META[route] || ROUTE_META.home;
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === route);
  });
  const eyebrow = document.getElementById('crumb-eyebrow');
  const title = document.getElementById('crumb-title');
  if (eyebrow) eyebrow.textContent = meta.eyebrow;
  if (title) title.textContent = meta.title;
}

export function updateTopbar(state, stats) {
  if (!state) return;
  const goldEl = document.getElementById('topbar-gold');
  const coinEl = document.getElementById('topbar-coins');
  if (goldEl) goldEl.innerHTML = currencyPillHTML('gold', state.hero.gold);
  if (coinEl) coinEl.innerHTML = currencyPillHTML('coins', state.hero.premiumCoins);
  const buffs = document.getElementById('topbar-buffs');
  if (buffs) buffs.innerHTML = buffsHTML(state);
  updateSidebar(state, stats);
  updateNavBadges();
}

function currencyPillHTML(kind, amount) {
  const isGold = kind === 'gold';
  return `<button class="resource-pill ${isGold ? 'gold-pill' : 'coin-pill'}" data-nav="${isGold ? 'inventory' : 'shop'}" type="button" title="${isGold ? 'Gold' : 'Premium coins'}">
    ${icon(isGold ? 'coin' : 'premium')}<span>${fmt(amount)}</span>${isGold ? '' : '<span class="plus">+</span>'}
  </button>`;
}

function buffsHTML(state) {
  const now = Date.now();
  const b = state.hero.boosters || {};
  const chips = [];
  if (b.xpUntil > now) chips.push(`<span class="buff-chip">${icon('flask')} XP ×2 <b>${duration(b.xpUntil - now)}</b></span>`);
  if (b.lootUntil > now) chips.push(`<span class="buff-chip loot">${icon('charm')} Loot +60% <b>${duration(b.lootUntil - now)}</b></span>`);
  if (b.goldUntil > now) chips.push(`<span class="buff-chip">${icon('coin')} Gold +50% <b>${duration(b.goldUntil - now)}</b></span>`);
  if (b.membershipUntil > now) chips.push(`<span class="buff-chip member">${icon('crown')} Member <b>${duration(b.membershipUntil - now)}</b></span>`);
  return chips.join('');
}

export function updateSidebar(state, stats) {
  if (!state) return;
  const level = document.getElementById('sidebar-level');
  if (level) level.textContent = state.hero.level;
  const power = document.getElementById('sidebar-power');
  if (power) power.textContent = fmt(stats?.power || 0);
  const xp = document.getElementById('sidebar-xp');
  const next = xpToNext(state.hero.level);
  if (xp) xp.style.width = `${state.hero.level >= GAME.maxHeroLevel ? 100 : Math.min(100, state.hero.xp / next * 100).toFixed(1)}%`;
  const xpText = document.getElementById('sidebar-xp-text');
  if (xpText) xpText.textContent = state.hero.level >= GAME.maxHeroLevel ? 'MAX' : `${fmt(state.hero.xp)} / ${fmt(next)}`;
}

export function updateNavBadges() {
  if (!Engine.state) return;
  let claims = 0;
  try { claims = Engine.reportState().claims.total; } catch {}
  document.querySelectorAll('[data-badge="quests"]').forEach(el => {
    el.textContent = claims;
    el.classList.toggle('hidden', claims <= 0);
  });
  document.querySelectorAll('.bottom-nav [data-nav="quests"]').forEach(el => {
    el.classList.toggle('has-claims', claims > 0);
  });
}

export function refreshChrome() {
  if (!Engine.state) return;
  const stats = Engine.getStats();
  updateTopbar(Engine.state, stats);
}
