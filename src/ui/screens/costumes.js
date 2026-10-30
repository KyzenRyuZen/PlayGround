/* Cosmetics — outfits, weapon skins, hairstyles and auras. */

import { Engine } from '../../core/engine.js';
import { COSTUMES, COSTUME_SLOTS, COSTUME_SLOT_LABELS } from '../../data/collections.js';
import { RARITY_BY_ID } from '../../data/items.js';
import { statLabel, statSuffix } from '../../core/stats.js';
import { esc, fmt, pageHead, emptyState, confirmModal, chip } from '../components.js';
import { icon } from '../icons.js';
import { costumeArt } from '../sprites.js';

function bonusText(costume) {
  if (!costume.bonus?.length) return 'No stat bonus · pure style';
  return costume.bonus.map(b => `${statLabel(b.stat)} +${b.value}${statSuffix(b.stat)}`).join(' · ');
}

function priceLabel(costume) {
  return costume.priceCoins ? `${fmt(costume.priceCoins)} coins` : `${fmt(costume.priceGold)} gold`;
}

function priceIcon(costume) {
  return costume.priceCoins ? 'premium' : 'coin';
}

export function render(ctx) {
  const { state } = ctx;
  const hero = state.hero;
  const slot = COSTUME_SLOTS.includes(ctx.params?.slot) ? ctx.params.slot : 'outfit';
  const owned = new Set(hero.costumes.owned || []);
  const equipped = hero.costumes.equipped || {};
  const entries = Object.values(COSTUMES).filter(c => c.slot === slot);

  const tabs = COSTUME_SLOTS.map(key => {
    const list = Object.values(COSTUMES).filter(c => c.slot === key);
    const count = list.filter(c => owned.has(c.id)).length;
    return `<button class="tab ${key === slot ? 'active' : ''}" data-costume-tab="${key}" type="button">${icon(key === 'outfit' ? 'armor' : key === 'weapon' ? 'sword' : key === 'hair' ? 'mask' : 'sparkles')} ${esc(COSTUME_SLOT_LABELS[key])} <span class="badge">${count}/${list.length}</span></button>`;
  }).join('');

  const cards = entries.map(costume => {
    const rar = RARITY_BY_ID[costume.rarity] || RARITY_BY_ID.common;
    const isOwned = owned.has(costume.id);
    const isEquipped = equipped[costume.slot] === costume.id;
    const affordable = costume.priceCoins ? hero.premiumCoins >= costume.priceCoins : hero.gold >= costume.priceGold;
    return `<article class="costume-card ${isOwned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}" style="--c-glow:${costume.colors?.aura || rar.glow}">
      <div class="costume-preview" style="--rarity:${rar.color}">
        <span class="aura-orb"></span>
        ${costumeArt(costume)}
      </div>
      <div class="costume-body">
        <div class="c-type"><span style="color:${rar.color}">${rar.name}</span> · ${esc(costume.type)}</div>
        <h3>${esc(costume.name)}</h3>
        <div class="c-bonus">${esc(bonusText(costume))}</div>
        <div class="muted" style="font-size:8.5px;line-height:1.4;min-height:24px">${esc(costume.desc)}</div>
        <div class="c-foot">
          ${isOwned
            ? `<span class="pill ${isEquipped ? 'green' : ''}">${icon(isEquipped ? 'check' : 'mask')} ${isEquipped ? 'Worn' : 'Owned'}</span>
               <button class="btn tiny ${isEquipped ? 'ghost' : 'secondary'}" data-costume-equip="${costume.id}" type="button">${isEquipped ? 'Remove' : 'Wear'}</button>`
            : `<span class="pill ${costume.priceCoins ? 'violet' : 'gold'}">${icon(priceIcon(costume))} ${priceLabel(costume)}</span>
               <button class="btn tiny ${affordable ? '' : 'ghost'}" data-costume-buy="${costume.id}" type="button" ${affordable ? '' : 'disabled'}>${icon('shop')} ${costume.priceCoins ? 'Unlock' : 'Buy'}</button>`}
        </div>
      </div>
    </article>`;
  }).join('');

  const ownedCount = Object.keys(COSTUMES).filter(id => owned.has(id)).length;
  const activeBonuses = Object.values(equipped).filter(Boolean).map(id => COSTUMES[id]).filter(Boolean);

  return `
  ${pageHead('Wardrobe', `${ownedCount} of ${Object.keys(COSTUMES).length} cosmetics owned · choose one look per slot`,
    `<button class="btn ghost" data-nav="shop" type="button">${icon('premium')} Premium coins</button>`, 'Wear the legend')}

  <div class="tabs">${tabs}</div>

  <div class="grid-2" style="align-items:start">
    <section class="panel pad">
      <div class="flex between wrap" style="margin-bottom:9px">
        <div><span class="eyebrow">${esc(COSTUME_SLOT_LABELS[slot])}</span><h3 style="font-size:15px">${entries.length} available</h3></div>
        <span class="pill">${entries.filter(c => owned.has(c.id)).length} owned</span>
      </div>
      <div class="costume-grid">${cards || emptyState('mask', 'Nothing here yet', 'New cosmetics arrive with events and the premium shop.')}</div>
    </section>

    <div class="flex-col" style="gap:14px">
      <section class="panel pad">
        <span class="eyebrow">Current look</span>
        <h3 style="font-size:15px;margin-bottom:7px">What the vale sees</h3>
        <div class="mini-set">
          ${COSTUME_SLOTS.map(key => {
            const look = equipped[key] ? COSTUMES[equipped[key]] : null;
            return `<div class="ms-row">${icon(key === 'outfit' ? 'armor' : key === 'weapon' ? 'sword' : key === 'hair' ? 'mask' : 'sparkles')}<span style="width:74px;color:var(--muted-2)">${esc(COSTUME_SLOT_LABELS[key])}</span><span class="spacer"></span><span style="color:${look ? 'var(--ivory)' : 'var(--muted-2)'}">${look ? esc(look.name) : '— none —'}</span></div>`;
          }).join('')}
        </div>
        <div class="flex wrap mt-2" style="gap:5px">
          ${activeBonuses.length ? activeBonuses.flatMap(c => c.bonus || []).map(b => chip(`${statLabel(b.stat)} +${b.value}${statSuffix(b.stat)}`, 'gold', 'sparkles')).join('') : chip('No cosmetic bonuses active', '', 'info')}
        </div>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Wardrobe notes</span>
        <h3 style="font-size:14px;margin-bottom:5px">Style is power, a little</h3>
        <p class="muted" style="font-size:10px;line-height:1.6">Outfits, hairstyles and auras may carry small bonuses. Weapon skins change the look of your equipped weapon only — never its stats.</p>
        <div class="flex wrap mt-2" style="gap:5px">
          ${chip(`${hero.costumes.owned.length} owned`, 'violet', 'mask')}
          ${chip(`${fmt(hero.premiumCoins)} coins`, 'violet', 'premium')}
          ${chip(`${fmt(hero.gold)} gold`, 'gold', 'coin')}
        </div>
        <div class="muted" style="font-size:8.5px;margin-top:8px">Premium coin cosmetics are earned from milestones, the free cache and the premium shop. No purchase is ever required to be powerful.</div>
      </section>
    </div>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-costume-tab]').forEach(btn => {
    btn.addEventListener('click', () => ctx.refresh({ slot: btn.dataset.costumeTab }));
  });

  root.querySelectorAll('[data-costume-equip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = Engine.equipCostume(btn.dataset.costumeEquip);
      if (!res.ok) return ctx.toast?.(res.message || 'Could not wear that cosmetic.', 'danger');
      ctx.refresh();
    });
  });

  root.querySelectorAll('[data-costume-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const costume = COSTUMES[btn.dataset.costumeBuy];
      if (!costume) return;
      const buy = () => {
        const res = Engine.buyCostume(costume.id);
        if (!res.ok) return ctx.toast?.(res.message || 'The wardrobe refuses.', 'danger');
        ctx.refresh();
      };
      if (costume.priceCoins) {
        confirmModal({
          title: `Unlock ${costume.name}?`,
          message: `This cosmetic costs <b>${fmt(costume.priceCoins)} premium coins</b>. Premium coins are earned through play or bought in the premium shop.`,
          confirmLabel: `Unlock for ${fmt(costume.priceCoins)} coins`,
          onConfirm: buy,
        });
      } else {
        buy();
      }
    });
  });
}
