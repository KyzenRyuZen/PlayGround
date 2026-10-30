/* Runestones — socket magical stones, level them, reroll echoes and ascend. */

import { Engine } from '../../core/engine.js';
import {
  STONE_TYPES, STONE_GRADES, STONE_GRADE_BY_ID, STONE_SOCKET_LEVELS, MAX_STONE_SOCKETS,
} from '../../data/collections.js';
import { stoneLabel, stonePower, stoneMainValue } from '../../core/items.js';
import { statLabel, statSuffix } from '../../core/stats.js';
import { esc, fmt, fmt1, pageHead, chip, emptyState, openModal, closeModal } from '../components.js';
import { icon } from '../icons.js';

function stoneColor(stone) {
  return STONE_TYPES[stone.type]?.color || '#8d6cf2';
}

function orb(stone, size = '') {
  return `<span class="stone-orb ${size}" style="--stone-color:${stoneColor(stone)}"></span>`;
}

function socketStone(stoneId) {
  return Engine.state.hero.stones.owned.find(s => s.id === stoneId) || null;
}

export function render(ctx) {
  const { state } = ctx;
  const hero = state.hero;
  const stones = hero.stones.owned || [];
  const equipped = hero.stones.equipped || [];
  const energy = stones.reduce((sum, s) => sum + stonePower(s), 0);

  const socketHTML = Array.from({ length: MAX_STONE_SOCKETS }, (_, index) => {
    const unlocked = hero.level >= (STONE_SOCKET_LEVELS[index] || 1);
    const stone = socketStone(equipped[index]);
    if (!unlocked) {
      return `<button class="stone-socket" data-stone-socket="${index}" type="button" title="Unlocks at level ${STONE_SOCKET_LEVELS[index]}">
        ${icon('lock')}
        <span class="socket-label">Level ${STONE_SOCKET_LEVELS[index]}</span>
      </button>`;
    }
    if (!stone) {
      return `<button class="stone-socket" data-stone-socket="${index}" type="button" title="Set a runestone">
        ${icon('plus')}
        <span class="socket-label">Socket ${index + 1}</span>
      </button>`;
    }
    return `<button class="stone-socket filled" data-stone-id="${stone.id}" type="button" style="--stone-color:${stoneColor(stone)}" title="${esc(stoneLabel(stone))}">
      ${orb(stone)}
      <span class="socket-label">Socket ${index + 1}</span>
    </button>`;
  }).join('');

  const cards = stones.map(stone => {
    const type = STONE_TYPES[stone.type];
    const grade = STONE_GRADE_BY_ID[stone.grade];
    const socketIndex = equipped.indexOf(stone.id);
    return `<button class="stone-card ${socketIndex >= 0 ? 'equipped' : ''}" data-stone-id="${stone.id}" type="button" style="--stone-color:${stoneColor(stone)}">
      ${orb(stone, 'sm')}
      <span class="s-name">${esc(stoneLabel(stone))}</span>
      <span class="s-meta">Level ${stone.level}/${grade.maxLevel}${socketIndex >= 0 ? ` · Socket ${socketIndex + 1}` : ''}</span>
      <span class="s-bonus">${esc(type.label)} +${fmt1(stoneMainValue(stone))}</span>
      <span class="s-meta" style="color:var(--gold)">${esc(statLabel(stone.affix.stat))} +${fmt1(stone.affix.value)}${statSuffix(stone.affix.stat)}</span>
    </button>`;
  }).join('');

  return `
  ${pageHead('Runestones', `${stones.length} / 48 stones held · ${fmt(energy)} stone power · ${fmt(hero.materials.stoneDust || 0)} dust`,
    `<button class="btn ghost" data-nav="forge" type="button">${icon('hammer')} Forge</button>
     <button class="btn ghost" data-nav="stages" type="button">${icon('map')} Hunt stones</button>`, 'Sockets & ascension')}

  <div class="grid-2">
    <section class="panel pad">
      <div class="flex between wrap" style="margin-bottom:4px">
        <div><span class="eyebrow">Hero sockets</span><h3 style="font-size:15px">Three thrones of power</h3></div>
        <span class="pill ${equipped.filter(Boolean).length ? 'green' : ''}">${equipped.filter(Boolean).length}/${MAX_STONE_SOCKETS} set</span>
      </div>
      <div class="stone-sockets">${socketHTML}</div>
      <div class="muted" style="font-size:9px;text-align:center;line-height:1.55;margin-top:18px">
        Sockets unlock at hero levels ${STONE_SOCKET_LEVELS.join(', ')}. Every socketed stone grants its primary stat and its rolled echo bonus.
      </div>
      <div class="material-row mt-3" style="justify-content:center">
        ${chip(`${fmt(hero.materials.stoneDust || 0)} Stone Dust`, '', 'dust')}
        ${chip(`${fmt(hero.gold)} gold`, 'gold', 'coin')}
      </div>
    </section>

    <section class="panel pad">
      <span class="eyebrow">Stone lore</span>
      <h3 style="font-size:15px;margin-bottom:5px">What the rift leaves behind</h3>
      <p class="muted" style="font-size:10px;line-height:1.6">Stone monsters carry the richest shards. Chipped stones can be levelled to 5, then ascended with two more stones of the same type and grade plus Stone Dust.</p>
      <div class="mini-set mt-2">
        ${STONE_GRADES.map(g => `<div class="ms-row"><span style="width:70px;color:${g.color}">${esc(g.name)}</span><span class="spacer"></span><span class="dim">max level ${g.maxLevel} · ×${g.mult} power</span></div>`).join('')}
      </div>
      <div class="muted" style="font-size:8.5px;margin-top:8px">Ascension rerolls the echo but resets the stone to level 1 of its new grade.</div>
    </section>
  </div>

  <div class="section-title mt-3"><h2>Stone vault</h2><span class="count">${stones.length} held · ${48 - stones.length} free slots</span></div>
  <section class="panel pad">
    ${cards ? `<div class="stone-grid">${cards}</div>` : emptyState('gem', 'The vault is empty', 'Stone monsters and dungeon bosses drop runestones. The free cache may also hold one.')}
  </section>`;
}

