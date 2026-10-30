/* Companions — pets, mounts and spirit allies. */

import { Engine } from '../../core/engine.js';
import { PETS, MOUNTS, COMPANIONS } from '../../data/collections.js';
import { RARITY_BY_ID, MATERIALS } from '../../data/items.js';
import { esc, fmt, pageHead, emptyState, chip } from '../components.js';
import { icon } from '../icons.js';
import { collectionArt } from '../sprites.js';
import { collectionBonusLines } from './util.js';

const KINDS = {
  pet: { id: 'pet', label: 'Pets', singular: 'pet', map: PETS, bucket: 'pets', material: 'petEssence', cost: 2500, icon: 'paw', tab: 'Wild companions' },
  mount: { id: 'mount', label: 'Mounts', singular: 'mount', map: MOUNTS, bucket: 'mounts', material: 'mountFeed', cost: 9000, icon: 'horseshoe', tab: 'Steeds & drakes' },
  companion: { id: 'companion', label: 'Spirits', singular: 'spirit', map: COMPANIONS, bucket: 'companions', material: 'soulEmber', cost: 6500, icon: 'soul', tab: 'Bound spirits' },
};

export function render(ctx) {
  const { state } = ctx;
  const hero = state.hero;
  const selected = KINDS[ctx.params?.kind] ? ctx.params.kind : 'pet';
  const kind = KINDS[selected];
  const bucket = hero[kind.bucket];
  const entries = Object.values(kind.map);
  const ownedCount = Object.keys(bucket.owned || {}).length;
  const active = bucket.active ? kind.map[bucket.active] : null;
  const activeLevel = active ? bucket.owned[active.id]?.level || 1 : 0;

  const tabs = Object.values(KINDS).map(k => {
    const count = Object.keys(hero[k.bucket].owned || {}).length;
    return `<button class="tab ${k.id === selected ? 'active' : ''}" data-comp-tab="${k.id}" type="button">${icon(k.icon)} ${k.label} <span class="badge">${count}/${Object.keys(k.map).length}</span></button>`;
  }).join('');

  const cards = entries.map(entry => {
    const owned = bucket.owned?.[entry.id];
    const isActive = bucket.active === entry.id;
    const rar = RARITY_BY_ID[entry.rarity] || RARITY_BY_ID.common;
    const level = owned?.level || 1;
    const rarIndex = rar.index;
    const matCost = 2 + level * 2 + rarIndex * 2;
    const goldCost = Math.round((260 + level * 170) * (1 + rarIndex * 0.35));
    const canLevel = owned && level < 20 && hero.gold >= goldCost && (hero.materials[kind.material] || 0) >= matCost;
    return `<article class="collection-card ${owned ? '' : 'locked'} ${isActive ? 'active' : ''}">
      <div class="collection-art" style="--glow:${entry.palette?.glow || 'rgba(141,108,242,.18)'}">${collectionArt(entry.visual, entry.palette)}</div>
      <div class="c-type">${rar.name} · ${esc(entry.title || '')}</div>
      <div class="c-name">${esc(entry.name)}</div>
      ${owned
        ? `<div class="c-bonus">${esc(collectionBonusLines(entry, level))}</div>
           <div class="c-level"><span>Level ${level}/20</span><span class="pill ${isActive ? 'green' : ''}">${isActive ? 'Active' : `${MATERIALS[kind.material].name} ${matCost}`}</span></div>
           <div class="flex" style="gap:4px;margin-top:2px">
             <button class="btn tiny ${isActive ? 'secondary' : ''}" data-comp-equip="${entry.id}" type="button" style="flex:1">${isActive ? 'Dismiss' : 'Summon'}</button>
             <button class="btn tiny ghost" data-comp-level="${entry.id}" type="button" ${level >= 20 ? 'disabled' : ''} title="${fmt(goldCost)}g + ${matCost} ${MATERIALS[kind.material].name}">${level >= 20 ? 'Max' : `${icon('plus')} ${fmt(goldCost)}g`}</button>
           </div>`
        : `<div class="c-bonus">${esc(collectionBonusLines(entry, 1))}</div>
           <div class="c-level"><span>${icon('lock')} Not yet bound</span><span>${esc(entry.source || '')}</span></div>
           <div class="c-level" style="color:var(--muted-2);line-height:1.3">${esc(entry.desc || '')}</div>`}
    </article>`;
  }).join('');

  return `
  ${pageHead('Companions', `${ownedCount} of ${entries.length} ${kind.label.toLowerCase()} bound · one of each may accompany you`,
    `<button class="btn ghost" data-nav="stages" type="button">${icon('map')} Seek more</button>`, 'Bonds')}

  <div class="tabs">${tabs}</div>

  ${active
    ? `<div class="active-companion">
        <div class="ac-art">${collectionArt(active.visual, active.palette)}</div>
        <div class="ac-info">
          <div class="ac-sub">${esc(KINDS[selected].singular)} active · level ${activeLevel}</div>
          <h3>${esc(active.name)}</h3>
          <div class="ac-bonus">${esc(collectionBonusLines(active, activeLevel))}</div>
          <div class="ac-bonus" style="color:var(--muted-2);margin-top:2px">Skill: <b style="color:var(--gold)">${esc(active.skill?.name || '—')}</b> — ${esc(active.skill?.desc || '')}</div>
        </div>
        <div class="ac-actions">
          <button class="btn tiny ghost" data-comp-equip="${active.id}" type="button">Dismiss</button>
          <button class="btn tiny secondary" data-comp-level="${active.id}" type="button">${activeLevel >= 20 ? 'Max level' : 'Level up'}</button>
        </div>
      </div>`
    : `<div class="active-companion" style="justify-content:center;text-align:center"><div class="ac-info"><div class="ac-sub">No ${kind.singular} summoned</div><h3>Fight alone, for now</h3><div class="ac-bonus">Bind one below to gain its passive bonus and battle skill.</div></div></div>`}

  <section class="panel pad">
    <div class="flex between wrap" style="margin-bottom:10px">
      <div><span class="eyebrow">Collection</span><h3 style="font-size:15px">${esc(kind.tab)}</h3></div>
      <div class="flex" style="gap:6px">
        ${chip(`${MATERIALS[kind.material].name} ${fmt(hero.materials[kind.material] || 0)}`, '', kind.icon)}
        <button class="btn tiny" data-comp-summon="${selected}" type="button" ${hero.gold < kind.cost ? 'disabled' : ''}>${icon('gift')} Summon · ${fmt(kind.cost)}g</button>
      </div>
    </div>
    <div class="collection-grid">${cards || emptyState('paw', 'No collection entries', 'The vale has hidden them well.')}</div>
  </section>

  <div class="grid-2 mt-3">
    <section class="panel pad">
      <span class="eyebrow">Wild summons</span>
      <h3 style="font-size:14px;margin-bottom:5px">${esc(KINDS[selected].singular)} eggs & whistles</h3>
      <p class="muted" style="font-size:10px;line-height:1.55">Summons cost ${fmt(kind.cost)} gold and can return anything in the collection, weighted by rarity. Duplicates become ${MATERIALS[kind.material].name}.</p>
      <div class="material-row mt-2">${chip(`${MATERIALS[kind.material].name} ${fmt(hero.materials[kind.material] || 0)}`, '', kind.icon)}${chip(`${fmt(hero.gold)} gold`, 'gold', 'coin')}</div>
    </section>
    <section class="panel pad">
      <span class="eyebrow">All bonds</span>
      <h3 style="font-size:14px;margin-bottom:7px">Currently at your side</h3>
      <div class="mini-set">
        ${Object.values(KINDS).map(k => {
          const b = hero[k.bucket];
          const data = b.active ? k.map[b.active] : null;
          return `<div class="ms-row">${icon(k.icon)}<span>${k.label}</span><span class="spacer"></span><span style="color:${data ? 'var(--ivory)' : 'var(--muted-2)'}">${data ? esc(data.name) : '— none —'}</span></div>`;
        }).join('')}
      </div>
      <p class="muted mt-2" style="font-size:9px">All three bonds can be active at once. Only one of each kind may be summoned.</p>
    </section>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-comp-tab]').forEach(btn => {
    btn.addEventListener('click', () => ctx.refresh({ kind: btn.dataset.compTab }));
  });

  root.querySelectorAll('[data-comp-equip]').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = KINDS[ctx.params?.kind] ? ctx.params.kind : 'pet';
      const id = btn.dataset.compEquip;
      const kind = KINDS[selected];
      const action = selected === 'pet' ? 'equipPet' : selected === 'mount' ? 'equipMount' : 'equipCompanion';
      const res = Engine[action](id);
      if (res.ok) ctx.toast?.(res.active ? `${kind.map[id].name} answers your call.` : `${kind.map[id].name} is dismissed.`, res.active ? 'success' : 'info');
      ctx.refresh();
    });
  });

  root.querySelectorAll('[data-comp-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = KINDS[ctx.params?.kind] ? ctx.params.kind : 'pet';
      const res = Engine.levelCollection(selected, btn.dataset.compLevel);
      if (!res.ok) ctx.toast?.(res.message || 'Could not empower that bond.', 'danger');
      ctx.refresh();
    });
  });

  root.querySelectorAll('[data-comp-summon]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = Engine.summonEgg(btn.dataset.compSummon);
      if (!res.ok) ctx.toast?.(res.message || 'The summoning failed.', 'danger');
      ctx.refresh();
    });
  });
}
