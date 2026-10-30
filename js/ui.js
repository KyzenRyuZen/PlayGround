import {
  CLASS, CLASSES, CHAPTERS, STAGES, STAGE, RARITIES, RARITY, SLOTS, SLOT,
  BOSS_RELICS, BOSSES, ENEMIES, TIPS, STAT_LABELS
} from './data.js';
import {
  deriveStats, getTemplate, itemStats, itemScore, gearScore, groupByKey,
  canReforge, equipItem, unequipItem, autoEquip, autoReforge, bestUpgradeForSlot,
  isStageUnlocked, isStageCleared, nextStage, currentChapterIndex, chapterProgress,
  powerTone, xpForLevel, formatNumber, statName, heroTitle, totalInventoryCount,
  rarityProgressionCount
} from './state.js';
import {
  classArt, miniPortrait, itemIcon, skillIcon, uiIcon, stageArt, bossEmblem, crestMark
} from './icons.js';
import { audio, haptic } from './audio.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const esc = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class GameUI {
  constructor(app) {
    this.app = app;
    this.selectedClass = 'warrior';
    this.activeTab = 'campaign';
    this.chapterIndex = 0;
    this.selectedStageId = null;
    this.inventoryFilter = 'all';
    this.inventorySort = 'power';
    this.creatorBound = false;
  }

  get state() { return this.app.state; }

  /* ---------------- creator ---------------- */

  renderCreator() {
    const cards = document.getElementById('classCards');
    cards.innerHTML = CLASSES.map((cls, i) => `
      <button class="class-card ${cls.id === this.selectedClass ? 'selected' : ''}" data-class="${cls.id}" aria-pressed="${cls.id === this.selectedClass}" style="--class-color:${cls.color};--class-accent:${cls.accent}">
        <span class="class-index">0${i + 1}</span>
        <span class="class-selected-mark">${uiIcon('check')}<i>CHOSEN</i></span>
        <span class="class-portrait">
          ${classArt(cls.id)}
          <span class="portrait-haze"></span>
        </span>
        <span class="class-info">
          <span class="class-role">${cls.role}</span>
          <span class="class-name-row"><strong>${cls.name}</strong><span class="class-order">${cls.order}</span></span>
          <span class="class-tagline">${esc(cls.tagline)}</span>
          <span class="class-stats">
            ${Object.entries(cls.stats).map(([key, value]) => `
              <span class="mini-stat"><label>${STAT_LABELS[key]}</label><span class="mini-bar"><i style="width:${value * 10}%"></i></span></span>
            `).join('')}
          </span>
          <span class="class-skills">
            ${cls.skills.map(skill => `<span class="mini-skill">${skillIcon(skill.icon)}<em>${skill.name}</em></span>`).join('')}
          </span>
        </span>
      </button>`).join('');

    if (!this.creatorBound) {
      this.creatorBound = true;
      cards.addEventListener('click', (ev) => {
        const card = ev.target.closest('[data-class]');
        if (!card) return;
        this.selectClass(card.dataset.class);
      });
      cards.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        const card = ev.target.closest('[data-class]');
        if (!card) return;
        ev.preventDefault();
        this.selectClass(card.dataset.class);
      });
      document.getElementById('heroName').addEventListener('keydown', e => {
        if (e.key === 'Enter') this.app.startFromCreator();
      });
      this.updateCreatorSelection();
    }
  }

  selectClass(id) {
    if (!CLASS[id]) return;
    this.selectedClass = id;
    this.updateCreatorSelection();
    audio.play('select');
    const card = document.querySelector(`[data-class="${id}"]`);
    if (card && window.innerWidth < 900) card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  updateCreatorSelection() {
    document.querySelectorAll('[data-class]').forEach(card => {
      const active = card.dataset.class === this.selectedClass;
      card.classList.toggle('selected', active);
      card.setAttribute('aria-pressed', String(active));
    });
    const label = document.getElementById('selectedClass');
    if (label) label.textContent = CLASS[this.selectedClass].name;
    const readout = document.getElementById('selectionReadout');
    if (readout) readout.textContent = CLASS[this.selectedClass].tagline;
  }

  /* ---------------- game shell ---------------- */

  showGame() {
    document.getElementById('creator-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.body.classList.add('in-game');
    this.chapterIndex = currentChapterIndex(this.state);
    this.selectedStageId = nextStage(this.state).id;
    this.renderGame();
  }

  renderGame() {
    if (!this.state) return;
    this.renderHeader();
    this.renderNav();
    const content = document.getElementById('game-content');
    if (this.activeTab === 'campaign') content.innerHTML = this.campaignMarkup();
    else if (this.activeTab === 'forge') content.innerHTML = this.forgeMarkup();
    else content.innerHTML = this.heroMarkup();
    document.body.dataset.activeTab = this.activeTab;
    document.getElementById('game-screen').scrollTop = 0;
  }

  switchTab(tab) {
    if (!['campaign', 'forge', 'hero'].includes(tab)) return;
    this.activeTab = tab;
    this.app.save();
    this.renderGame();
    audio.play('click');
  }

  renderHeader() {
    const state = this.state;
    const stats = deriveStats(state);
    const cls = CLASS[state.classId];
    const header = document.getElementById('game-header');
    header.innerHTML = `
      <div class="header-left">
        <button class="mini-brand" data-tab="campaign" aria-label="Campaign">
          ${crestMark()}
          <span class="mini-wordmark">AETHER<span>FALL</span></span>
        </button>
        <nav class="desktop-tabs" aria-label="Main navigation">
          ${this.tabButton('campaign', 'map', 'Campaign')}
          ${this.tabButton('forge', 'anvil', 'Forge')}
          ${this.tabButton('hero', 'user', 'Hero')}
        </nav>
      </div>
      <div class="header-right">
        <span class="resource-pill gold" title="Gold">${uiIcon('gold')}<strong>${formatNumber(state.gold)}</strong></span>
        <span class="resource-pill relics" title="Relics in vault">${uiIcon('anvil')}<strong>${formatNumber(totalInventoryCount(state))}</strong></span>
        <button class="hero-chip" data-tab="hero" aria-label="Open hero">
          <span class="hero-chip-art">${miniPortrait(state.classId)}</span>
          <span class="hero-chip-copy"><small>LV ${state.level} · ${cls.name}</small><strong>${esc(state.name)}</strong></span>
          <span class="power-tick">${formatNumber(stats.power)}</span>
        </button>
        <button class="round-btn header-settings" data-action="settings" aria-label="Settings">${uiIcon('settings')}</button>
      </div>`;
  }

  renderNav() {
    const nav = document.getElementById('bottom-nav');
    nav.innerHTML = `
      ${this.navButton('campaign', 'map', 'Campaign')}
      ${this.navButton('forge', 'anvil', 'Forge')}
      ${this.navButton('hero', 'user', 'Hero')}`;
  }

  tabButton(tab, icon, label) {
    return `<button class="tab-btn ${this.activeTab === tab ? 'active' : ''}" data-tab="${tab}">${uiIcon(icon)}<span>${label}</span></button>`;
  }

  navButton(tab, icon, label) {
    return `<button class="nav-btn ${this.activeTab === tab ? 'active' : ''}" data-tab="${tab}">${uiIcon(icon)}<span>${label}</span></button>`;
  }

  /* ---------------- campaign ---------------- */

  campaignMarkup() {
    const state = this.state;
    const stats = deriveStats(state);
    const stage = STAGE[this.selectedStageId] || nextStage(state);
    if (!this.selectedStageId) this.selectedStageId = stage.id;
    const cls = CLASS[state.classId];
    const xpNeed = xpForLevel(state.level);
    const unlocked = isStageUnlocked(state, stage);
    const cleared = isStageCleared(state, stage);
    const tone = powerTone(stats.power, stage.recPower);
    const chapter = CHAPTERS[this.chapterIndex];
    const cp = chapterProgress(state, this.chapterIndex);
    const chapterStages = STAGES.filter(s => s.chapter === this.chapterIndex);
    const bossStage = STAGES.filter(s => s.type === 'boss').find(s => !isStageCleared(state, s)) || STAGES[STAGES.length - 1];
    const boss = BOSSES[bossStage.boss];
    const loot = (state.lastLoot || []).slice(0, 4);
    const nearMerge = this.nearestReforge();
    const chapterLocked = this.chapterIndex > 0 && !isStageCleared(state, STAGES.filter(s => s.chapter === this.chapterIndex - 1).slice(-1)[0]);

    return `
      <div class="campaign-grid">
        <aside class="hero-rail">
          <article class="hero-dossier">
            <div class="dossier-art">
              ${classArt(state.classId)}
              <div class="dossier-fade"></div>
              <span class="dossier-level">LV ${state.level}</span>
              <span class="dossier-power">${uiIcon('bolt')} ${formatNumber(stats.power)} POW</span>
            </div>
            <div class="dossier-copy">
              <span class="eyebrow">${heroTitle(state)}</span>
              <h2>${esc(state.name)}</h2>
              <p>${cls.role} · ${cls.tagline}</p>
              <div class="xp-row"><span>LEVEL PROGRESS</span><span>${state.xp} / ${xpNeed} XP</span></div>
              <div class="xp-track"><i style="width:${clamp(state.xp / xpNeed * 100, 0, 100)}%"></i></div>
            </div>
            <div class="loadout-head"><span>RELIC LOADOUT</span><span>${stats.equipped}/9 ${stats.equipped === 9 ? '· RESONANT' : ''}</span></div>
            <div class="loadout-grid">
              ${SLOTS.map(slot => this.gearSlotMarkup(slot)).join('')}
            </div>
            <button class="dossier-forge" data-tab="forge">${uiIcon('anvil')} Enter the forge <span>${totalInventoryCount(state)} relics</span></button>
          </article>
          <article class="side-panel quick-objective">
            <div class="panel-label">CURRENT OATH</div>
            <div class="objective-icon">${uiIcon('flame')}</div>
            <h3>${cleared ? 'Break the next horizon' : `Survive ${esc(stage.name)}`}</h3>
            <p>${cleared ? 'Replay the stage for better loot, or press deeper into the Reach.' : 'Clear the encounter to unlock the road ahead and claim a relic.'}</p>
            <div class="objective-track"><i style="width:${cleared ? 100 : 0}%"></i></div>
            <span class="objective-meta">${cleared ? 'COMPLETE' : 'IN PROGRESS'} · REWARD ${uiIcon('anvil')} RELIC</span>
          </article>
        </aside>

        <section class="campaign-rail">
          <div class="chapter-strip">
            ${CHAPTERS.map((ch, i) => {
              const p = chapterProgress(state, i);
              const locked = i > 0 && !isStageCleared(state, STAGES.filter(s => s.chapter === i - 1).slice(-1)[0]);
              return `<button class="chapter-tab ${i === this.chapterIndex ? 'active' : ''} ${locked ? 'locked' : ''}" data-chapter="${i}" ${locked ? 'aria-disabled="true"' : ''}>
                <span class="chapter-numeral">${ch.numeral}</span>
                <span class="chapter-copy"><small>${locked ? 'SEALED' : `${p.cleared}/${p.total} CLEARED`}</small><strong>${ch.short}</strong></span>
                <span class="chapter-progress"><i style="width:${p.pct}%"></i></span>
                ${locked ? `<span class="chapter-lock">${uiIcon('lock')}</span>` : ''}
              </button>`;
            }).join('')}
          </div>

          <article class="stage-feature ${stage.type === 'boss' ? 'boss-stage' : ''} ${!unlocked ? 'locked-stage' : ''}" style="--chapter-a:${chapter.colors[0]};--chapter-b:${chapter.colors[1]}">
            <div class="stage-art-wrap">${stageArt(chapter.id === 'drowned' ? 1 : chapter.id === 'hollow' ? 2 : 0, stage.type === 'boss')}</div>
            <div class="stage-feature-inner">
              <div class="stage-topline">
                <span class="stage-kicker">${chapter.numeral} · ${String(stage.num).padStart(2, '0')} ${stage.type === 'boss' ? '· BOSS' : '· EXPEDITION'}</span>
                <span class="stage-state ${cleared ? 'cleared' : ''}">${cleared ? `${uiIcon('check')} CLEARED` : unlocked ? 'AVAILABLE' : `${uiIcon('lock')} SEALED`}</span>
              </div>
              <div class="stage-feature-copy">
                <h1>${esc(stage.name)}</h1>
                <p>${esc(stage.desc)}</p>
                <div class="stage-tags">
                  ${stage.foes.map(foe => `<span class="tag foe-tag">${enemyGlyphFor(foe)}${foe}</span>`).join('')}
                </div>
                <div class="stage-actions">
                  <button class="btn btn-primary enter-stage" data-enter-stage="${stage.id}" ${unlocked ? '' : 'disabled'}>
                    ${stage.type === 'boss' ? uiIcon('skull') : uiIcon('sword')}
                    <span>${unlocked ? (cleared ? 'Replay expedition' : 'Enter expedition') : 'Clear previous stage'}</span>
                  </button>
                  <span class="recommended ${tone}">${uiIcon('bolt')} ${formatNumber(stage.recPower)} <small>REC. POWER</small></span>
                </div>
              </div>
              <div class="stage-badge">
                ${stage.type === 'boss' ? bossEmblem(stage.boss) : `<strong>${String(stage.num).padStart(2, '0')}</strong><small>TRIAL</small>`}
              </div>
            </div>
            <div class="stage-reward-line">
              <span>${uiIcon('anvil')} ${stage.type === 'boss' ? '3 GUARANTEED RELICS' : 'RELIC DROP'}</span>
              <span>${uiIcon('gold')} ${formatNumber(stage.gold)}</span>
              <span>${uiIcon('star')} ${formatNumber(stage.xp)} XP</span>
              ${stage.type === 'boss' ? `<span class="reward-highlight">${uiIcon('crown')} ${BOSS_RELICS.find(r => r.stage === stage.num)?.name || 'BOSS RELIC'}</span>` : ''}
            </div>
          </article>

          <div class="stage-path-panel">
            <div class="path-head">
              <div><span class="panel-label">THE ROAD AHEAD</span><h3>${chapter.name}</h3></div>
              <span class="path-progress">${cp.cleared} / ${cp.total} trials cleared</span>
            </div>
            <div class="stage-path">
              <span class="path-line"><i style="width:${cp.cleared ? (cp.cleared - (cp.cleared === cp.total ? 0 : 1)) / Math.max(1, cp.total - 1) * 100 : 0}%"></i></span>
              ${chapterStages.map(s => {
                const sUnlocked = isStageUnlocked(state, s);
                const sCleared = isStageCleared(state, s);
                const active = s.id === stage.id;
                return `<button class="stage-node ${s.type === 'boss' ? 'boss' : ''} ${sCleared ? 'cleared' : ''} ${sUnlocked ? '' : 'locked'} ${active ? 'active' : ''}" data-stage="${s.id}" ${sUnlocked ? '' : 'aria-disabled="true"'}>
                  <span class="node-orb">${sCleared ? uiIcon('check') : s.type === 'boss' ? uiIcon('crown') : String(s.num).padStart(2, '0')}</span>
                  <span class="node-copy"><small>${s.type === 'boss' ? 'BOSS' : sUnlocked ? (sCleared ? 'CLEARED' : 'READY') : 'SEALED'}</small><strong>${esc(s.name)}</strong></span>
                </button>`;
              }).join('')}
            </div>
            <div class="stage-lore"><span class="ornament">✦</span><p>${esc(chapter.blurb)}</p></div>
          </div>
        </section>

        <aside class="chronicle-rail">
          <article class="side-panel next-boss ${isStageCleared(state, bossStage) ? 'conquered' : ''}">
            <div class="panel-label">${isStageCleared(state, bossStage) ? 'THRONE CLAIMED' : 'NEXT GREAT THREAT'}</div>
            <div class="boss-emblem">${bossEmblem(bossStage.boss)}</div>
            <span class="boss-chapter">${CHAPTERS[bossStage.chapter].numeral} · ${CHAPTERS[bossStage.chapter].short}</span>
            <h3>${esc(boss.name)}</h3>
            <p>${esc(boss.title)}</p>
            <div class="boss-power">${uiIcon('bolt')} ${formatNumber(bossStage.recPower)} <span>recommended</span></div>
            <div class="boss-lock-state">${isStageCleared(state, bossStage) ? `${uiIcon('crown')} CONQUERED` : isStageUnlocked(state, bossStage) ? 'THE GATE IS OPEN' : `${uiIcon('lock')} CLEAR ${STAGES.filter(s => s.chapter === bossStage.chapter && s.type !== 'boss').slice(-1)[0].name.toUpperCase()}`}</div>
          </article>

          <article class="side-panel reforge-watch">
            <div class="panel-label">FORGE WATCH</div>
            ${nearMerge ? `
              <div class="watch-item" style="--rarity:${RARITY[nearMerge.rarity].color}">
                <span class="watch-icon">${itemIcon(getTemplate(nearMerge.templateId).slot)}</span>
                <span><small>${RARITY[nearMerge.rarity].name} · ${nearMerge.count}/4</small><strong>${esc(getTemplate(nearMerge.templateId).name)}</strong></span>
              </div>
              <div class="watch-pips">${[0,1,2,3].map(i => `<i class="${i < nearMerge.count ? 'filled' : ''}"></i>`).join('')}</div>
              <p>${nearMerge.count >= 4 ? 'Reforge is ready in the Forge.' : `Collect ${4 - nearMerge.count} more identical cop${4 - nearMerge.count === 1 ? 'y' : 'ies'} to ascend.`}</p>
              <button class="text-link" data-tab="forge">Open the Forge ${uiIcon('chevron')}</button>
            ` : `<p class="empty-copy">No duplicate relic is close to ascension. The road will provide.</p>`}
          </article>

          <article class="side-panel loot-feed">
            <div class="panel-label">RECENT RECOVERY</div>
            ${loot.length ? loot.map(drop => {
              const t = getTemplate(drop.templateId);
              return `<div class="feed-row" style="--rarity:${RARITY[drop.rarity].color}">
                <span class="feed-icon">${itemIcon(t.slot)}</span>
                <span><strong>${esc(t.name)}</strong><small>${RARITY[drop.rarity].name}${drop.count > 1 ? ` ×${drop.count}` : ''}</small></span>
              </div>`;
            }).join('') : `<div class="empty-loot">${uiIcon('anvil')}<p>Your vault is empty. Enter an expedition and claim your first relic.</p></div>`}
          </article>

          <div class="tip-line">${uiIcon('info')}<p>${esc(TIPS[(state.stats.runs || 0) % TIPS.length])}</p></div>
        </aside>
      </div>`;
  }

  nearestReforge() {
    let best = null;
    for (const group of this.state.inventory) {
      if (group.rarity === 'divine') continue;
      if (!best || group.count > best.count) best = group;
    }
    if (!best || best.count < 2) return null;
    return best;
  }

  gearSlotMarkup(slot) {
    const entry = this.state.equipment[slot.id];
    if (!entry) {
      return `<button class="gear-slot empty" data-slot="${slot.id}" aria-label="${slot.name} empty">${itemIcon(slot.icon)}<span class="gear-label">${slot.name}</span><span class="gear-name">Empty</span></button>`;
    }
    const t = getTemplate(entry.templateId);
    const r = RARITY[entry.rarity];
    return `<button class="gear-slot filled" data-slot="${slot.id}" style="--rarity:${r.color};--rarity-glow:${r.glow}" aria-label="${r.name} ${t.name}">
      <span class="gear-rarity"></span>${itemIcon(t.slot)}<span class="gear-label">${slot.name}</span><span class="gear-name">${esc(t.name)}</span>
    </button>`;
  }

  /* ---------------- forge ---------------- */

  forgeMarkup() {
    const state = this.state;
    const stats = deriveStats(state);
    const cls = CLASS[state.classId];
    const filtered = this.filteredInventory();
    const ready = state.inventory.filter(g => canReforge(state, g.key)).length;
    return `
      <div class="page-head forge-head">
        <div>
          <span class="eyebrow">THE RELIQUARY</span>
          <h1>The Forge</h1>
          <p>Four identical relics become one of the next rarity. Every spare copy is potential.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" data-action="auto-equip">${uiIcon('spark')} Auto-equip</button>
          <button class="btn btn-primary ${ready ? 'glow-ready' : ''}" data-action="auto-reforge" ${ready ? '' : 'disabled'}>${uiIcon('anvil')} Reforge ready ${ready ? `<b>${ready}</b>` : ''}</button>
        </div>
      </div>

      <div class="rarity-road">
        ${RARITIES.map((r, i) => `
          <div class="rarity-step" style="--rarity:${r.color}">
            <span class="rarity-gem">${r.short}</span>
            <span><strong>${r.name}</strong><small>${rarityProgressionCount(state, r.id)} owned</small></span>
            ${i < RARITIES.length - 1 ? `<i class="rarity-arrow">×4 ${uiIcon('chevron')}</i>` : '<i class="rarity-arrow max">MAX</i>'}
          </div>`).join('')}
      </div>

      <div class="forge-layout">
        <section class="equipment-panel">
          <div class="equipped-hero">
            <div class="equipped-art">${classArt(state.classId)}</div>
            <div class="equipped-copy">
              <span class="eyebrow">${cls.role}</span>
              <h2>${esc(state.name)}</h2>
              <p>${stats.equipped}/9 relic slots bound ${stats.equipped === 9 ? '· <b>Full resonance +6%</b>' : ''}</p>
              <div class="equipped-power">${uiIcon('bolt')} <strong>${formatNumber(stats.power)}</strong><span>POWER</span></div>
            </div>
            <div class="gear-score">GEAR SCORE <strong>${formatNumber(gearScore(state))}</strong></div>
          </div>
          <div class="equipment-grid large">
            ${SLOTS.map(slot => this.gearSlotMarkup(slot)).join('')}
          </div>
          <div class="resonance-track">
            ${[0,1,2,3,4,5,6,7,8].map(i => `<i class="${i < stats.equipped ? 'lit' : ''}"></i>`).join('')}
            <span>RESONANCE ${stats.equipped}/9</span>
          </div>
        </section>

        <section class="inventory-panel">
          <div class="inventory-head">
            <div><span class="panel-label">RELIC VAULT</span><h2>Collected artifacts <span>${totalInventoryCount(state)}</span></h2></div>
            <div class="inventory-sort">
              <button class="sort-btn ${this.inventorySort === 'power' ? 'active' : ''}" data-sort="power">Power</button>
              <button class="sort-btn ${this.inventorySort === 'rarity' ? 'active' : ''}" data-sort="rarity">Rarity</button>
              <button class="sort-btn ${this.inventorySort === 'count' ? 'active' : ''}" data-sort="count">Count</button>
            </div>
          </div>
          <div class="inventory-filters">
            <button class="filter-chip ${this.inventoryFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            ${SLOTS.map(s => `<button class="filter-chip ${this.inventoryFilter === s.id ? 'active' : ''}" data-filter="${s.id}">${s.name}</button>`).join('')}
          </div>
          ${filtered.length ? `<div class="inventory-grid">${filtered.map(group => this.itemCardMarkup(group)).join('')}</div>` : `
            <div class="empty-state">
              <span>${uiIcon('anvil')}</span>
              <h3>No relics ${this.inventoryFilter === 'all' ? 'yet' : `in ${SLOT[this.inventoryFilter].name}`}</h3>
              <p>Defeat monsters and clear expeditions to recover equipment. Bosses always yield relics.</p>
              <button class="btn btn-primary" data-tab="campaign">Enter an expedition</button>
            </div>`}
        </section>
      </div>`;
  }

  filteredInventory() {
    const state = this.state;
    let list = state.inventory.filter(g => this.inventoryFilter === 'all' || getTemplate(g.templateId)?.slot === this.inventoryFilter);
    list = list.slice().sort((a, b) => {
      if (this.inventorySort === 'rarity') {
        const ra = RARITIES.findIndex(r => r.id === a.rarity), rb = RARITIES.findIndex(r => r.id === b.rarity);
        if (ra !== rb) return rb - ra;
        return b.count - a.count;
      }
      if (this.inventorySort === 'count') return b.count - a.count;
      return itemScore(b.templateId, b.rarity) - itemScore(a.templateId, a.rarity);
    });
    return list;
  }

  itemCardMarkup(group) {
    const t = getTemplate(group.templateId);
    if (!t) return '';
    const r = RARITY[group.rarity];
    const ready = canReforge(this.state, group.key);
    const score = itemScore(group.templateId, group.rarity);
    return `<button class="item-card ${ready ? 'forge-ready' : ''} ${t.unique ? 'unique' : ''}" data-item="${group.key}" style="--rarity:${r.color};--rarity-glow:${r.glow}">
      <span class="item-rarity-bar"></span>
      <span class="item-art">${itemIcon(t.slot)}</span>
      <span class="item-count">×${group.count}</span>
      ${ready ? `<span class="forge-ready-tag">${uiIcon('anvil')} FORGE</span>` : ''}
      <span class="item-copy"><strong>${esc(t.name)}</strong><small>${r.name} · ${SLOT[t.slot].name}</small></span>
      <span class="item-score">${uiIcon('bolt')}${score}</span>
    </button>`;
  }

  /* ---------------- hero ---------------- */

  heroMarkup() {
    const state = this.state;
    const stats = deriveStats(state);
    const cls = CLASS[state.classId];
    const xpNeed = xpForLevel(state.level);
    const bars = [
      ['Health', stats.hp, 2200, 'heart'],
      ['Attack', stats.atk, 360, 'sword'],
      ['Defense', stats.def, 220, 'shield'],
      ['Critical', stats.crit, 75, 'spark'],
      ['Speed', stats.speed, 330, 'dash']
    ];
    return `
      <div class="hero-page">
        <section class="hero-banner" style="--class-color:${cls.color};--class-accent:${cls.accent}">
          <div class="hero-banner-art">${classArt(state.classId)}</div>
          <div class="hero-banner-glow"></div>
          <div class="hero-banner-copy">
            <span class="eyebrow">${heroTitle(state)} · LEVEL ${state.level}</span>
            <h1>${esc(state.name)}</h1>
            <p class="hero-role">${cls.role}</p>
            <blockquote>“${esc(cls.description)}”</blockquote>
            <div class="hero-xp"><span><i style="width:${clamp(state.xp / xpNeed * 100, 0, 100)}%"></i></span><small>${state.xp} / ${xpNeed} XP TO NEXT LEVEL</small></div>
          </div>
          <div class="hero-power-orb"><span>POWER</span><strong>${formatNumber(stats.power)}</strong><small>${stats.equipped}/9 RELICS</small></div>
        </section>

        <div class="hero-lower">
          <section class="stats-panel">
            <div class="panel-label">COMBAT ATTRIBUTES</div>
            <div class="stat-list">
              ${bars.map(([name, value, max, icon]) => `
                <div class="stat-row">
                  <span class="stat-icon">${uiIcon(icon)}</span>
                  <span class="stat-name">${name}</span>
                  <span class="stat-bar"><i style="width:${clamp(value / max * 100, 3, 100)}%"></i></span>
                  <strong>${name === 'Critical' ? `${value}%` : formatNumber(value)}</strong>
                </div>`).join('')}
            </div>
            <div class="stat-foot">
              <span>${uiIcon('heart')} ${formatNumber(stats.hp)} max health</span>
              <span>${uiIcon('sword')} ${formatNumber(stats.atk)} attack</span>
              <span>${uiIcon('bolt')} ${stats.rate.toFixed(2)} atk/sec</span>
              <span>${uiIcon('spark')} ${stats.crit}% crit</span>
            </div>
          </section>

          <section class="skills-panel">
            <div class="panel-head"><div><span class="panel-label">SIGNATURE ARTS</span><h2>Three paths, one certainty.</h2></div><span class="skill-count">03 SKILLS</span></div>
            <div class="skill-cards">
              ${cls.skills.map((skill, i) => `
                <article class="skill-card" style="--class-color:${i === 2 ? cls.accent : cls.color}">
                  <span class="skill-number">0${i + 1}</span>
                  <span class="skill-big-icon">${skillIcon(skill.icon)}</span>
                  <div><span class="skill-type">${skill.tag}</span><h3>${skill.name}</h3><p>${esc(skill.desc)}</p></div>
                  <span class="skill-footer">${uiIcon('clock')} ${skill.cd}s cooldown</span>
                </article>`).join('')}
            </div>
          </section>

          <section class="identity-panel">
            <div class="panel-label">CLASS BALANCE</div>
            <p>Every ascendant is tuned to the same total potential. Your path changes the rhythm of combat, not the ceiling.</p>
            <div class="identity-bars">
              ${Object.entries(cls.stats).map(([key, value]) => `<div><span>${STAT_LABELS[key]}</span><span class="identity-bar"><i style="width:${value * 10}%"></i></span><strong>${value}</strong></div>`).join('')}
            </div>
            <div class="identity-total"><span>TOTAL</span><strong>27 / 27</strong></div>
            <div class="identity-relics">
              <span>${uiIcon('anvil')} RELIC VAULT</span>
              <strong>${totalInventoryCount(state)} pieces</strong>
              <button class="text-link" data-tab="forge">Manage equipment ${uiIcon('chevron')}</button>
            </div>
            <button class="btn btn-ghost settings-wide" data-action="settings">${uiIcon('settings')} Chronicle settings</button>
          </section>
        </div>
      </div>`;
  }

  /* ---------------- modals ---------------- */

  openItemModal(key) {
    const group = groupByKey(this.state, key);
    if (!group) return;
    const t = getTemplate(group.templateId);
    const r = RARITY[group.rarity];
    const stats = itemStats(group.templateId, group.rarity);
    const equ = this.state.equipment[t.slot];
    const current = equ ? itemScore(equ.templateId, equ.rarity) : 0;
    const score = itemScore(group.templateId, group.rarity);
    const next = RARITIES[RARITIES.findIndex(x => x.id === group.rarity) + 1];
    const can = canReforge(this.state, key);
    const needed = Math.max(0, 4 - group.count);
    const relic = t.unique;
    this.openModal(`
      <div class="item-modal" style="--rarity:${r.color};--rarity-glow:${r.glow}">
        <div class="item-modal-art">
          <span class="item-modal-halo"></span>
          ${itemIcon(t.slot)}
          <span class="item-modal-rarity">${r.name.toUpperCase()}</span>
          ${relic ? '<span class="unique-tag">UNIQUE BOSS RELIC</span>' : ''}
        </div>
        <div class="item-modal-copy">
          <span class="eyebrow">${SLOT[t.slot].name} · STACK ${group.count}</span>
          <h2>${esc(t.name)}</h2>
          <p class="item-lore">${esc(t.lore)}</p>
          <div class="item-stat-grid">
            ${Object.entries(stats).map(([stat, value]) => `<div><span>${statName(stat)}</span><strong>+${stat === 'crit' ? `${value}%` : formatNumber(value)}</strong></div>`).join('')}
            <div><span>Power</span><strong>${score}</strong></div>
          </div>
          <div class="compare-line ${score >= current ? 'up' : 'down'}">
            ${equ ? `Equipped: ${itemScore(equ.templateId, equ.rarity)} · ${score >= current ? '+' : ''}${score - current} power` : 'No relic equipped in this slot'}
          </div>
          <div class="reforge-block ${can ? 'ready' : ''}">
            <div class="reforge-head"><span>${uiIcon('anvil')} REFORGE</span><strong>${group.count} / 4</strong></div>
            <div class="reforge-pips">${[0,1,2,3].map(i => `<i class="${i < group.count ? 'filled' : ''}"></i>`).join('')}</div>
            <p>${next ? (can ? `Combine 4 identical copies into 1 <b style="color:${next.color}">${next.name}</b> relic.` : `Collect ${needed} more identical cop${needed === 1 ? 'y' : 'ies'} to ascend.`) : 'Divine relics are the summit. They cannot be reforged further.'}</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" data-equip="${key}">${uiIcon('sword')} Equip relic</button>
            <button class="btn btn-ghost" data-reforge="${key}" ${can ? '' : 'disabled'}>${uiIcon('anvil')} Reforge 4 → 1</button>
          </div>
        </div>
      </div>`, 'item-modal-wrap');
  }

  openSlotModal(slotId) {
    const slot = SLOT[slotId];
    const current = this.state.equipment[slotId];
    const candidates = this.state.inventory
      .filter(g => getTemplate(g.templateId)?.slot === slotId)
      .slice()
      .sort((a, b) => itemScore(b.templateId, b.rarity) - itemScore(a.templateId, a.rarity));
    this.openModal(`
      <div class="slot-modal">
        <div class="slot-modal-head">
          <span class="slot-modal-icon">${itemIcon(slot.icon)}</span>
          <div><span class="eyebrow">EQUIPMENT SLOT</span><h2>${slot.name}</h2></div>
        </div>
        <div class="slot-current">
          <span class="panel-label">CURRENTLY BOUND</span>
          ${current ? `<div class="slot-current-item" style="--rarity:${RARITY[current.rarity].color}">
            <span>${itemIcon(getTemplate(current.templateId).slot)}</span>
            <div><strong>${esc(getTemplate(current.templateId).name)}</strong><small>${RARITY[current.rarity].name} · ${itemScore(current.templateId, current.rarity)} power</small></div>
            <button class="text-link" data-unequip="${slotId}">Unequip</button>
          </div>` : '<p class="empty-copy">Nothing bound to this slot.</p>'}
        </div>
        <div class="slot-options">
          <span class="panel-label">AVAILABLE RELICS</span>
          ${candidates.length ? candidates.map(group => {
            const t = getTemplate(group.templateId);
            const r = RARITY[group.rarity];
            return `<button class="slot-option" data-equip="${group.key}" style="--rarity:${r.color}">
              <span class="slot-option-icon">${itemIcon(t.slot)}</span>
              <span><strong>${esc(t.name)}</strong><small>${r.name} · ×${group.count}</small></span>
              <span class="slot-option-score">${itemScore(group.templateId, group.rarity)}</span>
            </button>`;
          }).join('') : '<p class="empty-copy">No spare relics for this slot yet.</p>'}
        </div>
      </div>`, 'slot-modal-wrap');
  }

  openModal(content, className = '') {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-backdrop ${className}" data-modal-backdrop><div class="modal-shell">${content}<button class="modal-close" data-close-modal aria-label="Close">${uiIcon('close')}</button></div></div>`;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => root.querySelector('.modal-backdrop')?.classList.add('open'));
  }

  closeModal() {
    const root = document.getElementById('modal-root');
    const backdrop = root.querySelector('.modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    setTimeout(() => { root.innerHTML = ''; document.body.classList.remove('modal-open'); }, 220);
  }

  openSettings() {
    const s = this.state.settings;
    this.openModal(`
      <div class="settings-modal">
        <span class="eyebrow">CHRONICLE OPTIONS</span>
        <h2>Settings</h2>
        <div class="settings-list">
          <div class="setting-row">
            <span><strong>Sound & music</strong><small>Procedural combat audio</small></span>
            <button class="toggle ${s.sound ? 'on' : ''}" data-toggle="sound" aria-pressed="${s.sound}"><i></i></button>
          </div>
          <div class="setting-row">
            <span><strong>Haptics</strong><small>Vibration feedback on supported devices</small></span>
            <button class="toggle ${s.haptics ? 'on' : ''}" data-toggle="haptics" aria-pressed="${s.haptics}"><i></i></button>
          </div>
          <div class="setting-row">
            <span><strong>Tilt controls</strong><small>Use device motion in battle ${s.tilt ? '· enabled' : ''}</small></span>
            <button class="toggle ${s.tilt ? 'on' : ''}" data-toggle="tilt" aria-pressed="${s.tilt}"><i></i></button>
          </div>
        </div>
        <p class="settings-note">${s.tilt ? 'Tilt controls will activate when battle begins. Recalibrate from the pause menu.' : 'On iPhone and iPad, enabling tilt asks for motion access. The touch joystick always remains available.'}</p>
        <div class="settings-danger">
          <span><strong>Abandon this chronicle</strong><small>Erase all progress, relics, and equipment.</small></span>
          <button class="btn btn-danger" data-action="reset-game">Erase save</button>
        </div>
        <div class="settings-credit">AETHERFALL · Crown of Cinders · v1.0</div>
      </div>`, 'settings-modal-wrap');
  }
}

function enemyGlyphFor(name) {
  const enemy = Object.entries(ENEMIES).find(([, cfg]) => cfg.name === name);
  return enemy ? enemyGlyphSmall(enemy[0]) : '';
}

function enemyGlyphSmall(type) {
  if (type === 'wisp' || type === 'mote') return '<span class="foe-dot wisp"></span>';
  if (type === 'brute') return '<span class="foe-dot brute"></span>';
  if (type === 'sentinel') return '<span class="foe-dot sentinel"></span>';
  return '<span class="foe-dot husk"></span>';
}
