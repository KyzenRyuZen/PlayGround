// Character, inventory, mounts, wardrobe and storage panels.
import { t, tx, icon, esc, fmt, toast, confirmDialog, formatPlaytime } from '../common.js';
import {
  xpForLevel, currentZone, saveNow, recalc, isUnlocked, applyCosmetic,
  playerEquippedCosmetic, removeItem,
} from '../../core/game.js';
import { CLASSES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, OUTFITS } from '../../data/classes.js';
import { SLOTS, itemName, MATERIALS, RARITY } from '../../data/items.js';
import { MOUNTS, PETS, FXS, WINGS_SHOP, COSTUMES } from '../../data/shop.js';
import { renderHero } from '../heroArt.js';
import {
  itemCellHTML, gearSlotsHTML, statValue, itemIconName, itemLabel, itemRarity, heroCanvasLoop, progressLine,
} from '../panelKit.js';

const pct = (v, digits = 1) => `${(v * 100).toFixed(digits)}%`;

function charTags(p) {
  const cls = CLASSES[p.classId];
  return `<div class="char-tags">
    <span class="chip gold">${icon('crown')} ${esc(tx(cls.name))}</span>
    <span class="chip">${esc(t(`faction.${p.faction}`))}</span>
    <span class="chip">${icon('map')} ${esc(t(currentZone(p).key))}</span>
    ${p.wing ? `<span class="chip gold">${icon('wings')} ${esc(t('store.wings'))}</span>` : ''}
    ${p.title ? `<span class="chip gold">${icon('trophy')} ${esc(p.title)}</span>` : ''}
  </div>`;
}

function stoneCard(p) {
  const stone = p.stones?.find((s) => s.uid === p.activeStone) ?? null;
  if (!stone) {
    return `<div class="section-block">
      <div class="section-head"><h3>${esc(t('char.stone'))}</h3><span>${esc(t('stone.title'))}</span></div>
      <div class="empty-state" style="padding:18px">${icon('crystal')}<p>${esc(t('char.noStone'))}</p></div>
    </div>`;
  }
  return `<div class="section-block">
    <div class="section-head"><h3>${esc(t('char.stone'))}</h3><span class="gold-text">${esc(tx(stone.name))}</span></div>
    <div class="stone-card">
      <div class="sc-title">${icon('crystal')} ${esc(tx(stone.name))}</div>
      ${(stone.bonuses ?? []).map((b) => `<div class="stone-bonus"><span>${esc(t(`stats.${b.stat}`))}</span><b>${b.pct ? `+${pct(b.value)}` : `+${fmt(Math.round(b.value))}`}</b></div>`).join('')}
      <div class="hint" style="margin-top:6px">${esc(t('stone.critCap'))}</div>
    </div>
  </div>`;
}

function statBlock(p) {
  const s = p.stats;
  return `<div class="stat-list">
    <div class="stat-row"><span>${icon('sword')} ${esc(t('stats.attack'))}</span><b>${fmt(Math.round(s.attack))}</b></div>
    <div class="stat-row"><span>${icon('shield')} ${esc(t('stats.defense'))}</span><b>${fmt(Math.round(s.armor))}</b></div>
    <div class="stat-row"><span>${icon('heart')} ${esc(t('stats.hp'))}</span><b>${fmt(Math.round(s.maxHp))}</b></div>
    <div class="stat-row"><span>${icon('spark')} ${esc(t('stats.crit'))}</span><b>${pct(s.crit)}</b></div>
    <div class="stat-row"><span>${icon('flame')} ${esc(t('stats.critDmg'))}</span><b>${pct(s.critDmg)}</b></div>
    <div class="stat-row"><span>${icon('drop')} ${esc(t('stats.lifesteal'))}</span><b>${pct(s.lifesteal)}</b></div>
    <div class="stat-row"><span>${icon('gold')} ${esc(t('stats.goldFind'))}</span><b>${pct(s.goldFind)}</b></div>
    <div class="stat-row"><span>${icon('herb')} ${esc(t('stats.gatherSpeed'))}</span><b>${pct(s.gatherSpeed)}</b></div>
    <div class="stat-row"><span>${icon('heart')} ${esc(t('stats.hpRegen'))}</span><b>${fmt(Math.round(s.hpRegen))}/s</b></div>
    <div class="stat-row"><span>${icon('crown')} ${esc(t('char.gearScore'))}</span><b>${fmt(s.gearScore)}</b></div>
  </div>`;
}

