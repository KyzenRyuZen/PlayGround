// Aether cosmetic shop, daily gift and the travelling merchant.
import { t, tx, icon, esc, fmt, toast, confirmDialog } from '../common.js';
import {
  currentZone, saveNow, claimDaily, addItem, applyCosmetic, isUnlocked,
} from '../../core/game.js';
import { todayKey } from '../../core/utils.js';
import { SHOP_TABS, shopCatalog, MOUNTS, PETS, FXS, WINGS_SHOP, COSTUMES, HAIR_SHOP, GEM_PACKS } from '../../data/shop.js';
import { CONSUMABLES, makeConsumable, makeEquip, itemName, itemStatLines } from '../../data/items.js';
import { statValue } from '../panelKit.js';

const TAB_LABEL = {
  featured: 'store.featured',
  costumes: 'store.costumes',
  hair: 'store.hair',
  mounts: 'store.mounts',
  pets: 'store.pets',
  fx: 'store.fx',
  wings: 'store.wings',
  gems: 'store.gems',
};

function categoryOf(item) {
  if (item.descKey) return 'gems';
  if (HAIR_SHOP[item.id]) return 'hair';
  if (COSTUMES[item.id]) return 'costumes';
  if (MOUNTS[item.id]) return 'mounts';
  if (PETS[item.id]) return 'pets';
  if (FXS[item.id]) return 'fx';
  if (WINGS_SHOP[item.id]) return 'wings';
  return 'featured';
}

function owned(p, type, item) {
  if (type === 'hair') return p.hairUnlocks.includes(item.style);
  if (type === 'costume') return p.costumes.includes(item.id);
  if (type === 'mount') return p.mounts.includes(item.id);
  if (type === 'pet') return p.pets.includes(item.id);
  if (type === 'fx') return p.fxUnlocks.includes(item.id);
  if (type === 'wing') return p.wings.includes(item.id);
  return false;
}

function equipped(p, type, item) {
  if (type === 'hair') return p.hair === item.style;
  if (type === 'costume') return p.costume === item.id;
  if (type === 'mount') return p.mount === item.id;
  if (type === 'pet') return p.pet === item.id;
  if (type === 'fx') return p.fx === item.id;
  if (type === 'wing') return p.wing === item.id;
  return false;
}

function grantCosmetic(p, type, item) {
  if (type === 'hair') {
    if (!p.hairUnlocks.includes(item.style)) p.hairUnlocks.push(item.style);
    p.hair = item.style;
    return;
  }
  const arr = type === 'costume' ? p.costumes : type === 'mount' ? p.mounts : type === 'pet' ? p.pets : type === 'fx' ? p.fxUnlocks : p.wings;
  if (!arr.includes(item.id)) arr.push(item.id);
}

function applyItem(p, type, item) {
  if (type === 'hair') { p.hair = item.style; return; }
  applyCosmetic(p, type === 'costume' ? 'costume' : type === 'mount' ? 'mount' : type === 'pet' ? 'pet' : type === 'fx' ? 'fx' : 'wing', item.id);
}

function storeCard(panel, item) {
  const p = panel.player;
  const type = categoryOf(item);
  const isOwned = owned(p, type, item);
  const active = equipped(p, type, item);
  const questOnly = type === 'wing' && item.id === 'wing_eternity';
  const price = item.price ?? 0;
  const canAfford = p.gems >= price;
  return `<div class="store-card${isOwned ? ' owned' : ''}" style="--sc:${item.color || item.colors?.[1] || '#d9b76a'}">
    ${isOwned ? `<span class="owned-badge">${esc(t('common.owned'))}</span>` : ''}
    <div class="store-visual">${icon(item.icon || 'spark')}</div>
    <h3>${esc(tx(item.name))}</h3>
    <p>${esc(tx(item.desc))}</p>
    <div class="store-buy">
      <span class="price">${questOnly ? esc(t('common.viaQuest')) : price ? `${icon('gem')} ${fmt(price)}` : esc(t('common.free'))}</span>
      ${questOnly
        ? `<button class="btn ghost" disabled>${esc(t('common.locked'))}</button>`
        : isOwned
          ? `<button class="btn ${active ? 'ghost' : 'primary'}" data-apply-store="${type}" data-store-id="${item.id}">${esc(t(active ? 'store.equipped' : 'store.equip'))}</button>`
          : `<button class="btn primary" data-buy-store="${type}" data-store-id="${item.id}" ${canAfford ? '' : 'disabled'}>${esc(t('store.buy'))}</button>`}
    </div>
  </div>`;
}