function openStoneModal(stone, ctx) {
  if (!stone) return;
  const hero = Engine.state.hero;
  const type = STONE_TYPES[stone.type];
  const grade = STONE_GRADE_BY_ID[stone.grade];
  const gradeIndex = STONE_GRADES.findIndex(g => g.id === stone.grade);
  const nextGrade = STONE_GRADES[gradeIndex + 1] || null;
  const socketIndex = hero.stones.equipped.indexOf(stone.id);
  const maxed = stone.level >= grade.maxLevel;
  const levelDust = 4 + stone.level * 3;
  const levelGold = 120 + stone.level * 90;
  const rerollDust = 7 + stone.level * 2;
  const rerollGold = 200 + stone.level * 55;
  const ascendDust = 30 + gradeIndex * 20;
  const fuel = hero.stones.owned.filter(s => s.id !== stone.id && s.type === stone.type && s.grade === stone.grade);
  const canLevel = !maxed && (hero.materials.stoneDust || 0) >= levelDust && hero.gold >= levelGold;
  const canReroll = (hero.materials.stoneDust || 0) >= rerollDust && hero.gold >= rerollGold;
  const canAscend = maxed && !!nextGrade && fuel.length >= 2 && (hero.materials.stoneDust || 0) >= ascendDust;

  openModal({
    title: stoneLabel(stone),
    eyebrow: `${grade.name} ${type.name} · level ${stone.level}`,
    body: `<div class="stone-detail r-${hero.stones.equipped.includes(stone.id) ? 'legendary' : 'epic'}" style="--stone-color:${stoneColor(stone)}">
      ${orb(stone, 'lg')}
      <div class="sd-info">
        <div class="eyebrow">${esc(type.desc)}</div>
        <h3 style="color:${stoneColor(stone)}">${esc(stoneLabel(stone))}</h3>
        <div class="stone-main-stat"><b>+${fmt1(stoneMainValue(stone))}</b><span>${esc(type.label)}</span></div>
        <div class="stone-xp">
          <span>Level ${stone.level} / ${grade.maxLevel}</span>
          <div class="bar xp thin" style="flex:1"><span style="width:${Math.min(100, stone.level / grade.maxLevel * 100)}%"></span></div>
          <span class="pill gold">${fmt(stonePower(stone))} power</span>
        </div>
        <div class="affix-row mt-2">
          <span class="aff-name">Echo · ${esc(statLabel(stone.affix.stat))}</span>
          <span class="aff-val">+${fmt1(stone.affix.value)}${statSuffix(stone.affix.stat)}</span>
        </div>
      </div>
    </div>
    <div class="forge-costs mt-3">
      <div class="cost-chip ${hero.gold < levelGold ? 'bad' : ''}">${icon('coin')} Gold <b>${fmt(levelGold)}</b></div>
      <div class="cost-chip ${(hero.materials.stoneDust || 0) < levelDust ? 'bad' : ''}">${icon('dust')} Dust <b>${levelDust}</b></div>
      <div class="cost-chip ${fuel.length < 2 ? 'bad' : 'good'}">${icon('gem')} Fuel <b>${fuel.length}/2</b></div>
      <div class="cost-chip">${icon('power')} Grade <b>${grade.name}</b></div>
    </div>
    <div class="muted" style="font-size:9px;line-height:1.5;margin-top:9px">
      ${nextGrade ? `Ascension: reach level ${grade.maxLevel}, sacrifice 2 more ${grade.name} ${type.name}s and ${ascendDust} dust to become a ${nextGrade.name} ${type.name} (max level ${nextGrade.maxLevel}).` : 'Royal is the final grade. Continue levelling its echo with dust.'}
    </div>`,
    footer: `${socketIndex >= 0 ? `<button class="btn ghost" data-stone-act="unsocket" type="button">${icon('close')} Unsocket</button>` : `<button class="btn ghost" data-stone-act="socket" type="button">${icon('gem')} Socket</button>`}
      <button class="btn ghost" data-stone-act="reroll" type="button" ${canReroll ? '' : 'disabled'}>${icon('refresh')} Echo · ${fmt(rerollGold)}g</button>
      <button class="btn secondary" data-stone-act="ascend" type="button" ${canAscend ? '' : 'disabled'}>${icon('spark')} Ascend</button>
      <button class="btn" data-stone-act="level" type="button" ${canLevel ? '' : 'disabled'}>${maxed ? 'Max level' : `Level up`}</button>`,
    onMount(root) {
      root.querySelectorAll('[data-stone-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const act = btn.dataset.stoneAct;
          let res;
          if (act === 'level') res = Engine.levelStone(stone.id);
          else if (act === 'reroll') res = Engine.rerollStone(stone.id);
          else if (act === 'ascend') res = Engine.ascendStone(stone.id);
          else if (act === 'socket') res = Engine.equipStone(stone.id);
          else if (act === 'unsocket') res = Engine.unequipStone(hero.stones.equipped.indexOf(stone.id));
          if (res && !res.ok) return ctx.toast?.(res.message || 'The stone resists.', 'danger');
          closeModal();
          ctx.refresh();
        });
      });
    },
  });
}