export function characterView(panel) {
  const p = panel.player;
  const tab = panel.state.tab ?? 'overview';
  const cls = CLASSES[p.classId];
  if (tab === 'skills') {
    return {
      title: t('char.title'),
      subtitle: `${p.name} · ${tx(cls.name)}`,
      tabs: [
        { id: 'overview', label: t('char.overview') },
        { id: 'skills', label: t('menu.skills') },
      ],
      body: `<div class="section-block">
        <div class="passive-card">${icon(cls.passive.icon)}<div><h3>${esc(tx(cls.passive.name))}</h3><p class="hint">${esc(tx(cls.passive.desc))}</p></div></div>
      </div>
      ${cls.skills.map((skill, i) => `<div class="skill-card${p.level < skill.unlock ? ' locked' : ''}">
        <div class="skill-icon" style="--sc:${skill.color}">${icon(skill.icon)}</div>
        <div class="grow">
          <h3>${esc(tx(skill.name))}</h3>
          <div class="sk-meta"><span>${esc(t('common.level'))} ${skill.unlock}</span><span>${esc(t('common.cooldown'))}: ${skill.cd}s</span><span>${esc(t('common.cost'))}: ${skill.cost} ${esc(t(`common.${cls.resource}`))}</span></div>
          <div class="sk-desc">${esc(tx(skill.desc))}</div>
        </div>
        <div class="skill-rank"><b>${i + 1}</b><span>${esc(t(p.level >= skill.unlock ? 'skill.learned' : 'skill.locked'))}</span></div>
      </div>`).join('')}
      <p class="hint" style="margin-top:8px">${esc(t('common.critCap'))}</p>`,
      resources: false,
      mount: (overlay) => {
        overlay.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
          panel.state.tab = btn.dataset.tab;
          panel.refresh({ tab: btn.dataset.tab });
        }));
      },
    };
  }
  const nextXp = xpForLevel(p.level);
  return {
    title: t('char.title'),
    subtitle: `${p.name} · ${t('common.lv')} ${p.level}`,
    tabs: [
      { id: 'overview', label: t('char.overview') },
      { id: 'skills', label: t('menu.skills') },
    ],
    body: `<div class="char-hero-wrap">
      <canvas id="charHeroCanvas"></canvas>
      <div class="char-hero-meta">
        <div>
          <h3>${esc(p.name)}</h3>
          <div class="ch-sub">${esc(tx(cls.name))} · ${esc(t(`faction.${p.faction}`))}</div>
        </div>
        <div class="ch-power"><b>${fmt(p.stats.power)}</b><span>${esc(t('char.power'))}</span></div>
      </div>
    </div>
    ${charTags(p)}
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('common.level'))} ${p.level}</h3><span>${p.level >= 60 ? esc(t('common.max')) : `${fmt(p.xp)} / ${fmt(nextXp)} XP`}</span></div>
      ${progressLine(p.xp, nextXp)}
      <div class="hint" style="margin-top:7px">${esc(t('char.powerHint'))}</div>
    </div>
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('char.stats'))}</h3><span>${esc(t('char.statBreakdown'))}</span></div>
      ${statBlock(p)}
    </div>
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('char.equipment'))}</h3><span>${esc(t('char.slots'))} 9</span></div>
      <div class="inventory-equip-grid">${gearSlotsHTML(p)}</div>
    </div>
    ${stoneCard(p)}
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('char.title'))}</h3><span>${esc(t('menu.hero'))}</span></div>
      <div class="stat-list">
        <div class="stat-row"><span>${esc(t('common.faction'))}</span><b>${esc(t(`faction.${p.faction}`))}</b></div>
        <div class="stat-row"><span>${esc(t('char.zone'))}</span><b>${esc(t(currentZone(p).key))}</b></div>
        <div class="stat-row"><span>${esc(t('char.kills'))}</span><b>${fmt(p.kills ?? 0)}</b></div>
        <div class="stat-row"><span>${esc(t('char.bossKills'))}</span><b>${fmt(p.bossKills ?? 0)}</b></div>
        <div class="stat-row"><span>${esc(t('char.questsDone'))}</span><b>${fmt(p.questsDone ?? 0)}</b></div>
        <div class="stat-row"><span>${esc(t('char.playtime'))}</span><b>${formatPlaytime(p.playtimeMs ?? 0)}</b></div>
      </div>
    </div>`,
    resources: false,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
        panel.state.tab = btn.dataset.tab;
        panel.refresh({ tab: btn.dataset.tab });
      }));
      overlay.querySelectorAll('[data-eq-slot]').forEach((btn) => btn.addEventListener('click', () => {
        const it = p.equipment[btn.dataset.eqSlot];
        if (it) panel.openItem(it.uid, 'equip');
      }));
      const canvas = overlay.querySelector('#charHeroCanvas');
      heroCanvasLoop(canvas, p, {
        render: (c, player, time) => renderHero(c, player, time, { zoom: 1.02 }),
      }, (fn) => panel.cleanups.push(fn));
    },
  };
}

