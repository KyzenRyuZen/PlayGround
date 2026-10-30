/* Blacksmith — upgrade, enchant and temper relic bonuses. */

import { Engine } from '../../core/engine.js';
import { GAME } from '../../config.js';
import {
  RARITY_BY_ID, SLOTS, MATERIALS,
  upgradeChance, upgradeGoldCost, upgradeStoneCost, upgradeEmberCost,
  UPGRADE_DOWNGRADE_RISK, UPGRADE_BREAK_RISK,
} from '../../data/items.js';
import { itemScore, itemSellPrice, canEquipToClass } from '../../core/items.js';
import { statLabel, statSuffix } from '../../core/stats.js';
import { esc, fmt, fmt1, pageHead, itemIcon, chip, materialRow, confirmModal, emptyState } from '../components.js';
import { icon } from '../icons.js';
import { itemArt } from '../sprites.js';
import { itemPicker } from './util.js';

export function render(ctx) {
  const { state } = ctx;
  const hero = state.hero;
  const all = [...Object.values(hero.equipment).filter(Boolean), ...hero.inventory];
  const selected = all.find(i => i.id === ctx.params?.itemId) || null;
  const equippedIds = new Set(Object.values(hero.equipment).filter(Boolean).map(i => i.id));
  const mats = hero.materials;

  const picker = itemPicker(all, {
    action: 'forge-pick',
    selectedId: selected?.id,
    equippedIds,
    art: item => itemArt(item, 36, RARITY_BY_ID[item.rarity]?.color),
    emptyTitle: 'No relics to forge',
    emptyText: 'Kill something and come back with better steel.',
  });

  return `
  ${pageHead('Blacksmith', `${fmt(hero.gold)} gold · ${fmt(mats.upgradeStone || 0)} upgrade stones · ${fmt(mats.ember || 0)} embers`,
    `<button class="btn ghost" data-nav="fusion" type="button">${icon('merge')} Fusion</button>
     <button class="btn ghost" data-nav="stones" type="button">${icon('gem')} Runestones</button>`, 'The forge')}

  <div class="material-row" style="margin-bottom:12px">
    ${materialRow({ upgradeStone: mats.upgradeStone, ember: mats.ember, protection: mats.protection, enchant: mats.enchant, chaos: mats.chaos, blessing: mats.blessing })}
  </div>

  <div class="forge-layout">
    <section class="panel pad">
      <div class="flex between wrap" style="margin-bottom:9px">
        <div><span class="eyebrow">Anvil</span><h3 style="font-size:15px">Choose a relic</h3></div>
        <span class="pill">${all.length} relics</span>
      </div>
      ${picker}
    </section>

    <div class="flex-col" style="gap:14px">
      ${selected ? forgeDetail(selected, hero, mats) : `<section class="panel pad">${emptyState('hammer', 'Nothing on the anvil', 'Select a weapon, armor piece or trinket from the left to begin.')}</section>`}
    </div>
  </div>`;
}

