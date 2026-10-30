/* ==========================================================================
   EBONSPIRE · shared UI primitives
   ========================================================================== */

import { STAT_INFO } from '../config.js';
import { RARITY_BY_ID, THEMES, SLOTS, MATERIALS, RARITIES } from '../data/items.js';
import { statLabel, statSuffix } from '../core/stats.js';
import { itemTotalStats, itemScore, itemSellPrice, canEquipToClass } from '../core/items.js';
import { Engine } from '../core/engine.js';
import { icon } from './icons.js';
import { itemArt, slotArt, materialArt } from './sprites.js';

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmt(n) {
  const value = Number(n) || 0;
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e4) return `${(value / 1e3).toFixed(abs >= 1e5 ? 0 : 1)}K`;
  return Math.round(value).toLocaleString('en-US');
}
export function fmt1(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
export function clock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
export function duration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
}
export function pct(value, cap = 100) {
  return Math.max(0, Math.min(100, (Number(value) || 0) / cap * 100));
}
export function plural(n, singular, pluralForm = `${singular}s`) { return n === 1 ? singular : pluralForm; }

export function rarityOf(item) { return RARITY_BY_ID[item?.rarity] || RARITY_BY_ID.common; }
export function rarityClass(itemOrId) {
  const id = typeof itemOrId === 'string' ? itemOrId : itemOrId?.rarity;
  return `r-${id || 'common'}`;
}
export function themeColor(item) { return (THEMES[item?.theme] || THEMES.steel).color; }
export function elementColor(element) {
  return ({ fire: '#ff8a4c', ice: '#8bd6ff', poison: '#96e07a', shadow: '#c09bff', holy: '#ffe1a0', arcane: '#b49bff', physical: '#e8d9bd' })[element] || '#e8d9bd';
}

export function bar(value, max, cls = 'xp', options = {}) {
  const width = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
  return `<div class="bar ${cls} ${options.thin ? 'thin' : ''} ${options.large ? 'lg' : ''}" ${options.title ? `title="${esc(options.title)}"` : ''}><span style="width:${width.toFixed(2)}%"></span></div>`;
}

export function statLine(stat, value, sub = '') {
  const info = STAT_INFO[stat];
  const suffix = statSuffix(stat);
  return `<div class="stat-row"><span class="label">${esc(info?.label || statLabel(stat))}</span><span class="value">${fmt1(value)}${suffix}${sub ? ` <span class="sub">${sub}</span>` : ''}</span></div>`;
}

export function chip(text, kind = '', iconName = null) {
  return `<span class="pill ${kind}">${iconName ? icon(iconName) : ''}${esc(text)}</span>`;
}

export function itemIcon(item, size = '') {
  const color = themeColor(item);
  return `<div class="item-icon ${size} ${rarityClass(item)}" style="--rarity:${rarityOf(item).color}">
    ${itemArt(item, 48, color)}
    ${item?.upgrade ? `<span class="upgrade-tag">+${item.upgrade}</span>` : ''}
  </div>`;
}

export function itemCard(item, opts = {}) {
  const rar = rarityOf(item);
  const slot = SLOTS[item.slot]?.label || item.slot;
  return `<button class="item-card ${rarityClass(item)} ${opts.equipped ? 'equipped' : ''}" data-item-open="${item.id}" type="button">
    ${itemIcon(item, 'sm')}
    <div class="item-meta">
      <div class="name">${esc(item.name)}${item.upgrade ? ` +${item.upgrade}` : ''}</div>
      <div class="sub">${esc(rar.name)} ${esc(slot)} · iLvl ${item.ilvl}</div>
    </div>
    <div class="score">${fmt(itemScore(item))}</div>
  </button>`;
}

export function itemTile(item, opts = {}) {
  return `<button type="button" class="item-tile ${rarityClass(item)}" data-item-open="${item.id}">
    ${item?.upgrade ? `<span class="tile-tag">+${item.upgrade}</span>` : ''}
    ${item?.locked ? `<span class="tile-tag" style="top:auto;bottom:4px;right:5px;color:var(--gold)">${icon('lock')}</span>` : ''}
    ${itemIcon(item)}
    <div class="name">${esc(item.name)}</div>
    <div class="sub">${SLOTS[item.slot]?.label || ''} · ${fmt(itemScore(item))}</div>
  </button>`;
}

export function compareBlock(item, state) {
  const current = state.hero.equipment?.[item.slot];
  if (!current || current.id === item.id) return '';
  const diff = itemScore(item) - itemScore(current);
  return `<div class="item-compare">Versus equipped <b>${esc(current.name)}</b>: <b class="${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '+' : ''}${fmt(diff)} power</b></div>`;
}

