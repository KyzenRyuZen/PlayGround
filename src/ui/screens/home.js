/* Home dashboard — the live hunt at a glance. */

import { Engine } from '../../core/engine.js';
import { stageCoords, stageKind, MONSTERS } from '../../data/monsters.js';
import { DAILY_CONTRACTS, MILESTONES, METRIC_LABELS } from '../../data/quests.js';
import { availableClaims, dailyProgress, metricValue, stageKillsRequired } from '../../core/progression.js';
import { CLASSES } from '../../data/classes.js';
import { esc, fmt, bar, itemIcon, chip, emptyState } from '../components.js';
import { icon } from '../icons.js';
import { monsterArt } from '../sprites.js';

const QUICK_ACTIONS = [
  { route: 'inventory', icon: 'bag', label: 'Satchel' },
  { route: 'forge', icon: 'hammer', label: 'Forge' },
  { route: 'fusion', icon: 'merge', label: 'Fusion' },
  { route: 'stones', icon: 'gem', label: 'Stones' },
  { route: 'companions', icon: 'paw', label: 'Bonds' },
  { route: 'shop', icon: 'shop', label: 'Market' },
];

export function render(ctx) {
  const { state, stats } = ctx;
  const coords = stageCoords(state.progress.currentIndex);
  const kind = stageKind(coords.stage);
  const region = coords.region;
  const need = stageKillsRequired(state, state.progress.currentIndex);
  const cleared = !!state.progress.cleared[String(state.progress.currentIndex)];
  const progress = cleared ? 1 : Math.min(1, state.progress.stageKills / need);
  const cls = CLASSES[state.hero.classId];
  const claims = availableClaims(state, stats);
  const now = Date.now();
  const chestReady = now - (state.hero.freeChestAt || 0) >= 20 * 3600 * 1000;
  const chestLeft = Math.max(0, 20 * 3600 * 1000 - (now - (state.hero.freeChestAt || 0)));
  const spoils = Engine.recentDrops.slice(0, 6);
  const activePet = state.hero.pets?.active;
  const activeMount = state.hero.mounts?.active;
  const activeComp = state.hero.companions?.active;
  const kindLabel = kind === 'boss' ? 'Region boss' : kind === 'miniboss' ? 'Elite guardian' : 'Hunting grounds';
  const targetName = kind === 'boss' ? region.boss.name : kind === 'miniboss' ? region.miniboss.name : null;

  const questRows = DAILY_CONTRACTS.slice(0, 3).map(c => {
    const value = dailyProgress(state, c);
    const done = state.daily.claimed.includes(c.id);
    const ready = !done && value >= c.target;
    return `<div class="quick-quest">
      <span class="qq-check ${done || ready ? 'done' : ''}">${icon(done || ready ? 'check' : 'clock')}</span>
      <span class="qq-text">${esc(c.name)}</span>
      <span class="qq-prog">${done ? 'Claimed' : `${fmt(Math.min(value, c.target))}/${fmt(c.target)}`}</span>
      ${ready ? `<button class="btn tiny" data-home-action="claim-daily" data-id="${c.id}" type="button">Claim</button>` : ''}
    </div>`;
  }).join('');

  const milestoneRows = MILESTONES.filter(m => !state.milestones.claimed.includes(m.id)).slice(0, 4).map(m => {
    const value = metricValue(state, m.metric, stats);
    const pct = Math.min(100, value / m.target * 100);
    return `<div class="quick-quest">
      <span class="qq-check ${value >= m.target ? 'done' : ''}">${icon(value >= m.target ? 'check' : 'spark')}</span>
      <span class="qq-text">${esc(m.name)} <span class="dim">· ${esc(METRIC_LABELS[m.metric] || m.metric)}</span></span>
      <span class="qq-prog">${fmt(Math.min(value, m.target))}/${fmt(m.target)}</span>
      ${value >= m.target ? `<button class="btn tiny" data-home-action="claim-milestone" data-id="${m.id}" type="button">Claim</button>` : `<span class="bar thin" style="width:54px"><span style="width:${pct}%"></span></span>`}
    </div>`;
  }).join('');

  return `
  <div class="home-grid">
    <section class="panel pad hunt-card" style="--world-glow:${region.palette.glow}">
      <div class="hunt-head">
        <div>
          <div class="hunt-sub">${esc(kindLabel)} · ${esc(region.short)}</div>
          <div class="hunt-title">${esc(region.name)} — Stage ${coords.stage}</div>
          <div class="muted" style="font-size:10px;margin-top:3px">${esc(region.subtitle)}</div>
        </div>
        <div class="hunt-controls">
          <button class="btn tiny ${state.hero.autoSkills ? 'secondary' : 'ghost'}" data-home-action="skills" type="button" title="Automatically cast unlocked skills">${icon('sparkles')} Auto skills</button>
          <button class="btn tiny ${state.progress.autoAdvance ? 'secondary' : 'ghost'}" data-home-action="advance" type="button" title="Move to the next stage when cleared">${icon('arrowRight')} Auto advance</button>
        </div>
      </div>

      <div class="hunt-monsters">
        ${region.monsters.map(id => {
          const mon = MONSTERS[id];
          return `<span class="monster-chip" title="${esc(mon.lore)}">${monsterArt(mon.visual, region.palette)}${esc(mon.name)}</span>`;
        }).join('')}
      </div>

      <div class="panel" style="padding:11px 12px;background:rgba(6,5,10,.32)">
        <div class="flex between wrap" style="font-size:10px;color:var(--muted);margin-bottom:7px">
          <span>Now fighting <b class="gold" id="home-target-name">${esc(Engine.battle.monster?.name || (targetName || 'the next creature'))}</b></span>
          <span id="home-target-hp">—</span>
        </div>
        <div class="bar hp"><span id="home-target-bar" style="width:0%"></span></div>
      </div>

      <div class="hunt-progress">
        <div class="hunt-progress-meta">
          <span>${kind === 'boss' || kind === 'miniboss' ? 'Slay the guardian to clear' : 'Monsters culled this stage'}</span>
          <span id="home-progress-label">${cleared ? 'Stage cleared' : `${state.progress.stageKills} / ${need}`}</span>
        </div>
        ${bar(progress, 1, 'green')}
        <div class="bar xp thin mt-1"><span id="home-progress-bar" style="width:${(progress * 100).toFixed(1)}%"></span></div>
      </div>

      <div class="hunt-stats">
        <div class="hunt-stat"><span>Session kills</span><b id="home-session-kills">${fmt(state.session.kills || 0)}</b></div>
        <div class="hunt-stat"><span>Gold earned</span><b class="gold" id="home-session-gold">${fmt(state.session.gold || 0)}</b></div>
        <div class="hunt-stat"><span>Spoils</span><b id="home-session-drops">${fmt(state.session.drops || 0)}</b></div>
        <div class="hunt-stat"><span>Power</span><b>${fmt(stats.power)}</b></div>
      </div>

      <div class="flex between wrap mt-2">
        <div class="flex wrap" style="gap:5px">
          ${chip(`${cls.name} · Lv ${state.hero.level}`, 'gold', 'level')}
          ${chip(`Best power ${fmt(state.stats.bestPower || stats.power)}`, '', 'power')}
          ${cleared ? chip('Cleared', 'green', 'check') : chip(`${Math.round(progress * 100)}%`, '', 'target')}
        </div>
        <div class="flex" style="gap:5px">
          <button class="btn tiny" data-nav="stages" type="button">${icon('map')} World map</button>
          <button class="btn tiny secondary" data-nav="dungeons" type="button">${icon('gate')} Dungeons</button>
        </div>
      </div>
    </section>

    <div class="home-side">
      <section class="panel pad">
        <div class="flex between" style="margin-bottom:9px">
          <div><span class="eyebrow">Daily</span><h3 style="font-size:14px">Free cache</h3></div>
          <span class="pill ${chestReady ? 'gold' : ''}">${chestReady ? 'Ready' : 'Recharging'}</span>
        </div>
        ${chestReady
          ? `<div class="free-chest" style="margin-bottom:0"><div class="chest-icon">${icon('chest')}</div><div class="fc-info"><b>Rift-touched supplies</b><span>Gold, stone dust and perhaps a relic.</span></div><button class="btn tiny" data-home-action="freechest" type="button">Claim</button></div>`
          : `<div class="free-chest" style="margin-bottom:0"><div class="chest-icon" style="opacity:.5">${icon('chest')}</div><div class="fc-info"><b>Rift-touched supplies</b><span>Returns in ${Math.ceil(chestLeft / 3600000)}h ${Math.ceil((chestLeft % 3600000) / 60000)}m</span></div><span class="pill">${icon('clock')} Cooldown</span></div>`}
      </section>

      <section class="panel pad">
        <div class="flex between" style="margin-bottom:6px">
          <div><span class="eyebrow">Spoils</span><h3 style="font-size:14px">Recent drops</h3></div>
          <button class="link-btn" data-nav="inventory" type="button">All</button>
        </div>
        ${spoils.length ? `<div class="spoils-list">${spoils.map(item => `<div class="spoil r-${item.rarity}" style="--rarity:${rarityColor(item)}">${itemIcon(item, 'sm')}<div class="sp-meta"><div class="sp-name">${esc(item.name)}</div><div class="sp-sub">${esc(item.rarity)} · ${fmt(itemUpgradeText(item))}</div></div></div>`).join('')}</div>` : emptyState('bag', 'Nothing yet', 'The vale is quiet. Kill something.')}
      </section>

      <section class="panel pad">
        <div class="eyebrow" style="margin-bottom:7px">At a glance</div>
        <div class="mini-set">
          <div class="ms-row"><span>Automatic skills</span><span class="spacer"></span><span class="pill ${state.hero.autoSkills ? 'green' : ''}">${state.hero.autoSkills ? 'On' : 'Off'}</span></div>
          <div class="ms-row"><span>Auto advance</span><span class="spacer"></span><span class="pill ${state.progress.autoAdvance ? 'green' : ''}">${state.progress.autoAdvance ? 'On' : 'Off'}</span></div>
          <div class="ms-row"><span>Auto equip</span><span class="spacer"></span><span class="pill ${state.hero.autoEquip ? 'green' : ''}">${state.hero.autoEquip ? 'On' : 'Off'}</span></div>
          <div class="ms-row"><span>Bonds</span><span class="spacer"></span><span class="dim" style="font-size:8px">${[activePet, activeMount, activeComp].filter(Boolean).length}/3 active</span></div>
        </div>
      </section>
    </div>
  </div>

  <div class="home-lower">
    <section class="panel pad">
      <div class="flex between" style="margin-bottom:5px">
        <div><span class="eyebrow">Contracts</span><h3 style="font-size:14px">Today's work</h3></div>
        <span class="pill gold">${claims.daily} ready</span>
      </div>
      ${questRows || emptyState('scroll', 'No contracts', 'The board is empty today.')}
    </section>
    <section class="panel pad">
      <div class="flex between" style="margin-bottom:5px">
        <div><span class="eyebrow">Chronicle</span><h3 style="font-size:14px">Next milestones</h3></div>
        <button class="link-btn" data-nav="quests" type="button">See all</button>
      </div>
      ${milestoneRows || emptyState('crown', 'All milestones claimed', 'You have done the impossible. Twice.')}
    </section>
  </div>

  <div class="section-title"><h2>Quick passage</h2><span class="count">Six roads through the vale</span></div>
  <div class="quick-actions">
    ${QUICK_ACTIONS.map(a => `<button class="quick-action" data-nav="${a.route}" type="button">${icon(a.icon)}<span>${esc(a.label)}</span></button>`).join('')}
  </div>`;
}

