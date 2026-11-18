// Shared render fragments for AETHERIA's in-game panels.
import { t, tx, icon, esc, fmt } from './common.js';
import { RARITY, SLOTS, itemName, itemStatLines, MATERIALS, STAT_LABEL } from '../data/items.js';
import { CLASSES } from '../data/classes.js';

const PCT_STATS = new Set(['crit', 'critDmg', 'lifesteal', 'goldFind', 'gatherSpeed', 'speed']);

export function itemRarity(item) {
  return item?.rarity && RARITY[item.rarity] ? item.rarity : 'common';
}

export function itemIconName(item) {
  if (!item) return 'bag';
  if (item.kind === 'equip') return SLOTS.find((s) => s.id === item.slot)?.icon ?? 'sword';
  if (item.kind === 'stone') return 'crystal';
  if (item.kind === 'wing') return 'wings';
  if (item.kind === 'material') return MATERIALS[item.id]?.icon ?? item.icon ?? 'herb';
  return item.icon ?? 'bag';
}

export function itemLabel(item) {
  if (!item) return t('common.unknownItem');
  if (item.kind === 'equip') return itemName(item);
  return tx(item.name);
}

export function statValue(key, value) {
  if (PCT_STATS.has(key)) {
    const pct = value * 100;
    return `${pct >= 10 ? pct.toFixed(1) : pct.toFixed(2)}%`;
  }
  return fmt(Math.round(value));
}

export function statLabel(key) {
  return t(STAT_LABEL[key] ?? `stats.${key}`);
}

export function metalIcon(name, cls = 'ii') {
  return icon(name, cls);
}

export function itemCellHTML(item, attrs = '', extraClass = '') {
  if (!item) {
    return `<div class="item-cell empty ${extraClass}">${icon('plus', 'ii')}</div>`;
  }
  const rarity = itemRarity(item);
  const tier = item.kind === 'equip' ? `<span class="tier">${esc(item.tier ?? '')}</span>` : '';
  const ilvl = item.kind === 'equip' ? `<span class="ilvl">${item.level}</span>` : '';
  const qty = item.stack || (item.qty ?? 1) > 1 ? `<span class="qty">${fmt(item.qty ?? 1)}</span>` : '';
  return `<button class="item-cell r-${rarity} ${extraClass}" ${attrs}>
    ${icon(itemIconName(item), 'ii')}${tier}${ilvl}${qty}
  </button>`;
}

export function gearSlotsHTML(player) {
  return SLOTS.map((slot) => {
    const item = player.equipment?.[slot.id] ?? null;
    const rarity = itemRarity(item);
    return `<button class="eq-slot${item ? ` r-${rarity}` : ' empty'}" data-eq-slot="${slot.id}" aria-label="${esc(t(`slot.${slot.id}`))}">
      ${icon(slot.icon, 'ii')}
      <span class="en">${item ? esc(itemName(item)) : esc(t(`slot.${slot.id}`))}</span>
      ${item ? `<span class="ilvl">${item.level}</span>` : ''}
    </button>`;
  }).join('');
}

export function itemStatRowsHTML(item) {
  const lines = itemStatLines(item);
  if (!lines.length) return `<p class="hint">${esc(t('item.noBonus'))}</p>`;
  return `<div class="item-stats">${lines.map((line) => `<div class="item-stat"><span>${esc(t(line.labelKey ?? `stats.${line.stat}`))}</span><b>${statValue(line.stat, line.value)}</b></div>`).join('')}</div>`;
}

export function itemDescription(item) {
  if (!item) return '';
  if (item.kind === 'equip') return t(`rarity.${itemRarity(item)}Desc`);
  if (item.kind === 'stone') return t('item.stoneHint');
  if (item.kind === 'wing') return t('item.wingHint');
  if (item.kind === 'material') return t('item.materialHint');
  if (item.descKey) return t(item.descKey);
  return tx(item.desc);
}

