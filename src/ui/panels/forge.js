// Blacksmith: guaranteed fusion, legendary crafting, boss-stone reforging and alchemy.
import { t, tx, icon, esc, fmt, toast, confirmDialog } from '../common.js';
import {
  saveNow, addItem, removeItem, recalc, fusionGroups, canFuseGroup, fuseGroup,
} from '../../core/game.js';
import {
  SLOTS, MATERIALS, CONSUMABLES, makeEquip, makeConsumable, rerollStone, itemName, RARITY,
} from '../../data/items.js';
import { itemCellHTML, itemIconName, itemLabel, materialCount } from '../panelKit.js';

const LEGEND_ESSENCE = 100;
const LEGEND_GOLD = 2500;
const REROLL_ESSENCE = 40;

const ALCHEMY = [
  { id: 'healPotion', qty: 2, mats: { herb: 2 }, nameKey: 'smith.craftPotion' },
  { id: 'manaPotion', qty: 2, mats: { herb: 1, crystal: 1 }, nameKey: 'smith.craftMana' },
  { id: 'elixir', qty: 1, mats: { fungus: 2, crystal: 1 }, nameKey: 'smith.craftElixir' },
  { id: 'charm', qty: 1, mats: { herb: 1, fungus: 1, crystal: 1 }, nameKey: 'smith.craftCharm' },
];

function rarityColor(item) {
  return RARITY[item?.rarity]?.color ?? '#d9b76a';
}

function fusionBody(panel) {
  const p = panel.player;
  const groups = fusionGroups(p);
  return `<div class="forge-hero">
      ${icon('swap')}
      <h3>${esc(t('forge.fusion'))}</h3>
      <p>${esc(t('forge.selectHint'))}</p>
    </div>
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('forge.rules'))}</h3><span>${esc(t('forge.safe'))}</span></div>
      <div class="stat-list">
        <div class="stat-row"><span>${esc(t('forge.tierRule'))}</span></div>
        <div class="stat-row"><span>${esc(t('forge.legendRule'))}</span></div>
        <div class="stat-row"><span>${esc(t('forge.critCap'))}</span></div>
      </div>
    </div>
    ${groups.length ? groups.map((group, index) => {
      const can = canFuseGroup(group);
      const sample = group.sample;
      const cells = [];
      for (let i = 0; i < 4; i++) {
        const item = group.items[i];
        cells.push(item
          ? `<div class="slot-mini" style="--rc:${rarityColor(item)}" title="${esc(itemName(item))}">${icon(itemIconName(item))}</div>`
          : `<div class="slot-mini" style="--rc:#4b473f">${icon('plus')}</div>`);
      }
      return `<div class="fusion-group">
        <div class="fg-head">
          <div class="fg-name" style="--rc:${rarityColor(sample)}">${esc(itemName(sample))}</div>
          <div class="fg-count">${group.items.length}/4 · ${esc(t(`tier.${sample.tier}`))} → ${esc(t(`tier.${group.result.tier}`))} · ${esc(t(`rarity.${group.result.rarity}`))}</div>
        </div>
        <div class="fusion-items">${cells.join('<span class="plus">+</span>')}</div>
        <div class="fusion-result">
          ${itemCellHTML(group.result)}
          <div class="grow">
            <div class="fg-name">${esc(t('forge.resultPreview'))}</div>
            <div class="hint">${esc(itemLabel(group.result))} · ${esc(t(`tier.${group.result.tier}`))}</div>
          </div>
          <button class="btn ${can ? 'primary' : 'ghost'}" data-fuse="${index}" ${can ? '' : 'disabled'}>${icon('anvil')} ${esc(t('forge.fusion'))}</button>
        </div>
      </div>`;
    }).join('') : `<div class="empty-state">${icon('anvil')}<h3>${esc(t('forge.noGroups'))}</h3><p>${esc(t('forge.selectHint'))}</p></div>`}
    <p class="hint" style="margin-top:10px">${esc(t('forge.safe'))} · ${esc(t('forge.critCap'))}</p>`;
}

