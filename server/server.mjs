// AETHERIA trade server — dependency-free WebSocket reference implementation.
//
// This is a real server: the client in src/net/tradeClient.js never invents
// players or trades. Run it with `npm run server` (default port 8787), point
// the in-game trade panel at ws://<host>:8787 and trade between two browsers.
//
// The authoritative rules live here:
//   • presence and identities are assigned by the server,
//   • trade invitations expire,
//   • offers are capped and sanitised,
//   • both sides must be ready before confirming,
//   • completion is broadcast only once, so no duplication is possible.
//
// Persistence: trades and presence are in memory. For production put this
// behind TLS (wss://) and persist identity/token validation in a database.

import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '0.0.0.0';
const INVITE_TTL_MS = 60_000;
const MAX_OFFER_ITEMS = 12;
const MAX_MESSAGE_BYTES = 64 * 1024;

/** @type {Map<string, Client>} */
const clients = new Map();
/** @type {Map<string, Invite>} */
const invites = new Map();
/** @type {Map<string, Trade>} */
const trades = new Map();

// ── WebSocket framing ──────────────────────────────────────────────────────
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function acceptKey(key) {
  return createHash('sha1').update(key + GUID).digest('base64');
}

function encodeFrame(opcode, payload = Buffer.alloc(0)) {
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.from([0x80 | opcode, length]);
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  return Buffer.concat([header, payload]);
}

function sendRaw(client, opcode, payload) {
  if (client.closed || client.ws.destroyed) return;
  try {
    client.ws.write(encodeFrame(opcode, payload));
  } catch {
    client.closed = true;
  }
}

function send(client, message) {
  sendRaw(client, 0x1, Buffer.from(JSON.stringify(message)));
}

function broadcast(message, exceptId = null) {
  for (const client of clients.values()) {
    if (client.id === exceptId) continue;
    send(client, message);
  }
}

function publicPlayer(client) {
  return {
    id: client.id,
    name: client.identity.name,
    classId: client.identity.classId,
    level: client.identity.level,
    zoneId: client.identity.zoneId,
  };
}

function presence() {
  broadcast({ type: 'presence', players: [...clients.values()].map(publicPlayer) });
}

// ── Inbound frame parser (handles fragmentation, ping and close) ───────────
function attachSocket(socket) {
  let buffer = Buffer.alloc(0);
  const client = {
    id: null,
    ws: socket,
    identity: { name: 'Wanderer', classId: 'warrior', level: 1, zoneId: 'greendale' },
    tradeId: null,
    closed: false,
    fragments: [],
    fragmentOpcode: 0,
  };

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 2) {
      const first = buffer[0];
      const second = buffer[1];
      const fin = (first & 0x80) !== 0;
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (buffer.length < 4) return;
        length = buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (buffer.length < 10) return;
        const big = buffer.readBigUInt64BE(2);
        if (big > BigInt(MAX_MESSAGE_BYTES)) { closeSocket(client, 1009, 'too large'); return; }
        length = Number(big);
        offset = 10;
      }
      if (length > MAX_MESSAGE_BYTES) { closeSocket(client, 1009, 'too large'); return; }
      if (!masked) { closeSocket(client, 1002, 'unmasked frame'); return; }
      if (buffer.length < offset + 4 + length) return;
      const mask = buffer.subarray(offset, offset + 4);
      offset += 4;
      const payload = Buffer.alloc(length);
      for (let i = 0; i < length; i++) payload[i] = buffer[offset + i] ^ mask[i & 3];
      buffer = buffer.subarray(offset + length);

      if (opcode === 0x8) { // close
        closeSocket(client, 1000, '');
        return;
      }
      if (opcode === 0x9) { // ping
        sendRaw(client, 0xa, payload);
        continue;
      }
      if (opcode === 0xa) continue; // pong
      if (opcode === 0x0) {
        client.fragments.push(payload);
        if (!fin) continue;
        const full = Buffer.concat(client.fragments);
        client.fragments = [];
        const op = client.fragmentOpcode;
        client.fragmentOpcode = 0;
        if (op === 0x1) handleMessage(client, full.toString('utf8'));
        continue;
      }
      if (opcode === 0x1 || opcode === 0x2) {
        if (!fin) {
          client.fragmentOpcode = opcode;
          client.fragments = [payload];
          continue;
        }
        if (opcode === 0x1) handleMessage(client, payload.toString('utf8'));
      }
    }
  });

  socket.on('error', () => closeSocket(client, 1011, ''));
  socket.on('close', () => closeSocket(client, 1000, ''));
}

function closeSocket(client, code, reason) {
  if (client.closed) return;
  client.closed = true;
  if (client.id) {
    cancelTradeOf(client, 'Disconnected.');
    for (const [key, invite] of invites) {
      if (invite.fromId === client.id || invite.toId === client.id) invites.delete(key);
    }
    clients.delete(client.id);
    presence();
  }
  try {
    const payload = Buffer.alloc(2 + Buffer.byteLength(reason));
    payload.writeUInt16BE(code, 0);
    payload.write(reason, 2);
    sendRaw(client, 0x8, payload);
    client.ws.end();
  } catch {}
}

