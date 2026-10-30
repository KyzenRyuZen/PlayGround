/* Dungeons — daily expeditions against crowned bosses. */

import { Engine } from '../../core/engine.js';
import { DUNGEONS, REGIONS } from '../../data/monsters.js';
import { dungeonAttemptsLeft, maxDungeonAttempts } from '../../core/progression.js';
import { esc, fmt, pageHead, chip, confirmModal } from '../components.js';
import { icon } from '../icons.js';
import { monsterArt } from '../sprites.js';

export function render(ctx) {
  const { state, stats } = ctx;
  const now = Date.now();
  const maxAttempts = maxDungeonAttempts(state, now);
  const activeId = Engine.battle.mode === 'dungeon' ? Engine.battle.dungeonId : null;
  const activeDungeon = DUNGEONS.find(d => d.id === activeId);

  const cards = DUNGEONS.map(dungeon => {
    const region = REGIONS.find(r => r.id === dungeon.regionId);
    const regionStart = (region?.index - 1) * 20 + 1 || 1;
    const unlocked = state.progress.unlockedIndex >= regionStart;
    const left = dungeonAttemptsLeft(state, dungeon.id, now);
    const dots = Array.from({ length: maxAttempts }, (_, i) => `<span class="attempt-dot ${i < left ? 'on' : ''}"></span>`).join('');
    const isActive = activeId === dungeon.id;
    const reward = dungeon.rewards;
    return `<article class="dungeon-card" style="${unlocked ? '' : 'opacity:.62'}">
      <div class="dungeon-art" style="background:radial-gradient(circle at 55% 100%, ${region?.palette?.glow || '#8d6cf2'}33, transparent 68%),linear-gradient(180deg,#171121,#0d0a13)">
        ${monsterArt(dungeon.boss.visual, region?.palette || {}, { size: 150 })}
        <span class="pill" style="position:absolute;top:9px;left:9px;z-index:1">${icon('skull')} Rank ${dungeon.rank}</span>
      </div>
      <div class="dungeon-body">
        <div class="d-level">${esc(region?.name || '')} · recommended Lv ${dungeon.level} · ${esc(dungeon.difficulty)}</div>
        <h3>${esc(dungeon.name)}</h3>
        <div class="d-desc">${esc(dungeon.desc)}</div>
        <div class="d-desc" style="color:var(--muted-2)">Boss: <b style="color:#ff9ca6">${esc(dungeon.boss.name)}</b> — ${esc(dungeon.boss.lore)}</div>
        <div class="d-rewards">
          ${chip(`${fmt(reward.gold)}g`, 'gold', 'coin')}
          ${chip(`${fmt(reward.xp)} XP`, '', 'level')}
          ${chip(`${reward.items} items`, '', 'bag')}
          ${chip(`${reward.stones} stones`, '', 'gem')}
          ${reward.matQty ? chip(`${reward.matQty} ${reward.mat}`, '', 'dust') : ''}
        </div>
        <div class="d-foot">
          <div class="attempts" title="${left} of ${maxAttempts} attempts left">${dots}<span class="dim" style="font-size:8px;margin-left:4px">${left}/${maxAttempts}</span></div>
          ${isActive
            ? `<button class="btn tiny danger" data-dungeon-flee type="button">${icon('close')} Retreat</button>`
            : unlocked
              ? `<button class="btn tiny ${left > 0 ? '' : 'ghost'}" data-dungeon-enter="${dungeon.id}" type="button" ${left <= 0 ? 'disabled' : ''}>${left > 0 ? `${icon('play')} Enter` : 'No attempts'}</button>`
              : `<span class="pill red">${icon('lock')} Clear stage ${regionStart - 1}</span>`}
        </div>
      </div>
    </article>`;
  }).join('');

  return `
  ${pageHead('Dungeons', `${maxAttempts} attempts per expedition each day · power ${fmt(stats.power)}`,
    activeDungeon ? `<button class="btn danger" data-dungeon-flee type="button">${icon('close')} Retreat to the hunt</button>` : `<button class="btn ghost" data-nav="stages" type="button">${icon('map')} World map</button>`, 'Expeditions')}

  ${activeDungeon ? `<div class="billing-note" style="border-color:rgba(217,76,99,.3);background:rgba(217,76,99,.07)"><b style="color:#ff9ca6">${icon('skull')} Expedition underway:</b>&nbsp;${esc(activeDungeon.name)} — ${esc(activeDungeon.boss.name)} guards the prize. The battle rages in the panel above.</div>` : ''}

  <div class="dungeon-grid">${cards}</div>

  <div class="grid-2 mt-3">
    <section class="panel pad">
      <span class="eyebrow">Dungeon rules</span>
      <h3 style="font-size:14px;margin-bottom:6px">How expeditions work</h3>
      <p class="muted" style="font-size:10px;line-height:1.6">Each dungeon allows ${maxAttempts} attempts per day. An attempt is spent when you enter. Defeat the boss before falling; retreating or dying forfeits the attempt but not your gear. Membership grants one extra attempt per dungeon.</p>
      <div class="flex wrap mt-2" style="gap:5px">${chip(`${maxAttempts} per dungeon today`, '', 'gate')}${chip('Boss-only fight', 'red', 'skull')}${chip('Guaranteed drops', 'gold', 'chest')}</div>
    </section>
    <section class="panel pad">
      <span class="eyebrow">Preparation</span>
      <h3 style="font-size:14px;margin-bottom:6px">Before you descend</h3>
      <div class="mini-set">
        <div class="ms-row"><span>Battle power</span><span class="spacer"></span><b>${fmt(stats.power)}</b></div>
        <div class="ms-row"><span>HP / MP</span><span class="spacer"></span><span>${fmt(stats.maxHp)} / ${fmt(stats.maxMp)}</span></div>
        <div class="ms-row"><span>Active bonds</span><span class="spacer"></span><span>${[state.hero.pets.active, state.hero.mounts.active, state.hero.companions.active].filter(Boolean).length}/3</span></div>
        <div class="ms-row"><span>Protection scrolls</span><span class="spacer"></span><span>${state.hero.materials.protection || 0}</span></div>
      </div>
      <div class="flex wrap mt-2" style="gap:6px">
        <button class="btn tiny ghost" data-nav="forge" type="button">${icon('hammer')} Forge</button>
        <button class="btn tiny ghost" data-nav="companions" type="button">${icon('paw')} Bonds</button>
      </div>
    </section>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-dungeon-enter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dungeon = DUNGEONS.find(d => d.id === btn.dataset.dungeonEnter);
      if (!dungeon) return;
      const region = REGIONS.find(r => r.id === dungeon.regionId);
      const start = (region?.index - 1) * 20 + 1 || 1;
      if (Engine.state.progress.unlockedIndex < start) {
        return ctx.toast?.(`Clear stage ${start - 1} to unlock ${dungeon.name}.`, 'danger');
      }
      if (dungeonAttemptsLeft(Engine.state, dungeon.id) <= 0) return ctx.toast?.('No attempts remain today.', 'danger');
      const under = Engine.state.hero.level < dungeon.level - 5;
      confirmModal({
        title: `Enter ${dungeon.name}?`,
        message: `One attempt will be spent. <b>${esc(dungeon.boss.name)}</b> awaits at recommended level ${dungeon.level}.${under ? ' Your hero is below the recommended level — this will be dangerous.' : ''}`,
        confirmLabel: 'Descend',
        danger: under,
        onConfirm: () => {
          const res = Engine.startDungeon(dungeon.id);
          if (!res.ok) return ctx.toast?.(res.message || 'The gate will not open.', 'danger');
          ctx.navigate('home');
        },
      });
    });
  });

  root.querySelectorAll('[data-dungeon-flee]').forEach(btn => {
    btn.addEventListener('click', () => {
      Engine.travelStage(Engine.state.progress.currentIndex);
      ctx.toast?.('You retreat to the hunt. The expedition is lost.', 'info');
      ctx.navigate('home');
    });
  });
}
