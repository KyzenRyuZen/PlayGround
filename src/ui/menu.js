// Main menu and chronicle screens.
import { t, tx, icon, esc, fmt, getLang, langSwitch, bindLanguage, showModal, closeModal, confirmDialog, settingsBody, bindSettings } from './common.js';
import { CLASSES } from '../data/classes.js';
import { getZone } from '../data/zones.js';
import { loadGame, saveSettings, deleteGame } from '../core/save.js';
import { renderHero } from './heroArt.js';
import { formatPlaytime } from '../core/utils.js';

function ridge() {
  return `<svg viewBox="0 0 500 260" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="ridgeA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#242132"/><stop offset="1" stop-color="#0a0a10"/></linearGradient>
      <linearGradient id="ridgeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161522"/><stop offset="1" stop-color="#06060a"/></linearGradient>
    </defs>
    <path d="M0 190 L55 150 L95 172 L140 124 L185 160 L228 132 L270 166 L318 120 L365 158 L415 136 L462 170 L500 146 L500 260 L0 260Z" fill="url(#ridgeA)" opacity=".85"/>
    <path d="M0 222 L48 198 L96 216 L150 176 L205 210 L258 186 L310 214 L360 180 L418 212 L470 192 L500 206 L500 260 L0 260Z" fill="url(#ridgeB)"/>
    <g fill="#e8d9ae" opacity=".5">
      <circle cx="120" cy="82" r="1"/><circle cx="315" cy="52" r="1.2"/><circle cx="402" cy="96" r=".8"/>
      <circle cx="68" cy="46" r=".7"/><circle cx="248" cy="70" r=".8"/><circle cx="458" cy="40" r="1"/>
    </g>
    <g stroke="#d9b76a" stroke-width=".5" opacity=".25">
      <path d="M245 96 L249 108 L261 112 L249 116 L245 128 L241 116 L229 112 L241 108Z" fill="#d9b76a" fill-opacity=".15"/>
    </g>
  </svg>`;
}

function sigil() {
  return `<svg viewBox="0 0 120 120" aria-label="AETHERIA">
    <defs><linearGradient id="menuGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2ca"/><stop offset=".5" stop-color="#d9b76a"/><stop offset="1" stop-color="#7a5724"/></linearGradient></defs>
    <circle cx="60" cy="60" r="54" fill="none" stroke="url(#menuGold)" stroke-width="1" opacity=".55"/>
    <circle cx="60" cy="60" r="45" fill="none" stroke="url(#menuGold)" stroke-width=".6" opacity=".35" stroke-dasharray="2 5"/>
    <path d="M60 16 L70 50 L104 60 L70 70 L60 104 L50 70 L16 60 L50 50 Z" fill="none" stroke="url(#menuGold)" stroke-width="1.4"/>
    <path d="M60 34 L66 54 L86 60 L66 66 L60 86 L54 66 L34 60 L54 54 Z" fill="url(#menuGold)" opacity=".85"/>
  </svg>`;
}

export function openSettings(screen, onClose, onLanguage) {
  const settings = screen.settings;
  const player = screen.game?.player ?? null;
  const wrap = showModal({
    title: t('settings.title'),
    className: 'settings-modal',
    body: settingsBody(settings, player),
    foot: `<button class="btn primary wide" data-modal-close>${esc(t('common.close'))}</button>`,
    onClose,
  });
  if (!wrap) return;
  bindSettings(wrap, {
    settings,
    onChange: () => {
      document.body.classList.toggle('reduce-motion', Boolean(settings.reduceMotion));
      saveSettings(settings);
    },
    onAudio: (s) => screen.audio?.setSettings(s),
    onLanguage: (id) => {
      closeModal();
      saveSettings(settings);
      onLanguage?.(id);
    },
    onReset: () => {
      deleteGame();
      closeModal();
      screen.refreshMenu();
      screen.toast(t('settings.resetDone'), 'good');
    },
  });
}

export function openCredits() {
  showModal({
    title: t('menu.creditsTitle'),
    body: `<div class="credits-scroll">
      <h3>AETHERIA</h3>
      <p>${esc(t('menu.creditsText'))}</p>
      <p>${esc(t('menu.madeFor'))} · ${esc(t('menu.version'))}</p>
      <div class="credit-line"><span>${esc(t('class.warrior'))}</span><b>${esc(t('create.warriorRole'))}</b></div>
      <div class="credit-line"><span>${esc(t('class.mage'))}</span><b>${esc(t('create.mageRole'))}</b></div>
      <div class="credit-line"><span>${esc(t('class.assassin'))}</span><b>${esc(t('create.assassinRole'))}</b></div>
      <div class="credit-line"><span>${esc(t('faction.angel'))} / ${esc(t('faction.demon'))}</span><b>${esc(t('create.factionBonus'))}</b></div>
      <div class="credit-line"><span>${esc(t('world.title'))}</span><b>8</b></div>
      <div class="credit-line"><span>${esc(t('settings.language'))}</span><b>DE · EN</b></div>
      <p style="margin-top:12px">${esc(t('tips.1'))}<br>${esc(t('tips.4'))}<br>${esc(t('tips.3'))}</p>
    </div>`,
    foot: `<button class="btn primary wide" data-modal-close>${esc(t('common.close'))}</button>`,
  });
}