function forgeDetail(item, hero, mats) {
  const rar = RARITY_BY_ID[item.rarity] || RARITY_BY_ID.common;
  const level = item.upgrade || 0;
  const maxed = level >= GAME.maxItemUpgrade;
  const target = Math.min(GAME.maxItemUpgrade, level + 1);
  const chance = upgradeChance(level);
  const gold = upgradeGoldCost(item.ilvl, level);
  const stones = upgradeStoneCost(item.ilvl, level);
  const embers = upgradeEmberCost(level);
  const breakRisk = UPGRADE_BREAK_RISK[target] || 0;
  const downRisk = UPGRADE_DOWNGRADE_RISK[target] || 0;
  const canAfford = hero.gold >= gold && (mats.upgradeStone || 0) >= stones && (mats.ember || 0) >= embers;
  const affixes = item.affixes || [];
  const addCost = 420 + item.ilvl * 26;
  const rerollCost = 300 + item.ilvl * 18;

  return `<section class="panel">
    <div class="forge-item">
      ${itemIcon(item, 'xl')}
      <div style="flex:1;min-width:0">
        <div class="forge-name">${esc(item.name)}</div>
        <div class="forge-sub">${rar.name} ${esc(SLOTS[item.slot]?.label || '')} · item level ${item.ilvl} · ${fmt(itemScore(item))} power · ${fmt(itemSellPrice(item))}g value</div>
        <div class="flex wrap mt-1" style="gap:4px">
          ${chip(`+${level} / +${GAME.maxItemUpgrade}`, level > 0 ? 'gold' : '', 'hammer')}
          ${item.classReq ? chip(`${item.classReq} only`, canEquipToClass(item, hero.classId) ? '' : 'red', 'lock') : ''}
          ${item.locked ? chip('Locked', 'violet', 'lock') : ''}
        </div>
      </div>
      <div class="upgrade-plus">+${level} → +${maxed ? 'MAX' : target}</div>
    </div>

    <div class="panel-body">
      <div class="flex between wrap" style="gap:12px;margin-bottom:12px">
        <div class="success-ring" style="--pct:${maxed ? 100 : Math.round(chance * 100)};--ring-color:${maxed ? 'var(--green)' : rar.color}">
          <div class="ring-text"><strong>${maxed ? 'MAX' : `${Math.round(chance * 100)}%`}</strong><span>${maxed ? 'complete' : 'success'}</span></div>
        </div>
        <div style="flex:1;min-width:150px">
          <div class="bar-row"><span class="bar-label">Upgrade level</span><div class="bar xp"><span style="width:${level / GAME.maxItemUpgrade * 100}%"></span></div><span class="bar-value">+${level}</span></div>
          <div class="muted" style="font-size:9px;line-height:1.5;margin-top:5px">Each level grants +7% base stats. From +5 a failure can downgrade; from +10 it can shatter the relic unless a Protection Scroll is used.</div>
        </div>
      </div>

      <div class="forge-costs">
        <div class="cost-chip ${hero.gold < gold ? 'bad' : ''}">${icon('coin')} Gold <b>${fmt(gold)}</b></div>
        <div class="cost-chip ${(mats.upgradeStone || 0) < stones ? 'bad' : ''}">${icon('stone')} Stones <b>${stones}</b></div>
        <div class="cost-chip ${embers && (mats.ember || 0) < embers ? 'bad' : ''}">${icon('ember')} Embers <b>${embers || '—'}</b></div>
        <div class="cost-chip ${(mats.protection || 0) < 1 ? '' : 'good'}">${icon('scroll')} Scrolls <b>${mats.protection || 0}</b></div>
      </div>

      ${!maxed ? `<div class="toggle" style="margin:11px 0 4px"><input type="checkbox" id="forge-protection" ${(mats.protection || 0) < 1 ? 'disabled' : ''}><span class="track"></span><span class="label">Use Protection Scroll <span class="dim">(${mats.protection || 0} held)</span></span></div>` : ''}

      <div class="flex wrap" style="gap:6px">
        <button class="btn ${canAfford && !maxed ? '' : 'ghost'}" data-forge-action="upgrade" type="button" style="flex:1" ${maxed || !canAfford ? 'disabled' : ''}>${icon('hammer')} ${maxed ? 'Maximum upgrade' : `Forge to +${target}`}</button>
        <button class="btn tiny ghost" data-nav="fusion" type="button" title="Fuse four identical items">${icon('merge')} Fuse copies</button>
      </div>
      ${!maxed ? `<div class="muted" style="font-size:8.5px;margin-top:5px">${downRisk ? `Downgrade risk ${Math.round(downRisk * 100)}% · ` : ''}${breakRisk ? `break risk ${Math.round(breakRisk * 100)}% · ` : ''}On failure without a scroll: ${downRisk || breakRisk ? 'risk applies.' : 'nothing is lost.'}</div>` : ''}
    </div>

    <div class="panel-head" style="border-top:1px solid var(--line)"><div><span class="eyebrow">Random bonuses</span><h2 style="font-size:14px">${affixes.length} of 5 affixes</h2></div><span class="pill">${icon('sparkles')} ${affixes.length}</span></div>
    <div class="panel-body">
      <div class="affix-list">
        ${affixes.length ? affixes.map((affix, index) => `<div class="affix-row">
          <span class="aff-name">${esc(statLabel(affix.stat))}${affix.forged ? ` <span class="aff-forge">tempered ${affix.forged}/${GAME.maxAffixForges}</span>` : ''}</span>
          <span class="aff-val">+${fmt1(affix.value)}${statSuffix(affix.stat)}</span>
          <button class="btn tiny ghost" data-forge-action="temper" data-index="${index}" type="button" ${(affix.forged || 0) >= GAME.maxAffixForges ? 'disabled' : ''}>Temper</button>
        </div>`).join('') : `<div class="muted" style="font-size:10px">This relic carries no random bonuses yet.</div>`}
      </div>
      <div class="forge-costs mt-3">
        <button class="btn tiny ${affixes.length < 5 && (mats.enchant || 0) > 0 && hero.gold >= addCost ? '' : 'ghost'}" data-forge-action="add" type="button" ${affixes.length >= 5 || (mats.enchant || 0) < 1 || hero.gold < addCost ? 'disabled' : ''}>${icon('plus')} Add bonus · ${fmt(addCost)}g + scroll</button>
        <button class="btn tiny ${affixes.length && (mats.chaos || 0) > 0 && hero.gold >= rerollCost ? '' : 'ghost'}" data-forge-action="reroll" type="button" ${!affixes.length || (mats.chaos || 0) < 1 || hero.gold < rerollCost ? 'disabled' : ''}>${icon('refresh')} Reroll · ${fmt(rerollCost)}g + orb</button>
      </div>
      <div class="muted" style="font-size:8.5px;margin-top:6px">Tempering costs ${fmt(200 + item.ilvl * 12)}g and 1 Blessing Dust, raising one bonus by 8% up to ${GAME.maxAffixForges} times.</div>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-forge-pick]').forEach(btn => {
    btn.addEventListener('click', () => ctx.refresh({ itemId: btn.dataset.forgePick }));
  });

  const id = ctx.params?.itemId;
  if (!id) return;

  root.querySelector('[data-forge-action="upgrade"]')?.addEventListener('click', () => {
    const useProtection = !!root.querySelector('#forge-protection')?.checked;
    const res = Engine.upgradeItem(id, useProtection);
    if (!res.ok) return ctx.toast?.(res.message || 'The forge refuses.', 'danger');
    if (res.broke) {
      ctx.toast?.(`${res.item?.name || 'The relic'} shattered in the forge.`, 'danger');
      ctx.refresh({ itemId: '' });
    } else {
      ctx.refresh();
    }
  });

  root.querySelector('[data-forge-action="add"]')?.addEventListener('click', () => {
    const res = Engine.enchantAdd(id);
    if (!res.ok) return ctx.toast?.(res.message || 'Could not add a bonus.', 'danger');
    ctx.refresh();
  });

  root.querySelector('[data-forge-action="reroll"]')?.addEventListener('click', () => {
    confirmModal({
      title: 'Reroll every bonus?',
      message: 'All random bonuses on this relic will be replaced with new rolls. The item itself and its upgrade level are untouched.',
      confirmLabel: 'Reroll bonuses',
      danger: true,
      onConfirm: () => {
        const res = Engine.rerollAffixes(id);
        if (!res.ok) ctx.toast?.(res.message || 'Could not reroll.', 'danger');
        ctx.refresh();
      },
    });
  });

  root.querySelectorAll('[data-forge-action="temper"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = Engine.improveAffix(id, Number(btn.dataset.index));
      if (!res.ok) return ctx.toast?.(res.message || 'Could not temper that bonus.', 'danger');
      ctx.refresh();
    });
  });
}
