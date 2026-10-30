import {
  CLASSES, CLASS_LIST, CHAPTERS, CHAPTER_BOSSES, SLOTS, SLOT_BY_ID, RARITIES,
  RARITY_BY_ID, BOSSES, getItem, heroStats, itemComparison, itemKey, stageFromIndex,
  stageIndex, stageLabel, nextStage, recommendedPower, makeWaves, xpForNext,
  stageXpBonus, rollDrop, RARITY_RULES, CHAPTER_SCALE, totalInventoryCount,
  mergeableGroups,
} from './data.js';
import {
  loadSave, newSave, persist, eraseSave, addItem, equipFromInventory, autoEquip,
  mergeOne, mergeAll, addXp, recordStageClear, recordDefeat, recordKill,
  isStageUnlocked, isStageCleared, inventoryGroups, highestRarity,
} from './save.js';
import { audio } from './audio.js';
import {
  icon, openModal, closeModal, confirmDialog, toast, itemOrb, itemDetailBody,
  skillRow, rarityPill,
} from './ui.js';
import { escapeHTML, clamp, formatNum, formatTime } from './util.js';
import { Battle } from './battle.js';

let save = loadSave();
let activeTab = 'campaign';
let selectedClass = 'warrior';
let gearFilter = 'all';
let battle = null;
let started = false;

const $ = id => document.getElementById(id);
const screens = [...document.querySelectorAll('.screen')];
const hubContent = $('hub-content');

const DEFAULT_NAMES = { warrior: 'Kael', mage: 'Lyra', archer: 'Vesper' };

function init() {
  audio.setMuted(save?.settings?.muted ?? false);
  decorateMotes();
  bindGlobal();
  renderTitle();
  showScreen('title');
  updateSoundButtons();
  started = true;
  window.__riftbound = {
    get save() { return save; },
    get battle() { return battle; },
    startBattle,
    openStageModal,
    renderHub,
    setScreen: showScreen,
  };
}

function decorateMotes() {
  const layer = $('motes');
  if (!layer) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 22; i++) {
    const m = document.createElement('i');
    m.style.setProperty('--x', `${Math.random() * 100}%`);
    m.style.setProperty('--d', `${8 + Math.random() * 14}s`);
    m.style.setProperty('--delay', `${-Math.random() * 20}s`);
    m.style.setProperty('--s', `${1 + Math.random() * 2.2}px`);
    m.style.setProperty('--o', `${0.15 + Math.random() * 0.4}`);
    frag.appendChild(m);
  }
  layer.appendChild(frag);
}

function bindGlobal() {
  document.addEventListener('pointerdown', () => {
    audio.init();
    audio.setMuted(save?.settings?.muted ?? audio.muted);
    audio.play('click');
  }, { once: true });

  $('title-sound')?.addEventListener('click', () => {
    audio.init();
    toggleMute();
  });
  $('btn-continue')?.addEventListener('click', () => {
    audio.init();
    if (save) enterHub();
    else openCreate();
  });
  $('btn-new')?.addEventListener('click', async () => {
    audio.init();
    if (save) {
      const ok = await confirmDialog({
        title: 'Begin anew?',
        message: `This will erase <b>${escapeHTML(save.hero.name)}</b>, level ${save.hero.level}, and every relic in their pack. This cannot be undone.`,
        confirmText: 'Erase and begin', danger: true, kicker: 'A CLEAN SLATE',
      });
      if (!ok) return;
      eraseSave();
      save = null;
    }
    openCreate();
  });
  $('create-back')?.addEventListener('click', () => { audio.play('back'); showScreen('title'); });
  $('class-picker')?.addEventListener('click', e => {
    const card = e.target.closest('[data-class]');
    if (!card) return;
    selectClass(card.dataset.class);
  });
  $('btn-begin')?.addEventListener('click', beginHero);

  $('bottom-nav')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  hubContent?.addEventListener('click', onHubClick);
  hubContent?.addEventListener('change', onHubChange);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activeModalOpen()) {
      // modal handles its own escape
    }
  });
}

function activeModalOpen() {
  const layer = $('modal-layer');
  return layer && !layer.hidden;
}

function showScreen(name) {
  screens.forEach(s => s.classList.toggle('active', s.id === `screen-${name}`));
  document.body.classList.toggle('battle-active', name === 'battle');
  document.body.dataset.screen = name;
}

function renderTitle() {
  const label = $('continue-label');
  const btn = $('btn-continue');
  if (!save) {
    label.textContent = 'No legend yet';
    btn.classList.add('is-empty');
  } else {
    const cls = CLASSES[save.hero.classId];
    label.textContent = `${save.hero.name} · Lv ${save.hero.level} · ${cls.name}`;
    btn.classList.remove('is-empty');
  }
}

function updateSoundButtons() {
  const muted = save?.settings?.muted ?? audio.muted;
  for (const id of ['title-sound']) {
    const el = $(id);
    if (el) el.innerHTML = icon(muted ? 'mute' : 'sound');
  }
}

function toggleMute() {
  const muted = !(save?.settings?.muted ?? audio.muted);
  if (save) { save.settings.muted = muted; persist(save); }
  audio.setMuted(muted);
  updateSoundButtons();
  audio.play('click');
  toast(muted ? 'Sound muted' : 'Sound on', { iconName: muted ? 'mute' : 'sound' });
  if (activeTab === 'hero' && $('screen-hub').classList.contains('active')) renderHub();
}

function openCreate() {
  selectedClass = 'warrior';
  renderClassPicker();
  renderClassDetail();
  const nameInput = $('hero-name');
  nameInput.value = DEFAULT_NAMES[selectedClass];
  const begin = $('btn-begin');
  if (begin) begin.disabled = false;
  showScreen('create');
  setTimeout(() => nameInput.focus(), 80);
}

