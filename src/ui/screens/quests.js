/* Chronicle — daily contracts, long-term milestones and a record of deeds. */

import { Engine } from '../../core/engine.js';
import { DAILY_CONTRACTS, MILESTONES, METRIC_LABELS } from '../../data/quests.js';
import { availableClaims, dailyProgress, metricValue } from '../../core/progression.js';
import { MATERIALS } from '../../data/items.js';
import { esc, fmt, pageHead, chip } from '../components.js';
import { icon } from '../icons.js';

function rewardChips(rewards = []) {
  return rewards.map(reward => {
    if (reward.type === 'gold') return chip(`${fmt(reward.amount)} gold`, 'gold', 'coin');
    if (reward.type === 'premium') return chip(`${fmt(reward.amount)} coins`, 'violet', 'premium');
    if (reward.type === 'material') return chip(`${MATERIALS[reward.key]?.name || reward.key} ×${reward.amount}`, '', MATERIALS[reward.key]?.icon || 'gem');
    if (reward.type === 'item') return chip(reward.item?.name || 'Relic', '', 'bag');
    if (reward.type === 'stone') return chip('Runestone', '', 'gem');
    return '';
  }).join('');
}

function dailyCard(contract, state) {
  const value = dailyProgress(state, contract);
  const done = state.daily.claimed.includes(contract.id);
  const ready = !done && value >= contract.target;
  const pct = Math.min(100, value / contract.target * 100);
  return `<article class="quest-card ${done ? 'claimed' : ''}">
    <div class="q-head">
      <div class="q-icon">${icon(contract.icon || 'scroll')}</div>
      <div style="flex:1;min-width:0">
        <div class="q-title">${esc(contract.name)}</div>
        <div class="q-desc">${esc(contract.desc)}</div>
      </div>
      <span class="pill ${done ? '' : ready ? 'green' : ''}">${done ? 'Claimed' : ready ? 'Ready' : 'Active'}</span>
    </div>
    <div class="quest-rewards">${rewardChips(contract.rewards)}</div>
    <div class="quest-foot">
      <div class="bar xp thin"><span style="width:${done ? 100 : pct}%"></span></div>
      <span class="q-count">${fmt(Math.min(value, contract.target))} / ${fmt(contract.target)}</span>
      ${ready ? `<button class="btn tiny" data-quest-claim="daily" data-id="${contract.id}" type="button">${icon('check')} Claim</button>` : ''}
    </div>
  </article>`;
}

function milestoneCard(ms, state, stats) {
  const value = metricValue(state, ms.metric, stats);
  const claimed = state.milestones.claimed.includes(ms.id);
  const ready = !claimed && value >= ms.target;
  const pct = Math.min(100, value / ms.target * 100);
  return `<div class="milestone ${ready ? 'done' : ''}">
    <div class="m-icon">${icon(ms.icon || 'spark')}</div>
    <div class="m-info">
      <div class="m-name">${esc(ms.name)}</div>
      <div class="m-desc">${esc(ms.desc)} · ${esc(METRIC_LABELS[ms.metric] || ms.metric)} ${fmt(Math.min(value, ms.target))}/${fmt(ms.target)}</div>
      <div class="bar xp thin" style="margin-top:4px"><span style="width:${claimed ? 100 : pct}%"></span></div>
      <div class="m-reward" style="margin-top:3px">${rewardChips(ms.rewards)}</div>
    </div>
    ${claimed
      ? `<span class="pill">${icon('check')} Claimed</span>`
      : ready
        ? `<button class="btn tiny" data-quest-claim="milestone" data-id="${ms.id}" type="button">Claim</button>`
        : `<span class="pill">${Math.round(pct)}%</span>`}
  </div>`;
}