export function itemStatBlock(item) {
  const stats = itemTotalStats(item);
  const lines = Object.entries(stats).map(([stat, value]) => `<div class="item-stat-line"><span class="stat-name">${esc(statLabel(stat))}</span><span class="stat-val positive">+${fmt1(value)}${statSuffix(stat)}</span></div>`).join('');
  const affixes = (item.affixes || []).map(a => `<div class="item-affix"><span>${esc(statLabel(a.stat))} <span class="roll">· random</span></span><span>+${fmt1(a.value)}${statSuffix(a.stat)}</span></div>`).join('');
  return `<div class="item-stat-list">${lines || '<span class="muted">No intrinsic stats</span>'}</div>
    ${affixes ? `<div class="item-affixes">${affixes}</div>` : ''}`;
}

export function itemDetailHTML(item, state, opts = {}) {
  const rar = rarityOf(item);
  const cls = state.hero.classId;
  const compatible = canEquipToClass(item, cls);
  return `<div class="${rarityClass(item)}">
    <div class="item-detail-head">
      ${itemIcon(item, 'xl')}
      <div style="min-width:0">
        <div class="name">${esc(item.name)}${item.upgrade ? ` +${item.upgrade}` : ''}</div>
        <div class="sub">
          <span class="rarity-text">${rar.name}</span>
          <span>${esc(item.type || SLOTS[item.slot]?.label || '')}</span>
          <span>Item level ${item.ilvl}</span>
        </div>
        <div class="sub" style="margin-top:5px">
          ${chip(`Power ${fmt(itemScore(item))}`, 'gold', 'power')}
          ${item.classReq ? chip(`${item.classReq[0].toUpperCase()}${item.classReq.slice(1)} only`, compatible ? '' : 'red', compatible ? 'check' : 'lock') : ''}
          ${item.locked ? chip('Locked', 'violet', 'lock') : ''}
        </div>
      </div>
    </div>
    ${itemStatBlock(item)}
    ${opts.showCompare === false ? '' : compareBlock(item, state)}
    <div class="flex between mt-2" style="font-size:10px;color:var(--muted)">
      <span>Sale value <b class="gold">${fmt(itemSellPrice(item))}g</b></span>
      <span>${esc(item.source ? `Found: ${item.source}` : '')}</span>
    </div>
    ${opts.extra || ''}
  </div>`;
}

export function materialChip(key, amount) {
  const mat = MATERIALS[key];
  if (!mat) return '';
  return `<span class="material" title="${esc(mat.desc)}">${materialArt(mat.icon, 13)} ${esc(mat.name)} <b>${fmt(amount)}</b></span>`;
}

export function emptyState(iconName, title, text) {
  return `<div class="empty-state">${icon(iconName)}<strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
}

export function pageHead(title, sub, actions = '', eyebrow = '') {
  return `<div class="page-head">
    <div class="titles">${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h1>${esc(title)}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
    ${actions ? `<div class="head-actions">${actions}</div>` : ''}
  </div>`;
}

export function sectionTitle(title, count = '', action = '') {
  return `<div class="section-title"><h2>${esc(title)}</h2>${count ? `<span class="count">${count}</span>` : ''}${action ? `<span class="spacer"></span>${action}` : ''}</div>`;
}

export function toggle(options) {
  const { id, label, checked, hint } = options;
  return `<label class="toggle" for="${id}"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><span class="track"></span><span class="label">${esc(label)}${hint ? ` <span class="dim">${esc(hint)}</span>` : ''}</span></label>`;
}

export function materialRow(materials) {
  return `<div class="material-row">${Object.entries(materials).filter(([, v]) => v > 0).map(([k, v]) => materialChip(k, v)).join('')}</div>`;
}

export function rarityLadder() {
  return `<div class="rarity-ladder">${RARITIES.map(r => `<span class="rarity-step" style="--step-color:${r.color}">${r.name}</span>`).join('')}</div>`;
}

/* --------------------------------------------------------------------------
   Toasts & modals
   -------------------------------------------------------------------------- */
const TOAST_ICONS = { success: 'check', danger: 'close', info: 'info', gold: 'coin', loot: 'spark', forge: 'hammer', level: 'level', boss: 'skull', clear: 'crown' };

export function toast(message, type = 'info', opts = {}) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  if (opts.rarity) node.style.setProperty('--rarity', opts.rarity);
  node.innerHTML = `${icon(TOAST_ICONS[type] || 'info')}<div>${opts.html || esc(message)}${opts.small ? `<span class="t-small">${esc(opts.small)}</span>` : ''}</div>`;
  root.appendChild(node);
  while (root.children.length > 4) root.firstElementChild?.remove();
  const life = opts.duration || 3400;
  setTimeout(() => {
    node.classList.add('leaving');
    setTimeout(() => node.remove(), 240);
  }, life);
}

let modalCleanup = null;

export function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  if (modalCleanup) { try { modalCleanup(); } catch {} modalCleanup = null; }
  document.removeEventListener('keydown', modalEscape);
}

function modalEscape(e) { if (e.key === 'Escape') closeModal(); }

export function openModal(opts = {}) {
  closeModal();
  const root = document.getElementById('modal-root');
  if (!root) return null;
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop>
    <div class="modal ${opts.wide ? 'wide' : ''} ${opts.narrow ? 'narrow' : ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.title || 'Dialog')}">
      <div class="modal-head">
        <div>${opts.eyebrow ? `<span class="eyebrow">${esc(opts.eyebrow)}</span>` : ''}<h2>${esc(opts.title || '')}</h2></div>
        <button class="modal-close" data-modal-close type="button" aria-label="Close">${icon('close')}</button>
      </div>
      <div class="modal-body">${opts.body || ''}</div>
      ${opts.footer ? `<div class="modal-foot">${opts.footer}</div>` : ''}
    </div>
  </div>`;
  root.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
  root.querySelector('[data-modal-backdrop]')?.addEventListener('click', e => { if (e.target.dataset.modalBackdrop !== undefined) closeModal(); });
  document.addEventListener('keydown', modalEscape);
  if (opts.onMount) modalCleanup = opts.onMount(root) || null;
  return root;
}

export function confirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm }) {
  openModal({
    title, narrow: true,
    body: `<p style="font-size:12px;color:var(--text)">${message}</p>`,
    footer: `<button class="btn ghost" data-modal-close type="button">Cancel</button><button class="btn ${danger ? 'danger' : ''}" id="confirm-action" type="button">${esc(confirmLabel)}</button>`,
    onMount(root) {
      root.querySelector('#confirm-action')?.addEventListener('click', () => { closeModal(); onConfirm?.(); });
    },
  });
}

