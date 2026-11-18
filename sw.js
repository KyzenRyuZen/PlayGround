// AETHERIA service worker: installable shell + offline play.
const VERSION = 'aetheria-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/styles/base.css',
  './src/styles/ui.css',
  './src/styles/screens.css',
  './src/main.js',
  './src/core/audio.js',
  './src/core/game.js',
  './src/core/i18n.js',
  './src/core/save.js',
  './src/core/utils.js',
  './src/data/classes.js',
  './src/data/items.js',
  './src/data/npcs.js',
  './src/data/quests.js',
  './src/data/shop.js',
  './src/data/zones.js',
  './src/game/engine.js',
  './src/game/sprites.js',
  './src/game/worldArt.js',
  './src/game/worldgen.js',
  './src/net/tradeClient.js',
  './src/ui/common.js',
  './src/ui/create.js',
  './src/ui/heroArt.js',
  './src/ui/icons.js',
  './src/ui/menu.js',
  './src/ui/panelKit.js',
  './src/ui/panels.js',
  './src/ui/panels/character.js',
  './src/ui/panels/forge.js',
  './src/ui/panels/quests.js',
  './src/ui/panels/shop.js',
  './src/ui/panels/trade.js',
  './src/ui/world.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/__omgithub/')) return;

  // Network-first keeps deployments fresh; the cache keeps the game playable offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const shell = await caches.match('./index.html', { ignoreSearch: true });
          if (shell) return shell;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }),
  );
});