const FILTERS = [
  { id: 'all', label: 'inv.all' },
  { id: 'weapons', label: 'inv.weapons' },
  { id: 'armor', label: 'inv.armor' },
  { id: 'jewelry', label: 'inv.jewelry' },
  { id: 'consumables', label: 'inv.consumables' },
  { id: 'materials', label: 'inv.materials' },
];

function bagItems(p, filter) {
  if (filter === 'weapons' || filter === 'armor' || filter === 'jewelry') {
    const slots = SLOTS.filter((s) => s.group === filter).map((s) => s.id);
    return p.inventory.filter((it) => it.kind === 'equip' && slots.includes(it.slot));
  }
  if (filter === 'consumables') return p.inventory.filter((it) => it.kind === 'consumable');
  if (filter === 'materials') return p.inventory.filter((it) => it.kind === 'material');
  return p.inventory;
}

export function inventoryView(panel) {
  const p = panel.player;
  const filter = panel.state.invFilter ?? 'all';
  const items = bagItems(p, filter);
  const junk = p.inventory.filter((it) => it.kind === 'equip' && it.rarity === 'grey');
  return {
    title: t('inv.title'),
    subtitle: t('inv.slots', { used: p.inventory.length, max: 48 }),
    tabs: FILTERS.map((f) => ({ id: f.id, label: t(f.label) })),
    body: `
      <div class="inv-section-title"><span>${esc(t('inv.equipment'))}</span><span>${esc(t('char.slots'))}</span></div>
      <div class="inventory-equip-grid">${gearSlotsHTML(p)}</div>
      <div class="inv-section-title"><span>${esc(t('inv.bag'))}</span><span>${esc(t('inv.slots', { used: p.inventory.length, max: 48 }))}</span></div>
      ${items.length ? `<div class="item-grid" id="bagGrid">${items.map((it) => itemCellHTML(it, `data-item-uid="${esc(it.uid)}" data-item-source="bag"`)).join('')}</div>`
        : `<div class="empty-state">${icon('bag')}<h3>${esc(t('inv.emptyTitle'))}</h3><p>${esc(t('inv.emptyHint'))}</p></div>`}
      <p class="hint" style="margin-top:10px">${esc(t('common.tapToEquip'))} · ${esc(t('common.critCap'))}</p>
      ${filter === 'all' && junk.length ? `<div class="panel-actions" style="margin-top:10px"><button class="btn ghost" data-sell-junk>${icon('gold')} ${esc(t('inv.sellAllJunk'))} · ${junk.length}</button></div>` : ''}
    `,
    resources: true,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-eq-slot]').forEach((btn) => btn.addEventListener('click', () => {
        const it = p.equipment[btn.dataset.eqSlot];
        if (it) panel.openItem(it.uid, 'equip');
      }));
      overlay.querySelectorAll('[data-item-uid]').forEach((btn) => btn.addEventListener('click', () => {
        panel.openItem(btn.dataset.itemUid, btn.dataset.itemSource);
      }));
      overlay.querySelector('[data-sell-junk]')?.addEventListener('click', () => {
        const list = p.inventory.filter((it) => it.kind === 'equip' && it.rarity === 'grey');
        const gold = list.reduce((sum, it) => sum + Math.max(1, Math.round((it.value ?? 5) * 1.3)), 0);
        confirmDialog(t('inv.sellAllJunk'), t('inv.sellAllText', { n: list.length, gold }), () => {
          let earned = 0;
          for (const it of list) {
            const idx = p.inventory.indexOf(it);
            if (idx >= 0) {
              p.inventory.splice(idx, 1);
              earned += Math.max(1, Math.round((it.value ?? 5) * 1.3));
            }
          }
          p.gold += earned;
          toast(t('merchant.sold', { n: earned }), 'good');
          saveNow();
          panel.refresh();
        }, { confirmLabel: t('common.sell') });
      });
    },
  };
}

