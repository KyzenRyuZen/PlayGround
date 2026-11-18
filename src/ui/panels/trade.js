// Player trading over a real WebSocket server. No simulated players: every
// listing, invite and offer in this panel comes from the connected server.
import { t, icon, esc, toast, showModal } from '../common.js';
import { saveSettings } from '../../core/save.js';
import { saveNow, removeItem, addItem } from '../../core/game.js';
import { itemCellHTML, itemLabel } from '../panelKit.js';
import { uid } from '../../core/utils.js';

const TOKEN_KEY = 'aetheria_trade_token';
const PICKER_LIMIT = 12;

function defaultUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.hostname}:8787`;
}

function savedUrl(panel) {
  return panel.screen.settings.tradeUrl || defaultUrl();
}

function tradeToken() {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = globalThis.crypto?.randomUUID?.() ?? `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    return `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }
}

function identity(panel) {
  const p = panel.player;
  return {
    name: p?.name ?? 'Wanderer',
    classId: p?.classId ?? 'warrior',
    level: p?.level ?? 1,
    zoneId: p?.zoneId ?? 'greendale',
    token: tradeToken(),
  };
}

function isTradeable(item) {
  return Boolean(item)
    && item.tradeable !== false
    && item.kind !== 'stone'
    && item.kind !== 'wing';
}

function myTrader(panel, trade) {
  const me = panel.screen.tradeClient?.identity?.id;
  if (!trade || !me) return trade?.a ?? null;
  return trade.a?.id === me ? trade.a : trade.b;
}

function otherTrader(panel, trade) {
  const me = panel.screen.tradeClient?.identity?.id;
  if (!trade || !me) return trade?.b ?? null;
  return trade.a?.id === me ? trade.b : trade.a;
}

function offerGrid(items, remove = false) {
  if (!items?.length) {
    return `<div class="hint" style="padding:10px 2px">${esc(t('trade.emptyOffer'))}</div>`;
  }
  return `<div class="item-grid">${items.map((item) => itemCellHTML(item, remove
    ? `data-trade-remove="${esc(item.uid)}" title="${esc(itemLabel(item))}"`
    : `title="${esc(itemLabel(item))}"`)).join('')}</div>`;
}

function connectionRow(panel) {
  const client = panel.screen.tradeClient;
  if (!client) return '';
  const online = client.state === 'online';
  const cls = online ? 'online' : client.state === 'error' ? 'error' : '';
  return `<div class="connection-status ${cls}"><span class="dot"></span>${esc(t(online ? 'trade.connected' : client.state === 'connecting' ? 'trade.connecting' : 'trade.offlineTitle'))}</div>`;
}

function offlineBody(panel) {
  const client = panel.screen.tradeClient;
  const connecting = client?.state === 'connecting';
  return `<div class="trade-offline">
      ${icon('server')}
      <h3>${esc(t('trade.offlineTitle'))}</h3>
      <p>${esc(t('trade.offlineText'))}</p>
      <div class="server-row">
        <input id="tradeUrlInput" inputmode="url" spellcheck="false" value="${esc(savedUrl(panel))}" placeholder="ws://localhost:8787" aria-label="${esc(t('trade.serverUrl'))}" />
        <button class="btn primary" data-trade-connect ${connecting ? 'disabled' : ''}>${esc(t(connecting ? 'trade.connecting' : 'trade.connect'))}</button>
      </div>
      ${connectionRow(panel)}
    </div>
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('trade.howItWorks'))}</h3><span>${esc(t('trade.channel'))}</span></div>
      <div class="trade-steps">
        <div class="trade-step"><b>1</b><span>${esc(t('trade.step1'))}</span></div>
        <div class="trade-step"><b>2</b><span>${esc(t('trade.step2'))}</span></div>
        <div class="trade-step"><b>3</b><span>${esc(t('trade.step3'))}</span></div>
      </div>
      <p class="hint" style="margin-top:9px">${esc(t('trade.docs'))}</p>
    </div>`;
}

function onlineBody(panel) {
  const client = panel.screen.tradeClient;
  const myId = client?.identity?.id;
  const players = (panel.tradePlayers ?? client?.players ?? []).filter((p) => p.id !== myId);
  const invite = panel.tradeInvite;
  return `<div class="trade-offline" style="padding:14px 15px">
      ${icon('trade')}
      <h3>${esc(t('trade.subtitle'))}</h3>
      <div class="connection-status online" style="margin-top:4px"><span class="dot"></span>${esc(t('trade.connected'))}</div>
    </div>
    ${invite ? `<div class="daily-card">
      ${icon('trade')}
      <div><h3>${esc(t('trade.incoming', { name: invite.from?.name ?? '?' }))}</h3><p>${esc(t('trade.onlineHint'))}</p></div>
      <button class="btn primary" data-trade-accept="${esc(invite.from?.id ?? '')}">${esc(t('trade.accept'))}</button>
      <button class="btn ghost" data-trade-decline="${esc(invite.from?.id ?? '')}">${esc(t('trade.decline'))}</button>
    </div>` : ''}
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('trade.players'))}</h3><span>${esc(t('trade.onlineCount', { n: players.length }))}</span></div>
      ${players.length ? players.map((p) => `<div class="online-player">
        <span class="op-dot"></span>
        <b>${esc(p.name)}</b>
        <span>${esc(t('common.lv'))} ${p.level} · ${esc(t(`zone.${p.zoneId}`))}</span>
        <button class="btn primary" style="margin-left:auto;min-height:26px;font-size:7.5px;padding:0 9px" data-trade-invite="${esc(p.id)}">${icon('trade')} ${esc(t('trade.invite'))}</button>
      </div>`).join('') : `<div class="hint" style="padding:10px 2px">${esc(t('trade.noPlayers'))}</div>`}
    </div>
    <p class="hint">${esc(t('trade.onlineHint'))}</p>`;
}

function activeBody(panel) {
  const trade = panel.tradeActive;
  const me = myTrader(panel, trade);
  const other = otherTrader(panel, trade);
  const offer = panel.tradeOffer ?? me?.offer ?? [];
  const theirOffer = other?.offer ?? [];
  const ready = Boolean(me?.ready);
  const confirmed = Boolean(me?.confirmed);
  const bothReady = Boolean(trade.a?.ready && trade.b?.ready);
  return `<div class="trade-offline" style="padding:14px 15px">
      ${icon('trade')}
      <h3>${esc(t('trade.channel'))} · ${esc(other?.name ?? '?')}</h3>
      <p>${esc(t('trade.onlineHint'))}</p>
    </div>
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('trade.yourOffer'))}</h3><span>${offer.length} ${esc(t('common.pieces'))}</span></div>
      ${offerGrid(offer, true)}
      <button class="btn ghost wide" style="margin-top:8px" data-trade-add>${icon('plus')} ${esc(t('trade.addItem'))}</button>
    </div>
    <div class="section-block">
      <div class="section-head"><h3>${esc(t('trade.theirOffer'))}</h3><span>${esc(other?.name ?? '')}</span></div>
      ${offerGrid(theirOffer)}
    </div>
    <div class="panel-actions">
      <button class="btn ${ready ? 'primary' : 'ghost'}" data-trade-ready="${ready ? '0' : '1'}">${icon('check')} ${esc(t(ready ? 'trade.ready' : 'trade.ready'))}</button>
      <button class="btn primary" data-trade-confirm ${bothReady && !confirmed ? '' : 'disabled'}>${esc(t(confirmed ? 'trade.waiting' : 'trade.confirm'))}</button>
      <button class="btn ghost danger" data-trade-cancel>${esc(t('trade.cancel'))}</button>
    </div>
    <p class="hint" style="margin-top:9px">${esc(t('trade.step3'))}</p>`;
}

export function tradeView(panel) {
  const client = panel.screen.tradeClient;
  const online = client?.state === 'online';
  const active = panel.tradeActive;
  return {
    title: t('trade.title'),
    subtitle: t('trade.subtitle'),
    body: active && online ? activeBody(panel) : online ? onlineBody(panel) : offlineBody(panel),
    resources: false,
    mount: (overlay) => {
      overlay.querySelector('[data-trade-connect]')?.addEventListener('click', () => {
        const input = overlay.querySelector('#tradeUrlInput');
        const url = (input?.value ?? '').trim();
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') throw new Error('protocol');
        } catch {
          toast(t('trade.failed'), 'bad');
          return;
        }
        panel.screen.settings.tradeUrl = url;
        saveSettings(panel.screen.settings);
        client.connect(url, identity(panel)).catch(() => toast(t('trade.failed'), 'bad'));
        panel.refresh();
      });

      overlay.querySelectorAll('[data-trade-invite]').forEach((btn) => btn.addEventListener('click', () => {
        client.send('trade:request', { targetId: btn.dataset.tradeInvite });
        toast(t('trade.waiting'), 'good');
      }));

      overlay.querySelectorAll('[data-trade-accept]').forEach((btn) => btn.addEventListener('click', () => {
        client.send('trade:accept', { fromId: btn.dataset.tradeAccept });
        panel.tradeInvite = null;
      }));

      overlay.querySelectorAll('[data-trade-decline]').forEach((btn) => btn.addEventListener('click', () => {
        client.send('trade:decline', { fromId: btn.dataset.tradeDecline });
        panel.tradeInvite = null;
        panel.refresh();
      }));

      overlay.querySelector('[data-trade-add]')?.addEventListener('click', () => openPicker(panel));

      overlay.querySelectorAll('[data-trade-remove]').forEach((btn) => btn.addEventListener('click', () => {
        const removeUid = btn.dataset.tradeRemove;
        panel.tradeOffer = (panel.tradeOffer ?? []).filter((item) => item.uid !== removeUid);
        sendOffer(panel);
        panel.refresh();
      }));

      overlay.querySelector('[data-trade-ready]')?.addEventListener('click', (event) => {
        const ready = event.currentTarget.dataset.tradeReady === '1';
        client.send('trade:ready', { tradeId: panel.tradeActive?.id, ready });
      });

      overlay.querySelector('[data-trade-confirm]')?.addEventListener('click', () => {
        client.send('trade:confirm', { tradeId: panel.tradeActive?.id });
        panel.refresh();
      });

      overlay.querySelector('[data-trade-cancel]')?.addEventListener('click', () => {
        client.send('trade:cancel', { tradeId: panel.tradeActive?.id });
      });
    },
  };
}

function sendOffer(panel) {
  const client = panel.screen.tradeClient;
  if (!client || !panel.tradeActive) return;
  client.send('trade:offer', { tradeId: panel.tradeActive.id, items: panel.tradeOffer ?? [] });
}

function openPicker(panel) {
  const p = panel.player;
  const offered = new Set((panel.tradeOffer ?? []).map((item) => item.uid));
  const items = (p.inventory ?? []).filter((item) => isTradeable(item) && !offered.has(item.uid));
  panel.tradePickerOpen = true;
  const wrap = showModal({
    title: t('trade.addItem'),
    className: 'item-modal',
    body: items.length
      ? `<div class="item-grid" id="tradePickGrid">${items.map((item) => itemCellHTML(item, `data-pick-uid="${esc(item.uid)}"`)).join('')}</div>
         <p class="hint" style="margin-top:9px">${esc(t('trade.step3'))}</p>`
      : `<div class="empty-state">${icon('bag')}<h3>${esc(t('trade.emptyOffer'))}</h3><p>${esc(t('trade.addItem'))}</p></div>`,
    foot: `<button class="btn primary wide" data-modal-close>${esc(t('common.close'))}</button>`,
    onClose: () => {
      panel.tradePickerOpen = false;
      if (panel.isOpen('trade')) panel.refresh();
    },
  });
  if (!wrap) { panel.tradePickerOpen = false; return; }
  wrap.querySelectorAll('[data-pick-uid]').forEach((btn) => btn.addEventListener('click', () => {
    const item = p.inventory.find((x) => x.uid === btn.dataset.pickUid);
    if (!item) return;
    panel.tradeOffer = panel.tradeOffer ?? [];
    const exists = panel.tradeOffer.some((x) => x.uid === item.uid);
    if (exists) {
      panel.tradeOffer = panel.tradeOffer.filter((x) => x.uid !== item.uid);
      btn.classList.remove('selected');
    } else {
      if (panel.tradeOffer.length >= PICKER_LIMIT) { toast(t('common.limitReached', { n: PICKER_LIMIT }), 'bad'); return; }
      panel.tradeOffer.push(item);
      btn.classList.add('selected');
    }
    sendOffer(panel);
  }));
}

function applyCompletion(panel, msg) {
  const client = panel.screen.tradeClient;
  const me = client?.identity?.id;
  const mine = msg.a?.id === me ? msg.a : msg.b;
  const theirs = msg.a?.id === me ? msg.b : msg.a;
  const p = panel.player;
  for (const item of mine?.items ?? []) removeItem(p, item, item.qty ?? 1);
  let stored = 0;
  for (const raw of theirs?.items ?? []) {
    const item = { ...raw };
    if (!item.uid || p.inventory.some((x) => x.uid === item.uid) || p.storage.some((x) => x.uid === item.uid)) {
      item.uid = uid(item.kind === 'equip' ? 'eq' : 'it');
    }
    if (!addItem(p, item)) {
      p.storage.push(item);
      stored++;
    }
  }
  panel.tradeActive = null;
  panel.tradeOffer = [];
  panel.tradeInvite = null;
  saveNow(true);
  panel.screen.hud?.refresh();
  toast(t('trade.completed'), 'good');
  if (stored) toast(t('common.storageFull'), 'bad');
  panel.screen.audio?.play('gem');
  if (panel.isOpen('trade')) panel.refresh();
}

export function attachTrade(panel) {
  const client = panel.screen.tradeClient;
  if (!client || panel._tradeOffs) return;
  panel._tradeOffs = [];
  const refresh = () => {
    if (panel.isOpen('trade') && !panel.tradePickerOpen) panel.refresh();
  };
  panel._tradeOffs.push(
    client.on('state', ({ state }) => {
      panel.tradeStatus = state;
      if (state !== 'online' && state !== 'connecting') {
        panel.tradeActive = null;
        panel.tradeOffer = [];
        panel.tradePlayers = [];
      }
      refresh();
    }),
    client.on('welcome', (msg) => {
      panel.tradeSelf = msg.you ?? null;
      refresh();
    }),
    client.on('presence', (msg) => {
      panel.tradePlayers = msg.players ?? [];
      refresh();
    }),
    client.on('trade:requested', (msg) => {
      toast(t('trade.invited', { name: msg.target?.name ?? '?' }), 'good');
    }),
    client.on('trade:invite', (msg) => {
      panel.tradeInvite = msg;
      toast(t('trade.incoming', { name: msg.from?.name ?? '?' }), 'good');
      refresh();
    }),
    client.on('trade:state', (msg) => {
      panel.tradeActive = msg.trade ?? null;
      const me = myTrader(panel, msg.trade);
      if (me?.offer) panel.tradeOffer = me.offer;
      panel.tradeInvite = null;
      refresh();
    }),
    client.on('trade:complete', (msg) => applyCompletion(panel, msg)),
    client.on('trade:cancel', () => {
      panel.tradeActive = null;
      panel.tradeOffer = [];
      toast(t('trade.cancelled'), 'bad');
      refresh();
    }),
    client.on('error', (msg) => {
      if (msg?.message) toast(String(msg.message), 'bad');
    }),
  );
}

export function detachTrade(panel) {
  for (const off of panel._tradeOffs ?? []) {
    try { off(); } catch {}
  }
  panel._tradeOffs = null;
  panel.tradeActive = null;
  panel.tradeOffer = [];
  panel.tradeInvite = null;
  panel.tradePlayers = [];
  panel.tradePickerOpen = false;
}
