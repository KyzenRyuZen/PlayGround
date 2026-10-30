/* World map — six regions, twenty stages each, one road upward. */

import { Engine } from '../../core/engine.js';
import { REGIONS, STAGES_PER_REGION, MAX_STAGE_INDEX, stageCoords, stageKind, stageGlobalIndex, monsterLevel, MONSTERS } from '../../data/monsters.js';
import { esc, fmt, pageHead, chip } from '../components.js';
import { icon } from '../icons.js';
import { monsterArt, regionArt } from '../sprites.js';

export function render(ctx) {
  const { state, stats } = ctx;
  const current = stageCoords(state.progress.currentIndex);
  const selectedRegion = REGIONS.find(r => r.id === ctx.params?.region) || current.region;
  const locked = state.progress.unlockedIndex < (selectedRegion.index - 1) * STAGES_PER_REGION + 1;
  const completed = new Set(Object.keys(state.progress.cleared || {}).map(Number));
  const clearedInRegion = Array.from({ length: STAGES_PER_REGION }, (_, i) => stageGlobalIndex(selectedRegion.id, i + 1)).filter(i => completed.has(i)).length;

  const tabs = REGIONS.map(region => {
    const start = (region.index - 1) * STAGES_PER_REGION + 1;
    const isLocked = state.progress.unlockedIndex < start;
    return `<button class="region-tab ${region.id === selectedRegion.id ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-stage-region="${region.id}" type="button">
      <div class="rt-name">${isLocked ? icon('lock') : icon('map')} ${esc(region.short)}</div>
      <div class="rt-level">${esc(region.name)} · Lv ${region.levelRange}</div>
    </button>`;
  }).join('');

  const tiles = Array.from({ length: STAGES_PER_REGION }, (_, i) => {
    const stage = i + 1;
    const index = stageGlobalIndex(selectedRegion.id, stage);
    const kind = stageKind(stage);
    const isLocked = index > state.progress.unlockedIndex;
    const isCleared = completed.has(index);
    const isCurrent = index === state.progress.currentIndex;
    return `<button class="stage-tile ${isLocked ? 'locked' : ''} ${isCleared ? 'cleared' : ''} ${isCurrent ? 'current' : ''} ${kind === 'boss' ? 'boss' : ''}"
      data-stage-index="${index}" type="button" ${isLocked ? 'disabled' : ''} title="${kind === 'boss' ? esc(selectedRegion.boss.name) : kind === 'miniboss' ? esc(selectedRegion.miniboss.name) : `${esc(selectedRegion.short)} monster camp`}">
      <span class="tile-num">${stage}</span>
      <span class="tile-label">${kind === 'boss' ? 'Boss' : kind === 'miniboss' ? 'Elite' : isCleared ? 'Cleared' : 'Hunt'}</span>
      <span class="tile-icon">${icon(kind === 'boss' ? 'skull' : kind === 'miniboss' ? 'crown' : 'target')}</span>
      ${isCleared ? `<span class="clear-mark">${icon('check')}</span>` : ''}
      ${isCurrent ? '<span class="clear-mark" style="color:var(--gold);top:auto;bottom:2px;left:4px">●</span>' : ''}
    </button>`;
  }).join('');

  return `
  ${pageHead('Stages', `The hunt is at ${esc(current.region.name)} · stage ${current.stage} · ${fmt(stats.power)} power`,
    `<button class="btn ghost" data-stage-action="current" type="button">${icon('target')} Return to hunt</button>
     <button class="btn ${state.progress.autoAdvance ? 'secondary' : 'ghost'}" data-stage-action="advance" type="button">${icon('arrowRight')} Auto advance: ${state.progress.autoAdvance ? 'On' : 'Off'}</button>`, 'World map')}

  <div class="region-tabs">${tabs}</div>

  <section class="world-hero" style="--world-bg:#0c0a12">
    <div class="world-art" style="opacity:.85">${regionArt(selectedRegion)}</div>
    <div class="world-info">
      <div>
        <span class="eyebrow" style="color:${selectedRegion.palette.accent}">${locked ? 'Sealed region' : 'Hunting grounds'}</span>
        <h2>${esc(selectedRegion.name)}</h2>
        <div class="world-sub">${esc(selectedRegion.lore)}</div>
        <div class="world-meta">
          ${chip(`Levels ${selectedRegion.levelRange}`, '', 'level')}
          ${chip(`${clearedInRegion}/${STAGES_PER_REGION} stages cleared`, clearedInRegion === STAGES_PER_REGION ? 'green' : '', 'check')}
          ${chip(`Boss: ${selectedRegion.boss.name}`, 'red', 'skull')}
          ${locked ? chip('Locked', 'red', 'lock') : chip('Open', 'green', 'map')}
        </div>
      </div>
      <div class="world-actions">
        ${locked
          ? `<span class="pill red">${icon('lock')} Clear stage ${(selectedRegion.index - 1) * STAGES_PER_REGION} to open</span>`
          : `<button class="btn" data-stage-index="${stageGlobalIndex(selectedRegion.id, 1)}" type="button">${icon('play')} Enter region</button>
             <span class="dim" style="font-size:8px">Tap any stage below to travel</span>`}
      </div>
    </div>
  </section>

  <div class="screen-grid">
    <section class="panel pad">
      <div class="flex between wrap" style="margin-bottom:9px">
        <div><span class="eyebrow">Stage path</span><h3 style="font-size:15px">${esc(selectedRegion.short)} · 20 trials</h3></div>
        <span class="pill">${current.region.id === selectedRegion.id ? `Here: stage ${current.stage}` : `Unlocked to stage ${Math.min(STAGES_PER_REGION, state.progress.unlockedIndex - (selectedRegion.index - 1) * STAGES_PER_REGION)}`}</span>
      </div>
      <div class="stage-grid">${tiles}</div>
      <div class="stage-summary">
        <div class="s-item"><span>Region monsters</span><b>${selectedRegion.monsters.length} families</b></div>
        <div class="s-item"><span>Elite guardian</span><b>${esc(selectedRegion.miniboss.name)} · stage 10</b></div>
        <div class="s-item"><span>Region boss</span><b>${esc(selectedRegion.boss.name)} · stage 20</b></div>
        <div class="s-item"><span>Monster level</span><b>${monsterLevel(selectedRegion, 1)}–${monsterLevel(selectedRegion, STAGES_PER_REGION)}</b></div>
      </div>
    </section>

    <div class="flex-col" style="gap:14px">
      <section class="panel pad">
        <span class="eyebrow">Bestiary</span>
        <h3 style="font-size:15px;margin-bottom:7px">Denizens of ${esc(selectedRegion.short)}</h3>
        <div class="flex wrap" style="gap:6px">
          ${selectedRegion.monsters.map(id => {
            const mon = MONSTERS[id];
            return `<span class="monster-chip" title="${esc(mon.lore)}">${monsterArt(mon.visual, selectedRegion.palette)}${esc(mon.name)}${mon.stone ? ' · treasure' : ''}</span>`;
          }).join('')}
        </div>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Guardians</span>
        <h3 style="font-size:15px;margin-bottom:7px">Crowned horrors</h3>
        ${[['Elite', selectedRegion.miniboss, 10], ['Region boss', selectedRegion.boss, 20]].map(([label, boss, stage]) => `<div class="ac-info" style="padding:9px 0;border-bottom:1px solid var(--line-dark)">
          <div class="ac-sub">${label} · stage ${stage} · level ${monsterLevel(selectedRegion, stage)}</div>
          <h3 style="font-size:14px">${esc(boss.name)}</h3>
          <div class="ac-bonus">${esc(boss.lore)}</div>
        </div>`).join('')}
      </section>

      <section class="panel pad">
        <span class="eyebrow">Progress</span>
        <h3 style="font-size:14px;margin-bottom:7px">Road so far</h3>
        <div class="mini-set">
          <div class="ms-row"><span>Unlocked</span><span class="spacer"></span><span>${state.progress.unlockedIndex} / ${MAX_STAGE_INDEX}</span></div>
          <div class="ms-row"><span>Cleared</span><span class="spacer"></span><span>${Object.keys(state.progress.cleared || {}).length} / ${MAX_STAGE_INDEX}</span></div>
          <div class="ms-row"><span>Auto advance</span><span class="spacer"></span><span class="pill ${state.progress.autoAdvance ? 'green' : ''}">${state.progress.autoAdvance ? 'On' : 'Off'}</span></div>
        </div>
        <p class="muted mt-2" style="font-size:9px">Bosses at stages 10 and 20 bar the road. Clearing stage 20 unlocks the next region and its dungeons.</p>
      </section>
    </div>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-stage-region]').forEach(btn => {
    btn.addEventListener('click', () => {
      const region = REGIONS.find(r => r.id === btn.dataset.stageRegion);
      if (!region) return;
      const start = (region.index - 1) * STAGES_PER_REGION + 1;
      if (Engine.state.progress.unlockedIndex < start) {
        return ctx.toast?.(`Clear stage ${start - 1} to open ${region.name}.`, 'danger');
      }
      ctx.refresh({ region: region.id });
    });
  });

  root.querySelectorAll('[data-stage-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.stageIndex);
      if (!Number.isFinite(index)) return;
      if (index > Engine.state.progress.unlockedIndex) return ctx.toast?.('That road is still sealed.', 'danger');
      if (index === Engine.state.progress.currentIndex && Engine.battle.mode !== 'dungeon') {
        return ctx.toast?.('You are already hunting here.', 'info');
      }
      Engine.travelStage(index);
      const coords = stageCoords(index);
      ctx.toast?.(`Travelling to ${coords.region.name}, stage ${coords.stage}.`, 'success');
      ctx.refresh({ region: coords.region.id });
    });
  });

  root.querySelector('[data-stage-action="current"]')?.addEventListener('click', () => {
    const current = stageCoords(Engine.state.progress.currentIndex);
    Engine.travelStage(current.globalIndex);
    ctx.toast?.(`Back to ${current.region.name}, stage ${current.stage}.`, 'info');
    ctx.refresh({ region: current.region.id });
  });

  root.querySelector('[data-stage-action="advance"]')?.addEventListener('click', () => {
    const res = Engine.toggleAutoAdvance();
    ctx.toast?.(`Auto advance ${res.value ? 'enabled' : 'disabled'}.`, 'info');
    ctx.refresh();
  });
}