function dailyCard(panel) {
  const p = panel.player;
  const ready = p.dailyClaim !== todayKey();
  return `<div class="daily-card">
    ${icon('gift')}
    <div><h3>${esc(t('daily.title'))}</h3><p>${esc(t('daily.reward'))} · ${esc(t('daily.streak', { n: p.dailyStreak ?? 0 }))}</p></div>
    <button class="btn ${ready ? 'primary' : 'ghost'}" data-daily ${ready ? '' : 'disabled'}>${esc(t(ready ? 'daily.claim' : 'store.dailyDone'))}</button>
  </div>`;
}

export function shopView(panel) {
  const p = panel.player;
  const tab = panel.state.tab ?? 'featured';
  const items = shopCatalog(tab);
  let body = '';
  if (tab === 'gems') {
    body = `${dailyCard(panel)}
      <div class="section-block">
        <div class="section-head"><h3>${esc(t('store.gemEarn'))}</h3><span>${esc(t('store.gemBalance'))} ${fmt(p.gems)}</span></div>
        <div class="stat-list">
          ${['store.gemEarn1', 'store.gemEarn2', 'store.gemEarn3', 'store.gemEarn4'].map((key, i) => `<div class="stat-row"><span>${icon(['quest', 'skull', 'gift', 'spark'][i])} ${esc(t(key))}</span></div>`).join('')}
        </div>
      </div>
      <p class="hint gold">${esc(t('store.gemNote'))}</p>
      <p class="hint">${esc(t('store.noRealMoney'))}</p>`;
  } else {
    body = `${dailyCard(panel)}
      <div class="store-grid">${items.length ? items.map((item) => storeCard(panel, item)).join('') : `<div class="empty-state">${icon('shop')}<p>${esc(t('store.empty'))}</p></div>`}</div>
      <p class="hint" style="margin-top:10px">${esc(t('store.cosmeticNote'))}</p>
      <p class="hint">${esc(t('store.wingNote'))}</p>`;
  }
  return {
    title: t('store.title'),
    subtitle: t('store.subtitle'),
    tabs: SHOP_TABS.map((id) => ({ id, label: t(TAB_LABEL[id]) })),
    body,
    resources: true,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-buy-store]').forEach((btn) => btn.addEventListener('click', () => {
        const type = btn.dataset.buyStore;
        const id = btn.dataset.storeId;
        const item = shopCatalog(tab).find((x) => x.id === id) || Object.values({ ...COSTUMES, ...HAIR_SHOP, ...MOUNTS, ...PETS, ...FXS, ...WINGS_SHOP }).find((x) => x.id === id);
        if (!item) return;
        if (item.price > p.gems) { toast(t('common.notEnoughGems'), 'bad'); return; }
        confirmDialog(t('store.buy'), t('store.buyConfirm', { item: tx(item.name), price: item.price }), () => {
          p.gems -= item.price;
          grantCosmetic(p, type, item);
          saveNow();
          toast(t(type === 'hair' ? 'store.hairOwned' : 'store.bought', { item: tx(item.name) }), 'good');
          panel.screen.audio?.play('gem');
          panel.refresh({ tab });
        }, { confirmLabel: t('common.buy') });
      }));
      overlay.querySelectorAll('[data-apply-store]').forEach((btn) => btn.addEventListener('click', () => {
        const type = btn.dataset.applyStore;
        const id = btn.dataset.storeId;
        const item = Object.values({ ...COSTUMES, ...HAIR_SHOP, ...MOUNTS, ...PETS, ...FXS, ...WINGS_SHOP }).find((x) => x.id === id);
        if (!item) return;
        const active = equipped(p, type, item);
        if (active) {
          if (type === 'wing') applyCosmetic(p, 'wing', null);
          else if (type === 'pet') applyCosmetic(p, 'pet', null);
          else if (type === 'fx') applyCosmetic(p, 'fx', null);
          else if (type === 'mount') applyCosmetic(p, 'mount', null);
          else if (type === 'costume') applyCosmetic(p, 'costume', null);
        } else applyItem(p, type, item);
        saveNow();
        toast(t('wardrobe.applied'), 'good');
        panel.refresh({ tab });
      }));
      overlay.querySelector('[data-daily]')?.addEventListener('click', () => {
        const gained = claimDaily(p);
        if (!gained) { toast(t('toast.dailyDone'), 'bad'); return; }
        saveNow();
        toast(t('toast.gemGift', { n: gained.gems }), 'good');
        panel.screen.audio?.play('gem');
        panel.refresh({ tab });
      });
    },
  };
}