export function itemCardHTML(item, { actions = '', compare = null } = {}) {
  if (!item) return '';
  const rarity = itemRarity(item);
  const color = RARITY[rarity]?.color ?? '#d9b76a';
  const meta = [];
  if (item.kind === 'equip') {
    meta.push(t(`rarity.${rarity}`));
    meta.push(t(`tier.${item.tier}`));
    meta.push(`${t('common.itemLevel')} ${item.level}`);
    meta.push(t(`slot.${item.slot}`));
    if (item.class) meta.push(tx(CLASSES[item.class]?.name ?? item.class));
  } else if (item.kind === 'stone') {
    meta.push(t('stone.title'));
  } else if (item.kind === 'material') {
    meta.push(t('item.materials'));
  } else if (item.kind === 'wing') {
    meta.push(t('store.wings'));
  } else {
    meta.push(t('item.effect'));
  }

  let body = itemStatRowsHTML(item);
  if (item.kind === 'stone' && item.bonuses?.length) {
    body = `<div class="item-stats">${item.bonuses.map((b) => {
      const value = b.pct ? `${(b.value * 100).toFixed(1)}%` : fmt(Math.round(b.value));
      return `<div class="item-stat"><span>${esc(statLabel(b.stat))}</span><b>${value}</b></div>`;
    }).join('')}</div>`;
  }
  if (item.kind === 'consumable') {
    body = `<div class="item-stats">
      <div class="item-stat"><span>${esc(t('item.quantity'))}</span><b>${fmt(item.qty ?? 1)}</b></div>
      <div class="item-stat"><span>${esc(t('common.value'))}</span><b>${fmt(item.value ?? 0)}</b></div>
    </div>`;
  }
  if (item.kind === 'material') {
    body = `<div class="item-stats">
      <div class="item-stat"><span>${esc(t('item.quantity'))}</span><b>${fmt(item.qty ?? 1)}</b></div>
      <div class="item-stat"><span>${esc(t('common.value'))}</span><b>${fmt(item.value ?? 0)}</b></div>
    </div>`;
  }

  const compareBlock = compare ? `<div class="divider"></div>
    <div class="inv-section-title">${esc(t('inv.statsCompare'))}</div>
    ${itemStatRowsHTML(compare)}` : '';

  const tradeNote = item.tradeable === false ? `<div class="hint red" style="margin-top:7px">${icon('lock')} ${esc(t('common.soulbound'))}</div>` : '';

  return `<div class="item-card r-${rarity}" style="--rc:${color}">
    <div class="item-card-head">
      <div class="item-icon-lg">${icon(itemIconName(item))}</div>
      <div>
        <div class="ic-name">${esc(itemLabel(item))}</div>
        <div class="ic-meta">${meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
      </div>
    </div>
    ${body}
    <div class="item-desc">${esc(itemDescription(item))}</div>
    ${tradeNote}
    ${compareBlock}
    ${actions ? `<div class="item-actions">${actions}</div>` : ''}
  </div>`;
}

export function materialCount(player, id) {
  return (player.inventory ?? []).filter((x) => x.kind === 'material' && x.id === id).reduce((s, x) => s + (x.qty ?? 1), 0);
}

export function itemCountByUid(player, uid) {
  return player.inventory.find((x) => x.uid === uid) ?? null;
}

export function rarityColor(item) {
  return RARITY[itemRarity(item)]?.color ?? '#d9b76a';
}

export function heroCanvasLoop(canvas, player, opts, register) {
  if (!canvas) return () => {};
  const started = performance.now();
  let raf = 0;
  const draw = (now) => {
    if (!canvas.isConnected) return;
    // Imported lazily by callers to keep this helper free of UI cycles.
    opts.render(canvas, player, (now - started) / 1000);
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  register?.(() => cancelAnimationFrame(raf));
  return () => cancelAnimationFrame(raf);
}

export function progressLine(value, max) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return `<div class="progress-line"><i style="width:${pct}%"></i></div>`;
}
