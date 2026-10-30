/* Shared helpers for screen renderers. */

import { statLabel, statSuffix } from '../../core/stats.js';
import { esc, fmt, fmt1, bar } from '../components.js';
import { RARITY_BY_ID } from '../../data/items.js';
import { itemScore } from '../../core/items.js';

export function skillDescription(skill, level = 1) {
  const power = Math.round(skill.mult ? skill.mult * 100 * (1 + (level - 1) * 0.085) : 0);
  return String(skill.desc || '').replace('{mult}', String(power));
}

export function bonusLine(bonus, level = 1) {
  const value = (bonus.base || 0) + (bonus.perLevel || 0) * Math.max(0, level - 1);
  return `${statLabel(bonus.stat)} +${fmt1(Math.round(value * 10) / 10)}${statSuffix(bonus.stat)}`;
}

export function collectionBonusLines(data, level = 1) {
  return (data?.bonus || []).map(b => bonusLine(b, level)).join(' · ');
}

export function itemPicker(items, opts = {}) {
  const selectedId = opts.selectedId;
  if (!items.length) return `<div class="empty-state">${opts.emptyIcon ? '' : ''}<strong>${esc(opts.emptyTitle || 'Nothing here')}</strong><span>${esc(opts.emptyText || '')}</span></div>`;
  return `<div class="picker-grid">${items.map(item => {
    const rar = RARITY_BY_ID[item.rarity] || RARITY_BY_ID.common;
    return `<button class="item-card r-${rar.id} ${selectedId === item.id ? 'selected' : ''}" data-${opts.action || 'pick'}="${item.id}" type="button">
      <div class="item-icon sm r-${rar.id}" style="--rarity:${rar.color}">
        ${opts.art ? opts.art(item) : ''}
        ${item.upgrade ? `<span class="upgrade-tag">+${item.upgrade}</span>` : ''}
      </div>
      <div class="item-meta">
        <div class="name">${esc(item.name)}${item.upgrade ? ` +${item.upgrade}` : ''}</div>
        <div class="sub">${esc(rar.name)} · iLvl ${item.ilvl} · ${opts.equippedIds?.has(item.id) ? 'Equipped' : 'Satchel'}</div>
      </div>
      <div class="score">${fmt(itemScore(item))}</div>
      ${selectedId === item.id ? '<span class="pick-tag">Selected</span>' : ''}
    </button>`;
  }).join('')}</div>`;
}

export function progressBar(value, max, cls = 'xp', label = '') {
  return `<div class="bar-row"><span class="bar-label">${esc(label)}</span>${bar(value, max, cls)}<span class="bar-value">${fmt(value)} / ${fmt(max)}</span></div>`;
}

export function relativeTime(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function statRows(entries) {
  return entries.map(([stat, value]) => `<div class="stat-row"><span class="label">${esc(statLabel(stat))}</span><span class="value">${fmt1(Math.round((Number(value) || 0) * 10) / 10)}${statSuffix(stat)}</span></div>`).join('');
}