function legendaryBody(panel) {
  const p = panel.player;
  const slot = panel.state.forgeSlot ?? 'weapon';
  const essence = p.essence ?? 0;
  const canCraft = essence >= LEGEND_ESSENCE && p.gold >= LEGEND_GOLD;
  return `<div class="forge-hero">
      ${icon('anvil')}
      <h3>${esc(t('forge.craftLegendary'))}</h3>
      <p>${esc(t('smith.craftHint'))}</p>
    </div>
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('forge.required'))}</h3><span>${esc(t('forge.available'))}</span></div>
      <div class="stat-list">
        <div class="stat-row"><span>${icon('crystal')} ${esc(t('forge.essence'))}</span><b class="${essence >= LEGEND_ESSENCE ? 'up' : ''}">${fmt(essence)} / ${fmt(LEGEND_ESSENCE)}</b></div>
        <div class="stat-row"><span>${icon('gold')} ${esc(t('common.gold'))}</span><b class="${p.gold >= LEGEND_GOLD ? 'up' : ''}">${fmt(p.gold)} / ${fmt(LEGEND_GOLD)}</b></div>
      </div>
      <div class="field-label" style="margin-top:11px">${esc(t('forge.slot'))}</div>
      <div class="slot-picker">
        ${SLOTS.map((s) => `<button class="${s.id === slot ? 'on' : ''}" data-forge-slot="${s.id}" title="${esc(t(`slot.${s.id}`))}">${icon(s.icon)}</button>`).join('')}
      </div>
      <button class="btn primary wide" data-craft-legendary ${canCraft ? '' : 'disabled'}>${icon('gem')} ${esc(t('smith.craftBtn'))} · ${esc(t('rarity.legendary'))}</button>
      <p class="hint" style="margin-top:8px">${esc(t('forge.critCap'))} · ${esc(t('forge.safe'))}</p>
    </div>
    ${stoneBody(panel)}`;
}

function stoneBody(panel) {
  const p = panel.player;
  const stones = p.stones ?? [];
  const essence = p.essence ?? 0;
  return `<div class="section-block">
    <div class="section-head"><h3>${esc(t('smith.rerollStone'))}</h3><span>${esc(t('forge.stoneBonuses'))}</span></div>
    ${stones.length ? stones.map((stone) => `<div class="stone-card" style="margin-bottom:8px">
      <div class="sc-title">
        ${icon('crystal')} ${esc(tx(stone.name))}
        ${p.activeStone === stone.uid ? `<span class="chip gold" style="margin-left:auto;font-size:7px">${esc(t('common.active'))}</span>` : ''}
      </div>
      ${(stone.bonuses ?? []).map((b) => `<div class="stone-bonus"><span>${esc(t(`stats.${b.stat}`))}</span><b>${b.pct ? `+${(b.value * 100).toFixed(1)}%` : `+${fmt(Math.round(b.value))}`}</b></div>`).join('')}
      <div class="hint" style="margin-top:6px">${esc(t('smith.rerollHint'))}</div>
      <button class="btn ghost" style="margin-top:8px;width:100%" data-reroll="${esc(stone.uid)}" ${essence >= REROLL_ESSENCE ? '' : 'disabled'}>
        ${icon('swap')} ${esc(t('smith.rerollStone'))} · ${REROLL_ESSENCE} ${esc(t('forge.essence'))}
      </button>
    </div>`).join('') : `<div class="empty-state">${icon('crystal')}<h3>${esc(t('smith.noStone'))}</h3><p>${esc(t('smith.rerollHint'))}</p></div>`}
    <p class="hint">${esc(t('forge.critCap'))} · ${esc(t('forge.stoneBonuses'))}</p>
  </div>`;
}

function alchemyBody(panel) {
  const p = panel.player;
  return `<div class="forge-hero">
      ${icon('potion')}
      <h3>${esc(t('smith.alchemy'))}</h3>
      <p>${esc(t('smith.ingredients'))} → ${esc(t('smith.craftResult'))}</p>
    </div>
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('smith.recipes'))}</h3><span>${esc(t('smith.craftResult'))}</span></div>
      ${ALCHEMY.map((recipe) => {
        const def = CONSUMABLES[recipe.id];
        const can = Object.entries(recipe.mats).every(([id, need]) => materialCount(p, id) >= need);
        const ingredients = Object.entries(recipe.mats).map(([id, need]) => {
          const have = materialCount(p, id);
          return `<span style="${have < need ? 'color:#c98f89' : ''}">${icon(MATERIALS[id]?.icon ?? 'herb')} ${esc(tx(MATERIALS[id]?.name))} ${fmt(have)}/${need}</span>`;
        }).join('');
        return `<div class="forge-recipe">
          <div class="grow">
            <div class="fr-name">${icon(def.icon)} ${esc(tx(def.name))} ×${recipe.qty}</div>
            <div class="fr-cost">${ingredients}</div>
            <div class="fr-cost"><span>${esc(t(recipe.nameKey))}</span></div>
          </div>
          <button class="btn ${can ? 'primary' : 'ghost'}" data-brew="${recipe.id}" ${can ? '' : 'disabled'}>${esc(t('smith.craftBtn'))}</button>
        </div>`;
      }).join('')}
      <p class="hint">${esc(t('smith.salvageHint'))}</p>
    </div>`;
}