function renderClassPicker() {
  const wrap = $('class-picker');
  if (!wrap) return;
  wrap.innerHTML = CLASS_LIST.map(cls => `
    <button class="class-card ${cls.css} ${selectedClass === cls.id ? 'selected' : ''}" data-class="${cls.id}" role="radio" aria-checked="${selectedClass === cls.id}">
      <span class="class-card-glow"></span>
      <span class="class-card-emblem">${icon(cls.icon)}</span>
      <strong>${cls.name}</strong>
      <small>${cls.title}</small>
      <span class="class-pick">${selectedClass === cls.id ? icon('check') : ''}</span>
    </button>`).join('');
}

function renderClassDetail() {
  const cls = CLASSES[selectedClass];
  const detail = $('class-detail');
  if (!detail) return;
  detail.className = `class-detail ${cls.css}`;
  const barLabels = { offense: 'Offense', defense: 'Defense', mobility: 'Mobility', range: 'Range' };
  detail.innerHTML = `
    <div class="class-detail-hero ${cls.css}">
      <div class="class-detail-emblem">${icon(cls.icon)}</div>
      <div>
        <p class="eyebrow">${cls.title}</p>
        <h3>${cls.name}</h3>
        <p>${cls.lore}</p>
      </div>
    </div>
    <div class="class-bars">
      ${Object.entries(cls.bars).map(([key, value]) => `
        <div class="class-bar-row"><span>${barLabels[key]}</span><div class="bar"><i style="width:${value / 5 * 100}%"></i></div><em>${value.toFixed(1)}</em></div>`).join('')}
    </div>
    <div class="passive-card">
      <span class="passive-ic">${icon('spark')}</span>
      <div><p class="eyebrow">CLASS PASSIVE</p><strong>${cls.passive.name}</strong><p>${cls.passive.desc}</p></div>
    </div>
    <div class="skills-block">
      <div class="mini-head"><span>Three signature skills</span><em>Every class has exactly three</em></div>
      ${cls.skills.map((skill, i) => skillRow(skill, i)).join('')}
    </div>`;
}

function selectClass(id) {
  if (!CLASSES[id] || id === selectedClass) return;
  audio.play('click');
  const input = $('hero-name');
  const oldDefault = DEFAULT_NAMES[selectedClass];
  selectedClass = id;
  if (!input.value.trim() || input.value.trim() === oldDefault) input.value = DEFAULT_NAMES[id];
  renderClassPicker();
  renderClassDetail();
}

function beginHero() {
  const name = ($('hero-name')?.value || '').trim().slice(0, 14) || 'Wanderer';
  save = newSave(selectedClass, name);
  save.settings.muted = audio.muted;
  persist(save);
  audio.play('level');
  enterHub('campaign');
  toast(`<b>${escapeHTML(name)}</b> enters the rift`, { type: 'loot', iconName: 'spark', ttl: 3200 });
}

function enterHub(tab = activeTab) {
  if (!save) { showScreen('title'); return; }
  updateSoundButtons();
  showScreen('hub');
  activeTab = tab || 'campaign';
  renderHub();
  hubContent.scrollTop = 0;
}

function switchTab(tab) {
  if (!['campaign', 'gear', 'forge', 'hero'].includes(tab)) return;
  if (activeTab === tab) return;
  activeTab = tab;
  gearFilter = 'all';
  audio.play('click');
  renderHub();
  hubContent.scrollTop = 0;
}

function renderHub() {
  if (!save) return;
  const scroll = hubContent.scrollTop;
  renderHeroBar();
  if (activeTab === 'campaign') hubContent.innerHTML = renderCampaign();
  else if (activeTab === 'gear') hubContent.innerHTML = renderGear();
  else if (activeTab === 'forge') hubContent.innerHTML = renderForge();
  else hubContent.innerHTML = renderHeroTab();
  for (const btn of document.querySelectorAll('.nav-btn')) {
    btn.classList.toggle('active', btn.dataset.tab === activeTab);
  }
  const mergeable = mergeableGroups(save);
  const gearDot = $('gear-dot');
  const forgeDot = $('forge-dot');
  if (gearDot) gearDot.hidden = totalInventoryCount(save) === 0;
  if (forgeDot) forgeDot.hidden = mergeable.length === 0;
  hubContent.scrollTop = scroll;
}

function renderHeroBar() {
  const cls = CLASSES[save.hero.classId];
  const stats = heroStats(save.hero);
  const need = xpForNext(save.hero.level);
  const pct = save.hero.level >= 40 ? 100 : clamp(save.hero.xp / need * 100, 0, 100);
  const bar = $('hero-bar');
  bar.innerHTML = `
    <button class="hero-avatar ${cls.css}" data-action="tab" data-tab="hero" aria-label="Open hero sheet">
      ${icon(cls.icon)}
      <i>${save.hero.level}</i>
    </button>
    <div class="hero-meta">
      <p class="eyebrow">${cls.name} · ${cls.title}</p>
      <h2>${escapeHTML(save.hero.name)}</h2>
      <div class="hero-xp"><div class="bar xp-bar"><i style="width:${pct}%"></i></div><span>${save.hero.level >= 40 ? 'MAX' : `${save.hero.xp} / ${need} XP`}</span></div>
    </div>
    <div class="power-pill">
      <small>POWER</small>
      <strong>${formatNum(stats.power)}</strong>
    </div>`;
}