export function render(ctx) {
  const { state, stats } = ctx;
  const claims = availableClaims(state, stats);
  const dailyDone = DAILY_CONTRACTS.filter(c => state.daily.claimed.includes(c.id)).length;
  const msDone = MILESTONES.filter(m => state.milestones.claimed.includes(m.id)).length;

  return `
  ${pageHead('Chronicle', `${claims.total} rewards ready · contracts reset at midnight`,
    `<button class="btn ghost" data-nav="home" type="button">${icon('home')} Adventure</button>`, 'Deeds & contracts')}

  <div class="grid-4" style="margin-bottom:14px">
    <div class="panel pad"><span class="eyebrow">Daily</span><div style="font-family:var(--serif);font-size:22px;color:var(--ivory)">${dailyDone}/${DAILY_CONTRACTS.length}</div><div class="muted" style="font-size:9px">${claims.daily} ready to claim · day ${esc(state.daily.dayKey || '')}</div></div>
    <div class="panel pad"><span class="eyebrow">Milestones</span><div style="font-family:var(--serif);font-size:22px;color:var(--ivory)">${msDone}/${MILESTONES.length}</div><div class="muted" style="font-size:9px">${claims.milestones} ready to claim</div></div>
    <div class="panel pad"><span class="eyebrow">Monsters slain</span><div style="font-family:var(--serif);font-size:22px;color:var(--ivory)">${fmt(state.stats.kills)}</div><div class="muted" style="font-size:9px">${fmt(state.stats.bossKills)} bosses felled</div></div>
    <div class="panel pad"><span class="eyebrow">Gold earned</span><div style="font-family:var(--serif);font-size:22px;color:var(--gold-bright)">${fmt(state.stats.goldEarned)}</div><div class="muted" style="font-size:9px">${fmt(state.stats.itemsFound)} relics found</div></div>
  </div>

  <div class="section-title"><h2>Daily contracts</h2><span class="count">Claimed: ${dailyDone} of ${DAILY_CONTRACTS.length}</span></div>
  <div class="quest-grid">
    ${DAILY_CONTRACTS.map(c => dailyCard(c, state)).join('')}
  </div>

  <div class="section-title mt-3"><h2>Chronicle milestones</h2><span class="count">Permanent progress · ${msDone} of ${MILESTONES.length} claimed</span></div>
  <section class="panel pad">
    <div class="milestone-grid">
      ${MILESTONES.map(m => milestoneCard(m, state, stats)).join('')}
    </div>
  </section>

  <div class="grid-2 mt-3">
    <section class="panel pad">
      <span class="eyebrow">Records</span>
      <h3 style="font-size:14px;margin-bottom:7px">The hero's tally</h3>
      <div class="mini-set">
        <div class="ms-row"><span>Best power</span><span class="spacer"></span><span class="pill gold">${fmt(state.stats.bestPower || 0)}</span></div>
        <div class="ms-row"><span>Best upgrade</span><span class="spacer"></span><span class="pill">+${fmt(state.stats.bestUpgrade || 0)}</span></div>
        <div class="ms-row"><span>Stages cleared</span><span class="spacer"></span><span class="pill">${fmt(state.stats.stagesCleared || 0)}</span></div>
        <div class="ms-row"><span>Dungeon clears</span><span class="spacer"></span><span class="pill">${fmt(state.stats.dungeonClears || 0)}</span></div>
        <div class="ms-row"><span>Fusions</span><span class="spacer"></span><span class="pill">${fmt(state.stats.fusions || 0)}</span></div>
        <div class="ms-row"><span>Divine relics owned</span><span class="spacer"></span><span class="pill">${fmt(state.stats.divineOwned || 0)}</span></div>
      </div>
    </section>
    <section class="panel pad">
      <span class="eyebrow">Rules of the chronicle</span>
      <h3 style="font-size:14px;margin-bottom:5px">How to claim</h3>
      <p class="muted" style="font-size:10px;line-height:1.6">Daily contracts track progress automatically while you hunt and forge. They reset at local midnight. Milestones never reset — every kill, fusion, upgrade and boss counts forever.</p>
      <div class="flex wrap mt-2" style="gap:5px">
        ${chip('Auto-tracked', 'green', 'check')}
        ${chip('Midnight reset', '', 'clock')}
        ${chip('No paywall', '', 'spark')}
      </div>
    </section>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-quest-claim]').forEach(btn => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.questClaim;
      const id = btn.dataset.id;
      const res = kind === 'daily' ? Engine.claimDaily(id) : Engine.claimMilestone(id);
      if (!res.ok) return ctx.toast?.(res.message || 'This reward is not ready yet.', 'danger');
      ctx.refresh();
    });
  });
}