// ── Protocol ───────────────────────────────────────────────────────────────
function identify(client, identity = {}) {
  const name = String(identity.name ?? 'Wanderer').trim().slice(0, 24) || 'Wanderer';
  const classId = ['warrior', 'mage', 'assassin'].includes(identity.classId) ? identity.classId : 'warrior';
  const level = Math.max(1, Math.min(999, Number(identity.level) || 1));
  const zoneId = String(identity.zoneId ?? 'greendale').slice(0, 32);
  const token = String(identity.token ?? '').slice(0, 128);
  const id = token ? `p_${createHash('sha256').update(token).digest('hex').slice(0, 12)}` : `p_${randomUUID().slice(0, 12)}`;

  if (client.id && client.id !== id) {
    // A reconnect with a new token releases the previous identity.
    clients.delete(client.id);
    client.id = null;
  }

  const taken = clients.get(id);
  if (taken && taken !== client) {
    const fallback = `p_${randomUUID().slice(0, 12)}`;
    client.identity = { name, classId, level, zoneId };
    return { id: fallback, name, classId, level, zoneId };
  }
  client.identity = { name, classId, level, zoneId };
  return { id, name, classId, level, zoneId };
}

function safeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = String(raw.kind ?? 'equip');
  if (kind === 'stone' || kind === 'wing') return null;
  if (raw.tradeable === false) return null;
  const copy = JSON.parse(JSON.stringify(raw));
  if (typeof copy.uid !== 'string' || copy.uid.length > 80) return null;
  // Keep payload sane; items are cosmetic data, never executable.
  if (JSON.stringify(copy).length > 4096) return null;
  return copy;
}

function tradeView(trade) {
  return {
    id: trade.id,
    a: { id: trade.a.id, name: trade.a.name, offer: trade.a.offer, ready: trade.a.ready, confirmed: trade.a.confirmed },
    b: { id: trade.b.id, name: trade.b.name, offer: trade.b.offer, ready: trade.b.ready, confirmed: trade.b.confirmed },
  };
}

function tradeState(trade) {
  const view = tradeView(trade);
  for (const side of ['a', 'b']) {
    const partner = clients.get(trade[side].id);
    if (partner) send(partner, { type: 'trade:state', trade: view });
  }
}

function makeTrader(client) {
  return { id: client.id, name: client.identity.name, offer: [], ready: false, confirmed: false };
}

function beginTrade(a, b) {
  const existing = trades.get(a.tradeId) ?? trades.get(b.tradeId);
  if (existing) cancelTrade(existing, 'Already trading.');

  const trade = { id: `t_${randomUUID().slice(0, 10)}`, a: makeTrader(a), b: makeTrader(b) };
  trades.set(trade.id, trade);
  a.tradeId = trade.id;
  b.tradeId = trade.id;
  tradeState(trade);
}

function cancelTrade(trade, reason = 'Trade cancelled.') {
  if (!trade || !trades.has(trade.id)) return;
  trades.delete(trade.id);
  for (const side of ['a', 'b']) {
    const client = clients.get(trade[side].id);
    if (!client) continue;
    client.tradeId = null;
    send(client, { type: 'trade:cancel', tradeId: trade.id, reason });
  }
}

function cancelTradeOf(client) {
  if (!client.tradeId) return;
  cancelTrade(trades.get(client.tradeId));
}

