import { escapeHTML } from './util.js';

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

export function itemOrb(item, extra = '') {
  return `<span class="item-orb ${item.css} ${extra}">${icon(item.slotIcon || item.slot || 'spark')}<i></i></span>`;
}

export function rarityPill(rarity) {
  return `<span class="rarity-pill ${rarity.css}">${rarity.name}</span>`;
}

export function statLine(label, value, suffix = '') {
  return `<div class="stat-line"><span>${label}</span><strong>${value}${suffix}</strong></div>`;
}

export function bar(percent, cls = '', label = '') {
  return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, percent))}%"></i>${label ? `<span>${label}</span>` : ''}</div>`;
}

const toastLayer = () => document.getElementById('toast-layer');

export function toast(message, { type = 'info', iconName = '', ttl = 2400 } = {}) {
  const layer = toastLayer();
  if (!layer) return;
  const node = document.createElement('div');
  node.className = `toast toast-${type}`;
  node.innerHTML = `${iconName ? `<span class="toast-ic">${icon(iconName)}</span>` : ''}<span>${message}</span>`;
  layer.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));
  setTimeout(() => {
    node.classList.remove('in');
    setTimeout(() => node.remove(), 260);
  }, ttl);
  while (layer.children.length > 4) layer.firstElementChild?.remove();
}

export function lootToast(item, count = 1, note = '') {
  toast(`<b class="${item.css}-text">${escapeHTML(item.name)}</b>${count > 1 ? ` ×${count}` : ''}${note ? `<em>${escapeHTML(note)}</em>` : ''}`, {
    type: 'loot', iconName: item.slot, ttl: 3000,
  });
}

let activeModal = null;

export function closeModal(reason = 'close') {
  activeModal?.close(reason);
}

export function openModal({
  title = '', kicker = '', body = '', footer = '', dismissible = true,
  onClose = null, className = '', showClose = true, sheet = true,
} = {}) {
  closeModal('replaced');
  const layer = document.getElementById('modal-layer');
  if (!layer) return null;
  layer.hidden = false;
  layer.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-sheet ${sheet ? 'is-sheet' : ''} ${className}" role="dialog" aria-modal="true" aria-label="${escapeHTML(title || 'Dialog')}">
      <div class="sheet-handle" aria-hidden="true"></div>
      ${kicker ? `<p class="eyebrow modal-kicker">${kicker}</p>` : ''}
      ${title ? `<div class="modal-head"><h3>${title}</h3>${dismissible && showClose ? `<button class="icon-btn modal-x" aria-label="Close">${icon('close')}</button>` : ''}</div>` : ''}
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    </div>`;

  const sheetEl = layer.querySelector('.modal-sheet');
  const backdrop = layer.querySelector('.modal-backdrop');
  let closed = false;

  const close = (reason = 'close') => {
    if (closed) return;
    closed = true;
    sheetEl.classList.add('out');
    backdrop.classList.add('out');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => {
      if (activeModal?.close === close) {
        layer.hidden = true;
        layer.innerHTML = '';
        activeModal = null;
      }
    }, 220);
    if (onClose) onClose(reason);
  };

  const onKey = (event) => {
    if (event.key === 'Escape' && dismissible) close('escape');
  };

  layer.querySelector('.modal-x')?.addEventListener('click', () => close('button'));
  if (dismissible) backdrop.addEventListener('click', () => close('backdrop'));
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => {
    layer.classList.add('open');
    sheetEl.classList.add('in');
    backdrop.classList.add('in');
  });

  activeModal = { close, root: sheetEl, layer };
  return activeModal;
}

export function confirmDialog({
  title, message, confirmText = 'Confirm', cancelText = 'Cancel',
  danger = false, kicker = 'A WORD OF WARNING',
} = {}) {
  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const modal = openModal({
      title, kicker,
      body: `<p class="modal-copy">${message}</p>`,
      footer: `<button class="btn btn-ghost" data-act="cancel">${cancelText}</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${confirmText}</button>`,
      onClose: () => finish(false),
    });
    modal?.root.querySelector('[data-act="cancel"]')?.addEventListener('click', () => { finish(false); modal.close('cancel'); });
    modal?.root.querySelector('[data-act="ok"]')?.addEventListener('click', () => { finish(true); modal.close('ok'); });
  });
}

export function itemDetailBody(item, { equipped = false, current = null, delta = null } = {}) {
  const stats = Object.entries(item.stats).map(([stat, value]) => {
    const label = { atk: 'Attack', hp: 'Health', def: 'Defense', crit: 'Crit Chance', critDmg: 'Crit Damage', speed: 'Move Speed' }[stat] || stat;
    const suffix = stat === 'crit' || stat === 'critDmg' ? '%' : '';
    const diff = delta?.[stat] ?? 0;
    const diffHtml = diff !== 0 ? `<em class="${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '+' : ''}${diff.toFixed(stat === 'crit' || stat === 'critDmg' ? 1 : 0)}${suffix}</em>` : '';
    return `<div class="item-stat"><span>${label}</span><strong>+${value}${suffix}</strong>${diffHtml}</div>`;
  }).join('');
  return `
    <div class="item-detail">
      <div class="item-detail-top">
        ${itemOrb(item, 'large')}
        <div>
          <p class="item-kind">${item.slotName} · ${item.chapterName}</p>
          <h4 class="${item.css}-text">${escapeHTML(item.name)}</h4>
          <div class="item-tags">${rarityPill({ css: item.css, name: item.rarityName })}<span class="chip">Power ${item.power}</span></div>
        </div>
      </div>
      <div class="item-stats">${stats}</div>
      ${equipped ? '<p class="equipped-note">Currently equipped</p>' : ''}
      ${current && !equipped ? `<p class="compare-note">Replaces <b class="${current.css}-text">${escapeHTML(current.name)}</b> · ${item.power >= current.power ? `<span class="up">+${item.power - current.power} power</span>` : `<span class="down">${item.power - current.power} power</span>`}</p>` : ''}
      <p class="item-flavor">Four identical copies can be merged at the Forge.</p>
    </div>`;
}

export function screenHeader({ kicker = '', title = '', back = false, right = '' } = {}) {
  return `<header class="sub-header">${back ? `<button class="icon-btn js-back" aria-label="Back">${icon('chevron', 'flip')}</button>` : '<span class="header-spacer"></span>'}<div>${kicker ? `<p class="eyebrow">${kicker}</p>` : ''}<h2>${title}</h2></div>${right || '<span class="header-spacer"></span>'}</header>`;
}

export function skillRow(skill, idx) {
  return `<div class="skill-row">
    <span class="skill-emblem" style="--skill:${skill.color}">${icon(skill.icon)}</span>
    <div><div class="skill-title"><strong>${skill.name}</strong><span>Skill ${idx + 1}</span></div><p>${skill.desc}</p></div>
    <span class="cd-chip">${skill.cd}s</span>
  </div>`;
}