function renderCampaign() {
  const totalStages = CHAPTERS.length * 5;
  const next = save.cleared < totalStages ? stageFromIndex(save.cleared + 1) : null;
  const nextInfo = next ? {
    chapter: next.chapter, stage: next.stage,
    data: CHAPTERS[next.chapter - 1],
    stageName: CHAPTERS[next.chapter - 1].names[next.stage - 1],
    boss: next.stage === 5,
    rec: recommendedPower(next.chapter, next.stage),
  } : null;
  const power = heroStats(save.hero).power;
  const chapters = CHAPTERS.map(ch => {
    const firstIndex = stageIndex(ch.id, 1);
    const clearedCount = clamp(save.cleared - (ch.id - 1) * 5, 0, 5);
    const unlocked = save.cleared + 1 >= firstIndex;
    const complete = clearedCount >= 5;
    const stages = [1, 2, 3, 4, 5].map(stage => {
      const unlockedStage = isStageUnlocked(save, ch.id, stage);
      const cleared = isStageCleared(save, ch.id, stage);
      const current = next && next.chapter === ch.id && next.stage === stage;
      const boss = stage === 5;
      return `<button class="stage-node ${cleared ? 'cleared' : ''} ${current ? 'current' : ''} ${unlockedStage ? '' : 'locked'} ${boss ? 'boss' : ''}" data-action="open-stage" data-chapter="${ch.id}" data-stage="${stage}" ${unlockedStage ? '' : 'aria-disabled="true"'}>
        <span class="stage-dot">${cleared ? icon('check') : !unlockedStage ? icon('lock') : boss ? icon('skull') : stage}</span>
        <span class="stage-name">${boss ? 'Boss' : `Stage ${stage}`}</span>
        ${current ? '<span class="stage-now">NEXT</span>' : ''}
      </button>`;
    }).join('');
    return `
      <section class="chapter-card ${unlocked ? '' : 'locked'} ${complete ? 'complete' : ''}" style="--accent:${ch.accent};--fog:${ch.fog}">
        <header class="chapter-head">
          <span class="chapter-numeral">${ch.numeral}</span>
          <div class="chapter-title"><h3>${ch.name}</h3><p>${ch.tag}</p></div>
          <span class="chapter-progress">${clearedCount}/5 ${complete ? icon('check') : ''}</span>
        </header>
        <div class="stage-track">${stages}</div>
        ${unlocked ? '' : '<div class="chapter-lock">Clear the previous rift to enter</div>'}
      </section>`;
  }).join('');

  const objective = nextInfo ? `
    <section class="objective-card" style="--accent:${nextInfo.data.accent};--fog:${nextInfo.data.fog}">
      <div class="objective-glow"></div>
      <div class="objective-copy">
        <p class="eyebrow">NEXT OBJECTIVE · RIFT ${nextInfo.data.numeral}</p>
        <h3>${nextInfo.stageName}</h3>
        <p>${nextInfo.boss ? `Boss: <b>${BOSSES[nextInfo.data.boss].name}</b> · ` : ''}Recommended power <b>${formatNum(nextInfo.rec)}</b></p>
        <div class="objective-meta">
          <span class="${power >= nextInfo.rec ? 'good' : 'warn'}">${icon(power >= nextInfo.rec ? 'check' : 'spark')} Your power ${formatNum(power)}</span>
          <span>${nextInfo.boss ? 'Boss rift' : '3 waves'}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" data-action="enter-stage" data-chapter="${nextInfo.chapter}" data-stage="${nextInfo.stage}">Enter</button>
    </section>` : `
    <section class="objective-card all-clear">
      <div class="objective-copy"><p class="eyebrow">ALL FIVE RIFTS BROKEN</p><h3>The forge remains</h3><p>Replay rifts, chase Divine relics, and perfect your build.</p></div>
      <button class="btn btn-ghost btn-sm" data-action="open-stage" data-chapter="5" data-stage="5">Replay Nyx</button>
    </section>`;

  return `
    <div class="page-head">
      <div><p class="eyebrow">CAMPAIGN</p><h2>The Five Rifts</h2></div>
      <span class="page-count">${Math.min(save.cleared, totalStages)}/${totalStages}</span>
    </div>
    ${objective}
    <div class="section-label"><span>Rift map</span><em>${save.cleared >= totalStages ? 'Complete' : `${totalStages - save.cleared} stages remain`}</em></div>
    <div class="chapter-list">${chapters}</div>
    <p class="fine-print campaign-note">Every cleared wave can drop gear. Boss rifts guarantee a cache of high-rarity relics.</p>`;
}

function statChips(item) {
  return Object.entries(item.stats).slice(0, 2).map(([stat, value]) => {
    const labels = { atk: 'ATK', hp: 'HP', def: 'DEF', crit: 'CRIT', critDmg: 'CRIT DMG', speed: 'SPD' };
    const suffix = stat === 'crit' || stat === 'critDmg' ? '%' : '';
    return `<span class="stat-chip">+${value}${suffix} ${labels[stat]}</span>`;
  }).join('');
}

