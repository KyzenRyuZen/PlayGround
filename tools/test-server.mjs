// End-to-end protocol test for server/server.mjs. Usage: npm run test:server
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.TEST_PORT ?? 8799);
const server = spawn(process.execPath, [join(root, 'server/server.mjs')], {
  env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.on('data', (d) => process.stdout.write('[server] ' + d));
server.stderr.on('data', (d) => process.stdout.write('[server:err] ' + d));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = (fn, label, timeout = 5000) => new Promise((resolveFn, reject) => {
  const started = Date.now();
  const tick = () => {
    const value = fn();
    if (value) return resolveFn(value);
    if (Date.now() - started > timeout) return reject(new Error('timeout: ' + label));
    setTimeout(tick, 20);
  };
  tick();
});
const open = (c) => new Promise((resolveFn) => c.ws.addEventListener('open', resolveFn, { once: true }));

function makeClient(name, token) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`);
  const messages = [];
  const errors = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    messages.push(msg);
    if (msg.type === 'error') errors.push(msg.message);
  });
  const send = (type, payload = {}) => ws.send(JSON.stringify({ type, ...payload }));
  const last = (type) => [...messages].reverse().find((m) => m.type === type);
  return { name, token, ws, messages, errors, send, last };
}

try {
  await sleep(400);
  const a = makeClient('Alpha', 'token-alpha');
  const b = makeClient('Beta', 'token-beta');
  await Promise.all([open(a), open(b)]);
  a.send('hello', { name: 'Alpha', classId: 'mage', level: 7, zoneId: 'ironcrag', token: 'token-alpha' });
  b.send('hello', { name: 'Beta', classId: 'warrior', level: 9, zoneId: 'greendale', token: 'token-beta' });

  const welcomeA = await waitFor(() => a.last('welcome'), 'welcome A');
  const welcomeB = await waitFor(() => b.last('welcome'), 'welcome B');
  if (welcomeA.you.name !== 'Alpha') throw new Error('name mismatch');

  const presence = await waitFor(() => {
    const p = a.last('presence');
    return p && p.players.length === 2 ? p : null;
  }, 'presence 2');
  console.log('presence:', presence.players.map((p) => `${p.name}/${p.level}/${p.zoneId}`).join(', '));

  a.send('trade:request', { targetId: welcomeB.you.id });
  const invite = await waitFor(() => b.last('trade:invite'), 'invite');
  if (invite.from.name !== 'Alpha') throw new Error('wrong inviter');

  b.send('trade:accept', { fromId: welcomeA.you.id });
  const stateA = await waitFor(() => a.last('trade:state'), 'state A');
  const tradeId = stateA.trade.id;
  await waitFor(() => b.last('trade:state'), 'state B');

  const itemA = { uid: 'eq_a1', kind: 'equip', name: 'Blade', rarity: 'epic', tradeable: true };
  const itemB = { uid: 'eq_b1', kind: 'equip', name: 'Shield', rarity: 'rare', tradeable: true };
  const wing = { uid: 'wing_bad', kind: 'wing', name: 'Forbidden', tradeable: false };
  a.send('trade:offer', { tradeId, items: [itemA, wing] });
  b.send('trade:offer', { tradeId, items: [itemB] });

  const synced = await waitFor(() => {
    const s = a.last('trade:state');
    return s?.trade.a.offer.length === 1 && s.trade.b.offer.length === 1 ? s : null;
  }, 'offers synced');
  if (synced.trade.a.offer[0].uid !== 'eq_a1') throw new Error('offer mismatch');
  console.log('offers synced; untradeable wing rejected:', synced.trade.a.offer.length === 1);

  a.send('trade:ready', { tradeId, ready: true });
  b.send('trade:ready', { tradeId, ready: true });
  await waitFor(() => a.last('trade:state')?.trade.a.ready && a.last('trade:state')?.trade.b.ready, 'both ready');

  a.send('trade:confirm', { tradeId });
  b.send('trade:confirm', { tradeId });
  const completeA = await waitFor(() => a.last('trade:complete'), 'complete A');
  const completeB = await waitFor(() => b.last('trade:complete'), 'complete B');
  if (completeA.trade.a.offer[0].uid !== 'eq_a1' || completeB.trade.b.offer[0].uid !== 'eq_b1') {
    throw new Error('completion payload mismatch');
  }
  console.log('trade completed for both players');

  a.send('trade:confirm', { tradeId });
  const guard = await waitFor(() => a.errors[0], 'post-complete guard');
  console.log('guard after completion:', guard);

  a.ws.close();
  const one = await waitFor(() => {
    const p = b.last('presence');
    return p && p.players.length === 1 ? p : null;
  }, 'presence 1');
  console.log('presence after disconnect:', one.players.length);

  console.log('\nALL SERVER CHECKS PASSED');
} catch (error) {
  console.error('SERVER TEST FAILED:', error.message);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
  await sleep(200);
}
