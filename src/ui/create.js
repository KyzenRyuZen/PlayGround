// Character creation: faction, class, appearance and identity.
import { t, tx, icon, esc, showModal, closeModal } from './common.js';
import { CLASSES, CLASS_IDS, CLASS_ICON, FACTION_BONUS, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, OUTFITS, RANDOM_NAMES } from '../data/classes.js';
import { newPlayer, randomHeroName } from '../core/game.js';
import { renderHero } from './heroArt.js';

function makeState(screen) {
  const faction = 'angel';
  return {
    faction,
    gender: 'female',
    classId: 'warrior',
    hair: 2,
    hairColor: 'silver',
    eyeColor: 'sapphire',
    outfit: 1,
    name: randomHeroName('angel'),
  };
}

export function renderCreate(screen) {
  const state = makeState(screen);
  const screenEl = document.getElementById('screen');

  const paint = () => {
    cancelAnimationFrame(paint.raf);
    screenEl.innerHTML = `<div class="create-screen">
      <div class="create-head">
        <button class="back" data-create-back aria-label="${esc(t('common.back'))}">${icon('back')}</button>
        <div class="ch-title">
          <h1>${esc(t('create.title'))}</h1>
          <p>${esc(t('create.sub'))}</p>
        </div>
        <div class="cpm-badge">${esc(t('menu.version'))}</div>
      </div>
      <div class="create-scroll scroll">
        <div class="create-preview">
          <canvas id="createHeroCanvas"></canvas>
          <div class="create-preview-meta">
            <div><h2 id="createNamePreview">${esc(state.name || '—')}</h2><p>${esc(tx(CLASSES[state.classId].name))} · ${esc(t(`faction.${state.faction}`))}</p></div>
            <span class="cpm-badge">${esc(t(`create.${state.faction}Bonus`))}</span>
          </div>
        </div>

        <div class="create-step"><span class="num">1</span><h3>${esc(t('create.faction'))}</h3></div>
        <div class="faction-row">
          ${['angel', 'demon'].map((f) => `
            <button class="faction-card ${f}${state.faction === f ? ' on' : ''}" data-faction="${f}">
              <div class="fc-glyph">${icon(f === 'angel' ? 'spark' : 'flame')}</div>
              <h4>${esc(t(`create.${f}`))}</h4>
              <p>${esc(t(`create.${f}Desc`))}</p>
              <div class="fc-bonus">${esc(t('create.factionBonus'))}: ${esc(t(`create.${f}Bonus`))}</div>
            </button>`).join('')}
        </div>

        <div class="create-step"><span class="num">2</span><h3>${esc(t('create.class'))}</h3></div>
        <div class="class-row">
          ${CLASS_IDS.map((id) => {
            const c = CLASSES[id];
            return `<button class="class-card${state.classId === id ? ' on' : ''}" data-class="${id}" style="--cc:${c.color}">
              <span class="cc-icon">${icon(CLASS_ICON[id])}</span>
              <div>
                <h4>${esc(tx(c.name))}</h4>
                <div class="cc-role">${esc(t(`create.${id}Role`))}</div>
                <div class="cc-desc">${esc(t(`create.${id}Desc`))}</div>
              </div>
              <span class="cc-check">${icon('check')}</span>
            </button>`;
          }).join('')}
        </div>

        <div class="create-step"><span class="num">3</span><h3>${esc(t('create.appearance'))}</h3></div>
        <div class="appearance-grid">
          <div>
            <div class="field-label">${esc(t('common.gender'))}</div>
            <div class="seg-row">
              <button data-gender="female" class="${state.gender === 'female' ? 'on' : ''}">${icon('user')}<span>${esc(t('common.female'))}</span></button>
              <button data-gender="male" class="${state.gender === 'male' ? 'on' : ''}">${icon('user')}<span>${esc(t('common.male'))}</span></button>
            </div>
          </div>
          <div>
            <div class="field-label">${esc(t('common.hair'))}</div>
            <div class="wig-grid">
              ${HAIR_STYLES.map((h) => `<button class="wig-option${state.hair === h.id ? ' on' : ''}" data-hair="${h.id}" title="${esc(tx(h.name))}">${h.id}</button>`).join('')}
            </div>
          </div>
          <div>
            <div class="field-label">${esc(t('common.hairColor'))}</div>
            <div class="swatches">
              ${HAIR_COLORS.map((c) => `<button class="swatch-btn${state.hairColor === c.id ? ' on' : ''}" data-haircolor="${c.id}" title="${esc(tx(c.name))}" style="background:${c.hex}"></button>`).join('')}
            </div>
          </div>
          <div>
            <div class="field-label">${esc(t('common.eyeColor'))}</div>
            <div class="swatches">
              ${EYE_COLORS.map((c) => `<button class="swatch-btn${state.eyeColor === c.id ? ' on' : ''}" data-eyecolor="${c.id}" title="${esc(tx(c.name))}" style="background:${c.hex}"></button>`).join('')}
            </div>
          </div>
          <div>
            <div class="field-label">${esc(t('common.outfit'))}</div>
            <div class="outfit-row">
              ${OUTFITS.map((o) => {
                const colors = o[state.faction];
                return `<button class="outfit-option${state.outfit === o.id ? ' on' : ''}" data-outfit="${o.id}">
                  <div class="oo-swatch">${colors.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
                  <span>${esc(t(`create.outfit${o.id}`))}</span>
                </button>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="create-step"><span class="num">4</span><h3>${esc(t('create.identity'))}</h3></div>
        <div class="name-field">
          <input id="heroNameInput" maxlength="16" autocomplete="off" spellcheck="false" placeholder="${esc(t('create.namePlaceholder'))}" value="${esc(state.name)}" />
          <button class="dice-btn" data-random-name title="${esc(t('create.randomName'))}">${icon('spark')}</button>
        </div>
        <div class="name-hint">${esc(t('create.nameHint'))}</div>
        <div class="name-error" id="nameError"></div>
        <p class="hint" style="margin-top:6px">${esc(t('create.wingNote'))}</p>
      </div>
      <div class="create-foot">
        <button class="btn primary" data-create-start>${icon('spark')}<span>${esc(t('create.start'))}</span></button>
        <div class="foot-hint">${esc(t('menu.madeFor'))}</div>
      </div>
    </div>`;

    bind();
    startPreview();
  };

  const bind = () => {
    screenEl.querySelector('[data-create-back]')?.addEventListener('click', () => screen.refreshMenu());

    screenEl.querySelectorAll('[data-faction]').forEach((btn) => btn.addEventListener('click', () => {
      state.faction = btn.dataset.faction;
      state.name = randomHeroName(state.faction);
      paint();
    }));
    screenEl.querySelectorAll('[data-class]').forEach((btn) => btn.addEventListener('click', () => {
      state.classId = btn.dataset.class;
      paint();
    }));
    screenEl.querySelectorAll('[data-gender]').forEach((btn) => btn.addEventListener('click', () => {
      state.gender = btn.dataset.gender;
      paint();
    }));
    screenEl.querySelectorAll('[data-hair]').forEach((btn) => btn.addEventListener('click', () => {
      state.hair = Number(btn.dataset.hair);
      paint();
    }));
    screenEl.querySelectorAll('[data-haircolor]').forEach((btn) => btn.addEventListener('click', () => {
      state.hairColor = btn.dataset.haircolor;
      paint();
    }));
    screenEl.querySelectorAll('[data-eyecolor]').forEach((btn) => btn.addEventListener('click', () => {
      state.eyeColor = btn.dataset.eyecolor;
      paint();
    }));
    screenEl.querySelectorAll('[data-outfit]').forEach((btn) => btn.addEventListener('click', () => {
      state.outfit = Number(btn.dataset.outfit);
      paint();
    }));

    const input = screenEl.querySelector('#heroNameInput');
    input?.addEventListener('input', () => {
      state.name = input.value;
      const preview = screenEl.querySelector('#createNamePreview');
      if (preview) preview.textContent = state.name || '—';
      const err = screenEl.querySelector('#nameError');
      if (err) err.textContent = '';
    });
    screenEl.querySelector('[data-random-name]')?.addEventListener('click', () => {
      state.name = randomHeroName(state.faction);
      if (input) input.value = state.name;
      const preview = screenEl.querySelector('#createNamePreview');
      if (preview) preview.textContent = state.name;
    });

    screenEl.querySelector('[data-create-start]')?.addEventListener('click', finish);
  };

  const previewPlayer = () => ({
    ...state,
    classId: state.classId,
    wing: null,
    fx: null,
    costumeColors: null,
  });

  const startPreview = () => {
    const canvas = screenEl.querySelector('#createHeroCanvas');
    if (!canvas) return;
    const started = performance.now();
    const draw = (now) => {
      if (!canvas.isConnected) return;
      renderHero(canvas, previewPlayer(), (now - started) / 1000, { zoom: 1.04 });
      paint.raf = requestAnimationFrame(draw);
    };
    paint.raf = requestAnimationFrame(draw);
  };

  const finish = () => {
    const name = state.name.trim();
    const err = screenEl.querySelector('#nameError');
    if (name.length < 2 || name.length > 16) {
      if (err) err.textContent = t('create.requiredName');
      return;
    }
    const player = newPlayer({ ...state, name });
    const body = `<p class="confirm-text">${esc(t('create.confirmText', {
      name: esc(name),
      class: esc(tx(CLASSES[state.classId].name)),
      faction: esc(t(`faction.${state.faction}`)),
    }))}</p>
    <div class="divider"></div>
    <div class="stat-list">
      <div class="stat-row"><span>${esc(t('common.class'))}</span><b>${esc(tx(CLASSES[state.classId].name))}</b></div>
      <div class="stat-row"><span>${esc(t('create.factionBonus'))}</span><b>${esc(t(`create.${state.faction}Bonus`))}</b></div>
      <div class="stat-row"><span>${esc(t('common.hp'))}</span><b>${Math.round(player.stats.maxHp)}</b></div>
      <div class="stat-row"><span>${esc(t('common.attack'))}</span><b>${Math.round(player.stats.attack)}</b></div>
    </div>`;
    const wrap = showModal({
      title: t('create.confirmTitle'),
      body,
      foot: `<button class="btn ghost" data-modal-close>${esc(t('common.cancel'))}</button>
             <button class="btn primary" data-confirm-create>${esc(t('create.start'))}</button>`,
    });
    wrap?.querySelector('[data-confirm-create]')?.addEventListener('click', () => {
      closeModal();
      cancelAnimationFrame(paint.raf);
      screen.startGame(player);
    });
  };

  paint();
  return () => cancelAnimationFrame(paint.raf);
}
