/* Fusion — four identical relics become one of the next rarity. */

import { Engine } from '../../core/engine.js';
import { RARITY_BY_ID, RARITIES, nextRarity, SLOTS } from '../../data/items.js';
import { itemScore, canEquipToClass } from '../../core/items.js';
import { esc, fmt, pageHead, itemIcon, chip, emptyState, rarityLadder, confirmModal } from '../components.js';
import { icon } from '../icons.js';
import { itemArt } from '../sprites.js';

function fuseCost(item) {
  return Math.round((650 + item.ilvl * 70) * Math.pow(RARITY_BY_ID[item.rarity].index + 1, 1.5));
}

function groupKey(item) {
  return `${item.templateId}|${item.rarity}`;
}

function buildGroups(inventory) {
  const map = new Map();
  for (const item of inventory) {
    if (!item || item.upgrade > 0) continue;
    const key = groupKey(item);
    if (!map.has(key)) map.set(key, { key, sample: item, items: [] });
    map.get(key).items.push(item);
  }
  return [...map.values()].sort((a, b) => {
    const r = RARITY_BY_ID[b.sample.rarity].index - RARITY_BY_ID[a.sample.rarity].index;
    return r || b.items.length - a.items.length;
  });
}

export function render(ctx) {
  const { state } = ctx;
  const hero = state.hero;
  const groups = buildGroups(hero.inventory);
  const selectedId = ctx.params?.fuse;
  const selected = hero.inventory.find(i => i.id === selectedId) || null;
  const group = selected ? groups.find(g => g.key === groupKey(selected)) : null;
  const next = selected ? nextRarity(selected.rarity) : null;
  const cost = selected ? fuseCost(selected) : 0;
  const copies = group?.items?.length || 0;
  const canFuse = !!selected && copies >= 4 && next && hero.gold >= cost;

  const groupCards = groups.map(g => {
    const rar = RARITY_BY_ID[g.sample.rarity];
    const active = group?.key === g.key;
    const complete = g.items.length >= 4;
    const nxt = nextRarity(g.sample.rarity);
    return `<button class="item-card r-${rar.id} ${active ? 'selected' : ''}" data-fuse-pick="${g.sample.id}" type="button" style="align-items:flex-start">
      ${itemIcon(g.sample, 'sm')}
      <div class="item-meta">
        <div class="name">${esc(g.sample.name)}</div>
        <div class="sub">${rar.name} ${esc(SLOTS[g.sample.slot]?.label || '')} · iLvl ${g.sample.ilvl}</div>
        <div class="sub" style="color:${complete ? 'var(--green)' : 'var(--muted-2)'}">${g.items.length} / 4 copies${nxt ? ` → ${nxt.name}` : ' · divine'}</div>
      </div>
      <div class="score">${g.items.length}<span style="font-size:7px;display:block;color:var(--muted-2)">copies</span></div>
      ${complete ? '<span class="pick-tag">Ready</span>' : ''}
    </button>`;
  }).join('');

  const slots = [0, 1, 2, 3].map(i => {
    const item = group?.items[i];
    return `<div class="fuse-slot ${item ? `filled r-${item.rarity}` : ''}" style="${item ? `--rarity:${RARITY_BY_ID[item.rarity].color}` : ''}">
      ${item ? itemIcon(item, 'sm') : icon('plus')}
    </div>`;
  }).join('<span class="fuse-plus">+</span>');

  return `
  ${pageHead('Fusion', `${groups.length} fuseable ${groups.length === 1 ? 'pattern' : 'patterns'} in the satchel · fusion consumes four identical +0 relics`,
    `<button class="btn ghost" data-nav="forge" type="button">${icon('hammer')} Blacksmith</button>`, 'Four become one')}

  <div class="fuse-layout">
    <section class="panel pad">
      <div class="flex between wrap" style="margin-bottom:9px">
        <div><span class="eyebrow">Satchel patterns</span><h3 style="font-size:15px">Identical relics</h3></div>
        <span class="pill ${groups.some(g => g.items.length >= 4) ? 'green' : ''}">${groups.filter(g => g.items.length >= 4).length} ready</span>
      </div>
      ${groupCards || emptyState('merge', 'Nothing to fuse', 'Collect four copies of the same item, rarity and upgrade level (+0 only).')}
      <div class="muted" style="font-size:8.5px;margin-top:10px;line-height:1.45">Fusion keeps the item type and item level, raises the rarity by one step, and rolls fresh base stats and random bonuses. Equipped and upgraded relics never qualify.</div>
    </section>

    <div class="flex-col" style="gap:14px">
      ${selected && group
        ? `<section class="panel">
            <div class="forge-item">
              ${itemIcon(selected, 'xl')}
              <div style="flex:1;min-width:0">
                <div class="forge-name" style="--rarity:${RARITY_BY_ID[selected.rarity].color}">${esc(selected.name)}</div>
                <div class="forge-sub">${RARITY_BY_ID[selected.rarity].name} ${esc(SLOTS[selected.slot]?.label || '')} · iLvl ${selected.ilvl} · ${fmt(itemScore(selected))} power each</div>
                <div class="flex wrap mt-1" style="gap:4px">
                  ${chip(`${copies} / 4 copies`, copies >= 4 ? 'green' : '', 'merge')}
                  ${selected.classReq ? chip(`${selected.classReq} only`, canEquipToClass(selected, hero.classId) ? '' : 'red', 'lock') : ''}
                </div>
              </div>
            </div>
            <div class="panel-body">
              <div class="fuse-slots">${slots}</div>
              <div class="fuse-next">
                <span class="eyebrow">Result</span>
                ${next
                  ? `<div class="flex" style="gap:8px">
                      <span class="rarity-step" style="--step-color:${RARITY_BY_ID[selected.rarity].color}">${RARITY_BY_ID[selected.rarity].name}</span>
                      <span class="fuse-arrow">→</span>
                      <span class="rarity-step" style="--step-color:${next.color}">${next.name}</span>
                    </div>
                    <div style="font-family:var(--serif);font-size:15px;color:${next.color}">${esc(next.name)} ${esc(SLOTS[selected.slot]?.label || 'relic')}</div>
                    <div class="muted" style="font-size:9px;text-align:center;max-width:250px">Base stats scale with rarity. The result arrives at +0 with ${next.affixes} random ${next.affixes === 1 ? 'bonus' : 'bonuses'}, ready to forge.</div>`
                  : `<div class="muted">Divine is the final rarity. This relic cannot be fused further.</div>`}
              </div>
              <div class="forge-costs">
                <div class="cost-chip ${hero.gold < cost ? 'bad' : ''}">${icon('coin')} Gold <b>${fmt(cost)}</b></div>
                <div class="cost-chip ${copies < 4 ? 'bad' : 'good'}">${icon('merge')} Copies <b>${copies}/4</b></div>
              </div>
              <div class="flex wrap mt-2" style="gap:6px">
                <button class="btn" data-fuse-action="fuse" type="button" style="flex:1" ${canFuse ? '' : 'disabled'}>${icon('merge')} ${next ? `Fuse into ${next.name}` : 'Cannot fuse'}</button>
                <button class="btn tiny ghost" data-nav="inventory" type="button">${icon('bag')} Satchel</button>
              </div>
              ${copies < 4 ? `<div class="muted" style="font-size:8.5px;margin-top:6px">Need ${4 - copies} more identical ${RARITY_BY_ID[selected.rarity].name.toLowerCase()} ${esc(SLOTS[selected.slot]?.label || 'relic')} at +0.</div>` : ''}
            </div>
          </section>`
        : `<section class="panel pad">${emptyState('merge', 'Choose a pattern', 'Select a relic on the left. Four identical copies are consumed to create one relic of the next rarity.')}</section>`}

      <section class="panel pad">
        <span class="eyebrow">Rarity ladder</span>
        <h3 style="font-size:14px;margin-bottom:8px">The long ascent</h3>
        ${rarityLadder()}
        <div class="muted" style="font-size:8.5px;margin-top:8px;line-height:1.45">Fusion is the only reliable road to Divine. Higher rarities carry more base power and additional random bonuses.</div>
      </section>
    </div>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-fuse-pick]').forEach(btn => {
    btn.addEventListener('click', () => ctx.refresh({ fuse: btn.dataset.fusePick }));
  });

  root.querySelector('[data-fuse-action="fuse"]')?.addEventListener('click', () => {
    const id = ctx.params?.fuse;
    const item = Engine.state.hero.inventory.find(i => i.id === id);
    if (!item) return ctx.toast?.('Select a pattern first.', 'danger');
    const next = nextRarity(item.rarity);
    confirmModal({
      title: `Fuse into ${next ? next.name : 'the next rarity'}?`,
      message: `Four <b>${esc(item.name)}</b> copies and <b>${fmt(fuseCost(item))} gold</b> will be consumed. The result is a fresh <b>${next?.name || 'relic'}</b> of the same type and item level.`,
      confirmLabel: 'Fuse relics',
      onConfirm: () => {
        const res = Engine.fuseItems(id);
        if (!res.ok) {
          ctx.toast?.(res.message || 'Fusion failed.', 'danger');
          return;
        }
        ctx.toast?.(`Fusion complete: ${res.item.name}.`, 'success');
        ctx.refresh({ fuse: '' });
      },
    });
  });
}
