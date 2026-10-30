/* Satchel — every spoil of the hunt, searchable and sortable. */

import { Engine } from '../../core/engine.js';
import { RARITIES, RARITY_BY_ID, SLOTS } from '../../data/items.js';
import { itemScore, itemSellPrice, canEquipToClass } from '../../core/items.js';
import { esc, fmt, pageHead, emptyState, confirmModal, itemIcon } from '../components.js';
import { icon } from '../icons.js';

export function render(ctx) {
  const { state, stats } = ctx;
  const hero = state.hero;
  const items = hero.inventory || [];
  const pct = hero.capacity ? Math.min(100, items.length / hero.capacity * 100) : 0;
  const sellable = items.filter(i => !i.locked && !i.upgrade).length;

  return `
  ${pageHead('Satchel', `${items.length} of ${hero.capacity} slots used · ${fmt(stats.power)} power`,
    `<button class="btn ghost" data-inv-action="autosell" type="button">${icon('coin')} Auto-sell common: ${hero.autoSellCommon ? 'On' : 'Off'}</button>
     <button class="btn danger" data-inv-action="selljunk" type="button">${icon('trash')} Sell junk</button>`, 'Spoils')}

  <div class="inv-toolbar">
    <input class="input" id="inv-search" type="search" placeholder="Search the satchel…" autocomplete="off" aria-label="Search items" />
    <select class="select" id="inv-rarity" aria-label="Filter by rarity">
      <option value="all">All rarities</option>
      ${RARITIES.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
    </select>
    <select class="select" id="inv-sort" aria-label="Sort items">
      <option value="power">Sort: power</option>
      <option value="rarity">Sort: rarity</option>
      <option value="newest">Sort: newest</option>
      <option value="name">Sort: name</option>
    </select>
    <div class="inv-capacity">
      <span id="inv-count">${items.length} items</span>
      <div class="bar xp thin"><span style="width:${pct.toFixed(1)}%"></span></div>
      <b style="color:${pct > 90 ? 'var(--blood)' : 'var(--ivory)'}">${items.length}/${hero.capacity}</b>
    </div>
  </div>

  <section class="panel pad">
    <div class="flex between wrap" style="margin-bottom:9px">
      <div><span class="eyebrow">Inventory</span><h3 style="font-size:15px">Relics and road-worn steel</h3></div>
      <span class="pill">${icon('bag')} ${sellable} sellable</span>
    </div>
    <div class="item-grid" id="inventory-grid">
      ${items.map(item => inventoryTile(item)).join('')}
    </div>
    <div id="inventory-empty" class="${items.length ? 'hidden' : ''}">${emptyState('bag', 'The satchel is empty', 'The vale is generous to those who keep killing.')}</div>
    <div id="inventory-nomatch" class="hidden">${emptyState('search', 'Nothing matches', 'Try another rarity or a shorter search.')}</div>
  </section>

  <div class="grid-2 mt-3">
    <section class="panel pad">
      <span class="eyebrow">Merchant</span>
      <h3 style="font-size:14px;margin-bottom:5px">Turn clutter into gold</h3>
      <p class="muted" style="font-size:10px;line-height:1.55">Selling junk clears every unlocked item up to Epic that has never been forged. Locked items, upgraded relics and Legendary or better gear are always spared.</p>
      <div class="flex between wrap mt-2"><span class="muted" style="font-size:10px">Estimated junk value</span><b class="gold">${fmt(items.filter(i => !i.locked && !i.upgrade && RARITY_BY_ID[i.rarity].index <= 2).reduce((sum, i) => sum + itemSellPrice(i), 0))}g</b></div>
    </section>
    <section class="panel pad">
      <span class="eyebrow">Satchel</span>
      <h3 style="font-size:14px;margin-bottom:5px">More room, fewer decisions</h3>
      <p class="muted" style="font-size:10px;line-height:1.55">Expand capacity in the premium market or sell what you do not need. Auto-equip and auto-sell can be tuned in Settings.</p>
      <div class="flex wrap mt-2" style="gap:6px">
        <button class="btn tiny secondary" data-nav="settings" type="button">${icon('settings')} Settings</button>
        <button class="btn tiny" data-nav="shop" type="button">${icon('shop')} Satchel expansion</button>
      </div>
    </section>
  </div>`;
}

