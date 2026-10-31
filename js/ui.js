/* Ashen Oath — interface, interaction, effects, and modals */
(function () {
  'use strict';

  const D = window.GameData;
  const G = window.Game;
  const { RARITIES, RARITY_BY_ID, SLOTS, SLOT_BY_ID, PERCENT_STATS, STAT_LABELS, CONFIG } = D;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#${name}"></use></svg>`;
  const STAT_ORDER = ['atk', 'hp', 'armor', 'crit', 'critDamage', 'speed', 'lifesteal', 'goldFind', 'xpGain', 'lootFind'];

  let els = {};
  let modalOpen = false;
  let lastFocused = null;
  let pendingVictory = null;
  let victoryTimer = null;
  let inventorySort = 'power';
  let currentTab = 'inventory';
  let audioCtx = null;
  let soundUnlocked = false;
  let currentArtKey = '';

  /* ── Formatting ──────────────────────────────────────────── */
  function fmt(n) {
    const value = Number(n) || 0;
    if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(value >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
    if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(value >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (Math.abs(value) >= 1e4) return (value / 1e3).toFixed(value >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return Math.floor(value).toLocaleString('en-US');
  }
  function fmtExact(n) { return Math.floor(Number(n) || 0).toLocaleString('en-US'); }
  function val(n) { return n >= 10 ? Math.round(n) : Math.round(n * 10) / 10; }
  function statValue(key, value) {
    if (PERCENT_STATS.includes(key)) return `${val(value)}%`;
    return `${Math.round(value)}`;
  }
  function formatDuration(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }
  function refreshLabel(seconds) {
    if (seconds < 15) return 'just now';
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    return formatDuration(seconds) + ' ago';
  }
  function rarityOf(item) { return RARITY_BY_ID[item.rarity] || RARITIES[0]; }
  function slotOf(item) { return SLOT_BY_ID[item.slot] || SLOTS[0]; }
  function itemStyle(item) { return `--rarity:${rarityOf(item).color}`; }

  function itemPrimary(item) {
    const s = item.stats;
    if (s.atk) return `${Math.round(s.atk)} ATK`;
    if (s.hp) return `${Math.round(s.hp)} VIT`;
    if (s.armor) return `${Math.round(s.armor)} ARM`;
    return `${item.power} PWR`;
  }

  function compareDelta(key, item, equipped) {
    if (!equipped) return '';
    const diff = (item.stats[key] || 0) - (equipped.stats[key] || 0);
    if (Math.abs(diff) < 0.05) return '<span class="stat-diff same">—</span>';
    if (diff > 0) return `<span class="stat-diff up">+${statValue(key, diff)}</span>`;
    return `<span class="stat-diff down">−${statValue(key, Math.abs(diff))}</span>`;
  }

  function difficulty(enemy) {
    if (!enemy) return 'Unknown';
    const diff = enemy.level - G.getState().level;
    if (diff >= 8) return 'Deadly';
    if (diff >= 4) return 'Dire';
    if (diff >= 1) return 'Even';
    if (diff >= -3) return 'Favorable';
    return 'Trivial';
  }

  /* ── Rendering: header & hero ────────────────────────────── */
  function renderAll(reason) {
    const s = G.getState();
    if (!s) return;
    const stats = G.computeStats();
    renderHeader(s);
    renderHero(s, stats);
    renderEquipment(s);
    renderBattle(s, stats);
    renderInventory(s);
    renderForge(s);
    renderUpgrades(s);
    renderSound(s);
    if (!reason) updateSaveLabel();
  }

  function renderHeader(s) {
    els.gold.textContent = fmt(s.gold);
    els.gold.title = `${fmtExact(s.gold)} gold`;
    els.kills.textContent = fmt(s.records.kills);
    els.headerLevel.textContent = s.level;
  }

  function renderHero(s, stats) {
    const next = G.xpToNext(s.level);
    const xpPct = next > 0 ? clamp((s.xp / next) * 100, 0, 100) : 100;
    els.heroLevel.textContent = s.level;
    els.heroLevelBadge.textContent = s.level;
    els.xpFill.style.width = xpPct + '%';
    els.xpText.textContent = next > 0 ? `${fmt(s.xp)} / ${fmt(next)} XP` : 'MAX LEVEL';
    const hpPct = clamp((s.hp / stats.maxHp) * 100, 0, 100);
    els.heroHpFill.style.width = hpPct + '%';
    els.heroHpText.textContent = `${Math.ceil(s.hp)} / ${stats.maxHp}`;
    els.heroHpBar.classList.toggle('low', hpPct < 30);
    els.statAttack.textContent = fmt(stats.attack);
    els.statCrit.textContent = `${stats.crit}%`;
    els.statArmor.textContent = fmt(stats.armor);
    els.statDps.textContent = fmt(stats.dps);
    const power = SLOTS.reduce((sum, slot) => sum + (s.equipment[slot.id]?.power || 0), 0);
    els.powerValue.textContent = fmt(power);
    els.autoDpsValue.textContent = s.autoStrike && s.autoEnabled ? fmt(stats.dps) : '—';
    if (audioCtx) renderSound(s);
  }

  function renderEquipment(s) {
    els.equipmentGrid.innerHTML = SLOTS.map((slot) => {
      const item = s.equipment[slot.id];
      const rarity = item ? rarityOf(item) : null;
      return `<button class="equip-slot ${item ? '' : 'empty'}" data-slot="${slot.id}" ${item ? `data-item-id="${item.id}"` : ''}
        style="--rarity:${rarity ? rarity.color : '#45443e'}"
        title="${item ? esc(`${item.name} · ${rarity.name} · Item level ${item.ilvl}`) : `${slot.name} slot — empty`}"
        aria-label="${item ? `Inspect equipped ${esc(item.name)}` : `Empty ${slot.name} slot`}">
        <span class="slot-icon">${icon(slot.icon)}</span>
        <span class="slot-copy">
          <span class="slot-type">${slot.name}</span>
          <span class="slot-name">${item ? esc(item.name) : 'Empty'}</span>
          ${item ? `<span class="slot-ilvl">ilvl ${item.ilvl} · ${item.power} pwr</span>` : '<span class="slot-ilvl">No relic</span>'}
        </span>
      </button>`;
    }).join('');
  }

  /* ── Rendering: battle ───────────────────────────────────── */
  function renderBattle(s, stats) {
    const zone = D.ZONES[s.currentZone];
    const enemy = G.getEnemy();
    const progress = G.getProgress();
    els.zoneName.textContent = zone.name;
    els.zoneDesc.textContent = zone.desc;
    els.zoneTier.textContent = `Tier ${zone.tier}`;
    els.zoneEmblem.textContent = zone.tier;
    els.zoneStatus.textContent = enemy?.isBoss ? 'Boss encounter' : (progress.defeated ? 'Realm conquered' : 'Hunt in progress');
    els.arena.dataset.zone = String(s.currentZone);

    const bossReady = !!enemy?.isBoss;
    const bossPct = bossReady ? 100 : clamp((progress.kills / CONFIG.bossEvery) * 100, 0, 100);
    els.bossProgressFill.style.width = bossPct + '%';
    els.bossTrackText.textContent = bossReady ? 'The boss has awakened' : progress.kills >= CONFIG.bossEvery ? 'Boss approaches' : `Boss stirs in ${CONFIG.bossEvery - progress.kills} kill${CONFIG.bossEvery - progress.kills === 1 ? '' : 's'}`;
    els.bossTrackPips.innerHTML = Array.from({ length: CONFIG.bossEvery }, (_, i) => `<i class="${i < progress.kills ? 'filled' : ''} ${bossReady ? 'boss-ready' : ''}"></i>`).join('');

    // Enemy
    if (enemy) {
      els.enemyRank.textContent = enemy.isBoss ? `Boss · ${zone.name}` : enemy.rank;
      els.enemyName.innerHTML = `${esc(enemy.name)} <span id="enemy-level">Lv. ${enemy.level}</span>`;
      els.enemyBossChip.classList.toggle('show', enemy.isBoss);
      els.enemyGoldReward.textContent = fmt(Math.round(enemy.gold * stats.goldMult));
      els.enemyXpReward.textContent = fmt(Math.round(enemy.xp * stats.xpMult));
      els.enemyTrait.textContent = enemy.trait;
      els.enemyHpBar.classList.toggle('boss', enemy.isBoss);
      els.enemyWrap.classList.remove('pending', 'dead');
      els.enemyWrap.classList.toggle('boss', enemy.isBoss);
      els.enemyWrap.setAttribute('aria-label', `Strike ${enemy.name}, level ${enemy.level}`);
      els.enemyWrap.disabled = false;
      els.arenaDifficulty.textContent = `Threat: ${difficulty(enemy)}`;
      ensureArt(zone, enemy);
      updateEnemyBars(enemy);
    } else {
      els.enemyRank.textContent = 'The veil stirs';
      els.enemyName.innerHTML = 'Gathering shadows';
      els.enemyBossChip.classList.remove('show');
      els.enemyGoldReward.textContent = '0';
      els.enemyXpReward.textContent = '0';
      els.enemyTrait.textContent = 'The next soul approaches…';
      els.enemyHpBar.classList.remove('boss');
      els.enemyWrap.classList.add('pending');
      els.enemyWrap.classList.remove('boss');
      els.enemyWrap.disabled = true;
      els.enemyHpFill.style.width = '0%';
      els.enemyHpText.textContent = '—';
      els.enemyHpPercent.textContent = '—';
      els.arenaDifficulty.textContent = 'Threat: Unknown';
    }

    els.arenaKillstreak.textContent = `${Math.ceil(s.hp)} HP · ${progress.kills} slain here`;
    els.clickHint.classList.toggle('fade', !enemy || s.records.kills > 4);

    // Auto-strike control
    els.autoBtn.classList.toggle('locked', !s.autoStrike);
    els.autoBtn.classList.toggle('active', s.autoStrike && s.autoEnabled);
    els.autoBtn.setAttribute('aria-pressed', String(s.autoStrike && s.autoEnabled));
    if (!s.autoStrike) {
      els.autoStatus.textContent = `Unlock · ${CONFIG.autoUnlockCost}g`;
      els.autoBtn.title = `Unlock Auto-Strike for ${CONFIG.autoUnlockCost} gold`;
      els.autoCopy.querySelector('strong').textContent = 'Auto-Strike';
    } else if (s.autoEnabled) {
      els.autoStatus.textContent = `Bound · ${stats.interval.toFixed(2)}s`;
      els.autoBtn.title = 'Pause Auto-Strike';
      els.autoCopy.querySelector('strong').textContent = 'Auto-Strike';
    } else {
      els.autoStatus.textContent = 'Paused';
      els.autoBtn.title = 'Resume Auto-Strike';
      els.autoCopy.querySelector('strong').textContent = 'Auto-Strike';
    }
    els.strikeBtn.disabled = !enemy || s.hp <= 0;
    els.strikeBtn.querySelector('span').textContent = s.downedUntil > Date.now() ? 'Fallen' : 'Strike';
  }

  function ensureArt(zone, enemy) {
    const key = `${zone.id}:${enemy.isBoss ? 'boss' : 'normal'}`;
    if (key !== currentArtKey) {
      currentArtKey = key;
      els.enemyArt.innerHTML = window.MonsterArt.get(zone.art, enemy.isBoss);
      // Retrigger the idle animation cleanly.
      els.enemyArt.style.animation = 'none';
      void els.enemyArt.offsetWidth;
      els.enemyArt.style.animation = '';
    }
  }

  function updateEnemyBars(enemy) {
    if (!enemy) return;
    const pct = clamp((enemy.hp / enemy.maxHp) * 100, 0, 100);
    els.enemyHpFill.style.width = pct + '%';
    els.enemyHpText.textContent = `${fmt(enemy.hp)} / ${fmt(enemy.maxHp)}`;
    els.enemyHpPercent.textContent = `${Math.ceil(pct)}%`;
  }

  function updateHeroBars() {
    const s = G.getState();
    const stats = G.computeStats();
    if (!s) return;
    const pct = clamp((s.hp / stats.maxHp) * 100, 0, 100);
    els.heroHpFill.style.width = pct + '%';
    els.heroHpText.textContent = `${Math.ceil(s.hp)} / ${stats.maxHp}`;
    els.heroHpBar.classList.toggle('low', pct < 30);
    const progress = G.getProgress();
    els.arenaKillstreak.textContent = `${Math.ceil(s.hp)} HP · ${progress.kills} slain here`;
  }

  /* ── Rendering: inventory / forge / upgrades ─────────────── */
  function sortedInventory(s) {
    const items = s.inventory.slice();
    if (inventorySort === 'rarity') {
      items.sort((a, b) => rarityOf(b).index - rarityOf(a).index || b.power - a.power);
    } else if (inventorySort === 'newest') {
      items.reverse();
    } else if (inventorySort === 'slot') {
      items.sort((a, b) => SLOTS.findIndex((x) => x.id === a.slot) - SLOTS.findIndex((x) => x.id === b.slot) || b.power - a.power);
    } else {
      items.sort((a, b) => b.power - a.power);
    }
    return items;
  }

  function renderInventory(s) {
    const items = sortedInventory(s);
    els.inventoryCount.textContent = `${s.inventory.length} / ${CONFIG.inventorySize}`;
    els.inventoryTabCount.textContent = s.inventory.length;
    els.inventoryGrid.innerHTML = items.map(itemCardHTML).join('');
    els.inventoryEmpty.classList.toggle('show', items.length === 0);
    els.inventoryGrid.classList.toggle('hidden', items.length === 0);
    const commons = s.inventory.filter((i) => i.rarity === 'common').length;
    els.sellCommonsBtn.disabled = commons === 0;
    els.sellCommonsBtn.textContent = commons ? `Sell Commons (${commons})` : 'Sell Commons';
  }

  function itemCardHTML(item) {
    const rarity = rarityOf(item);
    const slot = slotOf(item);
    const affix = item.affixes?.[0]?.name;
    return `<button class="item-card" data-item-id="${item.id}" style="${itemStyle(item)}"
      title="${esc(`${item.name} — ${rarity.name} ${slot.name} · ${item.power} power${affix ? ` · ${affix}` : ''}`)}"
      aria-label="Inspect ${esc(item.name)}">
      ${item.fresh ? '<span class="new-dot"></span>' : ''}
      <span class="item-top">
        <span class="item-icon">${icon(slot.icon)}</span>
        <span class="item-copy">
          <span class="item-name">${esc(item.name)}</span>
          <span class="item-slot">${rarity.name} ${slot.name}</span>
        </span>
      </span>
      <span class="item-bottom">
        <span class="item-ilvl">ilvl ${item.ilvl}</span>
        <span class="item-power">${itemPrimary(item)}</span>
      </span>
    </button>`;
  }

  function renderForge(s) {
    els.rarityChain.innerHTML = RARITIES.map((r) => `<i title="${r.name}" style="background:${r.color};color:${r.color}"></i>`).join('<span>›</span>');
    const groups = G.getFusionGroups();
    els.forgeGroups.innerHTML = groups.map((group) => {
      const extra = group.count > 3 ? `<span class="forge-extra">+${group.count - 3}</span>` : '';
      return `<div class="forge-group" style="--rarity:${group.rarity.color};--next-rarity:${group.next.color}">
        <div class="forge-group-head">
          <div class="forge-icons">${group.selected.map((item) => `<span class="mini-item-icon" title="${esc(item.name)}">${icon(group.slot.icon)}</span>`).join('')}${extra}</div>
          <div class="forge-group-copy">
            <strong>${group.count}× ${group.rarity.name} ${group.slot.name}</strong>
            <span>Forge into <b>${group.next.name}</b> · uses 3 lowest power</span>
          </div>
        </div>
        <button class="fuse-btn" data-fuse-slot="${group.slot.id}" data-fuse-rarity="${group.rarity.id}">Fuse 3</button>
      </div>`;
    }).join('');
    els.forgeEmpty.classList.toggle('show', groups.length === 0);
    els.forgeGroups.classList.toggle('hidden', groups.length === 0);
    els.forgeReadyBadge.classList.toggle('hidden', groups.length === 0);
  }

  function renderUpgrades(s) {
    const stats = G.computeStats();
    els.upgradeGold.textContent = fmt(s.gold);
    els.upSummaryDamage.textContent = s.upgrades.damage;
    els.upSummarySpeed.textContent = `${s.upgrades.speed * 2}%`;
    els.upSummaryFortune.textContent = `${s.upgrades.fortune * 0.7}%`;

    const autoCard = s.autoStrike
      ? `<div class="upgrade-card auto-upgrade unlocked">
          <span class="upgrade-icon" style="--up-color:#7fa987">${icon('i-flash')}</span>
          <div class="upgrade-copy">
            <strong>Auto-Strike <b>BOUND</b></strong>
            <p>Strikes every <b>${stats.interval.toFixed(2)}s</b> while you are away.</p>
          </div>
          <button class="buy-btn ${s.autoEnabled ? 'maxed' : ''}" data-action="toggle-auto">${s.autoEnabled ? 'Enabled' : 'Paused'}</button>
        </div>`
      : `<div class="upgrade-card auto-upgrade">
          <span class="upgrade-icon" style="--up-color:#c7a05f">${icon('i-flash')}</span>
          <div class="upgrade-copy">
            <strong>Auto-Strike <b>UNLOCK</b></strong>
            <p class="auto-desc">Bind a familiar to fight for you — even offline.</p>
          </div>
          <button class="buy-btn" data-action="unlock-auto" ${s.gold < CONFIG.autoUnlockCost ? 'disabled' : ''}>${CONFIG.autoUnlockCost} ${icon('i-coin')}</button>
        </div>`;

    els.upgradeList.innerHTML = autoCard + D.UPGRADES.map((up) => {
      const level = s.upgrades[up.id] || 0;
      const maxed = level >= up.max;
      const cost = maxed ? Infinity : G.upgradeCost(up.id);
      const afford = s.gold >= cost;
      return `<div class="upgrade-card" style="--up-color:${up.color}">
        <span class="upgrade-icon">${icon(up.icon)}</span>
        <div class="upgrade-copy">
          <strong>${up.name} <b>RANK ${level}</b></strong>
          <p>${maxed ? `<b>${up.effect(level)}</b> · maximum rank` : `<b>${up.effect(level)}</b> → ${up.effect(level + 1)}`}</p>
        </div>
        <button class="buy-btn ${maxed ? 'maxed' : ''}" data-buy-upgrade="${up.id}" ${maxed || !afford ? 'disabled' : ''}>
          ${maxed ? 'MAX' : `${fmt(cost)} ${icon('i-coin')}`}
        </button>
      </div>`;
    }).join('');
  }

  function renderSound(s) {
    const use = $('sound-icon');
    if (!use) return;
    use.setAttribute('href', s.settings.sound ? '#i-sound-on' : '#i-sound-off');
    const btn = $('sound-btn');
    if (btn) btn.title = s.settings.sound ? 'Mute sound' : 'Enable sound';
  }

  function renderLog(entries) {
    const list = (entries || G.getLogs()).slice(-3);
    els.combatLog.innerHTML = list.map((entry) => `<li class="log-${entry.type}">${entry.text}</li>`).join('');
  }

  /* ── Effects ─────────────────────────────────────────────── */
  function spawnDamage(text, type = '', crit = false) {
    const el = document.createElement('span');
    el.className = `dmg-number ${type} ${crit ? 'crit' : ''}`.trim();
    el.textContent = text;
    el.style.setProperty('--dx', `${rand(-58, 58).toFixed(0)}px`);
    el.style.top = `${rand(34, 48).toFixed(0)}%`;
    els.fxLayer.appendChild(el);
    setTimeout(() => el.remove(), 1150);
  }

  function spawnSlash(crit) {
    const slash = document.createElement('span');
    slash.className = 'slash-fx';
    slash.style.setProperty('--rot', `${rand(-60, 25).toFixed(0)}deg`);
    if (crit) slash.style.width = '210px';
    els.fxLayer.appendChild(slash);
    setTimeout(() => slash.remove(), 360);
    const count = crit ? 10 : 5;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'impact-particle';
      particle.style.setProperty('--dx', `${rand(-70, 70).toFixed(0)}px`);
      particle.style.setProperty('--dy', `${rand(-60, 50).toFixed(0)}px`);
      particle.style.animationDelay = `${rand(0, 0.06).toFixed(2)}s`;
      if (crit) particle.style.background = '#ffe6a7';
      els.fxLayer.appendChild(particle);
      setTimeout(() => particle.remove(), 720);
    }
  }

  function lootBurst(item) {
    const rarity = rarityOf(item);
    const beam = document.createElement('span');
    beam.className = 'loot-beam';
    beam.style.setProperty('--loot-color', rarity.color);
    els.fxLayer.appendChild(beam);
    const pop = document.createElement('span');
    pop.className = 'loot-pop';
    pop.style.setProperty('--loot-color', rarity.color);
    pop.textContent = `${rarity.name} ${slotOf(item).name}`;
    els.fxLayer.appendChild(pop);
    setTimeout(() => { beam.remove(); pop.remove(); }, 1450);
  }

  function critFlash() {
    const flash = document.createElement('span');
    flash.className = 'crit-flash';
    els.arena.appendChild(flash);
    setTimeout(() => flash.remove(), 260);
  }

  function hitFlash() {
    const flash = document.createElement('span');
    flash.className = 'screen-hit';
    els.arena.appendChild(flash);
    setTimeout(() => flash.remove(), 260);
    els.heroPanel.classList.add('taking-hit');
    setTimeout(() => els.heroPanel.classList.remove('taking-hit'), 260);
  }

  function bumpHit() {
    els.enemyWrap.classList.remove('hit', 'attacking');
    void els.enemyWrap.offsetWidth;
    els.enemyWrap.classList.add('hit', 'attacking');
    clearTimeout(bumpHit.timer);
    bumpHit.timer = setTimeout(() => els.enemyWrap.classList.remove('hit', 'attacking'), 300);
  }

  function showBanner(kicker, title, sub = '', variant = '') {
    els.combatBanner.className = `combat-banner ${variant}`;
    els.combatBanner.innerHTML = `<span class="banner-kicker">${esc(kicker)}</span><span class="banner-title">${esc(title)}</span>${sub ? `<span class="banner-sub">${esc(sub)}</span>` : ''}`;
    void els.combatBanner.offsetWidth;
    els.combatBanner.classList.add('show');
  }

  function showToast({ kicker = '', title = '', sub = '', color = '#d2ab62', iconName = 'i-star', rare = false, life = 3800 }) {
    while (els.toastStack.children.length >= 4) {
      els.toastStack.firstElementChild?.remove();
    }
    const toast = document.createElement('div');
    toast.className = `toast ${rare ? 'rare' : ''}`;
    toast.style.setProperty('--toast-color', color);
    toast.innerHTML = `
      <span class="toast-icon">${icon(iconName)}</span>
      <span class="toast-copy">
        ${kicker ? `<span class="toast-kicker">${esc(kicker)}</span>` : ''}
        <span class="toast-title">${esc(title)}</span>
        ${sub ? `<span class="toast-sub">${esc(sub)}</span>` : ''}
      </span>
      <span class="toast-progress" style="animation-duration:${life}ms"></span>`;
    toast.addEventListener('click', () => dismissToast(toast));
    els.toastStack.appendChild(toast);
    setTimeout(() => dismissToast(toast), life);
  }

  function dismissToast(toast) {
    if (!toast || toast.classList.contains('out')) return;
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }

  function toastLoot(item) {
    const rarity = rarityOf(item);
    showToast({
      kicker: `${rarity.name} relic recovered`,
      title: item.name,
      sub: `${slotOf(item).name} · ilvl ${item.ilvl} · ${item.power} power${item.affixes?.[0] ? ` · ${item.affixes[0].name}` : ''}`,
      color: rarity.color,
      iconName: slotOf(item).icon,
      rare: rarity.index >= 2,
      life: rarity.index >= 3 ? 5200 : 3800
    });
  }

  /* ── Audio ───────────────────────────────────────────────── */
  function ensureAudio() {
    if (audioCtx) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      soundUnlocked = true;
      return true;
    } catch (err) {
      return false;
    }
  }

  function soundOn() {
    const s = G.getState();
    return !!(s && s.settings.sound && (audioCtx || soundUnlocked));
  }

  function tone(freq, duration, type = 'sine', volume = 0.03, delay = 0, endFreq = null) {
    if (!soundOn() || !audioCtx) return;
    try {
      const start = audioCtx.currentTime + delay;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch (err) { /* audio is optional */ }
  }

  function sfxHit(crit) {
    tone(crit ? 220 : 145, crit ? 0.15 : 0.08, 'triangle', crit ? 0.04 : 0.025, 0, crit ? 85 : 52);
    if (crit) tone(760, 0.18, 'sine', 0.02, 0.01, 320);
  }
  function sfxKill() {
    tone(95, 0.24, 'sine', 0.04, 0, 45);
    tone(210, 0.16, 'triangle', 0.018, 0.02, 110);
  }
  function sfxLoot(rarityIndex) {
    const notes = [392, 494, 587, 698, 880, 1046];
    const base = notes[clamp(rarityIndex, 0, 5)];
    tone(base, 0.22, 'sine', 0.025, 0);
    tone(base * 1.5, 0.32, 'sine', 0.018, 0.07);
    if (rarityIndex >= 3) tone(base * 2, 0.4, 'sine', 0.016, 0.15);
  }
  function sfxLevel() {
    [330, 415, 523, 659].forEach((f, i) => tone(f, 0.3, 'sine', 0.025, i * 0.09));
  }
  function sfxDown() {
    tone(80, 0.55, 'sine', 0.045, 0, 28);
  }
  function sfxEnemyHit() {
    tone(70, 0.12, 'square', 0.018, 0, 38);
  }

  /* ── Game hooks ──────────────────────────────────────────── */
  const hooks = {
    render: (payload) => { renderAll(payload?.reason); },
    spawn: () => {},
    attack: (payload) => {
      if (G.isPaused()) return;
      spawnSlash(payload.crit);
    },
    hit: (payload) => {
      bumpHit();
      updateEnemyBars(G.getEnemy());
      spawnDamage(`${payload.crit ? '' : '−'}${fmt(payload.damage)}`, '', payload.crit);
      if (payload.crit) critFlash();
      sfxHit(payload.crit);
      els.clickHint.classList.add('fade');
    },
    heal: (payload) => {
      updateHeroBars();
      spawnDamage(`+${fmt(payload.amount)}`, 'heal');
    },
    enemyAttack: (payload) => {
      updateHeroBars();
      spawnDamage(`−${fmt(payload.damage)}`, 'enemy-hit');
      hitFlash();
      sfxEnemyHit();
    },
    downed: () => {
      showBanner('The oath falters', 'You Have Fallen', 'Regrouping… 3 seconds', 'danger');
      sfxDown();
      renderAll('downed');
    },
    revived: () => {
      showBanner('The oath holds', 'Rise Again', 'The hunt continues', 'level');
      updateHeroBars();
      showToast({ kicker: 'The oath holds', title: 'You rise again', color: '#8b9d7b', iconName: 'i-shield', life: 2600 });
    },
    enemyDown: () => {
      els.enemyWrap.classList.add('dead');
    },
    kill: (payload) => {
      sfxKill();
      spawnDamage(`+${fmt(payload.gold)}`, 'gold');
      if (payload.items?.length) {
        const best = payload.items.reduce((a, b) => rarityOf(b).index > rarityOf(a).index ? b : a, payload.items[0]);
        lootBurst(best);
      }
      if (payload.boss) {
        clearTimeout(victoryTimer);
        victoryTimer = setTimeout(() => {
          if (modalOpen) pendingVictory = payload;
          else openVictory(payload);
        }, 820);
      }
    },
    loot: (payload) => {
      toastLoot(payload.item);
      sfxLoot(rarityOf(payload.item).index);
    },
    levelUp: (payload) => {
      showBanner('Power awakens', `Level ${payload.level}`, 'Your attributes have increased', 'level');
      showToast({ kicker: 'Level up', title: `You reached level ${payload.level}`, sub: 'Vitality restored · new power flows through the oath', color: '#e0bd75', iconName: 'i-star', rare: true, life: 4600 });
      sfxLevel();
      renderAll('level');
    },
    bossSpawn: (payload) => {
      showBanner('Boss encounter', payload.enemy.name, `Level ${payload.enemy.level} · ${payload.zone.name}`, 'danger');
      showToast({ kicker: 'A presence stirs', title: payload.enemy.name, sub: `The boss of ${payload.zone.name} has emerged.`, color: '#c8785d', iconName: 'i-skull', rare: true, life: 4000 });
      tone(58, 0.7, 'sine', 0.05, 0, 25);
    },
    bossDefeated: (payload) => {
      showToast({ kicker: 'Boss vanquished', title: payload.enemy.name, sub: payload.items?.length ? `${payload.items.length} boss relics recovered` : 'The way forward opens.', color: '#d9ae61', iconName: 'i-skull', rare: true, life: 5200 });
    },
    zoneUnlocked: (payload) => {
      showToast({ kicker: 'New realm unlocked', title: payload.zone.name, sub: `Tier ${payload.zone.tier} · recommended level ${payload.zone.level}`, color: '#d9ae61', iconName: 'i-map', rare: true, life: 5500 });
    },
    autoUnlocked: () => {
      showBanner('The oath quickens', 'Auto-Strike Bound', 'Your familiar strikes without command', 'level');
      showToast({ kicker: 'Auto-Strike', title: 'Your familiar is bound', sub: 'Attacks continue automatically — and while you are offline.', color: '#d9ae61', iconName: 'i-flash', rare: true, life: 5000 });
      tone(300, 0.25, 'sine', 0.025);
      tone(450, 0.35, 'sine', 0.02, 0.1);
    },
    autoToggled: (payload) => {
      showToast({ kicker: 'Auto-Strike', title: payload.enabled ? 'Familiar unleashed' : 'Familiar resting', color: '#9d927d', iconName: 'i-flash', life: 2300 });
    },
    notice: (payload) => {
      showToast({ kicker: 'The oath whispers', title: payload.text, color: payload.tone === 'bad' ? '#bd7969' : '#d2ab62', iconName: 'i-help', life: 2600 });
    },
    sold: (payload) => {
      showToast({ kicker: 'Relic sold', title: `+${fmt(payload.price)} gold`, sub: payload.item.name, color: '#c9a25d', iconName: 'i-coin', life: 2300 });
    },
    soldBulk: (payload) => {
      showToast({ kicker: 'Satchel cleared', title: `${payload.count} Commons sold`, sub: `+${fmt(payload.gold)} gold`, color: '#c9a25d', iconName: 'i-coin', life: 3200 });
    },
    fused: (payload) => {
      // The direct click handler opens the result card after the action.
      showToast({ kicker: 'Forge complete', title: payload.result.name, sub: `${payload.next.name} ${slotOf(payload.result).name} born from three relics.`, color: payload.next.color, iconName: 'i-anvil', rare: true, life: 4800 });
      sfxLoot(payload.next.index);
    },
    saved: () => {
      updateSaveLabel();
    },
    log: (payload) => renderLog(payload.entries),
    travel: () => {},
    reset: () => {}
  };

  function updateSaveLabel() {
    if (!els.saveState) return;
    els.saveState.classList.remove('saving');
    els.saveState.innerHTML = '<span class="save-dot"></span> Saved';
    els.saveState.title = 'Progress saves automatically';
  }

  /* ── Interactions ────────────────────────────────────────── */
  function bindEvents() {
    els.enemyWrap.addEventListener('click', () => {
      ensureAudio();
      G.strike(false);
    });
    els.strikeBtn.addEventListener('click', () => {
      ensureAudio();
      G.strike(false);
    });
    els.autoBtn.addEventListener('click', () => {
      ensureAudio();
      G.toggleAuto();
    });

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => setTab(tab.dataset.tab));
    });

    els.inventoryGrid.addEventListener('click', (event) => {
      const card = event.target.closest('[data-item-id]');
      if (!card) return;
      openItemModal(card.dataset.itemId, 'inventory');
    });

    els.equipmentGrid.addEventListener('click', (event) => {
      const slot = event.target.closest('.equip-slot');
      if (!slot) return;
      if (slot.dataset.itemId) openItemModal(slot.dataset.itemId, 'equipped');
      else showToast({ kicker: 'Equipment', title: `No ${SLOT_BY_ID[slot.dataset.slot].name} equipped`, sub: 'Slay monsters to find a relic for this slot.', color: '#8d8677', iconName: SLOT_BY_ID[slot.dataset.slot].icon, life: 2600 });
    });

    els.forgeGroups.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-fuse-slot]');
      if (!btn) return;
      ensureAudio();
      const result = G.fuse(btn.dataset.fuseSlot, btn.dataset.fuseRarity);
      if (result) openItemModal(result.id, 'inventory', { kicker: 'Fusion complete', note: 'Three relics were consumed. The forge remembers.' });
    });

    els.upgradeList.addEventListener('click', (event) => {
      const buy = event.target.closest('[data-buy-upgrade]');
      if (buy) {
        ensureAudio();
        if (G.buyUpgrade(buy.dataset.buyUpgrade)) tone(320, 0.12, 'sine', 0.02);
        return;
      }
      const action = event.target.closest('[data-action]');
      if (!action) return;
      if (action.dataset.action === 'unlock-auto') G.purchaseAuto();
      if (action.dataset.action === 'toggle-auto') G.toggleAuto();
    });

    els.sortSelect.addEventListener('change', () => {
      inventorySort = els.sortSelect.value;
      renderInventory(G.getState());
    });
    els.sellCommonsBtn.addEventListener('click', () => {
      const s = G.getState();
      const commons = s.inventory.filter((i) => i.rarity === 'common');
      if (!commons.length) return;
      openConfirm({
        title: 'Sell all Common relics?',
        text: `${commons.length} Common relics will be sold for ${fmt(commons.reduce((sum, i) => sum + G.sellPrice(i), 0))} gold. This cannot be undone.`,
        action: 'confirm-sell-commons',
        label: 'Sell them',
        danger: false
      });
    });

    $('map-btn').addEventListener('click', openMap);
    $('zone-travel-btn').addEventListener('click', openMap);
    $('help-btn').addEventListener('click', openHelp);
    $('settings-btn').addEventListener('click', openSettings);
    $('sound-btn').addEventListener('click', () => {
      ensureAudio();
      const s = G.getState();
      const enabled = !s.settings.sound;
      G.setSound(enabled);
      if (enabled) tone(400, 0.18, 'sine', 0.025);
    });

    els.modalClose.addEventListener('click', closeModal);
    els.modalBackdrop.addEventListener('click', (event) => {
      if (event.target === els.modalBackdrop) closeModal();
    });
    els.modalContent.addEventListener('click', handleModalAction);

    document.addEventListener('keydown', (event) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      if (event.code === 'Escape' && modalOpen) { closeModal(); return; }
      if (typing || modalOpen) return;
      if (event.code === 'Space') {
        event.preventDefault();
        ensureAudio();
        G.strike(false);
      }
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        openMap();
      }
    });

    document.addEventListener('pointerdown', ensureAudio, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) G.save();
    });
    window.addEventListener('beforeunload', () => G.save());
  }

  function setTab(tab) {
    if (!['inventory', 'forge', 'upgrades'].includes(tab)) return;
    currentTab = tab;
    document.querySelectorAll('.tab').forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.panel === tab);
    });
    if (tab === 'inventory') renderInventory(G.getState());
    if (tab === 'forge') renderForge(G.getState());
    if (tab === 'upgrades') renderUpgrades(G.getState());
    if (window.innerWidth < 880) {
      setTimeout(() => {
        els.sidePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    }
  }

  /* ── Modal shell ─────────────────────────────────────────── */
  function setModal(html, extraClass = '') {
    lastFocused = document.activeElement;
    els.modalContent.innerHTML = html;
    els.modalShell.className = `modal-shell ${extraClass}`.trim();
    els.modalBackdrop.classList.remove('hidden');
    document.body.classList.add('modal-open');
    modalOpen = true;
    G.setPaused(true);
    setTimeout(() => {
      const close = els.modalClose;
      if (close) close.focus({ preventScroll: true });
    }, 30);
    els.modalShell.scrollTop = 0;
  }

  function closeModal() {
    if (!modalOpen) return;
    els.modalBackdrop.classList.add('hidden');
    document.body.classList.remove('modal-open');
    modalOpen = false;
    els.modalContent.innerHTML = '';
    G.setPaused(false);
    renderAll('modal-close');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus({ preventScroll: true });
    if (pendingVictory) {
      const p = pendingVictory;
      pendingVictory = null;
      setTimeout(() => openVictory(p), 180);
    }
  }

  function handleModalAction(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'equip') {
      const item = findItem(target.dataset.itemId);
      if (item && G.equipItem(item.id)) {
        closeModal();
        showToast({ kicker: 'Equipped', title: item.name, sub: `${slotOf(item).name} · ${item.power} power`, color: rarityOf(item).color, iconName: slotOf(item).icon, life: 2500 });
      }
    } else if (action === 'unequip') {
      const item = G.getState().equipment[target.dataset.slot];
      if (item && G.unequipItem(target.dataset.slot)) {
        closeModal();
        showToast({ kicker: 'Unequipped', title: item.name, sub: 'Returned to your satchel.', color: rarityOf(item).color, iconName: slotOf(item).icon, life: 2300 });
      }
    } else if (action === 'sell') {
      const item = findItem(target.dataset.itemId);
      if (!item) return;
      const price = G.sellPrice(item);
      G.sellItem(item.id);
      closeModal();
    } else if (action === 'inspect') {
      const item = findItem(target.dataset.itemId);
      if (item) openItemModal(item.id, G.getState().equipment[item.slot]?.id === item.id ? 'equipped' : 'inventory');
    } else if (action === 'open-forge') {
      closeModal();
      setTab('forge');
    } else if (action === 'travel') {
      const idx = Number(target.dataset.index);
      if (G.travelTo(idx)) closeModal();
    } else if (action === 'confirm-sell-commons') {
      G.sellCommons();
      closeModal();
    } else if (action === 'confirm-reset') {
      G.reset();
      closeModal();
      renderAll('reset');
      showToast({ kicker: 'A new oath', title: 'Your saga begins anew', color: '#d2ab62', iconName: 'i-star', life: 3200 });
    } else if (action === 'open-reset') {
      openConfirm({
        title: 'Abandon this oath?',
        text: 'All levels, relics, gold, and zone progress will be erased. This cannot be undone.',
        action: 'confirm-reset',
        label: 'Reset everything',
        danger: true
      });
    } else if (action === 'save-now') {
      G.save();
      showToast({ kicker: 'Save', title: 'Progress saved', sub: 'Your saga is safe in this browser.', color: '#7fa987', iconName: 'i-shield', life: 2400 });
    } else if (action === 'toggle-sound') {
      const s = G.getState();
      ensureAudio();
      const enabled = !s.settings.sound;
      G.setSound(enabled);
      openSettings();
      if (enabled) tone(420, 0.16, 'sine', 0.02);
    } else if (action === 'close') {
      closeModal();
    } else if (action === 'help') {
      openHelp();
    } else if (action === 'map') {
      openMap();
    }
  }

  function findItem(id) {
    const s = G.getState();
    return s.inventory.find((i) => i.id === id) || SLOTS.map((slot) => s.equipment[slot.id]).find((i) => i?.id === id) || null;
  }

  /* ── Item detail ─────────────────────────────────────────── */
  function openItemModal(itemId, mode = 'inventory', options = {}) {
    const item = findItem(itemId);
    if (!item) return;
    const s = G.getState();
    if (item.fresh) {
      item.fresh = false;
      G.save();
      renderInventory(s);
    }
    const rarity = rarityOf(item);
    const slot = slotOf(item);
    const equipped = s.equipment[item.slot];
    const isEquipped = mode === 'equipped' || equipped?.id === item.id;
    const comparison = isEquipped ? null : equipped;
    const forgeGroup = G.getFusionGroups().find((g) => g.slot.id === item.slot && g.rarity.id === item.rarity);
    const statKeys = STAT_ORDER.filter((k) => item.stats[k] || comparison?.stats[k]);
    const compareKeys = STAT_ORDER.filter((k) => item.stats[k] || comparison?.stats[k]);
    const sellValue = G.sellPrice(item);

    const statRows = statKeys.length
      ? statKeys.map((k) => `<div class="stat-line"><span>${STAT_LABELS[k]}</span><strong>${statValue(k, item.stats[k] || 0)}</strong></div>`).join('')
      : '<div class="compare-empty">No attributes.</div>';

    const compareRows = compareKeys.length
      ? compareKeys.map((k) => {
          const nextVal = item.stats[k] || 0;
          const oldVal = comparison?.stats[k] || 0;
          return `<div class="stat-line"><span>${STAT_LABELS[k]}</span><span class="compare-values">${comparison ? `<small>${statValue(k, oldVal)} → </small>` : ''}<strong>${statValue(k, nextVal)}</strong>${comparison ? compareDelta(k, item, comparison) : ''}</span></div>`;
        }).join('')
      : '<div class="compare-empty">No attributes.</div>';

    const affixHTML = item.affixes?.length
      ? item.affixes.map((affix) => `<div class="affix-box" style="--rarity:${rarity.color}">
          <div class="affix-name">${icon(affix.icon || 'i-star')} ${esc(affix.name)}</div>
          <p>${esc(affix.desc)}</p>
        </div>`).join('')
      : '';

    const equippedTitle = isEquipped ? 'Currently equipped' : comparison ? `Compared with ${comparison.name}` : 'Nothing equipped in this slot';

    const buttons = isEquipped
      ? `<button class="btn" data-action="unequip" data-slot="${item.slot}">${icon('i-arrow-up')} Unequip</button>
         <button class="btn" data-action="close">Close</button>`
      : `<button class="btn primary" data-action="equip" data-item-id="${item.id}">${icon('i-sword')} Equip</button>
         ${forgeGroup ? `<button class="btn" data-action="open-forge">${icon('i-anvil')} Forge ${forgeGroup.count}×</button>` : ''}
         <button class="btn danger" data-action="sell" data-item-id="${item.id}">Sell · ${fmt(sellValue)}g</button>`;

    setModal(`
      <div class="modal-body">
        <span class="modal-eyebrow">${esc(options.kicker || 'Relic recovered')}</span>
        <div class="item-detail-head">
          <div class="item-detail-icon" style="--rarity:${rarity.color}">${icon(slot.icon)}</div>
          <div>
            <h2 class="modal-title" id="modal-title" style="color:${rarity.color}">${esc(item.name)}</h2>
            <div class="item-detail-meta">
              <span class="tag rarity-tag">${rarity.name}</span>
              <span class="tag">${slot.name}</span>
              <span class="tag">ilvl ${item.ilvl}</span>
              <span class="tag">${item.power} power</span>
            </div>
          </div>
        </div>
        <p class="item-narrative">“${esc(item.lore)}”</p>
        <div class="modal-divider"></div>
        <div class="item-stat-layout">
          <div>
            <div class="item-stat-block">
              <h4>Attributes</h4>
              ${statRows}
            </div>
            ${affixHTML}
          </div>
          <div class="item-stat-block">
            <div class="compare-title"><h4>Comparison</h4><small>${esc(equippedTitle)}</small></div>
            ${compareRows}
            <p class="compare-summary">${isEquipped ? 'This relic is bound to you.' : comparison ? `Equipping replaces ${esc(comparison.name)}. The old relic returns to your satchel.` : 'This slot is empty. Equipping adds its full power.'}</p>
          </div>
        </div>
        <div class="modal-actions">
          ${buttons}
        </div>
        ${options.note ? `<p class="modal-note">${esc(options.note)}</p>` : ''}
        <p class="modal-note">Sell value: ${fmt(sellValue)} gold · Relic score: ${item.power}</p>
      </div>
    `);
  }

  /* ── World map ───────────────────────────────────────────── */
  function openMap() {
    if (modalOpen && els.modalShell.classList.contains('map-shell')) {
      closeModal();
      return;
    }
    const s = G.getState();
    const cards = D.ZONES.map((zone, index) => {
      const unlocked = G.zoneUnlocked(index);
      const current = index === s.currentZone;
      const prev = index > 0 ? D.ZONES[index - 1] : null;
      const progress = s.zoneProgress[zone.id];
      const previousDefeated = prev ? s.zoneProgress[prev.id]?.defeated : true;
      const levelReady = s.level >= zone.unlockLevel;
      let lockCopy = '';
      if (!unlocked) {
        if (!previousDefeated) lockCopy = `Slay ${prev.boss.name} in ${prev.name}.`;
        else if (!levelReady) lockCopy = `Reach level ${zone.unlockLevel}.`;
      }
      const status = current
        ? `<span>${icon('i-flash')} You are here</span><span>${progress.bosses} bosses</span>`
        : unlocked
          ? `<span>${icon('i-map')} Travel</span><span>${progress.bosses} bosses</span>`
          : `<span>${icon('i-lock')} Sealed</span><span>Lv. ${zone.unlockLevel}</span>`;
      return `<button class="zone-card ${current ? 'current' : ''} ${unlocked ? '' : 'locked'}" ${unlocked ? `data-action="travel" data-index="${index}"` : 'disabled'}
        style="--zone-color:${zone.color}">
        <span class="zc-num">Tier ${zone.tier} · ${progress.defeated ? 'Conquered' : 'Unclaimed'}</span>
        <span class="zc-name">${esc(zone.name)}</span>
        <span class="zc-level">Recommended level ${zone.level}</span>
        <span class="zc-desc">${esc(zone.desc)}</span>
        ${!unlocked ? `<span class="zc-lock-copy">${esc(lockCopy)}</span>` : ''}
        <span class="zc-status">${status}</span>
      </button>`;
    }).join('');

    setModal(`
      <div class="modal-body">
        <div class="map-head">
          <div>
            <span class="modal-eyebrow">The shattered realms</span>
            <h2 class="modal-title" id="modal-title">World Map</h2>
            <p class="modal-subtitle">Every fallen boss opens the road deeper into the dark. Recommended levels are a warning, not a promise.</p>
          </div>
          <div class="map-legend">
            <span><i></i> Unlocked</span>
            <span><i style="background:#6d675d"></i> Sealed</span>
          </div>
        </div>
        <div class="modal-divider"></div>
        <div class="zone-map">${cards}</div>
        <div class="modal-actions"><button class="btn" data-action="close">Return to the hunt</button></div>
      </div>
    `, 'map-shell');
  }

  /* ── Victory & offline ───────────────────────────────────── */
  function openVictory(payload) {
    if (modalOpen) { pendingVictory = payload; return; }
    const { zone, enemy, items = [], nextZone, nextZoneUnlocked, nextZoneRequirement, firstBoss } = payload;
    const loot = items.length
      ? `<div class="victory-loot-grid">${items.map((item) => `<button class="victory-loot-card" data-action="inspect" data-item-id="${item.id}" style="${itemStyle(item)}">
          <span class="item-icon">${icon(slotOf(item).icon)}</span>
          <span><strong>${esc(item.name)}</strong><span>${rarityOf(item).name} ${slotOf(item).name} · ${item.power} pwr</span></span>
        </button>`).join('')}</div>`
      : '<p class="modal-subtitle">The boss carried nothing but ash.</p>';

    let unlockHTML = '';
    if (firstBoss) {
      if (!nextZone) {
        unlockHTML = `<div class="victory-unlock">${icon('i-skull')}<p><strong>The Ashen King has fallen.</strong> The first oath is fulfilled — but the hunt is eternal. Farm any realm for Mythic relics.</p></div>`;
      } else if (nextZoneUnlocked) {
        unlockHTML = `<div class="victory-unlock">${icon('i-map')}<p><strong>${esc(nextZone.name)} unlocked.</strong> A new realm waits beyond the corpse.</p></div>`;
      } else {
        unlockHTML = `<div class="victory-unlock">${icon('i-lock')}<p><strong>${esc(nextZone.name)} lies beyond.</strong> Reach level ${nextZoneRequirement} to break the seal.</p></div>`;
      }
    }

    const actions = [];
    if (firstBoss && nextZone && nextZoneUnlocked) {
      actions.push(`<button class="btn primary" data-action="travel" data-index="${G.ZONES.indexOf(nextZone)}">${icon('i-map')} Travel to ${esc(nextZone.name)}</button>`);
    }
    actions.push('<button class="btn" data-action="close">Continue hunting</button>');

    setModal(`
      <div class="modal-body">
        <span class="modal-eyebrow">${firstBoss ? 'The realm bends the knee' : 'Boss vanquished'}</span>
        <h2 class="modal-title victory-title" id="modal-title">${esc(enemy.name)} <span style="color:#8c7e68">falls</span></h2>
        <p class="modal-subtitle">${esc(zone.name)} · The dark grows quieter for a moment.</p>
        <div class="offline-stats">
          <div class="offline-stat"><span>Gold</span><strong>+${fmt(payload.gold)}</strong></div>
          <div class="offline-stat"><span>Experience</span><strong>+${fmt(payload.xp)}</strong></div>
          <div class="offline-stat"><span>Relics</span><strong>${items.length}</strong></div>
          <div class="offline-stat"><span>Bosses</span><strong>${G.getProgress().bosses}</strong><small>this realm</small></div>
        </div>
        <div class="offline-loot"><h4>Spoils of the fallen</h4>${loot}</div>
        ${unlockHTML}
        <div class="modal-actions">${actions.join('')}</div>
      </div>
    `);
  }

  function openOffline(summary) {
    const itemChips = (summary.items || []).slice(0, 9).map((item) => `<button class="loot-mini" data-action="inspect" data-item-id="${item.id}" style="${itemStyle(item)}">${icon(slotOf(item).icon)} ${esc(item.name)}</button>`).join('');
    const levelsText = summary.levels > 0 ? `+${summary.levels}` : '—';
    setModal(`
      <div class="modal-body">
        <div class="offline-hero">
          <div class="offline-moon">${icon('i-moon')}</div>
          <div>
            <span class="modal-eyebrow">While the fire burned low</span>
            <h2 class="modal-title" id="modal-title">The oath fought on.</h2>
            <p class="modal-subtitle">Your familiar held the line in ${esc(summary.zone)} for ${formatDuration(summary.seconds)}. The dead left their treasures behind.</p>
          </div>
        </div>
        <div class="offline-stats">
          <div class="offline-stat"><span>Slain</span><strong>${fmt(summary.kills)}</strong><small>${summary.bosses} bosses</small></div>
          <div class="offline-stat"><span>Gold</span><strong>+${fmt(summary.gold)}</strong><small>earned</small></div>
          <div class="offline-stat"><span>Levels</span><strong>${levelsText}</strong><small>now level ${summary.endLevel}</small></div>
          <div class="offline-stat"><span>Relics</span><strong>${summary.items.length}</strong><small>recovered</small></div>
        </div>
        ${itemChips ? `<div class="offline-loot"><h4>Recovered relics</h4><div class="offline-loot-list">${itemChips}</div></div>` : ''}
        <div class="modal-actions">
          <button class="btn primary" data-action="close">Return to the hunt</button>
        </div>
      </div>
    `);
  }

  /* ── Help, settings, confirm ─────────────────────────────── */
  function openHelp() {
    setModal(`
      <div class="modal-body">
        <span class="modal-eyebrow">The first oath</span>
        <h2 class="modal-title" id="modal-title">How to Play</h2>
        <p class="modal-subtitle">You are the Ashen One. The world is full of things that want to keep their treasure. Take it from them.</p>
        <div class="modal-divider"></div>
        <div class="help-grid">
          <div class="help-card">
            <span class="help-icon">${icon('i-sword')}</span>
            <h4>Strike</h4>
            <p>Click the creature or press Space to attack. Critical strikes deal heavy damage. Defeat enemies for gold, XP, and relics.</p>
          </div>
          <div class="help-card">
            <span class="help-icon">${icon('i-flash')}</span>
            <h4>Bind Auto-Strike</h4>
            <p>Unlock the familiar with gold. It attacks automatically, including while you are offline, up to eight hours.</p>
          </div>
          <div class="help-card">
            <span class="help-icon">${icon('i-anvil')}</span>
            <h4>Forge</h4>
            <p>Combine three unequipped relics of the same slot and rarity into one of the next rarity. Rare relics can carry special affixes.</p>
          </div>
          <div class="help-card">
            <span class="help-icon">${icon('i-map')}</span>
            <h4>Hunt deeper</h4>
            <p>Slay 10 monsters to draw a zone boss. Defeat the boss and reach the required level to unlock the next realm.</p>
          </div>
          <div class="help-card">
            <span class="help-icon">${icon('i-skull')}</span>
            <h4>Bosses</h4>
            <p>Bosses have far more vitality, hit harder, and always drop relics. First kills unlock new zones.</p>
          </div>
          <div class="help-card">
            <span class="help-icon">${icon('i-arrow-up')}</span>
            <h4>Eternal Upgrades</h4>
            <p>Spend gold on damage, attack speed, critical chance, XP gain, and loot find. Upgrades persist forever.</p>
          </div>
        </div>
        <div class="modal-divider"></div>
        <p class="modal-subtitle"><strong style="color:#b9ab91">Shortcuts:</strong> Space — strike · M — world map · Esc — close menu. Progress saves automatically every few seconds.</p>
        <div class="modal-actions">
          <button class="btn primary" data-action="close">Begin the hunt</button>
          <button class="btn" data-action="map">${icon('i-map')} World Map</button>
        </div>
      </div>
    `, 'help-shell');
  }

  function openSettings() {
    const s = G.getState();
    const stats = G.computeStats();
    const equippedPower = D.SLOTS.reduce((sum, slot) => sum + (s.equipment[slot.id]?.power || 0), 0);
    setModal(`
      <div class="modal-body">
        <span class="modal-eyebrow">Chronicle settings</span>
        <h2 class="modal-title" id="modal-title">Settings & Records</h2>
        <p class="modal-subtitle">Your saga is stored locally in this browser. Auto-save runs every few seconds and whenever the hunt changes.</p>
        <div class="settings-stats">
          <div class="settings-stat"><span>Monsters slain</span><strong>${fmt(s.records.kills)}</strong></div>
          <div class="settings-stat"><span>Bosses felled</span><strong>${fmt(s.records.bosses)}</strong></div>
          <div class="settings-stat"><span>Relics found</span><strong>${fmt(s.records.itemsFound)}</strong></div>
          <div class="settings-stat"><span>Equipment power</span><strong>${fmt(equippedPower)}</strong></div>
        </div>
        <div class="modal-divider"></div>
        <div class="settings-grid">
          <div class="setting-row">
            ${icon(s.settings.sound ? 'i-sound-on' : 'i-sound-off')}
            <div class="setting-copy"><strong>Sound effects</strong><span>Soft strikes, chimes, and forge tones.</span></div>
            <button class="btn" data-action="toggle-sound">${s.settings.sound ? 'Mute' : 'Enable'}</button>
          </div>
          <div class="setting-row">
            ${icon('i-flash')}
            <div class="setting-copy"><strong>Combat rhythm</strong><span>${s.autoStrike ? (s.autoEnabled ? `Auto-Strike every ${stats.interval.toFixed(2)}s` : 'Auto-Strike paused') : 'Auto-Strike not yet bound'}</span></div>
            <button class="btn" data-action="map">${icon('i-map')} Map</button>
          </div>
          <div class="setting-row">
            ${icon('i-shield')}
            <div class="setting-copy"><strong>Save now</strong><span>Last saved ${refreshLabel((Date.now() - s.lastSeen) / 1000)}.</span></div>
            <button class="btn" data-action="save-now">Save</button>
          </div>
        </div>
        <div class="reset-zone">
          <h4>Dangerous ground</h4>
          <p>Reset all progress and begin a new saga. There is no recovery.</p>
          <button class="btn danger" data-action="open-reset">${icon('i-reset')} Reset Progress</button>
        </div>
        <div class="modal-actions">
          <button class="btn" data-action="help">${icon('i-help')} How to Play</button>
          <button class="btn primary" data-action="close">Close</button>
        </div>
      </div>
    `);
  }

  function openConfirm({ title, text, action, label, danger }) {
    setModal(`
      <div class="modal-body">
        <span class="modal-eyebrow">A final word</span>
        <h2 class="modal-title" id="modal-title">${esc(title)}</h2>
        <p class="modal-subtitle">${esc(text)}</p>
        <div class="modal-actions confirm-actions">
          <button class="btn" data-action="close">Cancel</button>
          <button class="btn ${danger ? 'danger' : 'primary'}" data-action="${action}">${esc(label)}</button>
        </div>
      </div>
    `);
  }

  /* ── Boot ────────────────────────────────────────────────── */
  function cacheElements() {
    els = {
      gold: $('gold-value'), kills: $('kills-value'), headerLevel: $('header-level'),
      heroLevel: $('hero-level'), heroLevelBadge: $('hero-level-badge'), xpFill: $('xp-fill'), xpText: $('xp-text'),
      heroHpFill: $('hero-hp-fill'), heroHpText: $('hero-hp-text'), heroHpBar: document.querySelector('.hero-vitals .hp-bar'),
      statAttack: $('stat-attack'), statCrit: $('stat-crit'), statArmor: $('stat-armor'), statDps: $('stat-dps'),
      powerValue: $('power-value'), autoDpsValue: $('auto-dps-value'),
      equipmentGrid: $('equipment-grid'), heroPanel: document.querySelector('.hero-panel'),
      zoneName: $('zone-name'), zoneDesc: $('zone-desc'), zoneTier: $('zone-tier'), zoneStatus: $('zone-status'), zoneEmblem: $('zone-emblem'),
      bossProgressFill: $('boss-progress-fill'), bossTrackText: $('boss-track-text'), bossTrackPips: $('boss-track-pips'),
      arena: $('arena'), arenaDifficulty: $('arena-difficulty'), arenaKillstreak: $('arena-killstreak'),
      enemyWrap: $('enemy-wrap'), enemyArt: $('enemy-art'), enemyName: $('enemy-name'), enemyRank: $('enemy-rank'),
      enemyBossChip: $('enemy-boss-chip'), enemyGoldReward: $('enemy-gold-reward'), enemyXpReward: $('enemy-xp-reward'),
      enemyHpFill: $('enemy-hp-fill'), enemyHpText: $('enemy-hp-text'), enemyHpPercent: $('enemy-hp-percent'), enemyHpBar: document.querySelector('.enemy-hp-bar'),
      enemyTrait: $('enemy-trait'), fxLayer: $('fx-layer'), combatBanner: $('combat-banner'), clickHint: $('click-hint'),
      autoBtn: $('auto-btn'), autoStatus: $('auto-status'), autoCopy: document.querySelector('.auto-copy'), strikeBtn: $('strike-btn'),
      combatLog: $('combat-log'),
      inventoryCount: $('inventory-count'), inventoryTabCount: $('inventory-tab-count'), inventoryGrid: $('inventory-grid'),
      inventoryEmpty: $('inventory-empty'), sortSelect: $('sort-select'), sellCommonsBtn: $('sell-commons-btn'),
      forgeGroups: $('forge-groups'), forgeEmpty: $('forge-empty'), forgeReadyBadge: $('forge-ready-badge'), rarityChain: $('rarity-chain'),
      upgradeGold: $('upgrade-gold'), upSummaryDamage: $('up-summary-damage'), upSummarySpeed: $('up-summary-speed'), upSummaryFortune: $('up-summary-fortune'),
      upgradeList: $('upgrade-list'),
      sidePanel: document.querySelector('.side-panel'),
      toastStack: $('toast-stack'),
      modalBackdrop: $('modal-backdrop'), modalShell: $('modal-shell'), modalContent: $('modal-content'), modalClose: $('modal-close'),
      saveState: $('save-state')
    };
  }

  function init() {
    cacheElements();
    bindEvents();
    els.sortSelect.value = inventorySort;
    const boot = G.init(hooks);
    renderAll('boot');
    renderLog(G.getLogs());
    renderSound(G.getState());
    updateSaveLabel();
    setTab('inventory');

    if (boot.offline) {
      setTimeout(() => openOffline(boot.offline), 650);
    } else if (!boot.hadSave) {
      setTimeout(() => {
        showToast({
          kicker: 'A new oath is sworn',
          title: 'Click the creature to strike',
          sub: 'Unlock Auto-Strike with gold, then delve deeper.',
          color: '#d2ab62',
          iconName: 'i-sword',
          life: 5000
        });
      }, 450);
    }
  }

  init();
})();
