import { setLang } from './i18n.js';

const SETTINGS_KEY = 'aetheria_settings_v1';
const SAVE_KEY = 'aetheria_save_v1';

export const DEFAULT_SETTINGS = {
  lang: 'de',
  music: true,
  sfx: true,
  quality: 'high',
  reduceMotion: false,
  joystickSide: 'left',
  haptics: true,
  tutorialDone: false,
  lastDaily: null,
};

export function loadSettings() {
  let s = { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) s = { ...s, ...JSON.parse(raw) };
  } catch {}
  if (s.lang !== 'de' && s.lang !== 'en') s.lang = 'de';
  setLang(s.lang);
  return s;
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.player || data.version !== 1) return null;
    return data;
  } catch { return null; }
}

let saveTimer = null;
export function saveGame(game, immediate = false) {
  if (!game || !game.player) return;
  const write = () => {
    try {
      game.savedAt = Date.now();
      const data = {
        version: 1,
        savedAt: game.savedAt,
        createdAt: game.createdAt,
        settings: { lang: game.settings?.lang ?? 'de' },
        player: game.player,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Save failed', e);
      return false;
    }
  };
  if (immediate) { clearTimeout(saveTimer); return write(); }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(write, 450);
  return true;
}

export function deleteGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

export function hasSave() { return Boolean(loadGame()); }