function renderGear() {
  const stats = heroStats(save.hero);
  const equippedSlots = SLOTS.map(slot => {
    const key = save.hero.equipped[slot.id];
    const item = key ? getItem(key) : null;
    return `<button class="equip-slot ${item ? item.css : 'empty'}" data-action="open-equipped" data-slot="${slot.id}" aria-label="${slot.name}${item ? `: ${item.name}` : ' empty'}">
      <span class="slot-label">${slot.name}</span>
      ${item ? `<span class="slot-orb ${item.css}">${icon(slot.icon)}</span>` : `<span class="slot-orb">${icon(slot.icon)}</span>`}
      <span class="slot-item">${item ? escapeHTML(item.name) : 'Empty'}</span>
      <span class="slot-power">${item ? `Power ${item.power}` : '—'}</span>
    </button>`;
  }).join('');

  const all = inventoryGroups(save);
  const filtered = gearFilter === 'all' ? all : all.filter(g => g.slot === gearFilter);
  const invHtml = filtered.length ? filtered.map(g => {
    const item = g.item;
    return `<button class="inventory-row ${item.css}" data-action="open-item" data-key="${g.key}">
      ${itemOrb(item, 'small')}
      <span class="inv-main">
        <span class="inv-name">${escapeHTML(item.name)}<small class="rarity-pill ${item.css}">${item.rarityName}</small></span>
        <span class="inv-stats">${statChips(item)}</span>
      </span>
      <span class="inv-side"><b>${g.count > 1 ? `×${g.count}` : ''}</b><em>P ${item.power}</em></span>
      <span class="inv-chevron">${icon('chevron')}</span>
    </button>`;
  }).join('') : `<div class="empty-state"><span>${icon('bag')}</span><h4>No relics here</h4><p>Clear a few waves and the rifts will provide.</p></div>`;

  const slotOptions = SLOTS.map(s => `<option value="${s.id}" ${gearFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
  return `
    <div class="page-head">
      <div><p class="eyebrow">ARMORY</p><h2>Gear</h2></div>
      <button class="btn btn-ghost btn-sm" data-action="equip-best">${icon('spark')} Equip best</button>
    </div>
    <section class="gear-summary">
      <div class="gear-summary-art">${icon('armor')}</div>
      <div class="gear-summary-copy"><p class="eyebrow">COMBAT RATING</p><strong>${formatNum(stats.power)}</strong><p>${Object.values(save.hero.equipped).filter(Boolean).length}/9 slots filled · ${totalInventoryCount(save)} relics in pack</p></div>
      <div class="gear-mini-stats">
        <span><small>ATK</small><b>${formatNum(stats.atk)}</b></span>
        <span><small>HP</small><b>${formatNum(stats.maxHp)}</b></span>
        <span><small>DEF</small><b>${formatNum(stats.def)}</b></span>
      </div>
    </section>
    <div class="section-label"><span>Equipped</span><em>Nine slots</em></div>
    <div class="equip-grid">${equippedSlots}</div>
    <div class="section-label inventory-label">
      <span>Pack</span>
      <select class="slot-filter" id="gear-filter" aria-label="Filter pack by slot">
        <option value="all" ${gearFilter === 'all' ? 'selected' : ''}>All slots</option>
        ${slotOptions}
      </select>
    </div>
    <div class="inventory-list">${invHtml}</div>
    <p class="fine-print">Equipped copies are kept out of the pack, so they can never be consumed by a merge.</p>`;
}

function renderForge() {
  const mergeable = mergeableGroups(save);
  const groups = inventoryGroups(save);
  const readyHtml = mergeable.length ? mergeable.map(g => {
    const preview = getItem({ tier: g.tier, slot: g.slot, rarity: RARITIES[RARITY_BY_ID[g.rarity].rank + 1].id });
    return `<div class="merge-card ${preview.css}">
      <div class="merge-pair">
        <span class="merge-from">${icon(g.slot)}</span>
        <span class="merge-arrow">${icon('chevron')}</span>
        <span class="merge-to ${preview.css}">${icon(g.slot)}</span>
      </div>
      <div class="merge-copy">
        <p class="eyebrow">${g.item.rarityName} → ${preview.rarityName}</p>
        <strong class="${g.item.css}-text">${escapeHTML(g.item.name)}</strong>
        <span class="merge-pips">${[0, 1, 2, 3].map(() => `<i class="full"></i>`).join('')}<em>${g.count} in pack</em></span>
      </div>
      <button class="btn btn-primary btn-xs" data-action="merge" data-key="${g.key}">Merge</button>
    </div>`;
  }).join('') : `<div class="empty-state forge-empty"><span>${icon('anvil')}</span><h4>Nothing ready to forge</h4><p>Four identical copies of the same relic unlock a merge.</p></div>`;

  const progress = groups.filter(g => !mergeable.some(m => m.key === g.key) && RARITY_BY_ID[g.rarity].rank < RARITIES.length - 1);
  const progressHtml = progress.length ? progress.slice(0, 12).map(g => `
    <div class="merge-progress-row">
      <span class="merge-mini-orb ${g.item.css}">${icon(g.slot)}</span>
      <span class="merge-mini-name"><b class="${g.item.css}-text">${escapeHTML(g.item.name)}</b><small>${g.item.rarityName} · ${g.tier === 1 ? 'I' : g.tier === 2 ? 'II' : g.tier === 3 ? 'III' : g.tier === 4 ? 'IV' : 'V'}</small></span>
      <span class="merge-pips small">${[0, 1, 2, 3].map(i => `<i class="${i < g.count ? 'full' : ''}"></i>`).join('')}</span>
      <span class="merge-count">${Math.min(g.count, 4)}/4</span>
    </div>`).join('') : `<p class="fine-print">Collect duplicates to start a merge.</p>`;

  return `
    <div class="page-head">
      <div><p class="eyebrow">THE FORGE</p><h2>Merge Relics</h2></div>
      ${mergeable.length ? `<button class="btn btn-ghost btn-sm" data-action="merge-all">${icon('anvil')} Merge all</button>` : ''}
    </div>
    <section class="forge-hero">
      <div class="forge-flame">${icon('anvil')}</div>
      <div><p class="eyebrow">FOUR INTO ONE</p><h3>Feed the forge. Climb the tiers.</h3><p>Four identical relics of the same rarity become one relic of the next rarity. Stats rise sharply at every step.</p></div>
    </section>
    <div class="rarity-chain" aria-label="Rarity progression">
      ${RARITIES.map((r, i) => `<span class="chain-step ${r.css}">${r.name}</span>${i < RARITIES.length - 1 ? `<i>${icon('chevron')}</i>` : ''}`).join('')}
    </div>
    <div class="section-label"><span>Ready to merge</span><em>${mergeable.length ? `${mergeable.length} available` : 'Keep hunting'}</em></div>
    <div class="merge-ready-list">${readyHtml}</div>
    <div class="section-label"><span>In progress</span><em>Duplicates in your pack</em></div>
    <div class="merge-progress-list">${progressHtml}</div>
    <p class="fine-print">Common → Rare → Epic → Legendary → Mythic → Divine. Divine relics are deliberately rare: the full chain takes 1,024 Common copies.</p>`;
}

function renderHeroTab() {
  const cls = CLASSES[save.hero.classId];
  const stats = heroStats(save.hero);
  const best = RARITY_BY_ID[save.stats.bestRarity] || RARITIES[0];
  const need = xpForNext(save.hero.level);
  const pct = save.hero.level >= 40 ? 100 : clamp(save.hero.xp / need * 100, 0, 100);
  const statItems = [
    ['Health', formatNum(stats.maxHp), 'heart'],
    ['Attack', formatNum(stats.atk), 'weapon'],
    ['Defense', formatNum(stats.def), 'shield'],
    ['Crit chance', `${stats.crit.toFixed(1)}%`, 'spark'],
    ['Crit damage', `${stats.critDmg.toFixed(0)}%`, 'spark'],
    ['Move speed', formatNum(stats.speed), 'boots'],
  ].map(([label, value, ic]) => `<div class="stat-tile"><span>${icon(ic)}</span><small>${label}</small><strong>${value}</strong></div>`).join('');

  return `
    <section class="hero-sheet ${cls.css}">
      <div class="hero-sheet-glow"></div>
      <div class="hero-sheet-top">
        <div class="hero-big-emblem">${icon(cls.icon)}</div>
        <div>
          <p class="eyebrow">${cls.title} · LEVEL ${save.hero.level}</p>
          <h2>${escapeHTML(save.hero.name)}</h2>
          <p class="hero-sheet-lore">${cls.blurb}</p>
        </div>
        <div class="hero-sheet-power"><small>POWER</small><strong>${formatNum(stats.power)}</strong></div>
      </div>
      <div class="hero-xp big"><div class="bar xp-bar"><i style="width:${pct}%"></i></div><span>${save.hero.level >= 40 ? 'MAX LEVEL' : `${save.hero.xp} / ${need} XP to next level`}</span></div>
    </section>
    <div class="section-label"><span>Attributes</span><em>Gear included</em></div>
    <div class="stat-grid">${statItems}</div>
    <div class="passive-card wide">
      <span class="passive-ic">${icon('spark')}</span>
      <div><p class="eyebrow">CLASS PASSIVE · ${cls.passive.name}</p><p>${cls.passive.desc}</p></div>
    </div>
    <div class="section-label"><span>Skills</span><em>Three per class</em></div>
    <div class="skills-block">${cls.skills.map((s, i) => skillRow(s, i)).join('')}</div>
    <div class="section-label"><span>Settings</span><em>Stored on this device</em></div>
    <div class="settings-list">
      ${settingRow('mute', 'Sound', 'Procedural combat audio', !save.settings.muted, 'sound')}
      ${settingRow('tilt', 'Tilt steering', 'Optional accelerometer movement', save.settings.tilt, 'tilt')}
      ${settingRow('haptics', 'Haptics', 'Short vibration on hits and skills', save.settings.haptics, 'spark')}
    </div>
    <div class="section-label"><span>Chronicle</span><em>Your legend so far</em></div>
    <div class="chronicle-grid">
      <div><small>Kills</small><strong>${formatNum(save.stats.kills)}</strong></div>
      <div><small>Bosses</small><strong>${formatNum(save.stats.bosses)}</strong></div>
      <div><small>Merges</small><strong>${formatNum(save.stats.mergers)}</strong></div>
      <div><small>Best relic</small><strong class="${best.css}-text">${best.name}</strong></div>
    </div>
    <div class="danger-zone">
      <div><strong>Erase this legend</strong><p>Deletes the hero, gear, and rift progress on this device.</p></div>
      <button class="btn btn-danger btn-sm" data-action="reset">Reset</button>
    </div>
    <p class="fine-print">Riftbound saves automatically. Tip: use the pause button to retreat without losing loot already secured.</p>`;
}

function settingRow(id, label, desc, on, ic) {
  return `<button class="setting-row" data-action="toggle-${id}" aria-pressed="${on}">
    <span class="setting-ic">${icon(ic)}</span>
    <span class="setting-copy"><b>${label}</b><small>${desc}</small></span>
    <span class="switch ${on ? 'on' : ''}"><i></i></span>
  </button>`;
}

function onHubClick(e) {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  switch (action) {
    case 'tab':
      switchTab(actionEl.dataset.tab);
      break;
    case 'open-stage':
      openStageModal(Number(actionEl.dataset.chapter), Number(actionEl.dataset.stage));
      break;
    case 'enter-stage':
      startBattle(Number(actionEl.dataset.chapter), Number(actionEl.dataset.stage));
      break;
    case 'open-item':
      showItemModal(actionEl.dataset.key);
      break;
    case 'open-equipped': {
      const slot = actionEl.dataset.slot;
      const key = save.hero.equipped[slot];
      if (key) showItemModal(key, true);
      break;
    }
    case 'equip-best': {
      const count = autoEquip(save);
      persist(save);
      audio.play(count ? 'upgrade' : 'error');
      toast(count ? `Equipped ${count} upgrade${count > 1 ? 's' : ''}` : 'Already wearing your best gear', { iconName: 'spark' });
      renderHub();
      break;
    }
    case 'merge':
      doMerge(actionEl.dataset.key);
      break;
    case 'merge-all':
      doMergeAll();
      break;
    case 'toggle-mute':
      toggleMute();
      break;
    case 'toggle-haptics':
      save.settings.haptics = !save.settings.haptics;
      persist(save);
      audio.play('click');
      renderHub();
      break;
    case 'toggle-tilt':
      toggleTilt();
      break;
    case 'reset':
      resetProgress();
      break;
    default:
      break;
  }
}

function onHubChange(e) {
  if (e.target.id === 'gear-filter') {
    gearFilter = e.target.value;
    renderHub();
    hubContent.scrollTop = 0;
  }
}

async function toggleTilt() {
  if (save.settings.tilt) {
    save.settings.tilt = false;
    persist(save);
    audio.play('back');
    toast('Tilt steering off', { iconName: 'tilt' });
    renderHub();
    return;
  }
  let granted = true;
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      const result = await DeviceMotionEvent.requestPermission();
      granted = result === 'granted';
    }
  } catch {
    granted = false;
  }
  if (!granted) {
    toast('Motion permission was not granted', { type: 'error', iconName: 'tilt' });
    return;
  }
  save.settings.tilt = true;
  persist(save);
  audio.play('upgrade');
  toast('Tilt steering on — neutral is calibrated on entry', { iconName: 'tilt' });
  renderHub();
}

function showItemModal(key, equipped = false) {
  let item;
  try { item = getItem(key); } catch { return; }
  if (equipped) {
    openModal({
      title: 'Equipped relic', kicker: `${item.slotName.toUpperCase()} · ${item.chapterName.toUpperCase()}`,
      body: itemDetailBody(item, { equipped: true }),
      footer: `<button class="btn btn-ghost" data-act="close">Close</button>`,
    })?.root.querySelector('[data-act="close"]')?.addEventListener('click', () => closeModal('close'));
    return;
  }
  if (!save.hero.inventory[key]) return;
  const cmp = itemComparison(save.hero, key);
  const modal = openModal({
    title: 'Relic details', kicker: `${item.slotName.toUpperCase()} · ${RARITY_BY_ID[item.rarity].name.toUpperCase()}`,
    body: itemDetailBody(item, { current: cmp.current, delta: cmp.delta }),
    footer: `<button class="btn btn-ghost" data-act="close">Close</button><button class="btn btn-primary" data-act="equip">Equip</button>`,
  });
  modal?.root.querySelector('[data-act="close"]')?.addEventListener('click', () => closeModal('close'));
  modal?.root.querySelector('[data-act="equip"]')?.addEventListener('click', () => {
    const res = equipFromInventory(save, key);
    if (!res.ok) { toast(res.reason || 'Could not equip', { type: 'error' }); return; }
    persist(save);
    audio.play('upgrade');
    closeModal('equip');
    toast(`Equipped <b class="${item.css}-text">${escapeHTML(item.name)}</b>`, { iconName: item.slot });
    renderHub();
  });
}

function openStageModal(chapter, stage) {
  if (!save) return;
  if (!isStageUnlocked(save, chapter, stage)) {
    audio.play('error');
    toast('Clear the previous stage first', { type: 'error', iconName: 'lock' });
    return;
  }
  const ch = CHAPTERS[chapter - 1];
  const boss = stage === 5 ? BOSSES[ch.boss] : null;
  const rec = recommendedPower(chapter, stage);
  const power = heroStats(save.hero).power;
  const waves = makeWaves(chapter, stage);
  const cleared = isStageCleared(save, chapter, stage);
  const threats = boss
    ? `<div class="boss-preview"><span class="boss-preview-ic">${icon('skull')}</span><div><strong>${boss.name}</strong><small>${boss.title}</small><p>${boss.intro}</p></div></div>`
    : `<div class="wave-preview">${waves.map((w, i) => `<span><i>${i + 1}</i>${w.title}</span>`).join('')}</div>`;
  const modal = openModal({
    kicker: `RIFT ${ch.numeral} · ${ch.name.toUpperCase()}`,
    title: ch.names[stage - 1],
    body: `
      <div class="stage-modal-meta">
        <span class="${power >= rec ? 'good' : 'warn'}">${icon(power >= rec ? 'check' : 'spark')} Power ${formatNum(power)} / ${formatNum(rec)} rec.</span>
        <span>${boss ? 'Boss rift' : '3 waves'}</span>
        <span>${cleared ? 'Cleared' : 'First clear reward'}</span>
      </div>
      ${boss ? threats : `<p class="modal-copy">Small groups guard the path. Break all three waves to claim the rift.</p>${threats}`}
      <div class="reward-preview">
        <span>${icon('bag')} Gear drops</span>
        <span>${icon('spark')} XP</span>
        ${boss ? `<span>${icon('trophy')} High-rarity cache</span>` : ''}
      </div>`,
    footer: `<button class="btn btn-ghost" data-act="cancel">Not yet</button><button class="btn btn-primary" data-act="enter">${cleared ? 'Replay rift' : 'Enter rift'}</button>`,
  });
  modal?.root.querySelector('[data-act="cancel"]')?.addEventListener('click', () => closeModal('cancel'));
  modal?.root.querySelector('[data-act="enter"]')?.addEventListener('click', () => startBattle(chapter, stage));
}

function startBattle(chapter, stage) {
  if (!save) return;
  closeModal('battle');
  if (battle) { battle.destroy(); battle = null; }
  updateSoundButtons();
  if (!isStageUnlocked(save, chapter, stage)) {
    toast('That rift is still sealed', { type: 'error', iconName: 'lock' });
    return;
  }
  showScreen('battle');
  const overlay = $('battle-overlay');
  if (overlay) { overlay.hidden = true; overlay.innerHTML = ''; overlay.className = 'battle-overlay'; }
  battle = new Battle({
    save,
    chapter,
    stage,
    hooks: {
      onLoot(drop) {
        if (!save) return;
        addItem(save, drop, drop.count || 1);
        persist(save);
      },
      onKill(enemy) {
        if (!save) return;
        recordKill(save, !!enemy.boss);
      },
      onEnd(result, summary) {
        handleBattleEnd(result, summary);
      },
    },
  });
  battle.start();
  if (!save.settings.tutorialSeen) {
    save.settings.tutorialSeen = true;
    persist(save);
  }
  audio.play('wave');
}

function dropToDisplay(drop) {
  try {
    const item = getItem(itemKey(drop.tier, drop.slot, drop.rarity));
    return { ...item, count: drop.count || 1 };
  } catch { return null; }
}

function mergeLootLists(lists) {
  const map = new Map();
  for (const list of lists) {
    for (const entry of list) {
      if (!entry) continue;
      const key = entry.key || itemKey(entry.tier, entry.slot, entry.rarity);
      if (map.has(key)) map.get(key).count += entry.count || 1;
      else map.set(key, { ...entry, key, count: entry.count || 1 });
    }
  }
  return [...map.values()];
}

function grantStageLoot(summary, firstClear) {
  const drops = [];
  const rolls = summary.boss ? 3 : 2;
  for (let i = 0; i < rolls; i++) {
    const drop = rollDrop(summary.chapter, { boss: summary.boss, count: 1 });
    addItem(save, drop, drop.count);
    drops.push(dropToDisplay(drop));
  }
  if (firstClear) {
    const cache = rollDrop(summary.chapter, { boss: summary.boss, count: 2 });
    addItem(save, cache, cache.count);
    drops.push(dropToDisplay(cache));
  }
  return drops.filter(Boolean);
}

function handleBattleEnd(result, summary) {
  if (!save) return;
  let firstClear = false;
  let xpInfo = { levelsGained: [] };
  let stageLoot = [];
  let bonusXp = 0;

  if (result === 'victory') {
    firstClear = stageIndex(summary.chapter, summary.stage) > save.cleared;
    stageLoot = grantStageLoot(summary, firstClear);
    bonusXp = stageXpBonus(summary.chapter, summary.stage, summary.boss);
    recordStageClear(save, summary.chapter, summary.stage, summary.boss);
    xpInfo = addXp(save, summary.xp + bonusXp);
  } else {
    if (result === 'defeat') recordDefeat(save);
    xpInfo = addXp(save, summary.xp);
  }
  save.stats.playSeconds = (save.stats.playSeconds || 0) + Math.round(summary.time);
  persist(save);
  if (xpInfo.levelsGained?.length) audio.play('level');

  const combatLoot = summary.loot.map(dropToDisplay).filter(Boolean);
  const loot = mergeLootLists([combatLoot, stageLoot]);
  showBattleResult(result, summary, {
    loot,
    firstClear,
    levelsGained: xpInfo.levelsGained || [],
    totalXp: summary.xp + bonusXp,
    bonusXp,
  });
}

function lootCard(item) {
  return `<div class="loot-card ${item.css}" title="${escapeHTML(item.name)}">
    <span class="loot-orb ${item.css}">${icon(item.slot)}</span>
    <strong class="${item.css}-text">${escapeHTML(item.name)}</strong>
    <small>${item.rarityName}${item.count > 1 ? ` ×${item.count}` : ''}</small>
  </div>`;
}

function showBattleResult(result, summary, extra) {
  const overlay = $('battle-overlay');
  if (!overlay) return;
  const ch = CHAPTERS[summary.chapter - 1];
  const isVictory = result === 'victory';
  const isDefeat = result === 'defeat';
  const next = isVictory ? nextStage(summary.chapter, summary.stage) : null;
  const title = isVictory ? (summary.boss ? 'Boss Vanquished' : 'Rift Cleared') : isDefeat ? 'You Fell' : 'Retreated';
  const kicker = isVictory ? (summary.boss ? 'A GREAT VICTORY' : 'STAGE CLEAR') : isDefeat ? 'THE RIFT HOLDS' : 'LIVE TO FORGE AGAIN';
  const xpLabel = `+${extra.totalXp} XP`;
  const levelHtml = extra.levelsGained.length
    ? `<span class="level-up-chip">LEVEL ${extra.levelsGained[extra.levelsGained.length - 1]}</span>`
    : '';
  const items = extra.loot.slice(0, 8);
  const lootHtml = items.length
    ? `<div class="loot-grid">${items.map(lootCard).join('')}</div>${extra.loot.length > 8 ? `<p class="fine-print">+${extra.loot.length - 8} more relics in your pack</p>` : ''}`
    : `<p class="fine-print">No relics this time. The forge still waits.</p>`;
  const nextLabel = next ? `Next: ${CHAPTERS[next.chapter - 1].numeral} · ${CHAPTERS[next.chapter - 1].names[next.stage - 1]}` : 'Campaign complete';
  const primary = isVictory && next
    ? `<button class="btn btn-primary" id="result-next">${escapeHTML(nextLabel)}</button>`
    : `<button class="btn btn-primary" id="result-continue">Return to camp</button>`;
  const retry = `<button class="btn btn-ghost" id="result-retry">${isVictory ? 'Replay' : 'Retry'}</button>`;
  const camp = isVictory && next ? `<button class="btn btn-ghost" id="result-continue">Return to camp</button>` : '';

  overlay.hidden = false;
  overlay.className = `battle-overlay result-shown ${isVictory ? 'victory' : isDefeat ? 'defeat' : 'retreat'}`;
  overlay.innerHTML = `
    <div class="result-scrim"></div>
    <div class="result-panel">
      <div class="result-emblem">${icon(isVictory ? (summary.boss ? 'trophy' : 'spark') : isDefeat ? 'skull' : 'retreat')}</div>
      <p class="eyebrow">${kicker}</p>
      <h2>${title}</h2>
      <p class="result-sub">${ch.numeral} · ${ch.names[summary.stage - 1]}${extra.firstClear ? ' · First clear' : ''}</p>
      <div class="result-stats">
        <span><small>TIME</small><b>${formatTime(summary.time)}</b></span>
        <span><small>KILLS</small><b>${summary.kills}</b></span>
        <span><small>XP</small><b>${xpLabel}</b></span>
        ${levelHtml ? `<span class="level-stat"><small>LEVEL UP</small><b>${extra.levelsGained[extra.levelsGained.length - 1]}</b></span>` : ''}
      </div>
      <div class="result-loot">
        <div class="result-loot-head"><h3>${isVictory ? 'Loot secured' : 'Loot kept'}</h3><span>${extra.loot.reduce((a, i) => a + i.count, 0)} relics</span></div>
        ${lootHtml}
      </div>
      <div class="result-actions">${primary}${retry}${camp}</div>
      ${isVictory && !next ? '<p class="fine-print">All five rifts are broken. The forge is endless — chase Divine relics.</p>' : ''}
    </div>`;
  overlay.classList.add('in');
  audio.play(isVictory ? 'victory' : isDefeat ? 'defeat' : 'back');

  $('result-next')?.addEventListener('click', () => {
    if (!next) return;
    startBattle(next.chapter, next.stage);
  });
  $('result-continue')?.addEventListener('click', () => exitBattleToHub());
  $('result-retry')?.addEventListener('click', () => startBattle(summary.chapter, summary.stage));
}

function exitBattleToHub() {
  if (battle) { battle.destroy(); battle = null; }
  const overlay = $('battle-overlay');
  if (overlay) { overlay.hidden = true; overlay.innerHTML = ''; overlay.className = 'battle-overlay'; }
  document.body.classList.remove('battle-active');
  showScreen('hub');
  activeTab = 'campaign';
  renderHub();
  hubContent.scrollTop = 0;
  audio.play('click');
}

function doMerge(key) {
  const res = mergeOne(save, key);
  if (!res.ok) { toast(res.reason || 'Cannot merge', { type: 'error' }); audio.play('error'); return; }
  persist(save);
  audio.play(res.item.rarity === 'divine' ? 'divine' : 'merge');
  if (RARITY_BY_ID[res.item.rarity].rank >= 3) showForgeCelebration(res.item);
  else toast(`Forged <b class="${res.item.css}-text">${escapeHTML(res.item.name)}</b> · ${res.item.rarityName}`, { iconName: 'anvil', ttl: 3000 });
  renderHub();
}

function doMergeAll() {
  const results = mergeAll(save);
  if (!results.length) { toast('Nothing ready to merge', { iconName: 'anvil' }); return; }
  persist(save);
  const best = results.sort((a, b) => RARITY_BY_ID[b.rarity].rank - RARITY_BY_ID[a.rarity].rank)[0];
  audio.play(best.rarity === 'divine' ? 'divine' : 'merge');
  if (RARITY_BY_ID[best.rarity].rank >= 3) showForgeCelebration(best, results.length);
  else toast(`Forged ${results.length} relic${results.length > 1 ? 's' : ''}`, { iconName: 'anvil' });
  renderHub();
}

function showForgeCelebration(item, count = 1) {
  audio.play(item.rarity === 'divine' ? 'divine' : 'rare');
  const modal = openModal({
    kicker: item.rarity === 'divine' ? 'THE FORGE HAS ANSWERED' : 'FORGED',
    title: item.rarity === 'divine' ? 'A Divine relic' : `${item.rarityName} forged`,
    className: `celebration ${item.css}`,
    body: `<div class="forge-celebrate">
      <div class="celebrate-orb ${item.css}">${icon(item.slot)}<i></i></div>
      <h4 class="${item.css}-text">${escapeHTML(item.name)}</h4>
      <p>${item.slotName} · Power ${item.power}${count > 1 ? ` · ${count} merges` : ''}</p>
      <div class="celebrate-stats">${Object.entries(item.stats).map(([k, v]) => `<span>+${v}${k === 'crit' || k === 'critDmg' ? '%' : ''} ${({ atk: 'ATK', hp: 'HP', def: 'DEF', crit: 'CRIT', critDmg: 'CRIT DMG', speed: 'SPD' })[k]}</span>`).join('')}</div>
    </div>`,
    footer: `<button class="btn btn-primary" data-act="close">Keep forging</button>`,
  });
  modal?.root.querySelector('[data-act="close"]')?.addEventListener('click', () => closeModal('close'));
}

async function resetProgress() {
  const ok = await confirmDialog({
    title: 'Erase this legend?',
    message: 'Every relic, every level, every cleared rift will be lost. There is no undo.',
    confirmText: 'Erase everything', danger: true, kicker: 'POINT OF NO RETURN',
  });
  if (!ok) return;
  eraseSave();
  save = null;
  if (battle) { battle.destroy(); battle = null; }
  renderTitle();
  showScreen('title');
  toast('The rift forgets you', { iconName: 'spark' });
  audio.play('defeat');
}

window.addEventListener('beforeunload', () => {
  if (save) persist(save);
});

init();
