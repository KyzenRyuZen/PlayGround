// Quest journal and world map panels.
import { t, tx, icon, esc, fmt, toast, confirmDialog } from '../common.js';
import {
  questsInZone, claimQuest, acceptQuest, ensureStoryQuest, zoneUnlocked, saveNow, currentZone,
} from '../../core/game.js';
import { ZONES, getZone } from '../../data/zones.js';
import { QUESTS } from '../../data/quests.js';
import { MOUNTS } from '../../data/shop.js';
import { WINGS } from '../../data/items.js';
import { progressLine } from '../panelKit.js';

function rewardChips(q) {
  const r = q.rewards ?? {};
  const out = [];
  if (r.xp) out.push(`<span>${icon('spark')}${fmt(r.xp)} XP</span>`);
  if (r.gold) out.push(`<span>${icon('gold')}${fmt(r.gold)}</span>`);
  if (r.gems) out.push(`<span>${icon('gem')}${fmt(r.gems)}</span>`);
  if (r.gear) out.push(`<span>${icon('sword')}${t(`rarity.${r.gear.rarity}`)} ${t(`slot.${r.gear.slot}`)}</span>`);
  if (r.mount && MOUNTS[r.mount]) out.push(`<span>${icon('mount')}${tx(MOUNTS[r.mount].name)}</span>`);
  if (r.wing && WINGS[r.wing]) out.push(`<span>${icon('wings')}${tx(WINGS[r.wing].name)}</span>`);
  if (r.title) out.push(`<span>${icon('trophy')}${esc(r.title)}</span>`);
  return out.join('');
}

function questCard(panel, q) {
  const p = panel.player;
  const entry = p.quests[q.id] ?? null;
  const state = entry?.state ?? 'available';
  const ready = state === 'done';
  const objectives = q.objectives.map((o, i) => {
    const done = entry?.progress?.[i] ?? 0;
    return `<div class="qo${done >= o.count ? ' done' : ''}"><span>${esc(t(`quest.${o.type === 'killElite' ? 'kill' : o.type}`, {
      target: o.type === 'gather' ? t(`gather.${o.target}`) : tx(zoneMonsterName(q.zone, o.target)),
    }))}</span><b>${Math.min(done, o.count)}/${o.count}</b></div>`;
  }).join('');
  let action = '';
  if (!entry) {
    action = `<button class="btn primary" data-accept="${q.id}">${esc(t('quest.accept'))}</button>`;
  } else if (ready) {
    action = `<button class="btn primary" data-claim="${q.id}">${esc(t('quest.turnIn'))}</button>`;
  } else if (state === 'active') {
    action = `<span class="quest-tag">${esc(t('quest.active'))}</span>`;
  } else {
    action = `<span class="quest-tag done">${esc(t('quest.completed'))}</span>`;
  }
  return `<div class="quest-card${q.story ? ' story' : ''}${ready ? ' ready' : ''}">
    <div class="qc-top">
      <div class="grow">
        <h3>${esc(tx(q.name))}</h3>
        <div class="qc-desc">${esc(tx(q.desc))}</div>
      </div>
      <span class="quest-tag${state === 'claimed' ? ' done' : ''}">${esc(t(q.story ? 'quest.story' : 'quest.side'))}</span>
    </div>
    <div class="qc-obj">${objectives}</div>
    <div class="qc-foot">
      <div class="qc-rewards">${rewardChips(q)}</div>
      ${action}
    </div>
  </div>`;
}

function zoneMonsterName(zoneId, id) {
  const zone = getZone(zoneId);
  const monster = zone.monsters?.find((m) => m.id === id) ?? (zone.elite?.id === id ? zone.elite : zone.boss?.id === id ? zone.boss : null);
  return monster?.name ?? id;
}

export function questsView(panel) {
  const p = panel.player;
  const zone = currentZone(p);
  const quests = questsInZone(p, zone.id);
  const elsewhere = Object.entries(p.quests)
    .filter(([id, entry]) => entry.state !== 'claimed' && !quests.some((x) => x.quest.id === id))
    .map(([id, entry]) => ({ quest: QUESTS.find((q) => q.id === id), entry }))
    .filter((x) => x.quest);
  const readyCount = quests.filter((x) => x.entry?.state === 'done').length;
  return {
    title: t('quest.title'),
    subtitle: `${t(zone.key)} · ${readyCount ? `${readyCount} ${t('quest.ready')}` : t('world.quests')}`,
    body: `
      <div class="section-block">
        <div class="section-head"><h3>${esc(t(zone.key))}</h3><span>${esc(t(`zone.${zone.id}Desc`))}</span></div>
        <div class="hint" style="margin-bottom:8px">${esc(t('quest.autoTurnIn'))}</div>
        ${quests.length ? quests.map((x) => questCard(panel, x.quest)).join('') : `<div class="empty-state">${icon('quest')}<p>${esc(t('quest.none'))}</p></div>`}
      </div>
      ${elsewhere.length ? `<div class="section-block">
        <div class="section-head"><h3>${esc(t('quest.active'))}</h3><span>${esc(t('world.zones'))}</span></div>
        ${elsewhere.map((x) => questCard(panel, x.quest)).join('')}
      </div>` : ''}
      <p class="hint">${esc(t('quest.trackerHint'))}</p>
    `,
    resources: false,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-accept]').forEach((btn) => btn.addEventListener('click', () => {
        const q = QUESTS.find((x) => x.id === btn.dataset.accept);
        if (acceptQuest(p, btn.dataset.accept)) toast(t('toast.questNew', { name: tx(q.name) }), 'good');
        saveNow();
        panel.screen.hud?.updateQuestTracker();
        panel.refresh();
      }));
      overlay.querySelectorAll('[data-claim]').forEach((btn) => btn.addEventListener('click', () => {
        const id = btn.dataset.claim;
        const q = QUESTS.find((x) => x.id === id);
        const gained = claimQuest(p, id);
        if (!gained) return;
        toast(t('quest.turnedIn'), 'good');
        if (gained.zone) toast(t('toast.zoneUnlock', { name: t(getZone(gained.zone).key) }), 'good');
        if (gained.wing) toast(t('toast.wingUnlock', { name: tx(WINGS[gained.wing]?.name ?? { de: gained.wing, en: gained.wing }) }), 'good');
        if (gained.mount) toast(t('toast.mountUnlock', { name: tx(MOUNTS[gained.mount]?.name ?? { de: gained.mount, en: gained.mount }) }), 'good');
        if (q?.story) {
          p.completedChapters = Math.max(p.completedChapters ?? 0, q.chapter);
          const next = ZONES.find((z) => z.unlockChapter <= p.completedChapters && !p.discoveredZones.includes(z.id));
          if (next) {
            p.discoveredZones.push(next.id);
            toast(t('toast.zoneUnlock', { name: t(next.key) }), 'good');
          }
        }
        ensureStoryQuest(p, p.zoneId);
        saveNow();
        panel.screen.hud?.refresh();
        panel.screen.hud?.updateQuestTracker();
        panel.refresh();
      }));
    },
  };
}

