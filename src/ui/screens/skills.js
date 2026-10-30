/* Skills — class techniques, ranks and automatic casting. */

import { Engine } from '../../core/engine.js';
import { CLASSES } from '../../data/classes.js';
import { esc, fmt, pageHead, sectionTitle, chip, toggle } from '../components.js';
import { icon } from '../icons.js';
import { skillDescription } from './util.js';

const MAX_RANK = 20;

export function render(ctx) {
  const { state } = ctx;
  const hero = state.hero;
  const cls = CLASSES[hero.classId] || CLASSES.warrior;

  const cards = cls.skills.map(skill => {
    const rank = hero.skills[skill.id] || 0;
    const unlocked = rank > 0;
    const maxed = rank >= MAX_RANK;
    const cost = unlocked && !maxed ? Math.round(160 * Math.pow(rank, 1.55) + 80 * rank) : 0;
    const canBuy = unlocked && !maxed && hero.skillPoints > 0 && hero.gold >= cost;
    const pct = Math.min(100, rank / MAX_RANK * 100);
    return `<article class="skill-card ${unlocked ? '' : 'skill-locked'}">
      <div class="skill-icon" style="--skill:${skill.color}">${icon(skill.icon)}<span class="lvl">${unlocked ? rank : '?'}</span></div>
      <div class="skill-info">
        <div class="skill-name">${esc(skill.name)}
          ${unlocked ? chip(`Rank ${rank}/${MAX_RANK}`, rank >= 5 ? 'gold' : '', null) : chip(`Unlocks at level ${skill.unlock}`, 'red', 'lock')}
          ${skill.type === 'buff' ? chip('Buff', 'green', 'sparkles') : skill.type === 'shield' ? chip('Ward', 'violet', 'shield') : chip('Attack', '', 'sword')}
        </div>
        <div class="skill-desc">${esc(skillDescription(skill, Math.max(1, rank)))}</div>
        <div class="skill-meta">
          <span>${icon('drop')} ${skill.mana} MP</span>
          <span>${icon('clock')} ${skill.cooldown}s cooldown</span>
          <span>${icon('level')} Level ${skill.unlock} unlock</span>
          <span style="color:${skill.color}">${esc(skill.element || 'physical')}</span>
        </div>
        <div class="bar xp thin mt-2"><span style="width:${pct}%"></span></div>
      </div>
      <div class="skill-actions">
        ${unlocked
          ? maxed
            ? `<span class="pill gold">Mastered</span>`
            : `<button class="btn tiny ${canBuy ? '' : 'ghost'}" data-skill-up="${skill.id}" type="button" ${canBuy ? '' : 'disabled'}>${icon('plus')} Rank ${rank + 1}</button>
               <span class="dim" style="font-size:8px;text-align:right">${fmt(cost)}g · 1 SP</span>`
          : `<span class="pill red">${icon('lock')} Locked</span>`}
      </div>
    </article>`;
  }).join('');

  return `
  ${pageHead('Skills', `${cls.name} techniques · ${hero.skillPoints} skill ${hero.skillPoints === 1 ? 'point' : 'points'} available`,
    `<button class="btn ghost" data-skills-action="map" type="button">${icon('map')} Hunt for levels</button>`, 'Discipline')}

  <div class="screen-grid">
    <div class="flex-col" style="gap:14px">
      <section class="panel pad">
        <div class="flex between wrap" style="margin-bottom:9px">
          <div><span class="eyebrow">Techniques</span><h3 style="font-size:15px">${esc(cls.order)} arsenal</h3></div>
          <span class="pill ${hero.skillPoints > 0 ? 'gold' : ''}">${icon('sparkles')} ${hero.skillPoints} SP</span>
        </div>
        <div class="skill-list">${cards}</div>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Passive</span>
        <h3 style="font-size:15px;margin-bottom:7px">${esc(cls.passive.name)}</h3>
        <div class="skill-card skill-passive">
          <div class="skill-icon" style="--skill:${cls.color}">${icon(cls.passive.icon)}<span class="lvl">P</span></div>
          <div class="skill-info">
            <div class="skill-name">Always active</div>
            <div class="skill-desc">${esc(cls.passive.desc)}</div>
          </div>
        </div>
      </section>
    </div>

    <div class="flex-col" style="gap:14px">
      <section class="panel pad">
        ${sectionTitle('Casting', 'How the hero fights when you are not looking')}
        <div class="setting-row">
          <div><div class="s-label">Automatic skills</div><div class="s-hint">Cast the highest-priority ready technique.</div></div>
          <span class="pill ${hero.autoSkills ? 'green' : ''}">${hero.autoSkills ? 'On' : 'Manual'}</span>
        </div>
        <div style="margin-top:10px">${toggle({ id: 'auto-skills', label: 'Cast skills automatically', checked: hero.autoSkills, hint: 'Recommended for idle play' })}</div>
        <button class="btn secondary mt-3" data-nav="settings" type="button" style="width:100%">${icon('settings')} More automation settings</button>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Priority</span>
        <h3 style="font-size:14px;margin-bottom:7px">How casts are chosen</h3>
        <div class="mini-set">
          ${cls.skills.map(s => `<div class="ms-row"><span style="display:flex;align-items:center;gap:6px;color:${s.color}">${icon(s.icon)} ${esc(s.name)}</span><span class="spacer"></span><span class="pill">${s.priority}</span></div>`).join('')}
        </div>
        <p class="muted mt-2" style="font-size:9px;line-height:1.5">Conditional defences (wards, roars and evasions) are checked first and only fire when their condition is met. Higher priority attacks are preferred otherwise.</p>
      </section>

      <section class="panel pad">
        <span class="eyebrow">Growth</span>
        <h3 style="font-size:14px;margin-bottom:5px">Spending points</h3>
        <p class="muted" style="font-size:10px;line-height:1.55">Every level grants 1 skill point. Rank 20 is mastery. Each rank adds 8.5% technique power; mana cost and cooldown remain fixed.</p>
        <div class="stat-row"><span class="label">Current gold</span><span class="value gold">${fmt(hero.gold)}g</span></div>
        <div class="stat-row"><span class="label">Skill points</span><span class="value">${hero.skillPoints}</span></div>
        <div class="stat-row"><span class="label">Hero level</span><span class="value">${hero.level}</span></div>
      </section>
    </div>
  </div>`;
}

export function mount(root, ctx) {
  root.querySelectorAll('[data-skill-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = Engine.upgradeSkill(btn.dataset.skillUp);
      if (!res.ok) ctx.toast?.(res.message || 'Could not raise that skill.', 'danger');
      ctx.refresh();
    });
  });
  root.querySelector('#auto-skills')?.addEventListener('change', e => {
    Engine.toggleAutoSkills(e.target.checked);
    ctx.toast?.(e.target.checked ? 'Techniques will cast automatically.' : 'Techniques are now manual.', 'info');
    ctx.refresh();
  });
  root.querySelector('[data-skills-action="map"]')?.addEventListener('click', () => ctx.navigate('stages'));
}