export function forgeView(panel) {
  const p = panel.player;
  const tab = panel.state.tab ?? 'fusion';
  const tabs = [
    { id: 'fusion', label: t('forge.fusion') },
    { id: 'forge', label: t('forge.forge') },
    { id: 'alchemy', label: t('smith.alchemy') },
  ];
  const body = tab === 'forge' ? legendaryBody(panel) : tab === 'alchemy' ? alchemyBody(panel) : fusionBody(panel);
  return {
    title: t('forge.title'),
    subtitle: `${t('smith.subtitle')} · ${p.essence ?? 0} ${t('forge.essence')}`,
    tabs,
    body,
    resources: true,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-forge-slot]').forEach((btn) => btn.addEventListener('click', () => {
        panel.state.forgeSlot = btn.dataset.forgeSlot;
        panel.refresh({ tab: 'forge' });
      }));

      overlay.querySelectorAll('[data-fuse]').forEach((btn) => btn.addEventListener('click', () => {
        const index = Number(btn.dataset.fuse);
        const group = fusionGroups(p)[index];
        if (!group || !canFuseGroup(group)) { toast(t('toast.fusionNo'), 'bad'); return; }
        const result = fuseGroup(p, group);
        if (!result) { toast(t('toast.fusionNo'), 'bad'); return; }
        toast(t('inv.fuseSuccess', { item: itemName(result) }), 'good');
        panel.screen.audio?.play('loot');
        saveNow();
        panel.screen.hud?.refresh();
        panel.refresh({ tab: 'fusion' });
      }));

      overlay.querySelector('[data-craft-legendary]')?.addEventListener('click', () => {
        const essence = p.essence ?? 0;
        if (essence < LEGEND_ESSENCE || p.gold < LEGEND_GOLD) {
          toast(t(essence < LEGEND_ESSENCE ? 'smith.noEssence' : 'common.notEnoughGold'), 'bad');
          return;
        }
        const slot = panel.state.forgeSlot ?? 'weapon';
        const item = makeEquip({
          classId: p.classId, slot, rarity: 'legendary', tier: 'T3',
          level: Math.max(1, p.level),
        });
        if (!addItem(p, item)) { toast(t('common.inventoryFull'), 'bad'); return; }
        p.essence = essence - LEGEND_ESSENCE;
        p.gold -= LEGEND_GOLD;
        toast(t('smith.crafted', { item: itemName(item) }), 'good');
        panel.screen.audio?.play('gem');
        saveNow();
        panel.screen.hud?.refresh();
        panel.refresh({ tab: 'forge' });
      });

      overlay.querySelectorAll('[data-reroll]').forEach((btn) => btn.addEventListener('click', () => {
        const stone = (p.stones ?? []).find((s) => s.uid === btn.dataset.reroll);
        if (!stone) return;
        if ((p.essence ?? 0) < REROLL_ESSENCE) { toast(t('smith.noEssence'), 'bad'); return; }
        confirmDialog(t('smith.rerollTitle'), t('smith.rerollText'), () => {
          p.essence -= REROLL_ESSENCE;
          const fresh = rerollStone(stone);
          stone.bonuses = fresh.bonuses;
          if (p.activeStone === stone.uid) recalc(p);
          toast(t('smith.rerolled', { n: stone.bonuses.length }), 'good');
          panel.screen.audio?.play('stone');
          saveNow();
          panel.screen.hud?.refresh();
          panel.refresh({ tab: 'forge' });
        }, { confirmLabel: t('smith.rerollStone') });
      }));

      overlay.querySelectorAll('[data-brew]').forEach((btn) => btn.addEventListener('click', () => {
        const recipe = ALCHEMY.find((r) => r.id === btn.dataset.brew);
        if (!recipe) return;
        const missing = Object.entries(recipe.mats).filter(([id, need]) => materialCount(p, id) < need);
        if (missing.length) { toast(t('smith.missing'), 'bad'); return; }
        const def = CONSUMABLES[recipe.id];
        const item = makeConsumable(recipe.id, recipe.qty);
        item.stackLimit = def.stack ?? 20;
        if (!addItem(p, item)) { toast(t('common.inventoryFull'), 'bad'); return; }
        for (const [id, need] of Object.entries(recipe.mats)) {
          removeItem(p, { kind: 'material', id, stack: true }, need);
        }
        toast(t('smith.crafted', { item: tx(def.name) }), 'good');
        panel.screen.audio?.play('gatherDone');
        saveNow();
        panel.screen.hud?.refresh();
        panel.refresh({ tab: 'alchemy' });
      }));
    },
  };
}
