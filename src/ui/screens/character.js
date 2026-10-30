/* Character sheet — attributes, derived stats and resistances. */

import { Engine } from '../../core/engine.js';
import { CLASSES } from '../../data/classes.js';
import { GAME, RESIST_INFO } from '../../config.js';
import { xpToNext } from '../../core/stats.js';
import { esc, fmt, fmt1, bar, chip, pageHead, sectionTitle, toggle } from '../components.js';
import { icon } from '../icons.js';
import { heroArt } from '../sprites.js';
import { statRows } from './util.js';

const ATTRS = [
  { key: 'strength', label: 'Strength', short: 'STR', hint: '+2.4 attack' },
  { key: 'intelligence', label: 'Intelligence', short: 'INT', hint: '+5 MP · faster regen' },
  { key: 'dexterity', label: 'Dexterity', short: 'DEX', hint: '+0.18% crit · speed' },
  { key: 'vitality', label: 'Vitality', short: 'VIT', hint: '+12 HP · +1.1 defense' },
];

export function render(ctx) {
  const { state, stats } = ctx;
  const hero = state.hero;
  const cls = CLASSES[hero.classId] || CLASSES.warrior;
  const next = xpToNext(hero.level);
  const xpPct = hero.level >= GAME.maxHeroLevel ? 100 : Math.min(100, hero.xp / next * 100);

  const attrCards = ATTRS.map(a => {
    const primary = (cls.id === 'warrior' && a.key === 'strength') || (cls.id === 'mage' && a.key === 'intelligence') || (cls.id === 'archer' && a.key === 'dexterity');
    return `<div class="attr-card" style="${primary ? 'border-color:rgba(201,164,95,.3);background:rgba(201,164,95,.045)' : ''}">
      <span class="a-label">${a.label}${primary ? ' · path' : ''}</span>
      <span class="a-value">${fmt(hero.attributes[a.key] || 0)}
        <button data-attr="${a.key}" type="button" title="Add one ${a.label}" ${hero.statPoints <= 0 ? 'disabled' : ''}>${icon('plus')}</button>
      </span>
      <span class="a-hint">${a.hint}</span>
    </div>`;
  }).join('');

  const core = [
    ['attack', stats.attack], ['defense', stats.defense],
    ['hp', stats.maxHp], ['mp', stats.maxMp],
    ['critChance', stats.critChance], ['critDamage', stats.critDamage],
    ['attackSpeed', stats.attackSpeed], ['penetration', stats.penetration],
    ['penPercent', stats.penPercent], ['lifesteal', stats.lifesteal],
    ['hpRegen', stats.hpRegen], ['monsterDamage', stats.monsterDamage],
    ['bossDamage', stats.bossDamage], ['skillDamage', stats.skillDamage],
    ['goldFind', stats.goldFind], ['lootFind', stats.lootFind],
  ];

  return `
  ${pageHead(`${hero.name}`, `<span style="color:${cls.color}">${esc(cls.name)} · ${esc(cls.order)}</span> — ${esc(cls.tagline)}`,
    `<button class="btn ghost" data-nav="skills" type="button">${icon('skills')} Techniques</button>
     <button class="btn secondary" data-nav="equipment" type="button">${icon('armor')} Equipment</button>`, 'Hero sheet')}

  <div class="screen-grid">
    <div class="flex-col" style="gap:14px">
      <section class="panel char-hero-card">
        <div class="char-art">${heroArt(hero.classId)}</div>
        <div class="char-info">
          <div class="char-name">${esc(hero.name)}</div>
          <div class="char-title" style="color:${cls.color}">${esc(cls.order)} of the Ebonspire</div>
          <div class="char-tags">
            ${chip(cls.weaponType, 'gold', 'sword')}
            ${chip(cls.growthText + ' growth', '', 'level')}
            ${chip(`Power ${fmt(stats.power)}`, 'violet', 'power')}
            ${hero.autoAllocate ? chip('Auto attributes', 'green', 'check') : chip('Manual attributes', '', 'user')}
          </div>
          <div class="char-level-row"><strong>${hero.level}</strong><span>Level</span><span class="spacer"></span><span class="dim" style="font-size:9px">Best ${fmt(state.stats.bestPower || stats.power)}</span></div>
          <div class="xp-bar">${bar(hero.xp, next, 'xp', { large: true })}</div>
          <div class="xp-meta"><span>${hero.level >= GAME.maxHeroLevel ? 'Maximum level reached' : `${fmt(hero.xp)} / ${fmt(next)} XP`}</span><span>${xpPct.toFixed(1)}%</span></div>
          <div class="power-block"><span class="label">Battle power</span><span class="value">${fmt(stats.power)}</span></div>
        </div>
      </section>

      <section class="panel pad">
        <div class="flex between wrap" style="margin-bottom:9px">
          <div><span class="eyebrow">Attributes</span><h3 style="font-size:15px">Path of the ${esc(cls.order)}</h3></div>
          <span class="pill ${hero.statPoints > 0 ? 'gold' : ''}">${icon('spark')} ${hero.statPoints} points</span>
        </div>
        ${hero.statPoints > 0 ? `<div class="attr-points"><span>${hero.statPoints} unspent attribute ${hero.statPoints === 1 ? 'point' : 'points'}</span><button class="btn tiny" data-char-action="auto" type="button">${icon('sparkles')} Spend all</button></div>` : ''}
        <div class="attr-grid">${attrCards}</div>
        <div class="mt-3">${toggle({ id: 'auto-allocate', label: 'Distribute points automatically', checked: hero.autoAllocate, hint: `(${esc(cls.growthText)})` })}</div>
      </section>

      <section class="panel pad">
        ${sectionTitle('Derived statistics', 'Everything your gear, bonds and stones add up to')}
        <div class="derived-grid">${statRows(core)}</div>
      </section>
    </div>

    <div class="flex-col" style="gap:14px">
      <section class="panel pad">
        <span class="eyebrow">Discipline</span>
        <h3 style="font-size:15px;margin-bottom:6px">${esc(cls.passive.name)}</h3>
        <div class="skill-card skill-passive" style="margin-bottom:9px">
          <div class="skill-icon" style="--skill:${cls.color}">${icon(cls.passive.icon)}<span class="lvl">P</span></div>
          <div class="skill-info">
            <div class="skill-name">Passive temperament</div>
            <div class="skill-desc">${esc(cls.passive.desc)}</div>
          </div>
        </div>
        <p class="muted" style="font-size:10px;line-height:1.55">${esc(cls.lore)}</p>
        <div class="flex wrap mt-2" style="gap:5px">
          ${cls.skills.map(s => chip(s.name, '', s.icon)).join('')}
        </div>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Resistance</span>
        <h3 style="font-size:15px;margin-bottom:8px">Elements endured</h3>
        <div class="resist-grid">
          ${RESIST_INFO.map(r => `<div class="resist-item"><span style="display:flex;align-items:center;gap:5px"><span style="width:7px;height:7px;border-radius:50%;background:${r.color}"></span>${esc(r.label)}</span><b>${fmt1(stats.resist?.[r.element] || 0)}%</b></div>`).join('')}
        </div>
        <div class="set-bonus mt-3">
          <b>All resistance ${fmt1(stats.allResist || 0)}%</b> from bonds and stones. Resistance is capped at ${GAME.resistCap}%.
        </div>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Chronicle</span>
        <h3 style="font-size:15px;margin-bottom:6px">Deeds recorded</h3>
        ${[
          ['Monsters slain', state.stats.kills], ['Bosses felled', state.stats.bossKills],
          ['Dungeons cleared', state.stats.dungeonClears], ['Stages cleared', state.stats.stagesCleared],
          ['Forge attempts', state.stats.upgrades], ['Fusions performed', state.stats.fusions],
        ].map(([label, value]) => `<div class="stat-row"><span class="label">${label}</span><span class="value">${fmt(value)}</span></div>`).join('')}
        <button class="btn ghost mt-2" data-nav="quests" type="button" style="width:100%">${icon('scroll')} Open the chronicle</button>
      </section>
    </div>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-attr]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = Engine.allocate(btn.dataset.attr, 1);
      if (!res.ok) ctx.toast?.(res.message || 'No points available.', 'danger');
      ctx.refresh();
    });
  });

  root.querySelector('[data-char-action="auto"]')?.addEventListener('click', () => {
    const points = Engine.state.hero.statPoints;
    if (points <= 0) return ctx.toast?.('No attribute points to spend.', 'info');
    Engine.setAutoAllocate(true);
    ctx.toast?.(`Spent ${points} points along the ${CLASSES[Engine.state.hero.classId].growthText.toLowerCase()} path.`, 'success');
    ctx.refresh();
  });

  root.querySelector('#auto-allocate')?.addEventListener('change', e => {
    Engine.setAutoAllocate(e.target.checked);
    ctx.toast?.(e.target.checked ? 'New points will be allocated automatically.' : 'You will allocate points manually.', 'info');
    ctx.refresh();
  });
}