function inventoryTile(item) {
  const rar = RARITY_BY_ID[item.rarity] || RARITY_BY_ID.common;
  const compatible = canEquipToClass(item, Engine.state.hero.classId);
  const equipped = Engine.state.hero.equipment?.[item.slot]?.id === item.id;
  return `<button type="button" class="item-tile r-${rar.id}"
    data-item-open="${item.id}"
    data-inv-rarity="${rar.id}"
    data-inv-score="${itemScore(item)}"
    data-inv-time="${item.createdAt || 0}"
    data-inv-name="${esc(item.name.toLowerCase())}"
    style="--rarity:${rar.color}">
    ${item?.upgrade ? `<span class="tile-tag">+${item.upgrade}</span>` : ''}
    ${item?.locked ? `<span class="tile-tag" style="top:auto;bottom:4px;right:5px;color:var(--gold)">${icon('lock')}</span>` : ''}
    ${!compatible ? `<span class="tile-tag" style="top:auto;bottom:4px;left:5px;color:var(--muted)">${icon('lock')}</span>` : ''}
    ${itemIcon(item)}
    <div class="name">${esc(item.name)}</div>
    <div class="sub">${esc(SLOTS[item.slot]?.label || '')} · ${fmt(itemScore(item))}${equipped ? ' · worn' : ''}</div>
  </button>`;
}

export function mount(root, ctx) {
  const grid = root.querySelector('#inventory-grid');
  const search = root.querySelector('#inv-search');
  const rarity = root.querySelector('#inv-rarity');
  const sort = root.querySelector('#inv-sort');
  const count = root.querySelector('#inv-count');
  const empty = root.querySelector('#inventory-empty');
  const nomatch = root.querySelector('#inventory-nomatch');
  if (!grid) return;

  const tiles = [...grid.querySelectorAll('.item-tile')];
  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    const rar = rarity?.value || 'all';
    const order = sort?.value || 'power';
    const comparator = {
      power: (a, b) => Number(b.dataset.invScore) - Number(a.dataset.invScore),
      rarity: (a, b) => (RARITY_BY_ID[b.dataset.invRarity]?.index || 0) - (RARITY_BY_ID[a.dataset.invRarity]?.index || 0) || Number(b.dataset.invScore) - Number(a.dataset.invScore),
      newest: (a, b) => Number(b.dataset.invTime) - Number(a.dataset.invTime),
      name: (a, b) => a.dataset.invName.localeCompare(b.dataset.invName),
    }[order] || (() => 0);
    tiles.sort(comparator);
    let visible = 0;
    for (const tile of tiles) {
      const match = (rar === 'all' || tile.dataset.invRarity === rar) && (!q || tile.dataset.invName.includes(q));
      tile.classList.toggle('hidden', !match);
      if (match) visible++;
      grid.appendChild(tile);
    }
    if (count) count.textContent = `${visible} item${visible === 1 ? '' : 's'}`;
    empty?.classList.toggle('hidden', tiles.length > 0);
    nomatch?.classList.toggle('hidden', !(tiles.length > 0 && visible === 0));
  };

  search?.addEventListener('input', apply);
  rarity?.addEventListener('change', apply);
  sort?.addEventListener('change', apply);

  root.querySelector('[data-inv-action="autosell"]')?.addEventListener('click', () => {
    const value = !Engine.state.hero.autoSellCommon;
    Engine.setSetting('autoSellCommon', value);
    ctx.toast?.(value ? 'Common drops will be sold automatically.' : 'Common drops will fill the satchel.', 'info');
    ctx.refresh();
  });

  root.querySelector('[data-inv-action="selljunk"]')?.addEventListener('click', () => {
    const junk = Engine.state.hero.inventory.filter(i => !i.locked && !i.upgrade && RARITY_BY_ID[i.rarity].index <= 2);
    if (!junk.length) return ctx.toast?.('Nothing in the satchel qualifies as junk.', 'info');
    const value = junk.reduce((sum, i) => sum + itemSellPrice(i), 0);
    confirmModal({
      title: 'Sell junk?',
      message: `Sell <b>${junk.length}</b> unlocked items up to Epic for <b>${fmt(value)}g</b>? This cannot be undone.`,
      confirmLabel: `Sell for ${fmt(value)}g`,
      danger: true,
      onConfirm: () => {
        const res = Engine.sellJunk('epic');
        if (!res.ok) ctx.toast?.(res.message, 'info');
        ctx.refresh();
      },
    });
  });

  apply();
}