function openSocketPicker(index, ctx) {
  const hero = Engine.state.hero;
  if (hero.level < (STONE_SOCKET_LEVELS[index] || 1)) {
    return ctx.toast?.(`This socket unlocks at hero level ${STONE_SOCKET_LEVELS[index]}.`, 'info');
  }
  const available = hero.stones.owned.filter(s => !hero.stones.equipped.includes(s.id));
  if (!available.length) return ctx.toast?.('No free runestones in the vault.', 'info');
  openModal({
    title: `Socket ${index + 1}`,
    eyebrow: `${available.length} free runestones`,
    body: `<div class="stone-grid">${available.map(stone => `<button class="stone-card" data-stone-socket-pick="${stone.id}" type="button" style="--stone-color:${stoneColor(stone)}">
      ${orb(stone, 'sm')}
      <span class="s-name">${esc(stoneLabel(stone))}</span>
      <span class="s-meta">Level ${stone.level}</span>
      <span class="s-bonus">${esc(STONE_TYPES[stone.type].label)} +${fmt1(stoneMainValue(stone))}</span>
    </button>`).join('')}</div>`,
    footer: '<button class="btn ghost" data-modal-close type="button">Close</button>',
    onMount(root) {
      root.querySelectorAll('[data-stone-socket-pick]').forEach(btn => {
        btn.addEventListener('click', () => {
          const res = Engine.equipStone(btn.dataset.stoneSocketPick, index);
          closeModal();
          if (!res.ok) return ctx.toast?.(res.message || 'Could not socket that stone.', 'danger');
          ctx.refresh();
        });
      });
    },
  });
}

export function mount(root, ctx) {
  const hero = Engine.state.hero;

  root.querySelectorAll('[data-stone-id]').forEach(btn => {
    btn.addEventListener('click', () => openStoneModal(hero.stones.owned.find(s => s.id === btn.dataset.stoneId), ctx));
  });

  root.querySelectorAll('[data-stone-socket]').forEach(btn => {
    const index = Number(btn.dataset.stoneSocket);
    const stone = socketStone(hero.stones.equipped[index]);
    btn.addEventListener('click', () => {
      if (stone) openStoneModal(stone, ctx);
      else openSocketPicker(index, ctx);
    });
  });
}