export function mountsView(panel) {
  const p = panel.player;
  const current = p.mount;
  return {
    title: t('mount.title'),
    subtitle: t('mount.subtitle'),
    body: `<div class="mount-grid">
      ${Object.values(MOUNTS).map((mount) => {
        const owned = p.mounts.includes(mount.id);
        const active = current === mount.id;
        return `<div class="mount-card${owned ? ' owned' : ''}${active ? ' active' : ''}" style="--mc:${mount.glow || '#d9b76a'}">
          <div class="mount-art">${icon(mount.icon)}</div>
          <h3>${esc(tx(mount.name))}</h3>
          <p>${esc(tx(mount.desc))}</p>
          <div class="hint" style="margin-bottom:6px">${esc(t('mount.speed'))} +${Math.round(mount.speed * 100)}%${mount.source === 'quest' ? ` · ${esc(t('mount.questReward'))}` : ''}</div>
          ${owned
            ? `<button class="btn ${active ? 'ghost' : 'primary'}" data-mount="${mount.id}">${esc(t(active ? 'mount.dismiss' : 'mount.call'))}</button>`
            : `<button class="btn ghost" data-mount-shop>${esc(t('mount.locked'))} · ${esc(t('store.buy'))}</button>`}
        </div>`;
      }).join('')}
    </div>
    <p class="hint" style="margin-top:12px">${esc(t('mount.wingless'))}</p>`,
    resources: false,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-mount]').forEach((btn) => btn.addEventListener('click', () => {
        const id = btn.dataset.mount;
        applyCosmetic(p, 'mount', p.mount === id ? null : id);
        saveNow();
        panel.refresh();
      }));
      overlay.querySelector('[data-mount-shop]')?.addEventListener('click', () => panel.open('shop', { tab: 'mounts' }));
    },
  };
}

