/* Equipment — the nine relics arranged around the hero. */

import { Engine } from '../../core/engine.js';
import { SLOTS, SLOT_KEYS, RARITY_BY_ID } from '../../data/items.js';
import { itemScore, canEquipToClass } from '../../core/items.js';
import { esc, fmt, pageHead, sectionTitle, itemIcon, chip, emptyState, openModal, closeModal } from '../components.js';
import { icon } from '../icons.js';
import { heroArt, slotArt } from '../sprites.js';
import { statRows } from './util.js';

const PLACEMENT = {
  helmet: 'grid-column:1;grid-row:1',
  shield: 'grid-column:3;grid-row:1',
  necklace: 'grid-column:1;grid-row:2',
  earring: 'grid-column:3;grid-row:2',
  weapon: 'grid-column:1;grid-row:3',
  bracelet: 'grid-column:3;grid-row:3',
  armor: 'grid-column:1;grid-row:4',
  shoes: 'grid-column:3;grid-row:4',
  belt: 'grid-column:2;grid-row:5',
};

export function render(ctx) {
  const { state, stats } = ctx;
  const eq = state.hero.equipment;
  const filled = SLOT_KEYS.filter(s => eq[s]);
  const totalScore = filled.reduce((sum, s) => sum + itemScore(eq[s]), 0);

  const slotHTML = (slot) => {
    const item = eq[slot];
    const label = SLOTS[slot].label;
    if (!item) {
      return `<button class="equip-slot" style="${PLACEMENT[slot]}" data-equip-slot="${slot}" type="button" title="Equip a ${label.toLowerCase()}">
        <span class="slot-label">${esc(label)}</span>
        <span class="slot-empty-icon">${slotArt(slot, 30)}</span>
        <span class="slot-name">Empty · tap to equip</span>
      </button>`;
    }
    const rar = RARITY_BY_ID[item.rarity] || RARITY_BY_ID.common;
    return `<button class="equip-slot filled r-${rar.id}" style="${PLACEMENT[slot]};--rarity:${rar.color}" data-item-open="${item.id}" type="button" title="${esc(item.name)}">
      <span class="slot-label">${esc(label)}</span>
      ${itemIcon(item, 'sm')}
      <span class="slot-name">${esc(item.name)}${item.upgrade ? ` +${item.upgrade}` : ''}</span>
      <span class="slot-name" style="color:var(--muted-2)">${fmt(itemScore(item))} power</span>
    </button>`;
  };

  const gearStats = [
    ['attack', stats.attack], ['defense', stats.defense], ['hp', stats.maxHp], ['mp', stats.maxMp],
    ['critChance', stats.critChance], ['critDamage', stats.critDamage],
    ['attackSpeed', stats.attackSpeed], ['lifesteal', stats.lifesteal],
    ['penetration', stats.penetration], ['penPercent', stats.penPercent],
    ['monsterDamage', stats.monsterDamage], ['bossDamage', stats.bossDamage],
  ];

  return `
  ${pageHead('Equipment', `${filled.length} of 9 slots filled · ${fmt(totalScore)} gear power`,
    `<button class="btn secondary" data-eq-action="auto" type="button">${icon('sparkles')} Auto-equip best</button>
     <button class="btn ghost" data-nav="stones" type="button">${icon('gem')} Runestones</button>`, 'Relics of war')}

  <div class="equipment-layout">
    <section class="panel">
      <div class="panel-head"><div><span class="eyebrow">Paperdoll</span><h2 style="font-size:16px">Dressed for the descent</h2></div><span class="pill ${filled.length === 9 ? 'green' : ''}">${filled.length}/9</span></div>
      <div class="paperdoll">
        ${SLOT_KEYS.map(slotHTML).join('')}
        <div class="doll-center" style="grid-row:1 / 5">
          ${heroArt(state.hero.classId)}
          <div class="doll-power"><span class="eyebrow">Battle power</span><strong>${fmt(stats.power)}</strong></div>
        </div>
      </div>
    </section>

    <div class="flex-col" style="gap:14px">
      <section class="panel pad">
        ${sectionTitle('Equipment bonuses', 'Including forged upgrades and random bonuses')}
        <div class="equip-stats">${statRows(gearStats)}</div>
        <div class="set-bonus mt-3">
          <b>${filled.length === 9 ? 'Full panoply' : 'Incomplete panoply'}</b> — ${filled.length === 9 ? 'all nine slots are filled. The vale notices.' : `equip ${9 - filled.length} more ${9 - filled.length === 1 ? 'relic' : 'relics'} to complete the set.`}
        </div>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Quick glance</span>
        <h3 style="font-size:14px;margin-bottom:7px">Worn relics</h3>
        <div class="mini-set">
          ${SLOT_KEYS.map(slot => {
            const item = eq[slot];
            const rar = item ? RARITY_BY_ID[item.rarity] : null;
            return `<div class="ms-row"><span style="width:74px;color:var(--muted-2)">${esc(SLOTS[slot].label)}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${rar ? rar.color : 'var(--muted-2)'}">${item ? esc(item.name) + (item.upgrade ? ` +${item.upgrade}` : '') : '— empty —'}</span><span style="font-size:8px;color:var(--muted-2)">${item ? fmt(itemScore(item)) : ''}</span></div>`;
          }).join('')}
        </div>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Forged bonds</span>
        <h3 style="font-size:14px;margin-bottom:5px">Stones and costumes</h3>
        <p class="muted" style="font-size:10px;line-height:1.5">Runestones socketed at the forge and cosmetics from the wardrobe both feed the numbers above.</p>
        <div class="flex wrap mt-2" style="gap:5px">
          ${chip(`${state.hero.stones.equipped.filter(Boolean).length}/3 stones`, '', 'gem')}
          ${chip(`${Object.values(state.hero.costumes.equipped).filter(Boolean).length} cosmetics`, '', 'mask')}
        </div>
        <div class="flex wrap mt-2" style="gap:6px">
          <button class="btn tiny ghost" data-nav="stones" type="button">Socket stones</button>
          <button class="btn tiny ghost" data-nav="costumes" type="button">Wardrobe</button>
        </div>
      </section>
    </div>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-equip-slot]').forEach(btn => {
    btn.addEventListener('click', () => openSlotPicker(btn.dataset.equipSlot, ctx));
  });

  root.querySelector('[data-eq-action="auto"]')?.addEventListener('click', () => {
    const state = Engine.state;
    const snapshot = [...state.hero.inventory];
    const picks = [];
    for (const slot of SLOT_KEYS) {
      const current = state.hero.equipment[slot];
      const best = snapshot
        .filter(i => i.slot === slot && canEquipToClass(i, state.hero.classId))
        .sort((a, b) => itemScore(b) - itemScore(a))[0];
      if (best && itemScore(best) > itemScore(current)) picks.push(best);
    }
    if (!picks.length) return ctx.toast?.('Nothing in the satchel would improve the current outfit.', 'info');
    let equipped = 0;
    for (const item of picks) {
      const res = Engine.equipItem(item.id);
      if (res.ok) equipped++;
    }
    ctx.toast?.(`Equipped ${equipped} upgrade${equipped === 1 ? '' : 's'} from the satchel.`, 'success');
    ctx.refresh();
  });
}

