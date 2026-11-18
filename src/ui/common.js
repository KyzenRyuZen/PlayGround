// Shared DOM, toast, modal and formatting helpers for all AETHERIA screens.
import { icon } from './icons.js';
import { t, tx, getLang, setLang } from '../core/i18n.js';
import { esc, formatNumber, formatPlaytime } from '../core/utils.js';
import { saveSettings } from '../core/save.js';
import { LANGS } from '../core/i18n.js';

export { esc, formatNumber, formatPlaytime, t, tx, icon, getLang, setLang };

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function fmt(n) { return formatNumber(n); }

export function pct(v, digits = 0) { return `${(v * 100).toFixed(digits)}%`; }

export function titleCase(str) {
  return String(str).replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

// ── Toasts ────────────────────────────────────────────────────────────────
export function toast(text, type = '') {
  const layer = document.getElementById('toast');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = `toast${type ? ` ${type}` : ''}`;
  el.innerHTML = text;
  layer.appendChild(el);
  while (layer.children.length > 4) layer.firstElementChild?.remove();
  setTimeout(() => {
    el.style.transition = 'opacity .35s, transform .35s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 380);
  }, 3000);
}

// ── Modals ────────────────────────────────────────────────────────────────
let activeModal = null;

export function closeModal() {
  if (!activeModal) return;
  const node = activeModal;
  activeModal = null;
  node.remove();
}

export function showModal({ title = '', body = '', foot = '', className = '', onClose = null }) {
  closeModal();
  const layer = document.getElementById('overlay');
  if (!layer) return null;
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="modal ${className}" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>${esc(title)}</h3>
        <button class="icon-btn" data-modal-close aria-label="${esc(t('common.close'))}">${icon('close')}</button>
      </div>
      <div class="modal-body scroll">${body}</div>
      ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
    </div>`;
  layer.appendChild(wrap);
  activeModal = wrap;
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) { closeModal(); onClose?.(); }
  });
  wrap.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => { closeModal(); onClose?.(); });
  });
  return wrap;
}

export function confirmDialog(title, body, onConfirm, opts = {}) {
  const wrap = showModal({
    title,
    body: `<p class="confirm-text">${body}</p>`,
    foot: `<button class="btn ghost" data-no>${esc(t('common.cancel'))}</button>
           <button class="btn ${opts.danger ? 'danger' : 'primary'}" data-yes>${esc(opts.confirmLabel ?? t('common.confirm'))}</button>`,
    className: 'confirm-modal',
  });
  if (!wrap) return;
  wrap.querySelector('[data-no]').addEventListener('click', closeModal);
  wrap.querySelector('[data-yes]').addEventListener('click', () => {
    closeModal();
    onConfirm?.();
  });
}

export function noticeDialog(title, body) {
  showModal({
    title,
    body: `<p class="confirm-text">${body}</p>`,
    foot: `<button class="btn primary wide" data-modal-close>${esc(t('common.close'))}</button>`,
  });
}

// ── Shared fragments ──────────────────────────────────────────────────────
export function currencyRow(player) {
  return `<div class="currency-row">
    <div class="currency gold">${icon('gold')}<b>${fmt(player.gold)}</b></div>
    <div class="currency gems">${icon('gem')}<b>${fmt(player.gems)}</b></div>
  </div>`;
}

export function bar(cls, value, max, label) {
  const w = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return `<div class="bar ${cls}"><i style="width:${w}%"></i>${label ? `<div class="bar-label">${label}</div>` : ''}</div>`;
}

export function panelHead(title, subtitle = '', withResources = false) {
  const player = window.__AETHERIA_PLAYER__;
  return `<div class="panel-head">
    <button class="back" data-panel-back aria-label="${esc(t('common.back'))}">${icon('back')}</button>
    <div class="panel-title"><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
    ${withResources && player ? `<div class="resources">${currencyRow(player)}</div>` : ''}
    <button class="close" data-panel-close aria-label="${esc(t('common.close'))}">${icon('close')}</button>
  </div>`;
}

export function panelShell(title, subtitle, body, opts = {}) {
  const tabs = opts.tabs
    ? `<div class="panel-tabs">${opts.tabs.map((x) => `<button class="tab${x.on ? ' on' : ''}" data-tab="${esc(x.id)}">${esc(x.label)}${x.dot ? '<i class="dot"></i>' : ''}</button>`).join('')}</div>`
    : '';
  return `<div class="panel-backdrop" data-panel-backdrop>
    <div class="panel" role="dialog" aria-modal="true">
      ${panelHead(title, subtitle, opts.resources !== false)}
      ${tabs}
      <div class="panel-body scroll${opts.foot ? ' with-foot' : ''}" data-panel-body>${body}</div>
      ${opts.foot ? `<div class="panel-foot">${opts.foot}</div>` : ''}
    </div>
  </div>`;
}

export function emptyState(iconName, title, text) {
  return `<div class="empty-state">${icon(iconName)}<h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
}

export function statRow(label, value, iconName = '') {
  return `<div class="stat-row"><span>${iconName ? icon(iconName) : ''}${esc(label)}</span><b>${value}</b></div>`;
}

// ── Language control ──────────────────────────────────────────────────────
export function langSwitch() {
  const current = getLang();
  return `<div class="lang-compact" data-lang-switch>
    ${Object.entries(LANGS).map(([id, name]) =>
      `<button data-lang="${id}" class="${id === current ? 'on' : ''}">${id.toUpperCase()}</button>`).join('')}
  </div>`;
}

export function bindLanguage(root, onChange) {
  $$('[data-lang]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.lang;
      if (id === getLang()) return;
      setLang(id);
      const settings = window.__AETHERIA_SETTINGS__;
      if (settings) settings.lang = id;
      saveSettings(settings ?? { lang: id });
      onChange?.(id);
    });
  });
}