function cosmeticSection(title, data, type, player, panel, activeId, iconName) {
  const entries = Object.values(data);
  return `<div class="wardrobe-section">
    <div class="inv-section-title"><span>${esc(title)}</span><span>${entries.filter((x) => isCosmeticOwned(player, type, x)).length}/${entries.length}</span></div>
    <div class="cosmetic-grid">
      ${entries.map((item) => {
        const owned = isCosmeticOwned(player, type, item);
        const active = activeId === item.id;
        return `<button class="cosmetic-chip${active ? ' on' : ''}" data-cosmetic="${type}" data-id="${item.id}" style="--cc:${item.color || item.weapons || '#d9b76a'}">
          ${icon(item.icon || iconName)}
          <span><span class="cc-name">${esc(tx(item.name))}</span><span class="cc-sub">${esc(active ? t('store.equipped') : owned ? t('store.equip') : t('wardrobe.locked'))}</span></span>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

function isCosmeticOwned(p, type, item) {
  if (type === 'costume') return p.costumes.includes(item.id);
  if (type === 'wing') return p.wings.includes(item.id);
  if (type === 'mount') return p.mounts.includes(item.id);
  if (type === 'pet') return p.pets.includes(item.id);
  if (type === 'fx') return p.fxUnlocks.includes(item.id);
  return false;
}

export function wardrobeView(panel) {
  const p = panel.player;
  const tab = panel.state.tab ?? 'hair';
  const tabs = [
    { id: 'hair', label: t('wardrobe.hair') },
    { id: 'costumes', label: t('wardrobe.costume') },
    { id: 'wings', label: t('wardrobe.wings') },
    { id: 'extras', label: t('menu.collections') },
  ];
  let body = '';
  if (tab === 'hair') {
    body = `<div class="char-hero-wrap" style="height:250px">
      <canvas id="wardrobeHeroCanvas"></canvas>
      <div class="char-hero-meta"><div><h3>${esc(p.name)}</h3><div class="ch-sub">${esc(t('wardrobe.title'))}</div></div></div>
    </div>
    <div class="wardrobe-section">
      <div class="inv-section-title"><span>${esc(t('wardrobe.hair'))}</span></div>
      <div class="wig-row">${HAIR_STYLES.map((h) => `<button class="wig${p.hair === h.id ? ' on' : ''}" data-hair="${h.id}">${h.id}</button>`).join('')}</div>
    </div>
    <div class="wardrobe-section">
      <div class="inv-section-title"><span>${esc(t('wardrobe.hairColor'))}</span></div>
      <div class="swatch-row">${HAIR_COLORS.map((c) => `<button class="swatch${p.hairColor === c.id ? ' on' : ''}" data-haircolor="${c.id}" style="background:${c.hex}" title="${esc(tx(c.name))}"></button>`).join('')}</div>
    </div>
    <div class="wardrobe-section">
      <div class="inv-section-title"><span>${esc(t('wardrobe.eyeColor'))}</span></div>
      <div class="swatch-row">${EYE_COLORS.map((c) => `<button class="swatch${p.eyeColor === c.id ? ' on' : ''}" data-eyecolor="${c.id}" style="background:${c.hex}" title="${esc(tx(c.name))}"></button>`).join('')}</div>
    </div>
    <div class="wardrobe-section">
      <div class="inv-section-title"><span>${esc(t('wardrobe.outfit'))}</span></div>
      <div class="outfit-row">${OUTFITS.map((o) => `<button class="outfit-option${p.outfit === o.id ? ' on' : ''}" data-outfit="${o.id}"><div class="oo-swatch">${o[p.faction].map((c) => `<i style="background:${c}"></i>`).join('')}</div><span>${esc(tx(o.name))}</span></button>`).join('')}</div>
    </div>
    <p class="hint">${esc(t('wardrobe.note'))}</p>`;
  } else if (tab === 'costumes') {
    body = cosmeticSection(t('wardrobe.costume'), COSTUMES, 'costume', p, panel, p.costume, 'costume');
  } else if (tab === 'wings') {
    body = `${cosmeticSection(t('wardrobe.wings'), Object.fromEntries(Object.values(WINGS_SHOP).map((w) => [w.id, w])), 'wing', p, panel, p.wing, 'wings')}
      <p class="hint">${esc(t('store.wingNote'))}</p>`;
  } else {
    body = `${cosmeticSection(t('wardrobe.pet'), PETS, 'pet', p, panel, p.pet, 'paw')}
      ${cosmeticSection(t('wardrobe.fx'), FXS, 'fx', p, panel, p.fx, 'flame')}
      ${cosmeticSection(t('wardrobe.mount'), Object.fromEntries(Object.values(MOUNTS).map((m) => [m.id, m])), 'mount', p, panel, p.mount, 'mount')}`;
  }
  return {
    title: t('wardrobe.title'),
    subtitle: t('store.wardrobeHint'),
    tabs,
    body,
    resources: false,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
        panel.state.tab = btn.dataset.tab;
        panel.refresh({ tab: btn.dataset.tab });
      }));
      overlay.querySelectorAll('[data-hair]').forEach((btn) => btn.addEventListener('click', () => {
        const id = Number(btn.dataset.hair);
        if (!isUnlocked(p, 'hair', id)) { panel.open('shop', { tab: 'hair' }); return; }
        p.hair = id;
        saveNow();
        panel.refresh({ tab: 'hair' });
      }));
      overlay.querySelectorAll('[data-haircolor]').forEach((btn) => btn.addEventListener('click', () => {
        p.hairColor = btn.dataset.haircolor; saveNow(); panel.refresh({ tab: 'hair' });
      }));
      overlay.querySelectorAll('[data-eyecolor]').forEach((btn) => btn.addEventListener('click', () => {
        p.eyeColor = btn.dataset.eyecolor; saveNow(); panel.refresh({ tab: 'hair' });
      }));
      overlay.querySelectorAll('[data-outfit]').forEach((btn) => btn.addEventListener('click', () => {
        p.outfit = Number(btn.dataset.outfit); saveNow(); panel.refresh({ tab: 'hair' });
      }));
      overlay.querySelectorAll('[data-cosmetic]').forEach((btn) => btn.addEventListener('click', () => {
        const type = btn.dataset.cosmetic;
        const id = btn.dataset.id;
        const owned = isCosmeticOwned(p, type, { id });
        if (!owned) { panel.open('shop', { tab: type === 'wing' ? 'wings' : type === 'mount' ? 'mounts' : type === 'pet' ? 'pets' : 'fx' }); return; }
        const activeId = playerEquippedCosmetic(p, type);
        applyCosmetic(p, type, activeId === id ? null : id);
        saveNow();
        panel.refresh({ tab });
      }));
      const canvas = overlay.querySelector('#wardrobeHeroCanvas');
      if (canvas) heroCanvasLoop(canvas, p, {
        render: (c, player, time) => renderHero(c, player, time, { zoom: 1.0 }),
      }, (fn) => panel.cleanups.push(fn));
    },
  };
}