function handleMessage(client, text) {
  let msg;
  try { msg = JSON.parse(text); } catch { return; }
  if (!msg || typeof msg.type !== 'string') return;

  if (msg.type === 'hello') {
    const identity = identify(client, msg);
    client.id = identity.id;
    clients.set(client.id, client);
    send(client, { type: 'welcome', you: publicPlayer(client) });
    presence();
    return;
  }

  if (!client.id) {
    send(client, { type: 'error', message: 'Say hello before trading.' });
    return;
  }

  switch (msg.type) {
    case 'trade:request': {
      const target = clients.get(String(msg.targetId ?? ''));
      if (!target) { send(client, { type: 'error', message: 'That player is offline.' }); return; }
      if (target.id === client.id) { send(client, { type: 'error', message: 'You cannot trade with yourself.' }); return; }
      if (target.tradeId) { send(client, { type: 'error', message: 'That player is already trading.' }); return; }
      if (client.tradeId) { send(client, { type: 'error', message: 'You are already trading.' }); return; }

      const key = `${client.id}->${target.id}`;
      invites.set(key, { fromId: client.id, toId: target.id, at: Date.now() });
      send(client, { type: 'trade:requested', target: publicPlayer(target) });
      send(target, { type: 'trade:invite', from: publicPlayer(client) });
      return;
    }
    case 'trade:accept': {
      const fromId = String(msg.fromId ?? '');
      const key = `${fromId}->${client.id}`;
      const invite = invites.get(key);
      if (!invite || Date.now() - invite.at > INVITE_TTL_MS) {
        invites.delete(key);
        send(client, { type: 'error', message: 'Invitation expired.' });
        return;
      }
      invites.delete(key);
      const from = clients.get(fromId);
      if (!from) { send(client, { type: 'error', message: 'That player went offline.' }); return; }
      beginTrade(from, client);
      return;
    }
    case 'trade:decline': {
      const fromId = String(msg.fromId ?? '');
      const key = `${fromId}->${client.id}`;
      if (invites.delete(key)) {
        const from = clients.get(fromId);
        if (from) send(from, { type: 'error', message: 'Trade declined.' });
      }
      return;
    }
    case 'trade:offer': {
      const trade = trades.get(client.tradeId ?? '');
      if (!trade) { send(client, { type: 'error', message: 'No active trade.' }); return; }
      const side = trade.a.id === client.id ? 'a' : trade.b.id === client.id ? 'b' : null;
      if (!side) { send(client, { type: 'error', message: 'Not part of this trade.' }); return; }
      if (trade[side].confirmed) { send(client, { type: 'error', message: 'Trade already confirmed.' }); return; }
      const items = Array.isArray(msg.items) ? msg.items : [];
      if (items.length > MAX_OFFER_ITEMS) { send(client, { type: 'error', message: `At most ${MAX_OFFER_ITEMS} items.` }); return; }
      const seen = new Set();
      const cleaned = [];
      for (const raw of items) {
        const item = safeItem(raw);
        if (!item || seen.has(item.uid)) continue;
        seen.add(item.uid);
        cleaned.push(item);
      }
      trade[side].offer = cleaned;
      trade[side].ready = false;
      trade[side].confirmed = false;
      tradeState(trade);
      return;
    }
    case 'trade:ready': {
      const trade = trades.get(client.tradeId ?? '');
      if (!trade) return;
      const side = trade.a.id === client.id ? 'a' : trade.b.id === client.id ? 'b' : null;
      if (!side) return;
      trade[side].ready = Boolean(msg.ready);
      trade[side].confirmed = false;
      tradeState(trade);
      return;
    }
    case 'trade:confirm': {
      const trade = trades.get(client.tradeId ?? '');
      if (!trade) { send(client, { type: 'error', message: 'No active trade.' }); return; }
      const side = trade.a.id === client.id ? 'a' : trade.b.id === client.id ? 'b' : null;
      if (!side) return;
      if (!trade.a.ready || !trade.b.ready) {
        send(client, { type: 'error', message: 'Both players must be ready.' });
        return;
      }
      trade[side].confirmed = true;
      if (trade.a.confirmed && trade.b.confirmed) {
        const complete = tradeView(trade);
        trades.delete(trade.id);
        for (const id of [trade.a.id, trade.b.id]) {
          const player = clients.get(id);
          if (!player) continue;
          player.tradeId = null;
          send(player, { type: 'trade:complete', trade: complete });
        }
      } else {
        tradeState(trade);
      }
      return;
    }
    case 'trade:cancel': {
      cancelTradeOf(client);
      return;
    }
    case 'ping': {
      send(client, { type: 'pong', at: Date.now() });
      return;
    }
    default:
      send(client, { type: 'error', message: `Unknown message: ${msg.type}` });
  }
}

// Expire unanswered invites.
setInterval(() => {
  const now = Date.now();
  for (const [key, invite] of invites) {
    if (now - invite.at > INVITE_TTL_MS) invites.delete(key);
  }
  // Keep proxies from closing idle sockets.
  for (const client of clients.values()) {
    if (!client.closed) sendRaw(client, 0x9, Buffer.from('ka'));
  }
}, 25_000).unref();

// ── HTTP + upgrade ─────────────────────────────────────────────────────────
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      players: clients.size,
      trades: trades.size,
      invites: invites.size,
      uptime: Math.round(process.uptime()),
    }));
    return;
  }
  if (req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('AETHERIA trade server. Connect with a WebSocket client.\n');
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found.\n');
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (String(req.headers.upgrade ?? '').toLowerCase() !== 'websocket' || !key) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }
  const origin = req.headers.origin;
  if (process.env.ALLOWED_ORIGINS && origin) {
    const allowed = process.env.ALLOWED_ORIGINS.split(',').map((x) => x.trim());
    if (!allowed.includes(origin) && !allowed.includes('*')) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
  }
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey(key)}`,
    '', '',
  ].join('\r\n'));
  socket.setNoDelay(true);
  attachSocket(socket);
});

server.listen(PORT, HOST, () => {
  console.log(`AETHERIA trade server listening on ws://${HOST}:${PORT}`);
  console.log(`Health: http://${HOST}:${PORT}/health`);
});

function shutdown() {
  for (const client of clients.values()) closeSocket(client, 1001, 'Server shutting down.');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