function installButton(screen) {
  if (!screen.installPrompt) return '';
  return `<button class="mini-btn" data-menu-install>${icon('arrowDown')}<span>${esc(t('menu.install'))}</span></button>`;
}

export function renderMenu(screen) {
  const saved = loadGame();
  const player = saved?.player ?? null;
  const zone = player ? getZone(player.zoneId) : null;
  const stars = Array.from({ length: 46 }, (_, i) => {
    const x = (i * 47.3) % 100, y = (i * 29.7) % 58;
    return `<span class="star" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;animation-delay:${(i % 9) * 0.4}s"></span>`;
  }).join('');

  const screenEl = document.getElementById('screen');
  document.body.classList.toggle('reduce-motion', Boolean(screen.settings.reduceMotion));
  screenEl.innerHTML = `<div class="menu-screen">
    <div class="menu-sky">${stars}</div>
    <div class="menu-ridge">${ridge()}</div>
    <div class="menu-top">
      <span class="menu-version">${esc(t('menu.version'))}</span>
      ${langSwitch()}
    </div>
    <div class="menu-brand">
      <div class="menu-sigil">${sigil()}</div>
      <h1>AETHERIA</h1>
      <div class="menu-sub">${esc(t('boot.sub'))}</div>
      <div class="menu-rule"></div>
    </div>
    <div class="menu-portrait">${player ? '<canvas id="menuHeroCanvas"></canvas><div class="portrait-haze"></div>' : ''}</div>
    <div class="menu-actions">
      ${player ? `
        <button class="btn primary menu-continue" data-menu-continue>
          <b>${esc(t('menu.continue'))}</b>
          <span>${esc(player.name)} · ${esc(t('common.lv'))} ${player.level} · ${esc(t(`zone.${player.zoneId}`))}</span>
        </button>` : `
        <div class="menu-empty"><p><b>${esc(t('menu.emptySlot'))}</b><br>${esc(t('menu.emptyHint'))}</p></div>
        <button class="btn primary" data-menu-new>${icon('spark')}<span>${esc(t('menu.enter'))}</span></button>`}
      ${player ? `<button class="btn ghost" data-menu-new>${esc(t('menu.new'))}</button>` : ''}
      <div class="menu-social">
        <button data-menu-settings>${icon('settings')}<span>${esc(t('menu.settings'))}</span></button>
        <button data-menu-credits>${icon('book')}<span>${esc(t('menu.credits'))}</span></button>
        ${player ? installButton(screen) : ''}
      </div>
      ${player ? `<div class="menu-notice">${icon('info')}<span>${esc(t('menu.onlineNotice'))}</span></div>` : ''}
      ${player ? `<div class="menu-notice">${icon('clock')}<span>${esc(t('char.playtime'))}: ${formatPlaytime(player.playtimeMs ?? 0)} · ${esc(t('menu.chapter'))} ${player.completedChapters ?? 0}/8</span></div>` : ''}
    </div>
    <div class="menu-foot">${esc(t('menu.tagline'))}</div>
  </div>`;

  bindLanguage(screenEl, () => screen.refreshMenu());
  screenEl.querySelector('[data-menu-continue]')?.addEventListener('click', () => screen.continueGame());
  screenEl.querySelector('[data-menu-new]')?.addEventListener('click', () => {
    if (!player) { screen.gotoCreate(); return; }
    confirmDialog(t('menu.overwriteTitle'), t('menu.overwriteText'), () => {
      deleteGame();
      screen.gotoCreate();
    }, { danger: true, confirmLabel: t('menu.newFate') });
  });
  screenEl.querySelector('[data-menu-settings]')?.addEventListener('click', () => openSettings(screen, null, () => screen.refreshMenu()));
  screenEl.querySelector('[data-menu-credits]')?.addEventListener('click', openCredits);
  screenEl.querySelector('[data-menu-install]')?.addEventListener('click', () => screen.installPrompt?.());

  // Animated portrait for the existing hero.
  let raf = 0;
  if (player) {
    const canvas = screenEl.querySelector('#menuHeroCanvas');
    const started = performance.now();
    const draw = (now) => {
      if (!canvas.isConnected) return;
      renderHero(canvas, player, (now - started) / 1000, { zoom: 1.12 });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
  }
  return () => cancelAnimationFrame(raf);
}