function rarityColor(item) {
  const colors = { common: '#a9b2c0', rare: '#4d9df5', epic: '#ad74f5', legendary: '#f0b34e', mythic: '#ff5f7a', divine: '#5cf0d1' };
  return colors[item.rarity] || '#a9b2c0';
}
function itemUpgradeText(item) {
  return item.upgrade ? `+${item.upgrade}` : 'power ' + Math.round((item.base?.attack || 0) + (item.base?.defense || 0) + (item.base?.hp || 0) / 8);
}

export function mount(root, ctx) {
  const targetName = root.querySelector('#home-target-name');
  const targetHp = root.querySelector('#home-target-hp');
  const targetBar = root.querySelector('#home-target-bar');
  const progressBar = root.querySelector('#home-progress-bar');
  const progressLabel = root.querySelector('#home-progress-label');
  const killsEl = root.querySelector('#home-session-kills');
  const goldEl = root.querySelector('#home-session-gold');
  const dropsEl = root.querySelector('#home-session-drops');

  const tick = () => {
    const state = Engine.state;
    if (!state) return;
    const mon = Engine.battle?.monster;
    if (targetName) targetName.textContent = mon?.name || 'Searching the dark…';
    if (targetHp && mon) targetHp.textContent = `${fmt(Math.max(0, mon.hp))} / ${fmt(mon.maxHp)}`;
    if (targetBar && mon) targetBar.style.width = `${Math.max(0, Math.min(100, mon.hp / mon.maxHp * 100))}%`;
    if (targetBar && !mon) targetBar.style.width = '0%';
    const need = stageKillsRequired(state, state.progress.currentIndex);
    const cleared = !!state.progress.cleared[String(state.progress.currentIndex)];
    const pct = cleared ? 100 : Math.min(100, state.progress.stageKills / need * 100);
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressLabel) progressLabel.textContent = cleared ? 'Stage cleared' : `${state.progress.stageKills} / ${need}`;
    if (killsEl) killsEl.textContent = fmt(state.session?.kills || 0);
    if (goldEl) goldEl.textContent = fmt(state.session?.gold || 0);
    if (dropsEl) dropsEl.textContent = fmt(state.session?.drops || 0);
  };

  const timer = setInterval(tick, 700);
  tick();

  root.querySelectorAll('[data-home-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.homeAction;
      if (action === 'skills') { Engine.toggleAutoSkills(); ctx.refresh(); }
      else if (action === 'advance') { Engine.toggleAutoAdvance(); ctx.refresh(); }
      else if (action === 'freechest') { Engine.claimFreeChest(); ctx.refresh(); }
      else if (action === 'claim-daily') { Engine.claimDaily(btn.dataset.id); ctx.refresh(); }
      else if (action === 'claim-milestone') { Engine.claimMilestone(btn.dataset.id); ctx.refresh(); }
    });
  });

  return () => clearInterval(timer);
}
