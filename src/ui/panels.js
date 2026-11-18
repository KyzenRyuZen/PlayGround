// Panel orchestration, journal drawer, settings, NPC dialogue and item details.
import {
  t, tx, icon, esc, fmt, toast, showModal, closeModal, confirmDialog,
  currencyRow, panelShell, settingsBody, bindSettings, formatPlaytime,
} from './common.js';
import { CLASSES } from '../data/classes.js';
import { getZone, ZONES } from '../data/zones.js';
import { QUESTS } from '../data/quests.js';
import { deleteGame, saveSettings } from '../core/save.js';
import {
  App, currentZone, saveNow, canEquip, equipItem, unequipItem, sellItem, sellValue,
  salvageEssence, addEssence, fuseItem, recalc, applyCosmetic, removeItem,
  INVENTORY_SIZE, STORAGE_SIZE,
} from '../core/game.js';
import { itemName } from '../data/items.js';
import { itemCardHTML, itemCellHTML, itemLabel, itemRarity } from './panelKit.js';
import { characterView, inventoryView, mountsView, wardrobeView, storageView } from './panels/character.js';
import { questsView, worldView } from './panels/quests.js';
import { shopView, merchantView } from './panels/shop.js';
import { forgeView } from './panels/forge.js';
import { tradeView, attachTrade, detachTrade } from './panels/trade.js';

const VIEWS = {
  character: characterView,
  inventory: inventoryView,
  mounts: mountsView,
  wardrobe: wardrobeView,
  storage: storageView,
  quests: questsView,
  world: worldView,
  shop: shopView,
  merchant: merchantView,
  forge: forgeView,
  trade: tradeView,
};

export class Panels {
  constructor(screen) {
    this.screen = screen;
    this.current = null;
    this.state = {};
    this.cleanups = [];
    this.merchantStock = null;
    this.selectedUid = null;
    this.itemSource = 'bag';
    this.attachTrade();
  }

  get player() { return this.screen.game?.player ?? null; }
  get game() { return this.screen.game ?? null; }

  attachTrade() {
    attachTrade(this);
  }

  removeCleanups() {
    for (const fn of this.cleanups.splice(0)) {
      try { fn(); } catch (error) { console.warn('Panel cleanup failed', error); }
    }
  }

