/* Settings — preferences, save portability, and account reset. */

import { Engine } from '../../core/engine.js';
import { GAME, SAVE_LEADERBOARD_NOTE } from '../../config.js';
import { clearSave } from '../../core/save.js';
import { esc, fmt, pageHead, openModal, closeModal, confirmModal, toggle, chip, duration } from '../components.js';
import { icon } from '../icons.js';
import { playCue } from '../audio.js';

function settingRow(id, label, hint, checked, kind = 'setting') {
  return `<div class="setting-row">
    <div><div class="s-label">${esc(label)}</div><div class="s-hint">${esc(hint)}</div></div>
    <label class="toggle" for="${id}">
      <input type="checkbox" id="${id}" data-setting="${kind}" data-key="${id}" ${checked ? 'checked' : ''}>
      <span class="track"></span>
    </label>
  </div>`;
}

export function render(ctx) {
  const { state } = ctx;
  const hero = state.hero;
  const settings = state.settings || {};
  const playSeconds = Math.round(state.playSeconds || 0);
  const accountId = `rift-${String(state.createdAt || 0).slice(-8)}`;
  const version = `v${GAME.version}.0`;

  return `
  ${pageHead('Settings', `Save data, preferences and account tools · ${esc(version)}`,
    `<button class="btn ghost" data-setting-action="save" type="button">${icon('check')} Save now</button>`, 'The chronicle')}

  <div class="settings-grid">
    <div class="flex-col" style="gap:14px">
      <section class="panel pad">
        <span class="eyebrow">Presentation</span>
        <h3 style="font-size:15px;margin-bottom:3px">Look and sound</h3>
        ${settingRow('particles', 'Ambient particles', 'Fireflies, embers, snow and souls drift through the battle scene.', settings.particles !== false)}
        ${settingRow('damageNumbers', 'Damage numbers', 'Show floating damage and critical-hit numbers.', settings.damageNumbers !== false)}
        ${settingRow('reduceMotion', 'Reduce motion', 'Calm the battle scene and soften animated flourishes.', !!settings.reduceMotion)}
        ${settingRow('sound', 'Sound cues', 'Short synthesized cues for loot, levels and forging. No music files.', !!settings.sound)}
      </section>

      <section class="panel pad">
        <span class="eyebrow">Automation</span>
        <h3 style="font-size:15px;margin-bottom:3px">Let the hero work</h3>
        ${settingRow('autoEquip', 'Auto-equip upgrades', 'Equip any satchel relic that scores higher than the worn one.', !!hero.autoEquip, 'hero')}
        ${settingRow('autoSkills', 'Auto-cast skills', 'Spend mana on unlocked skills whenever they are ready.', !!hero.autoSkills, 'hero')}
        ${settingRow('autoAdvance', 'Auto-advance stages', 'Move to the next stage as soon as the current one is cleared.', !!state.progress.autoAdvance, 'progress')}
        ${settingRow('autoSellCommon', 'Auto-sell common relics', 'Convert common drops to gold instead of filling the satchel.', !!hero.autoSellCommon, 'hero')}
      </section>

      <section class="panel pad">
        <span class="eyebrow">Accessibility</span>
        <h3 style="font-size:14px;margin-bottom:5px">A gentler descent</h3>
        <p class="muted" style="font-size:10px;line-height:1.6">Reduce motion keeps the battle readable while removing camera shake and high-frequency particles. Damage numbers can be switched off independently. All settings are stored in the local save.</p>
        <div class="flex wrap mt-2" style="gap:5px">
          ${chip(settings.reduceMotion ? 'Reduced motion on' : 'Full motion', settings.reduceMotion ? '' : 'green', 'sparkles')}
          ${chip(settings.sound ? 'Sound on' : 'Sound muted', '', settings.sound ? 'wave' : 'moon')}
        </div>
      </section>
    </div>

    <div class="flex-col" style="gap:14px">
      <section class="panel pad">
        <span class="eyebrow">Save data</span>
        <h3 style="font-size:15px;margin-bottom:4px">Local-first chronicle</h3>
        <div class="save-info">
          <div class="flex between"><span>Hero</span><b>${esc(hero.name)} · ${esc(hero.classId)}</b></div>
          <div class="flex between"><span>Account ID</span><b>${esc(accountId)}</b></div>
          <div class="flex between"><span>Save version</span><b>${GAME.saveVersion}</b></div>
          <div class="flex between"><span>Time played</span><b>${duration(playSeconds * 1000)}</b></div>
          <div class="flex between"><span>Last saved</span><b>${state.lastSeen ? new Date(state.lastSeen).toLocaleString() : '—'}</b></div>
        </div>
        <div class="muted" style="font-size:9px;line-height:1.5;margin-top:8px">${esc(SAVE_LEADERBOARD_NOTE)}</div>
        <div class="flex wrap mt-2" style="gap:6px">
          <button class="btn tiny" data-setting-action="save" type="button">${icon('check')} Save now</button>
          <button class="btn tiny ghost" data-setting-action="export" type="button">${icon('share')} Export</button>
          <button class="btn tiny ghost" data-setting-action="import" type="button">${icon('bag')} Import</button>
        </div>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Danger</span>
        <h3 style="font-size:15px;margin-bottom:4px">Begin again</h3>
        <p class="muted" style="font-size:10px;line-height:1.6">Delete the local save and return to the title screen. This wipes the hero, inventory, collections, gold and premium coins stored on this device. Exported saves can be imported again.</p>
        <div class="flex wrap mt-2" style="gap:6px">
          <button class="btn tiny danger" data-setting-action="reset" type="button">${icon('trash')} Delete save</button>
          <button class="btn tiny ghost" data-setting-action="title" type="button">${icon('home')} Title screen</button>
        </div>
      </section>

      <section class="panel about-box">
        <div class="brand-mark">${icon('spark')}</div>
        <h3 style="font-size:17px">Ebonspire</h3>
        <div class="eyebrow" style="font-size:8px;margin-bottom:6px">Riftbound Saga</div>
        <p>An idle dark-fantasy RPG about a small hero, a very large road, and the things that wait at the end of it.</p>
        <p class="muted" style="font-size:8.5px;margin-top:8px">Local-first · no account required · all art hand-built in SVG</p>
        <div class="flex wrap" style="justify-content:center;gap:5px;margin-top:8px">
          ${chip(version, 'gold', 'spark')}
          ${chip('Offline progression', '', 'moon')}
          ${chip('Google Play ready', '', 'shield')}
        </div>
      </section>
    </div>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-setting]').forEach(input => {
    input.addEventListener('change', () => {
      const kind = input.dataset.setting;
      const key = input.dataset.key;
      if (kind === 'setting') {
        Engine.setSetting(key, input.checked);
        if (key === 'sound' && input.checked) playCue('ui');
      } else if (kind === 'hero') {
        if (key === 'autoEquip') Engine.setAutoEquip(input.checked);
        else if (key === 'autoSkills') Engine.toggleAutoSkills(input.checked);
        else if (key === 'autoSellCommon') Engine.setSetting('autoSellCommon', input.checked);
      } else if (kind === 'progress') {
        Engine.toggleAutoAdvance(input.checked);
      }
      ctx.refresh();
    });
  });

  root.querySelectorAll('[data-setting-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.settingAction;
      if (action === 'save') {
        Engine.save();
        ctx.toast?.('Chronicle saved to this device.', 'success');
      } else if (action === 'export') openExport(ctx);
      else if (action === 'import') openImport(ctx);
      else if (action === 'reset') {
        confirmModal({
          title: 'Delete this chronicle?',
          message: 'The hero, every relic, all collections and both currencies will be erased from this device. This cannot be undone unless you exported a save.',
          confirmLabel: 'Delete save',
          danger: true,
          onConfirm: () => {
            Engine.stopLoop();
            clearSave();
            location.hash = '';
            location.reload();
          },
        });
      } else if (action === 'title') {
        Engine.stopLoop();
        location.hash = '';
        location.reload();
      }
    });
  });
}

function downloadSave(text) {
  try {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ebonspire-save-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  } catch {}
}

function openExport(ctx) {
  const text = Engine.export();
  openModal({
    title: 'Export chronicle',
    eyebrow: 'Base64 save string',
    body: `<p class="muted" style="font-size:10px;margin-bottom:8px">Copy this string somewhere safe, or download it as a text file. It contains the entire local save.</p>
      <textarea class="input" id="export-text" readonly rows="8" style="width:100%;height:auto;padding:9px;font-family:ui-monospace,monospace;font-size:9px;line-height:1.4;resize:vertical">${esc(text)}</textarea>`,
    footer: `<button class="btn ghost" data-modal-close type="button">Close</button>
      <button class="btn ghost" id="export-download" type="button">${icon('share')} Download</button>
      <button class="btn" id="export-copy" type="button">${icon('check')} Copy</button>`,
    onMount(root) {
      root.querySelector('#export-copy')?.addEventListener('click', async () => {
        const area = root.querySelector('#export-text');
        try {
          await navigator.clipboard.writeText(area.value);
          ctx.toast?.('Save copied to clipboard.', 'success');
        } catch {
          area.select();
          document.execCommand?.('copy');
          ctx.toast?.('Save selected — copy it manually.', 'info');
        }
      });
      root.querySelector('#export-download')?.addEventListener('click', () => downloadSave(text));
    },
  });
}

function openImport(ctx) {
  openModal({
    title: 'Import chronicle',
    eyebrow: 'Paste a save string',
    body: `<p class="muted" style="font-size:10px;margin-bottom:8px">Importing replaces the current local save. Export the current hero first if you want to keep them.</p>
      <textarea class="input" id="import-text" rows="8" placeholder="Paste the exported base64 save here…" style="width:100%;height:auto;padding:9px;font-family:ui-monospace,monospace;font-size:9px;line-height:1.4;resize:vertical"></textarea>
      <div class="muted" style="font-size:9px;margin-top:8px">Or load a downloaded .txt file: <input type="file" id="import-file" accept=".txt,text/plain" style="font-size:9px;margin-top:4px"></div>`,
    footer: `<button class="btn ghost" data-modal-close type="button">Cancel</button>
      <button class="btn" id="import-go" type="button">${icon('bag')} Import save</button>`,
    onMount(root) {
      root.querySelector('#import-file')?.addEventListener('change', async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        root.querySelector('#import-text').value = await file.text();
      });
      root.querySelector('#import-go')?.addEventListener('click', () => {
        const text = root.querySelector('#import-text')?.value || '';
        const res = Engine.import(text);
        if (!res.ok) return ctx.toast?.('That save string is not valid.', 'danger');
        closeModal();
        ctx.toast?.('Chronicle restored.', 'success');
        ctx.refresh();
      });
    },
  });
}