export function worldView(panel) {
  const p = panel.player;
  const current = p.zoneId;
  const pathPoints = ZONES.map((z) => `${z.map.x},${z.map.y}`).join(' ');
  const map = `<div class="world-map">
    <svg class="map-path" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pathPoints}" fill="none" stroke="#d9b76a" stroke-width=".35" stroke-dasharray="1.4 1.6"/></svg>
    ${ZONES.map((z) => {
      const unlocked = zoneUnlocked(p, z);
      return `<button class="map-zone" style="left:${z.map.x}%;top:${z.map.y}%" data-map-zone="${z.id}">
        <span class="map-node${z.id === current ? ' current' : ''}${unlocked ? '' : ' locked'}">${unlocked ? z.index + 1 : icon('lock')}</span>
        <span>${esc(t(z.key))}</span>
      </button>`;
    }).join('')}
  </div>`;
  return {
    title: t('world.title'),
    subtitle: t('world.subtitle'),
    body: `${map}
      <div class="hint" style="margin-bottom:10px">${esc(t('world.mapHint'))} · ${esc(t('world.returnHint'))}</div>
      <div class="section-block">
        <div class="section-head"><h3>${esc(t('world.zones'))}</h3><span>${ZONES.filter((z) => p.discoveredZones?.includes(z.id)).length}/8 ${esc(t('world.discovered'))}</span></div>
        ${ZONES.map((z) => {
          const unlocked = zoneUnlocked(p, z);
          const isCurrent = z.id === current;
          const canPay = p.gold >= (z.travelCost ?? 0);
          const questCount = p.quests && Object.keys(p.quests).filter((id) => QUESTS.find((q) => q.id === id)?.zone === z.id).length;
          return `<div class="zone-card${isCurrent ? ' current' : ''}${unlocked ? '' : ' locked'}">
            <div class="zone-number">${z.index + 1}</div>
            <div>
              <h3>${esc(t(z.key))}</h3>
              <div class="zc-meta">${esc(t('world.levels', { min: z.min, max: z.max }))} · ${z.monsters.reduce((s, m) => s + m.count, 0)} ${esc(t('world.monsters'))} · ${esc(tx(z.boss.name))}</div>
              <div class="zc-tags">
                ${p.discoveredZones?.includes(z.id) ? `<span>${esc(t('world.discovered'))}</span>` : ''}
                ${questCount ? `<span>${questCount} ${esc(t('world.quests'))}</span>` : ''}
                ${z.camp ? `<span>${esc(t('world.camp'))}</span>` : ''}
                ${z.travelCost ? `<span>${fmt(z.travelCost)} ${esc(t('common.gold'))}</span>` : ''}
              </div>
            </div>
            ${isCurrent
              ? `<button class="btn ghost" disabled>${esc(t('world.current'))}</button>`
              : unlocked
                ? `<button class="btn ${canPay ? 'primary' : 'ghost'}" data-travel="${z.id}" ${canPay ? '' : 'disabled'}>${esc(t('world.enter'))}</button>`
                : `<button class="btn ghost" disabled>${esc(t('world.locked'))}</button>`}
          </div>`;
        }).join('')}
      </div>
      <p class="hint">${esc(t('world.unlockHint', { n: Math.max(1, (ZONES.find((z) => !zoneUnlocked(p, z))?.unlockChapter ?? p.completedChapters ?? 0)) }))}</p>`,
    resources: true,
    mount: (overlay) => {
      overlay.querySelectorAll('[data-travel], [data-map-zone]').forEach((btn) => btn.addEventListener('click', () => {
        const id = btn.dataset.travel ?? btn.dataset.mapZone;
        const zone = getZone(id);
        if (zone.id === p.zoneId) return;
        if (!zoneUnlocked(p, zone)) { toast(t('world.locked'), 'bad'); return; }
        if (p.gold < (zone.travelCost ?? 0)) { toast(t('world.notEnough'), 'bad'); return; }
        confirmDialog(t('world.travel', { zone: t(zone.key) }), `${t('world.teleportCost')}: ${fmt(zone.travelCost ?? 0)} ${t('common.gold')}`, () => {
          panel.close({ resume: false });
          panel.screen.travel(id);
        }, { confirmLabel: t('world.enter') });
      }));
    },
  };
}

export { progressLine };