  open(name, opts = {}) {
    const overlay = document.getElementById('overlay');
    if (!overlay) return null;
    closeModal();
    this.removeCleanups();
    if (this.current === 'menu' && name === 'menu') {
      // Re-rendering the drawer keeps its scroll and state intact.
    }
    this.current = name;
    this.state = { ...this.state, ...opts };
    overlay.innerHTML = '';

    if (name === 'menu') {
      overlay.innerHTML = this.menuHTML();
      this.screen.engine?.setPaused(true);
      this.bindMenu(overlay);
      return overlay;
    }
    if (name === 'settings') {
      this.renderSettings(overlay);
      return overlay;
    }
    if (name === 'dialogue') {
      this.renderDialogue(overlay, this.state.npc);
      return overlay;
    }

    const viewFn = VIEWS[name];
    if (!viewFn) {
      console.warn('Unknown panel', name);
      return null;
    }
    const view = viewFn(this) ?? {};
    const tabs = (view.tabs ?? []).map((tab) => ({
      ...tab,
      on: tab.id === this.state.tab,
    }));
    overlay.innerHTML = panelShell(view.title ?? '', view.subtitle ?? '', view.body ?? '', {
      tabs: tabs.length ? tabs : null,
      foot: view.foot ?? '',
      resources: view.resources !== false,
    });
    this.screen.engine?.setPaused(true);

    const panel = overlay.querySelector('.panel');
    panel?.classList.add('fade-in');
    overlay.querySelector('[data-panel-back]')?.addEventListener('click', () => {
      if (view.onBack) view.onBack();
      else this.close();
    });
    overlay.querySelector('[data-panel-close]')?.addEventListener('click', () => this.close());
    overlay.querySelector('[data-panel-backdrop]')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) this.close();
    });
    overlay.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (view.onTab) view.onTab(tab);
        else {
          this.state.tab = tab;
          this.refresh({ tab });
        }
      });
    });
    view.mount?.(overlay, this);
    return overlay;
  }

  refresh(opts = {}) {
    if (!this.current) return;
    const name = this.current;
    const state = { ...this.state, ...opts };
    this.open(name, state);
  }

  close({ resume = true } = {}) {
    this.removeCleanups();
    closeModal();
    const overlay = document.getElementById('overlay');
    if (overlay && this.current !== 'menu') overlay.innerHTML = '';
    if (overlay && this.current === 'menu') overlay.innerHTML = '';
    this.current = null;
    if (resume) this.screen.engine?.setPaused(false);
  }

  dispose() {
    this.current = null;
    this.removeCleanups();
    detachTrade(this);
    closeModal();
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.innerHTML = '';
    this.screen.engine?.setPaused(false);
  }

  isOpen(name) { return this.current === name; }

  openDialogue(npc) {
    if (!npc) return;
    this.state.npc = npc;
    this.open('dialogue', { npc });
  }

  // ── journal drawer ───────────────────────────────────────────────────────
  menuHTML() {
    const p = this.player;
    if (!p) return '';
    const cls = CLASSES[p.classId];
    const zone = currentZone(p);
    const tradeOn = this.screen.tradeClient?.state === 'online';
    const tile = (name, iconName, title, sub, cls2 = '') =>
      `<button class="menu-tile ${cls2}" data-open="${name}">${icon(iconName)}<b>${esc(title)}</b><span>${esc(sub)}</span></button>`;
    return `<div class="drawer-backdrop" data-drawer-backdrop>
      <div class="drawer">
        <div class="drawer-head">
          <div>
            <div class="eyebrow">${esc(t('menu.panelTitle'))}</div>
            <div class="drawer-name">${esc(p.name)}</div>
            <div class="drawer-sub">${esc(t('common.lv'))} ${p.level} · ${esc(tx(cls.name))} · ${esc(t(zone.key))}</div>
          </div>
          <button class="icon-btn" data-drawer-close aria-label="${esc(t('common.close'))}">${icon('close')}</button>
        </div>
        <div class="drawer-scroll scroll">
          <div class="currency-row" style="margin-bottom:12px">
            ${currencyRow(p)}<span class="chip gold" style="margin-left:auto">${icon('crown')} ${fmt(p.stats?.power ?? 0)}</span>
          </div>
          <div class="menu-grid">
            ${tile('character', 'user', t('menu.character'), `${t('char.power')} ${fmt(p.stats?.power ?? 0)}`, 'primary')}
            ${tile('inventory', 'bag', t('menu.inventory'), t('inv.slots', { used: p.inventory.length, max: INVENTORY_SIZE }))}
            ${tile('quests', 'quest', t('menu.quests'), `${p.questsDone ?? 0} ${t('common.done')}`, 'primary')}
            ${tile('world', 'map', t('menu.world'), t('world.subtitle'))}
            ${tile('shop', 'shop', t('menu.shop'), t('store.subtitle'))}
            ${tile('forge', 'anvil', t('menu.blacksmith'), t('smith.subtitle'))}
            ${tile('storage', 'storage', t('menu.storage'), t('storage.subtitle'))}
            ${tile('mounts', 'mount', t('menu.mounts'), t('mount.subtitle'))}
            ${tile('wardrobe', 'costume', t('menu.wardrobe'), t('store.wardrobeHint'))}
            ${tile('trade', 'trade', t('menu.trade'), tradeOn ? t('common.online') : t('common.serverRequired'), tradeOn ? 'trade-on' : '')}
          </div>
          <div class="drawer-foot">
            <button class="mini-btn" data-open="settings">${icon('settings')}<span>${esc(t('menu.settings'))}</span></button>
            <button class="mini-btn" data-menu-save>${icon('crown')}<span>${esc(t('common.save'))} · ${esc(t('hud.autosave'))}</span></button>
            <button class="mini-btn" data-menu-quit>${icon('portal')}<span>${esc(t('menu.returnMenu'))}</span></button>
            <button class="mini-btn danger" data-menu-delete>${icon('trash')}<span>${esc(t('menu.deleteSave'))}</span></button>
          </div>
          <p class="hint" style="margin-top:12px">${esc(t('tips.2'))}</p>
        </div>
      </div>
    </div>`;
  }

  bindMenu(overlay) {
    overlay.querySelector('[data-drawer-backdrop]')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) this.close();
    });
    overlay.querySelector('[data-drawer-close]')?.addEventListener('click', () => this.close());
    overlay.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.screen.audio?.play('ui');
        this.open(btn.dataset.open);
      });
    });
    overlay.querySelector('[data-menu-save]')?.addEventListener('click', () => {
      saveNow(true);
      toast(t('common.saved'), 'good');
    });
    overlay.querySelector('[data-menu-quit]')?.addEventListener('click', () => {
      this.close({ resume: false });
      this.screen.goMenu();
    });
    overlay.querySelector('[data-menu-delete]')?.addEventListener('click', () => {
      confirmDialog(t('settings.resetTitle'), t('settings.resetText'), () => {
        this.close({ resume: false });
        this.screen.resetToMenu();
      }, { danger: true, confirmLabel: t('settings.resetBtn') });
    });
  }

  // ── settings ─────────────────────────────────────────────────────────────
  renderSettings(overlay) {
    const settings = this.screen.settings;
    overlay.innerHTML = panelShell(t('settings.title'), t('settings.accountHint'), settingsBody(settings, this.player), {
      resources: false,
    });
    this.screen.engine?.setPaused(true);
    overlay.querySelector('[data-panel-back]')?.addEventListener('click', () => this.close());
    overlay.querySelector('[data-panel-close]')?.addEventListener('click', () => this.close());
    overlay.querySelector('[data-panel-backdrop]')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) this.close();
    });
    bindSettings(overlay, {
      settings,
      onChange: (s) => {
        document.body.classList.toggle('reduce-motion', Boolean(s.reduceMotion));
        saveSettings(s);
      },
      onAudio: (s) => this.screen.audio?.setSettings(s),
      onLanguage: () => {
        saveSettings(settings);
        this.close({ resume: false });
        this.screen.applyLanguage();
      },
      onReset: () => {
        this.close({ resume: false });
        this.screen.resetToMenu();
      },
    });
  }

  // ── dialogue ─────────────────────────────────────────────────────────────
  renderDialogue(overlay, npc) {
    if (!npc || !this.player) return;
    const p = this.player;
    const roleIcon = npc.role === 'forge' ? 'anvil' : npc.role === 'shop' ? 'shop' : 'book';
    const line = npc.lines?.length ? tx(npc.lines[Math.floor(Math.random() * npc.lines.length)]) : t(npc.greeting ?? 'npc.dialogue1');
    const text = String(line).replaceAll('{name}', p.name);
    const quests = QUESTS.filter((q) => q.zone === p.zoneId && (q.npc === npc.id || (!q.npc && q.story)));
    const ready = quests.filter((q) => p.quests[q.id]?.state === 'done').length;
    const available = quests.filter((q) => !p.quests[q.id]).length;
    const actions = [];
    if (npc.actions?.includes('quests') || quests.length) {
      actions.push(`<button class="btn primary" data-dlg="quests">${icon('quest')} ${esc(t('menu.quests'))}${ready ? ` · ${ready}` : available ? ` · ${available}` : ''}</button>`);
    }
    if (npc.actions?.includes('forge')) actions.push(`<button class="btn" data-dlg="forge">${icon('anvil')} ${esc(t('smith.title'))}</button>`);
    if (npc.actions?.includes('fusion')) actions.push(`<button class="btn" data-dlg="fusion">${icon('swap')} ${esc(t('menu.fusion'))}</button>`);
    if (npc.actions?.includes('shop')) actions.push(`<button class="btn" data-dlg="merchant">${icon('shop')} ${esc(t('merchant.title'))}</button>`);
    actions.push(`<button class="btn ghost" data-dlg="leave">${esc(t('npc.goodbye'))}</button>`);

    overlay.innerHTML = `<div class="dialogue">
      <div class="dialogue-inner">
        <div class="dialogue-head">
          <div class="npc-portrait">${icon(roleIcon)}</div>
          <div>
            <h3>${esc(t(npc.nameKey))}</h3>
            <div class="npc-title">${esc(tx(npc.title))}</div>
          </div>
          <button class="dialogue-close" data-dlg="leave" aria-label="${esc(t('common.close'))}">${icon('close')}</button>
        </div>
        <div class="dialogue-text">${esc(text)}</div>
        ${quests.length ? `<div class="dialogue-quest">
          <b>${esc(t(ready ? 'quest.ready' : 'quest.available'))}</b>
          ${esc(quests.map((q) => tx(q.name)).join(' · '))}
        </div>` : ''}
        <div class="dialogue-actions">${actions.join('')}</div>
      </div>
    </div>`;
    this.screen.engine?.setPaused(true);
    overlay.querySelectorAll('[data-dlg]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.dlg;
        this.screen.audio?.play('ui');
        if (action === 'leave') this.close();
        else if (action === 'quests') this.open('quests');
        else if (action === 'forge') this.open('forge');
        else if (action === 'fusion') this.open('forge', { tab: 'fusion' });
        else if (action === 'merchant') this.open('merchant');
      });
    });
  }

  // ── item details ──────────────────────────────────────────────────────────
  findItem(uid, source) {
    const p = this.player;
    if (!p || !uid) return null;
    if (source === 'storage') return p.storage.find((x) => x.uid === uid) ?? null;
    if (source === 'equip') return Object.values(p.equipment).find((x) => x?.uid === uid) ?? null;
    return p.inventory.find((x) => x.uid === uid) ?? null;
  }

  openItem(uid, source = 'bag') {
    const item = this.findItem(uid, source);
    if (!item) return;
    this.selectedUid = uid;
    this.itemSource = source;
    const p = this.player;
    const compare = item.kind === 'equip' && source === 'bag' ? p.equipment?.[item.slot] ?? null : null;
    const actions = this.itemActionsHTML(item, source);
    const wrap = showModal({
      title: t('inv.itemDetail'),
      body: itemCardHTML(item, { actions, compare }),
      className: 'item-modal',
      foot: `<button class="btn ghost wide" data-modal-close>${esc(t('common.close'))}</button>`,
    });
    wrap?.querySelectorAll('[data-item-act]').forEach((btn) => {
      btn.addEventListener('click', () => this.doItemAction(btn.dataset.itemAct, item, source));
    });
  }

  itemActionsHTML(item, source) {
    const p = this.player;
    const buttons = [];
    if (source === 'storage') {
      buttons.push(`<button class="btn primary" data-item-act="withdraw">${esc(t('storage.withdraw'))}</button>`);
      return buttons.join('');
    }
    if (source === 'equip') {
      buttons.push(`<button class="btn primary" data-item-act="unequip">${esc(t('common.unequip'))}</button>`);
      return buttons.join('');
    }
    if (item.kind === 'equip') {
      const check = canEquip(p, item);
      buttons.push(check.ok
        ? `<button class="btn primary" data-item-act="equip">${esc(t('common.equip'))}</button>`
        : `<button class="btn primary" disabled>${check.reason === 'class' ? esc(t('common.wrongClass')) : esc(t('common.levelTooLow'))}</button>`);
      const dupes = p.inventory.filter((x) => x.kind === 'equip' && x.key === item.key).length;
      if (dupes >= 4) buttons.push(`<button class="btn" data-item-act="fuse">${esc(t('inv.fuse'))}</button>`);
      buttons.push(`<button class="btn ghost" data-item-act="salvage">${esc(t('smith.salvage'))}</button>`);
    }
    if (item.kind === 'consumable') {
      buttons.push(`<button class="btn primary" data-item-act="use">${esc(t('item.use'))}</button>`);
    }
    if (item.kind === 'wing') {
      buttons.push(`<button class="btn primary" data-item-act="apply-wing">${esc(t('common.equip'))}</button>`);
    }
    if (item.kind === 'stone') {
      const active = p.activeStone === item.uid;
      buttons.push(`<button class="btn primary" data-item-act="activate-stone">${esc(t(active ? 'stone.deactivated' : 'stone.activated'))}</button>`);
    }
    if (item.tradeable !== false && item.kind !== 'stone' && item.kind !== 'wing') {
      buttons.push(`<button class="btn ghost" data-item-act="sell">${esc(t('common.sell'))} · ${fmt(sellValue(item))}g</button>`);
    }
    buttons.push(`<button class="btn ghost" data-item-act="storage">${esc(t('inv.moveToStorage'))}</button>`);
    return buttons.join('');
  }

  doItemAction(action, item, source) {
    const p = this.player;
    let message = '';
    let kind = 'good';
    if (action === 'equip') {
      const result = equipItem(p, item);
      if (!result.ok) {
        message = result.reason === 'class' ? t('common.wrongClass') : result.reason === 'level' ? t('toast.notEnoughLevel', { lv: item.reqLevel }) : t('toast.needTarget');
        kind = 'bad';
      } else message = t('toast.itemEquipped', { item: itemName(item) });
    } else if (action === 'unequip') {
      const result = unequipItem(p, item.slot);
      if (result?.ok === false) { message = t('common.inventoryFull'); kind = 'bad'; }
      else message = t('common.unequip');
    } else if (action === 'use') {
      if (this.screen.engine?.useConsumableItem(item)) message = t('item.use');
    } else if (action === 'sell') {
      const gold = sellItem(p, item);
      message = t('merchant.sold', { n: gold });
    } else if (action === 'salvage') {
      const essence = salvageEssence(item);
      removeItem(p, item);
      addEssence(p, essence);
      message = t('smith.salvaged', { n: essence });
    } else if (action === 'fuse') {
      const result = fuseItem(p, item);
      if (result) message = t('inv.fuseSuccess', { item: itemName(result) });
      else { message = t('toast.fusionNo'); kind = 'bad'; }
    } else if (action === 'apply-wing') {
      applyCosmetic(p, 'wing', item.id);
      message = t('wardrobe.applied');
    } else if (action === 'activate-stone') {
      p.activeStone = p.activeStone === item.uid ? null : item.uid;
      recalc(p);
      message = t(p.activeStone ? 'stone.activated' : 'stone.deactivated');
    } else if (action === 'storage') {
      if (p.storage.length >= STORAGE_SIZE) { message = t('common.storageFull'); kind = 'bad'; }
      else {
        const idx = p.inventory.findIndex((x) => x.uid === item.uid);
        if (idx >= 0) {
          p.inventory.splice(idx, 1);
          p.storage.push(item);
          message = t('storage.deposit');
        }
      }
    } else if (action === 'withdraw') {
      if (p.inventory.length >= INVENTORY_SIZE) { message = t('common.inventoryFull'); kind = 'bad'; }
      else {
        const idx = p.storage.findIndex((x) => x.uid === item.uid);
        if (idx >= 0) {
          p.storage.splice(idx, 1);
          p.inventory.push(item);
          message = t('storage.withdraw');
        }
      }
    }
    if (message) toast(message, kind);
    closeModal();
    saveNow();
    this.screen.hud?.refresh();
    if (this.current && this.current !== 'menu') this.refresh();
  }
}

// Keep the exported singleton import graph obvious for tooling.
export { ZONES, getZone, formatPlaytime, itemCellHTML, itemLabel, itemRarity, App };