// ── Settings panel body, shared by menu modal and in-game panel ───────────
export function settingsBody(settings, player) {
  const q = (v) => (settings.quality === v ? ' on' : '');
  return `
    <div class="settings-group">
      <h3>${esc(t('settings.language'))}</h3>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.language'))}</div><div class="sr-hint">${esc(t('settings.languageHint'))}</div></div>
        <div class="sr-control">${langSwitch()}</div>
      </div>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.languageImmediate'))}</div></div>
        <div class="sr-control">${getLang().toUpperCase()}</div>
      </div>
    </div>

    <div class="settings-group">
      <h3>${esc(t('settings.audio'))}</h3>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.music'))}</div></div>
        <div class="sr-control"><button class="toggle${settings.music ? ' on' : ''}" data-setting-toggle="music"></button></div>
      </div>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.sfx'))}</div></div>
        <div class="sr-control"><button class="toggle${settings.sfx ? ' on' : ''}" data-setting-toggle="sfx"></button></div>
      </div>
    </div>

    <div class="settings-group">
      <h3>${esc(t('settings.display'))}</h3>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.quality'))}</div></div>
        <div class="sr-control"><div class="seg">
          <button data-quality="high" class="${q('high')}">${esc(t('quality.high'))}</button>
          <button data-quality="medium" class="${q('medium')}">${esc(t('quality.medium'))}</button>
          <button data-quality="low" class="${q('low')}">${esc(t('quality.low'))}</button>
        </div></div>
      </div>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.reduceMotion'))}</div></div>
        <div class="sr-control"><button class="toggle${settings.reduceMotion ? ' on' : ''}" data-setting-toggle="reduceMotion"></button></div>
      </div>
    </div>

    <div class="settings-group">
      <h3>${esc(t('settings.controls'))}</h3>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.joystick'))}</div></div>
        <div class="sr-control"><div class="seg">
          <button data-joy="left" class="${settings.joystickSide !== 'right' ? 'on' : ''}">${esc(t('settings.left'))}</button>
          <button data-joy="right" class="${settings.joystickSide === 'right' ? 'on' : ''}">${esc(t('settings.right'))}</button>
        </div></div>
      </div>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.haptics'))}</div></div>
        <div class="sr-control"><button class="toggle${settings.haptics ? ' on' : ''}" data-setting-toggle="haptics"></button></div>
      </div>
    </div>

    ${player ? `<div class="settings-group">
      <h3>${esc(t('settings.account'))}</h3>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.saveInfo'))}</div>
          <div class="sr-hint">${esc(player.name)} · ${esc(t('common.level'))} ${player.level} · ${esc(t('char.playtime'))}: ${formatPlaytime(player.playtimeMs ?? 0)}</div></div>
      </div>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.about'))}</div><div class="sr-hint">${esc(t('settings.offline'))} · ${esc(t('settings.accountHint'))}</div></div>
        <div class="sr-control"><span class="chip">v1.0</span></div>
      </div>
    </div>
    <div class="settings-group settings-danger">
      <h3>${esc(t('settings.resetTitle'))}</h3>
      <div class="setting-row">
        <div><div class="sr-label">${esc(t('settings.resetBtn'))}</div><div class="sr-hint">${esc(t('settings.resetText'))}</div></div>
        <div class="sr-control"><button class="btn small danger" data-reset-save>${esc(t('settings.resetBtn'))}</button></div>
      </div>
    </div>` : ''}

    <p class="hint gold" style="text-align:center;margin-top:4px">${esc(t('tips.1'))}<br>${esc(t('tips.4'))}<br>${esc(t('tips.3'))}</p>`;
}

export function bindSettings(root, { settings, onChange, onLanguage, onReset, onAudio }) {
  $$('[data-setting-toggle]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.settingToggle;
      settings[key] = !settings[key];
      btn.classList.toggle('on', settings[key]);
      saveSettings(settings);
      onAudio?.(settings);
      onChange?.(settings);
    });
  });
  $$('[data-quality]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      settings.quality = btn.dataset.quality;
      $$('[data-quality]', root).forEach((b) => b.classList.toggle('on', b === btn));
      saveSettings(settings);
      onChange?.(settings);
    });
  });
  $$('[data-joy]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      settings.joystickSide = btn.dataset.joy;
      $$('[data-joy]', root).forEach((b) => b.classList.toggle('on', b === btn));
      saveSettings(settings);
      onChange?.(settings);
    });
  });
  bindLanguage(root, (id) => {
    saveSettings(settings);
    onLanguage?.(id);
  });
  $$('[data-reset-save]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      confirmDialog(t('settings.resetTitle'), t('settings.resetText'), () => onReset?.(), {
        danger: true,
        confirmLabel: t('settings.resetBtn'),
      });
    });
  });
}