function merchantItemLine(entry, type = 'gear') {
  if (type === 'gear') {
    const item = entry.item;
    const stats = itemStatLines(item).slice(0, 2).map((line) => `${t(line.labelKey)} ${statValue(line.stat, line.value)}`).join(' · ');
    return `<div class="forge-recipe">
      <div class="grow">
        <div class="fr-name r-${item.rarity}">${icon('sword')} ${esc(itemName(item))}</div>
        <div class="fr-cost"><span>${esc(t(`rarity.${item.rarity}`))} · ${esc(t(`tier.${item.tier}`))} · ${esc(t('common.itemLevel'))} ${item.level}</span><span>${esc(stats)}</span></div>
      </div>
      <button class="btn primary" data-buy-gear="${item.uid}" ${entry.sold ? 'disabled' : ''}>${icon('gold')} ${fmt(entry.price)}</button>
    </div>`;
  }
  const c = entry.def;
  return `<div class="forge-recipe">
    <div class="grow">
      <div class="fr-name">${icon(c.icon)} ${esc(tx(c.name))}</div>
      <div class="fr-cost"><span>${esc(t(c.descKey))}</span></div>
    </div>
    <button class="btn ghost" data-buy-cons="${c.id}">${icon('gold')} ${fmt(entry.price)}</button>
  </div>`;
}

function ensureStock(panel) {
  const p = panel.player;
  if (panel.merchantStock) return panel.merchantStock;
  const zone = currentZone(p);
  const slots = ['weapon', 'offhand', 'helm', 'chest', 'gloves', 'boots', 'belt', 'ring', 'amulet'];
  const rarities = ['green', 'green', 'blue', 'blue'];
  const gear = [];
  const used = new Set();
  for (let i = 0; i < 4; i++) {
    let slot = slots[Math.floor(Math.random() * slots.length)];
    let guard = 0;
    while (used.has(slot) && guard++ < 8) slot = slots[Math.floor(Math.random() * slots.length)];
    used.add(slot);
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const item = makeEquip({
      classId: p.classId, slot, rarity, tier: i === 3 ? 'T2' : 'T3',
      level: Math.max(zone.min, Math.min(p.level, zone.max)),
    });
    gear.push({ item, price: Math.max(25, Math.round((item.value ?? 20) * 1.8)), sold: false });
  }
  const cons = ['healPotion', 'manaPotion', 'elixir', 'charm', 'moonbread'].map((id) => ({
    def: CONSUMABLES[id],
    price: Math.round((CONSUMABLES[id].price ?? 30) * 1.15),
  }));
  panel.merchantStock = { gear, cons };
  return panel.merchantStock;
}

export function merchantView(panel) {
  const p = panel.player;
  const stock = ensureStock(panel);
  return {
    title: t('merchant.title'),
    subtitle: t('merchant.buyHint'),
    body: `<div class="section-block">
        <div class="section-head"><h3>${esc(t('merchant.gear'))}</h3><span>${esc(t('merchant.stock'))}</span></div>
        ${stock.gear.map((entry) => merchantItemLine(entry)).join('')}
        <button class="btn ghost" data-restock style="margin-top:4px">${icon('swap')} ${esc(t('merchant.restock'))} · 50 ${esc(t('common.gold'))}</button>
      </div>
      <div class="section-block">
        <div class="section-head"><h3>${esc(t('merchant.potions'))}</h3><span>${esc(t('merchant.stock'))}</span></div>
        ${stock.cons.map((entry) => merchantItemLine(entry, 'cons')).join('')}
      </div>
      <p class="hint">${esc(t('merchant.noRepair'))} · ${esc(t('merchant.sellHint'))}</p>`,
    resources: true,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-buy-gear]').forEach((btn) => btn.addEventListener('click', () => {
        const entry = stock.gear.find((x) => x.item.uid === btn.dataset.buyGear);
        if (!entry || entry.sold) return;
        if (p.gold < entry.price) { toast(t('common.notEnoughGold'), 'bad'); return; }
        if (!addItem(p, entry.item)) { toast(t('common.inventoryFull'), 'bad'); return; }
        p.gold -= entry.price;
        entry.sold = true;
        saveNow();
        toast(t('merchant.bought', { item: itemName(entry.item), n: entry.price }), 'good');
        panel.screen.audio?.play('coin');
        panel.refresh();
      }));
      overlay.querySelectorAll('[data-buy-cons]').forEach((btn) => btn.addEventListener('click', () => {
        const entry = stock.cons.find((x) => x.def.id === btn.dataset.buyCons);
        if (!entry) return;
        if (p.gold < entry.price) { toast(t('common.notEnoughGold'), 'bad'); return; }
        const item = makeConsumable(entry.def.id, 1);
        item.stackLimit = 20;
        if (!addItem(p, item)) { toast(t('common.inventoryFull'), 'bad'); return; }
        p.gold -= entry.price;
        saveNow();
        toast(t('merchant.bought', { item: tx(entry.def.name), n: entry.price }), 'good');
        panel.screen.audio?.play('coin');
        panel.refresh();
      }));
      overlay.querySelector('[data-restock]')?.addEventListener('click', () => {
        if (p.gold < 50) { toast(t('common.notEnoughGold'), 'bad'); return; }
        p.gold -= 50;
        panel.merchantStock = null;
        saveNow();
        panel.refresh();
      });
    },
  };
}
