// Minimal real transport seam for AETHERIA multiplayer.
// This client never simulates other players: everything shown in the trade
// panel comes from a WebSocket server. The bundled server in /server is a
// development reference implementation of that protocol.

export class TradeClient {
  constructor() {
    this.ws = null;
    this.url = null;
    this.state = 'offline';
    this.identity = null;
    this.players = [];
    this.handlers = new Map();
    this.queued = [];
  }

  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(fn);
    return () => this.handlers.get(event)?.delete(fn);
  }

  emit(event, payload) {
    for (const fn of this.handlers.get(event) ?? []) {
      try { fn(payload); } catch (error) { console.warn('TradeClient handler failed', error); }
    }
  }

  connect(url, identity) {
    this.disconnect();
    this.url = url;
    this.identity = identity;
    this.state = 'connecting';
    this.emit('state', { state: 'connecting', url });
    return new Promise((resolve, reject) => {
      let ws;
      try { ws = new WebSocket(url); } catch (error) {
        this.state = 'offline';
        this.emit('state', { state: 'offline', error: String(error?.message ?? error) });
        reject(error);
        return;
      }
      this.ws = ws;
      const timeout = setTimeout(() => {
        if (this.state !== 'connecting') return;
        try { ws.close(); } catch {}
        this.state = 'offline';
        this.emit('state', { state: 'offline', error: 'Connection timed out.' });
        reject(new Error('Connection timed out.'));
      }, 7000);

      ws.addEventListener('open', () => {
        clearTimeout(timeout);
        this.state = 'online';
        this.emit('state', { state: 'online', url });
        this.send('hello', identity);
        for (const message of this.queued.splice(0)) this.send(message.type, message.payload);
        resolve(true);
      });
      ws.addEventListener('message', (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (!msg || typeof msg.type !== 'string') return;
        if (msg.type === 'presence') this.players = msg.players ?? [];
        if (msg.type === 'welcome') this.identity = { ...this.identity, ...msg.you };
        this.emit(msg.type, msg);
        this.emit('message', msg);
      });
      ws.addEventListener('close', () => {
        clearTimeout(timeout);
        this.state = 'offline';
        this.ws = null;
        this.players = [];
        this.emit('state', { state: 'offline', url });
      });
      ws.addEventListener('error', () => {
        // The close handler is the single source of truth; surface a readable
        // error without rejecting twice.
        this.emit('state', { state: 'error', url, error: 'Server unreachable.' });
      });
    });
  }

  disconnect() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
    this.ws = null;
    this.state = 'offline';
    this.players = [];
  }

  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.queued.push({ type, payload });
      return false;
    }
    this.ws.send(JSON.stringify({ type, ...payload }));
    return true;
  }

  updateIdentity(identity) {
    this.identity = identity;
    if (this.state === 'online') this.send('hello', identity);
  }
}