function openSlotPicker(slot, ctx) {
  const state = Engine.state;
  const items = state.hero.inventory
    .filter(i => i.slot === slot && canEquipToClass(i, state.hero.classId))
    .sort((a, b) => itemScore(b) - itemScore(a));
  openModal({
    title: `Equip ${SLOTS[slot].label.toLowerCase()}`,
    eyebrow: `${items.length} compatible ${items.length === 1 ? 'relic' : 'relics'}`,
    body: items.length
      ? `<div class="picker-grid">${items.map(item => {
        const rar = RARITY_BY_ID[item.rarity] || RARITY_BY_ID.common;
        return `<button class="item-card r-${rar.id}" data-pick-item="${item.id}" type="button">
          ${itemIcon(item, 'sm')}
          <div class="item-meta"><div class="name">${esc(item.name)}${item.upgrade ? ` +${item.upgrade}` : ''}</div><div class="sub">${rar.name} · ${fmt(itemScore(item))} power</div></div>
          <div class="score">${fmt(itemScore(item))}</div>
        </button>`;
      }).join('')}</div>`
      : emptyState('bag', 'No compatible relics', `Find a ${SLOTS[slot].label.toLowerCase()} for your class in the satchel or on the hunt.`),
    footer: `<button class="btn ghost" data-modal-close type="button">Close</button>`,
    onMount(root) {
      root.querySelectorAll('[data-pick-item]').forEach(btn => {
        btn.addEventListener('click', () => {
          const res = Engine.equipItem(btn.dataset.pickItem);
          closeModal();
          if (!res.ok) ctx.toast?.(res.message || 'Could not equip that item.', 'danger');
          ctx.refresh();
        });
      });
    },
  });
}