export function storageView(panel) {
  const p = panel.player;
  return {
    title: t('storage.title'),
    subtitle: t('storage.subtitle'),
    body: `<div class="storage-columns">
      <div class="storage-panel">
        <h3>${esc(t('storage.bag'))}<span>${p.inventory.length}/48</span></h3>
        <div class="item-grid">${p.inventory.map((it) => itemCellHTML(it, `data-item-uid="${esc(it.uid)}" data-item-source="bag"`)).join('')}</div>
      </div>
      <div class="storage-panel">
        <h3>${esc(t('storage.stash'))}<span>${p.storage.length}/60</span></h3>
        ${p.storage.length ? `<div class="item-grid">${p.storage.map((it) => itemCellHTML(it, `data-item-uid="${esc(it.uid)}" data-item-source="storage"`)).join('')}</div>` : `<div class="hint" style="padding:12px 3px">${esc(t('storage.empty'))}</div>`}
      </div>
    </div>
    <div class="panel-actions" style="margin-top:12px">
      <button class="btn ghost" data-storage-all="deposit">${icon('storage')} ${esc(t('inv.depositAll'))}</button>
      <button class="btn ghost" data-storage-all="withdraw">${icon('bag')} ${esc(t('inv.withdrawAll'))}</button>
    </div>
    <p class="hint" style="margin-top:9px">${esc(t('storage.hint'))}</p>`,
    resources: false,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-item-uid]').forEach((btn) => btn.addEventListener('click', () => {
        panel.openItem(btn.dataset.itemUid, btn.dataset.itemSource);
      }));
      overlay.querySelectorAll('[data-storage-all]').forEach((btn) => btn.addEventListener('click', () => {
        if (btn.dataset.storageAll === 'deposit') {
          for (const it of [...p.inventory]) {
            if (it.kind !== 'material') continue;
            if (p.storage.length >= 60) break;
            const idx = p.inventory.indexOf(it);
            if (idx >= 0) { p.inventory.splice(idx, 1); p.storage.push(it); }
          }
        } else {
          for (const it of [...p.storage]) {
            if (it.kind !== 'material') continue;
            if (p.inventory.length >= 48) break;
            const idx = p.storage.indexOf(it);
            if (idx >= 0) { p.storage.splice(idx, 1); p.inventory.push(it); }
          }
        }
        saveNow();
        panel.refresh();
      }));
    },
  };
}