export function showItemModal(item, opts = {}) {
  if (!item) return;
  const state = Engine.state;
  const equipped = Engine.state?.hero?.equipment?.[item.slot]?.id === item.id;
  const compatible = canEquipToClass(item, state.hero.classId);
  const actions = [];
  if (opts.hideActions) {
    // read-only detail
  } else if (equipped) {
    actions.push(`<button class="btn secondary" data-act="unequip" type="button">${icon('armor')} Unequip</button>`);
  } else if (compatible && !opts.inForge) {
    actions.push(`<button class="btn" data-act="equip" type="button">${icon('check')} Equip</button>`);
  }
  if (!equipped && !item.locked) actions.push(`<button class="btn ghost" data-act="sell" type="button">${icon('coin')} Sell ${fmt(itemSellPrice(item))}g</button>`);
  actions.push(`<button class="btn ghost" data-act="lock" type="button">${icon('lock')} ${item.locked ? 'Unlock' : 'Lock'}</button>`);
  if (!opts.inForge) actions.push(`<button class="btn secondary" data-act="forge" type="button">${icon('hammer')} Forge</button>`);

  openModal({
    title: item.name + (item.upgrade ? ` +${item.upgrade}` : ''),
    eyebrow: `${rarityOf(item).name} ${SLOTS[item.slot]?.label || ''}`,
    body: itemDetailHTML(item, state, { extra: opts.extra || '' }),
    footer: actions.join(''),
    onMount(root) {
      root.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const act = btn.dataset.act;
          if (act === 'equip') Engine.equipItem(item.id);
          else if (act === 'unequip') Engine.unequipSlot(item.slot);
          else if (act === 'sell') {
            confirmModal({
              title: 'Sell item?', danger: true, confirmLabel: `Sell for ${fmt(itemSellPrice(item))}g`,
              message: `Sell <b>${esc(item.name)}</b> to the merchant? This cannot be undone.`,
              onConfirm: () => { Engine.sellItem(item.id); opts.onChange?.(); },
            });
            return;
          } else if (act === 'lock') Engine.toggleLock(item.id);
          else if (act === 'forge') { closeModal(); opts.onNavigate?.('forge', { itemId: item.id }); return; }
          closeModal();
          opts.onChange?.();
        });
      });
    },
  });
}

/* --------------------------------------------------------------------------
   Toasts & modals
   -------------------------------------------------------------------------- */

export function currencyPill(kind, amount, onClick = false) {
  const isGold = kind === 'gold';
  return `<button class="resource-pill ${isGold ? 'gold-pill' : 'coin-pill'}" ${onClick ? `data-resource="${kind}"` : ''} type="button">
    ${icon(isGold ? 'coin' : 'premium')}<span>${fmt(amount)}</span>${isGold ? '' : '<span class="plus">+</span>'}
  </button>`;
}
